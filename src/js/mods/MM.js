import { utils, _ } from "./utils.js";
import sound from "./sound.js";
import cart from "./cart.js";
import Zoom from "./zoom.js";
import Figure from "./figure.js";
import library from "./library.js";
import { activities } from "./content.js";
import draw from "./draw.js";
import activity from "./activity.js";
import Sortable from "../libs/sortable/sortable.core.esm.js";
import seedrandom from "../libs/seedrandom/seedrandom.esm.js";
import QRCodeStyling from "../libs/qr-code-styling/qr-code-styling.js";
import { generateODT, generateODP, readSections } from "./odt.js";
import historique from "./historique.js";

class Activity extends activity {
  constructor(obj, id = "") {
    super(obj, id);
  }
  /**
   * Display the activity editor
   */
  display(cle = "sample", MM) {
    this.initialize();
    document.getElementById("param-title-act").innerHTML = this.id;
    // affichages
    document.getElementById("activityTitle").innerHTML = this.title;
    if (this.speech) {
      MM.audioSamples = [];
      document.getElementById("voix").classList.remove("hidden");
      if (this.audioRead) {
        MM.setAudio(1);
      } else {
        MM.setAudio(0);
      }
    } else {
      document.getElementById("voix").classList.add("hidden");
      this.audioRead = false;
      MM.setAudio(0);
    }
    if (this.description)
      document.getElementById("activityDescription").innerHTML =
        this.description;
    else document.getElementById("activityDescription").innerHTML = "";
    const consigne = document.getElementById("activityConsigne");
    consigne.innerHTML = "";
    if (this.consigne) {
      const b = utils.create("b", { innerHTML: "Consigne Générale : " });
      consigne.appendChild(b);
      const bloc = utils.create("blockquote", {
        className: "consigneText",
        innerHTML: this.consigne,
      });
      consigne.appendChild(bloc);
    }
    // affichage d'exemple(s)
    const examples = document.getElementById("activityOptions");
    examples.innerHTML = "";
    MM.setSeed(cle);
    // paramètres de l'activité (cases à cocher indépendantes des options)
    if (this.params) {
      const bloc = utils.create("div", { id: "activityParams" });
      let groupe = "";
      for (const nom in this.params) {
        // les paramètres consécutifs de même groupe partagent un intitulé
        if (this.params[nom].groupe && this.params[nom].groupe !== groupe) {
          bloc.appendChild(
            utils.create("b", { innerHTML: this.params[nom].groupe + " : " }),
          );
        }
        groupe = this.params[nom].groupe || "";
        const input = utils.create("input", {
          id: "param-" + nom,
          type: "checkbox",
          value: nom,
          defaultChecked: this.chosenParams[nom],
          className: "checkbox blue",
        });
        const label = utils.create("label", {
          htmlFor: "param-" + nom,
          innerHTML: " " + (this.params[nom].label || nom),
        });
        const span = utils.create("span", { className: "nowrap" });
        span.style.display = "inline-block";
        span.style.marginRight = "1em";
        span.appendChild(input);
        span.appendChild(label);
        bloc.appendChild(span);
      }
      examples.appendChild(bloc);
    }
    if (this.options !== undefined && this.options.length > 0) {
      let colors = ["", " red", " orange", " blue", " green", " grey"];
      // Ajout de la possibilité de tout cocher ou pas
      let label = utils.create("label", {
        className: "bold",
        htmlFor: "chckallopt",
      });
      let hr = utils.create("hr");
      let input = utils.create("input", {
        type: "checkbox",
        className: "checkbox blue",
        id: "chckallopt",
        value: "all",
      });
      //input.setAttribute("onclick","MM.editedActivity.setOption('all',this.checked)");
      examples.appendChild(input);
      label.appendChild(document.createTextNode(" Tout (dé)sélectionner"));
      examples.appendChild(label);
      examples.appendChild(hr);
      let optionsLen = 0;
      // affichage des options
      for (let i = 0; i < this.options.length; i++) {
        this.generate(1, i, false); // génère un cas par option (si plusieurs)
        if (this.audios.length > 0) {
          for (let audio of this.audios) {
            if (audio) MM.audioSamples.push(audio);
          }
        }
        let p = utils.create("span");
        let input = utils.create("input", {
          id: "o" + i,
          type: "checkbox",
          value: i,
          defaultChecked: this.chosenOptions.indexOf(i) > -1 ? true : false,
          className: "checkbox" + colors[i % colors.length],
        });
        p.appendChild(input);
        const label = utils.create("label", { htmlFor: "o" + i });
        label.innerHTML = " " + this.options[i]["name"] + " :";
        p.appendChild(label);
        let ul = document.createElement("ul");
        if (Array.isArray(this.questions[0])) {
          if (this.figures[0]) {
            const div = utils.create("div");
            this.examplesFigs[i] = new Figure(
              utils.clone(this.figures[0]),
              "fig-ex" + i,
              div,
            );
            p.appendChild(div);
          }
          for (let jj = 0; jj < this.questions[0].length; jj++) {
            optionsLen++;
            let li = utils.create("li", { className: "tooltip" });
            let checked = "";
            if (this.chosenQuestions[i]) {
              if (this.chosenQuestions[i].indexOf(jj) > -1) checked = "checked";
            }
            li.innerHTML =
              "<input class='checkbox" +
              colors[i % colors.length] +
              "' type='checkbox' id='o" +
              i +
              "-" +
              jj +
              "' value='" +
              i +
              "-" +
              jj +
              "'" +
              checked +
              "> <label for='o" +
              i +
              "-" +
              jj +
              "'>" +
              (this.options[i].consigne !== undefined
                ? this.options[i].consigne + "<br>"
                : "") +
              this.setMath(this.questions[0][jj]) +
              "</label>";
            // answer
            let span = utils.create("span", { className: "tooltiptext" });
            if (Array.isArray(this.answers[0])) {
              span.innerHTML = this.setMath(String(this.answers[0][jj]));
            } else {
              span.innerHTML = this.setMath(String(this.answers[0]));
            }
            if (this.figuresCorrection[0]) {
              const div = utils.create("div");
              this.examplesFigsCorr[i] = new Figure(
                utils.clone(this.figuresCorrection[0]),
                "fig-ex-c" + i,
                div,
              );
              span.appendChild(div);
            }
            li.appendChild(span);
            ul.appendChild(li);
          }
        } else {
          optionsLen++;
          let li = utils.create("li", {
            className: "tooltip",
            innerHTML:
              (this.options[i].consigne !== undefined
                ? this.options[i].consigne + "<br>"
                : "") + this.setMath(this.questions[0]),
          });
          if (this.figures[0]) {
            this.examplesFigs[i] = new Figure(
              utils.clone(this.figures[0]),
              "fig-ex" + i,
              li,
            );
          }
          let span = utils.create("span", { className: "tooltiptext" });
          if (Array.isArray(this.answers[0]))
            span.innerHTML = this.setMath(this.answers[0][0]);
          else span.innerHTML = this.setMath(this.answers[0]);
          this.examplesFigsCorr[i] = new Figure(
            utils.clone(this.figuresCorrection[0]),
            "fig-ex-c" + i,
            span,
          );
          li.appendChild(span);
          ul.appendChild(li);
        }
        p.appendChild(ul);
        examples.appendChild(p);
      }
      // si plus de 3 options/sous-options, 2 colonnes seulement si panier non affiché.
      if (
        optionsLen > 3 &&
        document.getElementById("phantom").className === ""
      ) {
        utils.addClass(document.getElementById("divparams"), "colsx2");
      }
    } else {
      // no option
      this.generate(1);
      if (this.audios.length > 0) {
        for (let audio of this.audios) {
          if (audio) MM.audioSamples.push(audio);
        }
      }
      let p = document.createElement("span");
      let ul = document.createElement("ul");
      if (Array.isArray(this.questions[0])) {
        for (let jj = 0; jj < this.questions[0].length; jj++) {
          let li = document.createElement("li");
          if (this.figures[0]) {
            const div = utils.create("div");
            this.examplesFigs[i] = new Figure(
              utils.clone(this.figures[0]),
              "fig-ex" + i,
              div,
            );
            ul.appendChild(div);
          }
          li.className = "tooltip";
          li.innerHTML =
            "<input type='checkbox' class='checkbox' value='" +
            jj +
            "' onclick='MM.editedActivity.setQuestionType(this.value, this.checked);' >" +
            this.setMath(this.questions[0][jj]);
          let span = document.createElement("span");
          span.className = "tooltiptext";
          if (Array.isArray(this.answers[0])) {
            span.innerHTML = this.setMath(this.answers[0][jj]);
          } else {
            span.innerHTML = this.setMath(this.answers[0]);
          }
          if (this.figuresCorrection[0]) {
            const div = utils.create("div");
            this.examplesFigsCorr[i] = new Figure(
              utils.clone(this.figuresCorrection[0]),
              "fig-ex" + i + "corr",
              div,
            );
            span.appendChild(div);
          }
          li.appendChild(span);
          ul.appendChild(li);
        }
      } else {
        let li = document.createElement("li");
        li.className = "tooltip";
        li.innerHTML = this.setMath(this.questions[0]);
        if (this.figures[0]) {
          this.examplesFigs[0] = new Figure(
            utils.clone(this.figures[0]),
            "fig-ex" + 0,
            li,
          );
        }
        let span = document.createElement("span");
        span.className = "tooltiptext";
        span.innerHTML = this.setMath(this.answers[0]);
        if (this.figuresCorrection[0]) {
          this.examplesFigsCorr[i] = new Figure(
            utils.clone(this.figuresCorrection[0]),
            "fig-ex" + i + "corr",
            span,
          );
        }
        li.appendChild(span);
        ul.appendChild(li);
      }
      p.appendChild(ul);
      /*let p1 = document.createElement("p"); // affiche la réponse
            p1.innerHTML = this.setMath(this.answers[0]);
            p.appendChild(p1);*/
      // display answer
      examples.appendChild(p);
    }
    if (
      !utils.isEmpty(this.examplesFigs) ||
      !utils.isEmpty(this.examplesFigsCorr)
    ) {
      // it has to take his time...
      setTimeout(() => {
        for (let i in this.examplesFigs) {
          this.examplesFigs[i].display();
        }
        for (let i in this.examplesFigsCorr) {
          this.examplesFigsCorr[i].display();
        }
      }, 300);
    }
    // calcul du nombre de sous options par option pour voir s'il y en a autant par option
    let sameNumberOfSubOptions = true;
    let numbersOFSubOptions = [];
    const toutesOptions = document.querySelectorAll(
      "#activityOptions > span > ul",
    );
    toutesOptions.forEach((ul) => {
      if (
        numbersOFSubOptions.length > 1 &&
        !numbersOFSubOptions.includes(ul.children.length)
      ) {
        sameNumberOfSubOptions = false;
      }
      numbersOFSubOptions.push(ul.children.length);
    });
    // on va ajouter des boutons de sélection multiple si il y a plusieurs sous options par option en quantités égales
    if (sameNumberOfSubOptions && numbersOFSubOptions.length > 1) {
      if (numbersOFSubOptions[0] > 1) {
        const hr = document.querySelector("#activityOptions > hr");
        const div = utils.create("div");
        for (let i = 0; i < numbersOFSubOptions[0]; i++) {
          const chckbutton = utils.create("input", {
            type: "checkbox",
            id: `checkAllOptions${i}`,
            name: `checkAllOptions${i}`,
            className: "checkbox lightblue",
            value: i,
          });
          const label = utils.create("label", {
            htmlFor: `checkAllOptions${i}`,
            innerHTML: ` Options ${i + 1} `,
          });
          div.appendChild(chckbutton);
          div.appendChild(label);
        }
        hr.parentNode.insertBefore(div, hr);
      }
    }
    utils.mathRender(MM.fontType);
  }
  /**
   * setParam
   *
   * @param {string} nom nom du paramètre
   * @param {boolean} check état de la case
   */
  setParam(nom, check) {
    this.chosenParams[nom] = check;
  }
  /**
   * setOption
   *
   * @param {string} value optionId || optionID-renderID
   * @param {boolean} check check state
   *
   */
  setOption(value, check) {
    var optionId, renderId;
    if (value === "all") {
      this.chosenOptions = [];
      for (let i = 0, len = this.options.length; i < len; i++) {
        this.chosenQuestions[i] = [];
        let lenq = 0;
        if (typeof this.options[i].question === "object")
          lenq = this.options[i].question.length;
        else if (typeof this.questionPatterns === "object")
          lenq = this.questionPatterns.length;
        if (check) {
          this.chosenOptions.push(i);
          for (let j = 0; j < lenq; j++) {
            this.chosenQuestions[i].push(j);
            document.getElementById("o" + i + "-" + j).checked = true;
          }
          document.getElementById("o" + i).checked = true;
        } else {
          for (let j = 0; j < lenq; j++) {
            document.getElementById("o" + i + "-" + j).checked = false;
          }
          document.getElementById("o" + i).checked = false;
        }
        document
          .querySelectorAll("#activityOptions > div > input")
          .forEach((el) => {
            if (
              el.type === "checkbox" &&
              el.id.indexOf("checkAllOptions") === 0
            ) {
              el.checked = check;
            }
          });
      }
    } else if (value.indexOf("-") > -1) {
      let Ids = value.split("-");
      optionId = Number(Ids[0]);
      renderId = Number(Ids[1]);
      if (check) {
        // checkbox checked
        document.getElementById("o" + optionId).checked = true;
        document.getElementById("o" + optionId + "-" + renderId).checked = true;
        if (this.chosenOptions.indexOf(optionId) < 0) {
          this.chosenOptions.push(optionId);
        }
        if (!Array.isArray(this.chosenQuestions[optionId])) {
          this.chosenQuestions[optionId] = [renderId];
        } else if (this.chosenQuestions[optionId].indexOf(renderId) < 0) {
          this.chosenQuestions[optionId].push(renderId);
        }
      } else {
        // checkbox unchecked
        document.getElementById("o" + optionId + "-" + renderId).checked =
          false;
        if (this.chosenQuestions[optionId].removeValue(renderId)) {
          if (this.chosenQuestions[optionId].length === 0) {
            this.chosenOptions.removeValue(optionId);
            document.getElementById("o" + optionId).checked = false;
          }
        }
      }
    } else {
      optionId = Number(value);
      if (check) {
        // check all values
        // not already chosen
        if (this.chosenOptions.indexOf(optionId) < 0) {
          this.chosenOptions.push(optionId);
        }
        this.chosenQuestions[optionId] = [];
        if (typeof this.options[optionId].question === "object") {
          for (let i = 0; i < this.options[optionId].question.length; i++) {
            this.chosenQuestions[optionId].push(i);
            document.getElementById("o" + optionId + "-" + i).checked = true;
          }
        } else if (Array.isArray(this.questionPatterns)) {
          for (let i = 0; i < this.questionPatterns.length; i++) {
            this.chosenQuestions[optionId].push(i);
            document.getElementById("o" + optionId + "-" + i).checked = true;
          }
        }
      } else {
        // uncheck all values
        if (this.chosenOptions.removeValue(optionId)) {
          if (typeof this.options[optionId].question === "object") {
            for (let i = 0; i < this.options[optionId].question.length; i++) {
              document.getElementById("o" + optionId + "-" + i).checked = false;
            }
            delete this.chosenQuestions[optionId];
          } else if (Array.isArray(this.questionPatterns)) {
            for (let i = 0; i < this.questionPatterns.length; i++) {
              document.getElementById("o" + optionId + "-" + i).checked = false;
            }
            delete this.chosenQuestions[optionId];
          }
        }
      }
    }
    // check or uncheck the allcheckboxes
    let boxes = document.querySelectorAll(
      "#activityOptions input[type=checkbox]",
    );
    let tocheck = true;
    for (const checkbox of boxes) {
      if (
        checkbox.id === "chckallopt" ||
        checkbox.id.indexOf("checkAllOptions") == 0 ||
        checkbox.id.indexOf("param-") == 0
      )
        continue;
      if (!checkbox.checked) {
        tocheck = false;
        break;
      }
    }
    document.getElementById("chckallopt").checked = tocheck;
  }
}

