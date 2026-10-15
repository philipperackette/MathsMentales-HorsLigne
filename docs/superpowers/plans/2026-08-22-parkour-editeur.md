# Parkour MathsMentales — éditeur de parcours (V2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Donner au professeur une page qui construit, vérifie et diffuse un parcours Parkour complet, sans écrire de JSON et sans backend.

**Architecture:** Nouvelle app `parkoureditor` (`src/parkoureditor.html` + `src/js/lib.parkoureditor.js` + `src/css/parkoureditor.css`), sur le modèle une-app-par-page du dépôt. Le format du parcours (valeurs par défaut, normalisation, validation, encodage base64) est isolé dans un mod sans DOM et sans import, `src/js/mods/parkourDef.js`, testé au `node --test` et consommé par l'éditeur comme par le jeu. Le contenu d'une étape se saisit en collant un lien de partage MathsMentales, parsé par `utils.getUrlVars` puis vérifié par un `cart.import` réel.

**Tech Stack:** Modules ES vanilla, `node --test` (intégré, aucune dépendance nouvelle), Sortable (déjà vendoré dans `src/js/libs/sortable/`), Rollup/Gulp (pipeline inchangé).

**Spec:** `docs/superpowers/specs/2026-08-22-parkour-editeur-design.md`

## Global Constraints

- Toute l'interface et toutes les données sont en français.
- `src/js/mods/parkourDef.js` **n'importe rien**. Contrainte technique : `utils.js` importe MathLive, qui échoue au chargement hors navigateur (`HTMLElement is not defined`), donc tout mod important `utils` devient intestable au `node --test`.
- Le format V1 reste chargeable tel quel : `regles` absent ⇒ valeurs actuelles du moteur.
- Valeurs par défaut, inchangées depuis la V1 : `delaiDeblocageH: 12`, `verrouEchecH: 6`, `tentativesAvantVerrou: 3`, `seuilReussite: 8`, `nbQuestions: 10`. Score : 20 points par bonne réponse, 50 points de bonus temps maximum.
- Les délais du fichier parcours sont en **heures** (décimales acceptées), convertis en millisecondes par le code.
- Les ids d'étape existants ne sont jamais réattribués : ce sont les clés de progression des élèves dans `localStorage`.
- Aucun backend, aucun suivi professeur : tout vit dans le navigateur.
- Les 22 tests de `src/js/mods/parkourState.test.mjs` doivent rester verts sans modification de leurs assertions.
- Commande de test unique du dépôt : `npm test`.

---

## File Structure

- `src/js/mods/parkourDef.js` (créer) — `DEFAULT_REGLES`, `normalize`, `validate`, `countQuestions`, `encode`, `decode`. Aucun import, aucun accès au DOM.
- `src/js/mods/parkourDef.test.mjs` (créer) — tests `node --test` du mod ci-dessus.
- `src/js/mods/parkourState.js` (modifier) — lit ses paramètres depuis `parkourDef.normalize(parcoursDef).regles` ; expose `regles`, `unlockDelayMs()`, `maxScore()`.
- `src/js/mods/parkourState.test.mjs` (modifier) — ajouts pour les règles personnalisées.
- `src/js/lib.parkour.js` (modifier) — accepte `?d=<base64>`, supprime ses constantes dupliquées, tronque à `nbQuestions`, rend les textes venant du parcours en `textContent`.
- `src/parkoureditor.html` (créer) — squelette de la page éditeur.
- `src/css/parkoureditor.css` (créer) — styles de l'éditeur.
- `src/js/lib.parkoureditor.js` (créer) — état d'édition, rendu des quatre blocs, `panierFromUrl`, vérification de panier, export fichier/lien, brouillon.
- `gulpfile.cjs` (modifier) — `"parkoureditor"` ajouté au tableau `builds` (ligne 33-51).

---

### Task 1: `parkourDef` — valeurs par défaut, normalisation, comptage

**Files:**
- Créer : `src/js/mods/parkourDef.js`
- Créer : `src/js/mods/parkourDef.test.mjs`

**Interfaces:**
- Consomme : rien.
- Produit :
  - `DEFAULT_REGLES` : `{ delaiDeblocageH: 12, verrouEchecH: 6, tentativesAvantVerrou: 3, seuilReussite: 8, nbQuestions: 10 }`
  - `normalize(def: object|undefined) → { id: string, titre: string, regles: object, themes: Array, etapes: Array }`
  - `countQuestions(panier: object|undefined) → number`

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `src/js/mods/parkourDef.test.mjs` :

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_REGLES, normalize, countQuestions } from "./parkourDef.js";

function makeDef() {
  return {
    id: "test-parcours",
    titre: "Parcours de test",
    themes: [{ id: "nombres", label: "Nombres" }],
    etapes: [
      { id: "e1", theme: "nombres", titre: "Étape 1", support: "arbre", panier: { a: { 0: { i: "6NB1", t: 8, n: 10 } } } },
    ],
  };
}

test("normalize applique les règles par défaut si regles est absent", () => {
  const def = normalize(makeDef());
  assert.deepEqual(def.regles, DEFAULT_REGLES);
});

test("normalize fusionne des règles partielles avec les valeurs par défaut", () => {
  const source = makeDef();
  source.regles = { delaiDeblocageH: 0 };
  const def = normalize(source);
  assert.equal(def.regles.delaiDeblocageH, 0);
  assert.equal(def.regles.verrouEchecH, DEFAULT_REGLES.verrouEchecH);
  assert.equal(def.regles.nbQuestions, DEFAULT_REGLES.nbQuestions);
});

test("normalize convertit les règles écrites en chaîne", () => {
  const source = makeDef();
  source.regles = { seuilReussite: "7" };
  assert.equal(normalize(source).regles.seuilReussite, 7);
});

test("normalize ignore une règle non numérique", () => {
  const source = makeDef();
  source.regles = { seuilReussite: "beaucoup" };
  assert.equal(normalize(source).regles.seuilReussite, DEFAULT_REGLES.seuilReussite);
});

test("normalize accepte un délai décimal", () => {
  const source = makeDef();
  source.regles = { delaiDeblocageH: 0.25 };
  assert.equal(normalize(source).regles.delaiDeblocageH, 0.25);
});

test("normalize préserve les ids d'étape existants", () => {
  const def = normalize(makeDef());
  assert.equal(def.etapes[0].id, "e1");
});

test("normalize attribue un id aux étapes qui n'en ont pas, sans collision", () => {
  const source = makeDef();
  source.etapes = [
    { theme: "nombres", titre: "Sans id", panier: {} },
    { id: "e01", theme: "nombres", titre: "Avec id", panier: {} },
  ];
  const def = normalize(source);
  assert.equal(def.etapes[1].id, "e01");
  assert.notEqual(def.etapes[0].id, "e01");
  assert.ok(def.etapes[0].id.length > 0);
});

test("normalize garantit themes et etapes sur un objet vide", () => {
  const def = normalize({});
  assert.deepEqual(def.themes, []);
  assert.deepEqual(def.etapes, []);
  assert.equal(typeof def.id, "string");
  assert.equal(typeof def.titre, "string");
});

test("normalize ne modifie pas l'objet source", () => {
  const source = makeDef();
  normalize(source);
  assert.equal(source.regles, undefined);
});

test("countQuestions additionne les n des activités du panier", () => {
  assert.equal(countQuestions({ a: { 0: { i: "6NB1", n: 5 }, 1: { i: "6NC1", n: 5 } } }), 10);
});

