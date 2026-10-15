import { utils, _ } from "./utils.js";
import scratchblocks from "../libs/scratchblocks/scratchblocks.min.es.js";
import {
  Chart,
  downloadSVG,
  exportToPNG,
} from "../libs/chartClaude/charts.mjs.js";

import MMmath from "./math.js";
import JXG from "../libs/JSXGraph1.11.1/jsxgraphcore.esm.js";

scratchblocks.loadLanguages({
  fr: {
    commands: {
      MOTION_MOVESTEPS: "avancer de %1 pas",
      MOTION_TURNRIGHT: "tourner @turnRight de %1 degrés",
      MOTION_TURNLEFT: "tourner @turnLeft de %1 degrés",
      MOTION_POINTINDIRECTION: "s'orienter à %1",
      MOTION_POINTTOWARDS: "s'orienter vers %1",
      MOTION_GOTOXY: "aller à x: %1 y: %2",
      MOTION_GOTO: "aller à %1",
      MOTION_GLIDESECSTOXY: "glisser en %1 secondes à x: %2 y: %3",
      MOTION_GLIDETO: "glisser en %1 secondes à %2",
      MOTION_CHANGEXBY: "ajouter %1 à x",
      MOTION_SETX: "mettre x à %1",
      MOTION_CHANGEYBY: "ajouter %1 à y",
      MOTION_SETY: "mettre y à %1",
      MOTION_SETROTATIONSTYLE: "fixer le sens de rotation %1",
      LOOKS_SAYFORSECS: "dire %1 pendant %2 secondes",
      LOOKS_SAY: "dire %1",
      LOOKS_THINKFORSECS: "penser à %1 pendant %2 secondes",
      LOOKS_THINK: "penser à %1",
      LOOKS_SHOW: "montrer",
      LOOKS_HIDE: "cacher",
      LOOKS_SWITCHCOSTUMETO: "basculer sur le costume %1",
      LOOKS_NEXTCOSTUME: "costume suivant",
      LOOKS_NEXTBACKDROP_BLOCK: "arrière-plan suivant",
      LOOKS_SWITCHBACKDROPTO: "basculer sur l'arrière-plan %1",
      LOOKS_SWITCHBACKDROPTOANDWAIT:
        "basculer sur l'arrière-plan %1 et attendre",
      LOOKS_CHANGEEFFECTBY: "ajouter %2 à l'effet %1",
      LOOKS_SETEFFECTTO: "mettre l'effet %1 à %2",
      LOOKS_CLEARGRAPHICEFFECTS: "annuler les effets graphiques",
      LOOKS_CHANGESIZEBY: "ajouter %1 à la taille",
      LOOKS_SETSIZETO: "mettre la taille à %1 % de la taille initiale",
      LOOKS_GOTOFRONTBACK: "aller à l'%1 plan",
      LOOKS_GOFORWARDBACKWARDLAYERS: "déplacer de %2 plans vers l'%1",
      SOUND_PLAY: "jouer le son %1",
      SOUND_CHANGEEFFECTBY: "ajouter %2 à l'effet %1",
      SOUND_SETEFFECTO: "mettre l'effet %1 à %2",
      SOUND_CLEAREFFECTS: "annuler tous les effets sonores",
      SOUND_PLAYUNTILDONE: "jouer le son %1 jusqu'au bout",
      SOUND_STOPALLSOUNDS: "arrêter tous les sons",
      "music.playDrumForBeats": "jouer du tambour %1 pendant %2 temps",
      "music.restForBeats": "faire une pause pendant %1 temps",
      "music.playNoteForBeats": "jouer la note %1 pendant %2 temps",
      "music.setInstrument": "choisir l'instrument n° %1",
      SOUND_CHANGEVOLUMEBY: "ajouter %1 au volume",
      SOUND_SETVOLUMETO: "mettre le volume à %1%",
      "music.changeTempo": "ajouter %1 au tempo",
      "music.setTempo": "mettre le tempo à %1",
      "pen.clear": "effacer tout",
      "pen.stamp": "estampiller",
      "pen.penDown": "stylo en position d'écriture",
      "pen.penUp": "relever le stylo",
      "pen.setColor": "mettre la couleur du stylo à %1",
      "pen.changeHue": "ajouter %1 à la couleur du stylo",
      "pen.setColorParam": "mettre la %1 du stylo à %2",
      "pen.changeColorParam": "ajouter %2 à la %1 du stylo",
      "pen.setHue": "mettre la couleur du stylo à %1",
      "pen.changeShade": "ajouter %1 à l'intensité du stylo",
      "pen.setShade": "mettre l'intensité du stylo à %1",
      "pen.changeSize": "ajouter %1 à la taille du stylo",
      "pen.setSize": "mettre la taille du stylo à %1",
      EVENT_WHENFLAGCLICKED: "quand @greenFlag est cliqué",
      EVENT_WHENKEYPRESSED: "quand la touche %1 est pressée",
      EVENT_WHENTHISSPRITECLICKED: "quand ce sprite est cliqué",
      EVENT_WHENSTAGECLICKED: "quand la scène est cliquée",
      EVENT_WHENBACKDROPSWITCHESTO: "quand l'arrière-plan bascule sur %1",
      EVENT_WHENGREATERTHAN: "quand le %1 > %2",
      EVENT_WHENBROADCASTRECEIVED: "quand je reçois %1",
      EVENT_BROADCAST: "envoyer à tous %1",
      EVENT_BROADCASTANDWAIT: "envoyer à tous %1 et attendre",
      CONTROL_WAIT: "attendre %1 secondes",
      CONTROL_REPEAT: "répéter %1 fois",
      CONTROL_FOREVER: "répéter indéfiniment",
      CONTROL_IF: "si %1 alors",
      CONTROL_WAITUNTIL: "attendre jusqu'à ce que %1",
      CONTROL_REPEATUNTIL: "répéter jusqu'à ce que %1",
      CONTROL_STOP: "stop %1",
      CONTROL_STARTASCLONE: "quand je commence comme un clone",
      CONTROL_CREATECLONEOF: "créer un clone de %1",
      CONTROL_DELETETHISCLONE: "supprimer ce clone",
      SENSING_ASKANDWAIT: "demander %1 et attendre",
      "videoSensing.videoToggle": "%1 la vidéo",
      "videoSensing.setVideoTransparency":
        "mettre la transparence de la vidéo à %1",
      "videoSensing.whenMotionGreaterThan":
        "quand le mouvement de la vidéo > %1",
      SENSING_RESETTIMER: "réinitialiser le chronomètre",
      DATA_SETVARIABLETO: "mettre %1 à %2",
      DATA_CHANGEVARIABLEBY: "ajouter %2 à %1",
      DATA_SHOWVARIABLE: "montrer la variable %1",
      DATA_HIDEVARIABLE: "cacher la variable %1",
      DATA_ADDTOLIST: "ajouter %1 à %2",
      DATA_DELETEOFLIST: "supprimer l'élément %1 de %2",
      DATA_DELETEALLOFLIST: "supprimer tous les éléments de la liste %1",
      MOTION_IFONEDGEBOUNCE: "rebondir si le bord est atteint",
      DATA_INSERTATLIST: "insérer %1 en position %2 de %3",
      DATA_REPLACEITEMOFLIST: "remplacer l'élément %1 de la liste %2 par %3",
      DATA_SHOWLIST: "montrer la liste %1",
      DATA_HIDELIST: "cacher la liste %1",
      SENSING_OF_XPOSITION: "abscisse x",
      SENSING_OF_YPOSITION: "ordonnée y",
      SENSING_OF_DIRECTION: "direction",
      SENSING_OF_COSTUMENUMBER: "numéro de costume",
      LOOKS_COSTUMENUMBERNAME: "%1 du costume",
      SENSING_OF_SIZE: "taille",
      SENSING_OF_BACKDROPNAME: "nom de l'arrière-plan",
      LOOKS_BACKDROPNUMBERNAME: "%1 de l'arrière-plan",
      SENSING_OF_BACKDROPNUMBER: "numéro de l'arrière-plan",
      SOUND_VOLUME: "volume",
      "music.getTempo": "tempo",
      SENSING_TOUCHINGOBJECT: "touche le %1 ?",
      SENSING_TOUCHINGCOLOR: "couleur %1 touchée ?",
      SENSING_COLORISTOUCHINGCOLOR: "couleur %1 touche %2 ?",
      SENSING_DISTANCETO: "distance de %1",
      SENSING_ANSWER: "réponse",
      SENSING_KEYPRESSED: "touche %1 pressée ?",
      SENSING_MOUSEDOWN: "souris pressée ?",
      SENSING_MOUSEX: "souris x",
      SENSING_MOUSEY: "souris y",
      SENSING_SETDRAGMODE: "mettre mode de glissement à %1",
      SENSING_LOUDNESS: "volume sonore",
      "videoSensing.videoOn": "%1 de la vidéo de %2",
      SENSING_TIMER: "chronomètre",
      SENSING_OF: "%1 de %2",
      SENSING_CURRENT: "%1 actuelle",
      SENSING_DAYSSINCE2000: "jours depuis 2000",
      SENSING_USERNAME: "nom d'utilisateur",
      OPERATORS_ADD: "%1 + %2",
      OPERATORS_SUBTRACT: "%1 - %2",
      OPERATORS_MULTIPLY: "%1 * %2",
      OPERATORS_DIVIDE: "%1 / %2",
      OPERATORS_RANDOM: "nombre aléatoire entre %1 et %2",
      OPERATORS_LT: "%1 < %2",
      OPERATORS_EQUALS: "%1 = %2",
      OPERATORS_GT: "%1 > %2",
      OPERATORS_AND: "%1 et %2",
      OPERATORS_OR: "%1 ou %2",
      OPERATORS_NOT: "non %1",
      OPERATORS_JOIN: "regrouper %1 et %2",
      OPERATORS_LETTEROF: "lettre %1 de %2",
      OPERATORS_LENGTH: "longueur de %1",
      OPERATORS_MOD: "%1 modulo %2",
      OPERATORS_ROUND: "arrondi de %1",
      OPERATORS_MATHOP: "%1 de %2",
      OPERATORS_CONTAINS: "%1 contient %2 ?",
      DATA_ITEMOFLIST: "élément %1 de %2",
      DATA_ITEMNUMOFLIST: "position de %1 dans %2",
      DATA_LENGTHOFLIST: "longueur de %1",
      DATA_LISTCONTAINSITEM: "%1 contient %2 ?",
      CONTROL_ELSE: "sinon",
      SENSING_USERID: "id de l'utilisateur",
      SENSING_LOUD: "fort ?",
      "text2speech.speakAndWaitBlock": "prononcer %1",
      "text2speech.setVoiceBlock": "choisir la voix du %1",
      "text2speech.setLanguageBlock": "mettre la langue à %1",
      "translate.translateBlock": "traduire %1 en %2",
      "translate.viewerLanguage": "langue",
      "makeymakey.whenKeyPressed": "quand la touche %1 pressée",
      "makeymakey.whenKeysPressedInOrder": "quand %1 sont pressés dans l'ordre",
      "microbit.whenButtonPressed": "quand le bouton %1 est appuyé",
      "microbit.isButtonPressed": "bouton %1 appuyé ?",
      "microbit.whenGesture": "quand %1",
      "microbit.displaySymbol": "afficher %1",
      "microbit.displayText": "afficher le texte %1",
      "microbit.clearDisplay": "effacer l'écran",
      "microbit.whenTilted": "quand incliné %1",
      "microbit.isTilted": "incliné %1 ?",
      "microbit.tiltAngle": "angle d'inclinaison %1",
      "microbit.whenPinConnected": "quand la broche %1 est connectée",
      "ev3.motorTurnClockwise":
        "faire tourner le moteur %1 dans ce sens-ci pendant %2 secondes",
      "ev3.motorTurnCounterClockwise":
        "faire tourner le moteur %1 dans ce sens-là pendant %2 secondes",
      "ev3.motorSetPower": "mettre la puissance du moteur %1 à %2 %",
      "ev3.getMotorPosition": "position du moteur %1",
      "ev3.whenButtonPressed": "quand le bouton %1 est appuyé",
      "ev3.whenDistanceLessThan": "quand la distance < %1",
      "ev3.whenBrightnessLessThan": "quand la luminosité < %1",
      "ev3.buttonPressed": "bouton %1 appuyé ?",
      "ev3.getDistance": "distance",
      "ev3.getBrightness": "luminosité",
      "ev3.beepNote": "jouer la note %1 pendant %2 secondes",
      "wedo2.motorOn": "allumer %1",
      "wedo2.motorOff": "éteindre %1",
      "wedo2.startMotorPower": "set %1 power to %2",
      "wedo2.setMotorDirection": "mettre la direction de %1 à %2",
      "wedo2.whenDistance": "quand la distance %1 %2",
      "wedo2.getDistance": "distance",
      "wedo2.motorOnFor": "allumer %1 pendant %2 secondes",
      "wedo2.setLightHue": "mettre la couleur de la lampe à %1",
      "wedo2.playNoteFor": "jouer la note %1 pendant %2 secondes",
      "wedo2.whenTilted": "quand incliné %1",
      "wedo2.isTilted": "incliné %1 ?",
      "wedo2.getTiltAngle": "angle d'inclinaison %1",
      "gdxfor.whenGesture": "quand %1",
      "gdxfor.whenForcePushedOrPulled": "quand le capteur de force est %1",
      "gdxfor.getForce": "force",
      "gdxfor.whenTilted": "quand incliné %1",
      "gdxfor.isTilted": "incliné %1 ?",
      "gdxfor.getTilt": "angle d'inclinaison %1",
      "gdxfor.isFreeFalling": "tombe ?",
      "gdxfor.getSpin": "vitesse de rotation %1",
      "gdxfor.getAcceleration": "accélération %1",
      "boost.motorOnFor": "faire tourner le moteur %1 pendant %2 secondes",
      "boost.motorOnForRotation": "faire tourner le moteur %1 de %2 rotations",
      "boost.motorOn": "allumer le moteur %1",
      "boost.motorOff": "éteindre le moteur %1",
      "boost.setMotorPower": "mettre la vitesse du moteur %1 à %2 %",
      "boost.setMotorDirection": "mettre la direction du moteur %1 à %2",
      "boost.getMotorPosition": "position du moteur %1",
      "boost.whenColor": "quand une brique %1 est vue",
      "boost.seeingColor": "brique %1 vue ?",
      "boost.whenTilted": "quand incliné %1",
      "boost.getTiltAngle": "angle d'inclinaison %1",
      "boost.setLightHue": "mettre la couleur de la lampe à %1",
    },
    dropdowns: {},
    ignorelt: [],
    soundEffects: ["hauteur", "stéréo gauche/droite"],
    microbitWhen: ["bougé", "secoué", "sauté"],
    osis: ["autres scripts dans sprite"],
    definePrefix: ["définir"],
    defineSuffix: [],
    palette: {
      Motion: "Mouvement",
      Looks: "Apparence",
      Sound: "Son",
      Events: "Événements",
      Control: "Contrôle",
      Sensing: "Capteurs",
      Operators: "Opérateurs",
      Variables: "Variables",
      "My Blocks": "Mes Blocs",
    },
    math: [
      "abs",
      "plancher",
      "plafond",
      "racine",
      "sin",
      "cos",
      "tan",
      "asin",
      "acos",
      "atan",
      "ln",
      "log",
      "e^",
      "10^",
    ],
    aliases: {
      "tourner gauche de %1 degrés": "MOTION_TURNLEFT",
      "tourner droite de %1 degrés": "MOTION_TURNRIGHT",
      "quand le drapeau vert pressé": "EVENT_WHENFLAGCLICKED",
      fin: "scratchblocks:end",
    },
    name: "Français",
    percentTranslated: 100,
  },
});

