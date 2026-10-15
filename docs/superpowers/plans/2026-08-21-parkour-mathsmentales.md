# Parkour MathsMentales (moteur de jeu V1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable single-player "Parkour MathsMentales" game engine — a persistent, gamified progression through a sequence of automatisme drills, with autograded online questions, timers-gated unlocking, and a points score.

**Architecture:** New app entrypoint (`src/parkour.html` + `src/js/lib.parkour.js`), following the repo's one-app-per-HTML convention. Pure progression logic (status machine, scoring, persistence) isolated in a new DOM-free mod `src/js/mods/parkourState.js`, unit-tested with Node's built-in test runner. UI reuses existing shared mods unmodified: `activity.js` (question generation), `cart.js` (étape = a panier), `keyboard.js` + `analysereponse.js` (autograded input, same pattern as `lib.duel.js`).

**Tech Stack:** Vanilla ES modules, MathLive (`MathfieldElement`) for math input, `node --test` (built-in, Node ≥18, no new dependency) for the pure-logic module, Rollup/Gulp for bundling (unchanged pipeline).

**Spec:** `docs/superpowers/specs/2026-08-21-parkour-mathsmentales-design.md`

## Global Constraints

- Seuil de réussite d'une étape : **≥ 8 bonnes réponses sur 10**, indépendant du score.
- Délai de déblocage de l'étape suivante après réussite : **12h** (`UNLOCK_DELAY_MS = 12 * 3600 * 1000`), s'applique une seule fois au premier déblocage, jamais au rejeu.
- Tentatives glissantes avant verrou : **3 tentatives ratées consécutives** → verrou **6h** (`FAIL_LOCK_MS = 6 * 3600 * 1000`), compteur remis à 0 à la sortie du verrou.
- Score : **200 points base** (20 pts × 10 bonnes réponses) + **50 points bonus temps max** = **250 max**. Bonus = 50 si `tempsReel ≤ 0.5 × tempsPrevu`, dégressif linéaire jusqu'à 0 à `tempsReel ≥ tempsPrevu`. `tempsPrevu` = somme des `activity.tempo` (secondes) des questions tirées.
- Étape = un panier au format `cart.export()`/`cart.import()` existant (`src/js/mods/cart.js`) — aucun nouveau format d'activités.
- Stockage 100% navigateur (`localStorage`), clé `parkour-progress-<parcoursId>`. Aucun backend, aucun suivi professeur.
- Code de sauvegarde = base64 JSON, pour restaurer la progression sur un autre appareil.
- UI et données en français, cohérent avec le reste du site.
- Hors scope de ce plan (voir spec) : éditeur de parcours, bibliothèque d'aide, parcours 5e/4e/brevet, tout suivi serveur.

---

## File Structure

- `src/js/package.json` (create) — `{"type":"module"}`, scope Node's ESM loader over `src/js/**` so `node --test` can `import` the existing `.js` mods (root `package.json` is `"type":"commonjs"`, which would otherwise make Node's native loader reject `export default class` in a bare `.js` file). Does not affect Rollup (parses ESM itself) or browsers (ignore `package.json`) or `gulpfile.cjs` (already forced CommonJS by its `.cjs` extension).
- `src/js/mods/parkourState.js` (create) — `ParkourState` class: status machine, scoring, attempts/locks, persistence, save-code. No DOM access.
- `src/js/mods/parkourState.test.mjs` (create) — Node built-in test runner tests for the above.
- `public/parkour/demo-6e.json` (create) — demo parcours content, 12 étapes, real activity ids from `public/library/N6/`.
- `public/parkour/demo-6e.test.mjs` (create) — shape validation test for the JSON file.
- `src/parkour.html` (create) — single-page app markup (accueil + jeu views).
- `src/js/lib.parkour.js` (create) — entry: parcours loading, accueil rendering, game loop, save-code UI.
- `src/css/parkour.css` (create) — styling.
- `gulpfile.cjs` (modify) — add `"parkour"` to the `builds` array.
- `package.json` (modify) — add `"test": "node --test src/js/mods/*.test.mjs public/parkour/*.test.mjs"` script.

---

### Task 1: App scaffolding

**Files:**
- Create: `src/parkour.html`
- Create: `src/js/lib.parkour.js`
- Create: `src/css/parkour.css`
- Modify: `gulpfile.cjs` (add to `builds` array)

**Interfaces:**
- Produces: a loadable `src/parkour.html` page that imports `src/js/lib.parkour.js` as an ES module, and an entry in `gulpfile.cjs`'s `builds` array so `gulp maj-parkour` works. Later tasks add real content to `lib.parkour.js`; this task only needs a visible placeholder to prove the pipeline works.

- [ ] **Step 1: Create the HTML skeleton**

`src/parkour.html`:
```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Parkour MathsMentales</title>
  <link rel="stylesheet" href="css/parkour.css" />
</head>
<body>
  <div id="parkour-app">
    <section id="parkour-accueil">
      <h1>Parkour MathsMentales</h1>
      <div id="parkour-themes"></div>
      <div id="parkour-chemin"></div>
      <div id="parkour-accueil-actions">
        <button id="btn-commencer">Commencer</button>
        <button id="btn-continuer">Continuer</button>
        <button id="btn-reinitialiser">Réinitialiser</button>
      </div>
      <div id="parkour-savecode"></div>
    </section>
    <section id="parkour-jeu" class="hidden">
      <div id="parkour-progressquestion"></div>
      <div id="parkour-question"></div>
    </section>
    <section id="parkour-fin" class="hidden">
      <div id="parkour-fin-content"></div>
    </section>
  </div>
  <script type="module" src="js/lib.parkour.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create the CSS placeholder**

`src/css/parkour.css`:
```css
#parkour-app {
  max-width: 900px;
  margin: 0 auto;
  font-family: sans-serif;
}
.hidden {
  display: none;
}
#parkour-chemin {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.parkour-etape {
  border: 2px solid #999;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  text-align: center;
}
.parkour-etape.available {
  border-color: #2a8f2a;
  cursor: pointer;
}
.parkour-etape.passed {
  background: #e6f7e6;
  border-color: #2a8f2a;
}
.parkour-etape[class*="locked"] {
  opacity: 0.5;
}
```
`renderChemin()` (Task 7) sets the étape card's class to `"parkour-etape " + status.toLowerCase().replace("_", "-")`, i.e. `locked-prereq`, `locked-timer`, or `locked-fail` for the three locked statuses — the `[class*="locked"]` attribute selector matches all three without needing one rule per status.

- [ ] **Step 3: Create the entry stub**

`src/js/lib.parkour.js`:
```js
import { utils } from "./mods/utils.js";

