// ======================
// IMPORTS
// ======================
// Import des modules nécessaires
import protos from "./mods/protos.js"; // Prototypes et extensions
import utils from "./mods/utils.js"; // Utilitaires généraux
import common from "./mods/common.js"; // Fonctions communes
import cart from "./mods/cart.js"; // Gestion des paniers
import Figure from "./mods/figure.js"; // Gestion des figures

// ======================
// VARIABLES GLOBALES
// ======================
const MM = {}; // Objet principal pour les méthodes et propriétés du module
MM.version = utils.getVersion();

const content = document.getElementById("creator-content");
const pageOrientations = ["portrait", "paysage"];
const parameters = {};
let fontSize = "1";
let cardIdsToReview = []; // tableau pour stocker les IDs des cartes à réviser

// ======================
// GESTION DES ÉVÉNEMENTS
// ======================

/**
 * Retourne toutes les cartes lorsque l'utilisateur clique sur "flipall".
 */
document.getElementById("flipall").onclick = () => {
  let rotate = true;
  const elements = document.querySelectorAll(".flip-card-inner");
  const nbOfElements = elements.length;
  let count = 0;
  elements.forEach((el) => {
    if (el.classList.contains("rotate")) count++;
  });
  elements.forEach((el) => {
    if (count < nbOfElements) el.classList.add("rotate");
    else el.classList.remove("rotate");
  });
};

// ======================
// FONCTIONS UTILITAIRES
// ======================

/**
 * Rafraîchit l'affichage de la page et rend les formules mathématiques.
 */
function refresh() {
  makePage();
  utils.mathRender(parameters.fontType, [".question", ".answer"]);
}

/**
 * Augmente la taille de la police.
 */
function fontSizePlus() {
  unsetAllCardHeight();
  fontSize = fontSize * 1.25;
  content.style["font-size"] = fontSize + "em";
  setAllCardSameHeight();
}

/**
 * Diminue la taille de la police.
 */
function fontSizeMinus() {
  unsetAllCardHeight();
  fontSize = fontSize * 0.8;
  content.style["font-size"] = fontSize + "em";
  setAllCardSameHeight();
}
document.getElementById("zoomin").onclick = () => {
  fontSizePlus();
};
document.getElementById("zoomout").onclick = () => {
  fontSizeMinus();
};
document.getElementById("dice").onclick = () => {
  parameters.alea = common.setSeed();
  refresh();
};
function getRandomPastelColor() {
  return (
    "hsl(" +
    360 * Math.random() +
    "," +
    (25 + 70 * Math.random()) +
    "%," +
    (85 + 10 * Math.random()) +
    "%)"
  );
}
let tints = [];
function setRandomPaletteOfTint(tint) {
  // set random palette of a tint passed as parameter
  return (
    "hsl(" +
    tint +
    "," +
    (25 + 70 * Math.random()) +
    "%," +
    (85 + 10 * Math.random()) +
    "%)"
  );
}
function setRandomTint(numberOfTints) {
  if (numberOfTints === undefined) {
    return [];
  }
  let tints = [Math.round(360 * Math.random())];
  if (numberOfTints === 2) {
    tints.push(tints[0] + 180);
  } else if (numberOfTints === 3) {
    tints.push(tints[0] + 120);
    tints.push(tints[0] + 240);
  } else {
    tints.push(tints[0] + 90);
    tints.push(tints[0] + 180);
    tints.push(tints[0] - 90);
  }
  return tints;
}
/**
 * Génère la page avec les cartes de questions et réponses.
 * Cette fonction crée dynamiquement les éléments HTML pour chaque carte,
 * gère les couleurs aléatoires ou les paires de couleurs,
 * et affiche les questions et réponses avec les figures associées.
 * Elle gère également le mélange des questions si nécessaire,
 * et ajuste la taille des cartes pour qu'elles soient de même hauteur.
 */
