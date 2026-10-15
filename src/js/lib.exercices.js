import protos from "./mods/protos.js";
import utils from "./mods/utils.js";
import common from "./mods/common.js";
import cart from "./mods/cart.js";
import Zoom from "./mods/zoom.js";
import Figure from "./mods/figure.js";

const MM = {};
MM.version = utils.getVersion();

const content = document.getElementById("creator-content");
// titresEdites : html des titres modifiés (par id), fusions : exercices
// supprimés ("fiche-index"), conservés quand la fiche est régénérée
const parameters = { exocols: [], titresEdites: {}, fusions: [] };
let separationFiches = false;
let zoom;
document.getElementById("creator-menu").onclick = (evt) => {
  if (evt.target.dataset.what === "in") {
    zoom.plus();
  } else if (evt.target.dataset.what === "out") {
    zoom.minus();
  } else if (evt.target.id === "fichesSeparation") {
    if (separationFiches) {
      separationFiches = false;
      document.getElementById(evt.target.id).innerText = "Feuilles séparées";
      document.querySelectorAll("footer").forEach((elt) => {
        elt.className = "";
      });
    } else {
      separationFiches = true;
      document.getElementById(evt.target.id).innerText = "Sans saut de page";
      document.querySelectorAll("footer").forEach((elt) => {
        elt.className = "break";
      });
    }
  } else if (evt.target.name === "corriges") {
    parameters.positionCorrection = evt.target.value;
    // "à côté" incompatible avec l'affichage des énoncés en 2 colonnes
    const acote = parameters.positionCorrection === "acote";
    if (acote) {
      parameters.columns = "1";
      document.getElementById("columns1").checked = true;
    }
    document.getElementById("columns2").disabled = acote;
    refresh();
  } else if (evt.target.name === "columns") {
    parameters.columns = evt.target.value;
    refresh();
  }
};
document.getElementById("creator-menu").oninput = (evt) => {
  if (evt.target.id === "nbFiches") {
    setNumberFiches(evt.target.value);
  }
};
/**
 * gestion des click sur les éléments pour afficher les corrections
 */
document.getElementById("creator-content").onclick = (evt) => {
  if (evt.target.id.indexOf("idCorrige") === 0) {
    const target = document.getElementById(
      evt.target.id.replace("idCorrige", "corrige"),
    );
    if (target.classList.toggle("hidden")) {
      document.getElementById(evt.target.id).classList.add("noprint");
    } else {
      document.getElementById(evt.target.id).classList.remove("noprint");
    }
  }
};
/**
 * titre d'exercice supprimé : les questions (et corrigés) sont fusionnés
 * avec l'exercice précédent de la même fiche
 */
