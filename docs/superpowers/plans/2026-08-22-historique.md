# Historique des paniers — plan d'implémentation (lot 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reposer l'onglet « Historique » de `src/index.html` sur un modèle de données JSON, migrer sans perte l'historique HTML existant, et livrer une présentation en cartes compactes avec recherche, filtres, épinglage et renommage.

**Architecture:** Deux mods. `src/js/mods/historiqueDef.js` porte la logique pure (table des types, création, normalisation, fusion, filtrage, tri, groupement, validation) et n'importe rien, donc se teste au `node --test`. `src/js/mods/historique.js` porte le stockage `localStorage`, la migration depuis l'ancien blob HTML, le rendu et la délégation d'évènements. `MM.js` perd ses neuf fonctions d'historique et ne garde que la fabrication des URL.

**Tech Stack:** JavaScript vanilla, modules ES chargés directement par le navigateur en développement (aucun bundling nécessaire pour itérer), `node --test` pour la logique pure, aucune dépendance nouvelle.

**Spec:** `docs/superpowers/specs/2026-08-22-historique-design.md`

## Global Constraints

- Toutes les chaînes visibles par l'utilisateur sont en **français**, y compris les messages d'erreur.
- **Aucune dépendance nouvelle.** Ni npm, ni CDN.
- `historiqueDef.js` **n'importe rien** et **n'accède pas au DOM**. Même raison que `parkourDef.js` (voir son en-tête) : `utils.js` importe MathLive, qui ne se charge pas hors navigateur et rendrait le module intestable.
- `historique.js` construit son DOM avec `utils.create(type, props)` (`src/js/mods/utils.js:585`), motif du projet.
- Tout texte saisi par l'utilisateur (titre d'entrée, terme de recherche) est inséré en `textContent`, **jamais** en `innerHTML`.
- Clé de stockage : `mm-historique-v2`. L'ancienne clé `history` n'est **ni supprimée ni réécrite**, jamais, à aucune étape.
- Pas de cycle d'import : `MM.js` importe `historique.js` ; `historique.js` n'importe **pas** `MM.js`. Les actions « éditer » et « panier » remontent par des rappels passés à `historique.monter()`.
- `npm test` (`node --test src/js/mods/*.test.mjs public/parkour/*.test.mjs`) doit rester vert à chaque commit. Les 22+ tests parkour existants ne sont pas modifiés.
- Aucun `gulp` à lancer : `src/` est déployé tel quel (voir « Deployment » dans `CLAUDE.md`).
- Palier mobile : `@media screen and (max-width: 600px)`, déjà utilisé dans `src/css/mathsmentales.css`.
- Animations soumises à `@media (prefers-reduced-motion: reduce)`, comme le reste de la feuille.
- Messages de commit en français, préfixe conventionnel (`feat:`, `fix:`, `refactor:`, `docs:`).

---

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `src/js/mods/historiqueDef.js` | **Créé.** Logique pure : `TYPES`, `codeType`, `typeDepuisEmoji`, `parseDateFR`, `nouvelId`, `cree`, `normalise`, `compte`, `filtre`, `trie`, `groupeParDate`, `anciennes`, `fusionne`, `valideImport`. Zéro DOM, zéro import. |
| `src/js/mods/historiqueDef.test.mjs` | **Créé.** Tests `node --test` de tout ce qui précède. |
| `src/js/mods/historique.js` | **Créé.** `charger`, `sauver`, `ajouter`, `renommer`, `epingler`, `supprimer`, `vider`, `nettoyerAnciens`, `exporterJSON`, `importerJSON`, migration HTML, `monter`, rendu, délégation. |
| `src/js/mods/MM.js` | **Modifié.** `getCartsContent` (l.1564-1578) → `paniersVersDonnees` ; `copyURLtoHistory` (l.2885-3016) réduite ; neuf fonctions d'historique supprimées (l.3018-3152). |
| `src/js/lib.mathsmentales.js` | **Modifié.** Restauration de l'historique (l.111-145) et câblages (l.756-785, l.911-924) remplacés par un appel à `historique.monter()`. |
| `src/index.html` | **Modifié.** Section `#tab-historique` (l.1081-1094) réduite à une coquille remplie par le mod. |
| `src/css/mathsmentales.css` | **Modifié.** Les trois règles actuelles (l.425-438) remplacées par les styles de l'onglet. |

---

### Task 1 : modèle pur — types, création, normalisation

**Files:**
- Create: `src/js/mods/historiqueDef.js`
- Test: `src/js/mods/historiqueDef.test.mjs`

**Interfaces:**
- Consumes: rien.
- Produces:
  - `VERSION = 2`
  - `TYPES` : `{ [code]: { libelle: string, emoji: string, bouton: string } }`
  - `codeType(type: string): string` — code canonique, `"inconnu"` si non reconnu
  - `typeDepuisEmoji(texte: string): string` — code canonique lu dans un libellé de l'ancien format
  - `parseDateFR(texte: string, secours?: number): number` — epoch ms
  - `nouvelId(maintenant?: number): string`
  - `cree({ type, url, urlSansGraine, paniers, titre, maintenant }): Entree`
  - `normalise(entree: object, maintenant?: number): Entree`
  - `compte(entree): { activites: number, questions: number }`

Forme d'une `Entree` (voir la spec, « Modèle de données ») :
`{ id, type, titre, cree, modifie, epingle, url, urlSansGraine, paniers: [{ titre, activites: [{ id, titre, nbq }] }] }`

- [ ] **Step 1 : Écrire les tests qui échouent**

Créer `src/js/mods/historiqueDef.test.mjs` :

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  VERSION,
  TYPES,
  codeType,
  typeDepuisEmoji,
  parseDateFR,
  nouvelId,
  cree,
  normalise,
  compte,
} from "./historiqueDef.js";

const T0 = Date.UTC(2026, 7, 22, 10, 0, 0); // 22 août 2026

function unPanier() {
  return [
    {
      titre: "Diapo 1",
      activites: [
        { id: "5CL3", titre: "Réduire une expression", nbq: 6 },
        { id: "5CL4", titre: "Développer", nbq: 4 },
      ],
    },
  ];
}

test("VERSION vaut 2", () => {
  assert.equal(VERSION, 2);
});

test("chaque type a un libellé, un emoji et une clé de bouton", () => {
  for (const code of Object.keys(TYPES)) {
    assert.equal(typeof TYPES[code].libelle, "string");
    assert.ok(TYPES[code].libelle.length > 0, code + " sans libellé");
    assert.ok(TYPES[code].emoji.length > 0, code + " sans emoji");
    assert.equal(typeof TYPES[code].bouton, "string");
  }
});

test("codeType résout les alias hérités de copyURLtoHistory", () => {
  assert.equal(codeType("exam"), "exam");
  assert.equal(codeType("interro"), "exam");
  assert.equal(codeType("exos"), "exosheet");
  assert.equal(codeType("course"), "cansheet");
  assert.equal(codeType("flashcards"), "cartesflash");
  assert.equal(codeType("assocs"), "assoc");
});

test("codeType traite la chaîne vide comme un diaporama", () => {
  assert.equal(codeType(""), "diaporama");
});

test("codeType retourne inconnu pour un type non répertorié", () => {
  assert.equal(codeType("charabia"), "inconnu");
  assert.equal(codeType(undefined), "inconnu");
});

test("typeDepuisEmoji reconnaît un libellé de l'ancien historique", () => {
  assert.equal(typeDepuisEmoji("📝 Interrogation du lundi 22 août 2026 : "), "exam");
  assert.equal(typeDepuisEmoji("🥋 Ceinture du mardi 2 septembre 2026 : "), "ceinture");
});

test("typeDepuisEmoji retourne diaporama pour l'ancien libellé sans emoji", () => {
  assert.equal(typeDepuisEmoji("Panier du lundi 22 août 2026 : "), "diaporama");
});

test("typeDepuisEmoji retourne inconnu pour un libellé illisible", () => {
  assert.equal(typeDepuisEmoji("🐳 Baleine du 22"), "inconnu");
  assert.equal(typeDepuisEmoji(""), "inconnu");
});

test("parseDateFR lit une date produite par utils.getDate", () => {
  const t = parseDateFR("lundi 22 août 2026 - 14:03:05");
  const d = new Date(t);
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 7);
  assert.equal(d.getDate(), 22);
  assert.equal(d.getHours(), 14);
  assert.equal(d.getMinutes(), 3);
});

test("parseDateFR accepte une date sans heure", () => {
  const d = new Date(parseDateFR("2 septembre 2026"));
  assert.equal(d.getMonth(), 8);
  assert.equal(d.getDate(), 2);
});

