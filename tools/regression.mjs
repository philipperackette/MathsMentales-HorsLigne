/**
 * Harnais de non-régression pour src/js/mods/activity.js
 *
 *   node tools/regression.mjs snapshot   -> écrit tools/snapshot.json
 *   node tools/regression.mjs check      -> rejoue et compare, sortie 1 si écart
 *
 * Le hasard est rendu reproductible par utils.initializeAlea(graine), déjà
 * utilisé par le diaporama : même graine, même suite de questions.
 *
 * Ce fichier ne part ni dans le bundle (gulpfile.cjs ne liste que
 * src/js/lib.*.js) ni en production (.gitlab-ci.yml ne copie que src/ et public/).
 */
import "./dom-stubs.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TMP = path.join(ROOT, "tools", ".tmp");
const LIBRARY = path.join(ROOT, "public", "library");
// --ref <fichier> pour viser un autre instantané que celui par défaut
const refArg = process.argv.indexOf("--ref");
const SNAPSHOT =
  refArg > -1 && process.argv[refArg + 1]
    ? path.resolve(process.argv[refArg + 1])
    : path.join(ROOT, "tools", "snapshot.json");
const NBQ = 20;

/**
 * Le package.json de la racine déclare "type": "commonjs", ce qui empêche node
 * de charger src/js/mods/*.js comme modules ES. On recopie donc src/js sous
 * tools/.tmp avec un package.json qui déclare "module". La copie est
 * bit-à-bit : c'est le vrai code qui est testé, pas une réimplémentation.
 */
function prepareTree() {
  fs.rmSync(TMP, { recursive: true, force: true });
  fs.mkdirSync(TMP, { recursive: true });
  fs.writeFileSync(
    path.join(TMP, "package.json"),
    JSON.stringify({ type: "module" }),
  );
  fs.cpSync(path.join(ROOT, "src", "js"), path.join(TMP, "js"), {
    recursive: true,
  });
  // MM_ACTIVITY_JS permet de mesurer une autre version d'activity.js sans
  // toucher à src/ : indispensable pour (re)constituer un instantané de
  // référence pendant qu'on modifie le fichier.
  if (process.env.MM_ACTIVITY_JS) {
    fs.copyFileSync(
      path.resolve(process.env.MM_ACTIVITY_JS),
      path.join(TMP, "js", "mods", "activity.js"),
    );
    console.log("activity.js remplacé par " + process.env.MM_ACTIVITY_JS + "\n");
  }
}

function listActivities() {
  const found = [];
  for (const dir of fs.readdirSync(LIBRARY)) {
    const full = path.join(LIBRARY, dir);
    if (!dir.startsWith("N") || !fs.statSync(full).isDirectory()) continue;
    for (const file of fs.readdirSync(full)) {
      if (!/\.(json|yml)$/.test(file)) continue;
      found.push({ id: file.replace(/\.(json|yml)$/, ""), file: path.join(full, file) });
    }
  }
  return found.sort((a, b) => a.id.localeCompare(b.id));
}

/** JSON stable : clés triées, pour qu'un simple réordonnancement ne fasse pas de bruit. */
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = stable(value[key]);
    return out;
  }
  return value;
}

async function run() {
  prepareTree();
  const { utils } = await import(path.join(TMP, "js", "mods", "utils.js"));
  const activity = (await import(path.join(TMP, "js", "mods", "activity.js"))).default;

  // utils.debug lève une exception quand modeDebug est vrai et qu'il n'y a pas
  // de div #errors — ce qui est le cas de toutes les pages sauf editor*.html.
  // On l'intercepte pour collecter les messages sans interrompre le balayage.
  let collected = [];
  utils.debug = (...args) => {
    collected.push(args.map((a) => (a instanceof Error ? a.message : String(a))).join(" "));
  };

  const snapshot = {};
  for (const { id, file } of listActivities()) {
    let definition;
    try {
      definition = yaml.load(fs.readFileSync(file, "utf8"));
    } catch (error) {
      snapshot[id] = { erreurFichier: error.message };
      continue;
    }
    if (!definition || typeof definition !== "object") continue;

    collected = [];
    utils.initializeAlea("mm-" + id);
    try {
      const act = new activity(definition, id);
      act.nbq = NBQ;
      act.generate(NBQ);
      snapshot[id] = stable({
        questions: act.questions,
        shortQuestions: act.shortQuestions,
        answers: act.answers,
        values: act.values,
        audios: act.audios,
        consignes: act.consignes,
        figures: act.figures,
        figuresCorrection: act.figuresCorrection,
        keyBoards: act.keyBoards,
        // generateSample() suit un chemin distinct dans generate() : on le
        // couvre sur une instance neuve et regraînée, pour qu'il ne dépende
        // pas de l'état laissé par la génération principale.
        sample: (() => {
          utils.initializeAlea("mm-sample-" + id);
          const apercu = new activity(definition, id);
          apercu.nbq = NBQ;
          try {
            apercu.generateSample();
            return apercu.sample;
          } catch (error) {
            return { erreurSample: error.message };
          }
        })(),
        messages: collected,
      });
    } catch (error) {
      snapshot[id] = { erreurGeneration: error.message, messages: collected };
    }
  }
  return snapshot;
}