test("countQuestions accepte des n en chaîne et renvoie 0 sur un panier vide", () => {
  assert.equal(countQuestions({ a: { 0: { i: "6NB1", n: "10" } } }), 10);
  assert.equal(countQuestions({}), 0);
  assert.equal(countQuestions(undefined), 0);
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Commande : `npm test`
Attendu : ÉCHEC, `Cannot find module .../src/js/mods/parkourDef.js`.

- [ ] **Step 3: Écrire l'implémentation**

Créer `src/js/mods/parkourDef.js` :

```js
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
 * Complète un parcours : règles fusionnées, themes/etapes garantis, ids
 * d'étape manquants attribués. Les ids existants sont préservés : ce sont les
 * clés de progression des élèves dans localStorage.
 * @param {object} def parcours brut (fichier, lien décodé ou état d'édition)
 * @returns {object} nouvelle définition complète, source non modifiée
 */
export function normalize(def) {
  const source = def || {};
  const regles = { ...DEFAULT_REGLES };
  const sourceRegles = source.regles || {};
  for (const key of Object.keys(DEFAULT_REGLES)) {
    if (sourceRegles[key] === undefined || sourceRegles[key] === "") continue;
    const value = Number(sourceRegles[key]);
    // une valeur illisible retombe sur le défaut plutôt que de casser le jeu
    if (!Number.isNaN(value)) regles[key] = value;
  }

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
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Commande : `npm test`
Attendu : SUCCÈS, les 22 tests de `parkourState` plus les 11 nouveaux.

- [ ] **Step 5: Commit**

```bash
git add src/js/mods/parkourDef.js src/js/mods/parkourDef.test.mjs
git commit -m "feat(parkour): mod parkourDef avec règles par défaut et normalisation"
```

---

### Task 2: `parkourDef` — validation et encodage du lien

**Files:**
- Modifier : `src/js/mods/parkourDef.js`
- Modifier : `src/js/mods/parkourDef.test.mjs`

**Interfaces:**
- Consomme : `normalize`, `countQuestions`, `DEFAULT_REGLES` de la tâche 1.
- Produit :
  - `validate(def: object) → { erreurs: string[], avertissements: string[] }`
  - `encode(def: object) → string` (base64 URL-safe, sans `=` final)
  - `decode(str: string) → object` (parcours normalisé ; lève `Error("lien de parcours invalide")`)

- [ ] **Step 1: Écrire les tests qui échouent**

Ajouter à la fin de `src/js/mods/parkourDef.test.mjs` (et compléter la ligne d'import en tête du fichier pour y ajouter `validate`, `encode`, `decode`) :

```js
test("validate n'a rien à signaler sur un parcours correct", () => {
  const rapport = validate(makeDef());
  assert.deepEqual(rapport.erreurs, []);
  assert.deepEqual(rapport.avertissements, []);
});

test("validate signale un parcours sans étape", () => {
  const rapport = validate({ id: "x", titre: "x", themes: [], etapes: [] });
  assert.equal(rapport.erreurs.length, 1);
  assert.match(rapport.erreurs[0], /aucune étape/);
});

test("validate signale un thème inconnu", () => {
  const source = makeDef();
  source.etapes[0].theme = "inexistant";
  const rapport = validate(source);
  assert.equal(rapport.erreurs.length, 1);
  assert.match(rapport.erreurs[0], /thème/i);
});

test("validate signale un panier vide", () => {
  const source = makeDef();
  source.etapes[0].panier = {};
  const rapport = validate(source);
  assert.equal(rapport.erreurs.length, 1);
  assert.match(rapport.erreurs[0], /panier/i);
});

test("validate signale un id d'étape en double", () => {
  const source = makeDef();
  source.etapes.push({ ...source.etapes[0], titre: "Doublon" });
  const rapport = validate(source);
  assert.equal(rapport.erreurs.length, 1);
  assert.match(rapport.erreurs[0], /double/i);
});

test("validate avertit d'un panier trop petit sans bloquer", () => {
  const source = makeDef();
  source.etapes[0].panier = { a: { 0: { i: "6NB1", n: 4 } } };
  const rapport = validate(source);
  assert.deepEqual(rapport.erreurs, []);
  assert.equal(rapport.avertissements.length, 1);
  assert.match(rapport.avertissements[0], /4/);
});

test("validate avertit d'un thème sans étape", () => {
  const source = makeDef();
  source.themes.push({ id: "geometrie", label: "Géométrie" });
  const rapport = validate(source);
  assert.deepEqual(rapport.erreurs, []);
  assert.equal(rapport.avertissements.length, 1);
  assert.match(rapport.avertissements[0], /Géométrie/);
});

test("validate tient compte d'un nbQuestions personnalisé", () => {
  const source = makeDef();
  source.regles = { nbQuestions: 20 };
  const rapport = validate(source);
  assert.equal(rapport.avertissements.length, 1);
});

test("encode puis decode restitue le parcours à l'identique", () => {
  const def = normalize(makeDef());
  const restitue = decode(encode(def));
  assert.deepEqual(restitue, def);
});

test("encode produit une chaîne utilisable telle quelle dans une URL", () => {
  const code = encode(normalize(makeDef()));
  assert.equal(code, encodeURIComponent(code));
});

test("encode/decode préservent accents et apostrophes", () => {
  const source = makeDef();
  source.titre = "Parcours 6e — révisions d'été";
  source.etapes[0].titre = "Écriture décimale « à trous »";
  const restitue = decode(encode(normalize(source)));
  assert.equal(restitue.titre, "Parcours 6e — révisions d'été");
  assert.equal(restitue.etapes[0].titre, "Écriture décimale « à trous »");
});

test("decode rejette une chaîne qui n'est pas un parcours", () => {
  assert.throws(() => decode("n'importe quoi"), /invalide/);
  assert.throws(() => decode(btoa("{\"a\":1}")), /invalide/);
});

test("decode normalise le parcours reçu", () => {
  const brut = { id: "x", titre: "x", themes: [], etapes: [{ theme: "t", titre: "Sans id", panier: {} }] };
  const restitue = decode(encode(brut));
  assert.deepEqual(restitue.regles, DEFAULT_REGLES);
  assert.ok(restitue.etapes[0].id.length > 0);
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Commande : `npm test`
Attendu : ÉCHEC, `validate is not a function` (ou `SyntaxError` sur l'import selon l'ordre d'évaluation).

- [ ] **Step 3: Écrire l'implémentation**

Ajouter à la fin de `src/js/mods/parkourDef.js` :

```js
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
  const themes = Array.isArray(source.themes) ? source.themes : [];
  const etapes = Array.isArray(source.etapes) ? source.etapes : [];
  const erreurs = [];
  const avertissements = [];

  if (etapes.length === 0) {
    erreurs.push("Le parcours ne contient aucune étape.");
  }

  const themeIds = new Set(themes.map((theme) => theme.id));
  const themesUtilises = new Set();
  const idsVus = new Set();

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
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Commande : `npm test`
Attendu : SUCCÈS, aucun échec.

- [ ] **Step 5: Commit**

```bash
git add src/js/mods/parkourDef.js src/js/mods/parkourDef.test.mjs
git commit -m "feat(parkour): validation et encodage base64 du parcours"
```

---

### Task 3: `parkourState` lit les règles du parcours

**Files:**
- Modifier : `src/js/mods/parkourState.js`
- Modifier : `src/js/mods/parkourState.test.mjs`

**Interfaces:**
- Consomme : `normalize` et `DEFAULT_REGLES` de la tâche 1.
- Produit :
  - `state.regles` — objet des cinq règles effectives
  - `state.unlockDelayMs()` → number (délai de déblocage en ms)
  - `state.maxScore()` → number (`nbQuestions × 20 + 50`)
  - Comportement inchangé quand `regles` est absent du parcours.

- [ ] **Step 1: Écrire les tests qui échouent**

Ajouter à la fin de `src/js/mods/parkourState.test.mjs` :

```js
test("les règles par défaut s'appliquent quand le parcours n'en définit pas", () => {
  const state = new ParkourState(makeParcours());
  assert.equal(state.regles.delaiDeblocageH, 12);
  assert.equal(state.regles.seuilReussite, 8);
  assert.equal(state.unlockDelayMs(), 12 * HOUR);
  assert.equal(state.maxScore(), 250);
});

test("un délai de déblocage nul rend l'étape suivante immédiatement disponible", () => {
  const parcours = makeParcours();
  parcours.regles = { delaiDeblocageH: 0 };
  let now = 1000;
  const state = new ParkourState(parcours, { now: () => now });
  state.recordAttempt("e1", { correctCount: 10, tempsReel: 60, tempsPrevu: 100 });
  assert.equal(state.getStatus("e2"), STATUS.AVAILABLE);
});

test("un seuil de réussite personnalisé change la validation de l'étape", () => {
  const parcours = makeParcours();
  parcours.regles = { seuilReussite: 6 };
  const state = new ParkourState(parcours);
  const result = state.recordAttempt("e1", { correctCount: 6, tempsReel: 60, tempsPrevu: 100 });
  assert.equal(result.passed, true);
  assert.equal(state.getStatus("e1"), STATUS.PASSED);
});

test("un verrou d'échec personnalisé s'applique après le nombre de tentatives indiqué", () => {
  const parcours = makeParcours();
  parcours.regles = { verrouEchecH: 1, tentativesAvantVerrou: 2 };
  let now = 1000;
  const state = new ParkourState(parcours, { now: () => now });
  state.recordAttempt("e1", { correctCount: 3, tempsReel: 60, tempsPrevu: 100 });
  assert.equal(state.getStatus("e1"), STATUS.AVAILABLE);
  state.recordAttempt("e1", { correctCount: 3, tempsReel: 60, tempsPrevu: 100 });
  assert.equal(state.getStatus("e1"), STATUS.LOCKED_FAIL);
  now += 1 * HOUR + 1;
  assert.equal(state.getStatus("e1"), STATUS.AVAILABLE);
});

test("maxScore suit le nombre de questions du parcours", () => {
  const parcours = makeParcours();
  parcours.regles = { nbQuestions: 5 };
  const state = new ParkourState(parcours);
  assert.equal(state.maxScore(), 150);
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Commande : `npm test`
Attendu : ÉCHEC, `state.unlockDelayMs is not a function`.

- [ ] **Step 3: Écrire l'implémentation**

Dans `src/js/mods/parkourState.js`, remplacer l'en-tête de constantes et le constructeur.

En tête de fichier, remplacer :

```js
const HOUR_MS = 60 * 60 * 1000;
const UNLOCK_DELAY_MS = 12 * HOUR_MS;
const FAIL_LOCK_MS = 6 * HOUR_MS;
const MAX_ATTEMPTS = 3;
const PASS_THRESHOLD = 8;
const POINTS_PER_CORRECT = 20;
const MAX_TIME_BONUS = 50;
```

par :

```js
import { normalize } from "./parkourDef.js";

const HOUR_MS = 60 * 60 * 1000;
// les seuils temporels et de réussite viennent désormais de parcoursDef.regles
// (voir parkourDef.DEFAULT_REGLES) ; le barème de points reste fixe
const POINTS_PER_CORRECT = 20;
const MAX_TIME_BONUS = 50;
```

Remplacer le constructeur par :

```js
  constructor(parcoursDef, { storage = null, now = () => Date.now() } = {}) {
    this.parcoursDef = normalize(parcoursDef);
    this.regles = this.parcoursDef.regles;
    this.storage = storage;
    this.now = now;
    this.etapes = {};
    this._initEtapes();
    this.load();
  }

  /** Délai de déblocage de l'étape suivante, en millisecondes. */
  unlockDelayMs() {
    return this.regles.delaiDeblocageH * HOUR_MS;
  }

  /** Durée du verrou après trop d'échecs, en millisecondes. */
  failLockMs() {
    return this.regles.verrouEchecH * HOUR_MS;
  }

  /** Score maximal atteignable sur une étape de ce parcours. */
  maxScore() {
    return this.regles.nbQuestions * POINTS_PER_CORRECT + MAX_TIME_BONUS;
  }
```

Dans `getStatus`, remplacer :

```js
    if (now < prevRecord.passedAt + UNLOCK_DELAY_MS) return STATUS.LOCKED_TIMER;
```

par :

```js
    if (now < prevRecord.passedAt + this.unlockDelayMs()) {
      return STATUS.LOCKED_TIMER;
    }
```

Dans `recordAttempt`, remplacer :

```js
    const passed = correctCount >= PASS_THRESHOLD;
```

par :

```js
    const passed = correctCount >= this.regles.seuilReussite;
```

et remplacer :

```js
      if (record.attemptsInWindow >= MAX_ATTEMPTS) {
        record.lockedUntil = now + FAIL_LOCK_MS;
      }
```

par :

```js
      if (record.attemptsInWindow >= this.regles.tentativesAvantVerrou) {
        record.lockedUntil = now + this.failLockMs();
      }
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Commande : `npm test`
Attendu : SUCCÈS. Les 22 tests d'origine passent sans modification, plus les 5 nouveaux.

- [ ] **Step 5: Commit**

```bash
git add src/js/mods/parkourState.js src/js/mods/parkourState.test.mjs
git commit -m "feat(parkour): règles de jeu réglables par parcours"
```

---

### Task 4: Le jeu accepte les liens `?d=` et durcit son affichage

**Files:**
- Modifier : `src/js/lib.parkour.js`

**Interfaces:**
- Consomme : `decode`, `normalize` de `parkourDef` ; `regles`, `unlockDelayMs()`, `maxScore()` de `ParkourState`.
- Produit : rien de nouveau pour les tâches suivantes ; l'éditeur s'appuiera sur l'URL `parkour.html?d=<code>` produite ici.

Aucun test automatisé : ce fichier touche le DOM, la vérification est manuelle, comme pour toute l'UI du dépôt.

- [ ] **Step 1: Brancher le décodage du lien et supprimer les constantes dupliquées**

Dans `src/js/lib.parkour.js`, ajouter aux imports en tête de fichier :

```js
import { decode as decodeParcours, normalize as normalizeParcours } from "./mods/parkourDef.js";
```

Supprimer les deux constantes devenues fausses dès que les règles changent :

```js
// même délai que ParkourState.getStatus (12 h après la réussite de l'étape précédente)
const UNLOCK_DELAY_MS = 12 * 3600 * 1000;
// score maximal d'une étape : 10 bonnes réponses × 20 points + 50 points de bonus temps
const MAX_ETAPE_SCORE = 250;
```

Dans `etapeDeadline`, une seule ligne change. Remplacer :

```js
      if (prev.passedAt !== null) return prev.passedAt + UNLOCK_DELAY_MS;
```

par :

```js
      if (prev.passedAt !== null) {
        return prev.passedAt + parkourState.unlockDelayMs();
      }
```

Remplacer `loadParcours` par :

```js
async function loadParcours() {
  const params = new URLSearchParams(window.location.search);
  // parcours auto-suffisant transmis dans le lien (produit par l'éditeur)
  const encoded = params.get("d");
  if (encoded) return decodeParcours(encoded);
  // en dev (Live Server sur src/), public/ n'est pas encore fusionné avec src/
  let source = "";
  if (location.hostname === "127.0.0.1") source = "../public/";
  const url = params.get("parcours") || source + "parkour/demo-6e.json";
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Impossible de charger le parcours : " + url);
  }
  return normalizeParcours(await response.json());
}
```

- [ ] **Step 2: Utiliser les règles dans la boucle de jeu**

Dans `startEtape`, remplacer le bloc de génération des questions par :

```js
  let tempsPrevu = 0;
  const actArray = [];
  panierCart.activities.forEach((activity, activityIndex) => {
    activity.generate(); // generate() appelle initialize() en interne
    for (let j = 0; j < activity.questions.length; j++) {
      actArray.push([activityIndex, j]);
    }
  });
  if (actArray.length === 0) {
    window.alert(
      "Impossible de préparer les questions de cette étape. Vérifie ta connexion puis réessaie.",
    );
    return;
  }
  // le panier peut fournir plus de questions que la règle du parcours n'en
  // demande : on tire au sort puis on tronque, et le temps prévu ne compte que
  // les questions réellement posées
  const selection = utils
    .shuffle(actArray)
    .slice(0, parkourState.regles.nbQuestions);
  for (const [activityIndex] of selection) {
    tempsPrevu += Number(panierCart.activities[activityIndex].tempo);
  }
```

puis, dans l'objet `currentGame`, remplacer `actArray: utils.shuffle(actArray),` par :

```js
    actArray: selection,
```

Dans `renderChemin`, remplacer `MAX_ETAPE_SCORE` par `parkourState.maxScore()`.

Dans `endEtape`, remplacer les libellés figés :

```js
  document.getElementById("parkour-fin-content").innerHTML =
    "<h2>" +
    (result.passed ? "Étape réussie !" : "Étape à retravailler") +
    "</h2><p>" +
    correctCount +
    " / " +
    parkourState.regles.nbQuestions +
    " bonnes réponses — score : " +
    result.score +
    " / " +
    parkourState.maxScore() +
    "</p><h3>Corrigé</h3>" +
    corrigeHtml(corrige) +
    "<button id=\"btn-retour-accueil\">Retour au parcours</button>";
```

(conserver la structure existante de la chaîne, seuls les deux nombres figés changent).

- [ ] **Step 3: Rendre en `textContent` les textes venant du parcours**

Un parcours reçu par lien peut venir de n'importe qui : les textes qu'il porte ne doivent jamais être interprétés comme du HTML.

Dans `renderThemes`, remplacer la création du label :

```js
    const label = utils.create("span", {
      className: "parkour-theme-label",
      textContent: theme.label + " : " + stars.passed + " / " + stars.total,
    });
```

et la barre d'étoiles :

```js
    const bar = utils.create("span", {
      className: "parkour-theme-stars",
      textContent:
        "★".repeat(stars.passed) + "☆".repeat(stars.total - stars.passed),
    });
```

Dans `renderChemin`, remplacer la construction par chaîne `content` et la carte par une construction par éléments :

```js
    const card = utils.create("div", {
      className: "parkour-etape " + status.toLowerCase().replace("_", "-"),
    });
    const titre = utils.create("strong");
    if (support !== undefined) {
      titre.appendChild(
        utils.create("span", {
          className: "parkour-etape-support",
          title: etape.support,
          textContent: support,
        }),
      );
    }
    titre.appendChild(document.createTextNode(etape.titre));
    card.appendChild(titre);
    card.appendChild(utils.create("br"));
    card.appendChild(document.createTextNode(STATUS_LABELS[status]));

    // échéance de déverrouillage / de nouvel essai
    const deadline = etapeDeadline(etape, status);
    if (deadline !== null) {
      const quand = new Date(deadline).toLocaleString("fr-FR");
      const intro =
        status === STATUS.LOCKED_FAIL
          ? "Nouvel essai possible le "
          : "Disponible le ";
      card.appendChild(
        utils.create("span", {
          className: "parkour-etape-deadline",
          textContent: intro + quand,
        }),
      );
    }

    // meilleur score obtenu sur cette étape
    const bestScore = parkourState.etapes[etape.id].bestScore;
    if (bestScore > 0) {
      card.appendChild(
        utils.create("span", {
          className: "parkour-etape-best",
          textContent:
            "Meilleur score : " + bestScore + "/" + parkourState.maxScore(),
        }),
      );
    }
```

Dans `renderAccueil`, remplacer le titre :

```js
  const title = utils.create("h1", { textContent: parkourDef.titre });
```

- [ ] **Step 4: Vérification manuelle dans le navigateur**

Ouvrir `src/parkour.html` avec Live Server.

1. Le parcours de démo s'affiche comme avant, thèmes, étapes et étoiles compris.
2. Jouer une étape : 10 questions, l'écran de fin affiche « X / 10 » et « / 250 ».
3. Dans la console : `location.search = "?d=" + <code>` où `<code>` est produit par
   ```js
   const { encode, normalize } = await import("./js/mods/parkourDef.js");
   const def = await (await fetch("../public/parkour/demo-6e.json")).json();
   def.regles = { delaiDeblocageH: 0, nbQuestions: 4 };
   encode(normalize(def));
   ```
   Vérifier : le parcours se charge depuis le lien, une étape ne pose que 4 questions, l'écran de fin affiche « / 4 » et « / 130 », et l'étape suivante est disponible immédiatement après réussite.
4. Reprendre le même code avec `def.titre = "<img src=x onerror=alert(1)>"` : le titre doit s'afficher littéralement, sans boîte de dialogue.

- [ ] **Step 5: Commit**

```bash
git add src/js/lib.parkour.js
git commit -m "feat(parkour): chargement par lien, règles du parcours et rendu sûr des textes"
```

---

### Task 5: Squelette de l'éditeur — en-tête, thèmes, règles

**Files:**
- Créer : `src/parkoureditor.html`
- Créer : `src/css/parkoureditor.css`
- Créer : `src/js/lib.parkoureditor.js`
- Modifier : `gulpfile.cjs`

**Interfaces:**
- Consomme : `DEFAULT_REGLES`, `normalize`, `validate` de `parkourDef` ; `utils` de `mods/utils.js`.
- Produit, pour les tâches 6 et 7 :
  - `let def` — état d'édition, toujours un parcours normalisé
  - `render()` — redessine toute la page depuis `def`
  - `sauverBrouillon()` — écrit `def` dans `localStorage` sous `parkour-editeur-brouillon`
  - `slugify(texte: string) → string`
  - conteneurs DOM : `#pe-entete`, `#pe-themes`, `#pe-regles`, `#pe-etapes`, `#pe-pied`

- [ ] **Step 1: Créer la page**

Créer `src/parkoureditor.html` :

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Éditeur de parcours — Parkour MathsMentales</title>
  <link rel="stylesheet" href="css/parkoureditor.css" />
</head>
<body>
  <div id="pe-app">
    <h1>Éditeur de parcours Parkour</h1>
    <section id="pe-entete"></section>
    <section id="pe-themes"></section>
    <section id="pe-regles"></section>
    <section id="pe-etapes"></section>
  </div>
  <footer id="pe-pied"></footer>
  <script type="module" src="js/lib.parkoureditor.js?v=2.4.5" id="mmscriptid"></script>
</body>
</html>
```

- [ ] **Step 2: Créer la feuille de style**

Créer `src/css/parkoureditor.css` :

```css
body {
  font-family: system-ui, sans-serif;
  margin: 0;
  padding: 0 0 6rem 0;
  background: #f7f7f7;
  color: #222;
}
#pe-app {
  max-width: 900px;
  margin: auto;
  padding: 1rem;
}
#pe-app section {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 0.8rem 1rem;
  margin-bottom: 1rem;
}
#pe-app h2 {
  font-size: 1.1rem;
  margin: 0 0 0.6rem 0;
}
.pe-champ {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}
.pe-champ label {
  min-width: 12rem;
}
.pe-champ input[type="text"] {
  flex: 1 1 16rem;
  padding: 0.3rem;
}
.pe-champ input[type="number"] {
  width: 6rem;
  padding: 0.3rem;
}
.pe-aide {
  font-size: 0.85rem;
  color: #555;
  margin: 0.2rem 0 0.6rem 0;
}
.pe-avertissement {
  color: #b35c00;
}
.pe-erreur {
  color: #c62828;
}
.pe-ok {
  color: #2a8f2a;
}
#pe-pied {
  position: sticky;
  bottom: 0;
  background: #fff;
  border-top: 2px solid #ddd;
  padding: 0.8rem 1rem;
}
#pe-pied ul {
  margin: 0 0 0.6rem 0;
  padding-left: 1.2rem;
}
button {
  padding: 0.35rem 0.7rem;
  cursor: pointer;
}
button[disabled] {
  cursor: not-allowed;
  opacity: 0.5;
}
```

- [ ] **Step 3: Écrire l'entrée de l'éditeur**

Créer `src/js/lib.parkoureditor.js` :

```js
import utils from "./mods/utils.js";
import { DEFAULT_REGLES, normalize, validate } from "./mods/parkourDef.js";

const BROUILLON_KEY = "parkour-editeur-brouillon";

const REGLES_LABELS = {
  delaiDeblocageH: "Délai avant l'étape suivante (heures)",
  verrouEchecH: "Verrou après échecs répétés (heures)",
  tentativesAvantVerrou: "Échecs consécutifs avant verrou",
  seuilReussite: "Bonnes réponses pour réussir une étape",
  nbQuestions: "Questions par étape",
};

/** État d'édition : toujours un parcours normalisé. */
let def = nouveauParcours();

function nouveauParcours() {
  return normalize({
    id: "mon-parcours",
    titre: "Mon parcours",
    themes: [{ id: "nombres", label: "Nombres et calculs" }],
    etapes: [],
  });
}

/** Transforme un titre en identifiant utilisable dans une clé de stockage. */
function slugify(texte) {
  return String(texte)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // retire les diacritiques isolés par NFD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function sauverBrouillon() {
  try {
    window.localStorage.setItem(BROUILLON_KEY, JSON.stringify(def));
  } catch {
    // quota plein ou stockage refusé : l'édition continue, sans filet
  }
}

function chargerBrouillon() {
  try {
    const brut = window.localStorage.getItem(BROUILLON_KEY);
    if (brut) def = normalize(JSON.parse(brut));
  } catch {
    def = nouveauParcours();
  }
}

/** Champ texte étiqueté, relié à une fonction de mise à jour. */
function champTexte(labelText, value, onChange) {
  const ligne = utils.create("div", { className: "pe-champ" });
  ligne.appendChild(utils.create("label", { textContent: labelText }));
  const input = utils.create("input", { type: "text", value: value });
  input.oninput = () => onChange(input.value);
  ligne.appendChild(input);
  return ligne;
}

function renderEntete() {
  const zone = document.getElementById("pe-entete");
  zone.innerHTML = "";
  zone.appendChild(utils.create("h2", { textContent: "Le parcours" }));

  zone.appendChild(
    champTexte("Titre affiché aux élèves", def.titre, (value) => {
      const ancienSlug = slugify(def.titre);
      def.titre = value;
      // tant que le prof n'a pas fixé l'identifiant à la main, il suit le titre
      if (def.id === ancienSlug || def.id === "mon-parcours") {
        def.id = slugify(value) || "mon-parcours";
        renderEntete();
      }
      sauverBrouillon();
      renderPied();
    }),
  );

  zone.appendChild(
    champTexte("Identifiant du parcours", def.id, (value) => {
      def.id = slugify(value);
      sauverBrouillon();
      renderPied();
    }),
  );
  zone.appendChild(
    utils.create("p", {
      className: "pe-aide pe-avertissement",
      textContent:
        "L'identifiant est la clé de progression des élèves : le modifier après diffusion remet leur progression à zéro.",
    }),
  );

  const actions = utils.create("div", { className: "pe-champ" });
  const btnNouveau = utils.create("button", { textContent: "Nouveau parcours" });
  btnNouveau.onclick = () => {
    if (!window.confirm("Abandonner le parcours en cours d'édition ?")) return;
    def = nouveauParcours();
    sauverBrouillon();
    render();
  };
  actions.appendChild(btnNouveau);
  zone.appendChild(actions);
}

function renderThemes() {
  const zone = document.getElementById("pe-themes");
  zone.innerHTML = "";
  zone.appendChild(utils.create("h2", { textContent: "Thèmes" }));
  zone.appendChild(
    utils.create("p", {
      className: "pe-aide",
      textContent:
        "Chaque thème donne une barre d'étoiles sur l'accueil du jeu.",
    }),
  );

  def.themes.forEach((theme, index) => {
    const ligne = utils.create("div", { className: "pe-champ" });
    const input = utils.create("input", { type: "text", value: theme.label });
    input.oninput = () => {
      theme.label = input.value;
      sauverBrouillon();
      renderPied();
    };
    ligne.appendChild(input);
    const btnSuppr = utils.create("button", { textContent: "Supprimer" });
    btnSuppr.onclick = () => {
      const utilise = def.etapes.filter((etape) => etape.theme === theme.id);
      if (utilise.length > 0) {
        window.alert(
          "Thème utilisé par : " +
            utilise.map((etape) => etape.titre || etape.id).join(", "),
        );
        return;
      }
      def.themes.splice(index, 1);
      sauverBrouillon();
      render();
    };
    ligne.appendChild(btnSuppr);
    zone.appendChild(ligne);
  });

  const btnAjout = utils.create("button", { textContent: "Ajouter un thème" });
  btnAjout.onclick = () => {
    const label = "Nouveau thème " + (def.themes.length + 1);
    def.themes.push({ id: slugify(label), label: label });
    sauverBrouillon();
    render();
  };
  zone.appendChild(btnAjout);
}

function renderRegles() {
  const zone = document.getElementById("pe-regles");
  zone.innerHTML = "";
  const details = utils.create("details");
  details.appendChild(
    utils.create("summary", { textContent: "Règles du jeu (avancé)" }),
  );
  details.appendChild(
    utils.create("p", {
      className: "pe-aide",
      textContent:
        "Laisser tel quel pour le comportement habituel. Mettre 0 heure de délai pour un parcours jouable en une seule séance.",
    }),
  );
  for (const key of Object.keys(DEFAULT_REGLES)) {
    const ligne = utils.create("div", { className: "pe-champ" });
    ligne.appendChild(utils.create("label", { textContent: REGLES_LABELS[key] }));
    const input = utils.create("input", {
      type: "number",
      min: "0",
      step: key.endsWith("H") ? "0.25" : "1",
      value: String(def.regles[key]),
    });
    input.oninput = () => {
      const value = Number(input.value);
      if (input.value !== "" && !Number.isNaN(value)) def.regles[key] = value;
      sauverBrouillon();
      renderPied();
    };
    ligne.appendChild(input);
    details.appendChild(ligne);
  }
  zone.appendChild(details);
}

/** Rendu du pied de page : rapport de validation. Complété en tâche 7. */
function renderPied() {
  const zone = document.getElementById("pe-pied");
  zone.innerHTML = "";
  const rapport = validate(def);
  if (rapport.erreurs.length === 0 && rapport.avertissements.length === 0) {
    zone.appendChild(
      utils.create("p", { className: "pe-ok", textContent: "Parcours prêt." }),
    );
    return;
  }
  const liste = utils.create("ul");
  for (const message of rapport.erreurs) {
    liste.appendChild(
      utils.create("li", { className: "pe-erreur", textContent: message }),
    );
  }
  for (const message of rapport.avertissements) {
    liste.appendChild(
      utils.create("li", { className: "pe-avertissement", textContent: message }),
    );
  }
  zone.appendChild(liste);
}

/** Rendu des étapes. Implémenté en tâche 6. */
function renderEtapes() {
  const zone = document.getElementById("pe-etapes");
  zone.innerHTML = "";
  zone.appendChild(utils.create("h2", { textContent: "Étapes" }));
}

function render() {
  renderEntete();
  renderThemes();
  renderRegles();
  renderEtapes();
  renderPied();
}

chargerBrouillon();
render();
```

- [ ] **Step 4: Déclarer l'app dans la chaîne de build**

Dans `gulpfile.cjs`, ajouter `"parkoureditor"` au tableau `builds` (ligne 33-51), juste après `"parkour"` :

```js
  "parkour",
  "parkoureditor",
];
```

- [ ] **Step 5: Vérifier que le bundle se construit**

Commande : `npx gulp minify-js-parkoureditor`
Attendu : succès, `public/js/lib.parkoureditor-<version>.js` produit.

- [ ] **Step 6: Vérification manuelle dans le navigateur**

Ouvrir `src/parkoureditor.html` avec Live Server.

1. Le titre saisi met à jour l'identifiant tant que celui-ci n'a pas été modifié à la main ; une fois l'identifiant édité, il cesse de suivre le titre.
2. Ajouter puis renommer un thème ; supprimer un thème inutilisé fonctionne.
3. Le bloc « Règles du jeu » est replié par défaut et affiche 12 / 6 / 3 / 8 / 10.
4. Le pied de page signale « Le parcours ne contient aucune étape. » en rouge.
5. Recharger la page : titre, thèmes et règles saisis sont restaurés depuis le brouillon.

- [ ] **Step 7: Commit**

```bash
git add src/parkoureditor.html src/css/parkoureditor.css src/js/lib.parkoureditor.js gulpfile.cjs
git commit -m "feat(parkoureditor): squelette de l'éditeur, en-tête, thèmes et règles"
```

---

### Task 6: Étapes — saisie par lien, vérification réelle, réordonnancement

**Files:**
- Modifier : `src/js/lib.parkoureditor.js`
- Modifier : `src/css/parkoureditor.css`

**Interfaces:**
- Consomme : `def`, `render`, `renderPied`, `sauverBrouillon`, `slugify` de la tâche 5 ; `countQuestions` de `parkourDef` ; `cart` de `mods/cart.js` ; `Sortable` de `libs/sortable/sortable.core.esm.js`.
- Produit, pour la tâche 7 : `def.etapes` peuplé et ordonné, chaque étape portant `{ id, theme, titre, support, panier }`.

- [ ] **Step 1: Compléter les imports et les constantes**

En tête de `src/js/lib.parkoureditor.js`, ajouter :

```js
import cart from "./mods/cart.js";
import Sortable from "./libs/sortable/sortable.core.esm.js";
import { countQuestions } from "./mods/parkourDef.js";
```

(`countQuestions` s'ajoute à l'import existant de `./mods/parkourDef.js` plutôt que de créer une seconde ligne d'import.)

Ajouter près de `REGLES_LABELS` :

```js
const SUPPORTS = [
  { value: "arbre", label: "🌳 Arbre" },
  { value: "toit", label: "🏠 Toit" },
  { value: "barre", label: "🤸 Barre" },
];

