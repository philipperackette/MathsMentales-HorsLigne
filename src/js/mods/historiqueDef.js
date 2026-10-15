/**
 * Format de l'historique des paniers : table des types, création,
 * normalisation, comptage.
 *
 * Ce module n'importe RIEN volontairement (même raison que parkourDef.js :
 * utils.js importe MathLive, qui ne se charge pas hors navigateur, ce qui
 * rendrait ce module intestable au `node --test`) et n'accède pas au DOM.
 */

export const VERSION = 2;

/**
 * Table unique des types d'élément rangeables. Elle remplace la cascade de
 * quatorze `else if` de l'ancien MM.copyURLtoHistory : libellés affichés,
 * icônes, filtres et retour visuel des boutons en dérivent tous.
 * `bouton` est l'id du bouton « → Historique » correspondant dans index.html.
 */
export const TYPES = {
  diaporama: { libelle: "Diaporama", emoji: "📊", bouton: "btncopytohistoric" },
  cansheet: { libelle: "Course aux nombres", emoji: "🏃‍♀️", bouton: "btn-can-copytohistoric" },
  exosheet: { libelle: "Fiche d'exercices", emoji: "📖", bouton: "btn-ex-copytohistoric" },
  exam: { libelle: "Interrogation", emoji: "📝", bouton: "btn-exam-copytohistoric" },
  duel: { libelle: "Duel", emoji: "💫", bouton: "btn-duel-copytohistoric" },
  ceinture: { libelle: "Ceinture", emoji: "🥋", bouton: "btn-ceinture-copytohistoric" },
  cartesflash: { libelle: "Cartes flash", emoji: "⚡", bouton: "btn-flash-copytohistoric" },
  fichememo: { libelle: "Fiche Memo", emoji: "🎦", bouton: "btn-memo-copytohistoric" },
  puzzle: { libelle: "Puzzle", emoji: "🧩", bouton: "btn-puzzle-copytohistoric" },
  whogots: { libelle: "J’ai/Qui a ?", emoji: "⁉️", bouton: "btn-wg-copytohistoric" },
  dominos: { libelle: "Dominos", emoji: "🀄", bouton: "btn-dominos-copytohistoric" },
  assoc: { libelle: "Association", emoji: "⛓️‍💥", bouton: "btn-assoc-copytohistoric" },
  wall: { libelle: "Panneau", emoji: "🧱", bouton: "btn-wall-copytohistoric" },
  docLOOO: { libelle: "Document LibreOffice", emoji: "📃", bouton: "btn-doc-copytohistoric" },
  inconnu: { libelle: "Élément", emoji: "❔", bouton: "" },
};

/**
 * Codes hérités : copyURLtoHistory acceptait deux écritures pour un même
 * type, et la chaîne vide pour le diaporama.
 */
const ALIAS = {
  "": "diaporama",
  course: "cansheet",
  exos: "exosheet",
  interro: "exam",
  flashcards: "cartesflash",
  assocs: "assoc",
};

/** Code canonique d'un type, « inconnu » si non répertorié. */
export function codeType(type) {
  const brut = typeof type === "string" ? type : "inconnu";
  const resolu = ALIAS[brut] !== undefined ? ALIAS[brut] : brut;
  return TYPES[resolu] !== undefined ? resolu : "inconnu";
}

/**
 * Retrouve le type dans un libellé de l'ancien historique
 * (« 📝 Interrogation du lundi 22 août 2026 : »). La reconnaissance se fait
 * sur l'emoji, pas sur le libellé : un renommage d'intitulé ne doit pas
 * rendre un historique existant illisible.
 */
export function typeDepuisEmoji(texte) {
  const source = typeof texte === "string" ? texte : "";
  if (source === "") return "inconnu";
  for (const code of Object.keys(TYPES)) {
    if (code === "inconnu" || TYPES[code].emoji === "") continue;
    if (source.indexOf(TYPES[code].emoji) === 0) return code;
  }
  // Le diaporama était seul à n'avoir aucun emoji : « Panier du … ».
  if (source.indexOf("Panier") === 0) return "diaporama";
  return "inconnu";
}

