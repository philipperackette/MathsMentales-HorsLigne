"use strict";
import protos from "./mods/protos.js";
import { utils, _ } from "./mods/utils.js";
// MathsMentales core
import cart from "./mods/cart.js";
// import library from './mods/library.js';
import sound from "./mods/sound.js";
import Zoom from "./mods/zoom.js";
import speech from "./mods/speech.js";
import steps from "./mods/steps.js";
import timer from "./mods/timer.js";
import { MathfieldElement } from "./libs/mathlive/mathlive.mjs.js";
import keyBoard from "./mods/keyboard.js";
import MMmath from "./mods/math.js";
import draw from "./mods/draw.js";
import Figure from "./mods/figure.js";
import analyseReponse from "./mods/analysereponse.js";

MathfieldElement.fontsDirectory = "../css/katex/fonts";
MathfieldElement.soundsDirectory = null;
/* sauvegarde des résultats pour éviter la triche */
let contentResultats = "";
let startOnlineTime = 0;

const diaporama = {
  version: 7, // à mettre à jour à chaque upload pour régler les pb de cache
  introType: "321", // type of the slide's intro values : "example" "321" "nothing"
  endType: "nothing", // type of end slide's values : "correction", "nothing", "list"
  touched: false, // marker to know if the screen has been touched => online answers with virtual keyboard
  seed: "", // String to initialize the randomization
  slidersOrientation: "", // if vertical => vertical presentation for 2 sliders
  onlineState: "no", // true if user answers on computer (Cf start and online functions)
  forcedOnline: false,
  carts: [], // max 4 carts
  steps: [],
  timers: [],
  figs: {}, //
  userAnswers: [],
  slidersNumber: 1,
  faceToFace: "n",
  colors: [], // couleurs de fond des diaporamas
  memory: {}, // memoire des figures
  goodAnswers: [], // stockage des réponses attendues dans le online,
  zooms: {}, // zooms créés pour chaque élément d'affichage,
  mf: {}, // MathFields pour réponses en ligne
  text2speach: [],
  keyboards: {}, // claviers virtuels pour réponses en ligne
  ended: true,
  embededIn: false, // variable qui contient l'url du site dans lequel MM est affiché (vérifier url)
  correction: utils.create("div"), // on garde le contenu de la correction en mémoire pour choisir de l'intégrer au DOM ou pas
  enonces: utils.create("div"), // idem au dessus
  times: [0], // temps mis pour faire l'activité en mode interactif
  totaltimes: [0], // temps prévu pour le diaporama en mode interactif
  // functions
  closeMessage(id) {
    let div = document.getElementById(id);
    if (div !== null) div.parentNode.removeChild(div);
    document.body.removeEventListener("click", (evt) => {
      if (evt.target.id === "btn-messagefin-close") {
        diaporama.closeMessage("messagefin");
        diaporama.showTab("corrige");
      }
    });
  },
  checkURL: function (urlString = false, start = true) {
    const vars = utils.getUrlVars(urlString);
    if (vars.embed !== undefined) {
      // cas d'une activité embeded, on vérifie que l'url est conforme
      let expression =
        /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
      let regex = new RegExp(expression);
      if (vars.embed.match(regex)) diaporama.embededIn = vars.embed;
    }
    if (vars.c !== undefined) {
      // présence de carts MM v2 à lancer ou éditer
      let alert = utils.create("div", {
        id: "messageinfo",
        className: "message",
        innerHTML:
          "Chargement de l'activité MathsMentales.<br>Merci pour la visite.",
      });
      document.getElementById("tab-accueil").appendChild(alert);
      // le seed d'aléatorisation est fourni et on n'est pas en mode online
      let sameData = false;
      if (vars.a && diaporama.onlineState === "no") {
        diaporama.seed = utils.setSeed(vars.a);
        // on check la clé de donnée incluse
        sameData = true;
      }
      if (vars.o === "yes") {
        // cas d'un truc online : message à valider !
        start = false;
        alert.innerHTML += "<br><br>";
        let button = utils.create("button", { innerHTML: "Commencer !" });
        button.onclick = () => {
          diaporama.closeMessage("messageinfo");
          diaporama.checkLoadedCarts(true, sameData);
        };
        alert.appendChild(button);
      } else {
        setTimeout(() => {
          diaporama.closeMessage("messageinfo");
        }, 3000);
      }
      // police des formules
      diaporama.fontType = vars.fs ?? "serif";
      // indique quoi faire avant le slide
      diaporama.introType = vars.i || "nothing";
      // indique quoi faire après le slide
      diaporama.endType = vars.e;
      // couleurs des diaporamas
      if (typeof vars.colors === "string") {
        let couleurs = vars.colors.split("~");
        for (let i = 0; i < couleurs.length; i++) {
          diaporama.colors[i] = couleurs[i].replace(/_/g, ",");
          // document.getElementById("sddiv"+(i+1)).style.background = diaporama.colors[i];
        }
      }
      // Mode online
      if (vars.o === "yes") {
        diaporama.onlineState = vars.o;
        diaporama.forcedOnline = true;
      }
      // Mode face to face
      if (vars.f) diaporama.faceToFace = vars.f;
      // nombre de diaporamas
      if (vars.s) {
        diaporama.slidersNumber = Number(vars.s);
      }
      // son
      if (vars.snd !== undefined) {
        if (vars.snd !== "null" && vars.snd !== "NaN") {
          sound.setSound(Number(vars.snd));
        }
      }
      // orientation dans le cas de 2 diapos
      if (vars.so) {
        diaporama.slidersOrientation = vars.so;
      }
      // paramètres des activités des paniers
      let json = vars.c;
      // version avant le 15/08/21
      if (typeof vars.c === "string")
        json = JSON.parse(decodeURIComponent(vars.c));
      // la version à partir du 15/08/21 fonctionne avec un objet vars.c déjà construit.
      // alcarts contient des promises qu'il faut charger
      let allcarts = [];
      // online non forcé, on va afficher un lien vers le paramétrage les énoncés et les corrigés.
      if (diaporama.onlineState !== "yes") {
        // check if window has been opened by another window
        if (window.opener === null) {
          const paramsContent = document.getElementById("param-content");
          paramsContent.innerHTML = "";
          const info = utils.create("div", {
            className: "info",
            innerHTML:
              "Le diaporama est à présent une entité indépendante de l’éditeur. Vous pouvez cependant y revenir en suivant le lien ci-dessous.",
          });
          paramsContent.appendChild(info);
          const list = utils.create("ul");
          // put a link to param-content html
          const link = utils.create("li", { className: "pointer underline" });
          link.innerText = "Éditer les paramètres de ce diaporama.";
          link.onclick = () => {
            let url =
              window.location.href.replace("diaporama.html", "index.html") +
              "&edit&type=diaporama";
            // add alea key
            url = url.replace(/,a=[\d\w]*,/, ",a=" + diaporama.seed + ",");
            window.location.href = url;
          };
          list.appendChild(link);
          paramsContent.appendChild(list);
        }
      }
      for (const i in json) {
        diaporama.carts[i] = new cart(i);
        allcarts.push(
          diaporama.carts[i].import(json[i], start, diaporama.version),
        );
      }
      // on attend le résultat de toutes les promesses pour mettre à jour les affichages.
      Promise.all(allcarts)
        .then((data) => {
          //console.log(diaporama.carts);
        })
        .then(() => {
          diaporama.checkLoadedCarts(false, sameData);
        })
        .catch((err) => {
          // erreur à l'importation :(
          let alert = utils.create("div", {
            id: "messageerreur",
            className: "message",
            innerHTML: "Impossible de charger les paniers :(<br>" + err,
          });
          document.getElementById("tab-accueil").appendChild(alert);
          // on fermet le message d'alerte après 3 secondes
          setTimeout(() => {
            let div = document.getElementById("messageerreur");
            div.parentNode.removeChild(div);
          }, 3000);
        });
    } else if (vars.cd !== undefined || vars.panier !== undefined) {
      // activité unique importée de MM v1
      // affichage d'un message de redirection
      let alert = utils.create("div", {
        className: "message",
        innerHTML:
          "Ceci est le nouveau MathsMentales, les anciennes adresses ne sont malheureusement plus compatibles.<hr class='center w50'>Vous allez être redirigé vers l'ancienne version de MathsMentales dans 6 s. <a href='javascript:utils.goToOldVersion();'>Go !</a>",
      });
      document.getElementById("tab-accueil").appendChild(alert);
      setTimeout(utils.goToOldVersion, 6000);
    }
  },
  /**
   * regarde si tous les paniers sont chargés
   * si oui, on lance le diaporama.
   */
  checkLoadedCarts(start = false, sameData = false) {
    let loaded = true;
    for (const panier of this.carts) {
      if (!panier.loaded) loaded = false;
    }
    if (loaded) {
      // ! on fait attention à ce que les targets ne se chevauchent pas
      const targets = [];
      diaporama.carts.forEach((panier) => {
        if (typeof panier.target === "string")
          // normalement, c'est un tableau
          panier.target = panier.target.split(",").map(Number);
        for (let i = 0; i < panier.target.length; i++) {
          if (targets.includes(panier.target[i])) {
            do {
              panier.target[i]++;
            } while (targets.includes(panier.target[i]));
          }
          targets.push(panier.target[i]);
        }
      });
      if (start || window.opener !== null) diaporama.start(sameData);
      else {
        const tabaccueil = document.getElementById("tab-accueil");
        let message = `Tu as suivi un lien d'activité préconfigurée MathsMentales.<br>Clique ci-dessous pour démarrer.<br><br><button class="button--primary" id="btn-message-start"> Démarrer le diaporama </button>`;
        if (diaporama.carts.length === 1 && sound.selected === null)
          message += `<br><br><button class="button--info" id="btn-message-sound">Avec du son (cliquer pour choisir)</button>`;
        if (diaporama.onlineState !== "yes")
          message += `<br><br> ou <button class="button--success" id="btn-message-interact"> Commencer (interactif)</button>`;
        let alert = utils.create("div", {
          id: "messageinfo",
          className: "message",
          innerHTML: message,
        });
        tabaccueil.appendChild(alert);
        tabaccueil.addEventListener("click", (evt) => {
          switch (evt.target.id) {
            case "btn-message-start":
              diaporama.closeMessage("messageinfo");
              diaporama.start(sameData);
              break;
            case "btn-message-sound":
              sound.next();
              break;
            case "btn-message-interact":
              diaporama.closeMessage("messageinfo");
              diaporama.onlineState = "yes";
              diaporama.start(sameData);
              break;
            default:
              break;
          }
        });
      }
    } else {
      let messageinfo = document.getElementById("messageinfo");
      if (messageinfo !== null) {
        messageinfo.innerHTML +=
          "<br><br>Le chargement n'est pas encore terminé. Patience...";
      }
    }
  },
  /**
   * création des affichages dans les diaporamas et les zones de rappel du site.
   * @param {boolean} withAnswer insère les réponses dans le diaporama si true
   */
  populateQuestionsAndAnswers(withAnswer) {
    if (withAnswer === undefined) withAnswer = true;
    diaporama.figs = {};
    diaporama.figsCorr = {};
    diaporama.steps = [];
    diaporama.timers = [];
    diaporama.memory = {};
    diaporama.goodAnswers = [];
    diaporama.text2speach = [];
    // length = nombre de paniers
    let length = diaporama.carts.length;
    let sliders = 0;
    for (let i = 0; i < length; i++) {
      sliders += diaporama.carts[i].target.length;
    }
    let enonces = diaporama.enonces;
    let corriges = diaporama.correction;
    document.getElementById("enonce-content").innerHTML = "";
    document.getElementById("corrige-content").innerHTML = "";
    if (sliders > 1) {
      enonces.className = "grid-" + sliders;
      corriges.className = "grid-" + sliders;
    }
    enonces.innerHTML = "";
    corriges.innerHTML = "";
    let zoomFactor = 2.4;
    if (length === 2) {
      zoomFactor = 1.6;
    } else if (length > 3) {
      zoomFactor = 1;
    }
    // parcours des paniers
    for (let i = 0; i < length; i++) {
      diaporama.carts[i].actsArrays = [];
      diaporama.goodAnswers[i] = [];
      // parcours des destinations du panier
      for (
        let kk = 0, clen = diaporama.carts[i].target.length;
        kk < clen;
        kk++
      ) {
        let indiceSlide = 0;
        let slideId = diaporama.carts[i].target[kk] - 1;
        diaporama.goodAnswers[i][kk] = [];
        let slider = document.getElementById("slider" + slideId);
        if (diaporama.colors[slideId] !== undefined) {
          slider.style["background"] = diaporama.colors[slideId];
        }
        let addTitle = "";
        if (clen > 1) addTitle = "-" + (kk + 1);
        let titleSlider = diaporama.carts[i].title + addTitle;
        document.querySelector(
          "#slider" + slideId + " .slider-title",
        ).innerHTML = titleSlider;
        let sliderSteps = document.querySelector(
          "#slider" + slideId + " .steps-container",
        );
        let dive = utils.create("div", { id: "de" + i + "-" + kk });
        let divc = utils.create("div", { id: "dc" + i + "-" + kk });
        diaporama.zooms["zc" + i + "-" + kk] = new Zoom(
          "zc" + i + "-" + kk,
          "#dc" + i + "-" + kk + " ol, #dc" + i + "-" + kk + " .score",
          true,
        );
        diaporama.zooms["ze" + i + "-" + kk] = new Zoom(
          "ze" + i + "-" + kk,
          "#de" + i + "-" + kk + " ol",
          true,
        );
        dive.appendChild(diaporama.zooms["ze" + i + "-" + kk].createCursor());
        divc.appendChild(diaporama.zooms["zc" + i + "-" + kk].createCursor());
        let h3e = utils.create("h3", { innerText: titleSlider }); // exercice's title
        let h3c = utils.create("h3", { innerText: titleSlider }); // correction's title
        dive.append(h3e);
        divc.append(h3c);
        let ole = utils.create("ol");
        let olc = utils.create("ol");
        // mise en couleur des listes énoncés et corrigés. (pour bilan ou impression)
        if (diaporama.colors[slideId] !== undefined) {
          ole.style["background"] = diaporama.colors[slideId];
          olc.style["background"] = diaporama.colors[slideId];
        }
        diaporama.steps[slideId] = new steps({
          size: 0,
          container: sliderSteps,
        });
        diaporama.timers[slideId] = new timer(slideId, i);
        let actsArray = [];
        // on fait la liste des références activités / questions pour pouvoir créer les affichages
        for (
          let z = 0, alen = diaporama.carts[i].activities.length;
          z < alen;
          z++
        ) {
          let activity = diaporama.carts[i].activities[z];
          activity.initialize();
          activity.generate();
          diaporama.goodAnswers[i][kk][z] = utils.clone(activity.values);
          for (let j = 0; j < activity.questions.length; j++) {
            actsArray.push([z, j]);
          }
        }
        // tirage aléatoire d'un sous-ensemble de questions parmi le panier
        if (diaporama.carts[i].randomDraw) {
          actsArray = utils.drawRandomSubset(
            actsArray,
            diaporama.carts[i].activities.length,
            diaporama.carts[i].randomCount,
          );
        }
        diaporama.steps[slideId].addSize(actsArray.length);
        // on mélange les références si on veut que tout soit mélangé.
        if (!diaporama.carts[i].ordered) {
          actsArray = utils.shuffle(actsArray);
        }
        // on stocke les associations pour pouvoir comparer quand on fera le online
        diaporama.carts[i].actsArrays[kk] = actsArray;
        diaporama.totaltimes = [0];
        // parcours des questions
        for (let ff = 0; ff < actsArray.length; ff++) {
          let activity = diaporama.carts[i].activities[actsArray[ff][0]];
          // pour ne pas tout réécrire :
          // j est le numéro de la question
          let j = actsArray[ff][1];
          let consigne = activity.consignes[j];
          let question = activity.questions[j];
          let answer = activity.answers[j];
          let fontSize = activity.textSize || false;
          // slides
          let color = ff % 2 ? " pair" : " impair";
          let div = utils.create("div", {
            className:
              "slide w3-animate-top" +
              (indiceSlide > 0 ? " hidden" : "") +
              color,
            id: "slide" + slideId + "-" + indiceSlide,
          });
          div.style["font-size"] = zoomFactor + "em";
          if (consigne !== undefined) {
            div.appendChild(
              utils.create("div", {
                className: "consigne",
                innerHTML: consigne,
              }),
            );
          }
          // timers
          diaporama.timers[slideId].addDuration(activity.tempo);
          if (diaporama.totaltimes[slideId] === undefined)
            diaporama.totaltimes[slideId] = 0;
          diaporama.totaltimes[slideId] += Number(activity.tempo);
          // display questions & answers
          let span = utils.create("span");
          if (fontSize) span.className = fontSize;
          let answerHiddenState = " hidden";
          if (diaporama.carts[i].progress === "withanswer") {
            answerHiddenState = "";
          }
          let spanAns = utils.create("span", {
            className: "answerInSlide" + answerHiddenState,
          });
          if (fontSize) spanAns.className += " " + fontSize;
          // enoncés et corrigés pour la fin du diaporama
          let lie = utils.create("li");
          let lic = document.createElement("li");
          let tex = false;
          let spane, spanc;
          if (
            activity.type === undefined ||
            activity.type === "" ||
            activity.type === "latex"
          ) {
            tex = true;
            span.innerHTML = "$$" + question + "$$";
            spane = utils.create("span", { innerHTML: "$$" + question + "$$" });
            lie.appendChild(spane);
            spanc = utils.create("span");
            lic.appendChild(spanc);
            if (Array.isArray(answer))
              spanAns.innerHTML = "$$" + answer[0] + "$$";
            else spanAns.innerHTML = "$$" + answer + "$$";
          } else {
            span.innerHTML = question;
            lie.innerHTML = question;
            if (Array.isArray(answer)) spanAns.innerHTML = answer[0];
            else spanAns.innerHTML = answer;
          }
          div.appendChild(span);
          if (
            diaporama.onlineState !== "yes" ||
            diaporama.carts[i].progress === "thenanswer"
          ) {
            // include answer if not online state
            div.appendChild(spanAns);
          }
          if (
            activity.audioRead &&
            activity.audios[j] !== undefined &&
            activity.audios[j] !== false
          ) {
            diaporama.text2speach[indiceSlide] = [
              activity.audios[j],
              activity.audioRepeat,
            ];
          }
          // insertion du div dans le slide
          slider.appendChild(div);

          if (Array.isArray(answer)) {
            if (!tex) lic.innerHTML += answer[0];
            else spanc.innerHTML += "$$" + answer[0] + "$$";
          } else {
            if (tex) spanc.innerHTML += "$$" + answer + "$$";
            else lic.innerHTML += answer;
          }
          if (activity.figures[j] !== undefined) {
            lic.innerHTML +=
              '&nbsp; <button data-id="c' +
              slideId +
              "-" +
              indiceSlide +
              '">Figure</button>';
            diaporama.figs[slideId + "-" + indiceSlide] = new Figure(
              utils.clone(activity.figures[j]),
              "c" + slideId + "-" + indiceSlide,
              div,
            );
            diaporama.memory["e" + slideId + "-" + indiceSlide] = new Figure(
              utils.clone(activity.figures[j]),
              "en" + slideId + "-" + indiceSlide,
              lie,
              [300, 150],
            );
            diaporama.memory["c" + slideId + "-" + indiceSlide] = new Figure(
              utils.clone(activity.figures[j]),
              "cor" + slideId + "-" + indiceSlide,
              lic,
              [450, 225],
            );
          }
          if (activity.figuresCorrection[j] !== undefined) {
            diaporama.figsCorr[slideId + "-" + indiceSlide] = new Figure(
              utils.clone(activity.figuresCorrection[j]),
              "fc" + slideId + "-" + indiceSlide,
              spanAns,
            );
            diaporama.memory["fc" + slideId + "-" + indiceSlide] = new Figure(
              utils.clone(activity.figuresCorrection[j]),
              "fcn" + slideId + "-" + indiceSlide,
              lic,
              [300, 150],
            );
          }
          ole.appendChild(lie);
          olc.appendChild(lic);
          indiceSlide++;
        }
        dive.append(ole);
        divc.append(olc);
        enonces.append(dive);
        corriges.append(divc);
        diaporama.steps[slideId].display();
      }
    }
    utils.mathRender(diaporama.fontType, false, true);
  },
  /**
   * Agrandit une fois la taille de la correction pour occuper l'espace disponible
   * à l'affichage. Doit être appelé une fois le conteneur #tab-corrige visible
   * (sinon offsetHeight reste à 0) ; ne se redéclenche pas au redimensionnement.
   */
  zoomCorrection() {
    const zoomKeys = Object.keys(diaporama.zooms).filter((k) =>
      k.startsWith("zc"),
    );
    if (zoomKeys.length === 0) return;
    requestAnimationFrame(() => {
      // marge pour les entêtes (titre, onglets, boutons de zoom)
      let maxH = window.innerHeight - 100;
      let bodyH = document.body.offsetHeight;
      let count = 0;
      while (bodyH < maxH && count < 5) {
        count++;
        zoomKeys.forEach((k) => diaporama.zooms[k].plus());
        bodyH = document.body.offsetHeight;
      }
      // le dernier pas peut faire dépasser la fenêtre réelle : on l'annule
      if (bodyH > window.innerHeight) {
        zoomKeys.forEach((k) => diaporama.zooms[k].minus());
      }
    });
  },
  /**
   * Create the user inputs to answer the questions
   * Ne fonctionnera qu'avec un panier unique
   *
   */
  createUserInputs: function () {
    diaporama.mf = {};
    diaporama.keyboards = {};
    //let slider=0,slide = 0;
    for (let cartId = 0, len = diaporama.carts.length; cartId < len; cartId++) {
      for (
        let slider = 0, len = diaporama.carts[cartId].target.length;
        slider < len;
        slider++
      ) {
        const sliderId = diaporama.carts[cartId].target[slider] - 1;
        const actArray = diaporama.carts[cartId].actsArrays[slider];
        for (let slide = 0, len2 = actArray.length; slide < len2; slide++) {
          const MFTARGET = document.getElementById("slider" + sliderId);
          const element = document.getElementById(
            "slide" + sliderId + "-" + slide,
          );
          const ID = "ansInput" + sliderId + "-" + slide;
          diaporama.mf[ID] = new MathfieldElement({
            //smartMode: true,
            mathVirtualKeyboardPolicy: "manual",
          });
          //if(diaporama.touched){
          let keys =
            diaporama.carts[cartId].activities[actArray[slide][0]].keyBoards[
              actArray[slide][1]
            ] || undefined;
          diaporama.keyboards[ID] = new keyBoard(
            diaporama.mf[ID],
            keys,
            element,
            sliderId,
            "kb" + sliderId + "-" + slide,
            this.slidersNumber,
          );
          // si on affiche une figure, on diminue la taille du champ de réponse.
          if (diaporama.figs[sliderId + "-" + slide] !== undefined) {
            diaporama.mf[ID].style.fontSize = "0.333em";
          }
          //}
          diaporama.mf[ID].id = ID;
          diaporama.mf[ID].target = element;
          diaporama.mf[ID].addEventListener("keyup", function (event) {
            if (event.key === "Enter" || event.code === "NumpadEnter") {
              diaporama.nextSlide(sliderId);
              event.preventDefault();
            }
          });
          element.appendChild(diaporama.mf[ID]);
          // la place du clavier est réservée par le padding-bottom de .slide,
          // calculé depuis --kb-h (voir keyboard.js) : plus de cale en dur ici.
        }
      }
    }
  },
  setFacetoFace(etat) {
    this.faceToFace = etat;
    if (etat === "y") {
      utils.addClass(document.getElementById("sddiv1"), "return");
      if (diaporama.slidersNumber > 2)
        utils.addClass(document.getElementById("sddiv2"), "return");
    } else {
      utils.removeClass(document.getElementById("sddiv1"), "return");
      utils.removeClass(document.getElementById("sddiv2"), "return");
    }
  },
  /**
   * Start the slideshow
   */
  start: function (sameData = false) {
    document.getElementById("tab-accueil").className = "hidden";
    document.getElementById("tab-content").className = "hidden";
    document.getElementById("tab-enonce").className = "hidden";
    document.getElementById("tab-corrige").className = "hidden";
    /* TODO : à supprimer après tests
    if (!diaporama.carts[0].activities.length) {
      diaporama.carts[0].addActivity(diaporama.editedActivity);
    }
    */
    if (diaporama.onlineState === "yes") {
      diaporama.userAnswers = [];
      for (let i = 0; i < diaporama.slidersNumber; i++) {
        diaporama.userAnswers[i] = [];
      }
      // cacher le menu de commandes général
      document.querySelector("#slideshow-container > header").className =
        "hidden";
    } else {
      // montrer le menu de commandes général
      document.querySelector("#slideshow-container > header").className = "";
    }
    document.getElementById("slideshow-container").className = "";
    // check if an option has been chosen
    diaporama.createSlideShows();
    // if restart true, we restart with same values
    if (!sameData) {
      diaporama.seed = utils.setSeed();
    } else {
      diaporama.seed = utils.setSeed(diaporama.seed);
    }
    diaporama.populateQuestionsAndAnswers();
    if (diaporama.introType === "321") {
      document.getElementById("countdown-container").className = "";
      if (sound.selected) {
        setTimeout(() => {
          sound.beeps();
        }, 800);
        setTimeout(() => {
          sound.setSound(sound.selected);
        }, 3500);
      }
      setTimeout(function () {
        document.getElementById("countdown-container").className = "hidden";
        if (diaporama.onlineState === "yes") {
          // create inputs for user
          diaporama.createUserInputs();
          startOnlineTime = Number(Date.now());
        }
        diaporama.showSlideShows();
        diaporama.startTimers();
      }, 3600);
    } else if (diaporama.introType.indexOf("example") > -1) {
      // on affiche un exemple
      diaporama.showSampleQuestion();
      diaporama.showSlideShows();
    } else {
      // on démarre directement
      if (diaporama.onlineState === "yes") {
        // create inputs for user
        diaporama.createUserInputs();
        startOnlineTime = Number(Date.now());
      }
      diaporama.showSlideShows();
      diaporama.startTimers();
    }
    this.ended = false; // utilisé à la fin du diapo
  },
  startTimers: function () {
    if (diaporama.text2speach[0] !== undefined) {
      diaporama.speech.speak(diaporama.text2speach[0]);
    }
    if (diaporama.onlineState === "yes" && !diaporama.touched) {
      document.getElementById("ansInput0-0").focus();
    }
    for (let i = 0, k = diaporama.timers.length; i < k; i++) {
      diaporama.timers[i].start(0, this);
    }
  },
  showSampleQuestion: function () {
    let nb = diaporama.slidersNumber;
    diaporama.seed = utils.setSeed("sample");
    let container = document.getElementById("slideshow");
    let assocSliderActivity = [];
    // génération des données aléatoires pour les exemples
    for (let i = 0, len = diaporama.carts.length; i < len; i++) {
      diaporama.carts[i].activities[0].generateSample();
      for (let j = 0; j < diaporama.carts[i].target.length; j++) {
        assocSliderActivity[diaporama.carts[i].target[j] - 1] = i;
      }
    }
    let divSample = utils.create("div", {
      id: "sampleLayer",
      className: "sample",
    });
    // creation des emplacements d'affichage
    let facteurZoom = 1;
    for (let i = 0; i < nb; i++) {
      let div = utils.create("div", { id: "sample" + i });
      if (nb === 1) {
        div.className = "slider-1";
        facteurZoom = 2.4;
      } else if (nb === 2) {
        div.className = "slider-2";
        facteurZoom = 1.6;
      } else div.className = "slider-34";
      let nextActivity = "";
      if (diaporama.carts[assocSliderActivity[i]].activities.length > 1) {
        nextActivity = `<button title="Activité suivante du panier" data-actid="0" id="ButtonNextAct${i}"><i  class="sprite sprite-slider-next"></i></button>`;
      }
      div.innerHTML = `Exemple `;
      diaporama.zooms["zsample" + i] = new Zoom(
        "zsample" + i,
        "#sampleSlide" + i,
        true,
        "em",
        facteurZoom,
        "zs" + i,
      );
      div.appendChild(diaporama.zooms["zsample" + i].createCursor());
      div.innerHTML += `<div class="slider-nav">
            <button title="Annoter l'exemple" id="btn-sample-annotate${i}"><i class="sprite sprite-iconfinder_pencil_1055013"></i></button>
            <button title="Montrer la réponse" id="btn-sample-showanswer${i}"><i class="sprite sprite-slider-solution"></i></button>
            <button title="Autre exemple" id="btn-newsample${i}"><i class="sprite sprite-newsample"></i></button>
            ${nextActivity}
            <button title="Démarrer le diaporama" id="btn-sample-start${i}"><i class="sprite sprite-fusee"></i></button>
            </div>`;
      let divContent = utils.create("div", {
        className: "slide",
        id: "sampleSlide" + i,
      });
      let span = utils.create("span", { id: "sample" + i + "-enonce" });
      let spanAnswer = utils.create("span", {
        id: "sample" + i + "-corr",
        className: "hidden",
      });
      divContent.appendChild(span);
      divContent.appendChild(spanAnswer);
      div.appendChild(divContent);
      // math or not ?
      // insert content
      divSample.appendChild(div);
    }
    container.appendChild(divSample);
    // ajout des données dans les emplacements
    for (let i = 0; i < diaporama.carts.length; i++) {
      for (let y = 0; y < diaporama.carts[i].target.length; y++) {
        let sN = diaporama.carts[i].target[y] - 1;
        let act = diaporama.carts[i].activities[0];
        if (act.type === undefined || act.type === "" || act.type === "latex") {
          document.getElementById("sample" + sN + "-enonce").innerHTML =
            "$$" + act.sample.question + "$$";
          document.getElementById("sample" + sN + "-corr").innerHTML =
            "$$" + act.sample.answer + "$$";
        } else {
          document.getElementById("sample" + sN + "-enonce").innerHTML =
            act.sample.question;
          document.getElementById("sample" + sN + "-corr").innerHTML =
            act.sample.answer;
        }
        document
          .getElementById("sample" + sN + "-corr")
          .classList.add("hidden");
        if (act.textSize !== undefined) {
          document
            .getElementById("sample" + sN + "-enonce")
            .classList.add(act.textSize);
          document
            .getElementById("sample" + sN + "-corr")
            .classList.add(act.textSize);
        }
        if (act.sample.figure !== undefined) {
          let fig = new Figure(
            utils.clone(act.sample.figure),
            "sample-c" + sN,
            document.getElementById("sampleSlide" + sN),
          );
          setTimeout(function () {
            fig.display();
          }, 100);
        }
        if (act.sample.figureCorrection !== undefined) {
          let figCor = new Figure(
            utils.clone(act.sample.figureCorrection),
            "sample-fc" + sN,
            document.getElementById("sample" + sN + "-corr"),
          );
          setTimeout(function () {
            figCor.display();
          }, 100);
        }
      }
    }
    utils.mathRender(diaporama.fontType, false, true);
  },
  createSlideShows: function () {
    diaporama.zooms = {};
    diaporama.zooms["thezoom"] = new Zoom("thezoom", "#slideshow .slide", true);
    let insertTo = document.querySelector("#slideshow-container header");
    let ispresent = insertTo.querySelector("#thezoom");
    if (ispresent) {
      insertTo.removeChild(ispresent);
    }
    insertTo.appendChild(diaporama.zooms["thezoom"].createCursor());
    // pour compenser une erreur abominable créée lors de la création des urls.
    if (isNaN(diaporama.slidersNumber)) {
      // on va checker le slidersNumber d'après les paniers
      let nb = 0;
      for (let i = 0; i < diaporama.carts.length; i++) {
        nb += diaporama.carts[i].target.length;
      }
      if (nb < 5) diaporama.slidersNumber = nb;
    }
    let nb = diaporama.slidersNumber;
    let container = document.getElementById("slideshow");
    container.innerHTML = "";
    if (diaporama.slidersOrientation === "v")
      utils.addClass(container, "vertical");
    else utils.removeClass(container, "vertical");
    if (diaporama.faceToFace === "y") utils.addClass(container, "return");
    else utils.removeClass(container, "return");
    let facteurZoom = 1;
    for (let i = 0; i < nb; i++) {
      let div = document.createElement("div");
      div.id = "slider" + i;
      if (nb === 1) {
        div.className = "slider-1";
        facteurZoom = 2.4;
      } else if (nb === 2) {
        div.className = "slider-2";
        facteurZoom = 1.6;
      } else {
        div.className = "slider-34";
      }
      // facetoface option
      /*if(nb>1 && diaporama.faceToFace==="y" && i===0)div.className += " return";
      else if(nb>2 && diaporama.faceToFace==="y" && i===1)div.className +=" return";*/
      let innerH = `<div class="slider-head"><div class="slider-nav">
            <button title="Arrêter le diaporama" id="btn-timer-end${i}"><i class="sprite sprite-slider-stop"></i></button>`;
      if (diaporama.onlineState === "no") {
        // créer les boutons de pause et montrer réponse si on n'est pas en mode online
        innerH += `<button title="Mettre le diapo en pause", id="btn-timer-pause${i}"><i class="sprite sprite-slider-pause"></i></button>
                <button title="Montrer la réponse" id="btn-show-answer${i}"><i class="sprite sprite-slider-solution"></i></button>`;
      }
      diaporama.zooms["zs" + i] = new Zoom(
        "zs" + i,
        "#slider" + i + " .slide",
        false,
        "em",
        facteurZoom,
      );
      let zoom = diaporama.zooms["zs" + i].createCursor();
      innerH += `<button title="Passer la diapo" id="btn-next-slide${i}"><i class="sprite sprite-slider-next"></i></button>
            </div>
            <div class="slider-title"></div>
            <div class="slider-chrono"><progress class="progress is-link is-large" value="0" max="100"></progress></div></div>
            <div class="steps-container"></div>`;
      div.innerHTML = innerH;
      div.querySelector(".slider-head").appendChild(zoom);
      container.appendChild(div);
    }
  },
  showSlideShows: function () {
    utils.removeClass(document.getElementById("slideshow-container"), "hidden");
    // utils.addClass(document.getElementById("app-container"), "hidden");
    if (sound.selected) {
      sound.play();
    }
    if (!utils.isEmpty(diaporama.figs)) {
      diaporama.displayFirstFigs();
    }
  },
  displayFirstFigs: function () {
    for (let i = 0; i < 4; i++) {
      if (typeof diaporama.figs[i + "-0"] === "object") {
        diaporama.figs[i + "-0"].display();
      }
      if (typeof diaporama.figsCorr[i + "-0"] === "object") {
        diaporama.figsCorr[i + "-0"].display();
      }
    }
  },
  hideSlideshows: function () {
    utils.addClass(document.getElementById("slideshow-container"), "hidden");
    const whatToDo = diaporama.endType;
    const $containerEnonce = document.getElementById("enonce-content");
    $containerEnonce.innerHTML = "";
    $containerEnonce.appendChild(diaporama.enonces);
    setTimeout(() => {
      for (const figureId in diaporama.memory) {
        if (figureId.indexOf("e") === 0) {
          diaporama.memory[figureId].display();
        }
      }
    }, 1000);
    if (diaporama.forcedOnline) {
      // on affiche un message de fin qui attend une validation
      let message = "";
      if (whatToDo === "correction") {
        message = `L'activité MathsMentales est terminée.<br>Pour consulter les résultats, cliquer sur le bouton ci-dessous.<br><br>
            <button id="btn-messagefin-close"> Voir le corrigé </button>`;
      } else {
        message = `L'activité MathsMentales est terminée.<br>La correction n'est pas disponible, mais vous pouvez consulter les énoncés.<br><br>
        <button id="btn-messagefin-close"> Fermer ce message </button>`;
      }
      let alert = utils.create("div", {
        id: "messagefin",
        className: "message",
        innerHTML: message,
      });
      document.body.appendChild(alert);
      alert.addEventListener("click", (evt) => {
        if (evt.target.id === "btn-messagefin-close") {
          diaporama.closeMessage("messagefin");
        }
        utils.mathRender(diaporama.fontType, false, true);
        if (whatToDo === "correction") {
          const $containerCorrige = document.getElementById("corrige-content");
          $containerCorrige.innerHTML = "";
          $containerCorrige.appendChild(diaporama.correction);
          for (const figureId in diaporama.memory) {
            /*if (figureId.indexOf("c") === 0) {
              diaporama.memory[figureId].display();
            }*/
            if (figureId.indexOf("fc") === 0) {
              diaporama.memory[figureId].display();
            }
          }
          utils.mathRender(diaporama.fontType, false, true);
          if (diaporama.onlineState === "yes") setTimeout(saveContent, 3000);
          diaporama.showTab("corrige");
          diaporama.zoomCorrection();
        } else {
          diaporama.showTab("enonce");
        }
      });
    } else {
      const $containerCorrige = document.getElementById("corrige-content");
      $containerCorrige.innerHTML = "";
      $containerCorrige.appendChild(diaporama.correction);
      for (const figureId in diaporama.memory) {
        /*if (figureId.indexOf("c") === 0) {
        inutile car s'affiche au toggle
          //diaporama.memory[figureId].display();
        }*/
        if (figureId.indexOf("fc") === 0) {
          //diaporama.memory[figureId].display();
          diaporama.memory[figureId].toggle();
        }
      }
      utils.mathRender(diaporama.fontType, false, true);
      if (diaporama.onlineState === "yes") setTimeout(saveContent, 3000);
      if (whatToDo === "correction") {
        diaporama.showTab("corrige");
        diaporama.zoomCorrection();
      } else if (whatToDo === "list") {
        diaporama.showTab("enonce");
      } else {
        diaporama.showTab("param");
      }
    }
    this.ended = true;
  },
  showTab(tab) {
    // on cache tout
    const tabs = ["enonce", "corrige", "param"];
    tabs.forEach((tab) => {
      document.getElementById("tab-" + tab).className = "hidden";
    });
    tabs.forEach((tab) => {
      document.getElementById("btn-" + tab).classList.remove("active");
    });
    document.getElementById("slideshow-container").className = "hidden";
    document.getElementById("tab-content").className = "";
    document.getElementById("tab-" + tab).className = "is-active";
    document.getElementById("btn-" + tab).classList.add("active");
  },
  /**
   * Montre la réponse si l'une est indiquée (ne l'est pas pour un élève)
   * @param {Integer} id id du slide où afficher la réponse
   * @returns nothing
   */
  showTheAnswer(id, pause = true) {
    let answerToShow = document.querySelector(
      "#slide" + id + "-" + diaporama.steps[id].step + " .answerInSlide",
    );
    if (!answerToShow) return;

    if (answerToShow.className.indexOf("hidden") > -1) {
      if (!diaporama.timers[id].break && pause) diaporama.timers[id].pause();
      else if (pause) diaporama.timers[id].stop();
      utils.removeClass(answerToShow, "hidden");
    } else {
      utils.addClass(answerToShow, "hidden");
      if (pause) diaporama.timers[id].start(-1, this);
    }
  },
  showSampleAnswer(id) {
    let answerToShow = document.getElementById("sample" + id + "-corr");
    if (answerToShow.className.indexOf("hidden") > -1) {
      utils.removeClass(answerToShow, "hidden");
    } else {
      utils.addClass(answerToShow, "hidden");
    }
  },
  annotateThisThing: function (target, btnId) {
    if (target === false && diaporama.annotate !== undefined) {
      diaporama.annotate.destroy();
      diaporama.annotate = undefined;
    } else if (diaporama.annotate === undefined && _.isString(target)) {
      diaporama.annotate = new draw(target, btnId, this.touched);
    } else if (diaporama.annotate !== undefined) {
      diaporama.annotate.destroy();
      diaporama.annotate = undefined;
    }
  },
  /**
   *
   * @param {id} id id de l'emplacement de l'exemple
   * @param {boolean} next passe à l'activité suivante du panier.
   */
  newSample(id, next = false) {
    // suppression de l'annotation si en cours.
    this.annotateThisThing(false);
    for (let i = 0, len = diaporama.carts.length; i < len; i++) {
      if (
        diaporama.carts[i].target.includes(String(id + 1)) ||
        diaporama.carts[i].target.includes(id + 1)
      ) {
        let nbActivities = diaporama.carts[i].activities.length;
        let actId = 0;
        // si le panier contient plusieurs activités,
        // on regarde l'id de l'activité à afficher.
        if (diaporama.carts[i].activities.length > 1) {
          actId = document.getElementById("ButtonNextAct" + id).dataset.actid;
          if (next) {
            actId++;
            if (actId >= nbActivities) actId = 0;
            document.getElementById("ButtonNextAct" + id).dataset.actid = actId;
          }
        }
        let act = diaporama.carts[i].activities[actId];
        act.generateSample();
        if (act.type === undefined || act.type === "" || act.type === "latex") {
          document.getElementById("sample" + id + "-enonce").innerHTML =
            "$$" + act.sample.question + "$$";
          document.getElementById("sample" + id + "-corr").innerHTML =
            "$$" + act.sample.answer + "$$";
        } else {
          document.getElementById("sample" + id + "-enonce").innerHTML =
            act.sample.question;
          document.getElementById("sample" + id + "-corr").innerHTML =
            act.sample.answer;
        }
        if (act.textSize !== undefined) {
          document
            .getElementById("sample" + id + "-enonce")
            .classList.add(act.textSize);
          document
            .getElementById("sample" + id + "-corr")
            .classList.add(act.textSize);
        }
        // suppression de la figure existante
        let item = document.getElementById("div-dest-canvas-sample-c" + id);
        if (item !== null) item.parentNode.removeChild(item);
        else {
          item = document.getElementById("sample-c" + id);
          if (item !== null) item.parentNode.removeChild(item);
        }
        if (act.sample.figure !== undefined) {
          const fig = new Figure(
            utils.clone(act.sample.figure),
            "sample-c" + id,
            document.getElementById("sampleSlide" + id),
          );
          setTimeout(function () {
            fig.display();
          }, 100);
        }
        if (act.sample.figureCorrection !== undefined) {
          const figCorrection = new Figure(
            utils.clone(act.sample.figureCorrection),
            "sample-fc" + id,
            document.getElementById("sample" + id + "-corr"),
          );
          setTimeout(function () {
            figCorrection.display();
          }, 100);
        }
        utils.mathRender(diaporama.fontType);
      }
    }
  },
  removeSample() {
    let item = document.getElementById("sampleLayer");
    item.parentNode.removeChild(item);
  },
  startSlideShow() {
    diaporama.removeSample();
    if (diaporama.onlineState === "yes") {
      // create inputs for user
      diaporama.createUserInputs();
      startOnlineTime = Number(Date.now());
    }
    if (diaporama.onlineState === "yes" && !diaporama.touched) {
      document.getElementById("ansInput0-0").focus();
    }
    if (diaporama.introType === "example-321") {
      // case with
      document.getElementById("countdown-container").className = "";
      if (sound.selected) {
        setTimeout(() => {
          sound.beeps();
        }, 800);
        setTimeout(() => {
          sound.setSound(sound.selected);
        }, 3500);
      }
      setTimeout(function () {
        document.getElementById("countdown-container").className = "hidden";
        /*if (diaporama.onlineState === "yes") { // create inputs for user
            diaporama.createUserInputs();
        }*/
        diaporama.showSlideShows();
        diaporama.startTimers();
      }, 3600);
    } else {
      diaporama.startTimers();
    }
  },
  /**
   *
   * @param {integer} id du slider (start to 0)
   */
  nextSlide: function (id) {
    if (diaporama.onlineState === "yes") {
      // save answer
      diaporama.userAnswers[id][diaporama.steps[id].step] =
        diaporama.mf["ansInput" + id + "-" + diaporama.steps[id].step].value;
      diaporama.times[id] = Number(Date.now()) - startOnlineTime;
    }
    if (
      diaporama.carts[diaporama.timers[id].cartId].progress === "thenanswer"
    ) {
      if (!diaporama.timers[id].answerShown) {
        // arrêter le timer de la question puis afficher la réponse
        diaporama.timers[id].pause(this);
        // on empêche toute nouvelle validation en désactivant le champ de saisie
        if (
          diaporama.mf["ansInput" + id + "-" + diaporama.steps[id].step] !==
          undefined
        )
          diaporama.mf[
            "ansInput" + id + "-" + diaporama.steps[id].step
          ].disabled = true;
        diaporama.showTheAnswer(id, false);
        diaporama.timers[id].answerShown = true;
        diaporama.timers[id].timeLeft = -0.01;
        diaporama.timers[id].pause(this);
        return;
      }
    }
    let step = diaporama.steps[id].nextStep();
    if (step === false) {
      diaporama.timers[id].end(this);
      return false;
    }
    // joue le son si un seul panier
    if (diaporama.carts.length === 1) {
      sound.play();
    }
    diaporama.timers[id].start(step, this);
    let slidetoHide = document.querySelector("#slide" + id + "-" + (step - 1));
    let slide = document.querySelector("#slide" + id + "-" + step);
    utils.addClass(slidetoHide, "hidden");
    if (slide) {
      utils.removeClass(slide, "hidden");
      if (diaporama.figs[id + "-" + step] !== undefined) {
        diaporama.figs[id + "-" + step].display();
      }
      if (diaporama.figsCorr[id + "-" + step] !== undefined) {
        diaporama.figsCorr[id + "-" + step].display();
      }
      if (diaporama.onlineState === "yes" && diaporama.slidersNumber < 2) {
        // on met le curseur dans le champ de réponse. Avec plusieurs sliders,
        // focaliser volerait la saisie clavier aux autres sliders.
        diaporama.mf["ansInput" + id + "-" + step]?.focus();
      }
      if (diaporama.text2speach[step] !== undefined) {
        diaporama.speech.speak(diaporama.text2speach[step]);
      }
    } else {
      // fin du slide mais n'arrive jamais normalement
    }
  },
  messageEndSlide: function (id, nth) {
    // TODO : revoir le truc pour ne pas empiéter sur le dernière slide (ou pas)
    let sliderMessage = document.querySelectorAll("#slider" + id + " .slide")[
      nth
    ];
    sliderMessage.innerHTML = "<span>Fin du diaporama</span>";
    //utils.removeClass(sliderMessage,"hidden");
  },
  endSliders: function () {
    if (diaporama.text2speach.length) diaporama.speech.stop();
    let ended = true;
    // check if all timers have ended
    for (let i = 0, l = diaporama.timers.length; i < l; i++) {
      if (diaporama.timers[i].ended === false) ended = false;
    }
    if (ended) {
      // correction si online
      if (diaporama.onlineState === "yes") {
        // correction
        // attention, les questions ont pu être mélangées, on va donc devoir associer correctement les réponses/questions
        // les réponses sont données dans l'ordre, mais pas les questions.
        // 1 utilisateur = un actArray
        for (
          let cartId = 0, len = diaporama.carts.length;
          cartId < len;
          cartId++
        ) {
          for (
            let slider = 0, len = diaporama.carts[cartId].target.length;
            slider < len;
            slider++
          ) {
            const div = document.createElement("div");
            let score = 0;
            let targetId = Number(diaporama.carts[cartId].target[slider]);
            let ol = document.createElement("ol");
            ol.innerHTML = "<b>Réponses pour " + String(targetId) + "</b>";
            ol.innerHTML +=
              " (" +
              MMmath.round(diaporama.times[targetId - 1] / 1000, 2) +
              " s. / " +
              diaporama.totaltimes[targetId - 1] +
              " s. prévues.)";
            let ia = 0;
            // pour un target, on a l'ordre des activités et des réponses.
            for (
              let slide = 0,
                len2 = diaporama.carts[cartId].actsArrays[slider].length;
              slide < len2;
              slide++
            ) {
              if (diaporama.userAnswers[targetId - 1][ia] === undefined) break;
              let refs = diaporama.carts[cartId].actsArrays[slider][slide];
              let li = document.createElement("li");
              let span = document.createElement("span");
              let userAnswer = diaporama.userAnswers[targetId - 1][ia]; //.replace(",", ".").trim();// on remplace la virgule française par un point, au cas où
              /*if (userAnswer.indexOf("\\text") === 0) {
                userAnswer = userAnswer.substring(6, userAnswer.length - 1);
              }
              // remplacer une espace texte par une espace
              userAnswer = userAnswer.replace("\\text{ }", " ");
              userAnswer = userAnswer.replace(">", "\\gt");
              userAnswer = userAnswer.replace("<", "\\lt");*/
              const expectedAnswer =
                diaporama.goodAnswers[cartId][slider][refs[0]][refs[1]];
              let valueType =
                diaporama.carts[cartId].activities[refs[0]].valueType;
              // console.log(userAnswer,expectedAnswer);
              // TODO : better correction value
              // prendre en compte les cas où plusieurs réponses sont possibles
              // attention, si c'est du texte, il faut supprimer des choses car mathlive transforme
              if (Array.isArray(expectedAnswer)) {
                for (const oneExpected of expectedAnswer) {
                  const result = analyseReponse(
                    oneExpected,
                    userAnswer,
                    valueType,
                  );
                  if (result) {
                    li.className = "good";
                    score++;
                    break;
                  } else {
                    li.className = "wrong";
                  }
                }
              } else if (String(expectedAnswer).indexOf(",") > 0) {
                const expetedAnswersArray = expectedAnswer.split(",");
                for (const oneExpected of expetedAnswersArray) {
                  const result = analyseReponse(
                    oneExpected,
                    userAnswer,
                    valueType,
                  );
                  if (result) {
                    li.className = "good";
                    score++;
                    break;
                  } else {
                    li.className = "wrong";
                  }
                }
              } else {
                const result = analyseReponse(
                  expectedAnswer,
                  userAnswer,
                  valueType,
                );
                if (result) {
                  li.className = "good";
                  score++;
                } else {
                  li.className = "wrong";
                }
              }
              if (li.className === "") li.className = "wrong";
              // On transforme ça en champ LaTeX à afficher (vient mathlive qui renvoie du LaTeX)
              span.innerHTML = "$$" + userAnswer + "$$";
              ia++;
              li.appendChild(span);
              ol.appendChild(li);
            }
            div.appendChild(ol);
            let section = document.createElement("section");
            section.className = "score";
            section.innerHTML = "<b>Score :</b> " + score + "/" + ia;
            div.appendChild(section);
            //envoi d'un message au site qui a intégré MM :
            if (diaporama.embededIn) {
              window.parent.postMessage(
                {
                  url: window.location.href,
                  graine: diaporama.seed,
                  nbBonnesReponses: score,
                  nbMauvaisesReponses: parseInt(ia) - parseInt(score),
                  slider: slider,
                  touchable: diaporama.touched,
                },
                diaporama.embededIn,
              );
            }
            diaporama.correction
              .querySelector("#dc" + cartId + "-" + slider)
              .appendChild(div);
          }
        }
      } else {
        if (diaporama.embededIn) {
          window.parent.postMessage(
            { url: window.location.href, graine: diaporama.seed },
            diaporama.embededIn,
          );
        }
      }
      // on affiche la fin de l'activité
      diaporama.hideSlideshows();
    }
  },
  pauseAllSliders() {
    // on permet de mettre en pause uniquement si on n'est pas en mode online.
    if (diaporama.onlineState === "no") {
      for (let i = 0, l = diaporama.timers.length; i < l; i++) {
        diaporama.timers[i].pause(this);
      }
    }
  },
  stopAllSliders: function () {
    for (let i = 0, l = diaporama.timers.length; i < l; i++) {
      diaporama.timers[i].end(this);
    }
    if (diaporama.text2speach.length) {
      diaporama.speech.stop();
    }
  },
  nextAllSliders: function () {
    for (let i = 0, l = diaporama.steps.length; i < l; i++) {
      diaporama.nextSlide(i);
    }
  },
};
let verifInterval = null;
const saveContent = function () {
  if (verifInterval !== null) clearInterval(verifInterval);
  const contentResult = document.getElementById("corrige-content");
  contentResultats = contentResult.innerHTML;
  verifInterval = setInterval(() => {
    if (contentResult.innerHTML !== contentResultats) {
      console.log(contentResult.innerHTML, contentResultats);
      contentResult.innerHTML = contentResultats;
    }
  }, 2000);
};

