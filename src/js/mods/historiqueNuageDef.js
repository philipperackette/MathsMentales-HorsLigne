/**
 * Synchronisation nuage de l'historique (WebDAV via public/proxy/nextcloud.php) :
 * logique pure, aucun accès réseau ni DOM. Même contrainte que
 * historiqueDef.js : se teste au `node --test` hors navigateur.
 */

const RE_PARTAGE = /\/s\/([A-Za-z0-9]+)/;

/**
 * Déduit le mode d'accès depuis une adresse saisie par l'utilisateur : un
 * lien de partage porte /s/<jeton>, tout le reste est compris comme une
 * racine WebDAV de compte. https est imposé — le mot de passe d'application
 * ne doit jamais partir en clair.
 */
export function parseAdresseNuage(url) {
  let brute;
  try {
    brute = new URL(url);
  } catch (err) {
    return null;
  }
  if (brute.protocol !== "https:") return null;
  const partage = brute.pathname.match(RE_PARTAGE);
  if (partage !== null) return { mode: "partage", instance: brute.hostname, jeton: partage[1] };
  return { mode: "compte", baseUrl: (brute.origin + brute.pathname).replace(/\/+$/, "") };
}

/**
 * Nettoie un chemin WebDAV sortant avant de l'envoyer au proxy. `null` si
 * une traversée de dossier est tentée : le proxy PHP refait ce contrôle de
 * son côté (c'est celui-là qui compte réellement), celui-ci évite un
 * aller-retour réseau pour une erreur évidente.
 */
export function normaliseChemin(chemin) {
  const nettoye = String(chemin).replace(/^\/+/, "").replace(/\/+$/, "").replace(/\/{2,}/g, "/");
  if (nettoye.split("/").includes("..")) return null;
  return nettoye;
}

/**
 * Extrait le code d'erreur d'un refus signé du proxy
 * ({"source":"proxy","code":...}), qui distingue un refus du proxy (ex.
 * hébergeur non autorisé) d'un statut relayé tel quel du serveur WebDAV
 * amont. Une réponse qui n'est pas ce format précis (page d'erreur HTML de
 * l'hébergeur, JSON sans ce marqueur, texte vide) retombe silencieusement
 * sur `null`, jamais sur une exception.
 */
export function refusDuProxy(texte) {
  let corps;
  try {
    corps = JSON.parse(texte);
  } catch (err) {
    return null;
  }
  if (corps === null || typeof corps !== "object") return null;
  return corps.source === "proxy" && typeof corps.code === "string" ? corps.code : null;
}

/** Complète une configuration persistée (sans secret) avec le mot de passe saisi/mémorisé. */
export function construireAcces(config, motDePasse) {
  if (config.mode === "partage") {
    return { mode: "partage", instance: config.instance, jeton: config.jeton, motDePasse };
  }
  return { mode: "compte", baseUrl: config.baseUrl, identifiant: config.identifiant, motDePasse };
}

/** Corps JSON à envoyer au proxy pour un accès et une méthode DAV donnés. */
export function construireRequeteProxy(methode, acces, chemin, contenu) {
  const identification =
    acces.mode === "partage"
      ? { instance: acces.instance, token: acces.jeton, password: acces.motDePasse || "" }
      : { mode: "account", baseUrl: acces.baseUrl, username: acces.identifiant, password: acces.motDePasse || "" };
  const requete = Object.assign({ method: methode }, identification, { path: chemin });
  if (contenu !== undefined) requete.content = contenu;
  return requete;
}

/**
 * Traduit un statut HTTP (+ corps, pour distinguer un refus du proxy d'un
 * statut relayé) en verdict exploitable par historiqueNuage.js. `ecriture`
 * distingue les opérations d'écriture (PUT/MKCOL/DELETE), où 401 signifie
 * un mauvais mot de passe plutôt qu'une ressource absente — en lecture
 * (PROPFIND/GET), 401 et 404 se valent : la ressource n'est pas accessible.
 */
export function interpreteStatut(statut, texte, { ecriture = false } = {}) {
  if (statut >= 200 && statut < 300) return { ok: true };
  if (statut === 401) {
    return ecriture
      ? { ok: false, code: "authentification", message: "Mot de passe refusé." }
      : { ok: false, code: "absent", message: "Introuvable." };
  }
  if (statut === 404) return { ok: false, code: "absent", message: "Introuvable." };
  if (statut === 403) {
    const code = refusDuProxy(texte);
    return code === "instance-not-allowed"
      ? { ok: false, code: "refuse", message: "Cet hébergeur n'est pas autorisé par le proxy." }
      : { ok: false, code: "refuse", message: "Accès refusé." };
  }
  return { ok: false, code: "reseau", message: "La synchronisation a échoué (réseau)." };
}