function mergeWithPrevious(titre) {
  const m = titre.id.match(/^titreExo(\d+)-(\d+)$/);
  if (!m) return false;
  const qty = m[1];
  let prev = Number(m[2]) - 1;
  while (prev >= 0 && !document.getElementById("ol" + qty + "-" + prev)) {
    prev--;
  }
  if (prev < 0) return false;
  const i = m[2];
  [
    ["ol", "ol"],
    ["corrige", "corrige"],
  ].forEach(([src, dest]) => {
    const from = document.getElementById(src + qty + "-" + i);
    const to = document.getElementById(dest + qty + "-" + prev);
    while (from && to && from.firstChild) to.appendChild(from.firstChild);
  });
  // section de l'énoncé (contient aussi le corrigé en mode "each"/"acote")
  document.getElementById("enonce" + qty + "-" + i)?.remove();
  document.getElementById("sectionCorrige" + qty + "-" + i)?.remove();
  renumberExercises(qty);
  applyPageBreaks();
  return true;
}
// renumérote les titres restant au format "<Exercice n°>N : ..."
function renumberExercises(qty) {
  const prefix = parameters.titreExercices || "Exercice n°";
  let n = 1;
  document
    .querySelectorAll(`#creator-content .enonce [id^="titreExo${qty}-"]`)
    .forEach((h3) => {
      const text = h3.querySelector(".editable-text");
      if (text && text.textContent.startsWith(prefix)) {
        text.innerHTML = text.innerHTML.replace(
          new RegExp("^" + prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\d+"),
          prefix + n,
        );
      }
      n++;
      // recopie dans le titre du corrigé séparé
      const copie = document.querySelector(
        "#" + h3.id.replace("titreExo", "sectionCorrige") + " > h3 .editable-text",
      );
      if (copie && text) copie.innerHTML = text.innerHTML;
    });
}
// mémorise les titres modifiés pour les retrouver à la régénération
content.addEventListener("focusout", (evt) => {
  const text = evt.target.closest?.(".editable-text");
  const titre = text?.parentElement;
  if (titre?.id) parameters.titresEdites[titre.id] = text.innerHTML;
});
function setNumberFiches(nb) {
  parameters.nb = Number(nb);
  refresh();
}
function applyPageBreaks() {
  const pageHeightPx = utils.computePageHeightPx();
  document.querySelectorAll(".enonceContent").forEach((enonceContent) => {
    utils.insertAutoPageBreaks(
      Array.from(enonceContent.querySelectorAll(":scope > .enonce")),
      pageHeightPx,
    );
  });
}
function changecols(dest, nb) {
  document.querySelectorAll("." + dest).forEach((el) => {
    el.className = dest + " grid g" + nb;
  });
  // on met à jour les autres boutons
  document.querySelectorAll("[data-dest=" + dest + "]").forEach((el) => {
    el.value = nb;
  });
  parameters.exocols[Number(dest.slice(3))] = Number(nb);
}

function makePage() {
  if (parameters.alea) {
    common.setSeed(parameters.alea);
  }
  if (parameters.columns === undefined || parameters.columns === "1") {
    content.classList.remove("cols2");
  } else if (parameters.columns === "2") {
    content.classList.add("cols2");
  }
  content.innerHTML = "";
  MM.memory = {};
  for (let qty = 0; qty < parameters.nb; qty++) {
    const $enonceContent = utils.create("div", { className: "enonceContent" });
    common.generateQuestions(parameters);
    // si plus d'une fiche d'exercices, on introduit un pagebreak
    if (qty > 0) {
      content.appendChild(utils.create("footer"));
      $enonceContent.classList.add("column-break");
    }
    content.appendChild($enonceContent);
    // set elements :
    let aleaCode = utils.create("div", {
      className: "fright",
      innerHTML: "V" + (qty + 1),
    });
    $enonceContent.appendChild(aleaCode);
    // get the titlesheet
    let sheetTitle = parameters.titreFiche || "Fiche d'exercices";
    // set the titlesheet
    let header = utils.makeEditableTitle(
      "header",
      parameters.titresEdites["titreFiche" + qty] ?? sheetTitle,
      { id: "titreFiche" + qty },
    );
    $enonceContent.appendChild(header);
    // get the exercice title
    let exTitle =
      parameters.titreExercices !== ""
        ? parameters.titreExercices
        : "Exercice n°";
    // get the position of the correction
    let correctionContent = utils.create("div", {
      className: "correction",
      id: "divcorrection" + qty,
    });
    if (["end", "separe"].includes(parameters.positionCorrection)) {
      let titleCorrection = utils.create("header", {
        className: "clearfix",
        innerHTML: "Correction des exercices",
      });
      correctionContent.appendChild(titleCorrection);
    }
    // in case of figures
    // create a shit because of the li float boxes
    let divclear = utils.create("div", { className: "clearfix" });
    for (let i = 0; i < parameters.cart.activities.length; i++) {
      const activity = parameters.cart.activities[i];
      const sectionEnonce = utils.create("section", {
        id: "enonce" + qty + "-" + i,
        className: "enonce",
      });
      const sectionCorrection = utils.create("section", {
        id: "sectionCorrige" + qty + "-" + i,
        className: "correction",
      });
      //let sectionCorrection = utils.create("section",{id:"corrige"+qty+"-"+i});
      if (parameters.exocols[i] === undefined) {
        parameters.exocols[i] = 2;
      }
      let input = `<input id="nbcols${qty}-${i}" data-dest="exo${i}" class="noprint fright" value="${parameters.exocols[i]}" title="Nb de colonnes" type="number" size="2" min="1" max="6">`;
      sectionEnonce.innerHTML += input;
      let h3 = utils.makeEditableTitle(
        "h3",
        parameters.titresEdites["titreExo" + qty + "-" + i] ??
          exTitle +
            (i + 1) +
            " : " +
            (activity.consigne == "" ? activity.title : activity.consigne),
        {
          className: "exercice-title",
          id: "titreExo" + qty + "-" + i,
        },
      );
      if (i > 0) {
        const suppr = utils.create("span", {
          className: "delete-icon noprint",
          innerHTML: "🗑️",
          title: "Supprimer ce titre et fusionner avec l'exercice précédent",
        });
        suppr.onclick = (evt) => {
          evt.stopPropagation();
          const m = h3.id.match(/^titreExo(\d+-\d+)$/);
          if (m && mergeWithPrevious(h3)) parameters.fusions.push(m[1]);
        };
        h3.appendChild(suppr);
      }
      sectionEnonce.appendChild(h3);
      let ol = utils.create("ol", {
        id: "ol" + qty + "-" + i,
        className: "grid g" + parameters.exocols[i] + " exo" + i,
      });
      let olCorrection = utils.create("ol", {
        className: "corrige",
        id: "corrige" + qty + "-" + i,
      });
      for (let j = 0; j < activity.questions.length; j++) {
        let li = utils.create("li", { className: "c3" });
        let liCorrection = utils.create("li");
        let answer = Array.isArray(activity.answers[j])
          ? activity.answers[j][0]
          : activity.answers[j];
        if (
          activity.type === "latex" ||
          activity.type === "" ||
          activity.type === undefined
        ) {
          let span = utils.create("span", {
            innerHTML: "$$" + activity.questions[j] + "$$",
          });
          let spanCorrection = utils.create("span", {
            innerHTML: "$$" + answer + "$$",
          });
          li.appendChild(span);
          liCorrection.appendChild(spanCorrection);
        } else {
          li.innerHTML = activity.questions[j];
          liCorrection.innerHTML = answer;
        }
        ol.appendChild(li);
        // figures
        if (activity.figures[j] !== undefined) {
          //if(i===0 && j=== 0)MM.memory["dest"] = content;
          MM.memory[qty + "-" + "f" + i + "-" + j] = new Figure(
            utils.clone(activity.figures[j]),
            qty + "-" + "f" + i + "-" + j,
            li,
          );
        }
        if (activity.figuresCorrection[j] !== undefined) {
          MM.memory[qty + "-" + "f" + i + "-" + j + "-corr"] = new Figure(
            utils.clone(activity.figuresCorrection[j]),
            qty + "-" + "f" + i + "-" + j + "-corr",
            liCorrection,
          );
        }
        olCorrection.appendChild(liCorrection);
      }
      sectionEnonce.appendChild(ol);
      let ds = divclear.cloneNode(true);
      sectionEnonce.appendChild(ds);
      // affichage de la correction
      if (["each", "acote"].includes(parameters.positionCorrection)) {
        let hr = utils.create("div", {
          className: "titreCorrection pointer",
          innerHTML: "Correction",
          id: "idCorrige" + qty + "-" + i,
        });
        sectionCorrection.appendChild(hr);
        sectionCorrection.appendChild(olCorrection);
        if (parameters.positionCorrection === "acote") {
          // énoncé et corrigé côte à côte : deux colonnes dans l'exercice
          const gauche = utils.create("div", { className: "acote-enonce" });
          while (sectionEnonce.firstChild) {
            gauche.appendChild(sectionEnonce.firstChild);
          }
          sectionEnonce.classList.add("acote");
          sectionEnonce.appendChild(gauche);
        }
        sectionEnonce.appendChild(sectionCorrection);
      } else if (["end", "separe"].includes(parameters.positionCorrection)) {
        let h3correction = h3.cloneNode(true);
        h3correction.classList.add("titreCorrection");
        h3correction
          .querySelectorAll(".edit-icon, .delete-icon")
          .forEach((el) => el.remove());
        sectionCorrection.appendChild(h3correction);
        sectionCorrection.appendChild(olCorrection);
        sectionCorrection.appendChild(
          utils.create("div", { className: "clearfix" }),
        );
        correctionContent.appendChild(sectionCorrection);
      }
      $enonceContent.appendChild(sectionEnonce);
    }
    if (correctionContent.hasChildNodes()) {
      if (parameters.positionCorrection === "separe") {
        content.appendChild(utils.create("div", { className: "pagebreak" }));
      }
      content.appendChild(correctionContent);
      let ds = divclear.cloneNode(true);
      content.appendChild(ds);
    }
    // réapplique les fusions d'exercices faites avant la régénération
    parameters.fusions
      .filter((f) => f.startsWith(qty + "-"))
      .forEach((f) => {
        const titre = document.getElementById("titreExo" + f);
        if (titre) mergeWithPrevious(titre);
      });
  }
  if (!utils.isEmpty(MM.memory)) {
    setTimeout(function () {
      for (const k in MM.memory) {
        if (k !== "dest") MM.memory[k].display();
      }
      applyPageBreaks();
    }, 300);
  } else {
    setTimeout(() => {
      applyPageBreaks();
    }, 300);
  }
}
function refresh() {
  makePage();
  utils.mathRender(parameters.fontType);
  content.oninput = (evt) => {
    if (evt.target.nodeName.toLowerCase() === "input") {
      changecols(evt.target.dataset.dest, evt.target.value);
      applyPageBreaks();
    }
  };
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
    const $destination = document.querySelector(".noprint");
    const buttonEdit = utils.create("button", {
      innerHTML: "🖋️ Éditer",
      className: "noprint abstopright",
      title: "Éditer les activités de la feuille",
    });
    buttonEdit.onclick = () => {
      console.log("plouf");
      let url =
        window.location.href.replace("exercices.html", "index.html") +
        "&edit&type=exosheet";
      // add alea key
      url = url.replace(/,a=[\d\w]*,/, ",a=" + parameters.alea + ",");
      console.log("plif");
      window.location.href = url;
    };
    $destination.appendChild(buttonEdit);
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
    parameters.tailleTexte = Number(vars.s);
    parameters.nb = Number(vars.n);
    parameters.positionCorrection = vars.cor;
    if (parameters.positionCorrection === "sans") {
      document.getElementById("corriges-params").classList.add("hidden");
    } else {
      // synchronise les radios avec le choix fait dans l'éditeur
      const radio = document.querySelector(
        `input[name="corriges"][value="${parameters.positionCorrection}"]`,
      );
      if (radio) radio.checked = true;
    }
    parameters.titreFiche = decodeURI(vars.t);
    parameters.titreExercices =
      decodeURI(vars.ex).trim() + " ".replace("📣", "");
    parameters.enoncesSepares = vars.es || 0;
    parameters.corrigeSepare = vars.cs || 0;
    parameters.activitesColonnes = vars.cols || [];
    if (!Array.isArray(parameters.activitesColonnes)) {
      parameters.activitesColonnes.split("~");
    }
    parameters.corrigesVisibles = vars.cv || [];
    if (!Array.isArray(parameters.corrigesVisibles)) {
      parameters.corrigesVisibles.split("~");
    }
    // Affectation de la valeur au nombre de feuilles
    document.getElementById("nbFiches").value = parameters.nb;
    zoom = new Zoom(
      "changeFontSize",
      "#thehtml",
      true,
      "pt",
      parameters.tailleTexte,
    );
    document.getElementById("fontSize").appendChild(zoom.createCursor());
    document.querySelector("html").style["fontSize"] =
      parameters.tailleTexte + "pt";
    // alcarts contient des promises qu'il faut charger
    parameters.cart = new cart(0);
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
        document.getElementById("tab-accueil").appendChild(alert);
      });
  }
}
checkURL();
