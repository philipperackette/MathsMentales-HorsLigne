import protos from "./mods/protos.js";
// import utils from './mods/utils.js';
import { utils, _ } from "./mods/utils.js";
import common from "./mods/common.js";
import cart from "./mods/cart.js";
import Figure from "./mods/figure.js";
//import { format } from '@cortex-js/compute-engine/dist/types/compute-engine/public.js';
const MM = {};
MM.version = utils.getVersion();

const content = document.getElementById("creator-content");
let pageHeight = 287;
const parameters = {
  spacer: document.getElementById("spacerInput").value,
  answerHeight: document.getElementById("inputheight").value,
  corrigeAuDos: document.getElementById("corrigeAuDos").checked,
  corrigeAuDosValue:
    Number(document.getElementById("corrigeAuDosValue").value) || 4,
  fontSizes: [],
  lineHeight: "auto",
};
document.getElementById("creator-menu").onclick = (evt) => {
  if (evt.target.id === "toggleCorriges") {
    if (parameters.posCorrection === "fin") {
      parameters.posCorrection = "apres";
    } else {
      parameters.posCorrection = "fin";
    }
    refresh();
  } else if (evt.target.id === "btnChangeBorder") {
    changeBorder(evt.target.checked);
  } else if (evt.target.id === "btndisplayfig") {
    displayFigures("all");
  } else if (
    evt.target.id === "btndisplayeval" ||
    evt.target.parentNode.id === "btndisplayeval"
  ) {
    displayEval();
  } else if (evt.target.id.indexOf("btnorder") === 0) {
    changeOrder(evt.target.id.substr(8));
  } else if (evt.target.id.indexOf("btndisplayfig") === 0) {
    displayFigures(Number(evt.target.id.substr(13)));
  } else if (evt.target.classList.contains("colorpicker")) {
    document.getElementById("colorpicker").click();
  } else if (evt.target.id === "btnAutoSetLineHeight") {
    changeLinesHeight();
  }
};
document.getElementById("creator-menu").oninput = (evt) => {
  if (evt.target.id.indexOf("fsize") === 0) {
    changeFontSize(Number(evt.target.id.substr(5)), evt.target.value);
  } else if (evt.target.id.indexOf("asize") === 0) {
    changeWidth(Number(evt.target.id.substr(5)), evt.target.value);
  } else if (evt.target.id.indexOf("selpos") === 0) {
    setDispositionReponse(Number(evt.target.id.substr(6)), evt.target.value);
  } else if (evt.target.id.indexOf("ansWidth" === 0)) {
    changeAnswerWidth(evt.target.id.substr(8), evt.target.value);
  }
};

document.getElementById("nbFiches").oninput = (evt) => {
  if (evt.target.id === "nbFiches") {
    parameters.nb = evt.target.value;
  }
  refresh();
};
document.getElementById("inputheight").oninput = (evt) => {
  changeHeight(evt.target.value);
};
document.getElementById("lineHeightValue").oninput = () => {
  changeLinesHeight();
};
document.getElementById("fsize").oninput = (evt) => {
  changeAllFontSize(evt.target.value);
};
document.getElementById("spacerInput").oninput = (evt) => {
  changeSpaceBetween(evt.target.value);
};
document.getElementById("setAnswerAllPos").oninput = (evt) => {
  setDispositionReponseAll(evt.target.value);
};
document.getElementById("colorpicker").oninput = (evt) => {
  changeColor(evt.target.value, "bg");
  //evt.target.value="#ECECEC";
};
document.getElementById("colorpicker2").oninput = (evt) => {
  changeColor(evt.target.value, "bd");
  document.getElementById("btnChangeBorder").checked = true;
  //evt.target.value="#707070";
};
document.getElementById("colorpickertitle").oninput = (evt) => {
  changeColor(evt.target.value, "bgt");
  //evt.target.value="#CCCCCC"
};
document.getElementById("colorpickertitle").oncontextmenu = (evt) => {
  changeColor("", "bgt", true);
  evt.target.value = "#CCCCCC";
};
document.getElementById("copiesByPage").onclick = () => {
  setPrintMode();
};
document.getElementById("corrigeAuDos").onclick = () => {
  const isCorrigeAuDos = document.getElementById("corrigeAuDos").checked;
  parameters.corrigeAuDos = isCorrigeAuDos;
  if (isCorrigeAuDos) {
    document.getElementById("toggleCorriges").checked = false;
    parameters.posCorrection = "fin";
  }
  refresh();
};
document.getElementById("corrigeAuDosValue").oninput = () => {
  parameters.corrigeAuDosValue = Number(
    document.getElementById("corrigeAuDosValue").value,
  );
  refresh();
};
/*
let exercicesColumn = Array(${nbcols}).fill("column");
let nbcols = ${nbcols};
/*
* change la hauteur des cases réponses, et de l'élément question si réponse dessous plutôt que dessus
*/
function changeHeight(nb) {
  parameters.answerHeight = nb;
  let elts = document.querySelectorAll(".ans");
  for (let i = 0; i < elts.length; i++) {
    elts[i].style.height = nb + "mm";
  }
  setPrintMode();
}