const MM_VERSION = utils.getVersion();
```

- [ ] **Step 2: Écrire l'extraction du panier depuis un lien MathsMentales**

Ajouter dans `src/js/lib.parkoureditor.js` :

```js
/**
 * Extrait le premier panier d'un lien de partage MathsMentales.
 * utils.getUrlVars attend un objet de type URL (il lit .search et .hash) et
 * renvoie vars.c, un objet de paniers indexés par id de panier.
 * @param {string} lien URL collée par le professeur
 * @returns {object} panier au format cart.import
 * @throws {Error} si le lien n'est pas exploitable
 */
function panierFromUrl(lien) {
  let url;
  try {
    url = new URL(String(lien).trim());
  } catch {
    throw new Error("Ce n'est pas une adresse valide.");
  }
  const vars = utils.getUrlVars(url);
  const paniers = vars && vars.c ? Object.values(vars.c) : [];
  if (paniers.length === 0) {
    throw new Error(
      "Ce lien ne contient aucun panier d'activités. Utilise le lien de partage d'un diaporama.",
    );
  }
  if (!paniers[0].a || Object.keys(paniers[0].a).length === 0) {
    throw new Error("Le panier de ce lien ne contient aucune activité.");
  }
  return paniers[0];
}

/**
 * Charge réellement les activités d'un panier pour vérifier qu'elles existent.
 * cart.import() avale ses propres erreurs et résout toujours : il faut
 * inspecter ce qui a été chargé (même précaution que lib.parkour.js).
 * @param {object} panier
 * @returns {Promise<{titres: string[], nbQuestions: number}>}
 */
