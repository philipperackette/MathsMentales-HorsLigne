import protos from "./mods/protos.js";
import { utils, _ } from "./mods/utils.js";
import common from "./mods/common.js";
import cart from "./mods/cart.js";
import Figure from "./mods/figure.js";
const parameters = {};
const MM = {};
MM.version = utils.getVersion();
const content = document.querySelector(".columns");
let cardsToRemove = [];

// ============================================================
// DATA – Easy to replace with your content generator output
// Format: { left: "label", right: "label", id: unique string }
// ============================================================
let DATA = {
  2: [
    { left: "2 × 1", right: "2", id: "2x1" },
    { left: "2 × 2", right: "4", id: "2x2" },
    { left: "2 × 3", right: "6", id: "2x3" },
    { left: "2 × 4", right: "8", id: "2x4" },
    { left: "2 × 5", right: "10", id: "2x5" },
    { left: "2 × 6", right: "12", id: "2x6" },
    { left: "2 × 7", right: "14", id: "2x7" },
    { left: "2 × 8", right: "16", id: "2x8" },
    { left: "2 × 9", right: "18", id: "2x9" },
    { left: "2 × 10", right: "20", id: "2x10" },
  ],
  3: [
    { left: "3 × 1", right: "3", id: "3x1" },
    { left: "3 × 2", right: "6", id: "3x2" },
    { left: "3 × 3", right: "9", id: "3x3" },
    { left: "3 × 4", right: "12", id: "3x4" },
    { left: "3 × 5", right: "15", id: "3x5" },
    { left: "3 × 6", right: "18", id: "3x6" },
    { left: "3 × 7", right: "21", id: "3x7" },
    { left: "3 × 8", right: "24", id: "3x8" },
    { left: "3 × 9", right: "27", id: "3x9" },
    { left: "3 × 10", right: "30", id: "3x10" },
  ],
  4: [
    { left: "4 × 1", right: "4", id: "4x1" },
    { left: "4 × 2", right: "8", id: "4x2" },
    { left: "4 × 3", right: "12", id: "4x3" },
    { left: "4 × 4", right: "16", id: "4x4" },
    { left: "4 × 5", right: "20", id: "4x5" },
    { left: "4 × 6", right: "24", id: "4x6" },
    { left: "4 × 7", right: "28", id: "4x7" },
    { left: "4 × 8", right: "32", id: "4x8" },
    { left: "4 × 9", right: "36", id: "4x9" },
    { left: "4 × 10", right: "40", id: "4x10" },
  ],
  5: [
    { left: "5 × 1", right: "5", id: "5x1" },
    { left: "5 × 2", right: "10", id: "5x2" },
    { left: "5 × 3", right: "15", id: "5x3" },
    { left: "5 × 4", right: "20", id: "5x4" },
    { left: "5 × 5", right: "25", id: "5x5" },
    { left: "5 × 6", right: "30", id: "5x6" },
    { left: "5 × 7", right: "35", id: "5x7" },
    { left: "5 × 8", right: "40", id: "5x8" },
    { left: "5 × 9", right: "45", id: "5x9" },
    { left: "5 × 10", right: "50", id: "5x10" },
  ],
  6: [
    { left: "6 × 1", right: "6", id: "6x1" },
    { left: "6 × 2", right: "12", id: "6x2" },
    { left: "6 × 3", right: "18", id: "6x3" },
    { left: "6 × 4", right: "24", id: "6x4" },
    { left: "6 × 5", right: "30", id: "6x5" },
    { left: "6 × 6", right: "36", id: "6x6" },
    { left: "6 × 7", right: "42", id: "6x7" },
    { left: "6 × 8", right: "48", id: "6x8" },
    { left: "6 × 9", right: "54", id: "6x9" },
    { left: "6 × 10", right: "60", id: "6x10" },
  ],
  7: [
    { left: "7 × 1", right: "7", id: "7x1" },
    { left: "7 × 2", right: "14", id: "7x2" },
    { left: "7 × 3", right: "21", id: "7x3" },
    { left: "7 × 4", right: "28", id: "7x4" },
    { left: "7 × 5", right: "35", id: "7x5" },
    { left: "7 × 6", right: "42", id: "7x6" },
    { left: "7 × 7", right: "49", id: "7x7" },
    { left: "7 × 8", right: "56", id: "7x8" },
    { left: "7 × 9", right: "63", id: "7x9" },
    { left: "7 × 10", right: "70", id: "7x10" },
  ],
  8: [
    { left: "8 × 1", right: "8", id: "8x1" },
    { left: "8 × 2", right: "16", id: "8x2" },
    { left: "8 × 3", right: "24", id: "8x3" },
    { left: "8 × 4", right: "32", id: "8x4" },
    { left: "8 × 5", right: "40", id: "8x5" },
    { left: "8 × 6", right: "48", id: "8x6" },
    { left: "8 × 7", right: "56", id: "8x7" },
    { left: "8 × 8", right: "64", id: "8x8" },
    { left: "8 × 9", right: "72", id: "8x9" },
    { left: "8 × 10", right: "80", id: "8x10" },
  ],
  9: [
    { left: "9 × 1", right: "9", id: "9x1" },
    { left: "9 × 2", right: "18", id: "9x2" },
    { left: "9 × 3", right: "27", id: "9x3" },
    { left: "9 × 4", right: "36", id: "9x4" },
    { left: "9 × 5", right: "45", id: "9x5" },
    { left: "9 × 6", right: "54", id: "9x6" },
    { left: "9 × 7", right: "63", id: "9x7" },
    { left: "9 × 8", right: "72", id: "9x8" },
    { left: "9 × 9", right: "81", id: "9x9" },
    { left: "9 × 10", right: "90", id: "9x10" },
  ],
};