class CartClass extends cart {
  /**
   * Ducplicate this object
   */
  duplicate(carts) {
    if (carts.length < 4) {
      // on affecte des copies des activités à ce nouveau panier.
      let cart = carts[carts.length - 1];
      for (let i = 0; i < this.activities.length; i++) {
        cart.addActivity(
          this.activities[i],
          this.activities[i].nbq,
          carts,
          false,
        );
      }
      cart.ordered = this.ordered;
      cart.progress = this.progress;
      cart.showAnswerTime = this.showAnswerTime;
      cart.randomDraw = this.randomDraw;
      cart.randomCount = this.randomCount;
      // on affiche le panier.
      cart.display(carts);
    }
  }
  /**
   * remove an activity from the list
   * @param {integer} index of the activity
   */
  removeActivity(index) {
    if (this.editedActivityId === index) {
      this.editedActivityId = -1;
    } else if (this.editedActivityId > index) {
      this.editedActivityId--;
    }
    this.activities.splice(index, 1);
    this.display();
  }
  /**
   * Change the order of the activities in conformity to the li order after a move
   * @param {integer} oldIndex old index of the activity
   * @param {integer} newIndex new index of the activity
   */
  exchange(oldIndex, newIndex, carts) {
    let indexes = this.activities.getKeys();
    let tempindexes = indexes[oldIndex];
    let temp = this.activities[oldIndex];
    this.activities.splice(oldIndex, 1);
    indexes.splice(oldIndex, 1);
    this.activities.splice(newIndex, 0, temp);
    indexes.splice(newIndex, 0, tempindexes);
    this.editedActivityId = Number(indexes.indexOf(this.editedActivityId));
    this.display(carts); // refresh order
  }
  /**
   * Recalcule durée totale et nombre de questions du panier et met à jour
   * la ligne des totaux, sans reconstruire la liste des activités.
   */
  majTotaux() {
    this.time = 0;
    this.nbq = 0;
    for (const activity of this.activities) {
      this.time += Number(activity.tempo) * Number(activity.nbq);
      this.nbq += Number(activity.nbq);
    }
    const spans = document.querySelectorAll(
      "#cart" + this.id + " div.totaux span",
    );
    spans[0].innerHTML = utils.sToMin(this.time);
    spans[1].innerHTML = this.nbq;
    const randomInput = document.getElementById(
      "randomcount-cart" + (Number(this.id) + 1),
    );
    if (randomInput !== null) {
      const max = Math.max(1, this.nbq - 1);
      randomInput.max = max;
      if (this.randomCount > max) {
        this.randomCount = max;
        randomInput.value = max;
      }
    }
  }
  /**
   * display the cart in his content area
   */
  display(carts) {
    if (this.sortable) {
      this.sortable.destroy();
      delete this.sortable;
    }
    document.querySelector("#cart" + this.id + " h3").innerText = this.title;
    let dom = document.getElementById("cart" + this.id + "-list");
    dom.innerHTML = "";
    this.time = 0;
    this.nbq = 0;
    let spanOrder = document.querySelector(
      "#cart" + this.id + " div[data-ordered]",
    );
    if (this.ordered) {
      spanOrder.innerHTML = "ordonné";
      spanOrder.dataset["ordered"] = "true";
    } else {
      spanOrder.innerHTML = "mélangé";
      spanOrder.dataset["ordered"] = "false";
    }
    for (let i = 0, l = this.activities.length; i < l; i++) {
      let li = document.createElement("li");
      let activity = this.activities[i];
      li.innerHTML =
        "<div class='cart-content-item'><div class='pointer actID' data-actid='" +
        i +
        "' title=\"Editer l'activité\">" +
        activity.id +
        "</div>" +
        (MM.carts.length > 1
          ? "<i class='sprite sprite-iconfinder_copy movecopybutton pointer' data-actidmovecopy='" +
            i +
            "' title='Déplacer / copier vers un autre panier'></i>"
          : "") +
        "<i class='sprite sprite-removefromcart removefromcartbutton pointer' data-actidtoremove='" +
        i +
        "' title='Enlever du panier'></i><div>" +
        (activity.audioRead == true
          ? activity.title
          : activity.title.replace("📣 ", "")) +
        "</div> <span class='cart-reglage'><input type='number' class='cart-tempo' " +
        "data-tempoact='" +
        i +
        "' min='0' max='120' step='1' value='" +
        activity.tempo +
        "' aria-label=\"Durée d'affichage en secondes\" " +
        'title="Durée d\'affichage par question, en secondes (0 : manuel)"></span>' +
        "<span class='cart-reglage'><input type='number' class='cart-nbq' " +
        "data-nbqact='" +
        i +
        "' min='1' max='20' step='1' value='" +
        activity.nbq +
        "' aria-label='Nombre de questions' title='Nombre de questions'></span>";
      if (this.editedActivityId === i) {
        li.className = "active";
      }
      dom.appendChild(li);
    }
    this.majTotaux();
    document.querySelectorAll(
      "#cart" + this.id + " div.totaux span",
    )[2].innerHTML = this.target;
    this.setProgress(this.progress);
    this.setRandomDraw();
    // détruit le sortable si déjà effectif.
    if (dom.hasChildNodes())
      this.sortable = new Sortable(dom, {
        animation: 150,
        ghostClass: "ghost-movement",
        // les réglages durée / nbq restent saisissables : sans ce filtre, le
        // glisser-déposer capte le clic avant que le champ prenne le focus.
        filter: ".cart-reglage input",
        preventOnFilter: false,
        onEnd: (evt) => {
          if (carts === undefined) {
            this.exchange(evt.oldIndex, evt.newIndex);
          } else {
            carts[this.id].exchange(evt.oldIndex, evt.newIndex, carts);
          }
        },
      });
    // seul point par lequel passent toutes les modifications de panier
    MM.majEtatOnglets();
  }
  /**
   *
   * @param {Object} objImage DOM object of the clicked image
   */
  changeOrder(objImage) {
    if (objImage.dataset["ordered"] === "true") {
      objImage.innerHTML = "mélangé";
      //objImage.src = "img/iconfinder_windy_1054934.png";
      objImage.title = "Affichage mélangé des questions";
      objImage.dataset["ordered"] = "false";
      this.ordered = false;
    } else {
      objImage.innerHTML = "ordonné";
      //objImage.src = "img/iconfinder_stack_1054970.png";
      objImage.title = "Affichage dans l'ordre des activités";
      objImage.dataset["ordered"] = "true";
      this.ordered = true;
    }
  }
  changeProgress(objHTML, type) {
    if (
      (objHTML.dataset["progress"] === "normal" && type === undefined) ||
      type === "thenanswer"
    ) {
      objHTML.dataset["progress"] = "thenanswer";
      objHTML.innerHTML = "";
      const container = document.createElement("div");
      container.className = "numberInputContainer";
      const input = document.createElement("input");
      input.type = "number";
      input.min = 2;
      input.max = 120;
      input.value = String(this.showAnswerTime);
      input.title = "Durée d'affichage\nde la correction\naprès la question";
      input.oninput = (evt) => {
        this.showAnswerTime = evt.target.value;
      };
      input.onclick = (e) => {
        e.stopPropagation();
      };
      container.appendChild(input);
      const unit = document.createElement("span");
      unit.innerText = "s.";
      container.appendChild(unit);
      const closeButton = document.createElement("button");
      closeButton.innerText = "×";
      container.appendChild(closeButton);
      closeButton.onclick = (e) => {
        e.stopPropagation();
        this.changeProgress(objHTML, "withanswer");
      };
      objHTML.appendChild(container);
      this.progress = "thenanswer";
    } else if (
      (objHTML.dataset["progress"] === "thenanswer" && type === undefined) ||
      type === "withanswer"
    ) {
      objHTML.dataset["progress"] = "withanswer";
      objHTML.innerText = "avec";
      objHTML.title = "Le corrigé est affiché\navec la question";
      this.progress = "withanswer";
    } else {
      objHTML.dataset["progress"] = "normal";
      objHTML.innerText = "sans";
      objHTML.title = "Le corrigé n'est pas affiché";
      this.progress = "normal";
    }
  }
  setProgress(value = "normal") {
    const answerChornoContainer = document.getElementById(
      "progress-cart" + (Number(this.id) + 1),
    );
    if (answerChornoContainer === null) {
      return;
    }
    if (value === "") {
      this.changeProgress(answerChornoContainer, "normal");
    } else {
      if (value === "normal") {
        this.changeProgress(answerChornoContainer, "normal");
      } else if (value === "thenanswer") {
        this.changeProgress(answerChornoContainer, "thenanswer");
      } else if (value === "withanswer") {
        this.changeProgress(answerChornoContainer, "withanswer");
      }
    }
  }
  setShowAnswerTime(value) {
    const answerChronoDisplayValue = document.getElementById(
      "answer-chrono-display-value",
    );
    document.getElementById("answer-chrono-range").value = String(value);
    this.showAnswerTime = Number(value);
    answerChronoDisplayValue.innerText = String(value) + " s.";
  }
  /**
   *
   * @param {Object} objHTML DOM object of the clicked element
   */
  changeRandomDraw(objHTML) {
    this.randomDraw = objHTML.dataset["randomdraw"] !== "some";
    if (this.randomDraw && (!this.randomCount || this.randomCount < 1)) {
      this.randomCount = Math.min(
        Math.max(1, this.activities.length),
        Math.max(1, this.nbq - 1),
      );
    }
    this.setRandomDraw();
  }
  setRandomCount(value) {
    let nombre = Math.round(Number(value));
    if (Number.isNaN(nombre)) nombre = 1;
    nombre = Math.min(Math.max(1, nombre), Math.max(1, this.nbq - 1));
    this.randomCount = nombre;
    const input = document.getElementById(
      "randomcount-cart" + (Number(this.id) + 1),
    );
    if (input !== null) input.value = nombre;
  }
  /**
   * Synchronise l'affichage du bouton tirage aléatoire avec l'état courant
   */
  setRandomDraw() {
    const N = Number(this.id) + 1;
    const objHTML = document.getElementById("randomdraw-cart" + N);
    if (objHTML === null) return;
    objHTML.innerHTML = "";
    if (this.randomDraw) {
      objHTML.dataset["randomdraw"] = "some";
      objHTML.title =
        "Tirage aléatoire de questions (cliquer pour revenir à toutes les questions)";
      const container = document.createElement("div");
      container.className = "numberInputContainer";
      const input = document.createElement("input");
      input.type = "number";
      input.id = "randomcount-cart" + N;
      input.min = 1;
      input.max = Math.max(1, this.nbq - 1);
      input.value = String(this.randomCount || 1);
      input.title = "Nombre de questions à tirer au sort";
      input.oninput = (evt) => {
        this.setRandomCount(evt.target.value);
      };
      input.onclick = (e) => {
        e.stopPropagation();
      };
      container.appendChild(input);
      objHTML.appendChild(container);
    } else {
      objHTML.dataset["randomdraw"] = "all";
      objHTML.title =
        "Toutes les questions du panier (cliquer pour tirer un nombre au hasard)";
      objHTML.innerText = "toutes";
    }
  }
}
export { MM as default };
const toast = document.getElementById("toast");
const MM = {
  version: 7, // à mettre à jour à chaque upload pour régler les pb de cache
  content: undefined, // liste des exercices classés niveau/theme/chapitre chargé au démarrage
  introType: "321", // type of the slide's intro values : "example" "321" "nothing"
  endType: "nothing", // type of end slide's values : "correction", "nothing", "list"
  touched: false, // marker to know if the screen has been touched => online answers with virtual keyboard
  selectedCart: 0,
  seed: "", // String to initialize the randomization
  editedActivity: undefined, // object activity
  slidersOrientation: "", // if vertical => vertical presentation for 2 sliders
  onlineState: "no", // true if user answers on computer (Cf start and online functions)
  carts: [], // max 4 carts
  steps: [],
  timers: [],
  fontType: "serif",
  figs: {}, //
  userAnswers: [[], [], [], []],
  slidersNumber: 1,
  faceToFace: "n",
  colorSelectors: [],
  colors: [], // couleurs de fond des diaporamas
  memory: [], // memoire des figures
  zooms: {}, // zooms créés pour chaque élément d'affichage,
  mf: {}, // MathFields pour réponses en ligne
  text2speach: [],
  keyboards: {}, // claviers virtuels pour réponses en ligne
  ended: true,
  embededIn: false, // variable qui contient l'url du site dans lequel MM est affiché (vérifier url)
  /**
   * Crée un grain pour la génération aléatoire des données
   * @param {String} value
   */
  setSeed(value) {
    //    console.log(value);
    if (
      value !== undefined &&
      value !== "sample" &&
      value !== "checkSwitched" &&
      value !== false
    ) {
      MM.seed = value;
      document.getElementById("aleaKey").value = value;
      document.getElementById("aleaKeyenonces").value = value;
      document.getElementById("aleaKeycorriges").value = value;
    } else if (value === "sample") {
      MM.seed = utils.seedGenerator();
    } else if (document.getElementById("aleaInURL").checked) {
      if (document.getElementById("aleaKey").value === "") {
        MM.seed = utils.seedGenerator();
        document.getElementById("aleaKey").value = MM.seed;
        document.getElementById("aleaKeyenonces").value = MM.seed;
        document.getElementById("aleaKeycorriges").value = MM.seed;
      } else {
        MM.seed = document.getElementById("aleaKey").value;
      }
    } else if (value === "checkSwitched") {
      // on ne fait rien
      return false;
    } else {
      MM.seed = utils.seedGenerator();
      document.getElementById("aleaKey").value = MM.seed;
      document.getElementById("aleaKeyenonces").value = MM.seed;
      document.getElementById("aleaKeycorriges").value = MM.seed;
    }
    MM.initializeAlea(MM.seed);
  },
  setFontType(value) {
    if (value) {
      if (!["serif", "sansSerif"].includes(value)) return;
      document.getElementById("fontType").checked =
        value === "serif" ? false : true;
      MM.fontType = value;
    } else {
      if (document.getElementById("fontType").checked)
        MM.fontType = "sansSerif";
      else MM.fontType = "serif";
      utils.mathReRender(MM.fontType);
    }
  },
  getSeed() {
    if (document.getElementById("aleaInURL").checked) {
      if (document.getElementById("aleaKey").value === "") {
        MM.seed = utils.seedGenerator();
        document.getElementById("aleaKey").value = MM.seed;
      } else {
        MM.seed = document.getElementById("aleaKey").value;
      }
    }
    return MM.seed;
  },
  /**
   *
   * @params {string} seed valeur d'initialisation des données aléatoires
   * return nothing
   */
  initializeAlea: function (seed) {
    if (seed) {
      if (utils.alea) delete utils.alea;
      utils.alea = new seedrandom(seed);
    } else {
      if (utils.alea) delete utils.alea;
      utils.alea = new seedrandom(MM.seed);
    }
  },
  /**
   *
   * @param {DOM obj or string} element
   * Show the selected Tab
   */
  showTab: function (element) {
    MM.resetAllTabs();
    let tab, el;
    if (element === "none") return;
    if (typeof element === "string") {
      tab = element;
      el = document.querySelector("#header-menu [numero='#" + element + "']");
    } else {
      el = element;
      // un élément sans attribut numero (lien de pied de page…) n'ouvre pas d'onglet
      if (element.getAttribute("numero") === null) return;
      tab = element.getAttribute("numero").substr(1);
    }
    if (el !== null) {
      utils.addClass(el, "is-active");
      if (el.getAttribute("role") === "tab")
        el.setAttribute("aria-selected", "true");
    }
    document.getElementById(tab).style.display = "";
    MM.majEtatOnglets();
  },
  /**
   * Vrai dès qu'il y a quelque chose à montrer dans Énoncé / Corrigé :
   * un panier rempli, ou une activité ouverte depuis Rechercher.
   */
  aQuelqueChoseAAfficher() {
    return (
      MM.carts.some((panier) => panier.activities.length > 0) ||
      MM.editedActivity !== undefined
    );
  },
  /**
   * Paniers à rendre dans les onglets Énoncé / Corrigé.
   * Cliquer une activité dans Rechercher ne doit pas la mettre au panier :
   * tant que les paniers sont vides, on la prévisualise dans un panier
   * temporaire, hors MM.carts, reconstruit à chaque affichage pour refléter
   * les options en cours. La mise au panier reste un geste explicite
   * (« Au panier », ou l'export qui complète un panier vide).
   */
  paniersAAfficher() {
    if (MM.carts.some((panier) => panier.activities.length > 0))
      return MM.carts;
    if (MM.editedActivity === undefined || MM.carts.length === 0)
      return MM.carts;
    const apercu = new CartClass(0);
    apercu.title = MM.carts[0].title;
    apercu.ordered = MM.carts[0].ordered;
    apercu.target = MM.carts[0].target;
    apercu.addActivity(MM.editedActivity, false, undefined, false);
    return [apercu];
  },
  /**
   * Grise les onglets qui n'ont rien à montrer tant qu'aucun panier n'est
   * rempli. Ils restent cliquables : le panneau explique alors quoi faire,
   * ce qui vaut mieux qu'un onglet muet ou inaccessible.
   */
  majEtatOnglets() {
    const vide = !MM.aQuelqueChoseAAfficher();
    document
      .querySelectorAll("#header-menu .tabs-menu-link[numero]")
      .forEach((btn) => {
        const numero = btn.getAttribute("numero");
        if (
          numero !== "#tab-parameters" &&
          numero !== "#tab-enonce" &&
          numero !== "#tab-corrige"
        )
          return;
        btn.classList.toggle("onglet-en-attente", vide);
        btn.setAttribute("aria-disabled", vide);
      });
    if (!vide) return;
    // Le message est reconstruit et non masqué : les deux conteneurs sont
    // réécrits à chaque génération, un paragraphe statique n'y survivrait pas.
    [
      ["enonce-content", "les énoncés"],
      ["corrige-content", "les corrigés"],
    ].forEach(([id, quoi]) => {
      const zone = document.getElementById(id);
      if (zone === null || zone.querySelector(".onglet-vide") !== null) return;
      const message = utils.create("p", {
        className: "onglet-vide",
        innerHTML:
          "Ici s’affichent " + quoi + ", une fois des activités au panier. ",
      });
      const bouton = utils.create("button", {
        type: "button",
        innerHTML: "Chercher une activité",
      });
      bouton.onclick = () => {
        MM.showTab("tab-chercher");
        document.getElementById("searchinput").focus();
      };
      message.appendChild(bouton);
      zone.innerHTML = "";
      zone.appendChild(message);
    });
  },
  showParameters: function (id) {
    let ids = [
      "paramsdiapo",
      "paramsdocLOOO",
      "paramsexos",
      "paramsinterro",
      "paramsceinture",
      "paramsflashcards",
      "paramsfichememo",
      "paramswhogots",
      "paramsdominos",
      "paramspuzzle",
      "paramscourse",
      "paramsduel",
      "paramsassocs",
      "paramswall",
    ]; //
    if (ids.indexOf(id) < 0) return false;
    // hide all
    for (let i = 0, len = ids.length; i < len; i++) {
      document.getElementById(ids[i]).className = "hidden";
    }
    document.getElementById(id).className = "";
    MM.syncParamTypeUI(id);
  },
  // Description des 14 types d'usage : nom affiché, famille de tuiles et
  // boutons d'origine auxquels la barre d'actions délègue.
  typesUsage: {
    paramsdiapo: {
      nom: "Diaporama",
      libelle: "Lancer",
      principal: "btnstart",
      adresse: "btnadresse",
      historique: "btncopytohistoric",
    },
    paramsflashcards: {
      nom: "Cartes flash",
      libelle: "Lancer",
      principal: "btngenerateFC",
      adresse: "btn-flash-adresse",
      historique: "btn-flash-copytohistoric",
    },
    paramsfichememo: {
      nom: "Fiche mémorisation",
      libelle: "Lancer",
      principal: "btngenerateFM",
      adresse: "btn-memo-adresse",
      historique: "btn-memo-copytohistoric",
    },
    paramsexos: {
      nom: "Feuille d’exercices",
      libelle: "Générer",
      principal: "btngeneratesheet",
      adresse: "btn-ex-adresse",
      historique: "btn-ex-copytohistoric",
    },
    paramsinterro: {
      nom: "Feuille d’interro",
      libelle: "Générer",
      principal: "btngenerateexams",
      adresse: "btn-exam-adresse",
      historique: "btn-exam-copytohistoric",
    },
    paramsceinture: {
      nom: "Ceintures de CM",
      libelle: "Générer",
      principal: "btngenerateceinture",
      adresse: "btn-ceinture-adresse",
      historique: "btn-ceinture-copytohistoric",
    },
    paramscourse: {
      nom: "Course aux nombres",
      libelle: "Générer",
      principal: "btngenerateCAN",
      adresse: "btn-can-adresse",
      historique: "btn-can-copytohistoric",
    },
    paramsdocLOOO: {
      nom: "Document LibreOffice",
      libelle: "Générer",
      principal: "btngeneratedoc",
      adresse: "btn-doc-adresse",
      historique: "btn-doc-copytohistoric",
    },
    paramswhogots: {
      nom: "J’ai/qui a ?",
      libelle: "Générer",
      principal: "btngenerateWG",
      adresse: "btn-wg-adresse",
      historique: "btn-wg-copytohistoric",
    },
    paramsdominos: {
      nom: "Dominos",
      libelle: "Générer",
      principal: "btngenerateDominos",
      adresse: "btn-dominos-adresse",
      historique: "btn-dominos-copytohistoric",
    },
    paramspuzzle: {
      nom: "Puzzles",
      libelle: "Générer",
      principal: "btngeneratePuzzle",
      adresse: "btn-puzzle-adresse",
      historique: "btn-puzzle-copytohistoric",
    },
    paramswall: {
      nom: "Panneau 💻",
      libelle: "Lancer",
      principal: "btngenerateWall",
      adresse: "btn-wall-adresse",
      historique: "btn-wall-copytohistoric",
    },
    paramsassocs: {
      nom: "Associations 💻",
      libelle: "Lancer",
      principal: "btngenerateAssoc",
      adresse: "btn-assoc-adresse",
      historique: "btn-assoc-copytohistoric",
    },
    paramsduel: {
      nom: "Duel 💻",
      libelle: "Lancer",
      principal: "btn-duel-start",
      adresse: "btn-duel-adresse",
      historique: "btn-duel-copytohistoric",
    },
  },
  // Aligne les tuiles, le select d'origine et la barre d'actions sur le type
  // affiché. Appelée par showParameters, seul point de passage commun au
  // choix manuel et à la relecture d'une URL (checkURL).
  syncParamTypeUI: function (id) {
    let tuiles = document.getElementById("param-type-choix");
    if (!tuiles) return false; // autre page que index.html
    let select = document.getElementById("chooseParamType");
    // affectations par propriété : aucun événement change déclenché
    if (select && select.value !== id) utils.selectOption("chooseParamType", id);
    let tuile = document.getElementById("tuile-" + id);
    if (tuile) tuile.checked = true;
    let infos = MM.typesUsage[id];
    if (!infos) return false;
    document.getElementById("barre-actions-type").textContent = infos.nom;
    document.getElementById("barre-action-principale").textContent =
      infos.libelle;
    ["adresse", "historique"].forEach((role) => {
      let bouton = document.getElementById("barre-action-" + role);
      if (infos[role]) {
        bouton.disabled = false;
        utils.removeClass(bouton, "hidden");
      } else {
        bouton.disabled = true;
        utils.addClass(bouton, "hidden");
      }
    });
  },
  // Masque les trios de boutons d'origine, désormais rendus par la barre.
  // À n'appeler qu'une seule fois, depuis window.onload.
  activerBarreActions: function () {
    if (!document.getElementById("barre-actions")) return false;
    document
      .querySelectorAll("#colparameters [data-actions-legacy]")
      .forEach((section) => utils.addClass(section, "hidden"));
    MM.syncParamTypeUI(document.getElementById("chooseParamType").value);
  },
  // Délègue au bouton d'origine du type courant : zéro logique dupliquée.
  // Le clic programmatique fonctionne même si le bouton est masqué.
  declencherActionType: function (role) {
    let infos = MM.typesUsage[document.getElementById("chooseParamType").value];
    if (!infos || !infos[role]) return false;
    let cible = document.getElementById(infos[role]);
    if (!cible) return false;
    cible.click();
    if (role === "historique") {
      // copyURLtoHistory écrit son retour dans le bouton d'origine, caché.
      let bouton = document.getElementById("barre-action-historique");
      clearTimeout(MM.timerRetourHistorique);
      bouton.textContent = "📁 Copié ✅";
      MM.timerRetourHistorique = setTimeout(() => {
        bouton.textContent = "→ Historique";
      }, 3300);
    }
    if (role === "adresse") {
      let modale = document.getElementById("urlCopy");
      if (modale) modale.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  },
  CLE_PARAMS: "mm-parametres",
  // La graine doit rester tirée au sort, #acturl n'est plus utilisé et le
  // select d'origine est restauré depuis « type ».
  champsNonMemorises: ["aleaKey", "acturl", "chooseParamType"],
  // Groupes de radios recalculés depuis les paniers ou l'activité éditée :
  // les mémoriser créerait des incohérences au chargement.
  groupesNonMemorises: [
    "paramtype",
    "Enonces",
    "direction",
    "facetoface",
    "audioRadio",
  ],
  /**
   * Présentation et numérotation ne concernent que Writer : les deux choix
   * disparaissent en Impress. Quand le document ne porte que les questions ou
   * que les réponses, « Réponses sur feuille séparée » n'a plus de sens : il
   * ne reste que la liste et le tableau.
   */
  majPresentationDoc: function () {
    const bloc = document.getElementById("docpresentation");
    if (!bloc) return;
    const numerotation = document.getElementById("docnumerotation");
    const impress = utils.getRadioChecked("radiodocformat") === "impress";
    const afficher = (element, visible) => {
      if (!element) return;
      if (visible) utils.removeClass(element, "hidden");
      else utils.addClass(element, "hidden");
    };
    afficher(bloc, !impress);
    afficher(numerotation, !impress);
    const lesDeux = utils.getRadioChecked("radiodoc") === "both";
    afficher(document.getElementById("docpres-page"), lesDeux);
    document.querySelector('label[for="radiodocSuite"]').textContent = lesDeux
      ? "Questions puis réponses"
      : "Liste";
    document.querySelector('label[for="radiodocTableau"]').textContent = lesDeux
      ? "Questions | réponses"
      : "Dans un tableau";
    // le choix masqué ne doit pas rester actif
    if (!lesDeux && utils.getRadioChecked("radiodocpres") === "page") {
      utils.checkRadio("radiodocpres", "suite");
    }
  },
  /**
   * Mémorise les réglages de tous les panneaux de #colparameters.
   * Appelée en délégation sur l'événement change, d'où le debounce.
   */
  enregistrerParams: function () {
    const colonne = document.getElementById("colparameters");
    if (!colonne || !window.localStorage) return false;
    clearTimeout(MM.timerEnregistreParams);
    MM.timerEnregistreParams = setTimeout(() => {
      let donnees = {
        v: 1,
        date: Date.now(),
        type: document.getElementById("chooseParamType").value,
        champs: {},
        groupes: {},
      };
      colonne.querySelectorAll("input, select").forEach((el) => {
        if (el.type === "radio") {
          if (el.name && MM.groupesNonMemorises.indexOf(el.name) < 0)
            donnees.groupes[el.name] = utils.getRadioChecked(el.name);
          return;
        }
        if (!el.id || MM.champsNonMemorises.indexOf(el.id) > -1) return;
        donnees.champs[el.id] = el.type === "checkbox" ? el.checked : el.value;
      });
      try {
        localStorage.setItem(MM.CLE_PARAMS, JSON.stringify(donnees));
      } catch (e) {
        // quota dépassé ou stockage refusé : on abandonne silencieusement
      }
    }, 300);
  },
  /**
   * Restaure les réglages mémorisés. Ne doit être appelée que si l'URL ne
   * porte aucun paramètre : MM.checkURL est alors seul maître de l'onglet.
   */
  restaurerParams: function () {
    if (!document.getElementById("colparameters") || !window.localStorage)
      return false;
    let donnees;
    try {
      donnees = JSON.parse(localStorage.getItem(MM.CLE_PARAMS));
    } catch (e) {
      return false;
    }
    if (!donnees || donnees.v !== 1) return false;
    const champs = donnees.champs || {};
    Object.keys(donnees.groupes || {}).forEach((nom) => {
      utils.checkRadio(nom, donnees.groupes[nom]);
    });
    Object.keys(champs).forEach((id) => {
      let el = document.getElementById(id);
      if (!el) return;
      if (el.type === "checkbox") el.checked = champs[id];
      else el.value = champs[id];
    });
    // Rafraîchissements explicites : plusieurs contrôles sont pilotés par
    // onclick, un événement synthétique rebasculerait leur état.
    const recopie = (source, cible) => {
      let src = document.getElementById(source);
      if (src) document.getElementById(cible).innerHTML = src.value;
    };
    recopie("exTxtSizeValue", "exTxtSize");
    recopie("intTxtSizeValue", "intTxtSize");
    recopie("ceintrowsval", "ceintrows");
    recopie("ceintqtyvalue", "ceintqty");
    recopie("canqtyvalue", "canqty");
    recopie("cardsNbValue", "cardsNb");
    recopie("dominosNbValue", "dominosNb");
    recopie("ceintcolsval", "ceintcols");
    // createCeintureTitres ajoute ou retire une colonne par appel.
    // Le retrait s'appuie sur un <br> que le 4e champ n'a pas : on laisse
    // passer l'erreur plutôt que d'interrompre le reste de la restauration.
    let colonnes = Number(document.getElementById("ceintcolsval").value);
    let existantes = document.querySelectorAll("#ceintcolumnTitle input").length;
    try {
      while (existantes < colonnes) utils.createCeintureTitres(++existantes);
      while (existantes > colonnes) utils.createCeintureTitres(--existantes);
    } catch (e) {
      // colonnes partiellement reconstruites, sans conséquence sur la suite
    }
    // les titres de colonnes n'existent qu'une fois la reconstruction faite
    Object.keys(champs).forEach((id) => {
      if (id.indexOf("ceinttitlecol") !== 0) return;
      let el = document.getElementById(id);
      if (el) el.value = champs[id];
    });
    ["WGDoublons", "dominosDoublons"].forEach((id) => {
      let el = document.getElementById(id);
      if (el)
        document.getElementById(id + "Text").innerHTML = el.checked
          ? "Oui"
          : "Non";
    });
    MM.setAssocsChrono();
    if (champs.assocTime !== undefined)
      document.getElementById("assocTime").value = champs.assocTime;
    MM.setFontType();
    MM.majPresentationDoc();
    MM.setIntroType(
      document.getElementById("radiobeforeslider3").checked ? "nothing" : "",
    );
    if (donnees.groupes) {
      if (donnees.groupes.online) MM.setOnlineState(donnees.groupes.online);
      if (donnees.groupes.endOfSlideRadio)
        MM.setEndType(donnees.groupes.endOfSlideRadio);
    }
    if (document.getElementById("aleaInURL").checked)
      MM.setSeed("checkSwitched");
    // en dernier : panneau, select, tuile et barre d'actions
    MM.showParameters(donnees.type);
  },
  resetAllTabs: function () {
    // fermeture des espaces d'annotation.
    MM.annotateThisThing(false);
    let tabsButtons = document.querySelectorAll("#header-menu .tabs-menu-link");
    let contents = document.querySelectorAll(".tabs-content-item");
    document.getElementById("tab-accueil").display = "none";
    contents.forEach((element) => {
      element.style.display = "none";
    });
    utils.removeClass(document.getElementById("btnaccueil"), "is-active");
    tabsButtons.forEach((element) => {
      utils.removeClass(element, "is-active");
      if (element.getAttribute("role") === "tab")
        element.setAttribute("aria-selected", "false");
    });
  },
  closeMessage(id) {
    let div = document.getElementById(id);
    if (div !== null) div.parentNode.removeChild(div);
    document.body.removeEventListener("click", (evt) => {
      if (evt.target.id === "btn-messagefin-close") {
        MM.closeMessage("messagefin");
        MM.showTab("tab-corrige");
      }
    });
  },
  setEndType(value) {
    this.endType = value;
  },
  setAudio(value) {
    if (this.slidersNumber > 1) {
      utils.checkRadio("audioRadio", "0");
    } else {
      this.editedActivity.audioRead = value == 1 ? true : false;
      utils.checkRadio("audioRadio", value);
    }
  },
  setAudioRepetitions(value) {
    value = Number(value);
    this.editedActivity.audioRepeat = value;
    document.getElementById("audiorepeat").value = value;
  },
  setIntroType(value) {
    if (value === "nothing") {
      this.introType = value;
      document.getElementById("radiobeforeslider1").checked = false;
      document.getElementById("radiobeforeslider2").checked = false;
    } else {
      this.introType = [];
      document.getElementById("radiobeforeslider3").checked = false;
      if (document.getElementById("radiobeforeslider1").checked) {
        this.introType.push("example");
      }
      if (document.getElementById("radiobeforeslider2").checked) {
        this.introType.push("321");
      }
      this.introType = this.introType.join("-");
      // cas où on a décheck
      if (this.introType === "") {
        document.getElementById("radiobeforeslider3").checked = true;
        this.introType = "nothing";
      }
    }
  },
  setOnlineState(value) {
    this.onlineState = value;
    // Mise à jour du champ
    document.querySelector(
      "input[name='online'][value='" + value + "']",
    ).checked = true;
  },
  getOnlineState() {
    this.onlineState = utils.getRadioChecked("online");
  },
  editActivity: function (index) {
    index = Number(index);
    MM.editedActivity = new Activity(
      MM.carts[MM.selectedCart].activities[index],
    );
    // on remet l'activitée "augmentée" dans le panier pour que les modifs soient prises en compte.
    MM.carts[MM.selectedCart].activities[index] = MM.editedActivity;
    MM.setTempo(MM.editedActivity.tempo);
    MM.setNbq(MM.editedActivity.nbq);
    MM.setAudio(MM.editedActivity.audioRead);
    MM.setAudioRepetitions(MM.editedActivity.audioRepeat);
    MM.carts[MM.selectedCart].editedActivityId = index;
    MM.carts[MM.selectedCart].display(MM.carts);
    MM.editedActivity.display("sample", MM);
    document.getElementById("unlinkCart").className = "";
    document.getElementById("addToCart").className = "hidden";
    document.getElementById("removeFromCart").className = "";
  },
  uneditActivity: function () {
    document.getElementById("addToCart").className = "";
    document.getElementById("removeFromCart").className = "hidden";
    document.getElementById("unlinkCart").className = "hidden";
  },
  unlinkActivity: function () {
    this.uneditActivity();
    MM.editedActivity = new Activity(utils.clone(MM.editedActivity));
    MM.editedActivity.display("sample", MM);
    MM.carts[MM.selectedCart].editedActivityId = -1;
    MM.carts[MM.selectedCart].display(MM.carts);
  },
  setTempo: function (value) {
    document.getElementById("tempo-slider").value = value;
    document.getElementById("tempo-value").innerHTML = value + " s.";
  },
  setNbq: function (value) {
    document.getElementById("nbq-slider").value = value;
    document.getElementById("nbq-value").innerHTML = value;
  },
  changeTempoValue: function (value) {
    if (Number(value) < 2)
      document.getElementById("tempo-value").innerHTML = "manuel";
    else document.getElementById("tempo-value").innerHTML = value + " s.";
    if (MM.editedActivity) MM.editedActivity.Tempo = value;
    if (MM.carts[MM.selectedCart].editedActivityId > -1) {
      const champ = document.querySelector(
        "#cart" + MM.selectedCart + "-list li.active .cart-tempo",
      );
      if (champ !== null) champ.value = value;
    }
  },
  setAssocsChrono() {
    const assocsInputChrono = document.getElementById("assocTime");
    if (document.getElementById("assocsChronoYes").checked) {
      assocsInputChrono.disabled = false;
      assocsInputChrono.value = 30;
    } else {
      assocsInputChrono.disabled = true;
      assocsInputChrono.value = 0;
    }
  },
  changeNbqValue: function (value) {
    document.getElementById("nbq-value").innerHTML = value;
    if (MM.editedActivity) {
      MM.editedActivity.nombreQuestions = value;
    }
    if (MM.carts[MM.selectedCart].editedActivityId > -1) {
      const champ = document.querySelector(
        "#cart" + MM.selectedCart + "-list li.active .cart-nbq",
      );
      if (champ !== null) champ.value = value;
    }
  },
  /**
   * Règle la durée ou le nombre de questions d'une activité directement
   * depuis sa ligne dans le panier, sans passer par l'édition de l'activité.
   * La liste n'est pas reconstruite : seuls les totaux sont recalculés, pour
   * que le champ saisi garde le focus.
   * @param {number} cartId indice du panier
   * @param {HTMLInputElement} champDom champ de saisie de la ligne
   * @param {"tempo"|"nbq"} champ réglage concerné
   */
  regleActivite(cartId, champDom, champ) {
    const panier = MM.carts[cartId];
    if (panier === undefined) return;
    const index = Number(
      champ === "tempo" ? champDom.dataset.tempoact : champDom.dataset.nbqact,
    );
    const activite = panier.activities[index];
    if (activite === undefined) return;
    let nombre = Math.round(Number(champDom.value));
    if (Number.isNaN(nombre)) nombre = champ === "tempo" ? 0 : 1;
    if (champ === "tempo") {
      nombre = Math.min(120, Math.max(0, nombre));
      // même seuil que le curseur : en dessous de 2 s, l'avancée est manuelle
      if (nombre < 2) nombre = 0;
      activite.tempo = nombre;
      if (panier.editedActivityId === index) MM.setTempo(nombre);
    } else {
      nombre = Math.min(20, Math.max(1, nombre));
      activite.nbq = nombre;
      if (panier.editedActivityId === index) MM.setNbq(nombre);
    }
    champDom.value = nombre;
    panier.majTotaux();
    // le nombre de questions change les énoncés, pas la durée d'affichage
    if (champ === "nbq") MM.refreshQuestionsAndAnswers();
  },
  checkValues: function () {
    MM.changeTempoValue(document.getElementById("tempo-slider").value);
    MM.changeNbqValue(document.getElementById("nbq-slider").value);
    MM.endType = utils.getRadioChecked("endOfSlideRadio");
    MM.setIntroType();
  },
  resetCarts: function () {
    if (MM.carts.length) {
      for (const cart of MM.carts) {
        if (cart.sortable) {
          cart.sortable.destroy();
          delete cart.sortable;
        }
      }
    }
    let Cart = new CartClass(0);
    MM.carts = [Cart];
    MM.setMinimalDisposition(0);
    MM.steps = [];
    MM.timers = [];
    MM.figs = {};
    MM.resetInterface();
  },
  resetInterface() {
    document.getElementById("divcarts").className = "hidden";
    document.getElementById("phantom").className = "";
    document.getElementById("divparams").className = "col-2 row-3";
  },
  showCartInterface() {
    document.getElementById("divcarts").className = "row-4";
    document.getElementById("phantom").className = "hidden";
    document.getElementById("divparams").className = "row-3";
  },
  addCart: function () {
    this.uneditActivity();
    let cartsNb = MM.carts.length + 1;
    if (cartsNb > 4) return false;
    MM.carts[cartsNb - 1] = new CartClass(cartsNb - 1);
    MM.setMinimalDisposition(cartsNb - 1);
    // add cart button
    let button = utils.create("button");
    button.value = cartsNb;
    button.className = "tabs-menu-link";
    button.innerHTML = '<i class="sprite sprite-cart' + cartsNb + '"></i>';
    button.id = "button-cart" + cartsNb;
    let addcart = document.getElementById("addcart");
    let cartsMenu = document.getElementById("cartsMenu");
    let lastButton = cartsMenu.removeChild(addcart);
    cartsMenu.appendChild(button).click();
    // hide + button if 4 carts
    if (cartsNb < 4) {
      cartsMenu.appendChild(lastButton);
    }
    // les listes déjà affichées ont été construites avant l'existence de ce
    // panier : le bouton déplacer/copier (qui n'apparaît qu'à partir de 2
    // paniers) leur manque tant qu'on ne les régénère pas.
    if (cartsNb === 2) MM.carts[0].display(MM.carts);
  },
  /**
   * Sérialise les paniers courants en objets simples, pour l'historique.
   * Remplace getCartsContent, qui fabriquait directement un <div> de <ul> :
   * l'historique stocke désormais des données, pas du HTML.
   */
  paniersVersDonnees: function () {
    return MM.carts.map((panier) => ({
      titre: panier.title,
      activites: panier.activities.map((activite) => ({
        id: activite.id,
        titre: activite.title,
        nbq: Number(activite.nbq),
      })),
    }));
  },
  /**
   * recrée les boutons de sélection de panier en fonction des paniers existants.
   *
   */
  restoreCartsInterface: function () {
    let cartsMenu = document.getElementById("cartsMenu");
    cartsMenu.innerHTML = `<button class="tabs-menu-link is-active" value="1" id="button-cart1"><i class="sprite sprite-cart1"></i></button>
        <button id="addcart" title="Ajouter un panier"><i class="sprite sprite-cartadd"></i></button>`;
    for (let i = 1; i < this.carts.length; i++) {
      let btnnb = i + 1;
      let button = utils.create("button", {
        value: btnnb,
        className: "tabs-menu-link",
        innerHTML: '<i class="sprite sprite-cart' + btnnb + '"></i>',
        id: "button-cart" + btnnb,
      });
      let addcart = document.getElementById("addcart");
      let lastButton = cartsMenu.removeChild(addcart);
      cartsMenu.appendChild(button);
      if (btnnb < 4) {
        cartsMenu.appendChild(lastButton);
      }
    }
  },
  removeCart: function (index, forced = false) {
    if (!forced)
      if (
        !window.confirm(
          "Vous êtes sur le point de supprimer ce panier.\nConfirmez-vous ?",
        )
      ) {
        return false;
      }
    if (MM.carts[index - 1].sortable) {
      MM.carts[index - 1].sortable.destroy();
      delete MM.carts[index - 1].sortable;
    }
    // remove last cart button
    let buttonCartToremove = document.getElementById(
      "button-cart" + MM.carts.length,
    );
    let cartsMenu = document.getElementById("cartsMenu");
    cartsMenu.removeChild(buttonCartToremove);
    // recreate buttonAddCart if necessary
    if (!document.getElementById("addcart")) {
      let buttonAddCart = document.createElement("button");
      buttonAddCart.id = "addcart";
      buttonAddCart.innerHTML = '<i class="sprite sprite-cartadd"></i>';
      buttonAddCart.onclick = function () {
        MM.addCart();
      };
      cartsMenu.appendChild(buttonAddCart);
    }
    // delete cart
    MM.carts.splice(index - 1, 1);
    MM.setMinimalDisposition(MM.carts.length - 1);
    // show Cart1
    MM.showCart(1);
    // symétrique de addCart() : redescendu à 1 seul panier, le bouton
    // déplacer/copier doit disparaître de la liste restante.
    if (MM.carts.length === 1) MM.carts[0].display(MM.carts);
    MM.populateQuestionsAndAnswers();
  },
  showCart(index) {
    this.uneditActivity();
    index = Number(index);
    MM.selectedCart = index - 1;
    for (let i = 1, nb = MM.carts.length, btn; i <= 4; i++) {
      if (i <= nb) btn = document.getElementById("button-cart" + i);
      let div = document.getElementById("cart" + (i - 1));
      if (i !== index) {
        div.className = "hidden";
        if (i <= nb) utils.removeClass(btn, "is-active");
      } else {
        div.className = "cartcontent";
        if (i <= nb) utils.addClass(btn, "is-active");
      }
    }
    // show edited activity
    if (MM.carts[MM.selectedCart].editedActivityId > -1) {
      MM.carts[MM.selectedCart].activities[
        MM.carts[MM.selectedCart].editedActivityId
      ].display("sample", MM);
      this.editActivity(MM.carts[MM.selectedCart].editedActivityId);
    }
  },
  emptyCart(index) {
    if (
      window.confirm(
        "Vous êtes sur le point de vider ce panier.\nConfirmez-vous ?",
      )
    ) {
      MM.carts[index - 1].activities = [];
      MM.carts[index - 1].editedActivityId = -1;
      MM.carts[index - 1].display(MM.carts);
      MM.populateQuestionsAndAnswers();
    } else return false;
  },
  addToCart() {
    if (MM.selectedCart === undefined || MM.editedActivity === undefined)
      return;
    MM.carts[MM.selectedCart].addActivity(MM.editedActivity, false, MM.carts);
    // on affiche les panier
    MM.showCartInterface();
    MM.populateQuestionsAndAnswers();
  },
  removeFromCart(id = false) {
    let cart = MM.carts[MM.selectedCart];
    let idact = id ? id : cart.editedActivityId;
    if (!id || Number(id) == Number(cart.editedActivityId)) {
      cart.editedActivityId = -1;
      document.getElementById("addToCart").className = "";
      document.getElementById("removeFromCart").className = "hidden";
      document.getElementById("unlinkCart").className = "hidden";
    }
    cart.removeActivity(idact);
    // on affiche le panier s'il reste une activité dedans.
    MM.populateQuestionsAndAnswers();
  },
  /**
   * Petite fenêtre listant, pour chaque autre panier existant, un choix
   * Déplacer / Copier. N'a de sens qu'à partir de 2 paniers (l'icône n'est
   * de toute façon pas construite en dessous, voir display() de CartClass).
   */
  ouvrirMenuDeplacerCopier(actIndex, bouton) {
    MM.fermerMenuDeplacerCopier();
    const sourceIndex = MM.selectedCart;
    const autres = MM.carts
      .map((_c, i) => i)
      .filter((i) => i !== sourceIndex);
    if (autres.length === 0) return;
    const menu = utils.create("div", { className: "menu-deplacer-copier" });
    for (const i of autres) {
      const titre = MM.carts[i].title || "Panier " + (i + 1);
      menu.appendChild(
        utils.create("button", {
          type: "button",
          textContent: "↪ Déplacer dans « " + titre + " »",
          onclick: () => {
            MM.deplacerActiviteVersPanier(actIndex, i);
            MM.fermerMenuDeplacerCopier();
          },
        }),
      );
      menu.appendChild(
        utils.create("button", {
          type: "button",
          textContent: "⧉ Copier dans « " + titre + " »",
          onclick: () => {
            MM.copierActiviteVersPanier(actIndex, i);
            MM.fermerMenuDeplacerCopier();
          },
        }),
      );
    }
    document.body.appendChild(menu);
    const zone = bouton.getBoundingClientRect();
    menu.style.top = zone.bottom + 4 + "px";
    menu.style.left = Math.max(4, zone.right - menu.offsetWidth) + "px";
    // laisse retomber le clic qui a ouvert le menu avant d'armer la
    // fermeture au clic extérieur, sinon le même évènement le referme aussitôt.
    setTimeout(() => document.addEventListener("click", MM._fermerMenuDeplacerCopierExt), 0);
    document.addEventListener("keydown", MM._fermerMenuDeplacerCopierEchap);
    MM._menuDeplacerCopier = menu;
  },
  fermerMenuDeplacerCopier() {
    if (MM._menuDeplacerCopier === undefined || MM._menuDeplacerCopier === null) return;
    MM._menuDeplacerCopier.remove();
    MM._menuDeplacerCopier = null;
    document.removeEventListener("click", MM._fermerMenuDeplacerCopierExt);
    document.removeEventListener("keydown", MM._fermerMenuDeplacerCopierEchap);
  },
  _menuDeplacerCopier: null,
  _fermerMenuDeplacerCopierExt(evt) {
    if (MM._menuDeplacerCopier !== null && !MM._menuDeplacerCopier.contains(evt.target)) {
      MM.fermerMenuDeplacerCopier();
    }
  },
  _fermerMenuDeplacerCopierEchap(evt) {
    if (evt.key === "Escape") MM.fermerMenuDeplacerCopier();
  },
  deplacerActiviteVersPanier(actIndex, versIndex) {
    const source = MM.carts[MM.selectedCart];
    const cible = MM.carts[versIndex];
    cible.addActivity(source.activities[actIndex], source.activities[actIndex].nbq, MM.carts);
    source.removeActivity(actIndex);
    MM.populateQuestionsAndAnswers();
    toaster("Activité déplacée vers « " + (cible.title || "Panier " + (versIndex + 1)) + " »");
  },
  copierActiviteVersPanier(actIndex, versIndex) {
    const source = MM.carts[MM.selectedCart];
    const cible = MM.carts[versIndex];
    cible.addActivity(source.activities[actIndex], source.activities[actIndex].nbq, MM.carts);
    MM.populateQuestionsAndAnswers();
    toaster("Activité copiée vers « " + (cible.title || "Panier " + (versIndex + 1)) + " »");
  },
  refreshQuestionsAndAnswers() {
    MM.showQuestions();
  },
  /**
   * création des affichages dans les diaporamas et les zones de rappel du site.
   * @param {boolean} withAnswer insère les réponses dans le diaporama si true
   */
  populateQuestionsAndAnswers(withAnswer) {
    if (document.getElementById("aleaKey").value === "") {
      MM.setSeed();
    } else {
      MM.setSeed(document.getElementById("aleaKey").value);
    }

    const exportTextArea = document.getElementById("text-export-pixelart");
    exportTextArea.value =
      "Export MathsMentales pour PixelArt https://jeduque.net/pixelart/\n";
    if (withAnswer === undefined) withAnswer = true;
    MM.figs = {};
    MM.steps = [];
    MM.timers = [];
    MM.memory = [];
    if (MM.text2speach !== undefined) {
      MM.text2speach.forEach((t) => {
        t.destroy();
      });
    }
    MM.memory = {};
    MM.text2speach = [];
    // paniers réels, ou panier d'aperçu si rien n'est encore au panier
    const paniers = MM.paniersAAfficher();
    // length = nombre de paniers
    let length = paniers.length;
    let enonces = document.getElementById("enonce-content");
    let corriges = document.getElementById("corrige-content");
    if (length > 1) {
      enonces.className = "grid-" + length;
      corriges.className = "grid-" + length;
    }
    enonces.innerHTML = "";
    corriges.innerHTML = "";
    // MM.copyURLtoHistory();
    // parcours des paniers
    for (let i = 0; i < length; i++) {
      paniers[i].actsArrays = [];
      // parcours des destinations du panier
      for (let kk = 0, clen = paniers[i].target.length; kk < clen; kk++) {
        let indiceSlide = 0;
        let slideNumber = paniers[i].target[kk] - 1;
        let dive = utils.create("div", { id: "de" + i + "-" + kk });
        let divc = utils.create("div", { id: "dc" + i + "-" + kk });
        MM.zooms["zc" + i + "-" + kk] = new Zoom(
          "zc" + i + "-" + kk,
          "#dc" + i + "-" + kk + " ol",
          true,
        );
        MM.zooms["ze" + i + "-" + kk] = new Zoom(
          "ze" + i + "-" + kk,
          "#de" + i + "-" + kk + " ol",
          true,
        );
        dive.appendChild(MM.zooms["ze" + i + "-" + kk].createCursor());
        divc.appendChild(MM.zooms["zc" + i + "-" + kk].createCursor());
        let addTitle = "";
        if (clen > 1) addTitle = "-" + (kk + 1);
        let titleSlider = paniers[i].title + addTitle;
        let h3e = utils.create("h3", { innerText: titleSlider }); // exercice's title
        let h3c = utils.create("h3", { innerText: titleSlider }); // correction's title
        dive.append(h3e);
        divc.append(h3c);
        let ole = utils.create("ol");
        let olc = utils.create("ol");
        // mise en couleur des listes énoncés et corrigés. (pour bilan ou impression)
        if (MM.colors[slideNumber] !== undefined) {
          ole.style["background"] = MM.colors[slideNumber];
          olc.style["background"] = MM.colors[slideNumber];
        }
        let actsArray = [];
        // on fait la liste des références activités / questions pour pouvoir créer les affichages
        for (let z = 0, alen = paniers[i].activities.length; z < alen; z++) {
          let activity = paniers[i].activities[z];
          activity.generate();
          for (let j = 0; j < activity.questions.length; j++) {
            actsArray.push([z, j]);
          }
        }

        // on mélange les références si on veut que tout soit mélangé.
        if (!paniers[i].ordered) {
          actsArray = utils.shuffle(actsArray);
        }
        // on stocke les associations pour pouvoir comparer quand on fera le online
        paniers[i].actsArrays[kk] = actsArray;
        // parcours des questions
        for (let ff = 0; ff < actsArray.length; ff++) {
          let activity = paniers[i].activities[actsArray[ff][0]];
          // pour ne pas tout réécrire :
          // j est le numéro de la question
          let j = actsArray[ff][1];
          let consigne = activity.consignes[j];
          let question = String(activity.questions[j]);
          let answer = activity.answers[j];
          let value = activity.values[j];
          // enoncés et corrigés
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
            //spane = utils.create("span", { innerHTML: '$$'+question+'$$' });
            // lie.appendChild(spane);
            if (consigne !== undefined) {
              lie.innerHTML = consigne + "<br>";
            }
            lie.innerHTML += "$$" + question + "$$";
            //spanc = utils.create("span");
            //lic.appendChild(spanc);
            exportTextArea.value += "---\n$" + question + "$\n\n";
          } else {
            if (consigne !== undefined) {
              lie.innerHTML = consigne + "<br>";
            }
            lie.innerHTML += question;
            exportTextArea.value +=
              "---\n" + question.replace(/$$/g, "$") + "\n\n";
          }
          if (
            activity.audioRead &&
            activity.audios[j] !== undefined &&
            activity.audios[j] !== false
          ) {
            MM.text2speach[indiceSlide] = [
              activity.audios[j],
              activity.audioRepeat,
            ];
          }
          if (Array.isArray(answer)) {
            if (!tex) lic.innerHTML += answer[0];
            else lic.innerHTML += "$$" + answer[0] + "$$";
          } else {
            if (tex) lic.innerHTML += "$$" + answer + "$$";
            else lic.innerHTML += answer;
          }
          let valueToExport = "";
          if (Array.isArray(value)) {
            valueToExport = value[0];
          } else {
            valueToExport = value;
          }
          if (typeof valueToExport === "number") {
            valueToExport = "$" + String(valueToExport) + "$";
          } else if (valueToExport.indexOf("$$") > -1) {
            valueToExport = String(valueToExport).replace("$$", "$");
          } else if (
            utils.testIfLatex(valueToExport) &&
            valueToExport.indexOf("$") === -1
          ) {
            valueToExport = "$" + valueToExport + "$";
          }
          // check if value is a latex formula or a number
          exportTextArea.value += valueToExport + "\n";
          if (activity.figures[j] !== undefined) {
            lic.innerHTML +=
              '&nbsp; <button data-id="c' +
              slideNumber +
              "-" +
              indiceSlide +
              '">Figure</button>';
            MM.memory["e" + slideNumber + "-" + indiceSlide] = new Figure(
              utils.clone(activity.figures[j]),
              "en" + slideNumber + "-" + indiceSlide,
              lie,
              [300, 150],
            );
            MM.memory["c" + slideNumber + "-" + indiceSlide] = new Figure(
              utils.clone(activity.figures[j]),
              "cor" + slideNumber + "-" + indiceSlide,
              lic,
              [450, 225],
            );
          }
          if (activity.figuresCorrection[j] !== undefined) {
            MM.memory["fc" + slideNumber + "-" + indiceSlide] = new Figure(
              utils.clone(activity.figuresCorrection[j]),
              "fc" + slideNumber + "-" + indiceSlide,
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
        if (!utils.isEmpty(MM.memory)) {
          setTimeout(() => {
            for (let j = 0; j < indiceSlide; j++) {
              // toutes les questions ne comportent pas de figures, on vérifie qu'il y en a.
              if (MM.memory["e" + slideNumber + "-" + j] !== undefined)
                MM.memory["e" + slideNumber + "-" + j].display();
              if (MM.memory["fc" + slideNumber + "-" + j] !== undefined) {
                MM.memory["fc" + slideNumber + "-" + j].display();
                MM.memory["fc" + slideNumber + "-" + j].toggle();
              }
            }
          }, 450);
        }
      }
    }
    utils.mathRender(MM.fontType, ["enonce-content", "corrige-content"]);
    // les deux conteneurs viennent d'être réécrits : si les paniers sont
    // vides, c'est ici que le message d'aide doit être reposé
    MM.majEtatOnglets();
  },
  setFacetoFace(etat) {
    this.faceToFace = etat;
    if (etat === "y") {
      utils.addClass(document.getElementById("sddiv1"), "return");
      if (MM.slidersNumber > 2)
        utils.addClass(document.getElementById("sddiv2"), "return");
    } else {
      utils.removeClass(document.getElementById("sddiv1"), "return");
      utils.removeClass(document.getElementById("sddiv2"), "return");
    }
  },
  getFacetoFace() {
    this.faceToFace = utils.getRadioChecked("facetoface");
  },
  /**
   * Create doc ODT (Writer) or ODP (Impress)
   */
  createODTDoc: function () {
    // générer
    this.showQuestions();
    MM.showTab(document.querySelector("[numero='#tab-enonce'].tabs-menu-link"));
    document.getElementById("loading").style.display = "flex";
    // prévoir un truc qui montre que ça mouline
    let title =
      document.getElementById("docTitle").value || "document MathsMentales";
    MM.copyURLtoHistory("docLOOO");
    // export : on laisse le temps aux formules et aux figures d'être rendues
    setTimeout(async () => {
      try {
        await MM.exportDocument(title);
      } catch (err) {
        console.error("Export LibreOffice impossible :", err);
        alert(
          "L’export LibreOffice a échoué : " +
            (err && err.message ? err.message : err),
        );
      } finally {
        document.getElementById("loading").style.display = "none";
      }
    }, 1500);
  },
  /**
   * Ouvre dans une nouvelle fenêtre la page `type` (exosheet, exam, wall…)
   * alimentée par le panier ; l'activité ouverte est ajoutée au panier s'il est vide.
   * @param {string} type type de page, tel que compris par paramsToURL/setURL
   * @param {string} [features] options de window.open
   * @param {boolean} [withSeed] graine aléatoire dans l'URL (défaut : case aleaInURL)
   */
  openActivityWindow: function (
    type,
    features = "location=no,menubar=no,titlebar=no,width=1123",
    withSeed = document.getElementById("aleaInURL").checked,
  ) {
    // rien à montrer : ni activité ouverte, ni panier rempli. La condition ne
    // portait que sur l'activité ouverte, si bien que « C'est parti ! » ne
    // faisait rien après un ajout par le bouton « Au panier ».
    const paniersVides = !MM.carts.some((panier) => panier.activities.length);
    if (!MM.editedActivity && paniersVides) return;
    if (!MM.carts[0].activities.length && MM.editedActivity) {
      MM.carts[0].addActivity(MM.editedActivity);
      MM.editActivity(MM.carts[0].activities.length - 1);
    }
    const params = MM.paramsToURL(withSeed, type);
    const value = MM.setURL(params, type);
    MM.copyURLtoHistory(type);
    MM.window = window.open(value, "mywindow", features);
  },
  createExercicesSheet: function () {
    MM.openActivityWindow("exosheet");
  },
  createAssocGame: function () {
    MM.openActivityWindow("assoc");
  },
  createCourseAuxNombres: function () {
    MM.openActivityWindow("cansheet");
  },
  createExamSheet: function () {
    MM.openActivityWindow("exam");
  },
  createCeintureSheet: function () {
    if (!MM.carts[0].activities.length) {
      MM.carts[0].addActivity(MM.editedActivity);
      MM.editActivity(MM.carts[0].activities.length - 1);
    }
    // vérification du nombre de questions du panier
    let nbq = 0;
    for (let i = 0; i < MM.carts[0].activities.length; i++) {
      nbq += Number(MM.carts[0].activities[i].nbq);
    }
    // calcul du nombre de questions de la ceinture
    let nbqc =
      Number(document.getElementById("ceintcolsval").value) *
      Number(document.getElementById("ceintrowsval").value);
    if (nbq < nbqc) {
      // si pas assez de questions dans le panier, alerter et s'arrêter
      alert(
        "Pas assez de questions dans le panier pour alimenter la ceinture\nde " +
          document.getElementById("ceintcolsval").value +
          "×" +
          document.getElementById("ceintrowsval").value +
          "=" +
          nbqc +
          " emplacements",
      );
      return;
    } else if (nbq > nbqc) {
      if (
        !confirm(
          "Vous allez créé une ceinture de " +
            nbqc +
            " emplacements\nalors que vous avez créé un panier de" +
            nbq +
            "questions.\nToutes ne seront donc pas imprimées. Continuer ?",
        )
      ) {
        return;
      }
    }
    MM.openActivityWindow("ceinture");
  },
  createFlashCards: function () {
    MM.openActivityWindow("cartesflash");
  },
  createFicheMemo: function () {
    MM.openActivityWindow("fichememo");
  },
  createWall: function () {
    MM.openActivityWindow("wall");
  },
  // TODO : replace this by an independent webpage
  createWhoGots: function () {
    MM.openActivityWindow("whogots");
  },
  createDominos: function () {
    MM.openActivityWindow("dominos");
  },
  createPuzzle: function () {
    MM.openActivityWindow("puzzle");
  },

  duelLaunch: function () {
    if (!MM.editedActivity) return;
    MM.openActivityWindow(
      "duel",
      "location=no,menubar=no,titlebar=no,width=720",
      false,
    );
  },
  diaporamaLaunch: function () {
    MM.openActivityWindow(
      "diaporama",
      "location=no,menubar=no,titlebar=no,fullscreen=yes",
    );
  },
  /**
   * Start the slideshow
   */
  start: function () {
    this.diaporamaLaunch();
  },
  paramsToURL(withAleaSeed = false, type = "", encoded = false) {
    let colors = MM.colors.join("~").replace(/\,/g, "_");
    // MM.setSeed()
    let urlparams =
      "a=" +
      (withAleaSeed ? this.getSeed() : "") +
      "," +
      "fs=" +
      MM.fontType +
      ",";

    if (type === "cartesflash") {
      urlparams +=
        "disp=" +
        utils.getRadioChecked("flashcarddispo") +
        ",t=" +
        (document.getElementById("FCtitle").value || "Cartes Flash") +
        this.export();
    } else if (type === "fichememo") {
      urlparams +=
        "disp=" +
        utils.getRadioChecked("fichememodispo") +
        ",t=" +
        (document.getElementById("FMtitle").value || "Fiche Mémorisation") +
        this.export();
    } else if (type === "ceinture") {
      let chaine = "",
        t = 0;
      // liste des titres :
      let titles = document.querySelectorAll("#ceintcolumnTitle input");
      titles.forEach((inp) => {
        chaine +=
          ",t" + t + "=" + (inp.value ? utils.superEncodeURI(inp.value) : "");
        t++;
      });
      urlparams +=
        "t=" +
        utils.superEncodeURI(document.getElementById("ceinttitle").value) +
        ",ke=" +
        document.getElementById("ceintprintToEnonce").checked +
        ",kc=" +
        document.getElementById("ceintprintToCorrige").checked +
        ",nc=" +
        document.getElementById("ceintcolsval").value +
        chaine +
        ",nr=" +
        document.getElementById("ceintrowsval").value +
        ",n=" +
        document.getElementById("ceintqtyvalue").value +
        ",cor=" +
        (utils.getRadioChecked("ceintcorrpos") || "fin") +
        ",pie=" +
        document.getElementById("ceintpiedcol").value +
        ",or=" +
        (utils.getRadioChecked("ceintorientation") || "portrait") +
        this.export();
    } else if (type === "cansheet") {
      urlparams +=
        "n=" +
        document.getElementById("canqtyvalue").value +
        ",t=" +
        encodeURI(
          document.getElementById("cantitle").value ||
            document.getElementById("cantitle").placeholder,
        ) +
        ",cor=" +
        (utils.getRadioChecked("cancorrpos") || "fin") +
        ",tm=" +
        (document.getElementById("cantime").value ||
          document.getElementById("cantime").placeholder) +
        ",t1=" +
        encodeURI(
          document.getElementById("cancol1title").value ||
            document.getElementById("cancol1title").placeholder,
        ) +
        ",t2=" +
        encodeURI(
          document.getElementById("cancol2title").value ||
            document.getElementById("cancol2title").placeholder,
        ) +
        ",t3=" +
        encodeURI(
          document.getElementById("cancol3title").value ||
            document.getElementById("cancol3title").placeholder,
        ) +
        this.export();
    } else if (type === "dominos") {
      urlparams +=
        "n=" +
        document.getElementById("dominosNbValue").value +
        ",d=" +
        document.getElementById("dominosDoublons").checked +
        this.export();
    } else if (type === "assoc") {
      urlparams +=
        "d=" +
        (document.getElementById("assocsChronoYes").checked
          ? document.getElementById("assocTime").value
          : 0) +
        this.export();
    } else if (type === "duel") {
      urlparams +=
        "ty=" +
        utils.getRadioChecked("dueltype") +
        ",bg=" +
        document.getElementById("duelbackgroundselect").value +
        (utils.getRadioChecked("dueltemps") === "limit"
          ? ",t=" +
            utils.timeToSeconds(document.getElementById("dueltotaltime").value)
          : "") +
        this.export();
    } else if (type === "exam") {
      urlparams +=
        "s=" +
        document.getElementById("intTxtSizeValue").value +
        ",n=" +
        document.getElementById("intQtyValue").value +
        ",t=" +
        encodeURI(
          document.getElementById("inttitle").value ||
            document.getElementById("inttitle").placeholder,
        ) +
        ",ex=" +
        encodeURI(
          document.getElementById("inteachex").value ||
            document.getElementById("inteachex").placeholder,
        ) +
        this.export();
    } else if (type === "exosheet") {
      urlparams +=
        "s=" +
        document.getElementById("exTxtSizeValue").value +
        ",n=" +
        document.getElementById("exQtyValue").value +
        ",cor=" +
        utils.getRadioChecked("excorr") +
        ",t=" +
        encodeURI(
          document.getElementById("extitle").value ||
            document.getElementById("extitle").placeholder,
        ) +
        ",ex=" +
        encodeURI(
          document.getElementById("exeachex").value ||
            document.getElementById("exeachex").placeholder,
        ) +
        this.export();
    } else if (type === "whogots") {
      urlparams +=
        "n=" +
        document.getElementById("cardsNbValue").value +
        ",d=" +
        document.getElementById("WGDoublons").checked +
        ",aff=" +
        document.getElementById("WGaffirmation").value +
        ",quest=" +
        document.getElementById("WGquestion").value +
        this.export();
    } else if (type === "puzzles") {
      urlparams += this.export();
    } else if (type === "wall") {
      urlparams +=
        "t=" +
        utils.superEncodeURI(document.getElementById("walltitle").value) +
        this.export();
    } else if (type === "docLOOO") {
      urlparams +=
        "t=" +
        encodeURI(
          document.getElementById("docTitle").value ||
            document.getElementById("docTitle").placeholder,
        ) +
        ",fmt=" +
        (utils.getRadioChecked("radiodocformat") || "writer") +
        ",doc=" +
        (utils.getRadioChecked("radiodoc") || "both") +
        ",pres=" +
        (utils.getRadioChecked("radiodocpres") || "suite") +
        ",num=" +
        (utils.getRadioChecked("radiodocnum") || "oui") +
        this.export();
    } else {
      urlparams +=
        "i=" +
        MM.introType +
        ",e=" +
        MM.endType +
        ",o=" +
        MM.onlineState +
        ",s=" +
        MM.slidersNumber +
        ",so=" +
        MM.slidersOrientation +
        ",f=" +
        MM.faceToFace +
        ",colors=" +
        colors +
        ",snd=" +
        sound.selected +
        this.export();
    }
    if (encoded) return utils.encodeUrlUnreadable(urlparams);
    else return urlparams;
  },
  setHistory(pageName, params) {
    let url = MM.setURL(params);
    history.pushState({ id: "Homepage" }, pageName, url);
  },
  loadActivity(activityId) {
    library
      .load(activityId, MM.version)
      .then(([json, id]) => {
        const obj = new Activity(json, id);
        MM.editedActivity = obj;
        // show tab-content
        const tab = document.querySelector(
          "[numero$='parameters'].tabs-menu-link",
        );
        MM.resetAllTabs();
        utils.addClass(tab, "is-active");
        document.getElementById("tab-parameters").style.display = "";
        document.getElementById("addToCart").className = "";
        document.getElementById("removeFromCart").className = "hidden";
        obj.display("sample", MM);
        MM.setHistory("Exercice", "u=" + id);
        MM.refreshQuestionsAndAnswers();
      })
      .catch((e) => {
        return false;
      });
  },
  /**
   * regarde les paramètres fournis dans l'url
   * et lance le diapo ou passe en mode édition
   * edit est true si appelé par l'historique pour édition
   */
  async checkURL(urlString = false, start = true, edit = false) {
    const vars = utils.getUrlVars(urlString);
    if (vars.edit) edit = true;
    // cas d'une page prévue pour exercice.html
    if (
      vars.cor &&
      vars.ex &&
      location.href.indexOf("exercices.html") < 0 &&
      !edit
    ) {
      // on redirige vers exercice.html
      let url = new URL(location.href);
      location.href =
        url.origin +
        url.pathname.replace("index.html", "") +
        "exercices.html" +
        url.search;
    }
    if (vars.embed !== undefined) {
      // cas d'une activité embeded, on vérifie que l'url est conforme
      let expression =
        /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
      let regex = new RegExp(expression);
      if (vars.embed.match(regex)) MM.embededIn = vars.embed;
    }
    if (vars.n === "i3") {
      MM.showTab("tab-chercher");
      MM.loadFromServer("brevet-2025.html");
      return;
    }
    if (vars.search) {
      // chaine de recherche
      document.getElementById("searchinput").value = vars.search;
      if (vars.f !== "" && vars.f !== undefined) {
        vars.f.split(",").forEach((el) => {
          document.getElementById("ccbs" + el).checked = true;
        });
      }
      library.displayContent(vars.search);
    } else if (vars.n !== undefined && vars.cd === undefined && !edit) {
      // un niveau à afficher
      MM.cocherNiveauRecherche(vars.n);
      library.displayContent(vars.n, true);
      return;
    } else if (vars.u !== undefined && vars.cd === undefined && !edit) {
      // ancien exo MM1
      let regexp = /(\d+|T|G|K|H)/; // le fichier commence par un nombre ou un T pour la terminale
      // un paramétrage d'exercice à afficher
      if (_.isArray(vars.u)) {
        let listeURLs = [];
        // il peut y avoir plusieurs exercices correspondant à une activité MM1
        for (let i = 0; i < vars.u.length; i++) {
          let url = vars.u[i];
          let level = regexp.exec(url)[0];
          listeURLs.push({ u: "N" + level + "/" + url + ".json", t: "" });
        }
        library.displayContent(listeURLs);
      } else if (vars.u !== undefined) {
        // s'il n'y a qu'une activité, on l'affiche.
        //let level = regexp.exec(vars.u)[0];
        library.load(vars.u, MM.version).then(([json, id]) => {
          const obj = new Activity(json, id);
          MM.editedActivity = obj;
          // show tab-content
          const tab = document.querySelector(
            "[numero$='parameters'].tabs-menu-link",
          );
          MM.resetAllTabs();
          utils.addClass(tab, "is-active");
          document.getElementById("tab-parameters").style.display = "";
          document.getElementById("addToCart").className = "";
          document.getElementById("removeFromCart").className = "hidden";
          // le panneau Paramétrer était auparavant rempli par le editActivity(0)
          // que showQuestions() déclenchait via la mise au panier implicite ;
          // celle-ci ayant disparu, on affiche l'activité explicitement.
          obj.display("sample", MM);
          MM.showQuestions();
          MM.setHistory("Exercice", "u=" + id);
        });
      } else {
        let alert = utils.create("div", {
          className: "message",
          innerHTML:
            "Cette activité n'a pas de correspondance dans cette nouvelle version de MathsMentales.<hr class='center w50'>Vous allez être redirigé vers l'ancienne version dans 10s. <a>Go !</a>",
        });
        alert.onclick = utils.goToOldVersion();
        document.getElementById("tab-accueil").appendChild(alert);
        setTimeout(utils.goToOldVersion, 10000);
      }
    } else if (vars.c !== undefined) {
      // présence de carts MM v2 à lancer ou éditer
      // un document LibreOffice n'a pas de page dédiée : on reste sur
      // index.html pour régénérer le document au lieu de lancer le diaporama.
      const isDocLink = vars.fmt !== undefined;
      // si pas d'édition, on lance le diaporama en mode autonome
      if (!edit && !isDocLink) {
        if (location.href.indexOf("index.html") < 0) {
          location.href = location.href.replace("/?", "/diaporama.html?");
        } else {
          location.href = location.href.replace("index.html", "diaporama.html");
        }
      }
      // indique quoi faire avant le slide
      MM.introType = vars.i || "nothing";
      // indique quoi faire après le slide
      MM.endType = vars.e;
      // couleurs des diaporamas
      if (typeof vars.colors === "string") {
        let couleurs = vars.colors.split("~");
        for (let i = 0; i < couleurs.length; i++) {
          MM.colors[i] = couleurs[i].replace(/_/g, ",");
          document.getElementById("sddiv" + (i + 1)).style.background =
            MM.colors[i];
        }
      }
      // Mode online
      if (vars.o) {
        MM.onlineState = vars.o;
      }
      // Mode face to face
      if (vars.f) MM.faceToFace = vars.f;
      // nombre de diaporamas
      if (vars.s) {
        MM.slidersNumber = Number(vars.s);
      }
      // son
      if (Number(vars.snd) >= 0 && !vars.snd) {
        sound.setSound(Number(vars.snd));
      }
      if (vars.fs) {
        this.setFontType(vars.fs);
      }
      // le seed d'aléatorisation est fourni et on n'est pas en mode online
      if ((vars.a && MM.onlineState === "no") || edit) {
        MM.setSeed(vars.a);
        // on check la clé de donnée incluse
        document.getElementById("aleaInURL").checked = true;
      } /*else if(MM.onlineState=="yes" || !vars.a)
                MM.setSeed(utils.seedGenerator());*/
      // on supprime tous les paniers
      MM.resetCarts();
      // orientation dans le cas de 2 diapos
      if (vars.so) {
        MM.slidersOrientation = vars.so;
      }
      // paramètres des activités des paniers
      let json = vars.c;
      // version avant le 15/08/21
      if (typeof vars.c === "string")
        json = JSON.parse(decodeURIComponent(vars.c));
      // récup des paramètres de panier
      // on affiche l'interface de paramétrage si on est en mode édition,
      // ou pour régénérer directement un document LibreOffice (pas de page dédiée)
      if (edit || isDocLink) {
        MM.resetInterface();
        MM.showTab("tab-parameters");
        const typeParams = isDocLink
          ? "paramsdocLOOO"
          : utils.getTypeOfURL(urlString, vars.type);
        // remplissage des données de carte flash
        if (typeParams === "paramsflashcards") {
          document.getElementById("FCtitle").value = vars.t
            ? decodeURIComponent(vars.t)
            : "";
          utils.checkRadio("flashcarddispo", vars.disp);
        } else if (typeParams === "paramsassocs") {
          if (vars.d === 0)
            document.getElementById("setAssocsChrono").checked = false;
          else document.getElementById("setAssocsChrono").checked = true;
          document.getElementById("assocTime").value =
            vars.d === 0 ? 30 : vars.d;
        } else if (typeParams === "paramsceinture") {
          // remplissage des données ceinture
          document.getElementById("ceinttitle").value = vars.t
            ? decodeURIComponent(vars.t)
            : "";
          document.getElementById("ceintcols").value = vars.nc;
          document.getElementById("ceintcolsval").value = vars.nc;
          let coltitles = document.getElementById("ceintcolumnTitle");
          coltitles.innerHTML = "";
          for (let i = 0, tot = Number(vars.nc); i < tot; i++) {
            if (i > 0) coltitles.appendChild(utils.create("br"));
            coltitles.appendChild(
              utils.create("label", {
                for: "ceinttitlecol" + (i + 1),
                innerHTML: "Colonne " + (i + 1) + " :",
              }),
            );
            coltitles.appendChild(
              utils.create("input", {
                type: "text",
                id: "ceinttitlecol" + (i + 1),
                value: vars["t" + i] ? decodeURIComponent(vars["t" + i]) : "",
              }),
            );
          }
          document.getElementById("ceintrows").value = vars.nr;
          document.getElementById("ceintrowsval").value = vars.nr;
          document.getElementById("ceintqty").value = vars.n;
          document.getElementById("ceintqtyvalue").value = vars.n;
          utils.checkRadio("ceintcorrpos", vars.cor);
          document.getElementById("ceintpiedcol").value = vars.pie;
          utils.checkRadio("ceintorientation", vars.o ? vars.o : "portrait");
        } else if (typeParams === "paramscourse") {
          // donnéess de course aux nombres
          document.getElementById("cantitle").value = vars.t
            ? decodeURIComponent(vars.t)
            : "";
          document.getElementById("cancol1title").value = vars.t1
            ? decodeURIComponent(vars.t1)
            : "";
          document.getElementById("cancol2title").value = vars.t2
            ? decodeURIComponent(vars.t2)
            : "";
          document.getElementById("cancol3title").value = vars.t3
            ? decodeURIComponent(vars.t3)
            : "";
          document.getElementById("cantime").value = vars.tm
            ? decodeURIComponent(vars.tm)
            : "";
          document.getElementById("canqtyvalue").value = vars.n
            ? decodeURIComponent(vars.n)
            : "";
          utils.checkRadio("cancorrpos", vars.cor);
        } else if (typeParams === "paramsdiapo") {
          // données de diaporama
          // on check tous les boutons radio en fonction des valeurs en mémoire
          utils.checkRadio("direction", this.slidersOrientation);
          if (this.introType === "nothing") {
            utils.checkRadio("beforeSlider", this.introType);
            document.getElementById("radiobeforeslider1").checked = false;
            document.getElementById("radiobeforeslider2").checked = false;
          } else {
            document.getElementById("radiobeforeslider3").checked = false;
            utils.checkCheckbox("beforeSlider", this.introType.split("-"));
          }
          utils.checkRadio("endOfSlideRadio", this.endType);
          utils.checkRadio("online", this.onlineState);
          utils.checkRadio("facetoface", this.faceToFace);
          utils.checkRadio("Enonces", this.slidersNumber);
          MM.setDispositionEnonce(this.slidersNumber);
        } else if (typeParams === "paramsdominos") {
          // données de dominos
          document.getElementById("dominosNbValue").value = vars.n
            ? Number(vars.n)
            : 28;
          document.getElementById("dominosNb").innerHTML = vars.n ? vars.n : 28;
          document.getElementById("dominosDoublons").checked =
            vars.d === "true";
          const text = document.getElementById("dominosDoublonsText");
          if (vars.d === "true") text.innerHTML = "Oui";
          else text.innerHTML = "Non";
        } else if (typeParams === "paramsduel") {
          utils.selectOption("duelbackgroundselect", vars.bg);
          utils.checkRadio("dueltype", vars.ty);
          if (Number(vars.t) > 0) {
            utils.checkRadio("dueltemps", "limit");
            document.getElementById("dueltotaltime").value = utils.secondToTime(
              Number(vars.t),
            );
          } else {
            utils.checkRadio("dueltemps", "panier");
          }
        } else if (typeParams === "paramsinterro") {
          document.getElementById("inttitle").value = vars.t
            ? decodeURIComponent(vars.t)
            : "";
          document.getElementById("inteachex").value = vars.ex
            ? decodeURIComponent(vars.ex)
            : "";
          document.getElementById("intTxtSize").innerHTML = vars.s
            ? decodeURIComponent(vars.s)
            : "";
          document.getElementById("intTxtSizeValue").value = vars.s
            ? vars.s
            : "";
          document.getElementById("intQtyValue").value = vars.n ? vars.n : "";
        } else if (typeParams === "paramswexos") {
          document.getElementById("exTxtSizeValue").value = vars.s
            ? vars.s
            : "";
          document.getElementById("exTxtSize").innerHTML = vars.s
            ? decodeURIComponent(vars.s)
            : "";
          document.getElementById("exQtyValue").value = vars.n ? vars.n : "";
          utils.checkRadio("excorr", vars.cor);
          document.getElementById("extitle").value = vars.t
            ? decodeURIComponent(vars.t)
            : "";
          document.getElementById("exeachex").value = vars.ex
            ? decodeURIComponent(vars.ex)
            : "";
        } else if (typeParams === "paramswhogots") {
          document.getElementById("cardsNbValue").value = vars.n
            ? Number(vars.n)
            : "";
          document.getElementById("cardsNb").innerHTML = vars.n ? vars.n : "";
          document.getElementById("WGDoublons").checked = vars.d === "true";
          document.getElementById("WGDoublonsText").innerHTML =
            vars.d === "true" ? "Oui" : "Non";
          document.getElementById("WGaffirmation").value = vars.aff
            ? decodeURIComponent(vars.aff)
            : "";
          document.getElementById("WGquestion").value = vars.quest
            ? decodeURIComponent(vars.quest)
            : "";
        } else if (typeParams === "paramspuzzle") {
          // no parameters yet
        } else if (typeParams === "paramswall") {
          document.getElementById("walltitle").value = vars.t
            ? decodeURIComponent(vars.t)
            : "";
        } else if (typeParams === "paramsdocLOOO") {
          document.getElementById("docTitle").value = vars.t
            ? decodeURIComponent(vars.t)
            : "";
          utils.checkRadio("radiodocformat", vars.fmt || "writer");
          utils.checkRadio("radiodoc", vars.doc || "both");
          utils.checkRadio("radiodocpres", vars.pres || "suite");
          utils.checkRadio("radiodocnum", vars.num || "oui");
          MM.majPresentationDoc();
        }
        // on sélectionne le menu qu'il faut
        utils.selectOption("chooseParamType", typeParams);
        MM.showParameters(typeParams);
      }

      // la version à partir du 15/08/21 fonctionne avec un objet vars.c déjà construit.
      // allcarts contient des promises qu'il faut charger
      let allcarts = [];
      for (const i in json) {
        if (MM.carts[i]) {
          if (MM.carts[i].sortable) MM.carts[i].sortable.destroy();
          delete MM.carts[i];
        }
        MM.carts[i] = new CartClass(i);
        allcarts.push(MM.carts[i].import(json[i], start, MM.version));
      }

      // on attend le résultat de toutes les promesses pour mettre à jour les affichages.
      Promise.all(allcarts)
        .then(() => {
          // on prépare l'affichage des paniers
          MM.restoreCartsInterface();
          MM.showCartInterface();
          // crée l'affichage des paniers
          MM.carts.forEach((thecart) => thecart.display());
          MM.showCart(1);
          if (edit) MM.editActivity(0);
          MM.populateQuestionsAndAnswers();
          // lien direct vers un document LibreOffice : on régénère aussitôt
          if (isDocLink && !edit) MM.createODTDoc();
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
  // open an modal and
  // get the URL of direct access to the activity with actual parameters
  copyURL(type = "") {
    const colparams = document.getElementById("colparameters");
    let modalMessage = utils.create("div", {
      id: "urlCopy",
      className: "message",
      style: "padding:1.5rem",
      innerHTML: `<div>Adresse longue <span id="longcopied" class='red'>Copié !</span></div>
                <textarea readonly="true" id="bigurl" cols="38" rows="6" onfocus=""></textarea><br>
                <button id="btn-urlshorter">Raccourcir l'url</button><br>
                <div>Adresse encodée <span id="encodedcopied" class='red hidden'>Copié !</span></div>
                <textarea readonly="true" id="encodedurl" cols="38" rows="6" onfocus=""></textarea><br>
                <button id="btn-urlshorter-encode">Raccourcir l'url encodée</button><br>
                <input readonly="true" type="url" id="shorturl" size="38">
                <div id="shortQRdiv"></div>
                `,
    });
    colparams.addEventListener("click", (evt) => {
      if (evt.target.id === "btn-urlshorter") MM.getQR();
    });
    colparams.addEventListener("click", (evt) => {
      if (evt.target.id === "btn-urlshorter-encode") MM.getQR(true);
    });
    colparams.addEventListener("focus", (evt) => {
      if (["bigurl", "shorturl", "encodedurl"].indexOf(evt.target.id) > -1)
        utils.copy(evt.target);
    });
    let withSeed = false;
    if (document.getElementById("aleaInURL").checked) withSeed = true;
    const close = utils.create("button", {
      innerHTML: "<i class='sprite sprite-closebutton32'></i>",
      style:
        "position:absolute;top:0.5rem;right:0.5rem;padding:0;background:transparent",
    });
    close.onclick = () => {
      let m = document.getElementById("urlCopy");
      m.parentNode.removeChild(m);
    };
    modalMessage.appendChild(close);
    colparams.appendChild(modalMessage);
    const params = this.paramsToURL(withSeed, type);
    const input = document.getElementById("bigurl");
    input.value = this.setURL(params, type);
    const encodedParams = this.paramsToURL(withSeed, type, true);
    const input2 = document.getElementById("encodedurl");
    input2.value = this.setURL(encodedParams, type);
    input2.onclick = async () => {
      await navigator.clipboard.writeText(input2.value);
      input2.select();
      input2.setSelectionRange(0, 99999);
      document.getElementById("encodedcopied").classList.remove("hidden");
      setTimeout(() => {
        document.getElementById("encodedcopied").classList.add("hidden");
      }, 2000);
    };
    input.onclick = async () => {
      await navigator.clipboard.writeText(input.value);
      input.select();
      input.setSelectionRange(0, 99999);
      document.getElementById("longcopied").classList.remove("hidden");
      setTimeout(() => {
        document.getElementById("longcopied").classList.add("hidden");
      }, 2000);
    };
    //if(document.getElementById("aleaInURL").checked)params.a = MM.seed;
    // on affiche (furtivement) le input pour que son contenun puisse être sélectionné.
    //input.className = "";
    //let value = input.value;
    navigator.clipboard.writeText(input.value);
    input.select();
    input.setSelectionRange(0, 99999);
    setTimeout(() => {
      document.getElementById("longcopied").classList.add("hidden");
    }, 2000);
    //document.execCommand("copy");
    //input.className ="hidden";
    //let message = document.querySelector(".button--inverse .tooltiptext").innerHTML;
    //document.querySelector(".button--inverse .tooltiptext").innerHTML = "Copié !";
    //setTimeout(()=>document.querySelector(".button--inverse .tooltiptext").innerHTML = message,2500);
  },
  /**
   * Range l'adresse courante dans l'historique. Toute la mise en forme, le
   * stockage et le retour visuel sont dans le mod historique ; il ne reste ici
   * que la fabrication des deux URL, qui dépend des paniers vivants.
   *
   * historique.ajouter() ne se réaffiche pas lui-même (comme renommer/epingler,
   * dont les appelants internes déclenchent rendre() ) : l'onglet Historique
   * étant monté une fois pour toutes dès le chargement, sans ce rendre() une
   * entrée fraîchement ajoutée resterait invisible tant que la page n'est pas
   * rechargée.
   */
  copyURLtoHistory(type = "") {
    const params = this.paramsToURL(true, type);
    const paramsSansGraine = this.paramsToURL(false, type);
    historique.ajouter({
      type,
      url: this.setURL(params, type),
      urlSansGraine: this.setURL(paramsSansGraine, type),
      paniers: this.paniersVersDonnees(),
    });
    historique.rendre();
  },
  getQR(isEncoded = false) {
    // si on n'est pas en mode edition de panier.
    if (MM.carts.length < 2 && MM.carts[0].activities.length < 2) {
      MM.carts[0].activities = [];
      MM.carts[0].addActivity(MM.editedActivity);
    }
    // on récupère l'adresse créée
    let url;
    if (!isEncoded) {
      url = document.getElementById("bigurl").value;
    } else {
      url = document.getElementById("encodedurl").value;
    }
    // raccourcissement de l'url
    const alert = document.getElementById("shortQRdiv");
    alert.innerHTML = "";
    const div = utils.create("div", {
      className: "lds-ellipsis",
      innerHTML: "<div></div><div></div><div></div><div></div>",
    });
    const div2 = utils.create("div", { innerHTML: "Génération en cours" });
    alert.appendChild(div);
    alert.appendChild(div2);
    const shorter = new XMLHttpRequest();
    shorter.onload = function () {
      try {
        alert.removeChild(div);
        alert.removeChild(div2);
        let shorturl = shorter.responseText;
        if (shorturl.indexOf("https:") !== 0) {
          alert.appendChild(
            utils.create("h2", {
              innertext: "Problème de récupération de l'url courte",
            }),
          );
          return;
        }
        alert.appendChild(
          utils.create("h2", { innerText: "QRcode de l'exercice" }),
        );
        const qrdest = utils.create("div", {
          id: "qrious",
          title: "Clic droit pour copier l'image",
        });
        alert.appendChild(qrdest);
        let inputShortUrl = document.getElementById("shorturl");
        inputShortUrl.value = shorturl;
        inputShortUrl.select();
        inputShortUrl.setSelectionRange(0, 99999);
        document.execCommand("copy");
        const QR = new QRCodeStyling({
          // element: qrdest,// DOM destination
          data: shorturl,
          width: 200,
          height: 200,
          type: "canvas",
          image: "img/android-icon-72x72.png",
          imageOptions: { margin: 2 },
          padding: 12,
        });
        QR.append(qrdest);
      } catch (err) {
        console.log(err);
      }
    };
    shorter.open("get", "getshort.php?url=" + encodeURIComponent(url));
    shorter.send();
  },
  // Met en mode annotation
  annotateThisThing: function (target, btnId) {
    if (target === false && MM.annotate !== undefined) {
      MM.annotate.destroy();
      MM.annotate = undefined;
    } else if (MM.annotate === undefined && _.isString(target)) {
      MM.annotate = new draw(target, btnId, this.touched);
    } else if (MM.annotate !== undefined) {
      MM.annotate.destroy();
      MM.annotate = undefined;
    }
  },
  /**
   * Création et complétion des infos de tuiles de la page d'accueil
   */
  /**
   * Activités que public/library/scan.js a marquées neuves, c'est-à-dire dont
   * le fichier a moins de quinze jours. L'information voyage déjà jusqu'au
   * client dans content.js ; elle n'était exploitée que dans la liste de
   * résultats de recherche.
   */
  listerNouveautes() {
    const trouvees = [];
    for (const code in MM.content) {
      const niveau = MM.content[code];
      if (!_.isObject(niveau) || niveau.themes === undefined) continue;
      for (const t in niveau.themes) {
        for (const c in niveau.themes[t].chapitres) {
          for (const id of niveau.themes[t].chapitres[c].e) {
            if (activities[id].new)
              trouvees.push({
                id: id,
                titre: activities[id].t,
                niveau: niveau.nom,
                code: code,
              });
          }
        }
      }
    }
    return trouvees;
  },
  /**
   * Nombre de nouveautés par niveau, pour la pastille des tuiles. Une activité
   * rattachée à plusieurs niveaux compte dans chacun.
   */
  compterNouveautes() {
    const parNiveau = {};
    MM.listerNouveautes().forEach((act) => {
      parNiveau[act.code] = (parNiveau[act.code] || 0) + 1;
    });
    return parNiveau;
  },
  createTuiles() {
    let grille;
    const ordre = library.ordre;
    const nouveautesParNiveau = MM.compterNouveautes();
    function setContent(id, obj) {
      const elt = utils.create("button", {
        type: "button",
        className: "tuile btn-plain",
        title: "Cliquer pour afficher toutes les activités du niveau",
      });
      // span et non h3 : un titre placé dans un bouton perd sa sémantique de titre
      const titre = utils.create("span", {
        className: "tuile-titre",
        innerHTML: obj.nom,
      });
      elt.appendChild(titre);
      const nba = utils.create("span", {
        innerHTML: obj.activitiesNumber + " activités",
      });
      elt.onclick = () => {
        MM.setHistory("MathsMentales niveau " + obj.nom, "n=" + id);
        MM.cocherNiveauRecherche(id);
        library.displayContent(id, true);
      };
      elt.appendChild(nba);
      const neuves = nouveautesParNiveau[id];
      if (neuves) {
        elt.appendChild(
          utils.create("span", {
            className: "tuile-neuves",
            innerHTML: neuves + (neuves > 1 ? " nouvelles" : " nouvelle"),
          }),
        );
      }
      grille.appendChild(elt);
    }
    for (const o in ordre) {
      grille = document.getElementById(o);
      for (let i = 0; i < ordre[o].length; i++) {
        if (
          MM.content[ordre[o][i]].activitiesNumber === undefined ||
          MM.content[ordre[o][i]].activitiesNumber === 0 ||
          i === "activitiesNumber"
        )
          continue;
        setContent(ordre[o][i], MM.content[ordre[o][i]]);
      }
      if (o === "grille-college") {
        const elt = utils.create("div", {
          className: "tuile tuile-orange tuile-automatismes",
        });
        const titre = utils.create("span", {
          className: "tuile-titre-automatismes",
          innerHTML: "Automatismes",
        });
        elt.appendChild(titre);
        const boutons = utils.create("div", {
          className: "tuile-automatismes-boutons",
        });
        [
          { nom: "6e", url: "automatismes-6e.html" },
          { nom: "5e", url: "automatismes-5e.html" },
          { nom: "4e", url: "automatismes-4e.html" },
          { nom: "3e", url: "brevet-2025.html" },
        ].forEach((niveau) => {
          const btn = utils.create("button", {
            type: "button",
            className: "btn-plain",
            innerHTML: niveau.nom,
            title: "Automatismes " + niveau.nom,
          });
          btn.onclick = () => {
            window.location.href = "/" + niveau.url;
          };
          boutons.appendChild(btn);
        });
        elt.appendChild(boutons);
        grille.appendChild(elt);
      }
    }
  },
  /**
   * Ne coche que le niveau demandé dans les filtres du moteur de recherche.
   * Appelé quand on ouvre un niveau (tuile d'accueil ou URL n=…) : la
   * recherche textuelle qui suit reste alors cantonnée à ce niveau.
   * @param {String} id code du niveau, par exemple "N6"
   */
  cocherNiveauRecherche(id) {
    document
      .querySelectorAll("#searchLevels input[name='searchlevel']")
      .forEach((input) => {
        input.checked = input.value === id;
      });
  },
  /**
   * Création des checkbox pour sélectionner les niveaux dans lesquels chercher.
   */
  createSearchCheckboxes() {
    let dest = document.getElementById("searchLevels");
    const ordre = library.ordre;
    for (const o in ordre) {
      for (let i = 0; i < ordre[o].length; i++) {
        if (
          MM.content[ordre[o][i]].activitiesNumber === undefined ||
          MM.content[ordre[o][i]].activitiesNumber === 0 ||
          i === "activitiesNumber"
        )
          continue;
        const div = utils.create("div");
        const input = utils.create("input", {
          type: "checkbox",
          name: "searchlevel",
          value: ordre[o][i],
          className: "checkbox",
          id: "ccbs" + ordre[o][i],
        });
        input.onclick = () => {
          library.displayContent(document.getElementById("searchinput").value);
          MM.setHistory(
            "MathsMentales filtre : " + ordre[o][i],
            "search=" +
              document.getElementById("searchinput").value +
              "&f=" +
              [...dest.querySelectorAll("input:checked")]
                .map((e) => e.value)
                .join(","),
          );
        };
        const label = utils.create("label", {
          for: "ccbs" + ordre[o][i],
          innerText: MM.content[ordre[o][i]].nom,
        });
        label.onclick = (evt) => {
          document.getElementById(evt.target.for).click();
        };
        div.appendChild(input);
        div.appendChild(label);
        dest.appendChild(div);
      }
    }
  },
  /**
   * Export all carts as string
   * @returns String
   */
  export() {
    let urlString = "";
    // Une activité ouverte dans Paramétrer mais jamais ajoutée au panier doit
    // tout de même partir à l'export : c'est le parcours courant, où l'on
    // clique une activité dans les résultats puis « C'est parti ! ».
    // La substitution se limite au panier vide. Auparavant elle valait aussi
    // pour un panier d'une activité, qu'elle écrasait : le bouton « Au panier »
    // ne renseigne pas editedActivity, si bien qu'on exportait soit une autre
    // activité que celle du panier, soit undefined — et addActivity(undefined)
    // faisait échouer Cart.display sur activity.title.
    if (
      MM.carts.length === 1 &&
      MM.carts[0].activities.length === 0 &&
      MM.editedActivity !== undefined
    ) {
      MM.carts[0].addActivity(MM.editedActivity);
    }
    MM.checkIntro();
    //MM.setSeed();
    //let carts = {};
    for (let i = 0; i < this.carts.length; i++) {
      //carts[i] = this.carts[i].export();
      urlString += this.carts[i].export();
    }
    return urlString; //carts;
  },
  /**
   * export des énoncés et des corrigés vers LibreOffice
   * Le format (Writer ou Impress), le contenu (questions, réponses ou les
   * deux) et la présentation sont lus dans les paramètres de l'onglet
   * « Document ».
   */
  async exportDocument(title) {
    const what = utils.getRadioChecked("radiodoc") || "both";
    const format = utils.getRadioChecked("radiodocformat") || "writer";
    const options = {
      questions: what === "questions" || what === "both",
      answers: what === "answers" || what === "both",
      // suite : questions puis réponses ; page : réponses sur une feuille
      // séparée ; tableau : une ligne par question (n° | question | réponse)
      layout: utils.getRadioChecked("radiodocpres") || "suite",
      numbered: utils.getRadioChecked("radiodocnum") !== "non",
    };
    const sections = readSections(
      document.getElementById("enonce-content"),
      document.getElementById("corrige-content"),
      // Impress n'ancre pas d'objet dans le texte : chaque ligne mêlant texte
      // et formules doit devenir une formule unique
      { fusionMath: format === "impress" },
    );
    if (format === "impress") {
      return generateODP(title, sections, options);
    }
    return generateODT(title, sections, options);
  },
  setURL(string, type) {
    if (utils.baseURL.indexOf("index.html") < 0) utils.baseURL += "index.html";
    if (type === "exosheet") {
      return (
        utils.baseURL.replace("index", "exercices") +
        "?" +
        string +
        (MM.embededIn ? "&embed=" + MM.embededIn : "")
      );
    } else if (type === "assoc") {
      return (
        utils.baseURL.replace("index", "match") +
        "?" +
        string +
        (MM.embededIn ? "&embed=" + MM.embededIn : "")
      );
    } else if (type === "exam") {
      return (
        utils.baseURL.replace("index", "exam") +
        "?" +
        string +
        (MM.embededIn ? "&embed=" + MM.embededIn : "")
      );
    } else if (type === "cansheet") {
      return (
        utils.baseURL.replace("index", "courseauxnombres") +
        "?" +
        string +
        (MM.embededIn ? "&embed=" + MM.embededIn : "")
      );
    } else if (type === "cartesflash") {
      return (
        utils.baseURL.replace("index", "cartesflash") +
        "?" +
        string +
        (MM.embededIn ? "&embed=" + MM.embededIn : "")
      );
    } else if (type === "fichememo") {
      return (
        utils.baseURL.replace("index", "fichememo") +
        "?" +
        string +
        (MM.embededIn ? "&embed=" + MM.embededIn : "")
      );
    } else if (type === "wall") {
      return (
        utils.baseURL.replace("index", "wall") +
        "?" +
        string +
        (MM.embededIn ? "&embed=" + MM.embededIn : "")
      );
    } else if (type === "dominos") {
      return (
        utils.baseURL.replace("index", "dominos") +
        "?" +
        string +
        (MM.embededIn ? "&embed=" + MM.embededIn : "")
      );
    } else if (type === "whogots") {
      return (
        utils.baseURL.replace("index", "jaiquia") +
        "?" +
        string +
        (MM.embededIn ? "&embed=" + MM.embededIn : "")
      );
    } else if (type === "puzzle") {
      return (
        utils.baseURL.replace("index", "puzzle") +
        "?" +
        string +
        (MM.embededIn ? "&embed=" + MM.embededIn : "")
      );
    } else if (type === "duel") {
      return (
        utils.baseURL.replace("index", "duel") +
        "?" +
        string +
        (MM.embededIn ? "&embed=" + MM.embededIn : "")
      );
    } else if (type === "ceinture") {
      return (
        utils.baseURL.replace("index", "ceinture") +
        "?" +
        string +
        (MM.embededIn ? "&embed=" + MM.embededIn : "")
      );
    } else if (type === "diaporama") {
      return (
        utils.baseURL.replace("index", "diaporama") +
        "?" +
        string +
        (MM.embededIn ? "&embed=" + MM.embededIn : "")
      );
    } else
      return (
        utils.baseURL +
        "?" +
        string +
        (MM.embededIn ? "&embed=" + MM.embededIn : "")
      );
  },
  checkIntro: function () {
    MM.introType = utils.getRadioChecked("beforeSlider");
    MM.endType = utils.getRadioChecked("endOfSlideRadio");
  },
  showQuestions: function () {
    // pas de mise au panier implicite : paniersAAfficher() se charge de
    // l'aperçu de l'activité ouverte tant que les paniers sont vides.
    MM.populateQuestionsAndAnswers();
    // MM.showTab(document.querySelector("[numero='#tab-enonce'].tabs-menu-link"));
    /* plus utile
        if (MM.carts.length === 1 && MM.carts[0].activities.length === 1) {
            MM.resetCarts();
            MM.editedActivity.display('sample', this);
        }*/
  },
  showAnswers: function () {
    MM.setSeed();
    MM.populateQuestionsAndAnswers();
    /*MM.showTab(
      document.querySelector("[numero='#tab-corrige'].tabs-menu-link"),
    );
    if (MM.carts.length === 1 && MM.carts[0].activities.length === 1) {
      MM.resetCarts();
      MM.editedActivity.display("sample", this);
    }*/
  },
  setMinimalDisposition: function (index) {
    let radios = document.querySelectorAll("input[name='Enonces']");
    for (let i = 0, l = radios.length; i < l; i++) {
      if (i < index) {
        radios[i].disabled = true;
      } else {
        radios[i].disabled = false;
      }
      if (i === index && MM.slidersNumber <= index + 1) {
        radios[i].checked = true;
        MM.setDispositionEnonce(index + 1);
      }
    }
  },
  /**
   * déclenché par les boutons radio
   * règle l'affichage des disposition dans la fenêtre de paramétrage
   * et indique aux paniers où s'afficher
   * @param {integer} value Nombre de diaporamas à afficher
   */
  setDispositionEnonce: function (value) {
    value = Number(value);
    MM.slidersNumber = value;
    document.getElementById("facetofaceOption").className = "";
    if (value > 1) {
      // si plusieurs diapos, on rend l'audio indisponible
      MM.setAudio(0);
    }
    if (value === 1) {
      document.getElementById("sddiv1").className = "sddiv1";
      document.getElementById("sddiv2").className = "hidden";
      document.getElementById("sddiv3").className = "hidden";
      document.getElementById("sddiv4").className = "hidden";
      document.getElementById("divisionsOption").className = "hidden";
      MM.setDispositionDoubleEnonce("h");
      MM.carts[0].target = [1];
      document.getElementById("facetofaceOption").className = "hidden";
    } else if (value === 2) {
      let directions = document.querySelectorAll("input[name='direction']");
      if (directions[0].checked) {
        // horizontal
        MM.setDispositionDoubleEnonce("h");
      } else {
        MM.setDispositionDoubleEnonce("v");
      }
      if (MM.faceToFace === "y")
        document.getElementById("sddiv1").className = "sddiv2 return";
      else document.getElementById("sddiv1").className = "sddiv2";
      document.getElementById("sddiv2").className = "sddiv2";
      document.getElementById("sddiv3").className = "hidden";
      document.getElementById("sddiv4").className = "hidden";
      document.getElementById("divisionsOption").className = "";
      if (value > MM.carts.length) {
        MM.carts[0].target = [1, 2];
      } else {
        MM.carts[0].target = [1];
        MM.carts[1].target = [2];
      }
    } else if (value === 3) {
      if (MM.faceToFace === "y") {
        document.getElementById("sddiv1").className = "sddiv34 return";
        document.getElementById("sddiv2").className = "sddiv34 return";
      } else {
        document.getElementById("sddiv1").className = "sddiv34";
        document.getElementById("sddiv2").className = "sddiv34";
      }
      document.getElementById("sddiv3").className = "sddiv34";
      document.getElementById("sddiv4").className = "hidden";
      document.getElementById("divisionsOption").className = "hidden";
      MM.setDispositionDoubleEnonce("h");
      if (MM.carts.length === 1) {
        MM.carts[0].target = [1, 2, 3];
      } else if (MM.carts.length === 2) {
        MM.carts[0].target = [1, 2];
        MM.carts[1].target = [3];
      } else {
        MM.carts[0].target = [1];
        MM.carts[1].target = [2];
        MM.carts[2].target = [3];
      }
    } else if (value === 4) {
      if (MM.faceToFace === "y") {
        document.getElementById("sddiv1").className = "sddiv34 return";
        document.getElementById("sddiv2").className = "sddiv34 return";
      } else {
        document.getElementById("sddiv1").className = "sddiv34";
        document.getElementById("sddiv2").className = "sddiv34";
      }
      document.getElementById("sddiv3").className = "sddiv34";
      document.getElementById("sddiv4").className = "sddiv34";
      document.getElementById("divisionsOption").className = "hidden";
      MM.setDispositionDoubleEnonce("h");
      if (MM.carts.length === 1) {
        MM.carts[0].target = [1, 2, 3, 4];
      } else if (MM.carts.length === 2) {
        MM.carts[0].target = [1, 2];
        MM.carts[1].target = [3, 4];
      } else if (MM.carts.length === 3) {
        MM.carts[0].target = [1, 2];
        MM.carts[1].target = [3];
        MM.carts[2].target = [4];
      } else {
        MM.carts[0].target = [1];
        MM.carts[1].target = [2];
        MM.carts[2].target = [3];
        MM.carts[3].target = [4];
      }
    }
    for (let i = 0, l = MM.carts.length; i < l; i++) {
      MM.carts[i].display(MM.carts);
    }
  },
  setDispositionDoubleEnonce: function (option) {
    if (option === "h") {
      MM.slidersOrientation = "h";
      document.getElementById("screen-division").className = "";
      document.querySelector("input[name='direction'][value='h']").checked =
        true;
    } else {
      MM.slidersOrientation = "v";
      document.getElementById("screen-division").className = "vertical";
      document.querySelector("input[name='direction'][value='v']").checked =
        true;
    }
  },
  /* ────────────────────────────────────────────────────────
    4. Chargement via HTTP (si le fichier est servi)
    ──────────────────────────────────────────────────────── */
  async loadFromServer(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Impossible de charger brevet-2025.html");
      const text = await res.text();
      await processContent(text);
    } catch (err) {
      console.error(err);
      alert(
        "Erreur lors du chargement du fichier. Essayez le bouton « Charger ».",
      );
    }
  },
  async addAsCarts(url) {
    const carts = Object.entries(extractCarts(url));
    if (MM.carts.length + carts.length > 4) {
      console.log("Trop de panier !");
      return false;
    }
    let firstIsEmpty = false;
    if (MM.carts[MM.carts.length - 1].activities.length === 0) {
      firstIsEmpty = true;
    }
    for (const [i, cart] of carts) {
      // ajout du panier
      if (i > 0 || !firstIsEmpty) MM.addCart();
      const index = MM.carts.length - 1;
      await MM.carts[index].import(cart);
      MM.carts[index].display();
    }
    MM.setDispositionEnonce(MM.carts.length);
    MM.showTab(document.querySelector("[numero='#tab-parameters']"));
    MM.editActivity(0);
    MM.populateQuestionsAndAnswers();
    toaster("Paniers ajoutés à la sélection");
  },
  /**
   * Ajoute au panier courant (celui sélectionné dans tab-parameters) toutes
   * les activités de tous les paniers de l'entrée d'historique, à la suite
   * des activités déjà présentes. Contrairement à addAsCarts, ne crée aucun
   * nouveau panier.
   */
  async addToCurrentCart(url) {
    const carts = extractCarts(url);
    if (carts === undefined) return false;
    const selectedCart = MM.carts[MM.selectedCart];
    for (const [, cart] of Object.entries(carts)) {
      for (const act of Object.values(cart.a)) {
        const newActivity = await activity.import(
          act,
          selectedCart.activities.length,
          MM.version,
        );
        selectedCart.activities[newActivity[0]] = newActivity[1];
      }
    }
    MM.showTab(document.querySelector("[numero='#tab-parameters']"));
    MM.editActivity(selectedCart.activities.length - 1);
    selectedCart.display();
    MM.populateQuestionsAndAnswers();
    toaster("Activités ajoutées au panier en cours");
  },
};

/* ───────  analyse de lien  ───────────────*/
function extractCarts(url) {
  const vars = utils.getUrlVars(url);
  if (vars.c === undefined) {
    console.log((url, vars));
  }
  return vars.c;
}

/* ───────   Gestion des liens de Révisions ───────────────*/
/* ────────────────────────────────────────────────────────
   1. Extraction des paires i / o
   ──────────────────────────────────────────────────────── */
function extractActivities(url) {
  const vars = utils.getUrlVars(url);
  if (vars.c === undefined) {
    return false;
  }
  return vars.c[0].a;
}

/* ────────────────────────────────────────────────────────
   2. Fonction appelée lorsqu’on clique sur un lien
   ──────────────────────────────────────────────────────── */
async function handleLink(activities) {
  const selectedCart = MM.carts[MM.selectedCart];
  const theactivities = Object.values(activities);
  for (const act of theactivities) {
    let newActivity = await activity.import(
      act,
      selectedCart.activities.length,
      MM.version,
    );
    // if (newActivity.id === undefined) newActivity.id = act.i
    selectedCart.activities[newActivity[0]] = newActivity[1];
  }
  MM.editActivity(selectedCart.activities.length - 1);
  selectedCart.display();
  toaster("Activités copiées dans le panier en cours");
  MM.populateQuestionsAndAnswers();
}

/* ────────────────────────────────────────────────────────
   3. Traitement du fichier HTML
   ──────────────────────────────────────────────────────── */
async function processContent(htmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, "text/html");

  const resultContainer = document.getElementById("resultat-chercher");
  resultContainer.innerHTML = ""; // vide

  // On parcourt tous les <h2>
  const headings = doc.querySelectorAll("h2");
  let first = true;
  headings.forEach((h2) => {
    if (first) {
      first = false;
      return;
    }
    // Clone le titre (et le ajoute au résultat)
    const h2Clone = h2.cloneNode(true);
    resultContainer.appendChild(h2Clone);
    // On suppose que la <ul> vient juste après le <h2>
    let ul = h2.nextElementSibling; // d’abord, on regarde juste après le h2
    if (!ul || ul.tagName !== "UL") {
      ul = h2.parentNode.nextElementSibling; // en 3e, le h2 est dans un <div>, d’où parentNode
    }
    if (ul && ul.tagName === "UL") {
      const ulClone = ul.cloneNode(false); // clone uniquement la balise UL
      // On va construire les <li> à partir des liens
      ul.querySelectorAll("li").forEach((li) => {
        const a = li.querySelector("a");
        if (!a) return; // pas de lien
        const originalHref = a.getAttribute("href");
        const activities = extractActivities(originalHref);
        if (!activities) return;
        // Crée un nouveau <a> cliquable
        const newA = document.createElement("a");
        newA.textContent = a.textContent;
        newA.href = "#";
        newA.addEventListener("click", (e) => {
          e.preventDefault();
          handleLink(activities);
          newA.classList.add("used");
        });

        // Crée le <li> et l’ajoute
        const liClone = document.createElement("li");
        liClone.appendChild(newA);
        ulClone.appendChild(liClone);
      });
      resultContainer.appendChild(ulClone);
    }
  });
}

function toaster(texte) {
  const toastText = document.getElementById("toastText");
  const defaulttext = toastText.innerHTML;
  if (texte !== undefined) toastText.innerHTML = texte;
  toast.classList.add("show");
  setTimeout(function () {
    toast.classList.remove("show");
    toastText.innerHTML = defaulttext;
  }, 3000);
}