function makePage() {
  try {
    if (parameters.alea) {
      common.setSeed(parameters.alea);
    }
    content.innerHTML = "";
    MM.memory = {};
    common.generateQuestions(parameters);
    if (parameters.carts.length === 2) {
      content.classList.add("hasTwoChildren");
      tints = setRandomTint(2);
    }
    parameters.arrayOfQuestionsAndAnswers = [];
    for (
      let indexOfCart = 0;
      indexOfCart < parameters.carts.length;
      indexOfCart++
    ) {
      parameters.arrayOfQuestionsAndAnswers[indexOfCart] = [];
      // stockage des références des questions
      for (const [activityNumber, activity] of parameters.carts[
        indexOfCart
      ].activities.entries()) {
        for (
          let questionNumber = 0;
          questionNumber < activity.questions.length;
          questionNumber++
        ) {
          parameters.arrayOfQuestionsAndAnswers[indexOfCart].push([
            activityNumber,
            questionNumber,
          ]);
        }
      }
      // tirage aléatoire d'un sous-ensemble de questions parmi le panier
      if (parameters.carts[indexOfCart].randomDraw) {
        parameters.arrayOfQuestionsAndAnswers[indexOfCart] =
          utils.drawRandomSubset(
            parameters.arrayOfQuestionsAndAnswers[indexOfCart],
            parameters.carts[indexOfCart].activities.length,
            parameters.carts[indexOfCart].randomCount,
          );
      }
      // mélange des questions
      if (!parameters.carts[indexOfCart].ordered) {
        parameters.arrayOfQuestionsAndAnswers[indexOfCart] = utils.shuffle(
          parameters.arrayOfQuestionsAndAnswers[indexOfCart],
        );
      }
    }
    for (
      let indexOfCart = 0;
      indexOfCart < parameters.arrayOfQuestionsAndAnswers.length;
      indexOfCart++
    ) {
      const nbOfQuestions =
        parameters.arrayOfQuestionsAndAnswers[indexOfCart].length;
      // create container
      const containerOfCards = utils.create("section", {
        className: "wall-section",
      });
      let nbOfCards = 0;
      for (
        let i = 0;
        i < parameters.arrayOfQuestionsAndAnswers[indexOfCart].length;
        i++
      ) {
        const [activityNumber, questionNumber] =
          parameters.arrayOfQuestionsAndAnswers[indexOfCart][i];
        const activity =
          parameters.carts[indexOfCart].activities[activityNumber];
        nbOfCards++;
        let colorCard;
        if (parameters.carts.length === 2) {
          colorCard = setRandomPaletteOfTint(tints[indexOfCart]);
        } else {
          colorCard = getRandomPastelColor();
        }
        const container = utils.create("article", {
          className: "tuile",
          id: "card-" + indexOfCart + "-" + i,
        });
        const flipCardInner = utils.create("div", {
          className: "flip-card-inner",
        });
        const artQuestion = utils.create("div", {
          className: "question flip-card-front",
        });
        artQuestion.style.backgroundColor = colorCard;
        const buttonSolution = utils.create("div", {
          className: "interrogation",
          innerText: "?",
          title: "Cliquer pour afficher la correction",
        });
        const divq = utils.create("div");
        if (activity.consignes[questionNumber] !== undefined) {
          divq.appendChild(
            utils.create("div", {
              innerHTML: "<i>" + activity.consignes[questionNumber] + "</i>",
            }),
          );
        }
        const artCorrection = utils.create("div", {
          className: "answer flip-card-back",
        });
        artCorrection.style.backgroundColor = colorCard;

        // Create check and no-check buttons for the front of the card
        const checkBtnFront = utils.create("button", {
          className: "check-btn",
          innerHTML: "✓",
          title: "Marquer comme compris",
        });
        const noCheckBtnFront = utils.create("button", {
          className: "no-check-btn",
          innerHTML: "✗",
          title: "À réviser",
        });

        // Add the buttons to the front and back of the card
        container.appendChild(checkBtnFront);
        container.appendChild(noCheckBtnFront);

        const divr = utils.create("div");
        let answer = activity.answers[questionNumber];
        if (typeof answer === "object") {
          answer = answer[0];
        }
        if (
          activity.type === "latex" ||
          activity.type === "" ||
          activity.type === undefined
        ) {
          const span = utils.create("span", {
            innerHTML: "$$" + activity.questions[questionNumber] + "$$",
          });
          const spanCorrection = utils.create("span", {
            innerHTML: "$$" + answer + "$$",
          });
          divq.appendChild(span);
          divr.appendChild(spanCorrection);
        } else {
          divq.innerHTML += activity.questions[questionNumber];
          divr.innerHTML += answer;
        }
        artQuestion.appendChild(divq);
        flipCardInner.appendChild(artQuestion);
        // figures
        if (activity.figures[questionNumber] !== undefined) {
          MM.memory["f" + indexOfCart + "-" + i] = new Figure(
            utils.clone(activity.figures[questionNumber]),
            "f" + indexOfCart + "-" + i,
            divq,
          );
        }
        if (activity.figuresCorrection[questionNumber] !== undefined) {
          MM.memory["fc" + indexOfCart + "-" + i] = new Figure(
            utils.clone(activity.figuresCorrection[questionNumber]),
            "fc" + indexOfCart + "-" + i,
            divr,
          );
        }
        artCorrection.appendChild(divr);
        flipCardInner.appendChild(artCorrection);
        container.appendChild(flipCardInner);
        artQuestion.appendChild(
          utils.create("div", { className: "numero", innerText: nbOfCards }),
        );
        artCorrection.appendChild(
          utils.create("div", { className: "numero", innerText: nbOfCards }),
        );
        const navigation = utils.create("div", { className: "navigation" });
        if (nbOfCards > 1) {
          const prevBtn = utils.create("button", {
            className: "prev",
            innerHTML:
              '<?xml version="1.0" ?><svg id="Outline" height="48" width="48" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><defs><style>.cls-1{fill:#262626;}</style></defs><path transform="rotate(180 256 256)" class="cls-1" d="M357,249.84,169.05,101.3a11.34,11.34,0,0,0-18.37,8.9V405.77A11.34,11.34,0,0,0,169,414.7l188-147a11.34,11.34,0,0,0,0-17.83ZM173.36,382.51V133.61L331.63,258.69Z"/></svg>',
          });
          navigation.appendChild(prevBtn);
        } else if (nbOfCards === 1) {
          const prevBtn = utils.create("button", {
            className: "prev disabled",
            innerText: "",
          });
          navigation.appendChild(prevBtn);
        }
        if (nbOfCards < nbOfQuestions) {
          const nextBtn = utils.create("button", {
            className: "next",
            innerHTML:
              '<?xml version="1.0" ?><svg id="Outline" height="48" width="48" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><defs><style>.cls-1{fill:#262626;}</style></defs><path class="cls-1" d="M357,249.84,169.05,101.3a11.34,11.34,0,0,0-18.37,8.9V405.77A11.34,11.34,0,0,0,169,414.7l188-147a11.34,11.34,0,0,0,0-17.83ZM173.36,382.51V133.61L331.63,258.69Z"/></svg>',
          });
          navigation.appendChild(nextBtn);
        } else if (nbOfCards === nbOfQuestions) {
          const nextBtn = utils.create("button", {
            className: "next disabled",
            innerText: "",
          });
          navigation.appendChild(nextBtn);
        }
        artQuestion.appendChild(
          utils.create("div", {
            className: "fullscreenbtn",
          }),
        );
        artCorrection.appendChild(
          utils.create("div", {
            className: "fullscreenbtn",
          }),
        );
        container.appendChild(buttonSolution);
        container.appendChild(navigation);
        containerOfCards.appendChild(container);

        // Add a data attribute to identify the card for review purposes
        container.setAttribute("data-card-id", `card-${indexOfCart}-${i}`);
      }
      content.appendChild(containerOfCards);
    }
    if (!utils.isEmpty(MM.memory)) {
      setTimeout(function () {
        for (const k in MM.memory) {
          if (k !== "dest") MM.memory[k].display();
        }
        setTimeout(() => {
          setAllCardSameHeight();
        }, 500);
      }, 300);
    } else {
      setAllCardSameHeight();
    }
  } catch (error) {
    console.error("Erreur dans la fonction MakePage :", error);
  }
}
// Function to handle the no-check button click
const handleNoCheckClick = (target) => {
  const card = target.closest(".tuile");
  const cardId = card.id;
  if (!cardIdsToReview.includes(cardId)) {
    cardIdsToReview.push(cardId);
    // on passe à la carte suivante
    // vérifier si la carte suivante existe
    const nextCard = card.nextElementSibling;
    if (nextCard) {
      toggleFullScreen(card.querySelector(".fullscreenexitbtn"));
      toggleFullScreen(nextCard.querySelector(".fullscreenbtn"));
    } else {
      // on affiche la possibilité de continuer avec les cartes à revoir ou de terminer la révision
      reviewCards();
    }
  }
  return false;
};
const handleCheckClick = (element) => {
  const card = element.closest(".tuile");
  const cardId = card.id;
  const index = cardIdsToReview.indexOf(cardId);
  if (index !== -1) {
    cardIdsToReview.splice(index, 1);
  }
  // vérifier si la carte suivante existe
  const nextCard = card.nextElementSibling;
  if (nextCard) {
    toggleFullScreen(card.querySelector(".fullscreenexitbtn"));
    toggleFullScreen(nextCard.querySelector(".fullscreenbtn"));
  } else {
    // on affiche la possibilité de continuer avec les cartes à revoir ou de terminer la révision
    reviewCards();
  }
  return false;
};
content.onclick = (event) => {
  let target = event.target;
  if (target.tagName === "svg" || target.tagName === "path") {
    // Si l'élément cliqué est un SVG ou un chemin, remonter jusqu'au bouton parent
    target = target.closest("button");
  }
  if (target.classList.contains("interrogation")) {
    target.parentNode
      .querySelector(".flip-card-inner")
      .classList.toggle("rotate");
  } else if (
    target.classList.contains("fullscreenbtn") ||
    target.classList.contains("fullscreenexitbtn")
  ) {
    toggleFullScreen(target);
  } else if (target.classList.contains("prev")) {
    toggleFullScreen(
      target.parentNode.parentNode.querySelector(".fullscreenexitbtn"),
    );
    toggleFullScreen(
      target.parentNode.parentNode.previousElementSibling.querySelector(
        ".fullscreenbtn",
      ),
    );
  } else if (target.classList.contains("next")) {
    toggleFullScreen(
      target.parentNode.parentNode.querySelector(".fullscreenexitbtn"),
    );
    toggleFullScreen(
      target.parentNode.parentNode.nextElementSibling.querySelector(
        ".fullscreenbtn",
      ),
    );
  } else if (target.classList.contains("no-check-btn")) {
    handleNoCheckClick(target);
  } else if (target.classList.contains("check-btn")) {
    handleCheckClick(target);
  }
};
// Fonction pour basculer en mode plein écran pour une carte donnée
// l'élément passé en paramètre est le bouton qui a été cliqué pour activer le plein écran
function toggleFullScreen(element) {
  if (element === null) return;
  let scrollY = 0;
  const state = element.classList.contains("fullscreenbtn")
    ? "full"
    : "notfull";
  element.classList.toggle("fullscreenbtn");
  element.classList.toggle("fullscreenexitbtn");
  // on cherche le bouton sur la face de derrière de la carte
  if (state === "notfull") {
    const otherBtn =
      element.parentNode.parentNode.querySelector(".fullscreenexitbtn");
    if (otherBtn) {
      otherBtn.classList.remove("fullscreenexitbtn");
      otherBtn.classList.add("fullscreenbtn");
    }
  } else {
    const otherBtn =
      element.parentNode.parentNode.querySelector(".fullscreenbtn");
    if (otherBtn) {
      otherBtn.classList.remove("fullscreenbtn");
      otherBtn.classList.add("fullscreenexitbtn");
    }
  }
  const card = element.closest(".tuile");
  if (state === "full") {
    content.classList.add("fullscreen");
    unsetAllCardHeight();
    const initWidth = card.getBoundingClientRect().width;
    const initHeight = card.getBoundingClientRect().height;
    scrollY = window.scrollY;
    window.scrollTo(0, 0);
    card.classList.add("fullscreen");
    const endWidth = card.getBoundingClientRect().width;
    const endHeight = card.getBoundingClientRect().height;
    const ratio = Math.min(
      3,
      Math.max(endWidth / initWidth, endHeight / initHeight),
    );
    card.style["font-size"] = ratio * 100 + "%";
  } else {
    card.classList.remove("fullscreen");
    content.classList.remove("fullscreen");
    card.style["font-size"] = "";
    window.scrollTo(0, scrollY);
    setAllCardSameHeight();
  }
}
function reviewCards() {
  // on vide les cartes originales
  const wallSection = document.querySelector(".wall-section");
  document.querySelector(".review-section")?.remove(); // Remove existing review section if it exists
  // Display cards to review after the last card
  if (cardIdsToReview.length > 0) {
    const reviewSection = utils.create("section", {
      className: "review-section",
    });
    toggleFullScreen(
      document.querySelector(".tuile.fullscreen .fullscreenexitbtn"),
    );
    // message pour indiquer qu'on donne la possibilité de revoir les cartes
    const reviewMessage = utils.create("article", {
      className: "tuile",
    });
    const divCardInner = utils.create("div", {
      className: "flip-card-inner",
    });
    reviewMessage.appendChild(divCardInner);
    const divQ = utils.create("div", {
      innerHTML:
        "Vous avez " +
        cardIdsToReview.length +
        " cartes à réviser. Voulez-vous les revoir maintenant ?",
      className: "question flip-card-front",
    });
    divCardInner.appendChild(divQ);
    reviewSection.appendChild(reviewMessage);
    const continueBtn = utils.create("button", {
      innerHTML: "Oui",
      className: "review-btn",
    });
    continueBtn.onclick = () => {
      // Scroll to the review section
      toggleFullScreen(reviewMessage.querySelector(".fullscreenexitbtn"));
      toggleFullScreen(
        reviewMessage.nextElementSibling.querySelector(".fullscreenbtn"),
      );
    };
    divQ.appendChild(continueBtn);
    const fullScreenBtn = utils.create("div", {
      className: "fullscreenbtn",
    });
    divQ.appendChild(fullScreenBtn);
    content.appendChild(reviewSection);
    toggleFullScreen(fullScreenBtn);
    let count = 0;
    cardIdsToReview.forEach((cardId) => {
      count++;
      const cardToReview = document.querySelector(`[data-card-id="${cardId}"]`);
      if (cardToReview) {
        const cardClone = cardToReview.cloneNode(true);
        reviewSection.appendChild(cardClone);
        // remet la carte en verso si en recto
        cardClone.querySelector(".flip-card-inner").classList.remove("rotate");
        if (count === cardIdsToReview.length) {
          // Supprime le bouton next s'il existe.
          const nextBtn = cardClone.querySelector(".next");
          if (nextBtn) {
            nextBtn.parentNode.removeChild(nextBtn);
          }
        }
      }
    });
    wallSection.parentElement.removeChild(wallSection);
    // Clear the array to avoid duplicates
    cardIdsToReview = [];
  } else {
    const noCardsMessage = utils.create("article", {
      className: "tuile",
      innerHTML:
        "<div class='flip-card-inner'><div class='question flip-card-front bravo'>Tu sais déjà tout. Bien joué !<div class='fullscreenbtn'></div></div></div>",
    });
    common.launchConfetti();
    wallSection.appendChild(noCardsMessage);
    // Scroll to the review section
    toggleFullScreen(
      noCardsMessage.previousElementSibling.querySelector(".fullscreenexitbtn"),
    );
    toggleFullScreen(noCardsMessage.querySelector(".fullscreenbtn"));
  }
}