async function verifierPanier(panier) {
  const panierCart = new cart(0);
  await panierCart.import(panier, false, MM_VERSION);
  const activities = panierCart.activities || [];
  const chargees = activities.filter((a) => a !== undefined);
  if (chargees.length === 0) {
    throw new Error(
      "Aucune activité n'a pu être chargée : identifiants inconnus ou connexion coupée.",
    );
  }
  const attendues = Object.keys(panier.a).length;
  if (chargees.length < attendues) {
    throw new Error(
      chargees.length + " activité(s) chargée(s) sur " + attendues + " attendue(s).",
    );
  }
  return {
    titres: chargees.map((a) => a.title),
    nbQuestions: countQuestions(panier),
  };
}
```

- [ ] **Step 3: Remplacer `renderEtapes` par le rendu complet des cartes**

Remplacer la fonction `renderEtapes` de la tâche 5 par :

```js
function nouvelleEtape() {
  const numero = def.etapes.length + 1;
  return {
    id: "e" + String(numero).padStart(2, "0"),
    theme: def.themes.length > 0 ? def.themes[0].id : "",
    titre: "Étape " + numero,
    support: SUPPORTS[(numero - 1) % SUPPORTS.length].value,
    panier: {},
    // lien conservé pour ré-affichage ; retiré à l'export
    lien: "",
  };
}