function changeLinesHeight() {
  const isAuto = document.getElementById("btnAutoSetLineHeight").checked;
  const elts = document.querySelectorAll(".ceinture-content.grid");
  if (isAuto) {
    parameters.lineHeight = "auto";
    for (const el of elts) {
      el.style["grid-template-rows"] =
        "max-content " +
        Array(parameters.nbrows).fill("auto").join(" ") +
        " max-content";
    }
  } else {
    parameters.lineHeight = document.getElementById("lineHeightValue").value;
    for (const el of elts) {
      if (el.id === "modele-grid") continue;
      el.style["grid-template-rows"] =
        "max-content " +
        Array(parameters.nbrows)
          .fill(parameters.lineHeight + "mm")
          .join(" ") +
        " max-content";
    }
  }
}
/**
 * change l'espace entre deux ceintures
 *
 */
function changeSpaceBetween(nb) {
  parameters.spacer = nb;
  document.querySelectorAll(".spacer").forEach((el) => {
    el.style["margin-top"] = nb + "mm";
  });
  setPrintMode();
}
/**
 * function from https://codepen.io/andreaswik/pen/YjJqpK/
 * @param {*} color
 * @returns
 */
function lightOrDark(color) {
  let r, g, b, hsp;
  // Check the format of the color, HEX or RGB?
  if (color.match(/^rgb/)) {
    // If HEX --> store the red, green, blue values in separate variables
    color = color.match(
      /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/,
    );

    r = color[1];
    g = color[2];
    b = color[3];
  } else {
    // If RGB --> Convert it to HEX: http://gist.github.com/983661
    color = +("0x" + color.slice(1).replace(color.length < 5 && /./g, "$&$&"));
    r = color >> 16;
    g = (color >> 8) & 255;
    b = color & 255;
  }
  // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
  hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
  // Using the HSP value, determine whether the color is light or dark
  if (hsp > 127.5) {
    return "light";
  } else {
    return "dark";
  }
}
/*
 * change la taille des caractères d'une colonne
 */
function changeFontSize(dest, value) {
  // il peut y avoir plusieurs sujets, donc on doit faire un traitement multiple
  let elts = document.querySelectorAll(".question" + dest);
  parameters.fontSizes[dest] = value;
  for (let i = 0; i < elts.length; i++) {
    elts[i].style.fontSize = value + "pt";
  }
  setPrintMode();
}
/*
 * change la taille des caractères de toutes les colonnes
 */
function changeAllFontSize(value) {
  let elts = document.querySelectorAll(".quest");
  for (let i = 0; i < elts.length; i++) {
    elts[i].style.fontSize = value + "pt";
  }
  setPrintMode();
  // synchros des autres champs
  parameters.fontSizes = Array(parameters.nbcols + 1).fill(value);
  document.querySelectorAll(".fsizei").forEach((el) => {
    el.value = value;
  });
}
/*
 * change la disposition des lignes d'exercices d'une colonne
 * dest : id de la colonne où changer la place des réponses.
 * (String) how : column/columnv pour colonnes en ligne ou verticales
 */
function setDispositionReponse(dest, how) {
  // il peut y avoir plusieurs sujets, donc on doit faire un traitement multiple
  let elts = document.querySelectorAll(".col" + dest);
  if (how === "row") {
    elts.forEach((el) => {
      el.classList.remove("column");
    });
    changeAnswerWidth(dest, document.getElementById("ansWidth" + dest).value);
  } else {
    elts.forEach((el) => {
      el.classList.add("column");
    });
    changeAnswerWidth(dest, 100);
  }
  setPageBreaks();
}
/*
 * Change la disposition de toutes les lignes d'exercices
 */
