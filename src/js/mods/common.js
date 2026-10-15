import utils from "./utils.js";
//import MM from "./MM.js";
import seedrandom from "../libs/seedrandom/seedrandom.esm.js";

export { common as default };
const pageOrientations = ["portrait", "paysage"];
const pageWidthes = ["794", "1123"];
let pageFormat = 0;
const btnOrientation = document.getElementById("pageOrientation");
if (btnOrientation !== null) {
  btnOrientation.onclick = (evt) => {
    common.changeOrientation(evt);
  };
}
const common = {
  seed: "0000",
  generateQuestions(params) {
    if (params.doublons === undefined) params.doublons = true;
    // vidage des questions/réponses
    if (params.cart !== undefined) {
      params.cart = this.generateOneQuestion(params.cart, params);
    } else if (params.carts !== undefined) {
      for (let index = 0; index < params.carts.length; index++) {
        params.carts[index] = this.generateOneQuestion(
          params.carts[index],
          params,
        );
      }
    } else {
      console.log("no cart provided");
    }
  },
  generateOneQuestion(cart, params) {
    for (let index = 0; index < cart.activities.length; index++) {
      cart.activities[index].initialize();
    }
    // generate questions and answers
    if (params.doublons) {
      // doublons autorisés
      params.errorDouble = false;
      for (let index = 0; index < cart.activities.length; index++) {
        const activity = cart.activities[index];
        activity.generate();
      }
    } else {
      let answers = [];
      params.errorDouble = false;
      for (let index = 0; index < cart.activities.length; index++) {
        const activity = cart.activities[index];
        let double = false;
        let securite = 100;
        do {
          activity.generate();
          let actanswers = [];
          double = false;
          securite--;
          if (securite < 0) {
            params.errorDouble = true;
          } //console.log(answers,activity.title);break;}
          // vérification qu'il n'y ait pas de doublon
          for (let n = 0; n < activity.values.length; n++) {
            if (
              answers.indexOf(activity.values[n]) > -1 ||
              actanswers.indexOf(activity.values[n]) > -1
            ) {
              double = true;
              break;
            } else {
              actanswers.push(activity.values[n]);
            }
          }
          if (!double) {
            for (let n = 0; n < activity.values.length; n++) {
              answers.push(activity.values[n]);
            }
          }
        } while (double && !params.errorDouble);
      }
    }
    return cart;
  },
  changeOrientation(evt) {
    // suppression du style de page précédent : on ne cible que les styles
    // marqués /*MMentales*/, sinon on supprimerait les styles injectés dans le
    // head par les librairies (scratchblocks entre autres)
    for (const style of document.querySelectorAll("head style")) {
      if (style.textContent && style.textContent.indexOf("MMentales") > -1) {
        style.parentNode.removeChild(style);
      }
    }
    const pagestyle = utils.create("style");
    if (pageFormat === 0) {
      pagestyle.innerHTML = `/*MMentales*/
            @page{
                size:A4 landscape;
                margin:0.8cm;
            }`;
      document.body.setAttribute("layout", "landscape");
    } else {
      pagestyle.innerHTML = `/*MMentales*/
            @page{
                size:A4 portrait;
                margin:0.8cm;
            }`;
      document.body.removeAttribute("layout");
    }
    document.head.appendChild(pagestyle);
    if (evt.target.nodeName === "BUTTON")
      evt.target.innerHTML = pageOrientations[pageFormat];
    pageFormat = (pageFormat + 1) % 2;
  },
  /**
   * Create a string of six alphabetic letters
   * @returns (String) a aleatorycode
   */
  seedGenerator: function () {
    let str = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let code = "";
    for (let i = 0; i < 6; i++) {
      // n'utilise pas l'outil de randomisation dirigée par le seed
      code += str[Math.floor(Math.random() * str.length)];
    }
    return code;
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
   * Crée un grain pour la génération aléatoire des données
   * @param {String} value
   */
  setSeed(value) {
    if (value !== undefined) {
      this.seed = value;
    } else {
      this.seed = this.seedGenerator();
    }
    this.initializeAlea(this.seed);
    return this.seed;
  },
  // Confetti
  launchConfetti() {
    const colors = [
      "#ff6b6b",
      "#ffd166",
      "#06d6a0",
      "#a78bfa",
      "#fb923c",
      "#118ab2",
    ];
    for (let i = 0; i < 100; i++) {
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
  },

  /*,
    checkURL(){
        const vars = utils.getUrlVars();
        if(vars.embed !== undefined){
            // cas d'une activité embeded, on vérifie que l'url est conforme
            let expression =
    /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
            let regex = new RegExp(expression);
            if(vars.embed.match(regex))
                MM.embededIn = vars.embed;
        }
        if(vars.c!==undefined){ // présence de carts MM v2 à lancer ou éditer
            // le seed d'aléatorisation est fourni et on n'est pas en mode online
            if(vars.a){
                common.setSeed(vars.a);
            } else {
                common.setSeed();
            }
            // paramètres des activités des paniers
            let json = vars.c;
            // alcarts contient des promises qu'il faut charger
            let allcarts = [];
            for(const i in json){
                carts[i] = new cart(i);
                allcarts.push(MM.carts[i].import(json[i],false));
            }
            // on attend le résultat de toutes les promesses pour mettre à jour les affichages.
            Promise.all(allcarts).then(data=>{
                makePage();
            }).catch(err=>{
                // erreur à l'importation :(
                let alert=utils.create("div",
                {
                    id:"messageerreur",
                    className:"message",
                    innerHTML:"Impossible de charger les paniers :(<br>"+err
                });
                document.getElementById("creator-content").appendChild(alert);
                // on ferme le message d'alerte après 3 secondes
                setTimeout(()=>{
                    let div=document.getElementById('messageerreur');
                    div.parentNode.removeChild(div);
                },3000);
            });
        }
    }*/
};