// Number of pairs visible at once on the board (minimum kept after each match)
const BOARD_SIZE = 5;
const MIN_VISIBLE = 4; // inject new pair when active pairs drop below this
const MAX_HEARTS = 3;
const COLORS = [
  "#ff6b6b",
  "#ffd166",
  "#06d6a0",
  "#118ab2",
  "#a78bfa",
  "#fb923c",
];

// ---- STATE ----
let currentTable = 2;
let queue = []; // pairs still to be introduced
let activePairs = []; // ids currently on board (not yet matched)
let matchedCount = 0;
let totalPairs = 0;
let hearts = MAX_HEARTS;
let selectedCard = null;
let locked = false;
let colorMap = {}; // id → color (assigned on match)
let matchedTotal = 0; // global matched count for color cycling

// ---- INIT ----
async function init() {
  await checkURL();
  buidData();
  // buildLevelBar();
  loadTable("panier1");
  buildChrono();
}

function buildLevelBar() {
  const bar = document.getElementById("levelBar");
  bar.innerHTML = "";
  Object.keys(DATA).forEach((t) => {
    const btn = document.createElement("button");
    btn.className = "level-btn" + (t == currentTable ? " active" : "");
    btn.textContent = `Table de ${t}`;
    btn.onclick = () => loadTable(Number(t));
    bar.appendChild(btn);
  });
}
function buildChrono() {
  const chronoEl = document.getElementById("chrono");
  if (Number(parameters.chrono) !== 0) {
    let timeLeft = parameters.chrono;
    chronoEl.textContent = `⏱️ ${formatTime(timeLeft)}`;
    const timer = setInterval(() => {
      timeLeft--;
      chronoEl.textContent = `⏱️ ${formatTime(timeLeft)}`;
      if (timeLeft <= 0) {
        clearInterval(timer);
        showDefeat();
      }
    }, 1000);
  } else {
    chronoEl.style.display = "none";
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function buidData() {
  if (parameters.alea) {
    common.setSeed(parameters.alea);
  }
  DATA = { panier1: [] };
  MM.memory = {};
  common.generateQuestions(parameters);
  for (let i = 0; i < parameters.cart.activities.length; i++) {
    const activity = parameters.cart.activities[i];
    for (let j = 0; j < activity.questions.length; j++) {
      let question = activity.questions[j];
      // value peut être un tableau de réponses toutes acceptées en ligne :
      // on n'affiche que la première, sinon elles sont concaténées
      let answer = Array.isArray(activity.values[j])
        ? activity.values[j][0]
        : activity.values[j];
      if (
        activity.type === "latex" ||
        activity.type === "" ||
        activity.type === undefined
      ) {
        question = "$$" + question + "$$";
      }
      answer = "$$" + answer + "$$";
      DATA.panier1.push({
        left: question,
        right: answer,
        id: "act" + i + "q" + j,
      });
      // figures
      if (activity.figures[j] !== undefined) {
        let divq = utils.create("div");
        if (MM.memory["dest"] === undefined) MM.memory["dest"] = content;
        DATA.panier1[DATA.panier1.length - 1].figure = [
          divq,
          new Figure(utils.clone(activity.figures[j]), "f" + j, divq),
        ];
      }
      if (activity.figuresCorrection[j] !== undefined) {
        let divr = utils.create("div");
        if (MM.memory["dest"] === undefined) MM.memory["dest"] = content;
        DATA.panier1[DATA.panier1.length - 1].figureCor = [
          new Figure(
            utils.clone(activity.figuresCorrection[questionNumber]),
            "fc" + indexOfCart + "-" + i,
            divr,
          ),
        ];
      }
    }
  }
}

function loadTable(t) {
  currentTable = t;
  // buildLevelBar();
  document.getElementById("resultBanner").classList.remove("show");

  queue = shuffle([...DATA[t]]);
  activePairs = [];
  matchedCount = 0;
  matchedTotal = 0;
  totalPairs = queue.length;
  hearts = MAX_HEARTS;
  selectedCard = null;
  locked = false;
  colorMap = {};

  // Clear board
  content.innerHTML = "";

  renderHearts();
  updateProgress();

  // Fill board initially
  const initial = Math.min(BOARD_SIZE, queue.length);
  for (let i = 0; i < initial; i++) injectPair();
  reorganizeCards();
  utils.mathRender(parameters.fontType);
}

// Pull next pair from queue and add it to the board
function injectPair() {
  if (queue.length === 0) return;
  const pair = queue.shift();
  activePairs.push(pair.id);
  addCardToColumn("colRight", pair.right, pair.id, "R", pair);
  addCardToColumn("colLeft", pair.left, pair.id, "L", pair);
}

function addCardToColumn(colId, text, id, side, pair) {
  const elementsNumber = content.querySelectorAll(
    ".card:not(.matched):not(.removing)",
  ).length;
  const card = document.createElement("div");
  const innerCard = document.createElement("div");
  card.appendChild(innerCard);
  card.className = "card entering " + colId;
  card.dataset.id = id;
  card.dataset.side = side;
  innerCard.innerHTML = text;
  if (pair.figure !== undefined && side === "L") {
    innerCard.appendChild(pair.figure[0]);
    setTimeout(() => {
      pair.figure[1].display();
    }, 300);
  }
  if (pair.figureCor !== undefined && side === "R") {
    innerCard.appendChild(pair.figureCor[0]);
    setTimeout(() => {
      pair.figureCor[1].display();
    }, 300);
  }
  card.onclick = () => onCardClick(card, id);

  // Insert at a random position among existing active (non-matched) cards
  const activeCards = [
    ...content.querySelectorAll(".card:not(.matched):not(.removing)"),
  ];
  if (activeCards.length === 0 || Math.random() < 0.2) {
    content.appendChild(card);
  } else {
    const insertBefore =
      activeCards[Math.floor(Math.random() * elementsNumber)];
    content.insertBefore(card, insertBefore);
  }
  // Trigger enter animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => card.classList.remove("entering"));
  });
}