/** Compare deux instantanés et décrit le premier écart de chaque activité. */
function diff(before, after) {
  const ecarts = [];
  const ids = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const id of [...ids].sort()) {
    if (!(id in before)) {
      ecarts.push({ id, quoi: "activité nouvelle" });
      continue;
    }
    if (!(id in after)) {
      ecarts.push({ id, quoi: "activité disparue" });
      continue;
    }
    const a = JSON.stringify(before[id]);
    const b = JSON.stringify(after[id]);
    if (a === b) continue;
    // localiser le premier champ qui change
    let detail = "";
    for (const champ of Object.keys(before[id])) {
      const av = JSON.stringify(before[id][champ]);
      const ap = JSON.stringify(after[id]?.[champ]);
      if (av !== ap) {
        detail = champ;
        const i = Array.isArray(before[id][champ])
          ? before[id][champ].findIndex(
              (v, k) => JSON.stringify(v) !== JSON.stringify(after[id][champ]?.[k]),
            )
          : -1;
        if (i >= 0) {
          detail += ` [${i}]\n      avant : ${JSON.stringify(before[id][champ][i])}`;
          detail += `\n      après : ${JSON.stringify(after[id][champ]?.[i])}`;
        } else {
          detail += `\n      avant : ${av.slice(0, 160)}\n      après : ${String(ap).slice(0, 160)}`;
        }
        break;
      }
    }
    ecarts.push({ id, quoi: detail });
  }
  return ecarts;
}

/** Statistiques utiles indépendamment de toute comparaison. */
function report(snapshot) {
  let complet = 0,
    incomplet = [],
    erreurs = [],
    avecMessages = [],
    doublons = [];
  for (const [id, data] of Object.entries(snapshot)) {
    if (data.erreurGeneration || data.erreurFichier) {
      erreurs.push(id + " → " + (data.erreurGeneration || data.erreurFichier));
      continue;
    }
    const n = data.questions.length;
    if (n < NBQ) incomplet.push(`${id}:${n}`);
    else complet++;
    if (data.messages?.length) avecMessages.push(id);
    const cles = data.questions.map((q, i) => JSON.stringify([q, data.values[i]]));
    const distinctes = new Set(cles).size;
    if (distinctes < cles.length) doublons.push(`${id}:${cles.length - distinctes}`);
  }
  console.log(`  ${complet} activités génèrent ${NBQ}/${NBQ} questions`);
  console.log(`  ${incomplet.length} incomplètes` + (incomplet.length ? " : " + incomplet.join(" ") : ""));
  console.log(`  ${erreurs.length} en erreur` + (erreurs.length ? "\n    " + erreurs.join("\n    ") : ""));
  console.log(`  ${avecMessages.length} émettent un message de debug` + (avecMessages.length ? " : " + avecMessages.join(" ") : ""));
  console.log(`  ${doublons.length} avec doublons` + (doublons.length ? " : " + doublons.join(" ") : ""));
}

const mode = process.argv[2] || "check";
const debut = Date.now();
const snapshot = await run();
console.log(`${Object.keys(snapshot).length} activités parcourues en ${Date.now() - debut} ms\n`);
report(snapshot);

if (mode === "snapshot") {
  fs.writeFileSync(SNAPSHOT, JSON.stringify(snapshot, null, 1));
  const taille = (fs.statSync(SNAPSHOT).size / 1e6).toFixed(1);
  console.log(`\nInstantané écrit dans ${path.relative(ROOT, SNAPSHOT)} (${taille} Mo)`);
} else {
  if (!fs.existsSync(SNAPSHOT)) {
    console.error("\nAucun instantané de référence. Lancer d'abord : node tools/regression.mjs snapshot");
    process.exit(2);
  }
  const before = JSON.parse(fs.readFileSync(SNAPSHOT, "utf8"));
  const ecarts = diff(before, snapshot);
  if (ecarts.length === 0) {
    console.log("\nAucun écart avec l'instantané de référence.");
  } else {
    console.log(`\n${ecarts.length} activité(s) modifiée(s) :`);
    for (const e of ecarts) console.log(`  ${e.id} : ${e.quoi}`);
    process.exit(1);
  }
}
