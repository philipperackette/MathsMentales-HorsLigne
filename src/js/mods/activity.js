import "./protos.js"; // extensions Array.prototype (removeValue) utilisées ici
import { utils, _ } from "./utils.js";
import MMmath from "./math.js";
import library from "./library.js";

// lecture des fichiers exercice
/**
* Structure d'un fichier exercice
* {
    'title':'short description',
    'ID':'generatedId',
    'description':'long description',
    'figure': used if graphics
    'options':[{}, {}, ...}], // ojects {"name":"NameOfOption", 'vars':{}, 'question':'pattern'||['pattern0','pattern1',...], answers:'pattern'||[], value:'valuepattern'||[]}
        if one of vars, question, answer or value not defined take it from defaults values on bottom
    'vars':{'a':'pattern', 'b':'pattern', ...}, // pattern can be a list ['value0', 'value1'], or a range "value0_value1", or a list of ranges, Integers, Decimals, letters
    to avoid certains numbers in range, add _^a,b => -5_15_^0,1,-1 will choose integers between -5 and 15 but not 0, 1 or -1
    vars can refer to a previous defined var. You have do prefixed with : like 'b' : ':a+:a' b is the sum of a and a
    'params':{'a':{"label":"texte de la case à cocher","defaut":true}} cases à cocher proposées au professeur ;
        :a vaut true ou false dans les vars, question, answer et value
        "groupe":"intitulé" : les paramètres consécutifs de même groupe sont affichés sous cet intitulé
        "exclut":{"b":3} : case cochée => la valeur 3 est exclue du tirage de la variable b (intervalle entier "min_max")
    'question':'pattern with :a & :b' || [pattern0, pattern1,...] || [[pattern0,pattern1,...], [pattern0,pattern1,...],...]
    'answer':'pattern' || [pattern0, pattern1,...], if question and answer are arrays with same, they are associated 1-1
    'value':'value' or [value0, value1, ...] // accepted values for online answers
}
*/
export default class activity {
  /**
   * Création d'une activité à partir d'un objet javascript ou d'un code d'activité
   * @param {json ou string} obj
   */
  constructor(obj, id = "") {
    if (_.isObject(obj)) {
      this.setParams(obj, id);
    } else if (_.isString(obj)) {
      this.id = obj;
    }
  }
  /**
   *
   * @param {Object} obj objet javascript contenant les paramètres d'une activités
   */
  setParams(obj, id) {
    this.id = id !== "" ? id : obj.id || obj.ID;
    this.type = obj.type; // undefined => latex , "text" can include math, with $$ around
    this.figure = obj.figure; // for graphics description
    this.figureCorrection = obj.figureCorrection;
    this.title = obj.title; // title of de activity
    this.description = obj.description; // long description
    this.speech = obj.speech || false;
    this.vars = obj.vars;
    this.params = obj.params;
    this.consts = obj.consts;
    this.repeat = obj.repeat || false; // question & answers peuvent être répétées ou pas
    this.options = utils.clone(obj.options) || undefined;
    this.questionPatterns = utils.clone(obj.questionPatterns) || obj.question;
    this.shortQuestionPatterns =
      utils.clone(obj.shortQuestionPatterns) || obj.shortq || false;
    this.answerPatterns = utils.clone(obj.answerPatterns) || obj.answer;
    this.valuePatterns = utils.clone(obj.valuePatterns) || obj.value;
    this.questions = utils.clone(obj.questions) || [];
    this.audios = utils.clone(obj.audios) || [];
    this.audioQuestionPatterns =
      utils.clone(obj.audioQuestionPatterns) || obj.audio || false;
    this.audioRead = obj.audioRead || false; // lecture audio si true
    this.audioRepeat = obj.audioRepeat || 1;
    this.shortQuestions = utils.clone(obj.shortQuestions) || [];
    this.answers = utils.clone(obj.answers) || [];
    this.samples = utils.clone(obj.samples) || []; // samples of answers, for online answer
    this.values = utils.clone(obj.values) || [];
    this.figures = utils.clone(obj.figures) || []; // generated figures paramaters
    this.figuresCorrection = utils.clone(obj.figuresCorrection) || []; // generated figures correction paramaters
    this.examplesFigs = {}; // generated graphics from Class Figure
    this.examplesFigsCorr = {}; // generated graphics from Class Figure
    this.chosenOptions = utils.clone(obj.chosenOptions) || []; // options choisies (catégories)
    this.chosenQuestions = utils.clone(obj.chosenQuestions) || {}; // questions parmi les options (sous catégories)
    this.chosenQuestionTypes = utils.clone(obj.chosenQuestionTypes) || []; // pattern parmi les questions
    this.chosenParams = this.defaultParams(); // paramètres (cases à cocher) choisis
    Object.assign(this.chosenParams, utils.clone(obj.chosenParams));
    this.tempo = utils.clone(obj.tempo) || this.Tempo;
    this.nbq = utils.clone(obj.nbq) || this.nombreQuestions;
    this.getOptionHistory = [];
    this.getPatternHistory = { global: [] };
    this.keys = obj.keys || [];
    this.keyBoards = [];
    this.textSize = obj.textSize || false;
    this.valueType = obj.valueType || false;
    this.consigne = obj.consigne || false; // consigne générale de l'activité
  }
  initialize() {
    this.questions = [];
    this.consignes = [];
    this.shortQuestions = [];
    this.answers = [];
    this.values = [];
    this.figures = [];
    this.figuresCorrection = [];
    this.audios = [];
    //this.examplesFigs = {};
    //this.examplesFigsCorr = {};
    this.intVarsHistoric = {};
    this.arraysHistoric = {};
    this.getOptionHistory = [];
    this.getPatternHistory = { global: [] };
    this.keyBoards = [];
  }
  /**
   * Valeurs par défaut des paramètres déclarés dans `params`
   * @returns {Object} {nom: booléen}
   */
  defaultParams() {
    const defauts = {};
    for (const nom in this.params) {
      defauts[nom] = this.params[nom].defaut !== false;
    }
    return defauts;
  }
  get nombreQuestions() {
    if (document.getElementById("nbq-slider"))
      return Number(document.getElementById("nbq-slider").value);
    else return 10;
  }
  set nombreQuestions(value) {
    this.nbq = Number(value);
  }
  get Tempo() {
    if (document.getElementById("tempo-slider"))
      return Number(document.getElementById("tempo-slider").value);
    else return 8;
  }
  set Tempo(value) {
    this.tempo = Number(value);
  }