function onCardClick(card, id) {
  if (locked) return;
  if (card.classList.contains("matched")) return;
  if (card.classList.contains("entering")) return;

  // Deselect if clicking same card
  if (selectedCard === card) {
    card.classList.remove("selected");
    selectedCard = null;
    return;
  }

  // Switch selection within same column
  if (selectedCard && selectedCard.dataset.side === card.dataset.side) {
    selectedCard.classList.remove("selected");
    card.classList.add("selected");
    selectedCard = card;
    return;
  }

  // Second card selected from opposite column
  if (selectedCard && selectedCard.dataset.side !== card.dataset.side) {
    if (selectedCard.dataset.id === id) {
      // ✅ Correct match
      attemptMatch(selectedCard, card, id);
    } else {
      // ❌ Wrong match
      const prev = selectedCard;
      selectedCard = null;
      locked = true;
      prev.classList.remove("selected");
      prev.classList.add("error-flash");
      card.classList.add("error-flash");
      hearts--;
      renderHearts();
      if (hearts <= 0) {
        setTimeout(() => {
          prev.classList.remove("error-flash");
          card.classList.remove("error-flash");
          locked = false;
          showDefeat();
        }, 500);
      } else {
        showToast("❌ Essaie encore !", "bad");
        setTimeout(() => {
          prev.classList.remove("error-flash");
          card.classList.remove("error-flash");
          locked = false;
        }, 500);
      }
    }
    return;
  }

  // First card selected
  card.classList.add("selected");
  selectedCard = card;
}