function setZoom(element) {
  if (element.dataset.length === 0) return;
  if (element.dataset.what === "in") {
    diaporama.zooms[element.dataset.zoom].plus();
    if (element.dataset.assoc !== "") {
      diaporama.zooms[element.dataset.assoc].plus();
    }
  } else if (element.dataset.what === "out") {
    diaporama.zooms[element.dataset.zoom].minus();
    if (element.dataset.assoc !== "") {
      diaporama.zooms[element.dataset.assoc].minus();
    }
  } else if (element.dataset.what === "reset") {
    diaporama.zooms[element.dataset.zoom].reset();
    if (element.dataset.assoc !== "") {
      diaporama.zooms[element.dataset.assoc].reset();
    }
  }
}

window.onload = () => {
  diaporama.version = utils.getVersion();
  // detect if touching interface
  let listener = function () {
    // the user touched the screen!
    diaporama.touched = true;
    window.removeEventListener("touchstart", listener, false);
  };
  window.addEventListener("touchstart", listener, false);
  // diaporama.initializeAlea(Date());
  sound.getPlayer();
  diaporama.zooms["thezoom"] = new Zoom("thezoom", "#slideshow .slide");
  document
    .querySelector("#slideshow-container header")
    .appendChild(diaporama.zooms["thezoom"].createCursor());
  diaporama.speech = new speech();
  // boutons de commande
  document
    .querySelectorAll("#corrige-content, #enonce-content")
    .forEach((el) => {
      el.onclick = (evt) => {
        setZoom(evt.target);
        saveContent();
      };
    });
  const zones = ["corrige", "enonce", "param"];
  function resetButtonsAndContent() {
    zones.forEach((el) =>
      document.getElementById("btn-" + el).classList.remove("active"),
    );
    zones.forEach((el) =>
      document.getElementById("tab-" + el).classList.add("hidden"),
    );
  }
  zones.forEach(
    (el) =>
      (document.getElementById("btn-" + el).onclick = (evt) => {
        resetButtonsAndContent();
        document.getElementById("tab-" + el).classList.remove("hidden");
        document.getElementById("btn-" + el).classList.add("active");
      }),
  );
  document.getElementById("slideshow").addEventListener("click", (evt) => {
    let targetId = evt.target.id;
    //zooms
    setZoom(evt.target);
    if (evt.target.nodeName.toLowerCase() === "i") {
      targetId = evt.target.parentNode.id;
    }
    for (let i = 0; i < 4; i++) {
      switch (targetId) {
        case "ButtonNextAct" + i:
          diaporama.newSample(i, true);
          break;
        case "btn-sample-annotate" + i:
          diaporama.annotateThisThing("sampleSlide" + i, targetId);
          break;
        case "btn-sample-showanswer" + i:
          diaporama.showSampleAnswer(i);
          break;
        case "btn-newsample" + i:
          diaporama.newSample(i);
          break;
        case "btn-sample-start" + i:
          diaporama.startSlideShow(i);
          break;
        case "btn-timer-end" + i:
          diaporama.timers[i].end(diaporama);
          break;
        case "btn-timer-pause" + i:
          diaporama.timers[i].pause(diaporama);
          break;
        case "btn-show-answer" + i:
          diaporama.showTheAnswer(i);
          break;
        case "btn-next-slide" + i:
          diaporama.nextSlide(i);
          break;
        default:
          break;
      }
    }
  });
  // boutons commandes générales
  document.querySelector("#slideshow-container header").onclick = (evt) => {
    switch (evt.target.parentNode.id) {
      case "stop-all":
        diaporama.stopAllSliders();
        break;
      case "pause-all":
        diaporama.pauseAllSliders();
        break;
      case "next-all":
        diaporama.nextAllSliders();
        break;
      default:
        break;
    }
    switch (evt.target.dataset.what) {
      case "in":
        diaporama.zooms[evt.target.dataset.zoom].plus();
        break;
      case "out":
        diaporama.zooms[evt.target.dataset.zoom].minus();
        break;
      case "reset":
        diaporama.zooms[evt.target.dataset.zoom].reset();
        break;
      default:
        break;
    }
  };
  // boutons section corrigés
  document
    .querySelector("#tab-corrige aside")
    .addEventListener("click", (evt) => {
      let target = utils.getTargetWithImageInside(evt);
      switch (target.id) {
        case "btn-annotation-corrige":
          diaporama.annotateThisThing("corrige-content", target.id);
          saveContent();
          break;
        case "btn-restart-otherdata":
          // si la sauvegarde est en cours, on l'arrête pour que les modifications soient prises en compte
          if (verifInterval !== null) clearInterval(verifInterval);
          diaporama.start();
          break;
        case "btn-restart-samedata":
          // si la sauvegarde est en cours, on l'arrête pour que les modifications soient prises en compte
          if (verifInterval !== null) clearInterval(verifInterval);
          // the true value force to restart with same datas
          diaporama.start(true);
          break;
        default:
          break;
      }
    });
  document.getElementById("btn-annotation-enonce").onclick = () => {
    diaporama.annotateThisThing("enonce-content", "btn-annotation-enonce");
  };
  document
    .getElementById("corrige-content")
    .addEventListener("click", (evt) => {
      if (evt.target.innerHTML === "Figure") {
        diaporama.memory[evt.target.dataset.id].toggle();
        saveContent();
      }
    });
  diaporama.checkURL();
};
