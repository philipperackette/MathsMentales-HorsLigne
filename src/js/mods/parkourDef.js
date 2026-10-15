/**
 * Format du fichier parcours Parkour : valeurs par défaut, normalisation,
 * validation et encodage pour lien élève.
 *
 * Ce module n'importe RIEN volontairement : utils.js importe MathLive, qui ne
 * se charge pas hors navigateur, ce qui rendrait ce module intestable au
 * `node --test`. Il n'accède pas non plus au DOM.
 */

/** Règles du moteur de jeu, valeurs historiques de la V1. */
export const DEFAULT_REGLES = {
  delaiDeblocageH: 12,
  verrouEchecH: 6,
  tentativesAvantVerrou: 3,
  seuilReussite: 8,
  nbQuestions: 10,
};

/** Premier id de la forme eNN qui n'est pas déjà pris. */
function freeId(seen, index) {
  let n = index + 1;
  let candidate = "e" + String(n).padStart(2, "0");
  while (seen.has(candidate)) {
    n += 1;
    candidate = "e" + String(n).padStart(2, "0");
  }
  return candidate;
}

/**
 * Fusionne les règles d'un parcours brut avec les valeurs par défaut, sans
 * borner nbQuestions/seuilReussite l'une par rapport à l'autre. Sert de base
 * à normalize() (qui borne ensuite) et à validate() (qui doit voir les
 * valeurs brutes déclarées pour signaler l'incohérence elle-même).
 * @param {object} source parcours brut
 * @returns {object} règles fusionnées
 */
function mergeRegles(source) {
  const regles = { ...DEFAULT_REGLES };
  const sourceRegles = source.regles || {};
  for (const key of Object.keys(DEFAULT_REGLES)) {
    if (sourceRegles[key] === undefined || sourceRegles[key] === "") continue;
    const value = Number(sourceRegles[key]);
    // une valeur illisible retombe sur le défaut plutôt que de casser le jeu
    if (!Number.isNaN(value)) regles[key] = value;
  }
  return regles;
}

/**
 * Complète un parcours : règles fusionnées, themes/etapes garantis, ids
 * d'étape manquants attribués. Les ids existants sont préservés : ce sont les
 * clés de progression des élèves dans localStorage.
 * @param {object} def parcours brut (fichier, lien décodé ou état d'édition)
 * @returns {object} nouvelle définition complète, source non modifiée
 */
export function normalize(def) {
  const source = def || {};
  const regles = mergeRegles(source);
  // nbQuestions et seuilReussite ne sont pas deux nombres indépendants : un
  // lien ?d= forgé n'est pas obligé de passer par l'éditeur, donc on borne
  // aussi ici (pas seulement dans validate()) pour qu'un parcours mal formé
  // reste jouable au pire plutôt que de figer le jeu (nbQuestions à 0 ou
  // négatif) ou de verrouiller une étape mathématiquement impossible
  // (seuilReussite supérieur à nbQuestions).
  regles.nbQuestions = Math.max(1, Math.floor(regles.nbQuestions));
  regles.seuilReussite = Math.min(
    Math.max(1, Math.floor(regles.seuilReussite)),
    regles.nbQuestions,
  );

  const themes = (Array.isArray(source.themes) ? source.themes : []).map(
    (theme) => ({ ...theme }),
  );

  const sourceEtapes = Array.isArray(source.etapes) ? source.etapes : [];
  const seen = new Set();
  for (const etape of sourceEtapes) {
    if (etape && etape.id) seen.add(etape.id);
  }
  const etapes = sourceEtapes.map((etape, index) => {
    const copy = { ...etape };
    if (!copy.id) {
      copy.id = freeId(seen, index);
      seen.add(copy.id);
    }
    return copy;
  });

  return {
    id: source.id || "parkour",
    titre: source.titre || "Parkour",
    regles,
    themes,
    etapes,
  };
}

/**
 * Nombre de questions qu'un panier annonce, sans charger la bibliothèque.
 * @param {object} panier objet au format cart.import
 * @returns {number}
 */
export function countQuestions(panier) {
  if (!panier || !panier.a) return 0;
  let total = 0;
  for (const key in panier.a) {
    const n = Number(panier.a[key].n);
    if (!Number.isNaN(n)) total += n;
  }
  return total;
}