const MOIS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** Reconvertit en epoch ms une date écrite par utils.getDate(). */
export function parseDateFR(texte, secours = 0) {
  const trouve = String(texte).match(
    /(\d{1,2})\s+(\S+)\s+(\d{4})(?:\s*-\s*(\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
  );
  if (trouve === null) return secours;
  const mois = MOIS_FR.indexOf(trouve[2].toLowerCase());
  if (mois === -1) return secours;
  return new Date(
    Number(trouve[3]),
    mois,
    Number(trouve[1]),
    Number(trouve[4] || 0),
    Number(trouve[5] || 0),
    Number(trouve[6] || 0),
  ).getTime();
}

let compteur = 0;

/**
 * Identifiant stable d'une entrée. Il sert de clé de rapprochement à la
 * fusion (tâche 2) et, au lot 2, entre deux postes synchronisés : il ne doit
 * jamais être recalculé pour une entrée existante.
 */
export function nouvelId(maintenant = Date.now()) {
  compteur += 1;
  return (
    "h-" + maintenant + "-" + compteur.toString(36) + Math.random().toString(36).slice(2, 6)
  );
}

/** Un nbq n'est retenu que s'il représente réellement un nombre. */
function nbqValide(valeur) {
  if (typeof valeur === "number") return Number.isFinite(valeur);
  if (typeof valeur === "string") return valeur.trim() !== "" && Number.isFinite(Number(valeur));
  return false;
}

function nettoiePaniers(paniers) {
  if (!Array.isArray(paniers)) return [];
  return paniers.map((panier) => {
    const source = panier !== null && typeof panier === "object" ? panier : {};
    const activites = Array.isArray(source.activites) ? source.activites : [];
    return {
      titre: typeof source.titre === "string" ? source.titre : "",
      activites: activites.map((activite) => {
        const a = activite !== null && typeof activite === "object" ? activite : {};
        const sortie = {
          id: typeof a.id === "string" ? a.id : "",
          titre: typeof a.titre === "string" ? a.titre : "",
        };
        // nbq est absent des entrées migrées : le champ reste absent plutôt
        // que forcé à 0, qui se compterait comme une valeur connue. Number()
        // coerce null/""/false/[] en 0 : on exige explicitement un nombre,
        // ou une chaîne numérique non vide, avant d'accepter la valeur.
        if (nbqValide(a.nbq)) sortie.nbq = Number(a.nbq);
        return sortie;
      }),
    };
  });
}

/**
 * N'accepte comme url qu'un lien http(s) ou relatif (sans schéma) : c'est le
 * seul filtre qui ferme le vecteur "javascript:" (et tout autre schéma
 * capable d'exécuter du code, comme "data:") sans avoir à connaître à
 * l'avance la liste de ces schémas. Une url relative produite par
 * l'application elle-même (ex. "index.html?u=6ND6") n'a pas de préfixe
 * "schema:" et passe donc telle quelle.
 *
 * La reconnaissance du schéma se fait sur une forme normalisée (espaces de
 * tête/fin retirés, caractères de contrôle retirés où qu'ils soient) : les
 * navigateurs appliquent la même normalisation avant de résoudre le schéma
 * d'une url, et un filtre qui ne la ferait pas se contournerait avec
 * " javascript:alert(1)" ou "java\tscript:alert(1)". La classe retirée est
 * tout le C0 (U+0000 à U+001F) plus U+007F (DEL), pas seulement
 * tab/CR/LF/NUL : un Chromium réel résout aussi bien "javascript:" derrière
 * un caractère de contrôle C0 moins connu (ex. U+0001, U+001F) que derrière
 * une tabulation. C'est aussi cette forme normalisée qui est retournée
 * quand l'url est acceptée : mieux vaut ne jamais faire persister de
 * caractères de contrôle cachés dans une donnée utilisateur, même
 * inoffensifs une fois le schéma validé.
 */
function urlSure(valeur) {
  if (typeof valeur !== "string") return "";
  const normalisee = valeur.replace(/[\x00-\x1f\x7f]/g, "").trim();
  if (normalisee === "") return "";
  const trouve = normalisee.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (trouve === null) return normalisee;
  const schema = trouve[1].toLowerCase();
  return schema === "http" || schema === "https" ? normalisee : "";
}

/** Titre par défaut : celui du premier panier, sinon le libellé du type. */
function titreParDefaut(paniers, type) {
  for (const panier of paniers) {
    const titre = panier.titre.trim();
    if (titre !== "") return titre;
  }
  return TYPES[type].libelle;
}

/** Fabrique une entrée complète à partir de ce que MM.js sait fournir. */
export function cree({ type, url, urlSansGraine, paniers, titre, maintenant } = {}) {
  const quand = Number.isFinite(maintenant) ? maintenant : Date.now();
  const code = codeType(type);
  const listePaniers = nettoiePaniers(paniers);
  return {
    id: nouvelId(quand),
    type: code,
    titre:
      typeof titre === "string" && titre.trim() !== ""
        ? titre.trim()
        : titreParDefaut(listePaniers, code),
    cree: quand,
    modifie: quand,
    epingle: false,
    supprime: false,
    url: urlSure(url),
    urlSansGraine: urlSure(urlSansGraine),
    paniers: listePaniers,
  };
}

/**
 * Complète une entrée lue depuis le stockage ou un fichier importé. Une
 * entrée abîmée est réparée, jamais jetée : son url est la seule donnée
 * réellement irremplaçable.
 */
export function normalise(entree, maintenant = Date.now()) {
  const source = entree !== null && typeof entree === "object" ? entree : {};
  const code = codeType(source.type);
  const listePaniers = nettoiePaniers(source.paniers);
  const quandCree = Number.isFinite(Number(source.cree)) ? Number(source.cree) : maintenant;
  return {
    id: typeof source.id === "string" && source.id !== "" ? source.id : nouvelId(quandCree),
    type: code,
    titre:
      typeof source.titre === "string" && source.titre.trim() !== ""
        ? source.titre.trim()
        : titreParDefaut(listePaniers, code),
    cree: quandCree,
    modifie: Number.isFinite(Number(source.modifie)) ? Number(source.modifie) : quandCree,
    epingle: source.epingle === true,
    supprime: source.supprime === true,
    url: urlSure(source.url),
    urlSansGraine: urlSure(source.urlSansGraine),
    paniers: listePaniers,
  };
}

/**
 * Répare les entrées de type diaporama rangées avant que copyURLtoHistory()
 * ne précise son type diaporama à setURL() : leur url pointait alors sur
 * index.html au lieu de diaporama.html. Idempotente (ne touche plus rien une
 * fois corrigée) et sans effet sur les autres types : appelable à chaque
 * charger() plutôt que derrière un drapeau de migration à part.
 */
function versDiaporamaHTML(url) {
  if (typeof url !== "string" || url === "") return url;
  return url.replace(/index\.html(?=(\?|$))/, "diaporama.html");
}

export function corrigeURLsDiaporama(entrees) {
  return entrees.map((entree) => {
    if (entree.type !== "diaporama") return entree;
    const url = versDiaporamaHTML(entree.url);
    const urlSansGraine = versDiaporamaHTML(entree.urlSansGraine);
    if (url === entree.url && urlSansGraine === entree.urlSansGraine) return entree;
    return Object.assign({}, entree, { url, urlSansGraine });
  });
}

/**
 * Compteurs affichés sur une carte. Dérivés à l'affichage et jamais stockés :
 * stockés, ils divergeraient du contenu réel des paniers.
 */
export function compte(entree) {
  let activites = 0;
  let questions = 0;
  for (const panier of entree.paniers) {
    activites += panier.activites.length;
    for (const activite of panier.activites) {
      if (Number.isFinite(activite.nbq)) questions += activite.nbq;
    }
  }
  return { activites, questions };
}

/** Minuscules sans accents, pour comparer une saisie à un titre. */
function aplati(texte) {
  return String(texte)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * Filtre sur le titre de l'entrée et sur les titres d'activités de ses
 * paniers : on cherche souvent la séance par ce qu'elle contenait, pas par le
 * nom qu'on lui a donné.
 */
export function filtre(entrees, { recherche = "", types = [] } = {}) {
  const terme = aplati(recherche).trim();
  const codes = Array.isArray(types) ? types : [];
  return entrees.filter((entree) => {
    if (codes.length > 0 && codes.indexOf(entree.type) === -1) return false;
    if (terme === "") return true;
    if (aplati(entree.titre).indexOf(terme) > -1) return true;
    for (const panier of entree.paniers) {
      if (aplati(panier.titre).indexOf(terme) > -1) return true;
      for (const activite of panier.activites) {
        if (aplati(activite.titre).indexOf(terme) > -1) return true;
      }
    }
    return false;
  });
}

/**
 * Épinglés d'abord, puis du plus récemment modifié au plus ancien. À modifie
 * strictement égal (deux entrées fusionnées le même jour, par exemple), le
 * départage par id rend l'ordre déterministe et indépendant de l'ordre dans
 * lequel les listes d'origine ont été fournies.
 */
export function trie(entrees) {
  return [...entrees].sort((a, b) => {
    if (a.epingle !== b.epingle) return a.epingle ? -1 : 1;
    if (a.modifie !== b.modifie) return b.modifie - a.modifie;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

const MOIS_LIBELLE = MOIS_FR;

function cleDeGroupe(entree, maintenant) {
  if (entree.epingle) return "epingles";
  const debutDuJour = new Date(maintenant);
  debutDuJour.setHours(0, 0, 0, 0);
  if (entree.modifie >= debutDuJour.getTime()) return "aujourdhui";
  if (entree.modifie >= debutDuJour.getTime() - 7 * 24 * 3600 * 1000) return "semaine";
  const d = new Date(entree.modifie);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

function libelleDeGroupe(cle) {
  if (cle === "epingles") return "📌 Épinglés";
  if (cle === "aujourdhui") return "Aujourd’hui";
  if (cle === "semaine") return "Cette semaine";
  const [annee, mois] = cle.split("-");
  return MOIS_LIBELLE[Number(mois) - 1] + " " + annee;
}

/**
 * Découpe la liste en sections chronologiques prêtes à afficher. Aucun groupe
 * vide n'est produit : l'ordre de sortie suit celui de `trie`.
 */
export function groupeParDate(entrees, maintenant = Date.now()) {
  const groupes = [];
  const index = new Map();
  for (const entree of trie(entrees)) {
    const cle = cleDeGroupe(entree, maintenant);
    if (!index.has(cle)) {
      const groupe = { cle, libelle: libelleDeGroupe(cle), entrees: [] };
      index.set(cle, groupe);
      groupes.push(groupe);
    }
    index.get(cle).entrees.push(entree);
  }
  return groupes;
}

function limiteMois(mois, maintenant) {
  const limite = new Date(maintenant);
  const jourDepart = limite.getDate();
  limite.setMonth(limite.getMonth() - mois);
  // setMonth déborde sur le mois suivant quand le mois visé est plus court
  // (31 août - 6 mois donnerait le 3 mars, pas le 28 février) : on ramène
  // alors la date au dernier jour du mois visé, sans toucher à l'heure.
  if (limite.getDate() !== jourDepart) limite.setDate(0);
  return limite.getTime();
}

/**
 * Entrées candidates au nettoyage. Les épinglées ne le sont jamais : épingler
 * est justement la façon de dire « celle-ci, je la garde ».
 */
export function anciennes(entrees, mois, maintenant = Date.now()) {
  const limite = limiteMois(mois, maintenant);
  return entrees.filter((entree) => !entree.epingle && entree.modifie < limite);
}

/**
 * Retire pour de bon les tombstones plus vieux que `mois`, contrairement à
 * anciennes()/nettoyerAnciens() qui ne font que marquer une entrée encore
 * active comme supprimée (réversible, laisse une trace pour la
 * synchronisation). Passé cet horizon, tout poste synchronisé régulièrement a
 * eu largement le temps de voir la suppression passer : le tombstone a fini
 * son rôle et peut disparaître, sans quoi il resterait pour toujours et
 * l'historique ne ferait plus jamais que grossir.
 */
export function purgeTombstones(entrees, mois, maintenant = Date.now()) {
  const limite = limiteMois(mois, maintenant);
  return entrees.filter((entree) => entree.supprime !== true || entree.modifie >= limite);
}

/**
 * Écarte les tombstones (entrées marquées `supprime`, conservées seulement
 * pour propager leur suppression à la synchronisation nuage — voir
 * `fusionne` ci-dessous). Tout affichage ou calcul destiné à l'utilisateur
 * doit passer par ce filtre, jamais consommer une liste d'entrées brute.
 */
export function actives(entrees) {
  return entrees.filter((entree) => entree.supprime !== true);
}

/**
 * Départage deux versions d'une même entrée (même id) quand leur modifie est
 * strictement égal. L'id ne peut pas servir de critère ici : il est par
 * construction identique pour les deux versions comparées. On compare donc
 * leur contenu sérialisé — un critère qui ne dépend que des deux versions
 * elles-mêmes, jamais de l'ordre dans lequel `fusionne` les rencontre — pour
 * que `fusionne(a, b)` et `fusionne(b, a)` convergent toujours vers la même
 * version.
 */
function gagne(candidate, actuelle) {
  if (candidate.modifie !== actuelle.modifie) return candidate.modifie > actuelle.modifie;
  return JSON.stringify(candidate) > JSON.stringify(actuelle);
}

/**
 * Réunit deux listes par identifiant : à id égal, la version modifiée le plus
 * récemment gagne (et `gagne` ci-dessus départage une égalité stricte de
 * modifie). C'est cette fonction qui fait converger deux postes synchronisés
 * via le nuage, là où qcmcam2 doit écraser faute d'identifiants stables
 * partagés. Une suppression (voir `supprime` sur l'entrée) est une entrée
 * comme une autre pour cette fonction : c'est ce qui lui permet de gagner
 * sur une version plus ancienne reçue d'un autre poste, au lieu qu'une
 * synchronisation ne ressuscite silencieusement ce qui vient d'être
 * supprimé localement.
 */
export function fusionne(entreesA, entreesB) {
  const parId = new Map();
  for (const entree of [...entreesA, ...entreesB]) {
    const connue = parId.get(entree.id);
    if (connue === undefined || gagne(entree, connue)) parId.set(entree.id, entree);
  }
  return trie([...parId.values()]);
}

/**
 * Valide un fichier d'import. Une entrée sans url est inexploitable et n'est
 * pas gardée, mais elle ne fait pas échouer tout le fichier : on signale et on
 * importe le reste.
 */
export function valideImport(objet) {
  const erreurs = [];
  if (objet === null || typeof objet !== "object" || Array.isArray(objet)) {
    return { ok: false, entrees: [], erreurs: ["Le fichier ne contient pas un historique."] };
  }
  if (objet.version === undefined) {
    return {
      ok: false,
      entrees: [],
      erreurs: ["Ce fichier ne précise aucune version : il n’est pas reconnu comme un historique."],
    };
  }
  if (Number(objet.version) > VERSION) {
    return {
      ok: false,
      entrees: [],
      erreurs: [
        "Ce fichier a été écrit par une version plus récente de MathsMentales (version " +
          objet.version +
          ").",
      ],
    };
  }
  if (!Array.isArray(objet.entrees)) {
    return { ok: false, entrees: [], erreurs: ["Le fichier ne contient aucune liste d’entrées."] };
  }
  const entrees = [];
  objet.entrees.forEach((brute, rang) => {
    const source = brute !== null && typeof brute === "object" ? brute : {};
    // Un tombstone (voir purgeTombstones/actives) n'a plus d'url : elle a été
    // jetée à la suppression pour ne pas trimballer indéfiniment le contenu
    // d'une entrée déjà effacée. L'exiger ici la ferait rejeter à l'import,
    // et la suppression ne se propagerait alors jamais à un autre poste.
    if (source.supprime !== true) {
      if (typeof source.url !== "string" || source.url === "") {
        erreurs.push("Entrée n°" + (rang + 1) + " ignorée : aucune adresse.");
        return;
      }
      if (urlSure(source.url) === "") {
        erreurs.push("Entrée n°" + (rang + 1) + " ignorée : adresse non autorisée.");
        return;
      }
    }
    entrees.push(normalise(source));
  });
  if (entrees.length === 0) {
    erreurs.push("Aucune entrée exploitable dans ce fichier.");
    return { ok: false, entrees: [], erreurs };
  }
  return { ok: true, entrees, erreurs };
}
