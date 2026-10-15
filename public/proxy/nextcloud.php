<?php
/**
 * Proxy WebDAV pour la synchronisation de l'historique des paniers
 * MathsMentales, vers un partage Nextcloud/ownCloud protégé par mot de
 * passe (apps.education.fr et compatibles) ou un compte WebDAV quelconque
 * (kDrive, Synology, Infomaniak…).
 *
 * Deux modes, distingués par le champ JSON "mode" :
 * - "share" (défaut) : relaie vers
 *   https://<instance>/public.php/webdav/<chemin> d'un partage public
 *   Nextcloud, avec l'authentification Basic (jeton de partage en nom
 *   d'utilisateur, mot de passe du partage — vide si le partage n'en a
 *   pas) reconstruite ici.
 * - "account" : relaie vers <baseUrl>/<chemin>, une racine WebDAV
 *   entièrement fournie par le client, avec l'authentification Basic de
 *   l'identifiant/mot de passe (d'application) du compte. Plus dangereux
 *   que le mode partage puisque l'URL amont vient entièrement du client :
 *   voir buildAccountUrl() pour les contrôles appliqués avant toute
 *   concaténation.
 *
 * Aucun log du contenu, des jetons/identifiants ou des mots de passe,
 * aucune donnée stockée : passage strict.
 *
 * API : POST avec corps JSON.
 * Mode partage (mode absent ou "share") : { "method": "PROPFIND"|"GET"|
 * "PUT"|"DELETE"|"MKCOL", "instance": "...", "token": "...",
 * "password": "...", "path": "...", "content": "..." (PUT uniquement) }.
 * Mode compte ("mode": "account") : { "method": …, "mode": "account",
 * "baseUrl": "...", "username": "...", "password": "...", "path": "...",
 * "content": "..." (PUT uniquement) }.
 * Le POST (plutôt que des paramètres en query string ou des en-têtes HTTP
 * dédiés) garde les identifiants ET le mot de passe hors des logs d'accès
 * du serveur (qui ne journalisent que la méthode/l'URL, jamais le corps).
 *
 * Anti-abus : toute requête doit porter l'en-tête X-Requested-With (valeur
 * libre). Un site tiers ne peut pas ajouter cet en-tête sans déclencher un
 * prévol CORS, que le contrôle d'origine ci-dessous refuse ; les
 * déclenchements « aveugles » sans en-tête (balises img, formulaires,
 * no-cors) sont donc bloqués, tandis que le front same-origin/autorisé
 * l'ajoute librement dans son fetch.
 *
 * Requiert `allow_url_fopen` (activé par défaut sur la plupart des
 * hébergements mutualisés) — n'utilise volontairement pas l'extension
 * cURL.
 */

// Liste blanche des instances autorisées, pour ne pas devenir un proxy
// ouvert : le socle Apps Éducation, complété le cas échéant par les hôtes
// exacts de webdavhosts.php (cf. isAllowedHost ci-dessous). Ce proxy est
// seul juge : la validation côté client n'est qu'un confort d'UX (message
// immédiat).
const ALLOWED_INSTANCE_PATTERN = '/^([a-z0-9-]+\.)*apps\.education\.fr$/i';

/**
 * Hôtes autorisés : le motif Apps Éducation en socle, plus les hôtes exacts
 * listés dans webdavhosts.php s'il existe. Fichier absent = comportement
 * strictement identique à l'existant. Un contenu de configuration invalide
 * (pas un tableau) ne laisse passer aucun hôte additionnel : on retombe
 * silencieusement sur le seul socle Apps Éducation.
 */
function isAllowedHost(string $host): bool
{
    if (preg_match(ALLOWED_INSTANCE_PATTERN, $host) === 1) {
        return true;
    }
    $configPath = __DIR__ . '/webdavhosts.php';
    if (!is_file($configPath)) {
        return false;
    }
    $hosts = require $configPath;
    if (!is_array($hosts)) {
        return false;
    }
    // Ne suffit pas de vérifier que $hosts est un tableau : PHP coerce
    // silencieusement les valeurs non-chaînes passées à strtolower() (true
    // devient "1", 123 devient "123", null devient "") au lieu de lever une
    // erreur. Sans ce filtre, une instance nommée "1" ou "123" franchirait
    // la liste blanche sans qu'aucun hôte de ce nom n'y ait jamais été
    // inscrit.
    $hosts = array_filter($hosts, 'is_string');
    return in_array(strtolower($host), array_map('strtolower', $hosts), true);
}

/**
 * Vrai si la chaîne, brute OU décodée en %XX, contient un octet de contrôle
 * (0x00-0x1F ou 0x7F — \r, \n, \0 compris). Un octet de contrôle littéral
 * est déjà détectable sur la forme brute ; un octet percent-encodé (%0d,
 * %00…) ne redevient un vrai octet de contrôle qu'après décodage — les deux
 * formes doivent être couvertes.
 */