function attemptMatch(cardA, cardB, id) {
  locked = true;
  selectedCard = null;

  const color = COLORS[matchedTotal % COLORS.length];
  colorMap[id] = color;
  cardA.style.setProperty("--sel-color", color);
  cardB.style.setProperty("--sel-color", color);

  cardA.classList.add("success-flash");
  cardB.classList.add("success-flash");
  if (cardsToRemove.length > 0) {
    cardsToRemove[0].classList.remove("to-remove");
    cardsToRemove[1].classList.remove("to-remove");
    cardsToRemove[0].classList.add("removing");
    cardsToRemove[1].classList.add("removing");
    setTimeout(() => {
      cardsToRemove.forEach((c) => {
        c.remove();
//        console.log(c);
      });
      cardsToRemove = [cardA, cardB];
    }, 300);
  } else {
    cardsToRemove = [cardA, cardB];
  }
  setTimeout(() => {
    // Shrink & fade out
    cardA.classList.remove("selected", "success-flash");
    cardB.classList.remove("selected", "success-flash");
    cardA.classList.add("to-remove");
    cardB.classList.add("to-remove");

    setTimeout(() => {
      activePairs = activePairs.filter((pid) => pid !== id);
      matchedCount++;
      matchedTotal++;
      updateProgress();

      // Inject new pairs to keep the board from dropping too low
      // Rule: always keep at least MIN_VISIBLE pairs, and never let 1 pair remain alone
      const remaining = activePairs.length;
      const canInject = queue.length;

      if (canInject > 0) {
        // If only 1 pair would remain, inject enough to get to at least 3
        const target = remaining === 1 ? 2 : remaining < MIN_VISIBLE ? 1 : 0;
        const toInject = Math.min(target, canInject);
        for (let i = 0; i < toInject; i++) injectPair();
        // affiche les figures et le latex
        if (MM.memory["f" + id.slice(4)]) {
          MM.memory["f" + id.slice(4)].display();
        }
        utils.mathRender(parameters.fontType);
      }
      reorganizeCards();

      locked = false;

      // Check victory: no more active pairs and queue empty
      if (activePairs.length === 0 && queue.length === 0) {
        setTimeout(showVictory, 300);
      }
    }, 300);
  }, 350);
}

function reorganizeCards() {
  // réordonner les paires actives
  // Reorder the DOM elements to match the shuffled array
  const leftCards = [
    ...content.querySelectorAll(".card.colLeft:not(.matched):not(.removing)"),
  ];
  const rightCards = [
    ...content.querySelectorAll(".card.colRight:not(.matched):not(.removing)"),
  ];
  // Clear the content and reinsert cards in shuffled order
  content.innerHTML = "";
  for (let i = 0; i < leftCards.length; i++) {
    content.appendChild(leftCards[i]);
    content.appendChild(rightCards[i]);
  }
}

function updateProgress() {
  const pct = totalPairs > 0 ? (matchedCount / totalPairs) * 100 : 0;
  document.getElementById("progressFill").style.width = pct + "%";
  document.getElementById("scoreLabel").textContent =
    matchedCount + " / " + totalPairs;
}

function renderHearts() {
  const el = document.getElementById("hearts");
  el.innerHTML = "";
  for (let i = 0; i < MAX_HEARTS; i++) {
    const span = document.createElement("span");
    span.textContent = i < hearts ? "❤️" : "🖤";
    el.appendChild(span);
  }
}