const MM = {};
MM.version = utils.getVersion();

document.getElementById("parkour-accueil").innerHTML +=
  "<p>Chargement du parkour…</p>";
```

- [ ] **Step 4: Register the app in the gulp build**

Modify `gulpfile.cjs`, in the `builds` array:
```js
const builds = [
  "mathsmentales",
  "cartesflash",
  "ceinture",
  "courseauxnombres",
  "dominos",
  "duel",
  "editor",
  "editoryaml",
  "exam",
  "exercices",
  "wall",
  "puzzle",
  "diaporama",
  "jaiquia",
  "fichememo",
  "match",
  "parkour",
];
```

- [ ] **Step 5: Verify the build**

Run: `npx gulp maj-parkour`
Expected: completes without error, produces `public/js/lib.parkour-<version>.js` and `public/css/parkour-<version>.css`.

- [ ] **Step 6: Manual browser check**

Open `src/parkour.html` with Live Server (or Five Server). Expected: page loads, title "Parkour MathsMentales" visible, "Chargement du parkour…" text appears, no console errors.

- [ ] **Step 7: Commit**

```bash
git add src/parkour.html src/js/lib.parkour.js src/css/parkour.css gulpfile.cjs
git commit -m "feat(parkour): scaffold parkour app entrypoint"
```

---

### Task 2: ParkourState — status machine and theme stars

**Files:**
- Create: `src/js/package.json`
- Create: `src/js/mods/parkourState.js`
- Create: `src/js/mods/parkourState.test.mjs`
- Modify: `package.json` (add `test` script)

**Interfaces:**
- Produces: `export default class ParkourState`, `export const STATUS` (object with keys `LOCKED_PREREQ`, `LOCKED_TIMER`, `LOCKED_FAIL`, `AVAILABLE`, `PASSED`). Constructor: `new ParkourState(parcoursDef, { storage = null, now = () => Date.now() } = {})`. Methods this task adds: `getStatus(etapeId): string`, `getThemeStars(themeId): { passed: number, total: number }`. `parcoursDef` shape: `{ id: string, themes: [{id, label}], etapes: [{id, theme, titre, support, panier}] }`. Internal state shape (accessible directly for white-box testing): `this.etapes[etapeId] = { passedAt: number|null, attemptsInWindow: number, lockedUntil: number|null, bestScore: number }`.
- Consumes: nothing from other tasks.

- [ ] **Step 1: Scope Node's ESM loader over `src/js`**

Create `src/js/package.json`:
```json
{
  "type": "module"
}
```

- [ ] **Step 2: Add the `test` npm script**

Modify `package.json`, in `"scripts"`:
```json
  "scripts": {
    "build": "gulp",
    "test": "node --test src/js/mods/*.test.mjs public/parkour/*.test.mjs"
  },
```

- [ ] **Step 3: Write the failing test**

Create `src/js/mods/parkourState.test.mjs`:
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import ParkourState, { STATUS } from "./parkourState.js";

const HOUR = 60 * 60 * 1000;

function makeParcours() {
  return {
    id: "test-parcours",
    themes: [
      { id: "nombres", label: "Nombres" },
      { id: "geometrie", label: "Géométrie" },
    ],
    etapes: [
      { id: "e1", theme: "nombres", titre: "Étape 1", support: "arbre", panier: {} },
      { id: "e2", theme: "geometrie", titre: "Étape 2", support: "toit", panier: {} },
      { id: "e3", theme: "nombres", titre: "Étape 3", support: "barre", panier: {} },
    ],
  };
}

test("first étape is AVAILABLE by default", () => {
  const state = new ParkourState(makeParcours());
  assert.equal(state.getStatus("e1"), STATUS.AVAILABLE);
});

test("second étape is LOCKED_PREREQ when first not passed", () => {
  const state = new ParkourState(makeParcours());
  assert.equal(state.getStatus("e2"), STATUS.LOCKED_PREREQ);
});

test("second étape is LOCKED_TIMER right after first passed, AVAILABLE after 12h", () => {
  let now = 1_000_000;
  const state = new ParkourState(makeParcours(), { now: () => now });
  state.etapes.e1.passedAt = now;
  assert.equal(state.getStatus("e2"), STATUS.LOCKED_TIMER);
  now += 12 * HOUR - 1;
  assert.equal(state.getStatus("e2"), STATUS.LOCKED_TIMER);
  now += 2;
  assert.equal(state.getStatus("e2"), STATUS.AVAILABLE);
});

test("étape with lockedUntil in the future is LOCKED_FAIL", () => {
  let now = 1_000_000;
  const state = new ParkourState(makeParcours(), { now: () => now });
  state.etapes.e1.lockedUntil = now + HOUR;
  assert.equal(state.getStatus("e1"), STATUS.LOCKED_FAIL);
  now += HOUR + 1;
  assert.equal(state.getStatus("e1"), STATUS.AVAILABLE);
});

test("passed étape is always PASSED, even if it would otherwise be time-locked", () => {
  const state = new ParkourState(makeParcours());
  state.etapes.e1.passedAt = Date.now();
  assert.equal(state.getStatus("e1"), STATUS.PASSED);
});

test("getThemeStars counts passed étapes per theme", () => {
  const state = new ParkourState(makeParcours());
  assert.deepEqual(state.getThemeStars("nombres"), { passed: 0, total: 2 });
  state.etapes.e1.passedAt = Date.now();
  assert.deepEqual(state.getThemeStars("nombres"), { passed: 1, total: 2 });
  assert.deepEqual(state.getThemeStars("geometrie"), { passed: 0, total: 1 });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module './parkourState.js'` (or similar), since the module doesn't exist yet.

- [ ] **Step 5: Write the implementation**