/* calcule le min'height pour front et back */
function setAllCardSameHeight() {
  const tuiles = document.querySelectorAll(".tuile");
  const fronts = document.querySelectorAll(".flip-card-front > div");
  const backs = document.querySelectorAll(".flip-card-back > div");
  //let minheight=0
  for (let i = 0; i < tuiles.length; i++) {
    const height = Math.max(
      fronts[i].getBoundingClientRect().height,
      backs[i].getBoundingClientRect().height,
    );
    const width = Math.max(
      fronts[i].getBoundingClientRect().width,
      backs[i].getBoundingClientRect().width,
    );
    tuiles[i].style["min-height"] = Math.max(height, 90) + "px";
    tuiles[i].style["min-width"] = width + "px";
  }
}
/**
 * Supprime la hauteur définie pour toutes les cartes.
 * Cette fonction parcourt toutes les cartes et réinitialise leur hauteur,
 * permettant ainsi à leur contenu de s'adapter dynamiquement.
 * Utile avant de recalculer les hauteurs ou avant d'appliquer des transformations.
 */
function unsetAllCardHeight() {
  const tuiles = document.querySelectorAll(".tuile");
  for (let i = 0; i < tuiles.length; i++) {
    tuiles[i].style.height = "";
  }
}

window.onresize = () => {
  // Réajuste la hauteur des cartes lorsque la fenêtre est redimensionnée
  unsetAllCardHeight();
  setAllCardSameHeight();
};
function checkURL(urlString) {
  const vars = utils.getUrlVars(urlString);
  if (vars.embed !== undefined) {
    // cas d'une activité embeded, on vérifie que l'url est conforme
    let expression =
      /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
    let regex = new RegExp(expression);
    if (vars.embed.match(regex)) MM.embededIn = vars.embed;
  }
  if (window.opener === null || vars.logo) {
    const $destination = document.getElementById("zoom");
    const buttonEdit = utils.create("button", {
      innerHTML:
        '<svg height="48" width="48" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="31.833" cy="32" fill="#76C2AF" r="32"/><path d="M28 23v-9H15a3 3 0 00-3 3v34a3 3 0 003 3h22a3 3 0 003-3V26h-9a3 3 0 01-3-3z" fill="#231F20" opacity=".2"/><path d="M37 12H15a3 3 0 00-3 3v34a3 3 0 003 3h22a3 3 0 003-3V15a3 3 0 00-3-3z" fill="#E0E0D1"/><path fill="#231F20" d="M16 19h10v2H16zM16 35h20v2H16zM16 30h20v2H16zM16 25h20v2H16zM16 40h20v2H16z" opacity=".2"/><g opacity=".2"><path fill="#231F20" d="M16 45h20v2H16z"/></g><g opacity=".2"><path d="M55.121 21.864l-7.071-7.071a3 3 0 00-4.243 0l-3.536 3.536-.707.707-16.262 16.263-1.886 9.428-.943 4.714 4.714-.943 9.428-1.886 16.263-16.263.707-.707 3.536-3.536a2.998 2.998 0 000-4.242z" fill="#231F20"/></g><g><path d="M50.879 28.435a3 3 0 01-4.243 0l-7.071-7.071a3 3 0 010-4.243l4.243-4.243a3 3 0 014.243 0l7.071 7.071a3 3 0 010 4.243l-4.243 4.243z" fill="#C75C5C"/></g><g><path fill="#E0995E" d="M23.301 33.385l16.97-16.97 2.83 2.828-16.971 16.97z"/></g><g><path fill="#F5CF87" d="M24.715 37.627L43.1 19.242l5.657 5.657-18.385 18.385z"/></g><g><path fill="#E0995E" d="M31.786 41.87l16.97-16.97 2.829 2.828-16.97 16.97z"/></g><g><path fill="#4F5D73" d="M20.473 47.527l4.714-.943-3.771-3.771z"/><path fill="#FFF" d="M23.302 33.385l-1.886 9.428 3.771 3.771 9.428-1.886-1.414-1.414v-2.828h-5.657v-5.657h-2.828z"/></g></svg>',
      className: "edit-btn",
      title: "Éditer les activités du panneau",
    });
    buttonEdit.onclick = () => {
      let url =
        window.location.href.replace("wall.html", "index.html") +
        "&edit&type=wall";
      // add alea key
      url = url.replace(/,a=[\d\w]*,/, ",a=" + parameters.alea + ",");
      window.location.href = url;
    };
    $destination.appendChild(buttonEdit);
  }
  if (vars.c !== undefined) {
    if (vars.a) {
      parameters.alea = vars.a;
    } else {
      parameters.alea = common.setSeed();
    }
    // paramètres des activités des paniers
    let json = vars.c;
    //document.getElementById("nbDominos").value = parameters.nb
    parameters.fontType = vars.fs ?? "serif";
    parameters.titreFiche = decodeURI(vars.t);
    if (vars.t !== false)
      document.getElementById("creator-title").innerHTML =
        parameters.titreFiche;
    if (vars.logo) {
      let locate = "";
      if (
        location.hostname === "localhost" ||
        location.hostname === "127.0.0.1"
      ) {
        locate = "/public/";
      }
      document.getElementById("creator-title").prepend(
        utils.create("img", {
          src: locate + "img/partners/logo_m_h32.png",
          className: "logo",
        }),
      );
      document.getElementById("creator-title").appendChild(
        utils.create("img", {
          src: locate + "img/partners/Logo_B_h32.png",
          className: "logo",
        }),
      );
    }
    // allcarts contient des promises qu'il faut charger
    parameters.carts = [];
    let allcarts = [];
    for (const i in json) {
      parameters.carts[i] = new cart(i);
      allcarts.push(parameters.carts[i].import(json[i], false, MM.version));
    }
    // on attend le résultat de toutes les promesses pour mettre à jour les affichages.
    Promise.all(allcarts)
      .then((data) => {
        refresh();
      })
      .catch((err) => {
        // erreur à l'importation :(
        // fichier et line de l'erreur
        let stack = err.stack.split("\n");
        stack.splice(0, 2);
        let alert = utils.create("div", {
          id: "messageerreur",
          className: "message",
          innerHTML:
            "Impossible de charger le panier :(<br>" + err + "<br>" + stack,
        });
        console.log(err.stack);
        document.getElementById("creator-content").appendChild(alert);
      });
  }
}
checkURL();