  /**
   * export data to reproduce the choices another time
   */
  export() {
    /*return {
            i:this.id,
            o:this.chosenOptions,
            q:this.chosenQuestions,
            p:this.chosenQuestionTypes,
            t:this.tempo,
            n:this.nbq
        };*/
    return (
      "i=" +
      this.id +
      (utils.tableToText(this.chosenOptions) !== ""
        ? "~o=" + utils.tableToText(this.chosenOptions)
        : "") +
      (utils.objToText(this.chosenQuestions) !== ""
        ? "~q=" + utils.objToText(this.chosenQuestions)
        : "") +
      (this.chosenQuestionTypes.length > 0
        ? "~p=" + this.chosenQuestionTypes
        : "") +
      this.exportParams() +
      "~t=" +
      this.tempo +
      "~n=" +
      this.nbq +
      (this.audioRead === true
        ? "~au=" + this.audioRead + "~ar=" + this.audioRepeat
        : "")
    );
  }
  /**
   * Paramètres dont la valeur diffère du défaut, au format ~pa=nom.0-nom2.1
   * (les noms ne doivent contenir ni - ni . ni ~ ni =)
   * @returns {string}
   */
  exportParams() {
    const defauts = this.defaultParams();
    const diff = {};
    for (const nom in defauts) {
      if (this.chosenParams[nom] !== defauts[nom]) {
        diff[nom] = [this.chosenParams[nom] ? 1 : 0];
      }
    }
    const texte = utils.objToText(diff);
    return texte !== "" ? "~pa=" + texte : "";
  }
  /**
   * import datas et crée l'objet activité à partir d'un json
   * appelé par l'import de l'activité (utilise Promises)
   *
   * @param (JSON) obj
   * @param (String) id : id de destination de l'activité
   */
  static import(obj, id, version) {
    /* load */
    //let regexp = /^(\d{1,2}|T|G|K|H)/;// le fichier commence par un nombre ou un T pour la terminale
    //let level = regexp.exec(obj.i)[0];
    // const url = activitesURL[obj.i]//"N"+level+"/"+obj.i+".json";
    return library.import(obj.i, version).then(
      (json) => {
        let act = new this(json);
        act.id = obj.i;
        act.chosenOptions = obj.o || [];
        act.chosenQuestionTypes = obj.p || [];
        act.chosenQuestions = obj.q || {};
        for (const nom in obj.pa) {
          if (nom in act.chosenParams) act.chosenParams[nom] = obj.pa[nom][0] === 1;
        }
        act.tempo = obj.t;
        act.nbq = obj.n;
        act.audioRead = obj.au ? true : false;
        act.audioRepeat = obj.ar ? obj.ar : 2;
        return [id, act];
      },
      (err) => {
        utils.debug(err);
      },
    );
  }
  /**
     * Nouvelle façon de faire prochainement
     *
     * async () => {
 await import('library/N11/11MA1.js')
 .then( (exo) => {
   return new activity(exo)
  })
}
     */
  /**
   * getOption
   *
   * return uniqueId (Integer)
   *
   * Tirage au hasard d'un numero d'option parmi celles checkées
   * Si plusieurs options sont disponibles, on va tirer dans les différentes options
   * (qui peuvent avoir été sélectionnées) mélangées pour éviter les répétitions trop suivies
   * Ainsi si les options choisies sont [0,2,5]
   * Les tirages successifs verront se succéder les 3 valeurs avant de les mélanger et
   * de recommencer exemple : [2,0,5] puis [5,2,0] puis [0,5,2]
   *
   */
  getOption() {
    if (!this.options) return false;
    let ret = 0;
    // si l'historique de piochage est vide, on le remplit des options choisies mélangées
    if (this.getOptionHistory.length === 0) {
      if (this.chosenOptions.length === 1) {
        this.getOptionHistory = utils.clone(this.chosenOptions);
      } else if (this.chosenOptions.length > 1) {
        // on pense à cloner la table, sinon celle-ci est touchée par les manipulations suivantes
        this.getOptionHistory = utils.shuffle(utils.clone(this.chosenOptions));
      } else {
        // Array.from(Array(integer).keys()) créé un tableau [0,1,2,...integer-1]
        this.getOptionHistory = utils.shuffle(
          Array.from(Array(this.options.length).keys()),
        );
      }
    }
    // on prend la première option de l'historique
    ret = this.getOptionHistory[0];
    // on supprime la première option de l'historique
    this.getOptionHistory.shift();
    return ret;
  }
  /**
   * Journalise sans jamais interrompre la génération.
   * utils.debug lève une exception quand utils.modeDebug est vrai et qu'aucun
   * div #errors n'est présent — c'est le cas de toutes les pages sauf
   * editor.html et editoryaml.html. Sans ce garde-fou, un simple avertissement
   * ("pas assez de données pour éviter les répétitions") avorte le diaporama
   * entier au lieu de le raccourcir.
   * @param {...any} args
   */
  warn(...args) {
    try {
      utils.debug(...args);
    } catch (error) {
      /* signalement impossible sur cette page : on continue */
    }
  }
  /**
   * Cherche une valeur dans une liste, y compris quand il s'agit d'un tableau.
   * indexOf compare les tableaux par référence et ne trouve donc jamais rien :
   * les activités dont value est un tableau (97 sur 431) échappaient
   * entièrement à la détection des répétitions.
   * @param {Array} liste
   * @param {*} valeur
   * @returns {boolean}
   */
  contient(liste, valeur) {
    if (typeof valeur !== "object" || valeur === null) {
      return liste.indexOf(valeur) > -1;
    }
    const cherche = JSON.stringify(valeur);
    return liste.some((element) => JSON.stringify(element) === cherche);
  }
  setMath(content) {
    if (this.type === undefined || this.type === "latex") {
      return "$$" + content + "$$";
    } else return content;
  }