test("parseDateFR retourne la valeur de secours si rien n'est reconnu", () => {
  assert.equal(parseDateFR("pas une date", 42), 42);
  assert.equal(parseDateFR("22 brumaire 2026", 42), 42);
  assert.equal(parseDateFR("pas une date"), 0);
});

test("nouvelId produit des identifiants distincts", () => {
  const ids = new Set();
  for (let i = 0; i < 200; i += 1) ids.add(nouvelId(T0));
  assert.equal(ids.size, 200);
  assert.ok([...ids][0].startsWith("h-" + T0 + "-"));
});

test("cree remplit tous les champs d'une entrée", () => {
  const e = cree({
    type: "interro",
    url: "https://x/?p=0&a=graine",
    urlSansGraine: "https://x/?p=0",
    paniers: unPanier(),
    maintenant: T0,
  });
  assert.equal(e.type, "exam");
  assert.equal(e.cree, T0);
  assert.equal(e.modifie, T0);
  assert.equal(e.epingle, false);
  assert.equal(e.url, "https://x/?p=0&a=graine");
  assert.equal(e.urlSansGraine, "https://x/?p=0");
  assert.equal(e.paniers.length, 1);
  assert.ok(e.id.length > 0);
});

test("cree prend le titre du premier panier par défaut", () => {
  const e = cree({ type: "exam", url: "u", paniers: unPanier(), maintenant: T0 });
  assert.equal(e.titre, "Diapo 1");
});

test("cree retombe sur le libellé du type si aucun panier n'a de titre", () => {
  const e = cree({ type: "exam", url: "u", paniers: [], maintenant: T0 });
  assert.equal(e.titre, "Interrogation");
});

test("cree respecte un titre explicite", () => {
  const e = cree({ type: "exam", url: "u", paniers: unPanier(), titre: "Interro fractions 5e", maintenant: T0 });
  assert.equal(e.titre, "Interro fractions 5e");
});

test("normalise complète les champs manquants", () => {
  const e = normalise({ url: "u" }, T0);
  assert.equal(e.type, "inconnu");
  assert.equal(e.epingle, false);
  assert.equal(e.cree, T0);
  assert.equal(e.modifie, T0);
  assert.deepEqual(e.paniers, []);
  assert.ok(e.id.length > 0);
});

test("normalise fait de modifie une copie de cree quand il manque", () => {
  const e = normalise({ url: "u", cree: 1000 }, T0);
  assert.equal(e.modifie, 1000);
});

test("normalise préserve un identifiant existant", () => {
  const e = normalise({ id: "h-1-abc", url: "u" }, T0);
  assert.equal(e.id, "h-1-abc");
});

test("normalise nettoie les paniers mal formés sans jeter l'entrée", () => {
  const e = normalise({ url: "u", paniers: [{ titre: 3, activites: "pas un tableau" }] }, T0);
  assert.equal(e.paniers.length, 1);
  assert.equal(e.paniers[0].titre, "");
  assert.deepEqual(e.paniers[0].activites, []);
});

test("compte additionne activités et questions", () => {
  const e = cree({ type: "exam", url: "u", paniers: unPanier(), maintenant: T0 });
  assert.deepEqual(compte(e), { activites: 2, questions: 10 });
});

test("compte ignore les nbq absents sans casser le total", () => {
  const e = cree({
    type: "exam",
    url: "u",
    paniers: [{ titre: "P", activites: [{ id: "a", titre: "A" }, { id: "b", titre: "B", nbq: 5 }] }],
    maintenant: T0,
  });
  assert.deepEqual(compte(e), { activites: 2, questions: 5 });
});
```

- [ ] **Step 2 : Lancer les tests pour vérifier qu'ils échouent**

Run: `node --test src/js/mods/historiqueDef.test.mjs`
Expected: FAIL — `Cannot find module .../historiqueDef.js`

- [ ] **Step 3 : Écrire `historiqueDef.js`**

```js
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
        // que forcé à 0, qui se compterait comme une valeur connue.
        if (Number.isFinite(Number(a.nbq))) sortie.nbq = Number(a.nbq);
        return sortie;
      }),
    };
  });
}