// Figures
/**
 * types : 'chart', 'graph', 'svg', 'scratch', 'threejscubes'
 */
export default class Figure {
  constructor(obj, id, target, size) {
    this.type = obj.type;
    this.content = obj.content;
    this.options = obj.options !== undefined ? obj.options : null;
    this.boundingbox = obj.boundingbox;
    this.axis = obj.axis;
    this.grid = obj.grid;
    this.scale = obj.scale !== undefined ? obj.scale : 1; // default scale is 1
    this.xscale = obj.xscale !== undefined ? obj.xscale : 1;
    this.id = id;
    this.keepAspect = obj.keepAspect !== undefined ? obj.keepAspect : true;
    this.size =
      size !== undefined
        ? size
        : obj.size !== undefined && obj.size.length
          ? obj.size
          : undefined; //[w,h]
    this.imgSrc = obj.imgSrc || false;
    this.figure = undefined;
    this.displayed = false;
    this.transformLayer =
      obj.transformLayer !== false ? obj.transformLayer : false;
    this.create(target);
  }
  /**
   * construct de destination DOM element
   * @param {destination} destination DOMelement
   */
  async create(destination) {
    if (this.type === "chart") {
      const div = utils.create("div", { id: this.id });
      if (this.id.indexOf("c") > 0) {
        div.classList.add("corrige");
      }
      destination.appendChild(div);
    } else if (this.type === "graph") {
      const div = document.createElement("div");
      div.id = this.id;
      div.className = "fig";
      if (this.id.indexOf("c") > 0) {
        div.classList.add("corrige");
      }
      destination.appendChild(div);
      // create svg fixed container for jsxgraph temp construction
      this.div2 = document.createElement("div");
      this.div2.id = this.id + "-svgcontainer";
      // suppression d'un éventuel container déjà existant
      const container = document.getElementById(this.id + "-svgcontainer");
      if (container) {
        container.remove();
      }
      const div3 = document.createElement("div");
      div3.id = this.id + "-svg";
      this.div2.appendChild(div3);
      div3.style.width =
        Math.abs(this.boundingbox[2] - this.boundingbox[0]) * 10 * this.scale +
        "px";
      div3.style.height =
        Math.abs(this.boundingbox[3] - this.boundingbox[1]) * 10 * this.scale +
        "px";
      this.div2.style.display = "none";
      document.body.appendChild(this.div2);
    } else if (this.type === "graph3Dcubes") {
      const div = document.createElement("div");
      div.id = this.id;
      div.className = "fig";
      if (this.id.indexOf("c") > 0) {
        div.classList.add("corrige");
      }
      destination.appendChild(div);
      div.style.width =
        Math.abs(this.boundingbox[2] - this.boundingbox[0]) + "em";
      div.style.height =
        Math.abs(this.boundingbox[3] - this.boundingbox[1]) + "em";
      /*
            // create svg fixed container for jsxgraph temp construction
            this.div2 = document.createElement("div");
            this.div2.id = this.id + "-svgcontainer";
            const div3 = document.createElement("div");
            div3.id = this.id + "-svg";
            this.div2.appendChild(div3);
            div3.style.width = Math.abs(this.boundingbox[2] - this.boundingbox[0])+'em'//Math.abs(this.boundingbox[2] - this.boundingbox[0])*10*this.scale + "px";
            div3.style.height = Math.abs(this.boundingbox[3] - this.boundingbox[1])+'em'//Math.abs(this.boundingbox[3] - this.boundingbox[1])*10*this.scale + "px";
            // this.div2.style.display = 'none';
            destination.appendChild(this.div2);
            //document.body.appendChild(this.div2);*/
    } else if (this.type === "svg" || this.type === "img") {
      let div = document.createElement("div");
      div.className = "fig";
      div.id = this.id;
      if (this.id.indexOf("c") > 0) {
        div.classList.add("corrige");
      }
      destination.appendChild(div);
    } else if (this.type === "scratch") {
      let div = document.createElement("div");
      div.className = "scratchblocks";
      div.id = this.id;
      if (this.id.indexOf("c") > 0) {
        div.classList.add("corrige");
      }
      destination.appendChild(div);
    }
    return false;
  }
  /**
   * Crée une copie de la figure dans une nouvelle instance
   * @param {Figure} figure instance d'une figure
   * @returns false si figure n'est pas une instance de figure, sinon la nouvelle instance
   */
  static copyFig(figure, target) {
    if ((!figure) instanceof Figure) {
      return false;
    }
    return new this(figure, figure.id, target, figure.size);
  }
  /**
   * Corrige le placement de l'étiquette d'un angle.
   * JSXGraph calcule le quadrant de l'étiquette (qui détermine de quel côté du
   * point d'ancrage le texte est écrit) par rapport à l'origine du repère et
   * non par rapport au sommet de l'angle : dès que l'angle n'est pas en (0;0),
   * la mesure peut être écrite du mauvais côté, donc loin du codage de l'angle.
   * De plus la table des quadrants de cette version de JSXGraph ne contient que
   * 7 entrées ("bot" manque), ce qui laisse la position indéfinie pour les
   * bissectrices dirigées vers le bas à droite.
   * Enfin JSXGraph écarte l'étiquette de l'arc d'une distance fixe de 12 px,
   * calculée sur la planche de construction, qui fait ici 10 px par unité : cela
   * fait 1,2 unité, souvent plus que le rayon de l'arc lui-même. On la remplace
   * par un écart proportionnel au rayon dessiné.
   * @param {JXG.Angle} angle
   */
  fixAngleLabelPosition(angle) {
    if (!angle || typeof angle.getLabelAnchor !== "function") return;
    const quadrants = [
      "rt",
      "urt",
      "top",
      "ulft",
      "lft",
      "llft",
      "bot",
      "lrt",
    ];
    const getLabelAnchor = angle.getLabelAnchor.bind(angle);
    angle.getLabelAnchor = function () {
      const coords = getLabelAnchor();
      const visProp = this.label ? this.label.visProp : this.visProp.label;
      const position = this.label
        ? this.label.evalVisProp("position")
        : this.evalVisProp("label.position");
      // positions "left"/"right" : JSXGraph place lui-même le texte, on n'y touche pas
      if (
        typeof position === "string" &&
        (position.indexOf("right") > -1 || position.indexOf("left") > -1)
      )
        return coords;
      // la direction calculée par JSXGraph (la bissectrice) est bonne, seule sa
      // longueur est à revoir : on la ramène à 1,12 fois le rayon de l'arc
      const sommet = this.point1.coords.usrCoords;
      let x = coords.usrCoords[1] - sommet[1];
      let y = coords.usrCoords[2] - sommet[2];
      const norme = Math.hypot(x, y);
      const rayon = Number(this.Radius());
      if (norme > 0 && !isNaN(rayon)) {
        x = (x / norme) * rayon * 1.12;
        y = (y / norme) * rayon * 1.12;
      }
      let a = Math.atan2(y, x);
      if (a < 0) a += 2 * Math.PI;
      visProp.position =
        quadrants[Math.floor((a + Math.PI / 8) / (Math.PI / 4)) % 8];
      return new JXG.Coords(
        JXG.COORDS_BY_USER,
        [sommet[1] + x, sommet[2] + y],
        this.board,
      );
    };
  }
  /**
   * Affiche / cache le graphique dans le corrigé
   */
  toggle() {
    let elt;
    if (this.type === "oups")
      // cas oups n'existe pas
      elt = document.getElementById(this.id);
    else if (
      ["graph", "svg", "scratch", "graph3Dcubes", "chart"].indexOf(this.type) >
      -1
    )
      elt = document.getElementById(this.id);
    let cln = elt.className; // div contenant
    if (cln.indexOf("visible") < 0) {
      utils.addClass(elt, "visible");
      this.display();
    } else {
      utils.removeClass(elt, "visible");
    }
  }
  /**
   * Crée la figure
   * @param {window object} destination
   * @returns nothing if displayed yet
   */
  display(destination) {
    if (this.displayed) return;
    else this.displayed = true;
    // destination is the window destination object if defined
    if (this.type === "svg") {
      let target;
      if (destination === undefined) {
        target = document.getElementById(this.id);
      } else {
        target = destination.document.getElementById(this.id);
      }
      target.innerHTML = this.content;
    } else if (this.type === "img") {
      let target;
      if (destination === undefined) {
        target = document.getElementById(this.id);
      } else {
        target = destination.document.getElementById(this.id);
      }
      target.innerHTML = this.content;
    } else if (this.type === "chart") {
      // Chart.js
      let target;
      if (destination === undefined) {
        target = document.getElementById(this.id);
      } else {
        target = destination.document.getElementById(this.id);
      }
      const chartType = this.content.type;
      const chartData = this.content.data;
      const chartLabels = this.content.labels || [];
      const chartOptions = this.content.options || {};
      this.figure = new Chart(chartType, chartData, chartLabels, chartOptions);
      this.figure.style.width = "17em";
      this.figure.style.height = "10em";
      target.appendChild(this.figure);
    } else if (this.type === "graph3Dcubes") {
      try {
        JXG.Options.text.display = "internal";
        if (destination === undefined) {
          this.figure = JXG.JSXGraph.initBoard(this.id, {
            boundingbox: this.boundingbox,
            keepaspectratio: this.keepAspect,
            showNavigation: false,
            showCopyright: false,
            registerEvents: false,
            axis: this.axis,
            grid: this.grid,
            pan: { enabled: false }, // Disable pan for 3D view
            zoom: { enabled: false },
          });
        } else {
          this.figure = destination.JXG.JSXGraph.initBoard(this.id, {
            boundingbox: this.boundingbox,
            keepaspectratio: this.keepAspect,
            showNavigation: false,
            showCopyright: false,
            registerEvents: false,
            axis: this.axis,
            grid: this.grid,
            pan: { enabled: false }, // Disable pan for 3D view
            zoom: { enabled: false },
          });
        }
        this.figure.renderer.svgRoot.setAttribute(
          "viewBox",
          "0 0 " +
            this.figure.renderer.svgRoot.getAttribute("width") +
            " " +
            this.figure.renderer.svgRoot.getAttribute("height"),
        );
        this.figure.renderer.svgRoot.setAttribute("width", "100%");
        this.figure.renderer.svgRoot.setAttribute("height", "100%");
        // création de la vue 3D
        const gridXwidth = this.boundingbox[2] - this.boundingbox[0];
        const gridYwidth = this.boundingbox[1] - this.boundingbox[3];
        const boxX = [0, gridXwidth];
        const boxY = [0, gridYwidth];
        const [lowerleftx, lowerlefty] = [
          this.boundingbox[0] + 1,
          this.boundingbox[3] + 2,
        ];
        const viewBoxSize = [gridXwidth, gridYwidth];
        const view3D = this.figure.create(
          "view3d",
          [[lowerleftx, lowerlefty], viewBoxSize, [boxX, boxY, boxX]],
          {
            projection: "parallel",
            trackball: { enabled: false },
            axesPosition: "center",
            depthOrder: { enabled: true },
            xPlaneRear: { visible: false },
            yPlaneRear: { visible: false },
            zPlaneRear: { visible: false },
            //el:{pointer: true, keyboard: true},
            xAxis: { visible: false },
            yAxis: { visible: false },
            zAxis: { visible: false },
          },
        );
        // Paramètres cube initial
        const r = 1; // arête
        const facesColors = {
          fillColorArray: ["white", "blue", "red", "green", "orange", "yellow"],
          fillOpacity: 1,
          strokeColor: "#333333",
          visible: false,
        };
        // cube de base à translater
        const cubeBase = view3D.create(
          "polyhedron3d",
          [
            {
              a: [0, 0, 0],
              b: [r, 0, 0],
              c: [r, r, 0],
              d: [0, r, 0],
              e: [0, 0, r],
              f: [r, 0, r],
              g: [r, r, r],
              h: [0, r, r],
            },
            [
              ["a", "b", "c", "d"],
              ["a", "b", "f", "e"],
              ["b", "c", "g", "f"],
              ["c", "d", "h", "g"],
              ["d", "a", "e", "h"],
              ["e", "f", "g", "h"],
            ],
          ],
          facesColors,
        );

        for (let onecontent of this.content) {
          const content = utils.clone(onecontent);
          if (content.colors) {
            // remplacement des couleurs par défaut
            facesColors.fillColorArray = content.colors;
          }
          const colorsOptions = { ...facesColors };
          colorsOptions.visible = true;
          if (content.cube) {
            const decalX = (gridXwidth - content.cube) / 2;
            const decalY = (gridYwidth - content.cube) / 2;
            const cube = view3D.create(
              "polyhedron3d",
              [
                cubeBase,
                view3D.create("transform3d", [decalX, decalY, 0], {
                  type: "translate",
                }),
              ],
              colorsOptions,
            );
            for (let i = 0; i < content.cube; i++) {
              for (let j = 0; j < content.cube; j++) {
                for (let z = 0; z < content.cube; z++) {
                  if (z == 0 || z == content.cube - 1) {
                    view3D.create(
                      "polyhedron3d",
                      [
                        cube,
                        view3D.create("transform3d", [i, j, z], {
                          type: "translate",
                        }),
                      ],
                      colorsOptions,
                    );
                  } else if (
                    i == 0 ||
                    i == content.cube - 1 ||
                    j == 0 ||
                    j == content.cube - 1
                  ) {
                    view3D.create(
                      "polyhedron3d",
                      [
                        cube,
                        view3D.create("transform3d", [i, j, z], {
                          type: "translate",
                        }),
                      ],
                      colorsOptions,
                    );
                  }
                }
              }
            }
          }
          if (content.polyedre) {
            view3D.create(
              "polyhedron3d",
              content.polyedre.poly,
              content.polyedre.options,
            );
          }
          if (content.regularpolygon) {
            this.figure.create(
              "regularpolygon",
              content.regularpolygon.poly,
              content.regularpolygon.options
            );
          }
          if (content.mur) {
            // content.mur ['right'|'left', h0, h1, h2, h3, h4, h5] hauteurs des 6 colonnes
            const longueurMur =
              content.mur.indexOf(0) < 0 ? 6 : content.mur.indexOf(0);
            let x = 0,
              z = 0,
              xorz = MMmath.aleaInt(0, 1),
              translate;
            let decalX = xorz ? gridXwidth / 2 : (gridXwidth - longueurMur) / 2;
            let decalY = xorz ? (gridYwidth - longueurMur) / 2 : gridYwidth / 2;
            if (["left", "right"].includes(content.mur[0])) {
              if (content.mur[0] === "left") {
                decalX = 1;
                ((decalY = 1), (xorz = 1));
              } else {
                decalX = 3;
                decalY = 0;
                xorz = 0;
              }
            }
            const cube = view3D.create(
              "polyhedron3d",
              [
                cubeBase,
                view3D.create("transform3d", [decalX, decalY, 0], {
                  type: "translate",
                }),
              ],
              colorsOptions,
            );
            for (const value of content.mur) {
              if (["left", "right"].includes(value)) continue;
              for (let y = 0; y < value; y++) {
                view3D.create(
                  "polyhedron3d",
                  [
                    cube,
                    view3D.create("transform3d", [z, x, y], {
                      type: "translate",
                    }),
                  ],
                  colorsOptions,
                );
              }
              if (xorz) x++;
              else z++;
            }
          }
          if (content.doublemur) {
            // content doublemur [[h0, h1, h2, h3, h4],[h1, h2, h3, h4]]
            let decalX = 3,
              decalY = 1;
            if (content.doublemur.includes("left")) {
              decalX = 3;
              decalY = 0;
            } else if (content.doublemur.includes("right")) {
              decalX = 0;
              decalY = 2;
            }
            const cube = view3D.create(
              "polyhedron3d",
              [
                cubeBase,
                view3D.create("transform3d", [decalX, decalY, 0], {
                  type: "translate",
                }),
              ],
              colorsOptions,
            );
            let indice = 0;
            for (const mur of content.doublemur) {
              if (["right", "left"].indexOf(mur) > -1) continue;
              for (let i = 0, len = mur.length; i < len; i++) {
                for (let j = 0, height = Number(mur[i]); j < height; j++) {
                  view3D.create(
                    "polyhedron3d",
                    [
                      cube,
                      view3D.create(
                        "transform3d",
                        [indice ? 0 : i, indice ? i + 1 : 0, j],
                        { type: "translate" },
                      ),
                    ],
                    colorsOptions,
                  );
                }
              }
              indice++;
            }
          }
          if (content.cubeincomplet) {
            // content doublemur [[h0, h1, h2, h3, h4],[h0, h1, h2, h3, h4]]
            if (
              _.isString(content.cubeincomplet) &&
              content.cubeincomplet.indexOf(",") > 0
            ) {
              content.cubeincomplet = content.cubeincomplet.split(",");
            }
            /*
                        hauteur des colonnes données dans l'ordre suivant :
                        cube 3x3 :  cube 4x4
                        0 3 6       0 4 8  12
                        1 4 7       1 5 9  13
                        2 5 8       2 6 10 14
                                    3 7 11 15
                        */
            let index = 0,
              translate,
              size,
              decalX,
              decalY;
            if (["left", "right"].includes(content.cubeincomplet[0])) {
              if (content.cubeincomplet[0] == "left") {
                decalX = 6;
                decalY = 0;
              } else {
                decalX = 1;
                decalY = 3;
              }
              index = 1;
              size = Math.sqrt(content.cubeincomplet.length - index);
            } else {
              size = Math.sqrt(content.cubeincomplet.length - index);
              decalX = (gridXwidth - size) / 2;
              decalY = (gridYwidth - size) / 2;
            }
            const cube = view3D.create(
              "polyhedron3d",
              [
                cubeBase,
                view3D.create("transform3d", [decalX, decalY, 0], {
                  type: "translate",
                }),
              ],
              colorsOptions,
            );
            for (let x = 0; x < size; x++) {
              for (let z = 0; z < size; z++) {
                for (let y = 0; y < content.cubeincomplet[index]; y++) {
                  view3D.create(
                    "polyhedron3d",
                    [
                      cube,
                      view3D.create("transform3d", [z, x, y], {
                        type: "translate",
                      }),
                    ],
                    colorsOptions,
                  );
                }
                index++;
              }
            }
          }
        }
      } catch (error) {
        console.log("graph3Dcubes", error);
      }
    } else if (this.type === "graph") {
      //JSXGraph
      this.div2.style.display = "block";
      const target = document.getElementById(this.id);
      if (this.svg !== undefined) {
        target.innerHTML = this.svg;
        return;
      }
      try {
        JXG.Options.text.display = "internal";
        if (destination === undefined) {
          this.figure = JXG.JSXGraph.initBoard(this.id + "-svg", {
            boundingbox: this.boundingbox,
            keepaspectratio: this.keepAspect,
            showNavigation: false,
            showCopyright: false,
            registerEvents: false,
            axis: this.axis,
            grid: this.grid,
          });
        } else {
          this.figure = destination.JXG.JSXGraph.initBoard(this.id + "-svg", {
            boundingbox: this.boundingbox,
            keepaspectratio: this.keepAspect,
            showNavigation: false,
            showCopyright: false,
            registerEvents: false,
            axis: this.axis,
            grid: this.grid,
          });
        }
        let content = utils.clone(this.content);
        let elements = [];
        // content est un tableau de tableaux à 2, 3 ou 4 éléments
        // le premier contient le type d'élément à créer
        // le 2e contient la "commande", généralement un tableau de 2 coordonnées, ou éléments
        // le 3e contient les options pour la création (affichage, taille, ...)
        // le 4e contient la référence à un élément précédemment créé pour l'utiliser dans la commande.
        // pour ce 4e, il faut bien compter les contents en partant de zéro.
        for (let i = 0, len = content.length; i < len; i++) {
          let type = content[i][0];
          let commande = content[i][1];
          let options = false;
          let reference = false;
          if (content[i][2] !== undefined) options = content[i][2];
          if (content[i][3] !== undefined) {
            reference = elements[content[i][3]];
            // normalement, il faut remplacer la référence dans la commande
            commande.forEach(function (elt, index) {
              if (typeof elt === "string")
                if (elt.indexOf("ref") === 0) {
                  commande[index] = elements[Number(elt.substr(3))];
                }
            });
          }
          if (type === "functiongraph") {
            let formule = commande;
            let func;

            try {
              // utilisisation d'une formule pour évaluer la formule de manière sécurisée.
              func = new Function("x", `return ${formule};`);
            } catch (e) {
              // on arrête si la formule est invalide
              console.error(
                "Erreur de création de fonction depuis la formule :",
                e,
              );
              return;
            }
            if (!options)
              this.figure.create("functiongraph", [func], { strokeWidth: 2 });
            else this.figure.create("functiongraph", [func], options);
          } else if (type === "jessiescript") {
            if (this.figure.jc === undefined) {
              this.figure.jc = new JXG.JessieCode();
              this.figure.jc.use(this.figure);
            }
            this.figure.jc.parse(commande);
          } else if (
            [
              "angle",
              "axis",
              "circle",
              "glider",
              "grid",
              "image",
              "intersection",
              "line",
              "perpendicular",
              "point",
              "polygon",
              "transform",
              "segment",
              "text",
              "ticks",
              "foreignobject",
              "sector",
            ].indexOf(type) > -1
          ) {
            if (type === "angle") {
              // JSXGraph code un angle droit dès que la mesure est à moins de
              // orthoSensitivity degrés de 90° (1° par défaut) : un angle de 89°
              // recevait donc le codage de l'angle droit.
              if (!options) options = {};
              if (options.orthoSensitivity === undefined)
                options.orthoSensitivity = 0.001;
            }
            if (!options) elements[i] = this.figure.create(type, commande);
            else {
              elements[i] = this.figure.create(type, commande, options);
            }
            if (type === "angle") this.fixAngleLabelPosition(elements[i]);
          } else if (type === "bindTo") {
            // Handle bindTo type to bind an element to another
            const elementToBind = elements[Number(commande[0].substr(3))];
            const elementToFollow = elements[Number(commande[1].substr(3))];
            if (elementToBind && elementToFollow) {
              elementToBind.bindTo(elementToFollow);
              this.figure.update();
            }
          } else if (type === "divideAngle") {
            const angle = (Number(options.angle) * Math.PI) / 180;
            const divisions = Number(options.divisions);
            const angleInit = (Number(options.angleInit) * Math.PI) / 180;
            const center = commande;
            const smallAngle = angle / divisions;
            const radius = Number(options.rayon);
            for (let i = 0; i < divisions; i++) {
              const A1 = this.figure.create(
                "point",
                [
                  5 * Math.cos(angleInit + i * smallAngle),
                  5 * Math.sin(angleInit + i * smallAngle),
                ],
                { visible: false },
              );
              const A2 = this.figure.create(
                "point",
                [
                  5 * Math.cos(angleInit + (i + 1) * smallAngle),
                  5 * Math.sin(angleInit + (i + 1) * smallAngle),
                ],
                { visible: false },
              );
              this.figure.create("angle", [A1, center, A2], {
                orthoType: "sector",
                withLabel: false,
                radius,
                fillColor: options.color,
                strokeColor: "black",
                opacity: options.opacity,
              });
            }
          } else if (type === "fillSquares") {
            const squares = [];
            const width = Number(options.width);
            const height = Number(options.height);
            const qty = Number(options.qty);
            for (let h = 0; h < width; h++) {
              squares.push([].fill(0, 0, height));
            }
            // places commande[2] 1 in the squares array randomly
            const protectLoop = 1000;
            for (let h = 0; h < qty; h++) {
              let ii, jj;
              let test = 0;
              do {
                ii = MMmath.aleaInt(0, width - 1);
                jj = MMmath.aleaInt(0, height - 1);
                test++;
                if (test > protectLoop) {
                  console.log("erreur looping");
                  break;
                }
              } while (squares[ii][jj] === 1);
              squares[ii][jj] = 1;
            }
            const left = Number(options.left);
            const top = Number(options.top);
            const scaleX = Number(options.scaleX ?? 1);
            const scaleY = Number(options.scaleY ?? 1);
            // create squares
            for (let i = 0; i < squares.length; i++) {
              for (let j = 0; j < squares[i].length; j++) {
                if (squares[i][j] === 1) {
                  let a = this.figure.create(
                    "point",
                    [i * scaleX + left, j * scaleY + top],
                    { face: "", label: { visible: false } },
                  );
                  let b = this.figure.create(
                    "point",
                    [(i + 1) * scaleX + left, j * scaleY + top],
                    { face: "", label: { visible: false } },
                  );
                  let c = this.figure.create(
                    "point",
                    [(i + 1) * scaleX + left, (j + 1) * scaleY + top],
                    { face: "", label: { visible: false } },
                  );
                  let d = this.figure.create(
                    "point",
                    [i * scaleX + left, (j + 1) * scaleY + top],
                    { face: "", label: { visible: false } },
                  );
                  this.figure.create("polygon", [a, b, c, d], {
                    fillColor: "black",
                    withLines: false,
                  });
                }
              }
            }
            if (options.allLines) {
              for (let i = 1; i < options.width; i++) {
                this.figure.create(
                  "segment",
                  [
                    [i * scaleX + left, top],
                    [i * scaleX + left, height * scaleY + top],
                  ],
                  { strokeWidth: 1 },
                );
              }
              for (let j = 1; j < options.height; j++) {
                this.figure.create(
                  "segment",
                  [
                    [left, j * scaleY + top],
                    [width * scaleX + left, j * scaleY + top],
                  ],
                  { strokeWidth: 1 },
                );
              }
            }
          } else if (type === "fillSectors") {
            const sectors = [];
            const nbOfCircles = options.centers.length;
            const unitCut = Number(options.unitCut);
            const qty = Number(options.qty);
            const protectLoop = 300;
            const radius = Number(options.radius);
            const allRadius = options.allRadius ?? false;
            for (let i = 0; i < nbOfCircles; i++) {
              sectors.push([].fill(0, 0, unitCut));
            }
            for (let h = 0; h < qty; h++) {
              let ii, jj;
              let test = 0;
              do {
                ii = MMmath.aleaInt(0, nbOfCircles - 1);
                jj = MMmath.aleaInt(0, unitCut - 1);
                test++;
                if (test > protectLoop) {
                  console.log("erreur looping");
                  break;
                }
              } while (sectors[ii][jj] === 1);
              sectors[ii][jj] = 1;
            }
            for (let i = 0; i < sectors.length; i++) {
              for (let j = 0; j < sectors[i].length; j++) {
                if (sectors[i][j] === 1) {
                  const center = options.centers[i];
                  const a = this.figure.create(
                    "point",
                    [
                      center[0] +
                        radius * Math.cos((2 * Math.PI * j) / unitCut),
                      center[1] +
                        radius * Math.sin((2 * Math.PI * j) / unitCut),
                    ],
                    { face: "", label: { visible: false } },
                  );
                  const b = this.figure.create(
                    "point",
                    [
                      center[0] +
                        radius * Math.cos((2 * Math.PI * (j + 1)) / unitCut),
                      center[1] +
                        radius * Math.sin((2 * Math.PI * (j + 1)) / unitCut),
                    ],
                    { face: "", label: { visible: false } },
                  );
                  this.figure.create("sector", [center, a, b], {
                    fillColor: "black",
                    withLines: false,
                  });
                }
              }
            }
            if (allRadius) {
              for (
                let circle = 0, len = options.centers.length;
                circle < len;
                circle++
              ) {
                const center = options.centers[circle];
                for (let j = 0; j < unitCut; j++) {
                  if (sectors[circle][j] === 1) continue;
                  this.figure.create(
                    "segment",
                    [
                      center,
                      [
                        center[0] +
                          radius * Math.cos((2 * Math.PI * j) / unitCut),
                        center[1] +
                          radius * Math.sin((2 * Math.PI * j) / unitCut),
                      ],
                    ],
                    { strokeWidth: 1 },
                  );
                }
              }
            }
          }
        }
        let svg = new XMLSerializer().serializeToString(
          this.figure.renderer.svgRoot,
        );
        // get the svg height value in the svg string
        const height = svg.match(/height="([^"]+)"/)[1];
        // get the svg width value in the svg string
        const width = svg.match(/width="([^"]+)"/)[1];
        // remove the <filter> tag in the svg string
        svg = svg.replace(/<filter.*?<\/filter>/g, "");
        // suppress all font-size:12px; in the svg string
        svg = svg.replace(/font-size: 12px;/g, "");
        svg = svg.replace(/stroke-width="2px"/g, 'stroke-width="2"');
        // add a size="4" in each <text> tag in the svg string
        // Expression régulière pour trouver toutes les balises <text> dans la chaîne SVG
        let regex = /<text.*?>/g;
        // Fonction callback pour remplacer chaque match par le même texte avec l'attribut size="4" ajouté
        let callback = function (match, offset, string) {
          // On cherche les balises <text> qui ne sont pas vides
          if (match.trim().length > 0) {
            return match.slice(0, 5) + ' font-size="10"' + match.slice(6);
          }
          // Si la balise est vide, on l'ignore
          else {
            return match;
          }
        };
        // Utilisation de la méthode replace() pour remplacer chaque élément correspondant à la regex avec le résultat du callback
        svg = svg.replace(regex, callback);
        svg = svg.replace(
          /<svg[^>]*>/,
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
            width +
            " " +
            height +
            '" width="' +
            (width * this.xscale) / 10 / this.scale +
            'em" height="' +
            (height * this.xscale) / 10 / this.scale +
            'em">',
        );
        target.innerHTML = svg;
        this.svg = svg;
        if (
          this.transformLayer !== false &&
          this.transformLayer !== undefined
        ) {
          const layer = target.querySelector(
            "svg > g:nth-of-type(" + (this.transformLayer.id + 1) + ")",
          );
          if (layer !== null) {
            layer.setAttribute("transform", this.transformLayer.transform);
          }
        }
        // remove the div2 from the dom
        this.div2.parentNode.removeChild(this.div2);
      } catch (error) {
        utils.debug("Figure", error, this);
      }
    } else if (this.type === "scratch") {
      const target = document.getElementById(this.id);
      const code = this.content.join("\n");
      const doc = scratchblocks.parse(code, {
        style: "scratch3",
        languages: ["fr"],
      });
      const svg = scratchblocks.render(doc, {
        style: "scratch3",
        languages: ["fr"],
      });
      // calcul de la largeur et de la hauteur de l'image à partir des données du viewbox
      const width = Number(svg.getAttribute("viewBox").split(" ")[2]);
      const height = Number(svg.getAttribute("viewBox").split(" ")[3]);
      const ratio = height / width;
      let reduc = 19;
      if (this.id.indexOf("c") === 0 && this.id.indexOf("cor") === -1)
        reduc = 64;
      const newWidth = width / reduc;
      svg.setAttribute("height", newWidth * ratio + "em");
      svg.setAttribute("width", newWidth + "em");
      target.appendChild(svg);
    }
  }
}