  replaceQuestionInAnswer(answer, question) {
    // check if question as to be written in answer or shortquestion
    // index needed to find the question
    // if :question|5 suppress the last 5 caracters
    // if :question|-5 suppress the 5 firsts caracters
    let regex = /:question(\|(\-{0,1}(\d)+))*/;
    let detection;
    let questionATraiter = _.isArray(question) ? [...question] : question;
    if (_.isArray(questionATraiter)) {
      for (const [index, q] of questionATraiter.entries()) {
        questionATraiter[index] = String(q).replace(/\$\$/g, "$$$$$$$$");
      }
    } else if (String(questionATraiter).indexOf("$$") > -1) {
      questionATraiter = questionATraiter.replace(/\$\$/g, "$$$$$$$$");
    }
    if (_.isArray(answer) && _.isArray(questionATraiter)) {
      // same sizes
      for (const [index, ans] of answer.entries()) {
        if ((detection = ans.match(regex)) !== null) {
          if (detection[2] !== undefined) {
            const numberOfCaracteresToDelete = -Number(detection[2]);
            if (numberOfCaracteresToDelete < 0)
              answer[index] = ans.replace(
                regex,
                questionATraiter[index].slice(0, numberOfCaracteresToDelete),
              );
            else
              answer[index] = ans.replace(
                regex,
                questionATraiter[index].slice(numberOfCaracteresToDelete),
              );
          } else answer[index] = ans.replace(regex, questionATraiter[index]);
        }
      }
      return answer;
    } else if (_.isString(answer) && _.isArray(questionATraiter)) {
      if ((detection = answer.match(regex)) !== null) {
        const listOfAnswers = [];
        for (const [index, quest] of questionATraiter.entries()) {
          if (detection[2] !== undefined) {
            const numberOfCaracteresToDelete = -Number(detection[2]);
            if (numberOfCaracteresToDelete < 0)
              listOfAnswers[index] = answer.replace(
                regex,
                questionATraiter[index].slice(0, numberOfCaracteresToDelete),
              );
            else
              listOfAnswers[index] = answer.replace(
                regex,
                questionATraiter[index].slice(numberOfCaracteresToDelete),
              );
          } else
            listOfAnswers[index] = answer.replace(
              regex,
              questionATraiter[index],
            );
        }
        return listOfAnswers;
      } else return answer;
    } else if (_.isArray(answer) && _.isString(questionATraiter)) {
      for (const [index, ans] of answer.entries()) {
        if ((detection = ans.match(regex)) !== null) {
          if (detection[2] !== undefined) {
            const numberOfCaracteresToDelete = -Number(detection[2]);
            if (numberOfCaracteresToDelete < 0)
              answer[index] = ans.replace(
                regex,
                questionATraiter.slice(0, numberOfCaracteresToDelete),
              );
            else
              answer[index] = ans.replace(
                regex,
                questionATraiter.slice(numberOfCaracteresToDelete),
              );
          } else answer[index] = ans.replace(regex, questionATraiter);
        }
      }
      return answer;
    } else if (_.isString(answer) && _.isString(questionATraiter)) {
      if ((detection = answer.match(regex)) !== null) {
        if (detection[2] !== undefined) {
          const numberOfCaracteresToDelete = -Number(detection[2]);
          if (numberOfCaracteresToDelete < 0)
            answer = answer.replace(
              regex,
              questionATraiter.slice(0, numberOfCaracteresToDelete),
            );
          else
            answer = answer.replace(
              regex,
              questionATraiter.slice(numberOfCaracteresToDelete),
            );
        } else answer = answer.replace(regex, questionATraiter);
      }
      return answer;
    } else return answer;
  }
  /**
   * getPattern
   * récupère 1 pattern unique
   * @param {integer} option id de l'option dont dépend le pattern
   *
   * return uniqueId (Integer)
   */
  getPattern(option) {
    // l'utilisateur a choisi plusieurs types de questions, on prend l'une des valeurs
    if (this.chosenQuestionTypes.length > 0) {
      if (this.getPatternHistory.global.length === 0) {
        this.getPatternHistory.global = utils.shuffle(
          utils.clone(this.chosenQuestionTypes),
        );
      }
      let ret = this.getPatternHistory.global[0];
      this.getPatternHistory.global.shift();
      return ret;
    }
    // no option mais plusieurs pattern possibles
    if (option === false && Array.isArray(this.questionPatterns)) {
      if (this.getPatternHistory.global.length === 0) {
        this.getPatternHistory.global = utils.shuffle(
          Array.from(Array(this.questionPatterns.length).keys()),
        );
      }
      let ret = this.getPatternHistory.global[0];
      this.getPatternHistory.global.shift();
      return ret;
    }
    if (option === false) return false;
    // if option, patterns ?
    if (!Array.isArray(this.chosenQuestions[option])) {
      this.chosenQuestions[option] = [];
    }
    if (!Array.isArray(this.getPatternHistory[option])) {
      this.getPatternHistory[option] = [];
    }
    // no pattern chosen : we choose one
    if (
      this.chosenQuestions[option].length === 0 &&
      Array.isArray(this.options[option].question)
    ) {
      if (this.getPatternHistory[option].length === 0) {
        this.getPatternHistory[option] = utils.shuffle(
          Array.from(Array(this.options[option].question.length).keys()),
        );
      }
      let ret = this.getPatternHistory[option][0];
      this.getPatternHistory[option].shift();
      return ret;
    } else if (
      this.chosenQuestions[option].length === 0 &&
      !this.options[option].question &&
      Array.isArray(this.questionPatterns)
    ) {
      // no question in option, but global question is an array
      if (this.getPatternHistory.global.length === 0) {
        this.getPatternHistory.global = utils.shuffle(
          Array.from(Array(this.questionPatterns.length).keys()),
        );
      }
      let ret = this.getPatternHistory.global[0];
      this.getPatternHistory.global.shift();
      return ret;
    } else if (this.chosenQuestions[option].length > 0) {
      // list of patterns chosen, we pick one
      if (this.getPatternHistory[option].length === 0) {
        this.getPatternHistory[option] = utils.shuffle(
          utils.clone(this.chosenQuestions[option]),
        );
      }
      let ret = this.getPatternHistory[option][0];
      this.getPatternHistory[option].shift();
      return ret;
    } else return false;
  }