function setDispositionReponseAll(how) {
  let elts = document.querySelectorAll(".ceinture .grid .flex");
  let selindex = 1;
  if (how === "row") {
    elts.forEach((el) => {
      el.classList.remove("column");
    });
    selindex = 0;
    document.querySelectorAll(".answidth").forEach((el) => {
      changeAnswerWidth(el.id.substring(8), el.value);
    });
  } else {
    elts.forEach((el) => {
      el.classList.add("column");
    });
    changeAnswerWidth("s", "100", false);
  }
  setPrintMode();
  // on met les valeurs des autres input à cette valeur
  let inputs = document.querySelectorAll(".selectpos");
  for (let i = 0; i < inputs.length; i++) {
    inputs[i].selectedIndex = selindex;
  }
}
/*
 * Change la largeur des colonnes
 */
function changeWidth(dest, nb) {
  let elts = document.querySelectorAll(".ceinture-content");
  if (elts[0].style["grid-template-columns"].indexOf("auto") > -1) {
    for (let i = 0; i < elts.length; i++) {
      let stylecols = elts[i].style["grid-template-columns"].split(" ");
      let style = Array(stylecols.length).fill("1fr").join(" ");
      elts[i].style["grid-template-columns"] = style;
    }
  }
  let style = elts[0].style["grid-template-columns"];
  let stylecols = style.split(" ");
  stylecols[dest - 1] = nb + "fr";
  style = stylecols.join(" ");
  parameters.stylecols = style;
  for (let i = 0; i < elts.length; i++) {
    elts[i].style["grid-template-columns"] = style;
  }
  setPrintMode();
}
function changeAnswerWidth(dest, width, changevalues = true) {
  if (dest === "s") {
    // tous les champs
    document
      .querySelectorAll(".ceinture .flex:not(.column) .ans")
      .forEach((el) => {
        el.style["width"] = width + "%";
      });
    document.querySelectorAll(".ceinture .flex.column .ans").forEach((el) => {
      el.style["width"] = "";
    });
    if (changevalues)
      document.querySelectorAll(".answidth").forEach((el) => {
        el.value = width;
      });
  } else {
    document
      .querySelectorAll(".ceinture .col" + dest + ".flex:not(.column) div.ans")
      .forEach((el) => {
        el.style["width"] = width + "%";
      });
    document
      .querySelectorAll(".ceinture .col" + dest + ".flex:not(.column) span.ans")
      .forEach((el) => {
        el.style["width"] = width + "pt";
      });
    document
      .querySelectorAll(".ceinture .col" + dest + ".flex.column .ans")
      .forEach((el) => {
        el.style["width"] = "";
      });
  }
  setPrintMode();
}
/*
 * change la couleur du fond des réponses
 * what : bg (background) || bd (border)
 */
function changeColor(hexa, what, reset = false) {
  let styleAttr = "background-color";
  let styleVal = hexa;
  if (what !== "bgt") {
    const elts = document.querySelectorAll(".ans");
    if (what === "bd") {
      parameters.colorbd = hexa;
      styleAttr = "border";
      if (hexa === "none") styleVal = "none";
      else styleVal = "1pt solid " + hexa;
    } else if (what === "bg") {
      parameters.colorbg = hexa;
    }
    for (const el of elts) {
      el.style[styleAttr] = styleVal;
    }
    // éléments dans l'affichage katex
    if (what === "bg") {
      const spanElements = document.querySelectorAll(".katex-html .colorbox");
      for (const el of spanElements) {
        el.style[styleAttr] = styleVal;
      }
    }
  } else if (what === "bgt") {
    if (!reset) {
      parameters.colorbgt = hexa;
    } else {
      parameters.colorbgt = "";
    }
    const lumen = lightOrDark(parameters.colorbgt);
    document.querySelectorAll(".ceinture-titre").forEach((el) => {
      el.style[styleAttr] = parameters.colorbgt;
      if (lumen === "dark") {
        el.style["color"] = "white";
      } else {
        el.style["color"] = "";
      }
    });
  }
}
/**
 * Change la couleur du cadre des réponses
 *
 */
function changeBorder(bool) {
  if (bool) {
    parameters.answerBordered = true;
    changeColor(document.getElementById("colorpicker2").value, "bd");
  } else {
    parameters.answerBordered = false;
    changeColor("none", "bd");
  }
}
/**
 * Change l'ordre d'une colonne
 * (Integer) colId : numéro entier de la colonne (commence par 1)
 */
