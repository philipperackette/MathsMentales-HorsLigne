import { utils } from "./mods/utils.js";
import ParkourState, { STATUS } from "./mods/parkourState.js";
import { decode as decodeParcours, normalize as normalizeParcours } from "./mods/parkourDef.js";
import common from "./mods/common.js";
import cart from "./mods/cart.js";
import keyBoard from "./mods/keyboard.js";
import analyseReponse from "./mods/analysereponse.js";
import Figure from "./mods/figure.js";
import { MathfieldElement } from "./libs/mathlive/mathlive.mjs.js";

MathfieldElement.fontsDirectory = "../css/katex/fonts";
MathfieldElement.soundsDirectory = null;

const MM = {};
MM.version = utils.getVersion();

let parkourDef = null;
let parkourState = null;
let currentGame = null;
// instances de Figure de l'étape en cours, indexées par numéro de question.
// Elles doivent survivre jusqu'au prochain renderQuestion() qui remplace le DOM.
let figureInstances = {};
// champ de saisie MathLive de la question affichée (voir renderQuestion)
let currentMathfield = null;

const STATUS_LABELS = {
  [STATUS.LOCKED_PREREQ]: "Verrouillée",
  [STATUS.LOCKED_TIMER]: "Bientôt disponible",
  [STATUS.LOCKED_FAIL]: "Réessaie plus tard",
  [STATUS.AVAILABLE]: "Disponible",
  [STATUS.PASSED]: "Réussie",
};

const SUPPORT_ICONS = {
  arbre: "🌳",
  toit: "🏠",
  barre: "🤸",
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
    const div = utils.create("div", { className: "parkour-theme" });
    const label = utils.create("span", {
      className: "parkour-theme-label",
      textContent: theme.label + " : " + stars.passed + " / " + stars.total,
    });
    // barre d'étoiles qui se remplit au fur et à mesure des étapes réussies
    const bar = utils.create("span", {
      className: "parkour-theme-stars",
      textContent:
        "★".repeat(stars.passed) + "☆".repeat(stars.total - stars.passed),
    });
    div.appendChild(label);
    div.appendChild(bar);
    zone.appendChild(div);
  }
}

/**
 * Date à laquelle une étape verrouillée redeviendra accessible.
 * Calculée comme dans ParkourState.getStatus().
 * @returns {number|null} timestamp en ms, ou null si non applicable
 */
function etapeDeadline(etape, status) {
  if (status === STATUS.LOCKED_FAIL) {
    return parkourState.etapes[etape.id].lockedUntil;
  }
  if (status === STATUS.LOCKED_TIMER) {
    const index = parkourDef.etapes.findIndex((e) => e.id === etape.id);
    if (index > 0) {
      const prev = parkourState.etapes[parkourDef.etapes[index - 1].id];
      if (prev.passedAt !== null) {
        return prev.passedAt + parkourState.unlockDelayMs();
      }
    }
  }
  return null;
}

function renderChemin() {
  const zone = document.getElementById("parkour-chemin");
  zone.innerHTML = "";
  for (const etape of parkourDef.etapes) {
    const status = parkourState.getStatus(etape.id);
    const support = SUPPORT_ICONS[etape.support];
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
    titre.appendChild(document.createTextNode(etape.titre || ""));
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
    if (status === STATUS.AVAILABLE || status === STATUS.PASSED) {
      card.classList.add("available");
      card.onclick = () => startEtape(etape);
    }
    zone.appendChild(card);
  }
}

function renderAccueil() {
  document.getElementById("parkour-accueil").innerHTML = "";
  const title = utils.create("h1", { textContent: parkourDef.titre });
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
}

