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
  filtre,
  trie,
  groupeParDate,
  anciennes,
  actives,
  purgeTombstones,
  fusionne,
  valideImport,
  corrigeURLsDiaporama,
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

test("normalise vide une url au schéma javascript: (injection résiduelle du seul champ non affiché en texte)", () => {
  const e = normalise({ url: "javascript:alert(1)" }, T0);
  assert.equal(e.url, "");
});

test("normalise vide une url au schéma data:", () => {
  const e = normalise({ url: "data:text/html,<script>alert(1)</script>" }, T0);
  assert.equal(e.url, "");
});

test("normalise conserve une url http(s)", () => {
  const e = normalise({ url: "https://www.mathsmentales.net/?p=6ND6" }, T0);
  assert.equal(e.url, "https://www.mathsmentales.net/?p=6ND6");
});

test("normalise conserve une url relative produite par l'application elle-même", () => {
  const e = normalise({ url: "index.html?u=6ND6" }, T0);
  assert.equal(e.url, "index.html?u=6ND6");
});

test("normalise vide aussi urlSansGraine au schéma dangereux", () => {
  const e = normalise({ url: "u", urlSansGraine: "javascript:alert(1)" }, T0);
  assert.equal(e.urlSansGraine, "");
});

test("cree vide une url au schéma javascript:", () => {
  const e = cree({ type: "exam", url: "javascript:alert(1)", maintenant: T0 });
  assert.equal(e.url, "");
});

test("cree conserve une url relative", () => {
  const e = cree({ type: "exam", url: "index.html?u=6ND6", maintenant: T0 });
  assert.equal(e.url, "index.html?u=6ND6");
});

// --- Ronde de correction finale 2 : urlSure() doit normaliser avant de
// reconnaitre le schema, sinon un espace/tabulation/retour-chariot/octet nul
// glisse "javascript:" a travers le filtre (les navigateurs, eux, les
// suppriment avant de resoudre le schema d'une url). ---

test("normalise dejoue javascript: precede d'un espace de tete", () => {
  const e = normalise({ url: " javascript:alert(1)" }, T0);
  assert.equal(e.url, "");
});

test("normalise dejoue javascript: precede d'une tabulation de tete", () => {
  const e = normalise({ url: "\tjavascript:alert(1)" }, T0);
  assert.equal(e.url, "");
});

test("normalise dejoue javascript: coupe par une tabulation au milieu du mot", () => {
  const e = normalise({ url: "java\tscript:alert(1)" }, T0);
  assert.equal(e.url, "");
});

test("normalise dejoue javascript: coupe par un retour chariot au milieu du mot", () => {
  const e = normalise({ url: "java\rscript:alert(1)" }, T0);
  assert.equal(e.url, "");
});

test("normalise dejoue javascript: coupe par un octet nul au milieu du mot", () => {
  const e = normalise({ url: "java" + String.fromCharCode(0) + "script:alert(1)" }, T0);
  assert.equal(e.url, "");
});

test("normalise dejoue javascript: coupe par un caractere de controle C0 (U+0001, hors tab/CR/LF/NUL)", () => {
  const e = normalise({ url: "java" + String.fromCharCode(1) + "script:alert(1)" }, T0);
  assert.equal(e.url, "");
});

test("normalise dejoue javascript: coupe par un caractere de controle C0 (U+001F, hors tab/CR/LF/NUL)", () => {
  const e = normalise({ url: "java" + String.fromCharCode(0x1f) + "script:alert(1)" }, T0);
  assert.equal(e.url, "");
});