/** Une carte d'étape : titre, thème, support, lien, résumé, actions. */
function carteEtape(etape, index) {
  const carte = utils.create("div", { className: "pe-etape" });
  carte.dataset.index = String(index);

  const entete = utils.create("div", { className: "pe-etape-entete" });
  entete.appendChild(
    utils.create("span", {
      className: "pe-poignee",
      title: "Glisser pour réordonner",
      textContent: "⠿",
    }),
  );
  const inputTitre = utils.create("input", {
    type: "text",
    value: etape.titre || "",
  });
  inputTitre.oninput = () => {
    etape.titre = inputTitre.value;
    sauverBrouillon();
    renderPied();
  };
  entete.appendChild(inputTitre);

  const selectTheme = utils.create("select");
  for (const theme of def.themes) {
    const option = utils.create("option", {
      value: theme.id,
      textContent: theme.label,
    });
    if (theme.id === etape.theme) option.selected = true;
    selectTheme.appendChild(option);
  }
  selectTheme.onchange = () => {
    etape.theme = selectTheme.value;
    sauverBrouillon();
    renderPied();
  };
  entete.appendChild(selectTheme);

  const selectSupport = utils.create("select");
  for (const support of SUPPORTS) {
    const option = utils.create("option", {
      value: support.value,
      textContent: support.label,
    });
    if (support.value === etape.support) option.selected = true;
    selectSupport.appendChild(option);
  }
  selectSupport.onchange = () => {
    etape.support = selectSupport.value;
    sauverBrouillon();
  };
  entete.appendChild(selectSupport);
  carte.appendChild(entete);

  const ligneLien = utils.create("div", { className: "pe-champ" });
  const inputLien = utils.create("input", {
    type: "text",
    value: etape.lien || "",
    placeholder: "Coller ici le lien de partage MathsMentales",
  });
  inputLien.oninput = () => {
    etape.lien = inputLien.value;
    sauverBrouillon();
  };
  ligneLien.appendChild(inputLien);

  const resume = utils.create("div", { className: "pe-resume" });
  const nbDeclare = countQuestions(etape.panier);
  if (nbDeclare > 0) {
    resume.textContent = nbDeclare + " questions annoncées par le panier.";
  }

  const btnVerifier = utils.create("button", { textContent: "Vérifier" });
  btnVerifier.onclick = async () => {
    btnVerifier.disabled = true;
    resume.className = "pe-resume";
    resume.textContent = "Chargement des activités…";
    try {
      const panier = panierFromUrl(inputLien.value);
      const infos = await verifierPanier(panier);
      etape.panier = panier;
      etape.lien = inputLien.value;
      if (!etape.titre) etape.titre = panier.t || "";
      const manque = infos.nbQuestions < def.regles.nbQuestions;
      resume.className = "pe-resume " + (manque ? "pe-avertissement" : "pe-ok");
      resume.textContent =
        infos.titres.join(" · ") +
        " — " +
        infos.nbQuestions +
        " questions disponibles" +
        (manque ? " pour " + def.regles.nbQuestions + " demandées." : ".");
      sauverBrouillon();
      renderPied();
    } catch (err) {
      resume.className = "pe-resume pe-erreur";
      resume.textContent = err.message;
    } finally {
      btnVerifier.disabled = false;
    }
  };
  ligneLien.appendChild(btnVerifier);
  carte.appendChild(ligneLien);
  carte.appendChild(resume);

  const actions = utils.create("div", { className: "pe-etape-actions" });
  const btnDupliquer = utils.create("button", { textContent: "Dupliquer" });
  btnDupliquer.onclick = () => {
    const copie = JSON.parse(JSON.stringify(etape));
    copie.id = "";
    copie.titre = (etape.titre || "Étape") + " (copie)";
    def.etapes.splice(index + 1, 0, copie);
    def = normalize(def);
    sauverBrouillon();
    render();
  };
  const btnSupprimer = utils.create("button", { textContent: "Supprimer" });
  btnSupprimer.onclick = () => {
    if (!window.confirm("Supprimer « " + (etape.titre || etape.id) + " » ?")) {
      return;
    }
    def.etapes.splice(index, 1);
    sauverBrouillon();
    render();
  };
  actions.appendChild(btnDupliquer);
  actions.appendChild(btnSupprimer);
  carte.appendChild(actions);

  return carte;
}