Create `src/js/mods/parkourState.js`:
```js
const HOUR_MS = 60 * 60 * 1000;
const UNLOCK_DELAY_MS = 12 * HOUR_MS;

export const STATUS = {
  LOCKED_PREREQ: "LOCKED_PREREQ",
  LOCKED_TIMER: "LOCKED_TIMER",
  LOCKED_FAIL: "LOCKED_FAIL",
  AVAILABLE: "AVAILABLE",
  PASSED: "PASSED",
};

export default class ParkourState {
  constructor(parcoursDef, { storage = null, now = () => Date.now() } = {}) {
    this.parcoursDef = parcoursDef;
    this.storage = storage;
    this.now = now;
    this.etapes = {};
    this._initEtapes();
  }

  _initEtapes() {
    this.etapes = {};
    for (const etape of this.parcoursDef.etapes) {
      this.etapes[etape.id] = {
        passedAt: null,
        attemptsInWindow: 0,
        lockedUntil: null,
        bestScore: 0,
      };
    }
  }

  storageKey() {
    return "parkour-progress-" + this.parcoursDef.id;
  }

  getStatus(etapeId) {
    const record = this.etapes[etapeId];
    if (!record) throw new Error("étape inconnue: " + etapeId);
    const now = this.now();
    if (record.passedAt !== null) return STATUS.PASSED;
    if (record.lockedUntil !== null && now < record.lockedUntil) {
      return STATUS.LOCKED_FAIL;
    }
    const index = this.parcoursDef.etapes.findIndex((e) => e.id === etapeId);
    if (index === 0) return STATUS.AVAILABLE;
    const prevRecord = this.etapes[this.parcoursDef.etapes[index - 1].id];
    if (prevRecord.passedAt === null) return STATUS.LOCKED_PREREQ;
    if (now < prevRecord.passedAt + UNLOCK_DELAY_MS) return STATUS.LOCKED_TIMER;
    return STATUS.AVAILABLE;
  }

  getThemeStars(themeId) {
    const etapesTheme = this.parcoursDef.etapes.filter((e) => e.theme === themeId);
    const passed = etapesTheme.filter(
      (e) => this.etapes[e.id].passedAt !== null,
    ).length;
    return { passed, total: etapesTheme.length };
  }
}
```

Note: `load()` is not called from the constructor yet — Task 4 adds `load()`/`save()` and wires `load()` into the constructor. Until then, `storage` is accepted but unused (harmless for this task's tests, which never pass a `storage`).

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test`
Expected: PASS, 6 tests green.

- [ ] **Step 7: Commit**

```bash
git add src/js/package.json src/js/mods/parkourState.js src/js/mods/parkourState.test.mjs package.json
git commit -m "feat(parkour): add ParkourState status machine and theme stars"
```

---

### Task 3: ParkourState — scoring, attempts, and fail-lock

**Files:**
- Modify: `src/js/mods/parkourState.js`
- Modify: `src/js/mods/parkourState.test.mjs`

**Interfaces:**
- Consumes: `ParkourState` from Task 2 (constructor, `this.etapes`, `this.now`).
- Produces: `computeScore(correctCount, tempsReel, tempsPrevu): { base: number, bonus: number, total: number }`, `recordAttempt(etapeId, { correctCount, tempsReel, tempsPrevu }): { passed: boolean, score: number }`. Later tasks (game loop, Task 8) call `recordAttempt` after each étape's 10 questions.

- [ ] **Step 1: Write the failing tests**

Append to `src/js/mods/parkourState.test.mjs`:
```js
test("computeScore: full time bonus at or under 50% of tempsPrevu", () => {
  const state = new ParkourState(makeParcours());
  assert.deepEqual(state.computeScore(10, 40, 80), { base: 200, bonus: 50, total: 250 });
  assert.deepEqual(state.computeScore(10, 0, 80), { base: 200, bonus: 50, total: 250 });
});

test("computeScore: no bonus at or over 100% of tempsPrevu", () => {
  const state = new ParkourState(makeParcours());
  assert.deepEqual(state.computeScore(10, 80, 80), { base: 200, bonus: 0, total: 200 });
  assert.deepEqual(state.computeScore(10, 120, 80), { base: 200, bonus: 0, total: 200 });
});

test("computeScore: linear taper between 50% and 100%", () => {
  const state = new ParkourState(makeParcours());
  // ratio 0.75 -> halfway between 50 and 0 -> 25
  assert.deepEqual(state.computeScore(10, 60, 80), { base: 200, bonus: 25, total: 225 });
});

test("computeScore: base only, tempsPrevu of 0 guards against division by zero", () => {
  const state = new ParkourState(makeParcours());
  assert.deepEqual(state.computeScore(7, 0, 0), { base: 140, bonus: 0, total: 140 });
});

test("recordAttempt: 8/10 or more passes and unlocks, only sets passedAt once", () => {
  let now = 1_000_000;
  const state = new ParkourState(makeParcours(), { now: () => now });
  const result = state.recordAttempt("e1", { correctCount: 8, tempsReel: 40, tempsPrevu: 80 });
  assert.deepEqual(result, { passed: true, score: 210 });
  assert.equal(state.etapes.e1.passedAt, now);
  now += HOUR_MS_FOR_TEST;
  state.recordAttempt("e1", { correctCount: 10, tempsReel: 40, tempsPrevu: 80 });
  assert.equal(state.etapes.e1.passedAt, 1_000_000); // unchanged on replay
  assert.equal(state.etapes.e1.bestScore, 250); // best of the two attempts
});

test("recordAttempt: under 8/10 increments attempts, locks for 6h on the 3rd failure", () => {
  let now = 1_000_000;
  const state = new ParkourState(makeParcours(), { now: () => now });
  state.recordAttempt("e1", { correctCount: 5, tempsReel: 40, tempsPrevu: 80 });
  assert.equal(state.etapes.e1.attemptsInWindow, 1);
  assert.equal(state.etapes.e1.lockedUntil, null);
  state.recordAttempt("e1", { correctCount: 5, tempsReel: 40, tempsPrevu: 80 });
  assert.equal(state.etapes.e1.attemptsInWindow, 2);
  assert.equal(state.etapes.e1.lockedUntil, null);
  state.recordAttempt("e1", { correctCount: 5, tempsReel: 40, tempsPrevu: 80 });
  assert.equal(state.etapes.e1.attemptsInWindow, 3);
  assert.equal(state.etapes.e1.lockedUntil, now + 6 * HOUR_MS_FOR_TEST);
});

test("recordAttempt: throws while locked, resets counter once the lock expires", () => {
  let now = 1_000_000;
  const state = new ParkourState(makeParcours(), { now: () => now });
  for (let i = 0; i < 3; i++) {
    state.recordAttempt("e1", { correctCount: 0, tempsReel: 40, tempsPrevu: 80 });
  }
  assert.throws(() => state.recordAttempt("e1", { correctCount: 10, tempsReel: 10, tempsPrevu: 80 }));
  now += 6 * HOUR_MS_FOR_TEST + 1;
  state.recordAttempt("e1", { correctCount: 5, tempsReel: 40, tempsPrevu: 80 });
  assert.equal(state.etapes.e1.attemptsInWindow, 1);
  assert.equal(state.etapes.e1.lockedUntil, null);
});
```

Add the constant used above near the top of the test file (next to the existing `HOUR` constant):
```js
const HOUR_MS_FOR_TEST = HOUR;
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `state.computeScore is not a function`.

- [ ] **Step 3: Write the implementation**

Modify `src/js/mods/parkourState.js`: add constants near the top (after `UNLOCK_DELAY_MS`):
```js
const FAIL_LOCK_MS = 6 * HOUR_MS;
const MAX_ATTEMPTS = 3;
const PASS_THRESHOLD = 8;
const POINTS_PER_CORRECT = 20;
const MAX_TIME_BONUS = 50;
```

Add these two methods to the `ParkourState` class (after `getThemeStars`):
```js
  computeScore(correctCount, tempsReel, tempsPrevu) {
    const base = correctCount * POINTS_PER_CORRECT;
    let bonus = 0;
    if (tempsPrevu > 0) {
      const ratio = tempsReel / tempsPrevu;
      if (ratio <= 0.5) bonus = MAX_TIME_BONUS;
      else if (ratio < 1) bonus = (MAX_TIME_BONUS * (1 - ratio)) / 0.5;
    }
    bonus = Math.round(bonus);
    return { base, bonus, total: base + bonus };
  }

  recordAttempt(etapeId, { correctCount, tempsReel, tempsPrevu }) {
    const record = this.etapes[etapeId];
    if (!record) throw new Error("étape inconnue: " + etapeId);
    const now = this.now();
    if (record.lockedUntil !== null) {
      if (now < record.lockedUntil) {
        throw new Error("étape verrouillée jusqu'à " + record.lockedUntil);
      }
      record.lockedUntil = null;
      record.attemptsInWindow = 0;
    }
    const { total } = this.computeScore(correctCount, tempsReel, tempsPrevu);
    record.bestScore = Math.max(record.bestScore, total);
    const passed = correctCount >= PASS_THRESHOLD;
    if (passed) {
      if (record.passedAt === null) record.passedAt = now;
      record.attemptsInWindow = 0;
    } else {
      record.attemptsInWindow += 1;
      if (record.attemptsInWindow >= MAX_ATTEMPTS) {
        record.lockedUntil = now + FAIL_LOCK_MS;
      }
    }
    return { passed, score: total };
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS, all tests green (13 total).

- [ ] **Step 5: Commit**

```bash
git add src/js/mods/parkourState.js src/js/mods/parkourState.test.mjs
git commit -m "feat(parkour): add ParkourState scoring, attempts and fail-lock"
```

---

### Task 4: ParkourState — persistence and save-code

**Files:**
- Modify: `src/js/mods/parkourState.js`
- Modify: `src/js/mods/parkourState.test.mjs`

**Interfaces:**
- Consumes: `ParkourState` from Tasks 2–3.
- Produces: `load()`, `save()`, `reset()`, `exportCode(): string`, `importCode(code: string): void`. `load()` is now called from the constructor when `storage` is provided. `save()` is called automatically at the end of `recordAttempt` and `reset`. Task 6/9 (browser UI) will pass `window.localStorage` as `storage` and wire `exportCode`/`importCode` to buttons.

- [ ] **Step 1: Write the failing tests**

Append to `src/js/mods/parkourState.test.mjs`:
```js
function makeFakeStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, value),
    _map: map,
  };
}

