import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DEFAULT_REGLES, normalize, countQuestions, validate, encode, decode } from "./parkourDef.js";

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

test("normalize ramène nbQuestions à un entier positif", () => {
  const source = makeDef();
  source.regles = { nbQuestions: 0 };
  assert.equal(normalize(source).regles.nbQuestions, 1);
});

test("normalize ramène un nbQuestions négatif ou décimal à un entier positif", () => {
  const source1 = makeDef();
  source1.regles = { nbQuestions: -5 };
  assert.equal(normalize(source1).regles.nbQuestions, 1);

  const source2 = makeDef();
  source2.regles = { nbQuestions: 7.9 };
  assert.equal(normalize(source2).regles.nbQuestions, 7);
});

test("normalize plafonne seuilReussite à nbQuestions plutôt que de produire une étape impossible", () => {
  const source = makeDef();
  source.regles = { nbQuestions: 5, seuilReussite: 8 };
  const def = normalize(source);
  assert.equal(def.regles.nbQuestions, 5);
  assert.equal(def.regles.seuilReussite, 5);
});

test("normalize ramène seuilReussite à un entier positif", () => {
  const source = makeDef();
  source.regles = { seuilReussite: 0 };
  assert.equal(normalize(source).regles.seuilReussite, 1);
});

test("countQuestions additionne les n des activités du panier", () => {
  assert.equal(countQuestions({ a: { 0: { i: "6NB1", n: 5 }, 1: { i: "6NC1", n: 5 } } }), 10);
});

test("countQuestions accepte des n en chaîne et renvoie 0 sur un panier vide", () => {
  assert.equal(countQuestions({ a: { 0: { i: "6NB1", n: "10" } } }), 10);
  assert.equal(countQuestions({}), 0);
  assert.equal(countQuestions(undefined), 0);
});

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
  // 9 : sous nbQuestions (10) par défaut mais au-dessus de seuilReussite (8),
  // donc toujours un simple avertissement
  source.etapes[0].panier = { a: { 0: { i: "6NB1", n: 9 } } };
  const rapport = validate(source);
  assert.deepEqual(rapport.erreurs, []);
  assert.equal(rapport.avertissements.length, 1);
  assert.match(rapport.avertissements[0], /9/);
});

test("validate bloque un panier plus petit que le seuil de réussite", () => {
  const source = makeDef();
  // 4 questions disponibles < seuilReussite (8) par défaut : l'étape serait
  // mathématiquement impossible à réussir, ce n'est plus un avertissement
  source.etapes[0].panier = { a: { 0: { i: "6NB1", n: 4 } } };
  const rapport = validate(source);
  assert.equal(rapport.erreurs.length, 1);
  assert.match(rapport.erreurs[0], /4/);
  assert.match(rapport.erreurs[0], /seuil|réussir/i);
  assert.deepEqual(rapport.avertissements, []);
});

test("validate avertit d'un thème sans étape", () => {
  const source = makeDef();
  source.themes.push({ id: "geometrie", label: "Géométrie" });
  const rapport = validate(source);
  assert.deepEqual(rapport.erreurs, []);
  assert.equal(rapport.avertissements.length, 1);
  assert.match(rapport.avertissements[0], /Géométrie/);
});

test("validate signale un seuilReussite déclaré supérieur à nbQuestions", () => {
  const source = makeDef();
  source.regles = { nbQuestions: 5, seuilReussite: 8 };
  const rapport = validate(source);
  assert.equal(
    rapport.erreurs.filter((e) => /seuil de réussite/i.test(e)).length,
    1,
  );
});

test("validate ne signale rien quand seuilReussite déclaré est égal à nbQuestions", () => {
  const source = makeDef();
  source.regles = { nbQuestions: 10, seuilReussite: 10 };
  const rapport = validate(source);
  assert.equal(
    rapport.erreurs.filter((e) => /seuil de réussite/i.test(e)).length,
    0,
  );
});

test("validate signale des ids de thème en double", () => {
  const source = makeDef();
  source.themes.push({ id: "nombres", label: "Nombres bis" });
  const rapport = validate(source);
  assert.equal(
    rapport.erreurs.filter((e) => /thème en double/i.test(e)).length,
    1,
  );
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

test("demo-6e.json normalisé sans perte de contenu (non-régression V1)", () => {
  const path = new URL("../../../public/parkour/demo-6e.json", import.meta.url);
  const brut = JSON.parse(readFileSync(path, "utf8"));
  const def = normalize(brut);
  assert.deepEqual(def.themes, brut.themes);
  assert.deepEqual(def.etapes, brut.etapes);
  assert.deepEqual(def.regles, DEFAULT_REGLES);
});
