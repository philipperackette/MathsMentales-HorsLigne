import activity from "./activity.js";
import utils from "./utils.js";

export default class cart {
  constructor(id) {
    this.id = id;
    this.activities = [];
    this.ordered = true; // les questions sont présentées par groupe d'activité
    this.sortable = undefined;
    this.editedActivityId = -1;
    this.target = [id]; // Indicates where to display the cart.
    this.nbq = 0;
    this.time = 0;
    this.title = "Diapo " + (id + 1);
    this.loaded = false;
    this.progress = "normal"; // type of progress : 'normal', 'thenanswer', 'withanswer'
    this.showAnswerTime = 10;
    this.randomDraw = false; // tirage aléatoire d'un sous-ensemble de questions du panier
    this.randomCount = 0; // nombre de questions à tirer si randomDraw est actif
  }
  /**
   * Export datas of the cart to put in an url
   * @returns urlString
   */
  export() {
    let urlString =
      "&p=" +
      this.id +
      "~t=" +
      encodeURI(this.title) +
      "~c=" +
      this.target +
      "~o=" +
      this.ordered +
      "~d=" +
      this.progress +
      "~at=" +
      this.showAnswerTime +
      "~sl=" +
      (this.randomDraw ? this.randomCount : 0);
    for (let i = 0, l = this.activities.length; i < l; i++) {
      urlString += "_" + this.activities[i].export();
    }
    return urlString;
  }
  /**
   * Importe un panier et toutes ses activités
   * @param {json} obj objet importé d'un exo téléchargé
   * @param {Boolean} start if true, will make start slideshow when all is ready
   */
  async import(obj, start = false, version) {
    // à revoir
    this.title = obj.t;
    this.target = obj.c;
    if (obj.o === "false" || !obj.o) {
      this.ordered = false;
    } else {
      this.ordered = true;
    }
    if (obj.d === undefined) {
      this.progress = "normal";
      this.showAnswerTime = 2;
    } else {
      this.progress = obj.d;
      this.showAnswerTime = Number(obj.at);
    }
    if (obj.sl === undefined || Number(obj.sl) <= 0) {
      this.randomDraw = false;
      this.randomCount = 0;
    } else {
      this.randomDraw = true;
      this.randomCount = Number(obj.sl);
    }
    // activités, utilise Promise
    let activities = [];
    for (const i in obj.a) {
      activities.push(activity.import(obj.a[i], i, version));
    }
    return await Promise.all(activities)
      .then((data) => {
        data.forEach((table) => {
          this.activities[Number(table[0])] = table[1];
        });
        this.loaded = true;
        // si dans contexte de MM
        /*if(document.querySelector("#tab-parameters") !== null){
                // on crée l'affichage du panier chargé dans le contexte de l'interface de config de MM
                this.display();
            }*/
      })
      .catch((err) => {
        let alert = utils.create("div", {
          id: "messageerreur",
          className: "message",
          innerHTML: "Impossible de charger tous les exercices :(<br>" + err,
        });
        const destmessage = document.getElementById("tab-accueil");
        if (destmessage !== null) destmessage.appendChild(alert);
        else document.body.appendChild(alert);
        setTimeout(() => {
          let div = document.getElementById("messageerreur");
          div.parentNode.removeChild(div);
        }, 3000);
      });
  }
  /**
   *
   * @param {activity} obj instance de activity
   * @param {integer} nbQuestions
   * @param {Array} carts array of instance of cart
   * @param {boolean} refreshDisplay rafraichit l'affichage du panier après ajout
   */
  addActivity(obj, nbQuestions = false, carts, refreshDisplay = true) {
    this.editedActivityId = -1;
    let temp = new activity(obj);
    if (nbQuestions) {
      temp.nbq = nbQuestions;
    }
    this.activities.push(temp);
    if (refreshDisplay) this.display(carts);
  }
}