test("save/load round-trip through the given storage", () => {
  const storage = makeFakeStorage();
  let now = 1_000_000;
  const state = new ParkourState(makeParcours(), { storage, now: () => now });
  state.recordAttempt("e1", { correctCount: 8, tempsReel: 40, tempsPrevu: 80 });

  const reloaded = new ParkourState(makeParcours(), { storage, now: () => now });
  assert.equal(reloaded.etapes.e1.passedAt, now);
  assert.equal(reloaded.etapes.e1.bestScore, 210);
});

test("reset clears progress and persists the cleared state", () => {
  const storage = makeFakeStorage();
  const state = new ParkourState(makeParcours(), { storage });
  state.recordAttempt("e1", { correctCount: 8, tempsReel: 40, tempsPrevu: 80 });
  state.reset();
  assert.equal(state.etapes.e1.passedAt, null);

  const reloaded = new ParkourState(makeParcours(), { storage });
  assert.equal(reloaded.etapes.e1.passedAt, null);
});

test("exportCode/importCode round-trip preserves progress", () => {
  const source = new ParkourState(makeParcours());
  source.recordAttempt("e1", { correctCount: 9, tempsReel: 20, tempsPrevu: 80 });
  const code = source.exportCode();

  const target = new ParkourState(makeParcours());
  target.importCode(code);
  assert.equal(target.etapes.e1.passedAt, source.etapes.e1.passedAt);
  assert.equal(target.etapes.e1.bestScore, source.etapes.e1.bestScore);
});

test("importCode rejects a code from a different parcours", () => {
  const source = new ParkourState({ ...makeParcours(), id: "other-parcours" });
  const code = source.exportCode();
  const target = new ParkourState(makeParcours());
  assert.throws(() => target.importCode(code), /autre parcours/);
});