  /**
   *
   * @param {integer} value index of the choosen question type
   * @param {boolean} check true if check, false if not
   */
  setQuestionType(value, check) {
    let questionId = Number(value);
    if (check) {
      // not already chosen
      if (this.chosenQuestionTypes.indexOf(questionId) < 0) {
        this.chosenQuestionTypes.push(questionId);
      }
    } else {
      this.chosenQuestionTypes.removeValue(questionId);
    }
  }
  /**
   *
   * @param {string} chaine : chaine où se trouve la variable
   * @param {integer} index :
   */
  replaceVars(chaine, questiontext) {
    function onlyVarw(all, p1, p2, decal, chaine) {
      return "this.wVars['" + p1 + "']" + p2;
    }
    function onlyVarc(all, p1, p2, decal, chaine) {
      return "this.cConsts['" + p1 + "']" + p2;
    }
    if (typeof chaine === "string") {
      // ajout 23/08/2025 on peut définir les variables en dehors des ${} pour plus de facilité.
      // on remplace tous les :a1 en ${:a1}
      // sauf :href et :xlink qui sont utilisés pour les liens dans les figures svg
      chaine = utils.convertToPointVar(chaine);
      for (const c in this.wVars) {
        let regex = new RegExp(":(" + c + ")([^\\w\\d])", "g");
        chaine = chaine.replace(regex, onlyVarw);
      }
      for (const c in this.cConsts) {
        let regex = new RegExp(":(" + c + ")([^\\w\\d])", "g");
        chaine = chaine.replace(regex, onlyVarc);
      }
      //debug("Chaine à parser", chaine);
      let result = "";
      // doublage des \ caractères d'échapement.
      try {
        // Construire les paramètres nommés pour new Function()
        const fnArgs = [];
        const fnVals = [];

        // Exposer wVars, cConsts, MMmath et utils dans le scope de la fonction
        fnArgs.push("wVars", "cConsts", "MMmath", "utils");
        fnVals.push(this.wVars, this.cConsts, MMmath, utils);

        // Remplacer this.wVars['x'] → wVars['x'] dans la chaîne
        let body = chaine
          .replace(/\\/g, "\\\\")
          .replace(/this\.wVars/g, "wVars")
          .replace(/this\.cConsts/g, "cConsts");

        // Créer la fonction qui évalue le template literal
        const fn = new Function(...fnArgs, "return `" + body + "`;");
        result = fn(...fnVals);
        //result = eval("`" + chaine.replace(/\\/g, "\\\\") + "`");
      } catch (error) {
        this.warn(error, "Error replacing vars with " + chaine);
        this.warn(this.wVars, this.cConsts, this.id);
        // le gabarit fautif est renvoyé tel quel : il reste visible à l'écran,
        // au lieu de laisser un trou silencieux dans la question
        return chaine;
      }
      // return number if this is one
      // On convertit dans deux cas seulement :
      //  - la conversion est réversible, donc sans perte ("7", "-3", " 7 ") ;
      //  - l'auteur a écrit une notation exponentielle, qu'il veut justement
      //    voir normalisée — 5NC4 construit "${:n+'e'+:e}" et attend -1.6.
      // Sinon on garde la chaîne : parseFloat détruirait l'écriture voulue.
      // "12.50" -> 12.5 (zéro final perdu), "05" -> 5, "0x10" -> 0,
      // "0.00000001" -> 1e-8 (que l'élève ne saisira jamais ainsi).
      if (!isNaN(result) && result !== "" && result.indexOf("+") < 0) {
        const brut = result.trim();
        const nombre = parseFloat(brut);
        const hexadecimal = /^[+-]?0[xX]/.test(brut);
        if (!hexadecimal && (String(nombre) === brut || /[eE]/.test(brut))) {
          return nombre;
        }
        return result;
      } else if (result === "true" || result === "false") {
        // return true or false if this is a boolean
        return result === "true";
      } else return result;
    } else if (typeof chaine === "object") {
      // case 1 : it's an array
      if (_.isArray(chaine)) {
        for (let i = 0; i < chaine.length; ++i) {
          chaine[i] = this.replaceVars(chaine[i], questiontext);
        }
        // case 2 : it's an object
      } else
        for (const i in chaine) {
          chaine[i] = this.replaceVars(chaine[i], questiontext);
        }
      return chaine;
    } else return chaine;
  }
  /**
   * Prépare tout l'état de travail (this.c*) pour une question : consigne,
   * variables, constantes, énoncé, réponse, valeur attendue, figures, clavier.
   * @param {integer|false} optionNumber
   * @param {integer|false} patternNumber
   * @returns {integer|false} lenQ : nombre de patterns d'énoncé disponibles
   */
  resolveOption(optionNumber, patternNumber) {
    let lenQ = false;
    // remise à zéro systématique : plusieurs branches ci-dessous n'affectent
    // pas ces champs, et sans cela l'état d'une option fuit vers la suivante
    this.cFigure = undefined;
    this.cFigureCorrection = undefined;
    this.ckeyBoard = undefined;
    this.cConsigne = undefined;
    this.cShortQ = false;
    this.cAudio = false;

    if (optionNumber === false) {
      this.cVars = this.vars;
      this.cConsts = utils.clone(this.consts);
      if (patternNumber !== false) {
        this.cQuestion = this.questionPatterns[patternNumber];
        this.cShortQ = this.shortQuestionPatterns[patternNumber] || false;
        this.cAudio = this.audioQuestionPatterns[patternNumber] || false;
      } else {
        this.cQuestion = this.questionPatterns;
        this.cShortQ = this.shortQuestionPatterns || false;
        this.cAudio = this.audioQuestionPatterns || false;
      }
      if (
        Array.isArray(this.answerPatterns) &&
        this.answerPatterns.length === this.questionPatterns.length
      ) {
        this.cAnswer = this.answerPatterns[patternNumber];
      } else {
        this.cAnswer = this.answerPatterns;
      }
      this.cValue = this.valuePatterns ? this.valuePatterns : this.cAnswer;
      if (this.figure !== undefined) this.cFigure = utils.clone(this.figure);
      if (this.figureCorrection !== undefined) {
        this.cFigureCorrection = utils.clone(this.figureCorrection);
      }
      if (this.keys !== undefined) this.ckeyBoard = this.keys;
      return lenQ;
    }

    const option = this.options[optionNumber];
    // set consigne si existe
    if (option.consigne !== undefined) {
      this.cConsigne = option.consigne;
    } else if (this.consigne !== undefined) {
      this.cConsigne = this.consigne;
    }
    // set chosen vars : les variables globales d'abord, celles de l'option
    // ensuite — donc une variable globale ne peut pas référencer une variable
    // d'option, la résolution suivant l'ordre d'insertion
    if (option.vars === undefined) {
      this.cVars = this.vars;
    } else if (this.vars !== undefined) {
      this.cVars = Object.assign({}, this.vars, option.vars);
    } else {
      this.cVars = option.vars;
    }
    if (option.consts === undefined) {
      this.cConsts = utils.clone(this.consts);
    } else if (this.consts !== undefined) {
      this.cConsts = Object.assign(
        {},
        utils.clone(this.consts),
        utils.clone(option.consts),
      );
    } else {
      this.cConsts = utils.clone(option.consts);
    }
    // énoncé : défini dans l'option ou globalement, avec ou sans pattern
    if (patternNumber !== false) {
      if (option.question !== undefined) {
        if (Array.isArray(option.question)) {
          this.cQuestion = option.question[patternNumber];
          lenQ = option.question.length;
          if (option.shortq !== undefined) {
            this.cShortQ = option.shortq[patternNumber] || false;
          }
          if (option.audio !== undefined) {
            this.cAudio = option.audio[patternNumber] || false;
          }
        } else {
          this.cQuestion = option.question;
          if (option.shortq !== undefined) this.cShortQ = option.shortq;
          if (option.audio !== undefined) this.cAudio = option.audio;
        }
      } else {
        this.cQuestion = this.questionPatterns[patternNumber];
        this.cShortQ = this.shortQuestionPatterns[patternNumber] || false;
        this.cAudio = this.audioQuestionPatterns[patternNumber] || false;
        lenQ = this.questionPatterns.length;
      }
    } else if (option.question === undefined) {
      this.cQuestion = this.questionPatterns;
      this.cShortQ = this.shortQuestionPatterns || false;
      this.cAudio = this.audioQuestionPatterns || false;
    } else {
      this.cQuestion = option.question;
      this.cShortQ = option.shortq || false;
      this.cAudio = option.audio || false;
    }
    // réponse et valeur attendue en ligne
    this.cAnswer =
      option.answer === undefined ? this.answerPatterns : option.answer;
    if (option.value === undefined) {
      this.cValue = this.valuePatterns ? this.valuePatterns : this.cAnswer;
    } else {
      this.cValue = option.value;
    }
    if (Array.isArray(this.cAnswer) && lenQ) {
      // autant de réponses que de types de questions : appariement 1 <-> 1
      if (this.cAnswer.length === lenQ) {
        this.cAnswer = this.cAnswer[patternNumber];
      } else {
        this.cAnswer = this.cAnswer[MMmath.aleaInt(0, this.cAnswer.length - 1)];
      }
      // Array.isArray indispensable : sur une chaîne, .length est sa longueur
      // en caractères et l'indexation renverrait une seule lettre
      if (Array.isArray(this.cValue) && this.cValue.length === lenQ) {
        this.cValue = this.cValue[patternNumber];
      }
    }
    // figures et clavier (optionnels)
    if (option.figure !== undefined) {
      this.cFigure = utils.clone(option.figure);
    } else if (this.figure !== undefined) {
      this.cFigure = utils.clone(this.figure);
    }
    if (option.figureCorrection !== undefined) {
      this.cFigureCorrection = utils.clone(option.figureCorrection);
    } else if (this.figureCorrection !== undefined) {
      this.cFigureCorrection = utils.clone(this.figureCorrection);
    }
    if (option.keys !== undefined) {
      this.ckeyBoard = option.keys;
    } else if (this.keys !== undefined) {
      this.ckeyBoard = this.keys;
    }
    return lenQ;
  }
  /**
   * Ajoute à un intervalle entier les valeurs exclues par les paramètres
   * cochés (champ "exclut" de params).
   * @param {string} name nom de la variable
   * @param {string} spec intervalle "min_max[_quantité][_^exclusions]"
   * @returns {string} intervalle complété
   */
  avecExclusions(name, spec) {
    const exclues = [];
    for (const nom in this.params) {
      const exclut = this.params[nom].exclut;
      if (this.chosenParams[nom] && exclut && exclut[name] !== undefined) {
        exclues.push(exclut[name]);
      }
    }
    if (exclues.length === 0 || spec.split("_")[0].indexOf("d") > -1) {
      return spec;
    }
    const bornes = spec.split("_");
    const i = bornes.findIndex((b) => b.startsWith("^"));
    if (i > -1) bornes[i] += "," + exclues.join(",");
    else bornes.push("^" + exclues.join(","));
    return bornes.join("_");
  }
  /**
   * Tire une valeur pour une variable définie par un intervalle
   * "min_max", "min_max_quantité", "min_max_quantité_^exclusions",
   * ou "dmin_max_précision" pour un décimal.
   * @param {string} name nom de la variable (clé de l'historique)
   * @param {string} spec
   */
  drawFromRange(name, spec) {
    const bornes = spec.split("_");
    if (bornes[0].indexOf("d") > -1) {
      // cas décimal
      return MMmath.aleaFloat(
        Number(bornes[0].substring(1)),
        Number(bornes[1]),
        Number(bornes[2]),
        bornes[3],
        bornes[4],
      );
    }
    // cas entier : on tient un historique des valeurs déjà sorties et on
    // tourne dessus, pour éviter qu'une même valeur revienne trop souvent.
    // Il faut donc compter les valeurs possibles.
    if (this.intVarsHistoric[name] === undefined) {
      let nbValues = Math.abs(Number(bornes[1]) - Number(bornes[0])) + 1;
      const max = Math.max(Number(bornes[0]), Number(bornes[1]));
      const min = Math.min(Number(bornes[0]), Number(bornes[1]));
      const primes = [];
      let objContraintes = false;
      if (bornes[2] && bornes[2].indexOf("^") > -1) objContraintes = bornes[2];
      if (bornes[3] && bornes[3].indexOf("^") > -1) objContraintes = bornes[3];
      if (objContraintes) {
        const liste = objContraintes.substring(1).split(",");
        // on liste les nombres premiers à éviter
        if (liste.indexOf("prime") > -1) {
          for (let i = 0; i < MMmath.premiers.length; i++) {
            if (MMmath.premiers[i] <= max && MMmath.premiers[i] >= min) {
              primes.push(MMmath.premiers[i]);
            } else if (MMmath.premiers[i] > max) {
              break;
            }
          }
        }
        nbValues =
          nbValues -
          liste.length -
          primes.length +
          (liste.indexOf("prime") > -1 ? 1 : 0) +
          (liste.indexOf("&") > -1 ? 1 : 0);
      }
      this.intVarsHistoric[name] = [];
      this.intVarsHistoric[name + "-length"] = nbValues;
    }
    // Quand une quantité est demandée ("1_9_2_^&"), aleaInt renvoie un tableau :
    // indexOf comparerait des références et ne trouverait jamais rien.
    // L'historique ne sait dédoublonner que des scalaires, on le court-circuite
    // explicitement plutôt que de le laisser se remplir d'objets inertes.
    if (Number(bornes[2]) > 1) {
      return MMmath.aleaInt(
        Number(bornes[0]),
        Number(bornes[1]),
        bornes[2],
        bornes[3],
      );
    }
    let entier;
    let protectionLoop = 0;
    // on tire tant que la valeur est déjà dans l'historique
    do {
      entier = MMmath.aleaInt(
        Number(bornes[0]),
        Number(bornes[1]),
        bornes[2],
        bornes[3],
      );
      protectionLoop++;
      if (protectionLoop > 100) break;
    } while (this.intVarsHistoric[name].indexOf(entier) > -1);
    this.intVarsHistoric[name].push(entier);
    // historique plein : on le vide pour repartir sur toutes les valeurs
    if (
      this.intVarsHistoric[name].length >=
      this.intVarsHistoric[name + "-length"]
    ) {
      this.intVarsHistoric[name].splice(0);
    }
    return entier;
  }
  /**
   * Génère une valeur concrète pour chaque variable de this.cVars.
   * Les variables sont résolues dans leur ordre d'insertion : une variable
   * ne peut référencer que celles définies avant elle.
   */
  resolveVars() {
    // remise à zéro à chaque question : sans cela les variables d'une option
    // survivent aux questions tirées sur une autre option, et une variable
    // absente de l'option courante se résout sur une valeur périmée
    this.wVars = {};
    // paramètres cochés par le professeur, utilisables dans toutes les vars
    for (const nom in this.params) {
      this.wVars[nom] = this.chosenParams[nom] !== false;
    }
    for (const name in this.cVars) {
      this.wVars[name] = this.cVars[name];
      if (
        typeof this.wVars[name] === "string" &&
        this.wVars[name].indexOf("${") > -1
      ) {
        // la variable est définie à partir d'autres variables
        this.wVars[name] = this.replaceVars(this.wVars[name]);
      }
      if (typeof this.wVars[name] === "object") {
        // liste de valeurs : on en tire une, en évitant les répétitions.
        // Les éléments peuvent eux-mêmes contenir des variables.
        if (this.arraysHistoric[name] === undefined) {
          this.arraysHistoric[name] = [];
          this.arraysHistoric[name + "-length"] = this.wVars[name].length;
        }
        let protectionLoop = 0;
        let entier = 0;
        do {
          entier = MMmath.aleaInt(0, this.wVars[name].length - 1);
          protectionLoop++;
          if (protectionLoop > 100) break; // tant pis, on sort de la boucle
        } while (this.arraysHistoric[name].indexOf(entier) > -1);
        this.arraysHistoric[name].push(entier);
        // clone obligatoire : replaceVars réécrit les tableaux et objets en
        // place. Sans clone, une valeur tirée qui est elle-même un tableau
        // (listes de listes : cols, hx, hy... de 5GA3) verrait ses gabarits
        // "${:h0}" remplacés définitivement dans this.vars, et toutes les
        // questions suivantes rejoueraient les valeurs de la première.
        this.wVars[name] = this.replaceVars(
          utils.clone(this.wVars[name][entier]),
        );
        if (
          this.arraysHistoric[name].length >=
          this.arraysHistoric[name + "-length"]
        ) {
          this.arraysHistoric[name].splice(0);
        }
      } else if (
        typeof this.wVars[name] === "string" &&
        this.wVars[name].includes("_")
      ) {
        this.wVars[name] = this.drawFromRange(
          name,
          this.avecExclusions(name, this.wVars[name]),
        );
      }
    }
    // des variables peuvent être utilisées dans les constantes. Bizarre, mais pratique.
    if (this.cConsts !== undefined) {
      this.cConsts = this.replaceVars(this.cConsts);
      // il faut retraiter les wVars au cas où elles contiennent des constantes
      this.wVars = this.replaceVars(this.wVars);
    }
  }
  /**
   * Construit une figure prête à dessiner à partir de sa définition, en
   * substituant les variables. Une seule implémentation pour les quatre
   * usages : figure et figure de correction, en génération et en aperçu.
   * @param {Object|undefined} definition
   * @returns {Object|undefined}
   */
  buildFigure(definition) {
    if (definition === undefined) return undefined;
    const figure = {
      type: definition.type,
      content: this.replaceVars(utils.clone(definition.content)),
      transformLayer: this.replaceVars(utils.clone(definition.transformLayer)),
    };
    if (definition.size !== undefined) {
      figure.size = this.replaceVars(utils.clone(definition.size));
    }
    if (definition.type === "graph" || definition.type === "graph3Dcubes") {
      return {
        boundingbox: this.replaceVars(definition.boundingbox),
        axis: definition.axis,
        scale: definition.scale,
        xscale: definition.xscale,
        grid: definition.grid ? definition.grid : false,
        keepAspect:
          definition.keepAspect !== undefined ? definition.keepAspect : true,
        ...figure,
      };
    }
    return figure;
  }
  /**
   * Dit si la question fabriquée doit être rejetée comme répétition.
   * @returns {false|string} false si on garde, sinon le message à journaliser
   *   quand on n'arrive plus à trouver de question acceptable
   */
  estRepetition(question, valeur) {
    const dejaVue =
      this.contient(this.questions, question) &&
      this.contient(this.values, valeur);
    // pas de répétition autorisée : la question doit être inédite
    if (dejaVue && !this.repeat) {
      return "Pas assez de données pour éviter les répétitions";
    }
    if (typeof this.repeat === "number") {
      // données binaires (VRAI/FAUX...) : on tolère la répétition mais pas
      // trois fois d'affilée dans la fenêtre
      const dernieres = this.values.slice(-this.repeat);
      let compte = 0;
      for (const valeurVue of dernieres) {
        if (this.contient([valeurVue], valeur)) compte++;
      }
      return compte >= 2 ? "To many loops" : false;
    }
    if (this.repeat) {
      // on évite quand même la répétition dans les 5 dernières : il existe des
      // activités aux questions identiques mais aux réponses différentes
      return this.contient(this.questions.slice(-5), question) &&
        this.contient(this.values.slice(-5), valeur)
        ? "Pas assez de données pour éviter les répétitions"
        : false;
    }
    return false;
  }
  /**
   * Fabrique l'aperçu montré avant le lancement du diaporama.
   */
  buildSample() {
    // on clone systématiquement : replaceVars modifie les tableaux et objets
    // en place, sans clone il écraserait les patterns de l'activité
    this.sample = {
      question: this.replaceVars(utils.clone(this.cQuestion)),
    };
    if (this.cShortQ) {
      this.sample.shortQuestion = this.replaceVars(utils.clone(this.cShortQ));
    }
    this.sample.answer = this.replaceQuestionInAnswer(
      this.replaceVars(utils.clone(this.cAnswer)),
      this.sample.question,
    );
    this.sample.audio = this.replaceQuestionInAnswer(
      this.replaceVars(utils.clone(this.cAudio)),
      this.sample.question,
    );
    const figure = this.buildFigure(this.cFigure);
    if (figure !== undefined) this.sample.figure = figure;
    const correction = this.buildFigure(this.cFigureCorrection);
    if (correction !== undefined) this.sample.figureCorrection = correction;
  }
  /**
   *
   * générateur de questions et réponses
   *
   * remplit this.questions, this.answers, this.values, this.figures...
   * @param {integer} n nombre de questions à créer
   * @param {integer} opt id d'une option (optionnel)
   * @param {integer} patt id d'un pattern de question (optionnel)
   * @param {boolean} sample si vrai, fabrique l'aperçu au lieu de la série
   *
   * L'état de travail transite par this.cVars, this.cConsts, this.cQuestion,
   * this.cAnswer... préparés par resolveOption(), et par this.wVars qui porte
   * les valeurs tirées.
   */
  generate(n = this.nbq, opt, patt, sample) {
    let loopProtect = 0;
    const maxLoop = 100;
    // vidage des tableaux pour éviter les traces
    this.initialize();
    // données pour éviter une répétition acharnée des variables entières
    this.intVarsHistoric = {};
    this.arraysHistoric = {};
    for (let i = 0; i < n; i++) {
      const optionNumber = opt !== undefined ? opt : this.getOption();
      const patternNumber =
        patt !== undefined ? patt : this.getPattern(optionNumber);
      this.resolveOption(optionNumber, patternNumber);
      this.resolveVars();

      if (sample) {
        this.buildSample();
        continue;
      }

      const thequestion = this.replaceVars(utils.clone(this.cQuestion));
      const thevalue = this.replaceVars(utils.clone(this.cValue));
      const theshort = this.cShortQ
        ? this.replaceVars(utils.clone(this.cShortQ))
        : false;
      const theaudio = this.cAudio
        ? this.replaceVars(utils.clone(this.cAudio))
        : false;
      loopProtect++;

      const repetition = this.estRepetition(thequestion, thevalue);
      if (repetition) {
        i--;
        // attention à ne pas tourner en rond
        if (loopProtect < maxLoop) continue;
        this.warn(repetition);
        break;
      }

      if (this.cConsigne) this.consignes[i] = this.cConsigne;
      this.questions[i] = thequestion;
      this.shortQuestions[i] = this.replaceQuestionInAnswer(
        this.replaceVars(theshort),
        thequestion,
      );
      this.audios[i] = theaudio;
      this.answers[i] = this.replaceQuestionInAnswer(
        this.replaceVars(utils.clone(this.cAnswer)),
        thequestion,
      );
      this.values[i] = thevalue;
      const figure = this.buildFigure(this.cFigure);
      if (figure !== undefined) this.figures[i] = figure;
      const correction = this.buildFigure(this.cFigureCorrection);
      if (correction !== undefined) this.figuresCorrection[i] = correction;
      if (this.ckeyBoard !== undefined) {
        this.keyBoards[i] = utils.clone(this.ckeyBoard);
      }
      // question retenue : maxLoop compte les échecs consécutifs, pas le
      // total des tentatives, sinon la liste est tronquée silencieusement
      loopProtect = 0;
    }
  }
  generateSample() {
    let option = this.getOption();
    this.generate(1, option, this.getPattern(option), true);
  }
}