test("normalise conserve toujours une url relative legitime malgre la normalisation", () => {
  const e = normalise({ url: "index.html?u=6ND6" }, T0);
  assert.equal(e.url, "index.html?u=6ND6");
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

test("normalise n'introduit pas nbq: 0 pour un nbq null", () => {
  const e = normalise(
    { url: "u", paniers: [{ titre: "P", activites: [{ id: "a", titre: "A", nbq: null }] }] },
    T0,
  );
  const sortie = e.paniers[0].activites[0];
  assert.equal("nbq" in sortie, false);
});

test("normalise n'introduit pas nbq: 0 pour un nbq chaîne vide", () => {
  const e = normalise(
    { url: "u", paniers: [{ titre: "P", activites: [{ id: "a", titre: "A", nbq: "" }] }] },
    T0,
  );
  const sortie = e.paniers[0].activites[0];
  assert.equal("nbq" in sortie, false);
});

test("normalise n'introduit pas nbq: 0 pour un nbq non numérique", () => {
  const e = normalise(
    { url: "u", paniers: [{ titre: "P", activites: [{ id: "a", titre: "A", nbq: "pas un nombre" }] }] },
    T0,
  );
  const sortie = e.paniers[0].activites[0];
  assert.equal("nbq" in sortie, false);
});

test("normalise accepte un nbq exprimé en chaîne numérique", () => {
  const e = normalise(
    { url: "u", paniers: [{ titre: "P", activites: [{ id: "a", titre: "A", nbq: "6" }] }] },
    T0,
  );
  assert.equal(e.paniers[0].activites[0].nbq, 6);
});

test("compte ne compte pas une activité dont le nbq vaut null", () => {
  const e = normalise(
    { url: "u", paniers: [{ titre: "P", activites: [{ id: "a", titre: "A", nbq: null }] }] },
    T0,
  );
  assert.deepEqual(compte(e), { activites: 1, questions: 0 });
});

test("cree ignore un titre de panier vide après trim pour le titre par défaut", () => {
  const e = cree({
    type: "exam",
    url: "u",
    paniers: [
      { titre: "   ", activites: [] },
      { titre: "Diapo 2", activites: [] },
    ],
    maintenant: T0,
  });
  assert.equal(e.titre, "Diapo 2");
});

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

test("actives écarte les tombstones", () => {
  const liste = [entree({ id: "h-1" }), entree({ id: "h-2", supprime: true })];
  assert.deepEqual(actives(liste).map((e) => e.id), ["h-1"]);
});

test("fusionne : un tombstone plus récent gagne sur la version active reçue d'un autre poste", () => {
  const local = [entree({ id: "h-1", titre: "A", modifie: T0, supprime: true })];
  const distant = [entree({ id: "h-1", titre: "A", modifie: T0 - JOUR })];
  assert.equal(fusionne(local, distant)[0].supprime, true);
  assert.equal(fusionne(distant, local)[0].supprime, true);
});

test("fusionne : une version active plus récente annule un tombstone plus ancien", () => {
  const local = [entree({ id: "h-1", titre: "A", modifie: T0 - JOUR, supprime: true })];
  const distant = [entree({ id: "h-1", titre: "A", modifie: T0 })];
  assert.equal(fusionne(local, distant)[0].supprime, false);
});

test("purgeTombstones retire les tombstones plus vieux que N mois", () => {
  const liste = [
    entree({ id: "h-1", supprime: true, modifie: T0 - 200 * JOUR }),
    entree({ id: "h-2", supprime: true, modifie: T0 - 10 * JOUR }),
  ];
  const purge = purgeTombstones(liste, 6, T0);
  assert.deepEqual(purge.map((e) => e.id), ["h-2"]);
});

test("purgeTombstones épargne toujours les entrées actives, même vieilles", () => {
  const liste = [entree({ id: "h-1", supprime: false, modifie: T0 - 200 * JOUR })];
  assert.equal(purgeTombstones(liste, 6, T0).length, 1);
});

test("valideImport accepte un tombstone sans url", () => {
  const resultat = valideImport({
    version: VERSION,
    entrees: [{ id: "h-1", type: "exam", modifie: T0, supprime: true }],
  });
  assert.equal(resultat.ok, true);
  assert.equal(resultat.entrees[0].supprime, true);
  assert.equal(resultat.entrees[0].url, "");
});

test("valideImport refuse toujours une entrée active sans url, tombstones à part", () => {
  const resultat = valideImport({
    version: VERSION,
    entrees: [{ type: "exam" }, { id: "h-1", type: "exam", modifie: T0, supprime: true }],
  });
  assert.equal(resultat.ok, true);
  assert.equal(resultat.entrees.length, 1);
  assert.equal(resultat.entrees[0].supprime, true);
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

test("valideImport refuse un fichier dépourvu de champ version", () => {
  const resultat = valideImport({ entrees: [{ url: "u" }] });
  assert.equal(resultat.ok, false);
  assert.ok(resultat.erreurs[0].length > 0);
});

test("valideImport écarte une entrée d'url javascript: mais garde les autres", () => {
  const resultat = valideImport({
    version: VERSION,
    entrees: [{ url: "javascript:alert(document.cookie)" }, { url: "u" }],
  });
  assert.equal(resultat.ok, true);
  assert.equal(resultat.entrees.length, 1);
  assert.equal(resultat.entrees[0].url, "u");
  assert.equal(resultat.erreurs.length, 1);
});

test("valideImport écarte une entrée d'url data: (fichier réduit à zéro entrée exploitable)", () => {
  const resultat = valideImport({
    version: VERSION,
    entrees: [{ url: "data:text/html,<script>alert(1)</script>" }],
  });
  assert.equal(resultat.ok, false);
  assert.ok(resultat.erreurs.some((e) => e.indexOf("non autorisée") > -1));
});

test("valideImport accepte une url relative légitime produite par l'application", () => {
  const resultat = valideImport({ version: VERSION, entrees: [{ url: "index.html?u=6ND6" }] });
  assert.equal(resultat.ok, true);
  assert.equal(resultat.entrees[0].url, "index.html?u=6ND6");
});

test("valideImport accepte une url http(s)", () => {
  const resultat = valideImport({
    version: VERSION,
    entrees: [{ url: "https://www.mathsmentales.net/?p=6ND6" }],
  });
  assert.equal(resultat.ok, true);
  assert.equal(resultat.entrees[0].url, "https://www.mathsmentales.net/?p=6ND6");
});

// --- Ronde de correction 1 : bornes calendaires réelles et commutativité ---

test("anciennes ramène le débordement de fin de mois au dernier jour du mois visé (31 août)", () => {
  const reference = Date.UTC(2026, 7, 31, 10, 0, 0); // 31 août 2026
  const finFevrier = entree({ titre: "fin février", modifie: Date.UTC(2026, 1, 28, 0, 0, 0) });
  const debutMars = entree({ titre: "début mars", modifie: Date.UTC(2026, 2, 1, 0, 0, 0) });
  assert.equal(anciennes([finFevrier], 6, reference).length, 1);
  assert.equal(anciennes([debutMars], 6, reference).length, 0);
});

test("anciennes ramène le débordement de fin de mois au dernier jour du mois visé (31 mai)", () => {
  const reference = Date.UTC(2026, 4, 31, 10, 0, 0); // 31 mai 2026
  const finFevrier = entree({ titre: "fin février", modifie: Date.UTC(2026, 1, 28, 0, 0, 0) });
  const debutMars = entree({ titre: "début mars", modifie: Date.UTC(2026, 2, 1, 0, 0, 0) });
  assert.equal(anciennes([finFevrier], 3, reference).length, 1);
  assert.equal(anciennes([debutMars], 3, reference).length, 0);
});

test("anciennes franchit l'année en reculant de plusieurs mois", () => {
  const reference = Date.UTC(2026, 0, 15, 10, 0, 0); // 15 janvier 2026 → limite juillet 2025
  const juin2025 = entree({ titre: "juin 2025", modifie: Date.UTC(2025, 5, 15, 10, 0, 0) });
  const aout2025 = entree({ titre: "août 2025", modifie: Date.UTC(2025, 7, 15, 10, 0, 0) });
  assert.equal(anciennes([juin2025], 6, reference).length, 1);
  assert.equal(anciennes([aout2025], 6, reference).length, 0);
});

test("anciennes exclut une entrée pile sur la limite (comparaison stricte)", () => {
  const reference = Date.UTC(2026, 7, 15, 10, 0, 0); // 15 août 2026, sans débordement de mois
  const limite = new Date(reference);
  limite.setMonth(limite.getMonth() - 6);
  const pile = entree({ modifie: limite.getTime() });
  const justeAvant = entree({ modifie: limite.getTime() - 1 });
  assert.equal(anciennes([pile], 6, reference).length, 0);
  assert.equal(anciennes([justeAvant], 6, reference).length, 1);
});

test("fusionne est commutative à id et modifie égaux même si le contenu diffère", () => {
  const a = [entree({ id: "h-1", titre: "version A", modifie: T0 })];
  const b = [entree({ id: "h-1", titre: "version B", modifie: T0 })];
  assert.deepEqual(fusionne(a, b), fusionne(b, a));
});

test("fusionne conserve les deux entrées d'id différents à modifie égal, dans le même ordre quel que soit le sens", () => {
  const a = [entree({ id: "h-1", titre: "A", modifie: T0 })];
  const b = [entree({ id: "h-2", titre: "B", modifie: T0 })];
  assert.equal(fusionne(a, b).length, 2);
  assert.deepEqual(fusionne(a, b), fusionne(b, a));
});

test("groupeParDate range à 00:00:00 pile dans aujourd'hui", () => {
  const reference = Date.UTC(2026, 7, 22, 15, 0, 0);
  const debutDuJour = new Date(reference);
  debutDuJour.setHours(0, 0, 0, 0);
  const pileMinuit = entree({ modifie: debutDuJour.getTime() });
  const groupes = groupeParDate([pileMinuit], reference);
  assert.deepEqual(groupes.map((g) => g.cle), ["aujourdhui"]);
});

test("groupeParDate exclut 23:59:59 la veille de aujourd'hui", () => {
  const reference = Date.UTC(2026, 7, 22, 15, 0, 0);
  const debutDuJour = new Date(reference);
  debutDuJour.setHours(0, 0, 0, 0);
  const veilleTard = entree({ modifie: debutDuJour.getTime() - 1 });
  const groupes = groupeParDate([veilleTard], reference);
  assert.notEqual(groupes[0].cle, "aujourdhui");
});

test("groupeParDate franchit l'année : décembre précédent obtient sa propre clé", () => {
  const reference = Date.UTC(2026, 0, 20, 10, 0, 0);
  const decembre = entree({ modifie: Date.UTC(2025, 11, 15, 10, 0, 0) });
  const groupes = groupeParDate([decembre], reference);
  assert.deepEqual(groupes.map((g) => g.cle), ["2025-12"]);
  assert.equal(groupes[0].libelle, "décembre 2025");
});

test("corrigeURLsDiaporama réécrit index.html en diaporama.html pour un diaporama", () => {
  const e = cree({
    type: "diaporama",
    url: "https://www.mathsmentales.net/index.html?u=6ND6",
    urlSansGraine: "https://www.mathsmentales.net/index.html?u=6ND6",
  });
  const [corrigee] = corrigeURLsDiaporama([e]);
  assert.equal(corrigee.url, "https://www.mathsmentales.net/diaporama.html?u=6ND6");
  assert.equal(corrigee.urlSansGraine, "https://www.mathsmentales.net/diaporama.html?u=6ND6");
});

test("corrigeURLsDiaporama ne touche pas une url déjà correcte", () => {
  const e = cree({ type: "diaporama", url: "https://www.mathsmentales.net/diaporama.html?u=6ND6" });
  const [corrigee] = corrigeURLsDiaporama([e]);
  assert.equal(corrigee, e);
});

test("corrigeURLsDiaporama ne touche pas les autres types", () => {
  const e = cree({ type: "exam", url: "https://www.mathsmentales.net/index.html?u=6ND6" });
  const [corrigee] = corrigeURLsDiaporama([e]);
  assert.equal(corrigee, e);
});

test("corrigeURLsDiaporama laisse une url vide inchangée", () => {
  const e = cree({ type: "diaporama", url: "" });
  const [corrigee] = corrigeURLsDiaporama([e]);
  assert.equal(corrigee, e);
});