function renderEtapes() {
  const zone = document.getElementById("pe-etapes");
  zone.innerHTML = "";
  zone.appendChild(utils.create("h2", { textContent: "Étapes" }));
  zone.appendChild(
    utils.create("p", {
      className: "pe-aide",
      textContent:
        "L'ordre des étapes définit les prérequis : une étape ne s'ouvre qu'après la précédente.",
    }),
  );

  const liste = utils.create("div", { id: "pe-etapes-liste" });
  def.etapes.forEach((etape, index) => {
    liste.appendChild(carteEtape(etape, index));
  });
  zone.appendChild(liste);

  if (def.etapes.length > 0) {
    new Sortable(liste, {
      animation: 150,
      handle: ".pe-poignee",
      onEnd: (evt) => {
        const [deplacee] = def.etapes.splice(evt.oldIndex, 1);
        def.etapes.splice(evt.newIndex, 0, deplacee);
        sauverBrouillon();
        render();
      },
    });
  }

  const btnAjout = utils.create("button", { textContent: "Ajouter une étape" });
  btnAjout.onclick = () => {
    def.etapes.push(nouvelleEtape());
    sauverBrouillon();
    render();
  };
  zone.appendChild(btnAjout);
}
```

- [ ] **Step 4: Ajouter les styles des cartes d'étape**

Ajouter à la fin de `src/css/parkoureditor.css` :

```css
.pe-etape {
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 0.6rem;
  margin-bottom: 0.6rem;
  background: #fafafa;
}
.pe-etape-entete {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 0.4rem;
}
.pe-etape-entete input[type="text"] {
  flex: 1 1 14rem;
  padding: 0.3rem;
}
.pe-poignee {
  cursor: grab;
  font-size: 1.2rem;
  color: #888;
}
.pe-etape-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.4rem;
}
.pe-resume {
  font-size: 0.9rem;
  color: #444;
  margin: 0.3rem 0;
}
```

- [ ] **Step 5: Vérification manuelle dans le navigateur**

Ouvrir `src/parkoureditor.html` avec Live Server. Préparer un lien : dans `src/index.html`, composer un panier avec une activité 6e (`n = 10`), copier le lien de partage.

1. *Ajouter une étape*, coller le lien, cliquer *Vérifier* : le titre de l'activité s'affiche en vert avec « 10 questions disponibles ».
2. Remplacer `n=10` par une activité à 4 questions dans le lien : le résumé passe en orange et mentionne « pour 10 demandées ».
3. Coller un lien sans panier (par exemple `https://www.mathsmentales.net/`) : message d'erreur rouge, l'étape n'est pas modifiée.
4. Coller un lien contenant un identifiant d'activité inexistant : message rouge sur les activités non chargées.
5. Ajouter trois étapes, les réordonner à la poignée ⠿ : l'ordre est conservé après rechargement de la page.
6. *Dupliquer* une étape : la copie apparaît juste en dessous, avec un identifiant différent ; le pied de page ne signale aucun doublon.