test("importCode rejects garbage input", () => {
  const target = new ParkourState(makeParcours());
  assert.throws(() => target.importCode("not-base64-json"), /invalide/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `state.reset is not a function` (and similar for `exportCode`/`importCode`).

- [ ] **Step 3: Write the implementation**

Modify `src/js/mods/parkourState.js`:

Update the constructor to call `load()`:
```js
  constructor(parcoursDef, { storage = null, now = () => Date.now() } = {}) {
    this.parcoursDef = parcoursDef;
    this.storage = storage;
    this.now = now;
    this.etapes = {};
    this._initEtapes();
    this.load();
  }
```

Update `recordAttempt` to persist at the end, just before `return { passed, score: total };`:
```js
    this.save();
    return { passed, score: total };
```

Add these methods to the class (after `recordAttempt`):
```js
  load() {
    if (!this.storage) return;
    const raw = this.storage.getItem(this.storageKey());
    if (!raw) return;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }
    for (const etape of this.parcoursDef.etapes) {
      if (parsed[etape.id]) {
        this.etapes[etape.id] = { ...this.etapes[etape.id], ...parsed[etape.id] };
      }
    }
  }

  save() {
    if (!this.storage) return;
    this.storage.setItem(this.storageKey(), JSON.stringify(this.etapes));
  }

  reset() {
    this._initEtapes();
    this.save();
  }

  exportCode() {
    const payload = { parcoursId: this.parcoursDef.id, etapes: this.etapes };
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  }

  importCode(code) {
    let payload;
    try {
      payload = JSON.parse(decodeURIComponent(escape(atob(code))));
    } catch {
      throw new Error("code de sauvegarde invalide");
    }
    if (!payload || payload.parcoursId !== this.parcoursDef.id) {
      throw new Error("ce code vient d'un autre parcours");
    }
    const requiredKeys = ["passedAt", "attemptsInWindow", "lockedUntil", "bestScore"];
    for (const etape of this.parcoursDef.etapes) {
      const incoming = payload.etapes && payload.etapes[etape.id];
      if (!incoming) continue;
      if (!requiredKeys.every((k) => k in incoming)) {
        throw new Error("code de sauvegarde invalide");
      }
      this.etapes[etape.id] = {
        passedAt: incoming.passedAt,
        attemptsInWindow: incoming.attemptsInWindow,
        lockedUntil: incoming.lockedUntil,
        bestScore: incoming.bestScore,
      };
    }
    this.save();
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS, all tests green (18 total).

- [ ] **Step 5: Commit**

```bash
git add src/js/mods/parkourState.js src/js/mods/parkourState.test.mjs
git commit -m "feat(parkour): add ParkourState persistence and save-code"
```

---

### Task 5: Demo parcours content

**Files:**
- Create: `public/parkour/demo-6e.json`
- Create: `public/parkour/demo-6e.test.mjs`

**Interfaces:**
- Produces: a parcours JSON file matching the `parcoursDef` shape consumed by `ParkourState` (Task 2) and, in Task 6, `fetch`ed and passed to `cart.import()` per étape. Real activity ids used (verified to exist under `public/library/N6/`): `6NB1`, `6MA1`, `6NC1`, `6MA2`, `6NC14`, `6MC3`, `6DA5`, `6MC6`, `6DA7`, `6MC7`, `6GC15`.

- [ ] **Step 1: Write the failing test**

Create `public/parkour/demo-6e.test.mjs`:
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const path = fileURLToPath(new URL("./demo-6e.json", import.meta.url));
const parcours = JSON.parse(readFileSync(path, "utf8"));

test("demo parcours has the expected top-level shape", () => {
  assert.equal(typeof parcours.id, "string");
  assert.equal(typeof parcours.titre, "string");
  assert.ok(Array.isArray(parcours.themes));
  assert.ok(Array.isArray(parcours.etapes));
  assert.equal(parcours.etapes.length, 12);
});

test("every étape id is unique", () => {
  const ids = parcours.etapes.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("every étape references a declared theme", () => {
  const themeIds = new Set(parcours.themes.map((t) => t.id));
  for (const etape of parcours.etapes) {
    assert.ok(themeIds.has(etape.theme), `étape ${etape.id} has unknown theme ${etape.theme}`);
  }
});

test("every étape's panier activities sum to exactly 10 questions", () => {
  for (const etape of parcours.etapes) {
    const activities = Object.values(etape.panier.a);
    assert.ok(activities.length > 0, `étape ${etape.id} has no activities`);
    const totalQuestions = activities.reduce((sum, a) => sum + a.n, 0);
    assert.equal(totalQuestions, 10, `étape ${etape.id} does not total 10 questions`);
    for (const a of activities) {
      assert.ok(typeof a.i === "string" && a.i.length > 0);
      assert.ok(a.t > 0, `étape ${etape.id} activity ${a.i} has no tempo`);
    }
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `ENOENT: no such file or directory, open '.../public/parkour/demo-6e.json'`.

- [ ] **Step 3: Write the content**

Create `public/parkour/demo-6e.json`:
```json
{
  "id": "parkour-demo-6e",
  "titre": "Parkour 6e — démo",
  "themes": [
    { "id": "nombres", "label": "Nombres et calculs" },
    { "id": "geometrie", "label": "Géométrie et mesures" }
  ],
  "etapes": [
    { "id": "e01", "theme": "nombres", "titre": "Écriture décimale", "support": "arbre",
      "panier": { "t": "Parkour - Écriture décimale", "c": "1", "o": "true",
        "a": { "0": { "i": "6NB1", "t": 8, "n": 10 } } } },
    { "id": "e02", "theme": "geometrie", "titre": "Unités de longueur", "support": "toit",
      "panier": { "t": "Parkour - Longueurs", "c": "1", "o": "true",
        "a": { "0": { "i": "6MA1", "t": 8, "n": 10 } } } },
    { "id": "e03", "theme": "nombres", "titre": "Relations entre écritures", "support": "barre",
      "panier": { "t": "Parkour - Relations", "c": "1", "o": "true",
        "a": { "0": { "i": "6NC1", "t": 10, "n": 10 } } } },
    { "id": "e04", "theme": "geometrie", "titre": "Longueurs successives", "support": "arbre",
      "panier": { "t": "Parkour - Longueurs successives", "c": "1", "o": "true",
        "a": { "0": { "i": "6MA2", "t": 8, "n": 10 } } } },
    { "id": "e05", "theme": "nombres", "titre": "Relations entre 1/1000e, 1/100e, 1/10e et 1", "support": "toit",
      "panier": { "t": "Parkour - Fractions décimales", "c": "1", "o": "true",
        "a": { "0": { "i": "6NC14", "t": 10, "n": 10 } } } },
    { "id": "e06", "theme": "geometrie", "titre": "Heures et durées", "support": "barre",
      "panier": { "t": "Parkour - Durées", "c": "1", "o": "true",
        "a": { "0": { "i": "6MC3", "t": 10, "n": 10 } } } },
    { "id": "e07", "theme": "nombres", "titre": "Lecture de données", "support": "arbre",
      "panier": { "t": "Parkour - Données", "c": "1", "o": "true",
        "a": { "0": { "i": "6DA5", "t": 10, "n": 10 } } } },
    { "id": "e08", "theme": "geometrie", "titre": "Demi-heure, quart d'heure", "support": "toit",
      "panier": { "t": "Parkour - Demi/quart d'heure", "c": "1", "o": "true",
        "a": { "0": { "i": "6MC6", "t": 8, "n": 10 } } } },
    { "id": "e09", "theme": "nombres", "titre": "Lecture de graphiques", "support": "barre",
      "panier": { "t": "Parkour - Graphiques", "c": "1", "o": "true",
        "a": { "0": { "i": "6DA7", "t": 10, "n": 10 } } } },
    { "id": "e10", "theme": "geometrie", "titre": "Relations entre unités de temps", "support": "arbre",
      "panier": { "t": "Parkour - Unités de temps", "c": "1", "o": "true",
        "a": { "0": { "i": "6MC7", "t": 10, "n": 10 } } } },
    { "id": "e11", "theme": "nombres", "titre": "Révision nombres", "support": "toit",
      "panier": { "t": "Parkour - Révision nombres", "c": "1", "o": "true",
        "a": { "0": { "i": "6NB1", "t": 8, "n": 5 }, "1": { "i": "6NC1", "t": 10, "n": 5 } } } },
    { "id": "e12", "theme": "geometrie", "titre": "Codage de figures", "support": "barre",
      "panier": { "t": "Parkour - Codage de figures", "c": "1", "o": "true",
        "a": { "0": { "i": "6GC15", "t": 10, "n": 10 } } } }
  ]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS, all tests green.

- [ ] **Step 5: Commit**

```bash
git add public/parkour/demo-6e.json public/parkour/demo-6e.test.mjs
git commit -m "feat(parkour): add 6e demo parcours content"
```

---

### Task 6: Parcours loading

**Files:**
- Modify: `src/js/lib.parkour.js`

**Interfaces:**
- Consumes: `ParkourState` (`src/js/mods/parkourState.js`, Tasks 2–4).
- Produces: a module-level `async function loadParcours(): Promise<object>` returning the parsed parcours JSON (default `public/parkour/demo-6e.json`, or the URL given in `?parcours=`), and an initialized module-level `parkourState` (`ParkourState` instance backed by `window.localStorage`) once the page has loaded a parcours. Later tasks (7, 8, 9) read `parkourState` and the loaded parcours object.
- No automated test (browser-only `fetch`/DOM code, no test runner covers this) — manual verification steps below.

- [ ] **Step 1: Write the loader**

Replace the placeholder body of `src/js/lib.parkour.js` with:
```js
import { utils } from "./mods/utils.js";
import ParkourState from "./mods/parkourState.js";

const MM = {};
MM.version = utils.getVersion();

let parkourDef = null;
let parkourState = null;

async function loadParcours() {
  const params = new URLSearchParams(window.location.search);
  const url = params.get("parcours") || "parkour/demo-6e.json";
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Impossible de charger le parcours : " + url);
  }
  return response.json();
}

async function init() {
  try {
    parkourDef = await loadParcours();
    parkourState = new ParkourState(parkourDef, { storage: window.localStorage });
  } catch (err) {
    document.getElementById("parkour-accueil").innerHTML =
      "<p>Erreur de chargement du parcours : " + err.message + "</p>";
    return;
  }
  document.getElementById("parkour-accueil").innerHTML +=
    "<p>Parcours chargé : " + parkourDef.titre + " (" + parkourDef.etapes.length + " étapes)</p>";
}

init();
```

- [ ] **Step 2: Make the demo file reachable from the dev server**

The dev server serves `src/*.html` directly; `public/parkour/demo-6e.json` is outside `src/`. Copy the same override mechanism `library.js` already uses for `?u=` during dev: for this task, verify by passing the full demo file explicitly via `?parcours=`.

- [ ] **Step 3: Manual browser check**

Open `src/parkour.html?parcours=../public/parkour/demo-6e.json` with Live Server (adjust the relative path to wherever Live Server roots the workspace — e.g. `http://127.0.0.1:5500/public/parkour/demo-6e.json` if Live Server serves the repo root). Expected: "Parcours chargé : Parkour 6e — démo (12 étapes)" appears, no console errors. Then open `src/parkour.html` with a deliberately broken `?parcours=` value (e.g. `?parcours=does-not-exist.json`) and confirm the error message renders instead of a blank page or uncaught exception.

- [ ] **Step 4: Commit**

```bash
git add src/js/lib.parkour.js
git commit -m "feat(parkour): load parcours definition and init ParkourState"
```

---

### Task 7: Accueil screen

**Files:**
- Modify: `src/js/lib.parkour.js`
- Modify: `src/css/parkour.css`

**Interfaces:**
- Consumes: `parkourDef`, `parkourState` from Task 6; `STATUS` from `src/js/mods/parkourState.js`.
- Produces: `function renderAccueil()` — renders theme star bars into `#parkour-themes` and the étape path into `#parkour-chemin`, wires `#btn-commencer`/`#btn-continuer`/`#btn-reinitialiser`. Clicking an `AVAILABLE` étape card starts it (Task 8 provides `startEtape`, stubbed here as a `window.__startEtape` placeholder call replaced in Task 8). "Continuer" jumps to the first non-`PASSED` reachable étape.
- No automated test — manual verification steps below.

- [ ] **Step 1: Implement rendering**

In `src/js/lib.parkour.js`, replace Task 6's import line:
```js
import ParkourState from "./mods/parkourState.js";
```
with:
```js
import ParkourState, { STATUS } from "./mods/parkourState.js";
```

Then replace the tail of `init()`:
```js
  document.getElementById("parkour-accueil").innerHTML +=
    "<p>Parcours chargé : " + parkourDef.titre + " (" + parkourDef.etapes.length + " étapes)</p>";
```
with:
```js
  renderAccueil();
```

Add these functions (before `init`):
```js
const STATUS_LABELS = {
  [STATUS.LOCKED_PREREQ]: "Verrouillée",
  [STATUS.LOCKED_TIMER]: "Bientôt disponible",
  [STATUS.LOCKED_FAIL]: "Réessaie plus tard",
  [STATUS.AVAILABLE]: "Disponible",
  [STATUS.PASSED]: "Réussie",
};

function firstReachableUnfinishedEtape() {
  return parkourDef.etapes.find((etape) => {
    const status = parkourState.getStatus(etape.id);
    return status === STATUS.AVAILABLE;
  });
}

function renderThemes() {
  const zone = document.getElementById("parkour-themes");
  zone.innerHTML = "";
  for (const theme of parkourDef.themes) {
    const stars = parkourState.getThemeStars(theme.id);
    const div = utils.create("div", {
      className: "parkour-theme",
      innerHTML: theme.label + " : " + stars.passed + " / " + stars.total + " ★",
    });
    zone.appendChild(div);
  }
}

function renderChemin() {
  const zone = document.getElementById("parkour-chemin");
  zone.innerHTML = "";
  for (const etape of parkourDef.etapes) {
    const status = parkourState.getStatus(etape.id);
    const card = utils.create("div", {
      className: "parkour-etape " + status.toLowerCase().replace("_", "-"),
      innerHTML:
        "<strong>" + etape.titre + "</strong><br>" + STATUS_LABELS[status],
    });
    if (status === STATUS.AVAILABLE || status === STATUS.PASSED) {
      card.classList.add("available");
      card.onclick = () => startEtape(etape);
    }
    zone.appendChild(card);
  }
}

function renderAccueil() {
  document.getElementById("parkour-accueil").innerHTML = "";
  const title = utils.create("h1", { innerHTML: parkourDef.titre });
  document.getElementById("parkour-accueil").appendChild(title);
  const themesZone = utils.create("div", { id: "parkour-themes" });
  const cheminZone = utils.create("div", { id: "parkour-chemin" });
  document.getElementById("parkour-accueil").appendChild(themesZone);
  document.getElementById("parkour-accueil").appendChild(cheminZone);
  renderThemes();
  renderChemin();

  const actions = utils.create("div", { id: "parkour-accueil-actions" });
  const btnCommencer = utils.create("button", { innerHTML: "Commencer" });
  btnCommencer.onclick = () => startEtape(parkourDef.etapes[0]);
  const btnContinuer = utils.create("button", { innerHTML: "Continuer" });
  btnContinuer.onclick = () => {
    const etape = firstReachableUnfinishedEtape();
    if (etape) startEtape(etape);
  };
  const btnReset = utils.create("button", { innerHTML: "Réinitialiser" });
  btnReset.onclick = () => {
    if (window.confirm("Effacer toute la progression sur ce parcours ?")) {
      parkourState.reset();
      renderAccueil();
    }
  };
  actions.appendChild(btnCommencer);
  actions.appendChild(btnContinuer);
  actions.appendChild(btnReset);
  document.getElementById("parkour-accueil").appendChild(actions);
}

// Provided by Task 8; declared here so renderAccueil/renderChemin can reference it
// before its real implementation lands.
function startEtape() {
  window.alert("Le mode jeu arrive à la tâche suivante.");
}
```

- [ ] **Step 2: Manual browser check**

Open `src/parkour.html?parcours=<path-to-demo-6e.json>` (as in Task 6). Expected:
- Two theme lines showing `0 / 6 ★` for both "Nombres et calculs" and "Géométrie et mesures".
- 12 étape cards; only "e01" shows as `available` (green border, clickable), the rest show `LOCKED_PREREQ` and are dimmed.
- Clicking "e01"'s card or "Commencer" shows the placeholder alert.
- "Réinitialiser" asks for confirmation; confirming keeps the same (already-reset) state; canceling does nothing.
- Reload the page: state is unchanged (nothing persisted yet at this point, expected — Task 8 is what calls `recordAttempt`, which persists).

- [ ] **Step 3: Commit**

```bash
git add src/js/lib.parkour.js src/css/parkour.css
git commit -m "feat(parkour): render accueil screen with theme stars and étape path"
```

---

### Task 8: Game loop

**Files:**
- Modify: `src/js/lib.parkour.js`

**Interfaces:**
- Consumes: `cart` (`src/js/mods/cart.js`), `keyBoard` (`src/js/mods/keyboard.js`), `analyseReponse` (`src/js/mods/analysereponse.js`), `MathfieldElement` (`src/js/libs/mathlive/mathlive.mjs.js`), `parkourState.recordAttempt` (Task 3), `parkourDef`/`parkourState` (Task 6), `renderAccueil` (Task 7).
- Produces: the real `startEtape(etape)` (replaces Task 7's placeholder), which builds the 10-question run from the étape's panier and drives one question at a time to completion, then calls `parkourState.recordAttempt` and shows an end screen.
- No automated test — manual verification steps below (this is the most DOM/MathLive-dependent piece in the app; there is no headless harness for MathLive input in this repo, matching how `duel.js`/`diaporama.js` are verified today).

- [ ] **Step 1: Implement the game loop**

Add these imports at the top of `src/js/lib.parkour.js`:
```js
import cart from "./mods/cart.js";
import keyBoard from "./mods/keyboard.js";
import analyseReponse from "./mods/analysereponse.js";
import { MathfieldElement } from "./libs/mathlive/mathlive.mjs.js";

MathfieldElement.fontsDirectory = "../css/katex/fonts";
MathfieldElement.soundsDirectory = null;
```

Add module-level state (next to `let parkourDef = null;`):
```js
let currentGame = null;
```

Replace the placeholder `startEtape` from Task 7 with:
```js
async function startEtape(etape) {
  const status = parkourState.getStatus(etape.id);
  if (status !== STATUS.AVAILABLE && status !== STATUS.PASSED) return;

  const panierCart = new cart(0);
  await panierCart.import(etape.panier, false, MM.version);

  let tempsPrevu = 0;
  const actArray = [];
  panierCart.activities.forEach((activity, activityIndex) => {
    activity.initialize();
    activity.generate();
    tempsPrevu += Number(activity.tempo) * activity.questions.length;
    for (let j = 0; j < activity.questions.length; j++) {
      actArray.push([activityIndex, j]);
    }
  });

  currentGame = {
    etape,
    panierCart,
    actArray: utils.shuffle(actArray),
    index: 0,
    correctCount: 0,
    tempsReel: 0,
    tempsPrevu,
    questionStart: 0,
  };

  document.getElementById("parkour-accueil").classList.add("hidden");
  document.getElementById("parkour-jeu").classList.remove("hidden");
  document.getElementById("parkour-fin").classList.add("hidden");
  renderQuestion();
}

function currentActivityAndQuestion() {
  const { panierCart, actArray, index } = currentGame;
  const [activityIndex, questionIndex] = actArray[index];
  return { activity: panierCart.activities[activityIndex], questionIndex };
}

function renderQuestion() {
  const { actArray, index } = currentGame;
  const { activity, questionIndex } = currentActivityAndQuestion();

  document.getElementById("parkour-progressquestion").innerHTML =
    "Question " + (index + 1) + " / " + actArray.length;

  const zone = document.getElementById("parkour-question");
  zone.innerHTML = "";
  const divq = utils.create("div", { className: "parkour-question-text" });
  divq.innerHTML = "$$" + activity.questions[questionIndex] + "$$";
  zone.appendChild(divq);

  const mf = new MathfieldElement({ mathVirtualKeyboardPolicy: "manual" });
  zone.appendChild(mf);
  new keyBoard(mf, activity.keys || undefined, zone, "p", "kp" + index);
  mf.addEventListener("keyup", (event) => {
    if (event.key === "Enter" || event.code === "NumpadEnter") {
      event.preventDefault();
      validateAnswer(mf.value);
    }
  });
  mf.focus();
  utils.mathRender("serif", [".parkour-question-text"]);
  currentGame.questionStart = Date.now();
}

function isAnswerCorrect(activity, questionIndex, userAnswer) {
  const expectedAnswer = activity.values[questionIndex];
  const valueType = activity.valueType;
  const candidates = Array.isArray(expectedAnswer)
    ? expectedAnswer
    : String(expectedAnswer).split(",");
  return candidates.some((oneExpected) =>
    analyseReponse(oneExpected, userAnswer, valueType),
  );
}

function validateAnswer(userAnswer) {
  const { activity, questionIndex } = currentActivityAndQuestion();
  currentGame.tempsReel += (Date.now() - currentGame.questionStart) / 1000;

  if (userAnswer && isAnswerCorrect(activity, questionIndex, userAnswer)) {
    currentGame.correctCount++;
  }

  currentGame.index++;
  if (currentGame.index < currentGame.actArray.length) {
    renderQuestion();
  } else {
    endEtape();
  }
}

function endEtape() {
  const { etape, correctCount, tempsReel, tempsPrevu } = currentGame;
  const result = parkourState.recordAttempt(etape.id, {
    correctCount,
    tempsReel,
    tempsPrevu,
  });
  currentGame = null;

  document.getElementById("parkour-jeu").classList.add("hidden");
  document.getElementById("parkour-fin").classList.remove("hidden");
  document.getElementById("parkour-fin-content").innerHTML =
    "<h2>" +
    (result.passed ? "Étape réussie !" : "Étape non validée") +
    "</h2><p>" +
    correctCount +
    " / 10 bonnes réponses — score : " +
    result.score +
    " / 250</p><button id=\"btn-retour-accueil\">Retour au parcours</button>";
  document.getElementById("btn-retour-accueil").onclick = () => {
    document.getElementById("parkour-fin").classList.add("hidden");
    document.getElementById("parkour-accueil").classList.remove("hidden");
    renderAccueil();
  };
}
```

- [ ] **Step 2: Manual browser check**

Open `src/parkour.html?parcours=<path-to-demo-6e.json>`. Click étape "e01" (or "Commencer"). Expected:
- Jeu screen appears, "Question 1 / 10", a MathLive input field focused, a katex-rendered question.
- Answering (correct or not) via keyboard/virtual keyboard and pressing Enter advances to "Question 2 / 10", etc.
- After question 10, end screen shows "X / 10 bonnes réponses — score : Y / 250" and either "Étape réussie !" or "Étape non validée".
- Manually verify the score arithmetic once: answer all 10 correctly as fast as possible (should approach 250); answer all 10 correctly but slowly, past the étape's total tempo (should show 200).
- "Retour au parcours" goes back to accueil; if you passed with ≥8/10, "e01" now shows `passed`/`PASSED` and "e02" shows `LOCKED_TIMER` (not yet `AVAILABLE`, since 12h haven't passed) — confirms `recordAttempt` persisted.
- Reload the page: étape statuses survive the reload (confirms `localStorage` persistence end-to-end).

- [ ] **Step 3: Commit**

```bash
git add src/js/lib.parkour.js
git commit -m "feat(parkour): implement 10-question game loop with scoring"
```

---

### Task 9: Save-code UI and final verification

**Files:**
- Modify: `src/js/lib.parkour.js`

**Interfaces:**
- Consumes: `parkourState.exportCode`/`importCode` (Task 4), `renderAccueil` (Task 7).
- Produces: a save-code widget in `#parkour-savecode` on the accueil screen — a "Copier mon code" button and a paste-and-restore field.

- [ ] **Step 1: Implement the save-code UI**

In `renderAccueil()` (Task 7), after the `actions` block is appended, add:
```js
  const saveZone = utils.create("div", { id: "parkour-savecode" });
  const btnCopy = utils.create("button", { innerHTML: "Copier mon code de sauvegarde" });
  btnCopy.onclick = async () => {
    const code = parkourState.exportCode();
    try {
      await navigator.clipboard.writeText(code);
      window.alert("Code copié dans le presse-papier.");
    } catch {
      window.prompt("Copie manuelle du code :", code);
    }
  };
  const restoreInput = utils.create("input", {
    type: "text",
    placeholder: "Coller un code de sauvegarde",
  });
  const btnRestore = utils.create("button", { innerHTML: "Restaurer" });
  btnRestore.onclick = () => {
    try {
      parkourState.importCode(restoreInput.value.trim());
      window.alert("Progression restaurée.");
      renderAccueil();
    } catch (err) {
      window.alert("Échec de la restauration : " + err.message);
    }
  };
  saveZone.appendChild(btnCopy);
  saveZone.appendChild(restoreInput);
  saveZone.appendChild(btnRestore);
  document.getElementById("parkour-accueil").appendChild(saveZone);
```

- [ ] **Step 2: Manual browser check — save-code round trip**

On the accueil screen, click "Copier mon code de sauvegarde" (grant clipboard permission if prompted, or use the `prompt` fallback to read the code). Click "Réinitialiser" and confirm — progress is cleared. Paste the copied code into the restore field and click "Restaurer". Expected: alert "Progression restaurée.", and the étape path/theme stars reflect the pre-reset progress again.

- [ ] **Step 3: Manual browser check — cross-parcours rejection**

With a passed étape in state, get a save code from a *different* parcours file (e.g., temporarily duplicate `demo-6e.json` to `demo-6e-other.json` with a different top-level `id`, open `?parcours=demo-6e-other.json`, copy its — empty — code, then go back to the original parcours and try to restore that code). Expected: alert "Échec de la restauration : ce code vient d'un autre parcours."

- [ ] **Step 4: Full pipeline check**

Run: `npm test`
Expected: PASS, all `parkourState` and demo-parcours tests green.

Run: `npx gulp maj-parkour`
Expected: completes without error.

- [ ] **Step 5: Commit**

```bash
git add src/js/lib.parkour.js
git commit -m "feat(parkour): add save-code export/import UI"
```

---

## Post-plan (explicitly out of scope, tracked in the spec)

Parcours editor (teacher tool), échec-répété help library, 5e/4e/brevet content, any server-side/teacher tracking. Each is a separate future spec/plan per `docs/superpowers/specs/2026-08-21-parkour-mathsmentales-design.md`.
