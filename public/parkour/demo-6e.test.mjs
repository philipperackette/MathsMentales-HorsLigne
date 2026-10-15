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