- [ ] **Step 6: Commit**

```bash
git add src/js/lib.parkoureditor.js src/css/parkoureditor.css
git commit -m "feat(parkoureditor): cartes d'étapes, vérification du panier et réordonnancement"
```

---

### Task 7: Import, export fichier, lien élève et test d'étape

**Files:**
- Modifier : `src/js/lib.parkoureditor.js`
- Modifier : `src/css/parkoureditor.css`

**Interfaces:**
- Consomme : `def`, `render`, `renderPied`, `sauverBrouillon` des tâches 5-6 ; `encode`, `decode`, `normalize`, `validate` de `parkourDef`.
- Produit : le fichier `.json` téléchargé et le lien `parkour.html?d=<code>`, tous deux consommés par le jeu de la tâche 4.

- [ ] **Step 1: Compléter les imports**

Dans `src/js/lib.parkoureditor.js`, compléter l'import de `./mods/parkourDef.js` pour qu'il expose aussi `encode` et `decode` :

```js
import {
  DEFAULT_REGLES,
  countQuestions,
  decode,
  encode,
  normalize,
  validate,
} from "./mods/parkourDef.js";
```

- [ ] **Step 2: Écrire la préparation du parcours diffusable**

Ajouter dans `src/js/lib.parkoureditor.js` :

```js
/**
 * Version diffusable du parcours : les champs de travail de l'éditeur
 * (le lien collé) ne partent pas chez les élèves.
 * @returns {object}
 */
function parcoursPublie() {
  const publie = normalize(def);
  publie.etapes = publie.etapes.map((etape) => {
    const copie = { ...etape };
    delete copie.lien;
    return copie;
  });
  return publie;
}

/** Déclenche le téléchargement d'un fichier texte généré côté navigateur. */
function telecharger(nomFichier, contenu) {
  const blob = new Blob([contenu], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const lien = utils.create("a", { href: url, download: nomFichier });
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  URL.revokeObjectURL(url);
}

/** URL du jeu portant le parcours complet dans son paramètre ?d=. */
function lienEleve() {
  const base = new URL("parkour.html", window.location.href);
  return base.href + "?d=" + encode(parcoursPublie());
}
```

- [ ] **Step 3: Ajouter les boutons d'export au pied de page**

Remplacer la fonction `renderPied` de la tâche 5 par :

