import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseAdresseNuage,
  normaliseChemin,
  refusDuProxy,
  construireAcces,
  construireRequeteProxy,
  interpreteStatut,
} from "./historiqueNuageDef.js";

test("parseAdresseNuage reconnaît un lien de partage protégé", () => {
  const acces = parseAdresseNuage("https://cloud.ac-versailles.fr/s/AbCd1234");
  assert.deepEqual(acces, { mode: "partage", instance: "cloud.ac-versailles.fr", jeton: "AbCd1234" });
});

test("parseAdresseNuage retombe sur le mode compte pour une racine WebDAV", () => {
  const acces = parseAdresseNuage("https://drive.infomaniak.com/remote.php/dav/files/prof/");
  assert.deepEqual(acces, { mode: "compte", baseUrl: "https://drive.infomaniak.com/remote.php/dav/files/prof" });
});

test("parseAdresseNuage refuse une adresse non https", () => {
  assert.equal(parseAdresseNuage("http://cloud.ac-versailles.fr/s/AbCd1234"), null);
});

test("parseAdresseNuage refuse une adresse illisible", () => {
  assert.equal(parseAdresseNuage("pas une adresse"), null);
  assert.equal(parseAdresseNuage(""), null);
});

test("normaliseChemin retire les barres obliques de tête et de fin", () => {
  assert.equal(normaliseChemin("/MathsMentales/historique.json/"), "MathsMentales/historique.json");
});

test("normaliseChemin réduit les barres obliques répétées", () => {
  assert.equal(normaliseChemin("MathsMentales//historique.json"), "MathsMentales/historique.json");
});

test("normaliseChemin refuse une tentative de traversée de dossier", () => {
  assert.equal(normaliseChemin("MathsMentales/../secret"), null);
  assert.equal(normaliseChemin(".."), null);
});

test("refusDuProxy extrait le code d'un refus signé", () => {
  assert.equal(
    refusDuProxy('{"source":"proxy","code":"instance-not-allowed","error":"..."}'),
    "instance-not-allowed",
  );
});

test("refusDuProxy retourne null pour une réponse qui n'est pas un refus du proxy", () => {
  assert.equal(refusDuProxy("<html>404</html>"), null);
  assert.equal(refusDuProxy('{"autre":"chose"}'), null);
  assert.equal(refusDuProxy(""), null);
});

test("construireAcces complète un accès partage avec le mot de passe fourni", () => {
  const acces = construireAcces({ mode: "partage", instance: "cloud.ac-versailles.fr", jeton: "AbCd1234" }, "secret");
  assert.deepEqual(acces, { mode: "partage", instance: "cloud.ac-versailles.fr", jeton: "AbCd1234", motDePasse: "secret" });
});

test("construireAcces complète un accès compte avec identifiant et mot de passe", () => {
  const acces = construireAcces({ mode: "compte", baseUrl: "https://x/dav", identifiant: "prof" }, "secret");
  assert.deepEqual(acces, { mode: "compte", baseUrl: "https://x/dav", identifiant: "prof", motDePasse: "secret" });
});

test("construireRequeteProxy forme le corps JSON du mode partage", () => {
  const acces = { mode: "partage", instance: "cloud.ac-versailles.fr", jeton: "AbCd1234", motDePasse: "secret" };
  const requete = construireRequeteProxy("GET", acces, "MathsMentales/historique.json");
  assert.deepEqual(requete, {
    method: "GET",
    instance: "cloud.ac-versailles.fr",
    token: "AbCd1234",
    password: "secret",
    path: "MathsMentales/historique.json",
  });
});

test("construireRequeteProxy forme le corps JSON du mode compte, avec mode explicite", () => {
  const acces = { mode: "compte", baseUrl: "https://x/dav", identifiant: "prof", motDePasse: "secret" };
  const requete = construireRequeteProxy("PROPFIND", acces, "");
  assert.deepEqual(requete, {
    method: "PROPFIND",
    mode: "account",
    baseUrl: "https://x/dav",
    username: "prof",
    password: "secret",
    path: "",
  });
});

test("construireRequeteProxy n'ajoute content que si un contenu est fourni", () => {
  const acces = { mode: "partage", instance: "x", jeton: "y", motDePasse: "" };
  const sansContenu = construireRequeteProxy("GET", acces, "p");
  assert.equal("content" in sansContenu, false);
  const avecContenu = construireRequeteProxy("PUT", acces, "p", "{}");
  assert.equal(avecContenu.content, "{}");
});

test("construireRequeteProxy utilise une chaîne vide pour un mot de passe absent en mode partage", () => {
  const acces = { mode: "partage", instance: "x", jeton: "y" };
  assert.equal(construireRequeteProxy("GET", acces, "p").password, "");
});

test("interpreteStatut accepte tout statut 2xx", () => {
  assert.deepEqual(interpreteStatut(200, ""), { ok: true });
  assert.deepEqual(interpreteStatut(201, ""), { ok: true });
  assert.deepEqual(interpreteStatut(204, ""), { ok: true });
});

test("interpreteStatut : 401 en lecture veut dire absent", () => {
  const resultat = interpreteStatut(401, "");
  assert.equal(resultat.ok, false);
  assert.equal(resultat.code, "absent");
});

test("interpreteStatut : 401 en écriture veut dire mauvais mot de passe", () => {
  const resultat = interpreteStatut(401, "", { ecriture: true });
  assert.equal(resultat.ok, false);
  assert.equal(resultat.code, "authentification");
});

test("interpreteStatut : 404 veut dire absent, en lecture comme en écriture", () => {
  assert.equal(interpreteStatut(404, "").code, "absent");
  assert.equal(interpreteStatut(404, "", { ecriture: true }).code, "absent");
});

test("interpreteStatut : 403 avec refus signé instance-not-allowed a un message dédié", () => {
  const resultat = interpreteStatut(403, '{"source":"proxy","code":"instance-not-allowed","error":"x"}');
  assert.equal(resultat.code, "refuse");
  assert.match(resultat.message, /autorisé/);
});

test("interpreteStatut : 403 sans refus signé reste un refus générique", () => {
  const resultat = interpreteStatut(403, "<html>Forbidden</html>");
  assert.equal(resultat.code, "refuse");
});

test("interpreteStatut : tout le reste est une erreur réseau", () => {
  assert.equal(interpreteStatut(500, "").code, "reseau");
  assert.equal(interpreteStatut(502, "").code, "reseau");
  assert.equal(interpreteStatut(0, "").code, "reseau");
});