function changeOrder(colId) {
  if (parameters.colsOrdered === undefined) {
    parameters.colsOrdered = [false, false, false, false, false, false];
  }
  parameters[colId] = true;
  // on récupère l'ensemble des tableaux
  let tableaux = document.querySelectorAll(".ceinture-content");
  for (let i = 0; i < tableaux.length; i++) {
    // on récupère les celulles de la colonne choisie:
    let cels = tableaux[i].querySelectorAll(".col" + colId);
    let cles,
      start = 0;
    if (cels[0].classList.contains("ceinture-titre-colonne")) {
      cels[0].style["grid-row"] = 1;
      start = 1;
      // on crée un tableau des clés de lignes
      cles = [...Array(cels.length - 1)].map((a, b) => b + 2);
    } else {
      // on crée un tableau des clés de lignes
      cles = [...Array(cels.length)].map((a, b) => b + 1);
    }
    // on mélange les clés
    cles.sort(() => Math.random() - 0.5);
    // on met les celulles dans l'ordre
    for (let j = start; j < cels.length; j++) {
      cels[j].style["grid-row"] = cles[j - start];
    }
  }
}
/**
 * Affiche ou pas les figures dans la colonne
 * */
function displayFigures(idcol) {
  let btn, elts;
  if (idcol === "all") {
    btn = document.getElementById("btndisplayfig");
    elts = document.querySelectorAll("div.flex");
    idcol = "Toutes";
  } else {
    btn = document.getElementById("btndisplayfig" + idcol);
    elts = document.querySelectorAll(".col" + idcol);
  }
  if (btn.innerHTML === idcol + " on") {
    elts.forEach((el) => {
      el.classList.add("nofig");
    });
    btn.innerHTML = idcol + " off";
    if (idcol === "Toutes") {
      let cpt = 1;
      while (document.getElementById("btndisplayfig" + cpt) !== null) {
        document.getElementById("btndisplayfig" + cpt).innerHTML = cpt + " off";
        cpt++;
      }
    }
  } else {
    elts.forEach((el) => {
      el.classList.remove("nofig");
    });
    btn.innerHTML = idcol + " on";
    if (idcol === "Toutes") {
      let cpt = 1;
      while (document.getElementById("btndisplayfig" + cpt) !== null) {
        document.getElementById("btndisplayfig" + cpt).innerHTML = cpt + " on";
        cpt++;
      }
    }
  }
  setPrintMode();
}
/*
 * toggle l'affichage de l'espace d'évaluation de la ceinture
 */
function displayEval() {
  let btn = document.getElementById("btndisplayeval"),
    headers = document.querySelectorAll(".ceinture-header");
  if (btn.dataset.eval === "0") {
    parameters.resultInput = true;
    btn.dataset.eval = "1";
    btn.innerHTML = '<img src="img/closebutton32.png" width="10">';
    headers.forEach((el) => {
      el.classList.add("evaluation");
    });
  } else {
    parameters.resultInput = false;
    btn.dataset.eval = "0";
    btn.innerHTML = '<img src="img/iconfinder_pencil_1055013.png" width="10">';
    headers.forEach((el) => {
      el.classList.remove("evaluation");
    });
  }
}
/**
 * toggle plusieurs mêmes ceintures par page
 * le calcul du nombre de ceintures est automatique
 * il va s'adapter à la taille de chaque ceinture suivie du spacer
 */
function setPrintMode() {
  checkPortraitMode();
  // on supprime les copies
  document
    .querySelectorAll("div.ceinture:not(.original), div.spacer:not(.original)")
    .forEach((el) => {
      el.parentNode.removeChild(el);
    });
  // on remet les margin-top à la normale
  document.querySelectorAll("div.spacer.original").forEach((el) => {
    el.style.marginTop = parameters.spacer + "mm";
  });

  // on supprime les sauts de page
  const spacers = document.querySelectorAll("#creator-content .spacer");
  spacers.forEach((el) => el.classList.remove("pagebreak"));
  if (!document.getElementById("copiesByPage").checked) {
    setPageBreaks();
    return;
  }
  const heightOfspacer = document
    .querySelector(".spacer")
    .getBoundingClientRect().height;
  const content = document.getElementById("creator-content");
  const divTemp = utils.create("div", {
    style: "position:absolute;display:block;top:" + pageHeight + "mm",
  });
  document.body.appendChild(divTemp);
  const heightOfPage = divTemp.getBoundingClientRect().top;
  document.body.removeChild(divTemp);
  const whiteBottoms = [];
  document.querySelectorAll("div.ceinture.original").forEach((original) => {
    let copyEl,
      spacer,
      first = true;
    const heightOfCeinture = original.getBoundingClientRect().height;
    let totalHeight = heightOfCeinture + heightOfspacer;
    while (totalHeight + heightOfCeinture < heightOfPage) {
      copyEl = original.cloneNode(true);
      copyEl.classList.remove("original");
      totalHeight += heightOfCeinture + heightOfspacer;
      spacer = utils.create("div", {
        style: "margin-top:" + parameters.spacer + "mm",
        className: "spacer",
      });
      first = false;
      content.insertBefore(copyEl, original.nextSibling);
      content.insertBefore(spacer, original.nextSibling);
    }
    whiteBottoms.push(heightOfPage - totalHeight + heightOfspacer);
  });
  let i = 0;
  document
    .querySelectorAll("#creator-content .spacer.original")
    .forEach((spacer) => {
      spacer.classList.add("pagebreak");
      spacer.style["margin-top"] = whiteBottoms[i] + "px";
      spacer.style["padding-bottom"] = "0.01px";
      i++;
    });
}
function checkPortraitMode() {
  const landscape = document.querySelector('body[layout="landscape"]');
  if (landscape === null) pageHeight = 287;
  else pageHeight = 200;
}
/**
 * Crée la page
 */