```js
function renderPied() {
  const zone = document.getElementById("pe-pied");
  zone.innerHTML = "";
  const rapport = validate(def);

  if (rapport.erreurs.length === 0 && rapport.avertissements.length === 0) {
    zone.appendChild(
      utils.create("p", { className: "pe-ok", textContent: "Parcours prêt." }),
    );
  } else {
    const liste = utils.create("ul");
    for (const message of rapport.erreurs) {
      liste.appendChild(
        utils.create("li", { className: "pe-erreur", textContent: message }),
      );
    }
    for (const message of rapport.avertissements) {
      liste.appendChild(
        utils.create("li", {
          className: "pe-avertissement",
          textContent: message,
        }),
      );
    }
    zone.appendChild(liste);
  }

  const actions = utils.create("div", { className: "pe-champ" });
  const bloquant = rapport.erreurs.length > 0;

  const btnFichier = utils.create("button", {
    textContent: "Télécharger le fichier .json",
    disabled: bloquant,
  });
  btnFichier.onclick = () => {
    telecharger(
      (def.id || "parcours") + ".json",
      JSON.stringify(parcoursPublie(), null, 2),
    );
  };

  const btnLien = utils.create("button", {
    textContent: "Copier le lien élève",
    disabled: bloquant,
  });
  btnLien.onclick = async () => {
    const lien = lienEleve();
    try {
      await navigator.clipboard.writeText(lien);
      btnLien.textContent = "Lien copié !";
      setTimeout(() => {
        btnLien.textContent = "Copier le lien élève";
      }, 2000);
    } catch {
      window.prompt("Copie manuelle du lien :", lien);
    }
  };

  actions.appendChild(btnFichier);
  actions.appendChild(btnLien);
  zone.appendChild(actions);
}
```

- [ ] **Step 4: Ajouter l'import d'un parcours existant à l'en-tête**

Dans `renderEntete`, à la suite du bouton *Nouveau parcours*, ajouter dans le même conteneur `actions` :

```js
  const inputFichier = utils.create("input", {
    type: "file",
    accept: ".json,application/json",
    className: "pe-import-fichier",
  });
  inputFichier.onchange = async () => {
    const fichier = inputFichier.files[0];
    if (!fichier) return;
    try {
      def = normalize(JSON.parse(await fichier.text()));
      sauverBrouillon();
      render();
    } catch {
      window.alert("Ce fichier n'est pas un parcours lisible.");
    }
    inputFichier.value = "";
  };

  const btnImportFichier = utils.create("button", {
    textContent: "Importer un fichier",
  });
  btnImportFichier.onclick = () => inputFichier.click();

  const btnImportLien = utils.create("button", {
    textContent: "Importer un lien",
  });
  btnImportLien.onclick = () => {
    const saisi = window.prompt("Coller le lien élève d'un parcours :");
    if (!saisi) return;
    try {
      // on accepte aussi bien le lien complet que le seul code
      const match = saisi.match(/[?&]d=([^&\s]+)/);
      def = decode(match ? match[1] : saisi.trim());
      sauverBrouillon();
      render();
    } catch (err) {
      window.alert("Import impossible : " + err.message);
    }
  };

  actions.appendChild(btnImportFichier);
  actions.appendChild(btnImportLien);
  actions.appendChild(inputFichier);
```

- [ ] **Step 5: Ajouter le bouton *Tester* aux cartes d'étape**

Dans `carteEtape` (tâche 6), ajouter avant `btnDupliquer` :

```js
  const btnTester = utils.create("button", { textContent: "Tester" });
  btnTester.onclick = () => {
    if (countQuestions(etape.panier) === 0) {
      window.alert("Vérifie d'abord le lien de cette étape.");
      return;
    }
    // parcours jetable : id horodaté (progression isolée) et déblocage immédiat
    const essai = normalize({
      id: "parkour-test-" + Date.now(),
      titre: "Test : " + (etape.titre || "étape"),
      regles: { ...def.regles, delaiDeblocageH: 0 },
      themes: def.themes,
      etapes: [{ ...etape, lien: undefined }],
    });
    const base = new URL("parkour.html", window.location.href);
    window.open(base.href + "?d=" + encode(essai), "_blank");
  };
  actions.appendChild(btnTester);
```

- [ ] **Step 6: Ajouter le style de l'input fichier masqué**

Ajouter à la fin de `src/css/parkoureditor.css` :

```css
.pe-import-fichier {
  display: none;
}
```

- [ ] **Step 7: Vérification manuelle dans le navigateur**

Ouvrir `src/parkoureditor.html` avec Live Server.

1. Construire un parcours de deux étapes vérifiées, avec deux thèmes.
2. Tant qu'une erreur subsiste (thème inconnu, panier vide), les deux boutons d'export sont désactivés ; ils s'activent dès que le pied de page ne montre plus de rouge.
3. *Tester* sur la première étape : un onglet s'ouvre sur le jeu, l'étape se joue, et l'accueil du jeu porte le titre « Test : … ». Vérifier dans la console que `localStorage` contient une clé `parkour-progress-parkour-test-…` distincte des vrais parcours.
4. *Télécharger le fichier .json* : le fichier obtenu ne contient aucun champ `lien`, et s'ouvre dans le jeu via `parkour.html?parcours=<chemin du fichier>`.
5. *Copier le lien élève*, l'ouvrir dans un onglet privé : le parcours complet se charge, progression vierge.
6. *Importer un fichier* avec le `.json` téléchargé, puis *Importer un lien* avec le lien copié : dans les deux cas l'éditeur retrouve titre, thèmes, règles et étapes.
7. Recharger l'éditeur : le brouillon est restauré ; *Nouveau parcours* le remet à zéro après confirmation.

- [ ] **Step 8: Commit**

```bash
git add src/js/lib.parkoureditor.js src/css/parkoureditor.css
git commit -m "feat(parkoureditor): import, export fichier et lien élève, test d'étape"
```

---

### Task 8: Vérification d'ensemble

**Files:**
- Modifier si besoin : les fichiers des tâches 1 à 7 (corrections uniquement).

**Interfaces:**
- Consomme : tout ce qui précède.
- Produit : rien de nouveau.

- [ ] **Step 1: Lancer la suite de tests complète**

Commande : `npm test`
Attendu : SUCCÈS, aucun test en échec — 22 tests `parkourState` d'origine, 5 ajoutés, 23 tests `parkourDef`, plus les tests `demo-6e`.

- [ ] **Step 2: Vérifier que toute la chaîne de build passe**

Commande : `npx gulp minify-js-parkour && npx gulp minify-js-parkoureditor`
Attendu : succès des deux, sans avertissement Rollup sur un import introuvable.

- [ ] **Step 3: Vérifier la non-régression du parcours de démo**

Ouvrir `src/parkour.html` sans paramètre avec Live Server.
Attendu : accueil identique à avant la V2 — deux thèmes, douze étapes, la première disponible, les autres verrouillées ; une étape jouée pose 10 questions et affiche « / 250 ».

- [ ] **Step 4: Vérifier le parcours forgé**

Reprendre le scénario XSS de la tâche 4, étape 4 : un parcours dont le titre, un label de thème et un titre d'étape valent `<img src=x onerror=alert(1)>` doit afficher ces chaînes littéralement dans le jeu, sans aucune boîte de dialogue.

- [ ] **Step 5: Parcours complet de bout en bout**

Créer dans l'éditeur un parcours « en classe » : deux étapes vérifiées, `delaiDeblocageH: 0`, `nbQuestions: 5`, `seuilReussite: 4` (nécessaire depuis le durcissement de `validate()` : `seuilReussite` supérieur à `nbQuestions` déclaré est désormais une erreur bloquant l'export, et le défaut de 8 dépasse ce `nbQuestions` de 5). Copier le lien élève, l'ouvrir dans un onglet privé, réussir la première étape, vérifier que la seconde s'ouvre immédiatement et que l'écran de fin affiche « / 5 » et « / 150 ».

- [ ] **Step 6: Commit des éventuelles corrections**

```bash
git add -A
git commit -m "fix(parkour): corrections de la vérification d'ensemble V2"
```

(Ne rien committer si aucune correction n'a été nécessaire.)

---

## Post-plan (hors périmètre, suivi dans la spec)

Bibliothèque d'aide sur échec répété, parcours 5e/4e/brevet, suivi ou tableau de bord professeur, backend. Chacun fait l'objet d'une spec et d'un plan distincts — voir `docs/superpowers/specs/2026-08-22-parkour-editeur-design.md`.