function showVictory() {
  launchConfetti();
  const banner = document.getElementById("resultBanner");
  document.getElementById("resultEmoji").textContent = "🎉";
  document.getElementById("resultTitle").textContent = "Bravo !";
  document.getElementById("resultTitle").className = "result-title win";
  document.getElementById("resultSub").textContent =
    `Table de ${currentTable} complétée avec ${hearts} ❤️ restant${hearts > 1 ? "s" : ""} !`;
  document.getElementById("nextBtn").textContent = "Rejouer →";
  document.getElementById("nextBtn").onclick = () => loadTable(currentTable);
  banner.classList.add("show");
}

function showDefeat() {
  const banner = document.getElementById("resultBanner");
  document.getElementById("resultEmoji").textContent = "💔";
  document.getElementById("resultTitle").textContent = "Pas de chance !";
  document.getElementById("resultTitle").className = "result-title lose";
  document.getElementById("resultSub").textContent =
    "Tu peux réessayer, tu vas y arriver !";
  document.getElementById("nextBtn").textContent = "Réessayer 💪";
  document.getElementById("nextBtn").onclick = () => loadTable(currentTable);
  banner.classList.add("show");
}

// Toast
let toastTimer;
function showToast(msg, type) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = "toast show " + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 1600);
}

// Confetti
function launchConfetti() {
  const colors = [
    "#ff6b6b",
    "#ffd166",
    "#06d6a0",
    "#a78bfa",
    "#fb923c",
    "#118ab2",
  ];
  for (let i = 0; i < 60; i++) {
    setTimeout(() => {
      const el = document.createElement("div");
      el.className = "confetti-piece";
      el.style.left = Math.random() * 100 + "vw";
      el.style.top = "-10px";
      el.style.background = colors[Math.floor(Math.random() * colors.length)];
      el.style.width = 6 + Math.random() * 8 + "px";
      el.style.height = 6 + Math.random() * 8 + "px";
      el.style.animationDuration = 0.8 + Math.random() * 1.4 + "s";
      el.style.animationDelay = "0s";
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2500);
    }, i * 30);
  }
}

// Shuffle
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function checkURL(urlString) {
  const vars = utils.getUrlVars(urlString);
  if (vars.embed !== undefined) {
    // cas d'une activité embeded, on vérifie que l'url est conforme
    let expression =
      /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
    let regex = new RegExp(expression);
    if (vars.embed.match(regex)) MM.embededIn = vars.embed;
  }
  // Add Button Edit parameters of document
  // check if window has been opened directly
  if (window.opener === null) {
    const $destination = document.body;
    const buttonEdit = utils.create("button", {
      innerHTML: "🖋️ Éditer",
      className: "noprint abstopright",
      title: "Éditer les activités des cartes",
    });
    buttonEdit.onclick = () => {
      let url =
        window.location.href.replace("mathch.html", "index.html") +
        "&edit&type=match";
      // add alea key
      url = url.replace(/,a=[\d\w]*,/, ",a=" + parameters.alea + ",");
      window.location.href = url;
    };
    $destination.prepend(buttonEdit);
  }

  if (vars.c !== undefined) {
    if (vars.a) {
      parameters.alea = vars.a;
    } else {
      parameters.alea = common.setSeed();
    }
    // paramètres des activités des paniers
    let json = vars.c;
    // parametres globaux :
    parameters.fontType = vars.fs ?? "serif";
    parameters.tailleTexte = 10.5;
    parameters.nb = Number(vars.n);
    parameters.titreFiche = decodeURI(vars.t);
    parameters.chrono = vars.d;
    parameters.cart = new cart(0);
    parameters.doublons = false; // on ne veut pas de doublons dans les réponses proposées
    await parameters.cart
      .import(json[0], false, MM.version)
      .then(() => {
        return true;
      })
      .catch((err) => {
        // erreur à l'importation :(
        let alert = utils.create("div", {
          id: "messageerreur",
          className: "message",
          innerHTML: "Impossible de charger le panier :(<br>" + err,
        });
        document.getElementById("tab-accueil").appendChild(alert);
      });
  }
}

init();