function containsControlCharacter(string $value): bool
{
    foreach ([$value, rawurldecode($value)] as $candidate) {
        if (preg_match('/[\x00-\x1f\x7f]/', $candidate) === 1) {
            return true;
        }
    }
    return false;
}

/**
 * Mode compte : l'URL amont est la racine WebDAV fournie par l'utilisateur,
 * suivie du chemin demandé, avec l'authentification Basic de son compte.
 *
 * Contrôles indispensables AVANT toute concaténation : aucun caractère de
 * contrôle dans baseUrl, schéma https, port 443, hôte en liste blanche.
 * Le chemin est ensuite vérifié segment par segment (sur "/" uniquement) :
 * - aucun caractère de contrôle, brut ou percent-encodé ;
 * - aucun "\" littéral ou percent-encodé (%5c) : certains WebDAV cibles
 *   (Synology, kDrive…) traitent "\" comme un séparateur, contrairement à
 *   Nextcloud — tout "\" est purement et simplement refusé plutôt que
 *   deviné ;
 * - aucun segment ne vaut ".." — y compris percent-encodé.
 * Chaque segment restant est réencodé individuellement avant d'être inséré
 * dans l'URL.
 */
function buildAccountUrl(string $baseUrl, string $path): string
{
    if (containsControlCharacter($baseUrl)) {
        fail(400, 'control-character-not-allowed', 'Caractère de contrôle non autorisé.');
    }
    $parts = parse_url($baseUrl);
    if ($parts === false || ($parts['scheme'] ?? '') !== 'https' || !isset($parts['host']) || $parts['host'] === '') {
        fail(400, 'invalid-base-url', 'Adresse WebDAV invalide.');
    }
    if (isset($parts['port']) && $parts['port'] !== 443) {
        fail(403, 'port-not-allowed', 'Seul le port 443 est autorisé.');
    }
    if (!isAllowedHost($parts['host'])) {
        fail(403, 'instance-not-allowed', "Cet hébergeur n'est pas autorisé par ce proxy.");
    }
    $segments = array_filter(explode('/', $path), static fn ($s) => $s !== '' && $s !== '.');
    foreach ($segments as $segment) {
        if (containsControlCharacter($segment)) {
            fail(400, 'control-character-not-allowed', 'Caractère de contrôle non autorisé.');
        }
        $decoded = rawurldecode($segment);
        if (strpos($decoded, '\\') !== false) {
            fail(400, 'invalid-path', 'Chemin de fichier invalide.');
        }
        if ($decoded === '..') {
            fail(400, 'invalid-path', 'Chemin de fichier invalide.');
        }
    }
    $encodedPath = implode('/', array_map('rawurlencode', $segments));
    return rtrim($baseUrl, '/') . '/' . $encodedPath;
}

// Origines autorisées en contexte cross-origin. Ce fichier est déployé tel
// quel en production : n'y ajouter que des origines de production.
// L'absence d'en-tête Origin (same-origin) est un cas légitime et n'est
// jamais refusée ci-dessous ; le contrôle d'origine ne s'applique qu'aux
// requêtes qui présentent un Origin, c'est-à-dire aux contextes réellement
// cross-origin.
// mathsmentales.forge.apps.education.fr : GitLab Pages de ce dépôt —
// appelle le proxy en cross-origin puisque aucun PHP n'y est disponible
// (cf. historiqueNuage.js, PROXY_URL en adresse absolue vers
// www.mathsmentales.net).
const ALLOWED_ORIGINS = [
    'https://www.mathsmentales.net',
    'https://mathsmentales.net',
    'https://mathsmentales.forge.apps.education.fr',
];

const ALLOWED_METHODS = ['PROPFIND', 'GET', 'PUT', 'DELETE', 'MKCOL'];
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2 Mo
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 Mo — largement au-dessus d'un historique.json réaliste
const UPSTREAM_TIMEOUT_SECONDS = 10;

function sendCorsHeaders(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($origin, ALLOWED_ORIGINS, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    }
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
    header('Access-Control-Max-Age: 600');
    // Le corps relayé peut être n'importe quel contenu choisi par le
    // propriétaire du partage (potentiellement hostile) : ce proxy ne sert
    // jamais le Content-Type amont tel quel (voir plus bas), et ajoute
    // nosniff par défense en profondeur.
    header('X-Content-Type-Options: nosniff');
}

function fail(int $status, string $code, string $message): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    // "source":"proxy" distingue sans ambiguïté un refus du proxy d'une
    // erreur relayée de l'instance WebDAV.
    echo json_encode(['source' => 'proxy', 'code' => $code, 'error' => $message]);
    exit;
}

sendCorsHeaders();

$requestMethod = $_SERVER['REQUEST_METHOD'] ?? '';