/**
 * Contrôle un parcours avant diffusion.
 * Les erreurs bloquent l'export, les avertissements non.
 * Travaille sur le parcours brut pour pouvoir signaler les ids en double, que
 * normalize() préserve volontairement.
 * @param {object} def parcours à contrôler
 * @returns {{erreurs: string[], avertissements: string[]}}
 */
export function validate(def) {
  const source = def || {};
  const regles = normalize(source).regles;
  // valeurs brutes déclarées, non bornées : c'est sur elles qu'on doit
  // détecter l'incohérence, normalize() l'ayant déjà corrigée silencieusement
  const rawRegles = mergeRegles(source);
  const themes = Array.isArray(source.themes) ? source.themes : [];
  const etapes = Array.isArray(source.etapes) ? source.etapes : [];
  const erreurs = [];
  const avertissements = [];

  if (etapes.length === 0) {
    erreurs.push("Le parcours ne contient aucune étape.");
  }

  if (rawRegles.seuilReussite > rawRegles.nbQuestions) {
    erreurs.push(
      "Seuil de réussite (" +
        rawRegles.seuilReussite +
        ") supérieur au nombre de questions par étape (" +
        rawRegles.nbQuestions +
        ") : l'étape serait impossible à réussir.",
    );
  }

  const themeIds = new Set(themes.map((theme) => theme.id));
  const themesUtilises = new Set();
  const idsVus = new Set();
  const themeIdsVus = new Set();
  for (const theme of themes) {
    if (!theme.id) continue;
    if (themeIdsVus.has(theme.id)) {
      erreurs.push(
        'Identifiant de thème en double : "' + theme.id + '".',
      );
    }
    themeIdsVus.add(theme.id);
  }

  etapes.forEach((etape, index) => {
    const nom =
      "Étape " + (index + 1) + " (" + (etape.titre || "sans titre") + ")";
    if (etape.id) {
      if (idsVus.has(etape.id)) {
        erreurs.push(nom + " : identifiant en double (" + etape.id + ").");
      }
      idsVus.add(etape.id);
    }
    if (!etape.theme || !themeIds.has(etape.theme)) {
      erreurs.push(nom + " : thème inconnu (" + (etape.theme || "aucun") + ").");
    } else {
      themesUtilises.add(etape.theme);
    }
    const nb = countQuestions(etape.panier);
    if (nb === 0) {
      erreurs.push(nom + " : panier vide, aucune activité.");
    } else if (nb < regles.seuilReussite) {
      // moins de questions que le seuil de réussite : l'étape est injouable,
      // ce n'est plus un simple avertissement
      erreurs.push(
        nom +
          " : " +
          nb +
          " questions disponibles, moins que les " +
          regles.seuilReussite +
          " requises pour réussir l'étape.",
      );
    } else if (nb < regles.nbQuestions) {
      avertissements.push(
        nom +
          " : " +
          nb +
          " questions disponibles pour " +
          regles.nbQuestions +
          " demandées.",
      );
    }
  });

  for (const theme of themes) {
    if (!themesUtilises.has(theme.id)) {
      avertissements.push(
        'Le thème "' + (theme.label || theme.id) + '" n\'a aucune étape.',
      );
    }
  }

  return { erreurs, avertissements };
}

/**
 * Encode un parcours pour le paramètre ?d= d'un lien élève.
 * Base64 rendu URL-safe : +/ deviennent -_ et le padding = est retiré, ce qui
 * évite tout ré-encodage dans une URL.
 * @param {object} def parcours
 * @returns {string}
 */
export function encode(def) {
  const json = JSON.stringify(def);
  const base64 = btoa(unescape(encodeURIComponent(json)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Décode un parcours issu du paramètre ?d=.
 * @param {string} str chaîne encodée par encode()
 * @returns {object} parcours normalisé
 * @throws {Error} si la chaîne n'est pas un parcours lisible
 */
export function decode(str) {
  let base64 = String(str).replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) base64 += "=";
  let parsed;
  try {
    parsed = JSON.parse(decodeURIComponent(escape(atob(base64))));
  } catch {
    throw new Error("lien de parcours invalide");
  }
  if (!parsed || !Array.isArray(parsed.etapes)) {
    throw new Error("lien de parcours invalide");
  }
  return normalize(parsed);
}