/** Titre par défaut : celui du premier panier, sinon le libellé du type. */
function titreParDefaut(paniers, type) {
  for (const panier of paniers) {
    if (panier.titre !== "") return panier.titre;
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
    url: typeof url === "string" ? url : "",
    urlSansGraine: typeof urlSansGraine === "string" ? urlSansGraine : "",
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
    url: typeof source.url === "string" ? source.url : "",
    urlSansGraine: typeof source.urlSansGraine === "string" ? source.urlSansGraine : "",
    paniers: listePaniers,
  };
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
```

- [ ] **Step 4 : Lancer les tests pour vérifier qu'ils passent**

Run: `node --test src/js/mods/historiqueDef.test.mjs`
Expected: PASS — tous les tests du fichier passent.

- [ ] **Step 5 : Vérifier la non-régression des tests existants**

Run: `npm test`
Expected: PASS, y compris les tests parkour.

- [ ] **Step 6 : Commit**

```bash
git add src/js/mods/historiqueDef.js src/js/mods/historiqueDef.test.mjs
git commit -m "feat(historique): modèle pur des entrées et table des types"
```

---

### Task 2 : modèle pur — filtrage, tri, groupement, fusion, validation

**Files:**
- Modify: `src/js/mods/historiqueDef.js`
- Test: `src/js/mods/historiqueDef.test.mjs`

**Interfaces:**
- Consumes: `normalise`, `TYPES`, `VERSION` (tâche 1).
- Produces:
  - `filtre(entrees, { recherche, types }): Entree[]`
  - `trie(entrees): Entree[]`
  - `groupeParDate(entrees, maintenant): [{ cle, libelle, entrees }]`
  - `anciennes(entrees, mois, maintenant): Entree[]`
  - `fusionne(entreesA, entreesB): Entree[]`
  - `valideImport(objet): { ok: boolean, entrees: Entree[], erreurs: string[] }`

`fusionne` et `valideImport` sont les deux fonctions que le lot 2 (synchronisation nuage) réutilisera telles quelles.

- [ ] **Step 1 : Écrire les tests qui échouent**

Ajouter à la fin de `src/js/mods/historiqueDef.test.mjs`, et compléter la ligne d'import du haut du fichier avec `filtre, trie, groupeParDate, anciennes, fusionne, valideImport` :

```js
const JOUR = 24 * 3600 * 1000;

function entree(exces) {
  return normalise(Object.assign({ url: "u", type: "exam", titre: "Sans titre" }, exces), T0);
}

test("filtre trouve sur le titre, sans tenir compte de la casse ni des accents", () => {
  const liste = [entree({ titre: "Théorème de Thalès" }), entree({ titre: "Fractions" })];
  assert.equal(filtre(liste, { recherche: "thales" }).length, 1);
  assert.equal(filtre(liste, { recherche: "THÉORÈME" }).length, 1);
});

test("filtre trouve sur le titre d'une activité rangée dans un panier", () => {
  const liste = [
    entree({ titre: "Séance 1", paniers: [{ titre: "P", activites: [{ id: "a", titre: "Réduire une expression" }] }] }),
    entree({ titre: "Séance 2" }),
  ];
  const trouve = filtre(liste, { recherche: "reduire" });
  assert.equal(trouve.length, 1);
  assert.equal(trouve[0].titre, "Séance 1");
});

test("filtre sans recherche ni type retourne tout", () => {
  const liste = [entree({}), entree({})];
  assert.equal(filtre(liste, {}).length, 2);
  assert.equal(filtre(liste, { recherche: "   " }).length, 2);
});

test("filtre restreint aux types demandés", () => {
  const liste = [entree({ type: "exam" }), entree({ type: "exosheet" })];
  assert.equal(filtre(liste, { types: ["exam"] }).length, 1);
  assert.equal(filtre(liste, { types: ["exam", "exosheet"] }).length, 2);
  assert.equal(filtre(liste, { types: ["puzzle"] }).length, 0);
});

test("trie place les épinglés en tête quel que soit leur âge", () => {
  const vieuxEpingle = entree({ titre: "vieux", modifie: T0 - 100 * JOUR, epingle: true });
  const recent = entree({ titre: "récent", modifie: T0 });
  const ordre = trie([recent, vieuxEpingle]).map((e) => e.titre);
  assert.deepEqual(ordre, ["vieux", "récent"]);
});

test("trie classe ensuite du plus récemment modifié au plus ancien", () => {
  const liste = [
    entree({ titre: "b", modifie: T0 - JOUR }),
    entree({ titre: "a", modifie: T0 }),
    entree({ titre: "c", modifie: T0 - 2 * JOUR }),
  ];
  assert.deepEqual(trie(liste).map((e) => e.titre), ["a", "b", "c"]);
});

test("trie ne modifie pas le tableau reçu", () => {
  const liste = [entree({ titre: "b", modifie: T0 - JOUR }), entree({ titre: "a", modifie: T0 })];
  trie(liste);
  assert.equal(liste[0].titre, "b");
});

test("groupeParDate sépare épinglés, aujourd'hui, semaine et mois", () => {
  const liste = [
    entree({ titre: "épinglée", modifie: T0 - 200 * JOUR, epingle: true }),
    entree({ titre: "du jour", modifie: T0 - 3600 * 1000 }),
    entree({ titre: "de la semaine", modifie: T0 - 3 * JOUR }),
    entree({ titre: "de mai", modifie: Date.UTC(2026, 4, 12) }),
  ];
  const groupes = groupeParDate(liste, T0);
  assert.deepEqual(groupes.map((g) => g.cle), ["epingles", "aujourdhui", "semaine", "2026-05"]);
  assert.equal(groupes[0].entrees[0].titre, "épinglée");
  assert.equal(groupes[3].libelle, "mai 2026");
});

test("groupeParDate ne produit aucun groupe vide", () => {
  const groupes = groupeParDate([entree({ modifie: T0 })], T0);
  assert.deepEqual(groupes.map((g) => g.cle), ["aujourdhui"]);
});

test("anciennes retourne les entrées plus vieilles que N mois", () => {
  const liste = [entree({ titre: "vieille", modifie: T0 - 200 * JOUR }), entree({ titre: "fraîche", modifie: T0 })];
  const vieilles = anciennes(liste, 6, T0);
  assert.equal(vieilles.length, 1);
  assert.equal(vieilles[0].titre, "vieille");
});

test("anciennes épargne toujours les entrées épinglées", () => {
  const liste = [entree({ modifie: T0 - 200 * JOUR, epingle: true })];
  assert.equal(anciennes(liste, 6, T0).length, 0);
});

test("fusionne fait l'union de deux listes d'identifiants disjoints", () => {
  const a = [entree({ id: "h-1", titre: "A" })];
  const b = [entree({ id: "h-2", titre: "B" })];
  assert.equal(fusionne(a, b).length, 2);
});

test("fusionne garde la version au modifie le plus récent", () => {
  const a = [entree({ id: "h-1", titre: "ancien", modifie: T0 - JOUR })];
  const b = [entree({ id: "h-1", titre: "nouveau", modifie: T0 })];
  assert.equal(fusionne(a, b)[0].titre, "nouveau");
  assert.equal(fusionne(b, a)[0].titre, "nouveau");
});

test("fusionne est idempotente", () => {
  const a = [entree({ id: "h-1", titre: "A" }), entree({ id: "h-2", titre: "B" })];
  const une = fusionne(a, a);
  assert.equal(une.length, 2);
  assert.equal(fusionne(une, une).length, 2);
});

test("fusionne retourne une liste triée", () => {
  const a = [entree({ id: "h-1", titre: "vieux", modifie: T0 - JOUR })];
  const b = [entree({ id: "h-2", titre: "neuf", modifie: T0 })];
  assert.equal(fusionne(a, b)[0].titre, "neuf");
});

test("valideImport accepte un fichier bien formé", () => {
  const resultat = valideImport({ version: VERSION, entrees: [{ url: "u", type: "exam" }] });
  assert.equal(resultat.ok, true);
  assert.equal(resultat.entrees.length, 1);
  assert.equal(resultat.entrees[0].type, "exam");
  assert.deepEqual(resultat.erreurs, []);
});

test("valideImport refuse un objet sans tableau d'entrées", () => {
  const resultat = valideImport({ version: VERSION });
  assert.equal(resultat.ok, false);
  assert.ok(resultat.erreurs[0].length > 0);
});

test("valideImport refuse une valeur qui n'est pas un objet", () => {
  assert.equal(valideImport(null).ok, false);
  assert.equal(valideImport("texte").ok, false);
});

test("valideImport refuse une version future", () => {
  const resultat = valideImport({ version: VERSION + 1, entrees: [] });
  assert.equal(resultat.ok, false);
});

test("valideImport écarte les entrées sans url mais garde les autres", () => {
  const resultat = valideImport({ version: VERSION, entrees: [{ url: "" }, { url: "u" }] });
  assert.equal(resultat.ok, true);
  assert.equal(resultat.entrees.length, 1);
  assert.equal(resultat.erreurs.length, 1);
});

test("valideImport refuse un fichier dont aucune entrée n'est exploitable", () => {
  const resultat = valideImport({ version: VERSION, entrees: [{ url: "" }] });
  assert.equal(resultat.ok, false);
});
```

- [ ] **Step 2 : Lancer les tests pour vérifier qu'ils échouent**

Run: `node --test src/js/mods/historiqueDef.test.mjs`
Expected: FAIL — `SyntaxError` sur l'import de `filtre` (export inexistant).

- [ ] **Step 3 : Compléter `historiqueDef.js`**

Ajouter à la fin du fichier :

```js
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

/** Épinglés d'abord, puis du plus récemment modifié au plus ancien. */
export function trie(entrees) {
  return [...entrees].sort((a, b) => {
    if (a.epingle !== b.epingle) return a.epingle ? -1 : 1;
    return b.modifie - a.modifie;
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

/**
 * Entrées candidates au nettoyage. Les épinglées ne le sont jamais : épingler
 * est justement la façon de dire « celle-ci, je la garde ».
 */
export function anciennes(entrees, mois, maintenant = Date.now()) {
  const limite = new Date(maintenant);
  limite.setMonth(limite.getMonth() - mois);
  return entrees.filter((entree) => !entree.epingle && entree.modifie < limite.getTime());
}

/**
 * Réunit deux listes par identifiant : à id égal, la version modifiée le plus
 * récemment gagne. C'est cette fonction qui fera converger deux postes au
 * lot 2 (synchronisation nuage), là où qcmcam2 doit écraser faute
 * d'identifiants stables partagés.
 */
export function fusionne(entreesA, entreesB) {
  const parId = new Map();
  for (const entree of [...entreesA, ...entreesB]) {
    const connue = parId.get(entree.id);
    if (connue === undefined || entree.modifie > connue.modifie) parId.set(entree.id, entree);
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
    if (typeof source.url !== "string" || source.url === "") {
      erreurs.push("Entrée n°" + (rang + 1) + " ignorée : aucune adresse.");
      return;
    }
    entrees.push(normalise(source));
  });
  if (entrees.length === 0) {
    erreurs.push("Aucune entrée exploitable dans ce fichier.");
    return { ok: false, entrees: [], erreurs };
  }
  return { ok: true, entrees, erreurs };
}
```

- [ ] **Step 4 : Lancer les tests pour vérifier qu'ils passent**

Run: `npm test`
Expected: PASS — les tests de la tâche 1, ceux de celle-ci, et les tests parkour existants.

- [ ] **Step 5 : Commit**

```bash
git add src/js/mods/historiqueDef.js src/js/mods/historiqueDef.test.mjs
git commit -m "feat(historique): filtrage, tri, groupement, fusion et validation d'import"
```

---

### Task 3 : stockage et migration depuis l'ancien HTML

**Files:**
- Create: `src/js/mods/historique.js`

**Interfaces:**
- Consumes: tout `historiqueDef.js`.
- Produces (moitié stockage du mod, export par défaut `historique`) :
  - `historique.charger(): Entree[]`
  - `historique.sauver(): boolean`
  - `historique.ajouter({ type, url, urlSansGraine, paniers, titre }): Entree`
  - `historique.renommer(id, titre): void`
  - `historique.epingler(id): void`
  - `historique.supprimer(ids: string[]): Entree[]` — retourne les entrées retirées, pour l'annulation
  - `historique.restaurer(entrees: Entree[]): void`
  - `historique.vider(): void`
  - `historique.nettoyerAnciens(mois): number`
  - `historique.exporterJSON(): string`
  - `historique.importerJSON(texteOuHtml, mode): { ok, ajoutees, erreurs }` — `mode` vaut `"fusion"` ou `"remplacement"`
  - `historique.entreesDepuisHTML(html): Entree[]` — conversion de l'ancien format, partagée par la migration et l'import de fichiers `.html`

Cette tâche ne touche à aucun affichage. La migration s'y trouve parce qu'elle produit des données, pas du DOM.

- [ ] **Step 1 : Écrire `historique.js`, moitié stockage**

```js
/**
 * Historique des paniers : stockage local, migration depuis l'ancien format,
 * rendu de l'onglet.
 *
 * Avant, l'historique ÉTAIT le innerHTML de sa propre liste
 * (localStorage "history"). Il est désormais une liste d'objets sous la clé
 * "mm-historique-v2" ; la logique pure vit dans historiqueDef.js, testée au
 * `node --test`.
 *
 * Ce module n'importe PAS MM.js : les actions « éditer » et « panier »
 * remontent par les rappels passés à monter(), pour éviter un cycle d'import.
 */
import utils from "./utils.js";
import {
  VERSION,
  TYPES,
  cree,
  normalise,
  compte,
  filtre,
  trie,
  groupeParDate,
  anciennes,
  fusionne,
  valideImport,
  typeDepuisEmoji,
  parseDateFR,
} from "./historiqueDef.js";

const CLE = "mm-historique-v2";
const CLE_ANCIENNE = "history";
const CLE_MIGRE = "mm-historique-migre";
const CLE_CORROMPU = "mm-historique-v2-corrompu";
const MOIS_AVANT_NETTOYAGE = 6;

const historique = {
  entrees: [],
  chargee: false,

  /**
   * Lit le stockage, migre l'ancien historique au premier appel, et garde le
   * résultat en mémoire. Un JSON illisible ne vide jamais l'historique : il
   * est mis de côté sous une autre clé, en clair, pour pouvoir être récupéré.
   */
  charger() {
    if (this.chargee) return this.entrees;
    this.chargee = true;
    this.entrees = [];
    if (!window.localStorage) return this.entrees;
    const brut = localStorage.getItem(CLE);
    if (brut) {
      try {
        const objet = JSON.parse(brut);
        if (objet && Array.isArray(objet.entrees)) {
          this.entrees = objet.entrees.map((entree) => normalise(entree));
        }
      } catch (err) {
        localStorage.setItem(CLE_CORROMPU, brut);
        console.error("Historique illisible, mis de côté sous " + CLE_CORROMPU, err);
      }
    }
    if (localStorage.getItem(CLE_MIGRE) === null) {
      const migrees = this.migrerAncien();
      if (migrees.length > 0) {
        this.entrees = fusionne(this.entrees, migrees);
        this.sauver();
      }
      localStorage.setItem(CLE_MIGRE, String(Date.now()));
    }
    this.entrees = trie(this.entrees);
    return this.entrees;
  },

  /**
   * Lit l'ancienne clé et la convertit en entrées.
   *
   * L'ancienne clé "history" n'est ni supprimée ni réécrite : c'est le filet
   * de sécurité si cette conversion se révèle fautive.
   */
  migrerAncien() {
    return this.entreesDepuisHTML(localStorage.getItem(CLE_ANCIENNE));
  },

  /**
   * Convertit un blob HTML de l'ancien format en entrées. Le HTML est parsé
   * dans un document INERTE : il n'est jamais réinjecté dans la page vivante,
   * à la différence de l'ancien import. Sert à la migration comme à la
   * relecture d'un ancien fichier d'export .html.
   */
  entreesDepuisHTML(html) {
    if (!html) return [];
    const doc = new DOMParser().parseFromString("<ol>" + html + "</ol>", "text/html");
    const sorties = [];
    doc.querySelectorAll("li").forEach((li) => {
      const intitule = li.querySelector("span.bold");
      const liens = li.querySelectorAll("a[href]");
      const edition = li.querySelector("span[data-url]");
      const url = liens.length > 0 ? liens[0].getAttribute("href") : edition ? edition.dataset.url : "";
      if (!url) return;
      const texte = intitule ? intitule.textContent : "";
      const paniers = [];
      li.querySelectorAll("ul").forEach((ul) => {
        const titrePanier = ul.querySelector("span.bold");
        const activites = [];
        ul.querySelectorAll("li").forEach((ligne) => {
          activites.push({ id: "", titre: ligne.textContent.trim() });
        });
        paniers.push({ titre: titrePanier ? titrePanier.textContent.trim() : "", activites });
      });
      const quand = parseDateFR(texte, Date.now());
      const entree = normalise(
        {
          type: typeDepuisEmoji(texte.trim()),
          url,
          urlSansGraine: liens.length > 1 ? liens[1].getAttribute("href") : "",
          paniers,
          cree: quand,
          modifie: quand,
        },
        quand,
      );
      sorties.push(entree);
    });
    return sorties;
  },

  /** Écrit le stockage. Retourne false si le quota est atteint. */
  sauver() {
    if (!window.localStorage) return false;
    try {
      localStorage.setItem(CLE, JSON.stringify({ version: VERSION, entrees: this.entrees }));
      return true;
    } catch (err) {
      console.error("Historique non enregistré", err);
      this.signaler(
        "L’historique n’a pas pu être enregistré : l’espace de stockage du navigateur est plein. Supprimez des entrées anciennes pour libérer de la place.",
      );
      return false;
    }
  },

  /** Range une nouvelle entrée. À url identique, l'existante est mise à jour. */
  ajouter({ type, url, urlSansGraine, paniers, titre }) {
    this.charger();
    const existante = this.entrees.find((entree) => entree.url === url);
    if (existante !== undefined) {
      existante.modifie = Date.now();
      existante.urlSansGraine = urlSansGraine || existante.urlSansGraine;
      existante.paniers = cree({ type, url, paniers }).paniers;
      this.entrees = trie(this.entrees);
      this.sauver();
      return existante;
    }
    const entree = cree({ type, url, urlSansGraine, paniers, titre });
    this.entrees = trie([entree, ...this.entrees]);
    this.sauver();
    return entree;
  },

  renommer(id, titre) {
    const entree = this.charger().find((e) => e.id === id);
    if (entree === undefined) return;
    const propre = String(titre).trim();
    if (propre === "" || propre === entree.titre) return;
    entree.titre = propre;
    entree.modifie = Date.now();
    this.sauver();
  },

  epingler(id) {
    const entree = this.charger().find((e) => e.id === id);
    if (entree === undefined) return;
    entree.epingle = !entree.epingle;
    entree.modifie = Date.now();
    this.entrees = trie(this.entrees);
    this.sauver();
  },

  /** Retire des entrées et les retourne, pour permettre l'annulation. */
  supprimer(ids) {
    this.charger();
    const retirees = this.entrees.filter((entree) => ids.indexOf(entree.id) > -1);
    this.entrees = this.entrees.filter((entree) => ids.indexOf(entree.id) === -1);
    this.sauver();
    return retirees;
  },

  /** Remet en place des entrées supprimées (bouton « Annuler »). */
  restaurer(entrees) {
    this.charger();
    this.entrees = fusionne(this.entrees, entrees);
    this.sauver();
  },

  vider() {
    this.charger();
    this.entrees = [];
    this.sauver();
  },

  /** Supprime les entrées non épinglées de plus de N mois. Retourne le nombre retiré. */
  nettoyerAnciens(mois = MOIS_AVANT_NETTOYAGE) {
    const aRetirer = anciennes(this.charger(), mois);
    if (aRetirer.length === 0) return 0;
    this.supprimer(aRetirer.map((entree) => entree.id));
    return aRetirer.length;
  },

  /** Entrées candidates au nettoyage, pour l'avertissement de l'en-tête. */
  anciennes(mois = MOIS_AVANT_NETTOYAGE) {
    return anciennes(this.charger(), mois);
  },

  exporterJSON() {
    return JSON.stringify({ version: VERSION, entrees: this.charger() }, null, 2);
  },

  /**
   * Importe un fichier. Accepte le JSON du nouveau format et, pour ne perdre
   * aucune sauvegarde, les anciens exports .html, passés par le même parseur
   * inerte que la migration.
   */
  importerJSON(contenu, mode = "fusion") {
    this.charger();
    let resultat;
    const texte = String(contenu).trim();
    if (texte.startsWith("{")) {
      try {
        resultat = valideImport(JSON.parse(texte));
      } catch (err) {
        return { ok: false, ajoutees: 0, erreurs: ["Ce fichier n’est pas un historique lisible."] };
      }
    } else {
      // Ancien export .html : même parseur inerte que la migration, sans
      // jamais écrire dans la clé "history", qui reste intouchable.
      const entrees = this.entreesDepuisHTML(texte);
      resultat = {
        ok: entrees.length > 0,
        entrees,
        erreurs: entrees.length > 0 ? [] : ["Aucune entrée trouvée dans ce fichier."],
      };
    }
    if (!resultat.ok) return { ok: false, ajoutees: 0, erreurs: resultat.erreurs };
    const avant = this.entrees.length;
    this.entrees =
      mode === "remplacement" ? trie(resultat.entrees) : fusionne(this.entrees, resultat.entrees);
    this.sauver();
    return {
      ok: true,
      ajoutees: mode === "remplacement" ? this.entrees.length : this.entrees.length - avant,
      erreurs: resultat.erreurs,
    };
  },
};

export default historique;
```

`signaler()` est ajoutée à la tâche 4 (elle affiche un message dans l'onglet). En attendant, ajouter cette version provisoire **dans le même objet**, juste avant `exporterJSON` — elle sera remplacée, pas dupliquée :

```js
  /** Message à l'utilisateur. Remplacé par la version DOM à la tâche 4. */
  signaler(texte) {
    console.warn(texte);
  },
```

- [ ] **Step 2 : Vérifier le chargement du module dans le navigateur**

Ouvrir `src/index.html` avec Live Server, puis dans la console :

```js
const h = (await import("./js/mods/historique.js")).default;
h.charger();
```

Expected: un tableau. Si l'ancien historique existait, il contient une entrée par `<li>` d'origine, avec `titre`, `type`, `url`, `paniers` remplis, et `localStorage.getItem("history")` est **inchangée**.

- [ ] **Step 3 : Vérifier la migration sur un historique réel**

Toujours en console, avant d'ouvrir l'onglet :

```js
localStorage.removeItem("mm-historique-v2");
localStorage.removeItem("mm-historique-migre");
const h = (await import("./js/mods/historique.js")).default;
h.chargee = false;
console.table(h.charger().map((e) => ({ type: e.type, titre: e.titre, date: new Date(e.modifie).toLocaleString() })));
```

Expected: les types et dates correspondent à ce qu'affichait l'ancien onglet ; aucune entrée manquante.

- [ ] **Step 4 : Commit**

```bash
git add src/js/mods/historique.js
git commit -m "feat(historique): stockage JSON et migration de l'ancien format HTML"
```

---

### Task 4 : rendu de l'onglet

**Files:**
- Modify: `src/js/mods/historique.js`
- Modify: `src/index.html:1081-1094`
- Modify: `src/css/mathsmentales.css:425-438`

**Interfaces:**
- Consumes: la moitié stockage (tâche 3).
- Produces:
  - `historique.monter(section, { onEditer, onPanier }): void` — `section` est l'élément `#tab-historique` ; `onEditer(url)` et `onPanier(url)` sont fournis par `lib.mathsmentales.js` (tâche 5) et appellent `MM.checkURL(url, false, true)` et `MM.addAsCarts(url)`.
  - `historique.rendre(): void` — reconstruit la liste depuis l'état courant.
  - `historique.signaler(texte): void` — version DOM, remplace la version console de la tâche 3.
  - `historique.marquerBouton(type): void` — retour visuel « 📁 Copié ✅ » sur le bouton d'origine.

- [ ] **Step 1 : Réduire la section dans `index.html`**

Remplacer les lignes 1081-1094 (de `<section id="tab-historique"` jusqu'à `</section>` inclus) par :

```html
            <section id="tab-historique" class="tabs-content-item" role="tabpanel" aria-labelledby="tabbtn-historique"
                style="display: none;">
                <!-- Contenu construit par src/js/mods/historique.js (monter). -->
            </section>
```

L'`<input type="file" id="inputHistoryImport">` disparaît d'ici : le mod le crée lui-même.

- [ ] **Step 2 : Écrire le rendu dans `historique.js`**

Ajouter à l'objet `historique`, et remplacer la `signaler()` provisoire :

```js
  /* ---------------------------------------------------------------- vue */

  section: null,
  rappels: { onEditer: () => {}, onPanier: () => {} },
  recherche: "",
  typesActifs: [],
  selectionActive: false,
  aAnnuler: null,

  /** Construit l'onglet une fois pour toutes et pose la délégation de clic. */
  monter(section, rappels = {}) {
    this.section = section;
    this.rappels = Object.assign({ onEditer: () => {}, onPanier: () => {} }, rappels);
    this.charger();
    section.innerHTML = "";
    section.appendChild(this.construireEntete());
    section.appendChild(utils.create("div", { id: "hist-liste" }));
    section.appendChild(
      utils.create("div", { id: "hist-annonce", className: "hist-annonce", role: "status" }),
    );
    section.querySelector("#hist-annonce").setAttribute("aria-live", "polite");
    this.brancherEntete();
    section.querySelector("#hist-liste").addEventListener("click", (evt) => this.surClic(evt));
    this.rendre();
  },

  construireEntete() {
    const entete = utils.create("header", { className: "hist-entete" });
    entete.innerHTML = `
      <div class="hist-titre">
        <span>Historique des paniers</span>
        <span id="hist-compte" class="hist-compte"></span>
      </div>
      <div class="hist-outils">
        <label class="hist-recherche">
          <span aria-hidden="true">🔎</span>
          <input type="search" id="hist-input-recherche" placeholder="Rechercher…"
                 aria-label="Rechercher dans l’historique">
        </label>
        <select id="hist-filtre-type" aria-label="Filtrer par type"></select>
        <button type="button" id="hist-btn-selection" title="Sélectionner plusieurs éléments">☑ Sélectionner</button>
        <details class="hist-menu">
          <summary title="Autres actions">⋯</summary>
          <div class="hist-menu-contenu">
            <button type="button" id="hist-btn-export">💾 Exporter (JSON)</button>
            <button type="button" id="hist-btn-import">📂 Importer…</button>
            <hr>
            <button type="button" id="hist-btn-nettoyer" class="hist-danger">🧹 Nettoyer les entrées anciennes</button>
            <button type="button" id="hist-btn-vider" class="hist-danger">💥 Vider l’historique</button>
          </div>
        </details>
        <input type="file" id="hist-input-import" accept=".json,.html,application/json,text/html" class="hidden">
      </div>
      <div id="hist-actions-selection" class="hidden">
        Pour la sélection :
        <button type="button" id="hist-btn-suppr-selection">Supprimer</button>
      </div>
      <div id="hist-avertissement" class="hidden"></div>`;
    return entete;
  },

  brancherEntete() {
    const s = this.section;
    s.querySelector("#hist-input-recherche").addEventListener("input", (evt) => {
      this.recherche = evt.target.value;
      this.rendre();
    });
    s.querySelector("#hist-filtre-type").addEventListener("change", (evt) => {
      this.typesActifs = evt.target.value === "" ? [] : [evt.target.value];
      this.rendre();
    });
    s.querySelector("#hist-btn-selection").addEventListener("click", () => {
      this.selectionActive = !this.selectionActive;
      s.querySelector("#hist-actions-selection").className = this.selectionActive ? "" : "hidden";
      this.rendre();
    });
    s.querySelector("#hist-btn-suppr-selection").addEventListener("click", () => {
      const ids = [...s.querySelectorAll(".hist-case:checked")].map((c) => c.dataset.id);
      if (ids.length === 0) return;
      this.supprimerAvecAnnulation(ids);
    });
    s.querySelector("#hist-btn-export").addEventListener("click", () => this.telecharger());
    s.querySelector("#hist-btn-import").addEventListener("click", () =>
      s.querySelector("#hist-input-import").click(),
    );
    s.querySelector("#hist-input-import").addEventListener("change", (evt) => this.surFichier(evt));
    s.querySelector("#hist-btn-nettoyer").addEventListener("click", () => {
      const nombre = this.nettoyerAnciens();
      this.signaler(
        nombre === 0 ? "Aucune entrée à nettoyer." : nombre + " entrée(s) supprimée(s).",
      );
      this.rendre();
    });
    s.querySelector("#hist-btn-vider").addEventListener("click", () => {
      // Seule action assez massive pour mériter un vrai point d'arrêt.
      if (!window.confirm("Confirmez-vous la suppression de tout l’historique ?")) return;
      this.vider();
      this.rendre();
    });
  },

  /** Reconstruit la liste et l'en-tête variable depuis l'état courant. */
  rendre() {
    const s = this.section;
    if (s === null) return;
    const toutes = this.charger();
    const visibles = filtre(toutes, { recherche: this.recherche, types: this.typesActifs });
    s.querySelector("#hist-compte").textContent =
      toutes.length === 0 ? "" : toutes.length + (toutes.length > 1 ? " entrées" : " entrée");
    this.rendreFiltreTypes(toutes);
    this.rendreAvertissement();
    const liste = s.querySelector("#hist-liste");
    liste.innerHTML = "";
    if (visibles.length === 0) {
      liste.appendChild(this.construireVide(toutes.length === 0));
      return;
    }
    for (const groupe of groupeParDate(visibles, Date.now())) {
      liste.appendChild(utils.create("h3", { className: "hist-groupe", textContent: groupe.libelle }));
      const ol = utils.create("ol", { className: "hist-liste-groupe" });
      for (const entree of groupe.entrees) ol.appendChild(this.construireCarte(entree));
      liste.appendChild(ol);
    }
  },

  /** Le menu ne propose que les types réellement présents dans l'historique. */
  rendreFiltreTypes(entrees) {
    const select = this.section.querySelector("#hist-filtre-type");
    const presents = [...new Set(entrees.map((entree) => entree.type))];
    const choix = this.typesActifs[0] || "";
    select.innerHTML = "";
    select.appendChild(utils.create("option", { value: "", textContent: "Tous les types" }));
    for (const code of presents) {
      select.appendChild(
        utils.create("option", {
          value: code,
          textContent: TYPES[code].emoji + " " + TYPES[code].libelle,
        }),
      );
    }
    select.value = presents.indexOf(choix) > -1 ? choix : "";
  },

  rendreAvertissement() {
    const zone = this.section.querySelector("#hist-avertissement");
    const vieilles = this.anciennes();
    if (vieilles.length === 0) {
      zone.className = "hidden";
      zone.textContent = "";
      return;
    }
    zone.className = "hist-avertissement";
    zone.textContent = vieilles.length + " entrée(s) de plus de 6 mois · ";
    const bouton = utils.create("button", { type: "button", textContent: "Nettoyer" });
    bouton.addEventListener("click", () => {
      const nombre = this.nettoyerAnciens();
      this.signaler(nombre + " entrée(s) supprimée(s).");
      this.rendre();
    });
    zone.appendChild(bouton);
  },

  construireVide(historiqueVide) {
    const div = utils.create("div", { className: "hist-vide" });
    if (historiqueVide) {
      div.innerHTML = `<p>Votre historique est vide.</p>
        <p>Les boutons <b>« → Historique »</b> des onglets Paramétrer, Énoncés et Corrigés y rangent
        l’adresse de ce que vous venez de préparer, pour la retrouver plus tard.</p>`;
      return div;
    }
    div.appendChild(
      utils.create("p", { textContent: "Aucun résultat pour « " + this.recherche + " »." }),
    );
    const bouton = utils.create("button", { type: "button", textContent: "Effacer la recherche" });
    bouton.addEventListener("click", () => {
      this.recherche = "";
      this.typesActifs = [];
      this.section.querySelector("#hist-input-recherche").value = "";
      this.rendre();
    });
    div.appendChild(bouton);
    return div;
  },

  construireCarte(entree) {
    const type = TYPES[entree.type];
    const nombres = compte(entree);
    const li = utils.create("li", { className: "hist-carte" });
    li.dataset.id = entree.id;

    const ligne = utils.create("div", { className: "hist-carte-ligne" });
    if (this.selectionActive) {
      const case_ = utils.create("input", { type: "checkbox", className: "hist-case" });
      case_.dataset.id = entree.id;
      case_.setAttribute("aria-label", "Sélectionner " + entree.titre);
      ligne.appendChild(case_);
    }
    ligne.appendChild(
      utils.create("span", { className: "hist-icone", textContent: type.emoji, title: type.libelle }),
    );
    const titre = utils.create("span", {
      className: "hist-titre-entree",
      textContent: entree.titre,
      contentEditable: "true",
      title: "Cliquer pour renommer",
    });
    titre.dataset.action = "renommer";
    ligne.appendChild(titre);
    ligne.appendChild(
      utils.create("time", {
        className: "hist-date",
        textContent: this.dateRelative(entree.modifie),
        title: new Date(entree.modifie).toLocaleString("fr-FR"),
      }),
    );
    li.appendChild(ligne);

    const meta = [];
    if (nombres.activites > 0) meta.push(nombres.activites + " activité" + (nombres.activites > 1 ? "s" : ""));
    if (nombres.questions > 0) meta.push(nombres.questions + " questions");
    meta.push(type.libelle);
    li.appendChild(utils.create("div", { className: "hist-meta", textContent: meta.join(" · ") }));

    if (entree.paniers.length > 0) li.appendChild(this.construireDetail(entree));
    li.appendChild(this.construireActions(entree));
    return li;
  },

  construireDetail(entree) {
    const details = utils.create("details", { className: "hist-detail" });
    details.appendChild(utils.create("summary", { textContent: "Détail des paniers" }));
    const conteneur = utils.create("div", { className: "hist-paniers" });
    for (const panier of entree.paniers) {
      const bloc = utils.create("div", { className: "hist-panier" });
      bloc.appendChild(utils.create("b", { textContent: panier.titre }));
      const ul = utils.create("ul");
      for (const activite of panier.activites) {
        ul.appendChild(utils.create("li", { textContent: activite.titre }));
      }
      bloc.appendChild(ul);
      conteneur.appendChild(bloc);
    }
    details.appendChild(conteneur);
    return details;
  },

  construireActions(entree) {
    const zone = utils.create("div", { className: "hist-actions" });
    // Vrais liens : on doit pouvoir les ouvrir dans un nouvel onglet et copier
    // l'adresse au clic droit. Les seules actions qui ne sont pas des boutons.
    zone.appendChild(
      utils.create("a", { href: entree.url, className: "hist-lien", textContent: "🎯 Ouvrir" }),
    );
    if (entree.urlSansGraine !== "") {
      zone.appendChild(
        utils.create("a", {
          href: entree.urlSansGraine,
          className: "hist-lien",
          textContent: "🎲 Autres données",
        }),
      );
    }
    const actions = [
      ["editer", "🛠", "Modifier dans Paramétrer"],
      ["panier", "♻️", "Ajouter comme panier"],
      ["epingler", entree.epingle ? "📌" : "📍", entree.epingle ? "Désépingler" : "Épingler"],
      ["supprimer", "❌", "Supprimer"],
    ];
    for (const [action, icone, libelle] of actions) {
      const bouton = utils.create("button", {
        type: "button",
        className: "hist-action",
        textContent: icone,
        title: libelle,
      });
      bouton.dataset.action = action;
      bouton.setAttribute("aria-label", libelle + " : " + entree.titre);
      zone.appendChild(bouton);
    }
    return zone;
  },

  /**
   * Délégation unique. Les actions sont reconnues par data-action : l'ancien
   * code testait evt.target.innerHTML.indexOf("🛠 éditer"), ce qui cassait au
   * moindre changement de libellé.
   */
  surClic(evt) {
    const cible = evt.target.closest("[data-action]");
    if (cible === null) return;
    const carte = evt.target.closest(".hist-carte");
    if (carte === null) return;
    const id = carte.dataset.id;
    const entree = this.charger().find((e) => e.id === id);
    if (entree === undefined) return;
    switch (cible.dataset.action) {
      case "editer":
        this.rappels.onEditer(entree.url);
        break;
      case "panier":
        this.rappels.onPanier(entree.url);
        break;
      case "epingler":
        this.epingler(id);
        this.rendre();
        break;
      case "supprimer":
        this.supprimerAvecAnnulation([id]);
        break;
      case "renommer":
        this.brancherRenommage(cible, entree);
        break;
      default:
        break;
    }
  },

  /** Renommage en place : Entrée valide, Échap annule, la perte du focus valide. */
  brancherRenommage(champ, entree) {
    if (champ.dataset.enEdition === "1") return;
    champ.dataset.enEdition = "1";
    const initial = entree.titre;
    const valider = () => {
      champ.dataset.enEdition = "";
      this.renommer(entree.id, champ.textContent);
      this.rendre();
    };
    champ.addEventListener("blur", valider, { once: true });
    champ.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter") {
        evt.preventDefault();
        champ.blur();
      } else if (evt.key === "Escape") {
        champ.textContent = initial;
        champ.blur();
      }
    });
  },

  /**
   * Suppression annulable : un confirm() répétitif se valide en réflexe, une
   * annulation de six secondes protège mieux.
   */
  supprimerAvecAnnulation(ids) {
    const retirees = this.supprimer(ids);
    this.rendre();
    const zone = this.section.querySelector("#hist-annonce");
    zone.textContent = retirees.length + " entrée(s) supprimée(s) · ";
    const bouton = utils.create("button", { type: "button", textContent: "Annuler" });
    bouton.addEventListener("click", () => {
      this.restaurer(retirees);
      zone.textContent = "";
      zone.className = "hist-annonce";
      this.rendre();
    });
    zone.appendChild(bouton);
    zone.className = "hist-annonce hist-annonce-visible";
    if (this.aAnnuler !== null) clearTimeout(this.aAnnuler);
    this.aAnnuler = setTimeout(() => {
      zone.textContent = "";
      zone.className = "hist-annonce";
    }, 6000);
  },

  /** Message d'information dans l'onglet (remplace la version console). */
  signaler(texte) {
    if (this.section === null) {
      console.warn(texte);
      return;
    }
    const zone = this.section.querySelector("#hist-annonce");
    zone.textContent = texte;
    zone.className = "hist-annonce hist-annonce-visible";
    setTimeout(() => {
      zone.textContent = "";
      zone.className = "hist-annonce";
    }, 6000);
  },

  dateRelative(quand) {
    const ecart = Date.now() - quand;
    const heure = 3600 * 1000;
    if (ecart < heure) return "il y a " + Math.max(1, Math.round(ecart / 60000)) + " min";
    if (ecart < 24 * heure) return "il y a " + Math.round(ecart / heure) + " h";
    if (ecart < 48 * heure) return "hier " + new Date(quand).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    return new Date(quand).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  },

  telecharger() {
    const blob = new Blob([this.exporterJSON()], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = utils.create("a", { href: url, download: "mathsmentales-historique.json" });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  surFichier(evt) {
    const fichier = evt.target.files[0];
    if (!fichier) return;
    const lecteur = new FileReader();
    lecteur.onload = (fin) => {
      const remplacer = window.confirm(
        "Remplacer entièrement votre historique par ce fichier ?\n\n" +
          "OK : remplacer.\nAnnuler : fusionner avec l’historique existant (recommandé).",
      );
      const resultat = this.importerJSON(fin.target.result, remplacer ? "remplacement" : "fusion");
      this.signaler(
        resultat.ok
          ? resultat.ajoutees + " entrée(s) importée(s)." + (resultat.erreurs.length > 0 ? " " + resultat.erreurs.join(" ") : "")
          : resultat.erreurs.join(" "),
      );
      this.rendre();
    };
    lecteur.readAsText(fichier);
    evt.target.value = "";
  },

  /** Retour visuel sur le bouton « → Historique » qui vient d'être cliqué. */
  marquerBouton(type) {
    const cle = TYPES[type] !== undefined ? TYPES[type].bouton : "";
    const bouton = cle === "" ? null : document.getElementById(cle);
    const toast = document.getElementById("toast");
    if (toast !== null) {
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 3000);
    }
    if (bouton === null) return;
    bouton.innerHTML = bouton.innerHTML.replace("Historique", "📁 Copié ✅");
    setTimeout(() => {
      bouton.innerHTML = bouton.innerHTML.replace("📁 Copié ✅", "Historique");
    }, 3000);
  },
```

Retirer la `signaler()` provisoire de la tâche 3 (celle qui ne fait qu'un `console.warn`) : elle est remplacée par celle ci-dessus.

Compléter aussi l'appel dans `ajouter()` : ajouter `this.marquerBouton(codeType(type));` juste avant chaque `return`, et importer `codeType` depuis `historiqueDef.js`.

- [ ] **Step 3 : Écrire les styles**

Dans `src/css/mathsmentales.css`, remplacer les règles des lignes 425-438 (`#tab-historique ul`, `#tab-historique ol > li`, `.checkhistoric`) par :

```css
/* ---------------------------------------------- onglet Historique */
.hist-entete {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    margin-bottom: 1rem;
}
.hist-titre {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    font-weight: bold;
}
.hist-compte {
    font-weight: normal;
    opacity: 0.7;
}
.hist-outils {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}
.hist-recherche {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    flex: 1 1 14rem;
}
.hist-recherche input {
    width: 100%;
}
.hist-menu {
    position: relative;
}
.hist-menu > summary {
    cursor: pointer;
    padding: 0.2rem 0.6rem;
    list-style: none;
}
.hist-menu-contenu {
    position: absolute;
    right: 0;
    z-index: 5;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.2rem;
    padding: 0.5rem;
    background-color: #fff;
    border: 1px solid #999;
    border-radius: 5pt;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    white-space: nowrap;
}
.hist-menu-contenu .hist-danger {
    color: #a3170f;
}
.hist-avertissement {
    padding: 0.4rem 0.6rem;
    background-color: #fdf3d8;
    border-radius: 5pt;
}
.hist-groupe {
    margin: 1.2rem 0 0.4rem;
    font-size: 1rem;
    opacity: 0.75;
}
.hist-liste-groupe {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}
.hist-carte {
    padding: 0.5rem 0.7rem;
    background-color: #f6f6f6;
    border: 1px solid #d5d5d5;
    border-radius: 5pt;
}
.hist-carte-ligne {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.hist-titre-entree {
    flex: 1;
    font-weight: bold;
    padding: 0.1rem 0.3rem;
    border-radius: 3pt;
}
.hist-titre-entree:focus {
    background-color: #fff;
    outline: 2px solid #2b6cb0;
}
.hist-date {
    opacity: 0.7;
    white-space: nowrap;
}
.hist-meta {
    font-size: 0.9em;
    opacity: 0.75;
    margin: 0.15rem 0 0.3rem 1.7rem;
}
.hist-detail {
    margin-left: 1.7rem;
}
.hist-paniers {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}
.hist-panier ul {
    margin: 0.2rem 0 0 1rem;
    padding: 0;
}
.hist-actions {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
    margin: 0.4rem 0 0 1.7rem;
}
.hist-action {
    padding: 0.15rem 0.4rem;
}
.hist-vide {
    padding: 2rem 0;
    text-align: center;
    opacity: 0.85;
}
.hist-annonce {
    display: none;
}
.hist-annonce-visible {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.8rem;
    padding: 0.5rem 0.7rem;
    background-color: #e8f0fe;
    border-radius: 5pt;
}
@media screen and (max-width: 600px) {
    .hist-meta,
    .hist-detail,
    .hist-actions {
        margin-left: 0;
    }
    .hist-lien {
        font-size: 0.9em;
    }
}
```

- [ ] **Step 4 : Vérifier dans le navigateur**

Ouvrir `src/index.html` avec Live Server, console :

```js
const h = (await import("./js/mods/historique.js")).default;
h.monter(document.getElementById("tab-historique"), {
  onEditer: (u) => console.log("éditer", u),
  onPanier: (u) => console.log("panier", u),
});
```

Expected : l'onglet affiche les entrées migrées en cartes groupées par date, la recherche filtre à la frappe, le menu déroulant de types ne liste que les types présents, `📍` déplace l'entrée dans « 📌 Épinglés », `❌` la retire avec un bandeau « Annuler » qui la remet, et le renommage d'un titre survit à un rechargement de la page.

- [ ] **Step 5 : Commit**

```bash
git add src/js/mods/historique.js src/index.html src/css/mathsmentales.css
git commit -m "feat(historique): nouvelle présentation en cartes avec recherche et filtres"
```

---

### Task 5 : bascule de MM.js et câblage

**Files:**
- Modify: `src/js/mods/MM.js` (l.1564-1578, l.2885-3016, l.3018-3152)
- Modify: `src/js/lib.mathsmentales.js` (l.111-145, l.756-785, l.911-924)

**Interfaces:**
- Consumes: `historique.ajouter`, `historique.monter`, `historique.charger` (tâches 3 et 4).
- Produces: `MM.paniersVersDonnees(): [{ titre, activites: [{ id, titre, nbq }] }]`, `MM.copyURLtoHistory(type)` inchangée dans sa signature (appelée depuis dix-huit boutons).

- [ ] **Step 1 : Remplacer `getCartsContent` par `paniersVersDonnees`**

Dans `MM.js`, remplacer `getCartsContent` (l.1564-1578) par :

```js
  /**
   * Sérialise les paniers courants en objets simples, pour l'historique.
   * Remplace getCartsContent, qui fabriquait directement un <div> de <ul> :
   * l'historique stocke désormais des données, pas du HTML.
   */
  paniersVersDonnees: function () {
    return MM.carts.map((panier) => ({
      titre: panier.title,
      activites: panier.activities.map((activite) => ({
        id: activite.id,
        titre: activite.title,
        nbq: Number(activite.nbq),
      })),
    }));
  },
```

- [ ] **Step 2 : Réduire `copyURLtoHistory`**

Ajouter en tête de `MM.js`, avec les autres imports : `import historique from "./historique.js";`

Remplacer l'intégralité de `copyURLtoHistory` (l.2885-3016) par :

```js
  /**
   * Range l'adresse courante dans l'historique. Toute la mise en forme, le
   * stockage et le retour visuel sont dans le mod historique ; il ne reste ici
   * que la fabrication des deux URL, qui dépend des paniers vivants.
   */
  copyURLtoHistory(type = "") {
    const params = this.paramsToURL(true, type);
    const paramsSansGraine = this.paramsToURL(false, type);
    historique.ajouter({
      type,
      url: this.setURL(params, type),
      urlSansGraine: this.setURL(paramsSansGraine, type),
      paniers: this.paniersVersDonnees(),
    });
  },
```

- [ ] **Step 3 : Supprimer les fonctions devenues mortes**

Dans `MM.js`, supprimer `exportHistory`, `showInputImportHistory`, `importHistory`, `removeFromHistory`, `removeSelectionFromHistory`, `createSelectHistory`, `destroySelectHistory`, `emptyHistory` (l.3018-3152 dans la numérotation d'origine) ainsi que la propriété `historySelectCreated` si elle est déclarée ailleurs dans l'objet.

Run: `grep -n "History\|historic" src/js/mods/MM.js`
Expected: ne restent que `setHistory` (l.2414, c'est `history.pushState` du navigateur, sans rapport) et ses appelants.

- [ ] **Step 4 : Câbler depuis `lib.mathsmentales.js`**

Ajouter l'import en tête : `import historique from "./mods/historique.js";`

Remplacer le bloc de restauration (l.111-145, de `if (window.localStorage) {` contenant `localStorage.getItem("history")` jusqu'à la fin de la construction de `#liste-reprise`) par :

```js
  // Historique : le mod construit et gère tout l'onglet. Les deux actions qui
  // touchent aux paniers vivants lui sont passées en rappels, pour qu'il n'ait
  // pas à importer MM.js (cycle d'import).
  historique.monter(document.getElementById("tab-historique"), {
    onEditer: (url) => MM.checkURL(url, false, true),
    onPanier: (url) => MM.addAsCarts(url),
  });
  // L'historique était chargé sans jamais être proposé : il fallait penser à
  // ouvrir l'onglet pour retrouver la séance de la veille. Les trois dernières
  // deviennent des raccourcis sur l'accueil.
  const listeReprise = document.getElementById("liste-reprise");
  if (listeReprise !== null) {
    historique
      .charger()
      .slice(0, 3)
      .forEach((entree) => {
        const bouton = utils.create("button", {
          type: "button",
          className: "btn-plain",
          title: "Rouvrir cette sélection dans Paramétrer",
          textContent: entree.titre,
        });
        bouton.onclick = () => MM.checkURL(entree.url, false, true);
        const item = utils.create("li");
        item.appendChild(bouton);
        listeReprise.appendChild(item);
      });
    if (listeReprise.hasChildNodes())
      document.getElementById("reprise").classList.remove("hidden");
  }
```

L'enveloppe `<li>` et le dévoilement de `#reprise` sont repris à l'identique de l'original (`lib.mathsmentales.js:149-154`) : seule la **source** des données change ici, pas la présentation de l'accueil. Noter que le titre passe désormais par `textContent` (l'original utilisait `innerHTML` avec un `replace(/\s*:\s*$/, "")` pour retirer le « : » final du libellé ; ce nettoyage n'a plus lieu d'être, le titre étant une donnée propre).

- [ ] **Step 5 : Supprimer les anciens câblages**

Supprimer le bloc « boutons section historique » (l.756-785 : le `addEventListener` sur `#tab-historique header` et celui sur `#inputHistoryImport`) et le bloc `addEventListener` sur `#tab-historique ol` (l.911-924). Le mod pose lui-même ses écouteurs.

Run: `grep -n "tab-historique\|inputHistoryImport\|emptyHistory\|SelectHist" src/js/lib.mathsmentales.js`
Expected: seule la ligne `historique.monter(document.getElementById("tab-historique"), {` subsiste.

- [ ] **Step 6 : Recette manuelle complète**

Ouvrir `src/index.html` avec Live Server et vérifier, dans l'ordre :

1. L'onglet Historique affiche les entrées migrées.
2. Depuis Paramétrer, remplir un panier, cliquer « → Historique » : le bouton passe à « 📁 Copié ✅ » puis revient, le toast apparaît, l'entrée est en tête de l'onglet avec le bon type et le détail du panier.
3. Recommencer avec le même panier : aucune entrée en double, celle qui existe remonte en tête.
4. Ranger une fiche d'exercices, une interrogation et des cartes flash : chaque type a son icône, et le filtre les liste toutes les trois.
5. `🛠` rouvre la sélection dans Paramétrer ; `♻️` l'ajoute comme panier.
6. `🎯 Ouvrir` s'ouvre dans un nouvel onglet par un clic du milieu.
7. Recharger la page : titres renommés, épinglages et suppressions sont conservés.
8. Les trois raccourcis « reprendre » de l'accueil pointent sur les trois entrées les plus récentes.
9. Renommer une entrée en `<script>alert(1)</script>` : le texte s'affiche littéralement, aucune boîte de dialogue n'apparaît, et il survit tel quel à un rechargement.
10. Exporter en JSON, vider l'historique, réimporter le fichier en fusion : tout revient. Réimporter une seconde fois : aucun doublon (les `id` sont stables).
11. Importer un ancien fichier `mathsmentales-historique.html` produit par la version précédente : ses entrées apparaissent, avec leur type et leur date d'origine.

- [ ] **Step 7 : Commit**

```bash
git add src/js/mods/MM.js src/js/lib.mathsmentales.js
git commit -m "refactor(historique): sort l'historique de MM.js vers le mod dédié"
```

---

### Task 6 : documentation et vérifications finales

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-08-22-historique-design.md` (marquage du lot 1 comme livré)

- [ ] **Step 1 : Vérifier qu'aucune référence morte ne subsiste**

Run: `grep -rn "checkhistoric\|btnemptyhist\|btnSelectHist\|btnExportHist\|btnImportHist\|btnsupprselhist\|inputHistoryImport\|btntohistoric" src/`
Expected: seuls subsistent `btntohistoric` (classe des boutons « → Historique » d'Énoncés/Corrigés, toujours utilisée par `lib.mathsmentales.js:729`) et les ids `btn-*-copytohistoric` référencés par la table `TYPES`.

- [ ] **Step 2 : Vérifier la table des types contre les boutons réels**

Run: `grep -o 'id="btn[a-z-]*copytohistoric"' src/index.html | sort -u`
Expected: chaque id listé apparaît comme `bouton` dans `TYPES` (`src/js/mods/historiqueDef.js`). Corriger tout écart : un id absent de la table prive ce bouton de son retour visuel.

- [ ] **Step 3 : Vérifier que le bundle se construit toujours**

Run: `npx gulp maj-mathsmentales`
Expected: succès. (Non nécessaire au déploiement — `src/` est servi tel quel — mais un import cassé se verrait ici.)

- [ ] **Step 4 : Lancer la suite de tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5 : Documenter le format dans `README.md`**

Ajouter une section décrivant la clé `mm-historique-v2`, la forme d'une entrée, le fait que `history` est conservée en lecture seule comme filet de migration, et le format du fichier d'export JSON.

- [ ] **Step 6 : Marquer le lot 1 comme livré dans la spec**

En tête de `docs/superpowers/specs/2026-08-22-historique-design.md`, sous la date, ajouter : `Lot 1 livré le <date>. Lot 2 (synchronisation nuage) non commencé.`

- [ ] **Step 7 : Commit**

```bash
git add README.md docs/superpowers/specs/2026-08-22-historique-design.md
git commit -m "docs: décrit le format de stockage de l'historique"
```

---

## Ce que le lot 2 (nuage) trouvera prêt

Aucune tâche ci-dessus n'est à refaire pour la synchronisation WebDAV :

- `historiqueDef.fusionne(a, b)` **est** la règle de convergence entre deux postes (à `id` égal, `modifie` le plus récent gagne).
- `historiqueDef.valideImport(objet)` valide un fichier distant exactement comme un fichier local.
- `historique.exporterJSON()` produit le contenu de `MathsMentales/historique.json`.
- `historique.importerJSON(texte, "fusion")` est l'opération de synchronisation descendante, sans le réseau.

Le lot 2 ajoute : le portage de `proxy/nextcloud.php` depuis `qcmcam2`, un client WebDAV, un écran de configuration (URL de partage ou compte, mot de passe en `sessionStorage` par défaut), et deux boutons dans le menu `⋯` de l'en-tête.