// Prévol CORS : répondre avant tout autre contrôle.
if ($requestMethod === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Contrôle d'origine : uniquement lorsque l'en-tête est présent (contexte
// cross-origin). Son absence = same-origin ou client hors navigateur ;
// dans les deux cas c'est l'exigence X-Requested-With ci-dessous qui
// bloque les déclenchements involontaires.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && !in_array($origin, ALLOWED_ORIGINS, true)) {
    fail(403, 'origin_not_allowed', 'Origine non autorisée.');
}

if (($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === '') {
    fail(403, 'missing_marker_header', 'En-tête X-Requested-With requis.');
}

if ($requestMethod !== 'POST') {
    fail(405, 'http_method_not_allowed', 'Méthode non autorisée (POST attendu).');
}

$rawBody = file_get_contents('php://input');
$params = json_decode((string) $rawBody, true);
if (!is_array($params)) {
    fail(400, 'invalid_json', 'Corps JSON invalide.');
}

$davMethod = strtoupper((string) ($params['method'] ?? ''));
$mode = (string) ($params['mode'] ?? 'share');
$path = (string) ($params['path'] ?? '');
$content = (string) ($params['content'] ?? '');

if (!in_array($davMethod, ALLOWED_METHODS, true)) {
    fail(400, 'dav_method_not_allowed', 'Méthode WebDAV non autorisée.');
}

if ($davMethod === 'PUT' && strlen($content) > MAX_UPLOAD_BYTES) {
    fail(413, 'upload_too_large', 'Fichier trop volumineux (2 Mo maximum).');
}

if ($mode === 'account') {
    $baseUrl = (string) ($params['baseUrl'] ?? '');
    $username = (string) ($params['username'] ?? '');
    $password = (string) ($params['password'] ?? '');
    if ($username === '') {
        fail(400, 'missing-username', 'Identifiant manquant.');
    }
    $targetUrl = buildAccountUrl($baseUrl, $path);
    $authUser = $username;
    $authPassword = $password;
} else {
    $instance = (string) ($params['instance'] ?? '');
    $token = (string) ($params['token'] ?? '');
    $password = (string) ($params['password'] ?? '');

    if ($instance === '') {
        fail(400, 'invalid_instance', 'Instance manquante.');
    }

    if (!isAllowedHost($instance)) {
        fail(403, 'instance-not-allowed', "Cette instance n'est pas autorisée par ce proxy.");
    }

    if ($token === '' || preg_match('/^[A-Za-z0-9]+$/', $token) !== 1) {
        fail(400, 'invalid_token', 'Jeton de partage invalide.');
    }

    $segments = array_filter(explode('/', $path), static fn ($s) => $s !== '' && $s !== '.' && $s !== '..');
    $encodedPath = implode('/', array_map('rawurlencode', $segments));

    $targetUrl = 'https://' . $instance . '/public.php/webdav/' . $encodedPath;
    $authUser = $token;
    $authPassword = $password;
}

$headers = [
    'Authorization: Basic ' . base64_encode($authUser . ':' . $authPassword),
    'User-Agent: MathsMentales-NextcloudProxy/1.0',
    'Connection: close',
];

$requestBody = null;
if ($davMethod === 'PROPFIND') {
    $headers[] = 'Depth: 1';
    $headers[] = 'Content-Type: text/xml; charset=utf-8';
    $requestBody = <<<XML
<?xml version="1.0" encoding="utf-8" ?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:displayname/>
    <d:getcontentlength/>
    <d:getlastmodified/>
    <d:resourcetype/>
  </d:prop>
</d:propfind>
XML;
} elseif ($davMethod === 'PUT') {
    $headers[] = 'Content-Type: application/octet-stream';
    $requestBody = $content;
}

$contextOptions = [
    'http' => [
        'method' => $davMethod,
        'header' => implode("\r\n", $headers),
        'timeout' => UPSTREAM_TIMEOUT_SECONDS,
        'ignore_errors' => true,
        'protocol_version' => 1.1,
        'follow_location' => 0,
    ],
    'ssl' => [
        'verify_peer' => true,
        'verify_peer_name' => true,
    ],
];
if ($requestBody !== null) {
    $contextOptions['http']['content'] = $requestBody;
}

$context = stream_context_create($contextOptions);

$body = @file_get_contents($targetUrl, false, $context, 0, MAX_RESPONSE_BYTES);

if ($body === false) {
    fail(502, 'upstream_unreachable', 'Le partage est injoignable.');
}

if (strlen($body) >= MAX_RESPONSE_BYTES) {
    fail(502, 'upstream_too_large', 'Réponse du partage trop volumineuse.');
}

$upstreamStatus = 502;
foreach ($http_response_header ?? [] as $headerLine) {
    if (preg_match('#^HTTP/\S+\s+(\d{3})#', $headerLine, $m) === 1) {
        $upstreamStatus = (int) $m[1];
    }
}

http_response_code($upstreamStatus);
header('X-Upstream-Status: ' . $upstreamStatus);
// Le Content-Type annoncé par l'instance amont n'est JAMAIS reflété tel
// quel : un partage public peut être créé par n'importe qui sur une
// instance de la liste blanche. Le front ne fait de toute façon jamais
// que .text() sur cette réponse.
header('Content-Type: text/plain; charset=utf-8');
echo $body;