function makePage() {
  content.innerHTML = "";
  MM.memory = {};
  parameters.goodAnswers = [];
  if (parameters.alea) {
    common.setSeed(parameters.alea);
  }
  let correction;
  if (parameters.posCorrection === "fin") {
    correction = utils.create("div", { id: "correction" });
    correction.appendChild(utils.create("div", { innerHTML: "Correction" }));
  }
  let divsPar = [];
  // recréation des boutons individuels de dimensions
  const modeleGrille = document.getElementById("modele-grid");
  let stylecols = Array(parameters.nbcols).fill("1fr").join(" ");
  if (parameters.stylecols !== undefined) stylecols = parameters.stylecols;
  modeleGrille.style["grid-template-columns"] = stylecols;
  if (!modeleGrille.hasChildNodes()) {
    for (let i = 0; i < parameters.nbcols; i++) {
      const colid = i + 1;
      const divcol = utils.create("div", {
        innerHTML: `<img src="img/fleche-droite.png" height="16" class="is-flipped"><input id="asize${i + 1}" value="1" title="Taille colonne ${i + 1}" type="number" size="4" min="0.5" max="4" step="0.1"><img src="img/fleche-droite.png"" height="16">`,
        className: "ceinture-titre-colonne border-black col" + colid,
        style: "grid-column:" + colid,
      });
      modeleGrille.appendChild(divcol);
    }
    for (let i = 0; i < parameters.nbcols; i++) {
      const colid = i + 1;
      const divcol = utils.create("div", {
        innerHTML: `Texte <input class="fsizei" id="fsize${i + 1}" value="10" title="Taille énoncé colonne ${i + 1}" type="number" size="5" min="8" max="16" step="0.5"></input>pt<br>
                Question : <button id="btnorder${i + 1}">Mélanger</button><br>
                figure <button id="btndisplayfig${i + 1}">${i + 1} on</button><br>
                <span class="ans answer bg-grey colorpicker">Réponse</span>
                <select id="selpos${i + 1}" class="selectpos">
                    <option value="row">à côté</option>
                    <option value="column">dessous</option>
                </select><br>
                larg : <input type="number" class="answidth" id="ansWidth${i + 1}" value="20" min="0" max="100" size="3" step="5">%`,
        className: "border-black col" + colid,
        style: "grid-column:" + colid,
      });
      modeleGrille.appendChild(divcol);
    }
  }
  parameters.cart.actsArrays = [];
  // on crée autant de ceintures que demandées
  for (let qty = 0; qty < parameters.nb; qty++) {
    parameters.goodAnswers[qty] = [];
    let actsArray = [];
    // on fait la liste des références activités / questions pour pouvoir créer les affichages
    for (let z = 0, alen = parameters.cart.activities.length; z < alen; z++) {
      let activity = parameters.cart.activities[z];
      activity.initialize();
      activity.generate();
      parameters.goodAnswers[qty][z] = utils.clone(activity.values);
      for (let j = 0; j < activity.questions.length; j++) {
        actsArray.push([z, j]);
      }
    }
    // on mélange les références si on veut que tout soit mélangé.
    if (!parameters.cart.ordered) {
      actsArray = utils.shuffle(actsArray);
    }
    parameters.cart.actsArrays[qty] = actsArray;

    // un conteneur pour la ceinture
    const ceinture = utils.create("div", { className: "ceinture original" });
    const spacer = utils.create("div", {
      style: "margin-top:" + parameters.spacer + "mm;",
      className: "spacer original",
    });
    const spacerCorrige = utils.create("div", {
      style: "margin-top:" + parameters.spacer + "mm;",
      className: "spacer original",
    });
    // un conteneur pour le corrigé
    const corrige = utils.create("div", { className: "ceintCorrige corrige" });
    if (qty % parameters.corrigeAuDosValue === 0 && parameters.corrigeAuDos) {
      divsPar.push(utils.create("div", { className: "parquatre" }));
    }
    common.generateQuestions(parameters);
    const header = utils.create("div", {
      className: "ceinture-header evaluation",
    });
    // Entêtes
    const bloc1 = utils.create("div", {
      className: "border-black ceinture-titre",
      innerHTML: parameters.titreCeinture,
    });
    const bloc2 = utils.create("div", {
      className: "border-black",
      innerHTML: "NOM :<br>Classe :",
    });
    let cleseed = "";
    if (parameters.ceintprintToEnonce) cleseed = "Clé : " + MM.seed + "<br> ";
    const bloc3 = utils.create("div", {
      className: "border-black",
      innerHTML: cleseed + "grille " + (qty + 1),
    });
    const blocevaluation = utils.create("div", {
      className: "border-black evaluation",
      innerHTML: "□ Validée<br>□ non Validée",
    });
    header.appendChild(bloc1);
    header.appendChild(bloc2);
    header.appendChild(blocevaluation);
    header.appendChild(bloc3);
    ceinture.appendChild(header);
    // entête du corrigé
    if (parameters.ceintprintToCorrige) cleseed = "Clé : " + MM.seed + " / ";
    else cleseed = "";
    corrige.appendChild(
      utils.create("div", {
        innerHTML:
          parameters.titreCeinture + "<br>" + cleseed + "grille : " + (qty + 1),
        className: "border-black",
      }),
    );
    // un repère de colonne
    let colsid = 0;
    // le css directement dans le DOM pour pouvoir le modifier ensuite
    const stylecolscorrection = Array(parameters.nbcols).fill("auto").join(" ");
    const stylerowsCorrection = Array(parameters.nbrows).fill("auto").join(" ");
    const stylerows = Array(parameters.nbrows)
      .fill(
        parameters.lineHeight + (Number(parameters.lineHeight) > 0 ? "mm" : ""),
      )
      .join(" ");
    const divColonnes = utils.create("div", {
      className: "ceinture-content grid",
      style:
        "grid-template-columns:" +
        stylecols +
        ";grid-template-rows:" +
        ("max-content " + stylerows + " max-content"),
    });
    const divColsCorrige = utils.create("div", {
      className: "ceinture-corrige grid",
      style:
        "grid-template-columns:" +
        stylecolscorrection +
        ";grid-template-rows:" +
        stylerowsCorrection,
    });
    // conteners corrections et enoncés (objet de tableaux)
    let divCorr = {},
      cols = {};
    let nbq = 0;
    for (let actIndex = 0; actIndex < actsArray.length; actIndex++) {
      const i = actsArray[actIndex][0];
      const activity = parameters.cart.activities[i];
      const j = actsArray[actIndex][1];
      if (nbq % parameters.nbrows === 0) {
        // nouvelle colonne
        colsid++;
        cols[colsid] = [];
        // on donne  à la colonne une classe pour pouvoir modifier des choses dedans.
        divCorr[colsid] = [];
        if (!_.isEmpty(parameters.titres)) {
          let titre = parameters.titres[colsid - 1]
            ? parameters.titres[colsid - 1]
            : "";
          cols[colsid].push(
            utils.create("div", {
              innerHTML: titre,
              className: "ceinture-titre-colonne border-black col" + colsid,
              style: "grid-column:" + colsid,
            }),
          );
        }
      }
      nbq++;
      const ligne = utils.create("div", {
        className: "flex border-black col" + colsid,
        style: "grid-column:" + colsid,
      });
      const divQuestion = utils.create("div", { className: "valign" });
      const ligneCorr = utils.create("div", {
        className: "grid border-black",
      });
      let divans = `<div class="bg-grey ans answer ${colsid}" style="height:${parameters.answerHeight}mm;"></div>`;
      let content = activity.shortQuestions[j] || activity.questions[j];
      let ansInside = false;
      let inLatex = false;
      if (String(content).indexOf("colorbox") > -1) {
        ansInside = true;
        // divans = `<span class="bg-grey ans answer ${colsid}" style="height:20pt;"></span>`
      }
      if (
        activity.type === "latex" ||
        activity.type === "" ||
        activity.type === undefined
      ) {
        inLatex = true;
        const divq = utils.create("div", {
          className: "question" + colsid + " quest",
          style: "font-size:" + parameters.fontSizes[colsid] + "pt",
        });
        const span = utils.create("span");
        span.innerHTML = "$$" + content + "$$";
        divq.appendChild(span);
        divQuestion.appendChild(divq);
      } else {
        divQuestion.appendChild(
          utils.create("div", {
            innerHTML: content,
            className: "question" + colsid + " quest",
            style: "font-size:" + parameters.fontSizes[colsid] + "pt",
          }),
        );
      }
      if (activity.figures[j] !== undefined) {
        const divfig = utils.create("div", { className: "fig" });
        (divQuestion.appendChild(divfig),
          (MM.memory[qty + "-" + "f" + i + "-" + j] = new Figure(
            utils.clone(activity.figures[j]),
            qty + "-" + "f" + i + "-" + j,
            divfig,
          )));
      }

      ligne.appendChild(divQuestion);
      let value = activity.values[j];
      if (Array.isArray(value)) {
        value = value[0];
      }
      let spanc = utils.create("span");
      //if(inLatex)
      spanc.innerHTML = "$$" + value + "$$";
      /*else {
                    spanc.innerHTML = value
                }*/

      /*if(activity.type === undefined || activity.type === "" || activity.type === "latex"){
                    spanc.classList.add("math");
                }*/
      ligneCorr.appendChild(spanc);
      divCorr[colsid].push(ligneCorr);
      if (!ansInside) {
        ligne.innerHTML += divans; //ligne.innerHTML.replaceAll("_",divans);
      } // else {
      //    ligne.innerHTML += divans;
      //}
      cols[colsid].push(ligne);
      if (activity.figuresCorrection[j] !== undefined) {
        const divfigc = utils.create("div", { className: "fig" });
        (ligneCorr.appendChild(divfigc),
          (MM.memory[qty + "-" + "fc" + i + "-" + j] = new Figure(
            utils.clone(activity.figuresCorrection[j]),
            qty + "-" + "fc" + i + "-" + j,
            divfigc,
          )));
      }
      if (nbq % parameters.nbrows === 0 && parameters.nbrows > 0) {
        if (parameters.pied !== "") {
          cols[colsid].push(
            utils.create("div", {
              innerHTML: parameters.pied,
              className: "ceinture-pied-colonne border-black",
            }),
          );
        }
      }
    }
    // on insère les enfants
    for (let i = 0; i < cols[1].length; i++) {
      for (let j = 1; j <= parameters.nbcols; j++) {
        divColonnes.appendChild(cols[j][i]);
      }
    }
    ceinture.appendChild(divColonnes);
    content.appendChild(ceinture);
    if (qty < parameters.nb - 1) content.appendChild(spacer);
    for (let i = 0; i < divCorr[1].length; i++) {
      for (let j = 1; j <= parameters.nbcols; j++) {
        divColsCorrige.appendChild(divCorr[j][i]);
      }
    }
    corrige.appendChild(divColsCorrige);
    let parAlafin = false;
    if (parameters.corrigeAuDos) {
      divsPar[divsPar.length - 1].appendChild(corrige);
      if (
        qty % parameters.corrigeAuDosValue ===
        parameters.corrigeAuDosValue - 1
      ) {
        content.appendChild(divsPar[divsPar.length - 1]);
        content.appendChild(
          utils.create("div", {
            style: "margin-top:" + parameters.spacer + "mm;",
            className: "spacer original",
          }),
        );
        parAlafin = true;
      }
    }
    if (parameters.posCorrection === "fin" && !parameters.corrigeAuDos) {
      correction.appendChild(corrige);
    } else if (!parameters.corrigeAuDos) {
      content.appendChild(corrige);
      corrige.classList.remove("fleft");
      content.appendChild(spacerCorrige);
    } else if (parameters.corrigeAuDos && !parAlafin) {
      content.appendChild(divsPar[divsPar.length - 1]);
    }
  }
  //content.appendChild(utils.create("div",{className:"footer"}));
  // on ajoute la correction à la fin.
  if (parameters.posCorrection === "fin" && !parameters.corrigeAuDos) {
    const pageBreaker = utils.create("div", { className: "pagebreak" });
    content.appendChild(pageBreaker);
    content.appendChild(correction);
  }
  if (parameters.colorbd !== undefined) {
    changeColor(parameters.colorbd, "bd");
  }
  if (parameters.colorbg !== undefined) {
    changeColor(parameters.colorbg, "bg");
  }
  if (!utils.isEmpty(MM.memory)) {
    setTimeout(function () {
      for (const k in MM.memory) {
        if (k !== "dest") MM.memory[k].display();
      }
      setPrintMode();
    }, 300);
  } else {
    setTimeout(() => {
      setPrintMode();
    }, 300);
  }
}
function refresh() {
  makePage();
  utils.mathRender(parameters.fontType);
  content.oninput = (evt) => {
    if (evt.target.nodeName.toLowerCase() === "input") {
      changecols(evt.target.dataset.dest, evt.target.value);
    }
  };
}
function setPageBreaks() {
  checkPortraitMode();
  const tempDiv = utils.create("div", {
    id: "mobileDiv",
    style: "position:absolute;top:" + pageHeight + "mm;",
  });
  document.body.appendChild(tempDiv);
  let hauteurPage = tempDiv.getBoundingClientRect().top;
  document.body.removeChild(tempDiv);
  const ceintures = document.querySelectorAll("#creator-content .ceinture");
  const spacers = document.querySelectorAll("#creator-content .spacer");
  const corriges = document.querySelectorAll("#creator-content .corrige");
  const heightOfSpacer = spacers[0].getBoundingClientRect().height;
  spacers.forEach((el) => el.classList.remove("pagebreak"));
  let heightOfElements = 0;
  const parQuatre = document.querySelector(".parquatre");
  if (parQuatre !== null) {
    document
      .querySelectorAll(".parquatre + .spacer:not(:last-of-type)")
      .forEach((el) => {
        el.classList.add("pagebreak");
      });
  } else {
    for (let i = 0; i < ceintures.length; i++) {
      heightOfElements +=
        ceintures[i].getBoundingClientRect().height + heightOfSpacer;
      if (parameters.posCorrection === "apres") {
        heightOfElements +=
          corriges[i].getBoundingClientRect().height + heightOfSpacer;
      }
      if (heightOfElements - heightOfSpacer > hauteurPage) {
        heightOfElements -=
          ceintures[i].getBoundingClientRect().height + heightOfSpacer;
        let indice = i;
        if (parameters.posCorrection === "apres") indice = i * 2;
        if (spacers[indice - 1] !== undefined) {
          spacers[indice - 1].classList.add("pagebreak");
          spacers[indice - 1].style["margin-top"] =
            String(hauteurPage - heightOfElements) + "px";
          spacers[indice - 1].style["padding-bottom"] = "0.01px";
        }
        heightOfElements =
          ceintures[i].getBoundingClientRect().height + heightOfSpacer;
      }
    }
  }
}