async function startEtape(etape) {
  const status = parkourState.getStatus(etape.id);
  if (status !== STATUS.AVAILABLE && status !== STATUS.PASSED) return;

  const panierCart = new cart(0);
  // cart.import() avale ses propres erreurs et résout toujours : on ne peut pas
  // s'appuyer sur un try/catch, il faut vérifier ce qui a réellement été chargé.
  await panierCart.import(etape.panier, false, MM.version);
  if (!panierCart.activities || panierCart.activities.length === 0) {
    window.alert(
      "Impossible de charger les exercices de cette étape. Vérifie ta connexion puis réessaie.",
    );
    return;
  }

  // utils.alea (utilisé par math.js pour tout tirage aléatoire dans generate())
  // n'existe qu'après un appel à common.setSeed() — jamais fait sinon.
  common.setSeed();

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

  figureInstances = {};

  currentGame = {
    etape,
    panierCart,
    actArray: selection,
    index: 0,
    correctCount: 0,
    // trace de chaque question pour le corrigé affiché en fin d'étape
    corrige: [],
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

/**
 * Un énoncé de type latex est un fragment brut à encadrer par $$...$$ pour que
 * KaTeX le rende ; les autres types portent déjà leur propre balisage.
 */
function isLatexActivity(activity) {
  return (
    activity.type === "latex" ||
    activity.type === "" ||
    activity.type === undefined
  );
}

/** HTML de l'énoncé (consigne comprise), prêt pour utils.mathRender. */
function questionHtml(activity, questionIndex) {
  const question = activity.questions[questionIndex];
  const consigne =
    activity.consignes !== undefined
      ? activity.consignes[questionIndex]
      : undefined;
  const body = isLatexActivity(activity)
    ? '<span class="math">$$' + question + "$$</span>"
    : question;
  return (consigne !== undefined ? consigne + "<br>" : "") + body;
}

/** HTML de la réponse attendue, pour le corrigé de fin d'étape. */
function answerHtml(activity, questionIndex) {
  // answers[] est la version affichable ; values[] ne sert qu'à la correction
  // automatique et peut lister plusieurs écritures acceptées.
  let answer = activity.answers[questionIndex];
  if (answer === undefined || answer === "") {
    const expected = activity.values[questionIndex];
    answer = Array.isArray(expected)
      ? expected[0]
      : String(expected).split(",")[0];
  }
  return isLatexActivity(activity)
    ? '<span class="math">$$' + answer + "$$</span>"
    : answer;
}

function renderQuestion() {
  const { actArray, index } = currentGame;
  const { activity, questionIndex } = currentActivityAndQuestion();

  document.getElementById("parkour-progressquestion").innerHTML =
    "Question " + (index + 1) + " / " + actArray.length;

  const zone = document.getElementById("parkour-question");
  // MathLive mémorise dans une variable statique le champ qui a le focus. Si on
  // détruit ce champ sans lui avoir retiré le focus, ce pointeur reste sur un
  // élément démonté, et le focus donné au champ suivant déclenche dessus un
  // onBlur() qui lit la valeur d'un mathfield détruit (« this.mathfield is
  // undefined »). On rend donc la main proprement avant de vider la zone.
  if (currentMathfield !== null) {
    currentMathfield.blur();
    currentMathfield = null;
  }
  zone.innerHTML = "";

  const divq = utils.create("div", {
    className: "parkour-question-text",
    innerHTML: questionHtml(activity, questionIndex),
  });
  zone.appendChild(divq);

  // figure éventuelle attachée à la question
  const figureDef =
    activity.figures !== undefined ? activity.figures[questionIndex] : undefined;
  if (figureDef !== undefined) {
    const figureId = "pkfig" + index;
    figureInstances[figureId] = new Figure(
      utils.clone(figureDef),
      figureId,
      divq,
    );
  }

  const mf = new MathfieldElement({ mathVirtualKeyboardPolicy: "manual" });
  zone.appendChild(mf);
  new keyBoard(mf, activity.keys || undefined, zone, "p", "kp" + index);
  mf.addEventListener("keyup", (event) => {
    if (event.key === "Enter" || event.code === "NumpadEnter") {
      event.preventDefault();
      validateAnswer(mf.value);
    }
  });
  currentMathfield = mf;
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

  const ok = Boolean(
    userAnswer && isAnswerCorrect(activity, questionIndex, userAnswer),
  );
  if (ok) currentGame.correctCount++;

  currentGame.corrige.push({
    question: questionHtml(activity, questionIndex),
    answer: answerHtml(activity, questionIndex),
    userAnswer: userAnswer || "",
    ok,
  });

  currentGame.index++;
  if (currentGame.index < currentGame.actArray.length) {
    renderQuestion();
  } else {
    endEtape();
  }
}

/** Liste HTML des questions de l'étape avec réponse donnée et réponse attendue. */
function corrigeHtml(corrige) {
  let html = '<ol class="parkour-corrige">';
  for (const item of corrige) {
    html +=
      '<li class="' +
      (item.ok ? "good" : "wrong") +
      '"><span class="parkour-corrige-question">' +
      item.question +
      "</span>";
    if (!item.ok) {
      html +=
        '<span class="parkour-corrige-user">Ta réponse : ' +
        (item.userAnswer === ""
          ? "<em>(vide)</em>"
          : '<span class="math">$' + item.userAnswer + "$</span>") +
        "</span>";
    }
    html +=
      '<span class="parkour-corrige-answer">Réponse : ' +
      item.answer +
      "</span></li>";
  }
  return html + "</ol>";
}

function endEtape() {
  const { etape, correctCount, tempsReel, tempsPrevu, corrige } = currentGame;
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
  utils.mathRender("serif", ["#parkour-fin-content"]);
  document.getElementById("btn-retour-accueil").onclick = () => {
    document.getElementById("parkour-fin").classList.add("hidden");
    document.getElementById("parkour-accueil").classList.remove("hidden");
    renderAccueil();
  };
}

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

async function init() {
  try {
    parkourDef = await loadParcours();
    parkourState = new ParkourState(parkourDef, { storage: window.localStorage });
  } catch (err) {
    const container = document.getElementById("parkour-accueil");
    container.innerHTML = "";
    const p = utils.create("p", {
      textContent: "Erreur de chargement du parcours : " + err.message,
    });
    container.appendChild(p);
    return;
  }
  renderAccueil();
}

init();
