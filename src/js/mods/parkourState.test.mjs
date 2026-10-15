import { test } from "node:test";
import assert from "node:assert/strict";
import ParkourState, { STATUS } from "./parkourState.js";

const HOUR = 60 * 60 * 1000;
const HOUR_MS_FOR_TEST = HOUR;

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