function checkURL(urlString) {
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
      title: "Éditer les activités de la ceinture",
    });
    buttonEdit.onclick = () => {
      let url =
        window.location.href.replace("ceinture.html", "index.html") +
        "&edit&type=ceinture";
      // add alea key
      url = url.replace(/,a=[\d\w]*,/, ",a=" + parameters.alea + ",");
      window.location.href = url;
    };
    $destination.prepend(buttonEdit);
  }

  if (vars.c !== undefined) {
    // présence de carts MM v2 à lancer ou éditer
    // le seed d'aléatorisation est fourni et on n'est pas en mode online
    if (vars.a) {
      parameters.alea = vars.a;
    } else {
      parameters.alea = common.setSeed();
    }
    // paramètres des activités des paniers
    let json = vars.c;
    // parametres globaux :
    parameters.fontType = vars.fs ?? "serif";
    parameters.nb = Number(vars.n);
    parameters.posCorrection = vars.cor;
    parameters.titreCeinture = vars.t ? decodeURI(vars.t) : "Ceinture";
    parameters.nbcols = Number(vars.nc);
    parameters.nbrows = Number(vars.nr);
    parameters.ceintprintToEnonce = vars.ke === "true" ? true : false;
    parameters.ceintprintToCorrige = vars.kc === "true" ? true : false;
    parameters.titres = [];
    parameters.pied = decodeURI(vars.pie) || "";
    parameters.orientation = vars.or;
    for (let i = 0; i < 5; i++) {
      if (vars["t" + i] !== undefined && vars["t" + i] !== false) {
        parameters.titres[i] = decodeURIComponent(vars["t" + i]);
      }
    }
    // Affectation de la valeur au nombre de feuilles
    document.getElementById("nbFiches").value = parameters.nb;
    document.querySelector("#creator-menu .spacer").style["margin-top"] =
      parameters.spacer + "mm";
    // alcarts contient des promises qu'il faut charger
    parameters.cart = new cart(0);
    if (!document.getElementById("btnAutoSetLineHeight").checked) {
      parameters.lineHeight = document.getElementById("lineHeightValue").value;
    }
    parameters.cart
      .import(json[0], false, MM.version)
      .then(() => {
        refresh();
      })
      .catch((err) => {
        // erreur à l'importation :(
        let alert = utils.create("div", {
          id: "messageerreur",
          className: "message",
          innerHTML: "Impossible de charger le panier :(<br>" + err,
        });
        document.getElementById("creator-content").appendChild(alert);
      });
  }
}
checkURL();
