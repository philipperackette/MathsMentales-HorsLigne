import seedrandom from "../libs/seedrandom/seedrandom.esm.js";
import katex from "../libs/katex/katex.mjs.js";
import { MathfieldElement } from "../libs/mathlive/mathlive.mjs.js";
export { utils as default };

// Options de rendu KaTeX, communes à tout le site.
// - throwOnError : une coquille dans une activité s'affiche en rouge (.katex-error)
//   au lieu de casser la page entière
// - output htmlAndMathml : le MathML produit sert à l'export LibreOffice (odt.js)
const KATEX_OPTIONS = {
  throwOnError: false,
  displayMode: false,
  strict: false,
  output: "htmlAndMathml",
  errorColor: "#cc0000",
};
// Éléments dont le contenu n'est jamais du LaTeX à rendre
const KATEX_SKIP_TAGS = [
  "math-field",
  "script",
  "style",
  "textarea",
  "pre",
  "code",
  "annotation",
  "annotation-xml",
  "svg",
];
// Formules délimitées par $$ ... $$, éventuellement sur plusieurs lignes
const LATEX_REGEX = /\$\$(.*?)\$\$/gs;

/**
 * Rendu KaTeX d'une formule, avec repli sur le LaTeX brut en cas d'échec.
 * @param {String} latex
 * @returns {String} markup HTML
 */
function katexRender(latex) {
  try {
    return katex.renderToString(latex, KATEX_OPTIONS);
  } catch (err) {
    console.log("Probleme de rendu des expressions mathématiques", latex);
    return escapeHTML(latex);
  }
}

/** Le nœud est-il dans une zone à ne pas rendre (saisie, code, déjà rendu) ? */
function katexSkipped(node) {
  let el = node;
  while (el && el.nodeType === 1) {
    const tag = (el.localName || "").toLowerCase();
    // un foreignObject porte du XHTML normal : on ne remonte pas jusqu'au
    // <svg> englobant, sinon tout texte dedans serait ignoré à tort
    if (tag === "foreignobject") return false;
    if (KATEX_SKIP_TAGS.indexOf(tag) > -1) return true;
    if (el.classList && el.classList.contains("katex")) return true;
    if (el.dataset && el.dataset.latex !== undefined) return true;
    el = el.parentNode;
  }
  return false;
}

/**
 * Remplace les $$...$$ d'un nœud texte par les formules rendues.
 * @param {Text} node
 * @param {String} fontType "serif" ou "sansSerif"
 */
function renderKatexInTextNode(node, fontType) {
  const text = node.nodeValue;
  LATEX_REGEX.lastIndex = 0;
  let markup = "";
  let cursor = 0;
  let match;
  while ((match = LATEX_REGEX.exec(text)) !== null) {
    markup += escapeHTML(text.slice(cursor, match.index));
    markup += utils.katexMarkup(utils.traiteLatex(match[1], fontType));
    cursor = match.index + match[0].length;
  }
  if (!markup) return;
  markup += escapeHTML(text.slice(cursor));
  const holder = document.createElement("span");
  holder.innerHTML = markup;
  const fragment = document.createDocumentFragment();
  while (holder.firstChild) fragment.appendChild(holder.firstChild);
  node.parentNode.replaceChild(fragment, node);
}

/** Échappement HTML minimal d'un texte */
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Échappement d'une valeur d'attribut */
function escapeAttr(str) {
  return escapeHTML(str).replace(/"/g, "&quot;");
}

if (
  window.location.host == "mathsmentales.forge.apps.education.fr" ||
  window.location.host.indexOf("127.0.0.1") === 0
) {
  MathfieldElement.fontsDirectory = "/src/js/libs/katex/fonts";
} else {
  MathfieldElement.fontsDirectory = "../css/katex/fonts";
}
MathfieldElement.soundsDirectory = null;
// Some traductions
const moisFR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];
const joursFR = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];
const colors = {
  aliceblue: "#f0f8ff",
  antiquewhite: "#faebd7",
  aqua: "#00ffff",
  aquamarine: "#7fffd4",
  azure: "#f0ffff",
  beige: "#f5f5dc",
  bisque: "#ffe4c4",
  black: "#000000",
  blanchedalmond: "#ffebcd",
  blue: "#0000ff",
  blueviolet: "#8a2be2",
  brown: "#a52a2a",
  burlywood: "#deb887",
  cadetblue: "#5f9ea0",
  chartreuse: "#7fff00",
  chocolate: "#d2691e",
  coral: "#ff7f50",
  cornflowerblue: "#6495ed",
  cornsilk: "#fff8dc",
  crimson: "#dc143c",
  cyan: "#00ffff",
  darkblue: "#00008b",
  darkcyan: "#008b8b",
  darkgoldenrod: "#b8860b",
  darkgray: "#a9a9a9",
  darkgreen: "#006400",
  darkkhaki: "#bdb76b",
  darkmagenta: "#8b008b",
  darkolivegreen: "#556b2f",
  darkorange: "#ff8c00",
  darkorchid: "#9932cc",
  darkred: "#8b0000",
  darksalmon: "#e9967a",
  darkseagreen: "#8fbc8f",
  darkslateblue: "#483d8b",
  darkslategray: "#2f4f4f",
  darkturquoise: "#00ced1",
  darkviolet: "#9400d3",
  deeppink: "#ff1493",
  deepskyblue: "#00bfff",
  dimgray: "#696969",
  dodgerblue: "#1e90ff",
  firebrick: "#b22222",
  floralwhite: "#fffaf0",
  forestgreen: "#228b22",
  fuchsia: "#ff00ff",
  gainsboro: "#dcdcdc",
  ghostwhite: "#f8f8ff",
  gold: "#ffd700",
  goldenrod: "#daa520",
  gray: "#808080",
  green: "#008000",
  greenyellow: "#adff2f",
  honeydew: "#f0fff0",
  hotpink: "#ff69b4",
  indianred: "#cd5c5c",
  indigo: "#4b0082",
  ivory: "#fffff0",
  khaki: "#f0e68c",
  lavender: "#e6e6fa",
  lavenderblush: "#fff0f5",
  lawngreen: "#7cfc00",
  lemonchiffon: "#fffacd",
  lightblue: "#add8e6",
  lightcoral: "#f08080",
  lightcyan: "#e0ffff",
  lightgoldenrodyellow: "#fafad2",
  lightgrey: "#d3d3d3",
  lightgreen: "#90ee90",
  lightpink: "#ffb6c1",
  lightsalmon: "#ffa07a",
  lightseagreen: "#20b2aa",
  lightskyblue: "#87cefa",
  lightslategray: "#778899",
  lightsteelblue: "#b0c4de",
  lightyellow: "#ffffe0",
  lime: "#00ff00",
  limegreen: "#32cd32",
  linen: "#faf0e6",
  magenta: "#ff00ff",
  maroon: "#800000",
  mediumaquamarine: "#66cdaa",
  mediumblue: "#0000cd",
  mediumorchid: "#ba55d3",
  mediumpurple: "#9370d8",
  mediumseagreen: "#3cb371",
  mediumslateblue: "#7b68ee",
  mediumspringgreen: "#00fa9a",
  mediumturquoise: "#48d1cc",
  mediumvioletred: "#c71585",
  midnightblue: "#191970",
  mintcream: "#f5fffa",
  mistyrose: "#ffe4e1",
  moccasin: "#ffe4b5",
  navajowhite: "#ffdead",
  navy: "#000080",
  oldlace: "#fdf5e6",
  olive: "#808000",
  olivedrab: "#6b8e23",
  orange: "#ffa500",
  orangered: "#ff4500",
  orchid: "#da70d6",
  palegoldenrod: "#eee8aa",
  palegreen: "#98fb98",
  paleturquoise: "#afeeee",
  palevioletred: "#d87093",
  papayawhip: "#ffefd5",
  peachpuff: "#ffdab9",
  peru: "#cd853f",
  pink: "#ffc0cb",
  plum: "#dda0dd",
  powderblue: "#b0e0e6",
  purple: "#800080",
  rebeccapurple: "#663399",
  red: "#ff0000",
  rosybrown: "#bc8f8f",
  royalblue: "#4169e1",
  saddlebrown: "#8b4513",
  salmon: "#fa8072",
  sandybrown: "#f4a460",
  seagreen: "#2e8b57",
  seashell: "#fff5ee",
  sienna: "#a0522d",
  silver: "#c0c0c0",
  skyblue: "#87ceeb",
  slateblue: "#6a5acd",
  slategray: "#708090",
  snow: "#fffafa",
  springgreen: "#00ff7f",
  steelblue: "#4682b4",
  tan: "#d2b48c",
  teal: "#008080",
  thistle: "#d8bfd8",
  tomato: "#ff6347",
  turquoise: "#40e0d0",
  violet: "#ee82ee",
  wheat: "#f5deb3",
  white: "#ffffff",
  whitesmoke: "#f5f5f5",
  yellow: "#ffff00",
  yellowgreen: "#9acd32",
};

/* define new HTMLElement to insert svg as inline */
class CustomSVG extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    if (this.getAttribute("src") === "") {
      console.log("src vide");
      return;
    }
    fetch(this.getAttribute("src"))
      .then((response) => response.text())
      .then((text) => {
        this.innerHTML = text;
      })
      .catch((err) => {
        console.log(err);
      });
  }
}
customElements.define("custom-svg", CustomSVG);

export const _ = {
  /**
   * Checks if an object is an array.
   *
   * @param {Object} o - The object to check.
   * @returns {boolean} Returns true if the object is an array, otherwise false.
   */
  isArray: function (o) {
    return Object.prototype.toString.call(o) === "[object Array]";
  },
  /**
   * Checks if an object is empty.
   *
   * @param {Object} obj - The object to check.
   * @returns {boolean} Returns true if the object has no enumerable properties, otherwise false.
   */
  isEmpty: function (obj) {
    var x;
    for (x in obj) {
      return false;
    }
    return true;
  },
  /**
   * Checks if an object is an object.
   *
   * @param {Object} o - The object to check.
   * @returns {boolean} Returns true if the object is an object, otherwise false.
   */
  isObject: function (o) {
    return Object.prototype.toString.call(o) === "[object Object]";
  },
  /**
   * Checks if an object is a string.
   *
   * @param {Object} o - The object to check.
   * @returns {boolean} Returns true if the object is a string, otherwise false.
   */
  isString: function (o) {
    return Object.prototype.toString.call(o) === "[object String]";
  },
  /**
   * Reduces a given object to a single output value.
   *
   * @param {Object} obj - The object to reduce.
   * @param {Function} iteratee - A function invoked per own property key in object, taking four arguments: (previousValue, currentValue, key, object)
   * @param {*} [memo] - The initial value to return.
   * @param {*} [context] - The this binding of the iteratee.
   * @returns {*} Returns the accumulated value.
   */
  reduce: function (obj, iteratee, memo, context) {
    if (obj == null) obj = [];
    const keys = Object.keys(obj);
    const length = keys.length;
    let index = 0;

    if (arguments.length < 3) {
      memo = obj[keys[index]];
      index += 1;
    }

    for (; index < length; index++) {
      const key = keys[index];
      memo = iteratee.call(context, memo, obj[key], key, obj);
    }

    return memo;
  },
  /**
   * Sorts the elements of a collection in ascending order by the results of
   * running each element in a collection through an iteratee.
   *
   * @param {Array|Object} collection - The collection to iterate over.
   * @param {Function} iteratee - The iteratee invoked per element.
   * @returns {Array} Returns the new sorted array.
   */
  sortBy: function (collection, iteratee) {
    return Object.entries(collection)
      .map(([key, value]) => ({ key, value, criteria: iteratee(value) }))
      .sort((a, b) => {
        if (a.criteria < b.criteria) return -1;
        if (a.criteria > b.criteria) return 1;
        return 0;
      })
      .map((item) => item.value);
  },
  /**
   * The opposite of _.max; this method returns the smallest value in `collection`.
   *
   * If `collection` is empty or falsey, `undefined` is returned.
   *
   * @static
   * @memberOf _
   * @category Math
   * @param {Array} collection The collection to iterate over.
   * @returns {*} Returns the minimum value.
   * @example
   *
   * _.min([4, 2, 8, 6]);
   * // => 2
   */
  min: function (collection) {
    return Math.min(...Object.values(collection));
  },

  /**
   * The opposite of _.min; this method returns the largest value in `collection`.
   *
   * If `collection` is empty or falsey, `undefined` is returned.
   *
   * @static
   * @memberOf _
   * @category Math
   * @param {Array} collection The collection to iterate over.
   * @returns {*} Returns the maximum value.
   * @example
   *
   * _.max([4, 2, 8, 6]);
   * // => 8
   */
  max: function (collection) {
    return Math.max(...Object.values(collection));
  },
};
export const utils = {
  baseURL: window.location.href.split("?")[0].split("#")[0],
  seed: "sample",
  security: 300, // max number for boucles
  modeDebug: true,
  debug: function () {
    const divAffichage = document.getElementById("errors");
    if (utils.modeDebug && divAffichage === null) {
      let messageErreur = "";
      if (arguments.length >= 1) {
        for (const argument of arguments) {
          messageErreur += argument;
        }
      }
      throw new Error(messageErreur);
    } else if (divAffichage !== null) {
      if (arguments.length >= 1) {
        for (const argument of arguments)
          utils.afficheEnHTML(argument, divAffichage);
      } else {
        utils.afficheEnHTML(arguments, divAffichage);
      }
    }
  },
  afficheEnHTML: function (obj, container) {
    // 1. Crée un élément container
    const card = document.createElement("div");
    card.className = "card";

    // 2. Parcours des paires clé/valeur
    for (const [key, val] of Object.entries(obj)) {
      const row = document.createElement("div");
      row.className = "row";

      // Clé
      const keyEl = document.createElement("span");
      keyEl.className = "key";
      keyEl.textContent = `${key}: `;

      // Valeur
      const valEl = document.createElement("span");
      valEl.className = "value";
      if (Array.isArray(val)) {
        valEl.textContent = `[${val.join(", ")}]`;
      } else if (typeof val === "object" && val !== null) {
        // Sous‑objet → appel récursif
        valEl.appendChild(
          utils.afficheEnHTML(val, document.createElement("div")),
        );
      } else if (obj.name !== undefined) {
        valEl.textContent = obj.name;
        if (obj.stack !== undefined) {
          valEl.textContent += err.stack;
        }
      }
      {
        valEl.textContent = val;
      }

      row.append(keyEl, valEl);
      card.appendChild(row);
    }

    // 3. Ajout au container passé en argument
    container.appendChild(card);
    return card;
  },
  getVersion() {
    const fileName = document.getElementById("mmscriptid").attributes.src.value;
    /*get value from query parameters*/
    const regex = /(\d+\.\d+\.\d+)/;
    const match = fileName.match(regex);
    return match ? match[1] : null;
  },
  colorNameToRBG(name) {
    const hexValue = colors[name].substring(1);
    const argbHex = hexValue.match(/.{1,2}/g);
    return {
      r: parseInt(argbHex[0], 16) / 255,
      g: parseInt(argbHex[1], 16) / 255,
      b: parseInt(argbHex[2], 16) / 255,
    };
  },
  /**
   * Remplace tous les :var (hors de `${…}`) par `${:var}`,
   * à l’exception de `:question` qui reste inchangé.
   *
   * @param {string} str
   * @returns {string}
   */
  convertToPointVar(str) {
    let result = "";
    let depth = 0; // 0 = hors `${…}`, >0 = dans un bloc `${…}`
    let inside = false;
    let depthInside = 0;
    let insideStyle = false;
    let insideString = false;

    // ne rien faire dans un svg
    // TODO à traiter plus tard peut-être
    if (str.startsWith("<svg")) {
      return str;
    }

    for (let i = 0; i < str.length; i++) {
      /* --- Début d’un bloc `${…}` --------------------------------- */
      if (str.startsWith("${", i)) {
        depth++; // on entre dans un bloc
        result += "${";
        i += 1; // on saute le `$` et on laissera le `{`
        inside = true;
        depthInside = depth;
        continue;
      }
      if (str.startsWith("'", i)) {
        insideString = !insideString;
        result += "'";
        continue;
      }
      if (str.startsWith("{", i) && !insideString) {
        depth++;
        result += "{";
        continue;
      }
      /* --- Fin d’un bloc `${…}` ----------------------------------- */
      if (str[i] === "}" && depth > 0 && !insideString) {
        if (depthInside === depth) inside = false;
        depth--; // on sort d’un bloc
        result += "}";
        continue;
      }

      /* --- Si on est à l’extérieur d’un bloc --------------------- */
      if (!insideStyle && !inside && str[i] === ":") {
        const match = /^:(?!\d)\w+(?:\[\d+\])?/.exec(str.slice(i));
        if (match) {
          const varName = match[0];
          i += varName.length - 1; // avancer jusqu’à la fin du token
          if (
            varName === ":question" ||
            varName === ":href" ||
            varName === ":xlink"
          ) {
            result += varName; // garder :question inchangé
          } else {
            result += `\${${varName}}`; // transformer :var en ${:var}
          }
          continue;
        }
      }
      /* --- Caractère normal --------------------------------------- */
      result += str[i];
    }
    return result;
  },
  /**
   * objet contenant des fonctions utiles à MathsMentales
   */
  /**
   * @param {String} type of DOM element
   * @param {object} props properties of the element
   */
  create: function (type, props) {
    const elt = document.createElement(type);
    for (const p in props) {
      elt[p] = props[p];
    }
    return elt;
  },
  // hauteur utile de page (en px) selon l'orientation (attribut body[layout])
  // et le padding interne de #creator-content (10mm en haut + 10mm en bas)
  computePageHeightPx: function (paddingMM = 20) {
    const isLandscape =
      document.querySelector('body[layout="landscape"]') !== null;
    const pageHeightMM = (isLandscape ? 210 : 297) - paddingMM;
    const tempDiv = utils.create("div", {
      style: "position:absolute;top:" + pageHeightMM + "mm;",
    });
    document.body.appendChild(tempDiv);
    // getBoundingClientRect().top est relatif à la fenêtre visible : on ajoute
    // le défilement pour obtenir une hauteur indépendante du scroll courant
    const px = tempDiv.getBoundingClientRect().top + window.scrollY;
    document.body.removeChild(tempDiv);
    return px;
  },
  // insère un div.pagebreak avant chaque item qui ferait déborder la page,
  // en cumulant les hauteurs réelles (mesurées) des items précédents
  insertAutoPageBreaks: function (items, pageHeightPx) {
    // supprime les marqueurs posés lors d'un appel précédent avant de recalculer
    items.forEach((item) => {
      const prev = item.previousElementSibling;
      if (prev !== null && prev.classList.contains("auto-pagebreak")) {
        prev.remove();
      }
    });
    let cumHeight = 0;
    items.forEach((item) => {
      const h = item.getBoundingClientRect().height;
      if (cumHeight > 0 && cumHeight + h > pageHeightPx) {
        const marker = utils.create("div", {
          className: "pagebreak auto-pagebreak",
        });
        item.parentNode.insertBefore(marker, item);
        cumHeight = 0;
      }
      cumHeight += h;
    });
  },
  // crée un titre (fiche/exercice) éditable directement sur le document,
  // avec une icône crayon non imprimable pour signaler/activer l'édition
  makeEditableTitle: function (tag, html, props = {}) {
    const el = utils.create(tag, props);
    const text = utils.create("span", {
      className: "editable-text",
      innerHTML: html,
    });
    const icon = utils.create("span", {
      className: "edit-icon noprint",
      innerHTML: "✏️",
      title: "Modifier ce titre",
    });
    icon.onclick = (evt) => {
      evt.stopPropagation();
      text.contentEditable = "true";
      text.focus();
      const range = document.createRange();
      range.selectNodeContents(text);
      range.collapse(false);
      const sel = document.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    };
    text.onclick = (evt) => {
      if (text.isContentEditable) evt.stopPropagation();
    };
    text.onkeydown = (evt) => {
      if (evt.key === "Enter") {
        evt.preventDefault();
        text.blur();
      }
    };
    text.onblur = () => {
      text.contentEditable = "false";
    };
    el.appendChild(text);
    el.appendChild(icon);
    return el;
  },
  // met la première lettre en majuscule
  capitalize: function (str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
  copy(DOMel) {
    /*DOMel.select();
        DOMel.setSelectionRange(0,99999);
        document.execCommand("copy");*/
    let text = DOMel.value;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        DOMel.className = "copied";
        setTimeout(() => {
          DOMel.className = "";
        }, 3000);
      })
      .catch((err) => {
        console.log("erreur de copie dans le presse papier");
      });
  },
  pageWidth() {
    return window.innerWidth != null
      ? window.innerWidth
      : document.documentElement && document.documentElement.clientWidth
        ? document.documentElement.clientWidth
        : document.body != null
          ? document.body.clientWidth
          : null;
  },
  /**
   * La transformation d'une ou d'un panier MMv1 étant assez compliquée,
   * redirection vers le dosser comportant l'ancienne version : /old
   */
  goToOldVersion() {
    window.location.href =
      (utils.baseURL + "old/").replace("index.htmlold", "old") +
      /(^.*\/)(.*)/.exec(window.location.href)[2];
  },
  /**
   * Performs check on radio button with name and value
   * @param {String} name
   * @param {String} value
   * @returns
   */
  checkRadio(name, value) {
    let domElt = document.querySelector(
      "input[type=radio][name='" + name + "'][value='" + value + "']",
    );
    if (domElt) domElt.checked = true;
    else return false;
  },
  /**
   * performs check on checkbox inputs from name and values
   * @param {String} name
   * @param {String, Array} values
   * @returns
   */
  checkCheckbox(name, value) {
    // remise à zéro de tous les éléments
    document
      .querySelectorAll("input[type='checkbox'][name='" + name + "']")
      .forEach((el) => {
        el.checked = false;
      });
    if (_.isArray(value)) {
      value.forEach((el) => {
        let domElt = document.querySelector(
          "input[type=checkbox][name='" + name + "'][value='" + el + "']",
        );
        if (domElt) domElt.checked = true;
      });
    } else {
      let domElt = document.querySelector(
        "input[type=checkbox][name='" + name + "'][value='" + value + "']",
      );
      if (domElt) domElt.checked = true;
    }
  },
  selectOption(id, value) {
    let domElt = document.getElementById(id);
    for (let i = 0; i < domElt.options.length; i++) {
      if (domElt.options[i].value === value) {
        domElt.selectedIndex = i;
        break;
      }
    }
  },
  getTypeOfURL(url, type = false) {
    if (!type) {
      if (url.indexOf("cartesflash.html") > -1) return "paramsflashcards";
      else if (url.indexOf("ceinture.html") > -1) return "paramsceinture";
      else if (url.indexOf("courseauxnombres.html") > -1) return "paramscourse";
      else if (url.indexOf("diaporama.html") > -1) return "paramsdiapo";
      else if (url.indexOf("dominos.html") > -1) return "paramsdominos";
      else if (url.indexOf("duel.html") > -1) return "paramsduel";
      else if (url.indexOf("exam.html") > -1) return "paramsinterro";
      else if (url.indexOf("exercices.html") > -1) return "paramsexos";
      else if (url.indexOf("jaiquia.html") > -1) return "paramswhogots";
      else if (url.indexOf("puzzle.html") > -1) return "paramspuzzle";
      else if (url.indexOf("match.html") > -1) return "paramsassoc";
      else if (url.indexOf("wall.html") > -1) return "paramswall";
      else return "paramsdiapo";
    } else {
      if (type === "cartesflash") return "paramsflashcards";
      else if (type === "ceinture") return "paramsceinture";
      else if (type === "cansheet") return "paramscourse";
      else if (type === "diaporama") return "paramsdiapo";
      else if (type === "dominos") return "paramsdominos";
      else if (type === "duel") return "paramsduel";
      else if (type === "exam") return "paramsinterro";
      else if (type === "exosheet") return "paramsexos";
      else if (type === "whogots") return "paramswhogots";
      else if (type === "puzzle") return "paramspuzzle";
      else if (type === "assoc") return "paramsassoc";
      else if (type === "wall") return "paramswall";
      else return "paramsdiapo";
    }
  },
  /**
   *
   * @param {Array} array tableau contenant des données
   * @param {someThing} value value à rechercher
   * @returns {Number} count nombre des valeurs dans le tableau
   */
  countValue(array, value) {
    let count = 0;
    for (let i = 0, j = array.length; i < j; i++) {
      if (array[i] === value) count++;
    }
    return count;
  },
  /**
   * convert seconds to hours minutes & seconds
   * @param {Integer} sec number of seconds to convert
   * @returns
   */
  sToMin(sec) {
    sec = Number(sec);
    let time = "";
    if (sec > 3600) {
      time += ~~(sec / 3600) + " h ";
      sec = sec % 3600;
    }
    if (sec > 60) {
      time += ~~(sec / 60) + " min ";
      sec = sec % 60;
    }
    return (time += sec);
  },
  /**
   * Endode les accolades dans une chaine car encodeURIComponent ne le fait pas
   * @param {String} url a string corresponding an URL
   * @returns better encoded string
   */
  superEncodeURI: function (url) {
    var encodedStr = "",
      encodeChars = ["(", ")", "{", "}", ",", "-"];
    url = encodeURIComponent(url);
    for (var i = 0, len = url.length; i < len; i++) {
      if (encodeChars.indexOf(url[i]) >= 0) {
        var hex = parseInt(url.charCodeAt(i)).toString(16);
        encodedStr += "%" + hex;
      } else {
        encodedStr += url[i];
      }
    }
    return encodedStr;
  },
  /**
   * get data form url
   * @returns array of datas from GET vars
   */
  getUrlVars: function (urlString) {
    if (!urlString) urlString = window.location;
    else urlString = new URL(urlString);
    var vars = {},
      hash;
    // on fait un tableau de données qui sont séparées par le &
    let trueUrl = urlString.search.slice(1);
    trueUrl = trueUrl.replace("&amp;", "&");
    // problème avec Elea qui encode les virgules et les =
    trueUrl = trueUrl.replace(/%2C/g, ",").replace(/%3D/g, "=");
    let hashes = trueUrl.split("&");
    if (this.isURLEncoded(trueUrl)) {
      trueUrl = this.decodeUrlUnreadable(hashes[0]);
      trueUrl = trueUrl.replace("&amp;", "&");
      let datas = trueUrl.split("&");
      if (hashes[1] !== undefined) hashes = [...datas, ...hashes.slice(1)];
      else hashes = [...datas];
    }
    var len = hashes.length;
    // cas de la version avant le 15/08/21 - simple
    // le tilde ~ est une caractéristique des nouvelles url
    if (trueUrl.indexOf("~") < 0) {
      for (var i = 0; i < len; i++) {
        hash = hashes[i].split("=");
        vars[hash[0]] = hash[1];
      }
      // version après le 15/08/21
      // reconstruction de la chaine pour en faire un objet
      // la chaine est de la forme
      /* url?i=intro,e=end,o=online,s=nbsliders,so=orientation,f=facetotface,a=seed,colors=color0~color1~color2~color3
                 &p=cartId1~t=title1~c=target1~o=ordered
                _i=activityId1~o=optionsIds~q=subOptionsIds~p=???~t=durée~n=nbquestions
                _i=activityId2~o=optionsIds~q=subOptionsIds~p=???~t=durée~n=nbquestions
                &p=cartId2~t=title2~c=target2~o=ordered
                _i=activityId1~o=optionsIds~q=subOptionsIds~p=???~t=durée~n=nbquestions
                _i=activityId2~o=optionsIds~q=subOptionsIds~p=???~t=durée~n=nbquestions

                le 22/10/24 ajout du paramètre &edit qui permet d'effectuer un paramétrage
              optionsIds et subOptionsIds peuvent être une liste d'id séparés par des virgules ou rien
            */
    } else {
      // données générales :
      // la virgule est le séparateur de données avec affectation
      // ces données sont les premières du tableau hashes
      hash = hashes[0].split(",");
      for (let i = 0; i < hash.length; i++) {
        // le signe égal est le séparateur variable/valeur
        let data = hash[i].split("=");
        vars[data[0]] = data[1] ? data[1] : false;
      }
      if (vars.search !== undefined)
        vars.search = decodeURIComponent(vars.search);
      // vars.c doit contenir les carts. Dans la version après 15/08/21, vars.c est une chaine
      // on reconstruit l'objet json à partir de la chaine
      vars.c = {};
      for (let i = 1; i < len; i++) {
        // on ne commence qu'à 1, le zéro ayant déjà été traité ci-dessus
        // si la première lettre est p, on a un panier
        if (hashes[i].indexOf("p") === 0) {
          // le séparateur d'activités est le _
          let parts = hashes[i].split("_i");
          // cela permet d'éviter les pb de titres contenant _
          for (let i = 1; i < parts.length; i++) {
            parts[i] = "i" + parts[i];
          }
          // parts[0] contient les données du panier, que l'on stocke dans data
          // le séparateur de couples var/valeur est ~
          let data = parts[0].split("~");
          let datas = {};
          for (let j = 0; j < data.length; j++) {
            // le séparateur var/valeur est =
            let dataparts = data[j].split("=");
            datas[dataparts[0]] = decodeURI(dataparts[1]);
          }
          let id = datas.p;
          vars.c[id] = {
            i: datas.p,
            t: datas.t,
            c: datas.c,
            o: datas.o,
            a: {},
            d: datas.d,
            at: datas.at,
            sl: datas.sl,
          };
          // parts[>0] : parameters cart's activities
          for (let j = 1; j < parts.length; j++) {
            let datasActivity = parts[j].split("~");
            vars.c[id].a[j - 1] = {};
            for (let k = 0; k < datasActivity.length; k++) {
              let dataparts = datasActivity[k].split("=");
              // o (options choisies) et p (types de questions choisis) sont des
              // tableaux d'entiers : sans conversion ils resteraient des chaînes
              if (dataparts[0] === "o" || dataparts[0] === "p") {
                vars.c[id].a[j - 1][dataparts[0]] = utils.textToTable(
                  dataparts[1],
                );
              } else if (dataparts[0] === "q" || dataparts[0] === "pa") {
                vars.c[id].a[j - 1][dataparts[0]] = utils.textToObj(
                  dataparts[1],
                );
              } else {
                vars.c[id].a[j - 1][dataparts[0]] = dataparts[1];
              }
            }
          }
        } else if (hashes[i].indexOf("embed") === 0) {
          let parts = hashes[i].split("=");
          vars.embed = parts[1];
        } else if (hashes[i].indexOf("edit") === 0) {
          vars.edit = true;
        } else if (hashes[i].indexOf("logo") === 0) {
          vars.logo = true;
        } else if (hashes[i].indexOf("type") === 0) {
          vars.type = hashes[i].split("=")[1];
        }
      }
    }
    return vars;
  },
  /**
   * Donne la date du moment
   * @returns date en français avec jour, heure etc
   */
  getDate() {
    let ladate = new Date(),
      lheure = ladate.getHours(),
      lesminutes = ladate.getMinutes(),
      lessecondes = ladate.getSeconds(),
      ladateComplete =
        joursFR[ladate.getDay()] +
        " " +
        ladate.getDate() +
        " " +
        moisFR[ladate.getMonth()] +
        " " +
        ladate.getFullYear() +
        " - " +
        (lheure < 10 ? "0" + lheure : lheure) +
        ":" +
        (lesminutes < 10 ? "0" + lesminutes : lesminutes) +
        ":" +
        (lessecondes < 10 ? "0" + lessecondes : lessecondes);
    return ladateComplete;
  },
  /**
   * Transform 10:05 string to seconds string, return number
   * @param {string} timeValue
   */
  timeToSeconds(timeValue) {
    let elems = timeValue.split(":");
    return Number(elems[0]) * 60 + Number(elems[1]);
  },
  /**
   * Transform seconds string to 10:05 string
   * @param {number} seconds
   */
  secondToTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    return (
      (minutes < 10 ? "0" + String(minutes) : String(minutes)) +
      ":" +
      (seconds < 10 ? "0" + String(seconds) : String(seconds))
    );
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
  setSeed(value) {
    let returnValue = "";
    if (value !== undefined && value !== "sample") {
      returnValue = value;
    } else {
      returnValue = this.seedGenerator();
    }
    this.initializeAlea(returnValue);
    return returnValue;
  },
  /**
   *
   * @params {string} seed valeur d'initialisation des données aléatoires
   * return nothing
   */
  initializeAlea: function (seed) {
    if (seed !== undefined) {
      if (utils.alea) delete utils.alea;
      utils.alea = new seedrandom(seed);
    } else {
      if (utils.alea) delete utils.alea;
      utils.alea = new seedrandom(diaporama.seed);
    }
  },

  /**
   * function addClass
   * Add a class to a DOM element
   *
   * @params elt (DOMelt)
   * @params newClass (String) : string of coma separated classnames
   */
  addClass: function (elt, newClass) {
    var n = 0;
    newClass = newClass.split(",");
    for (let i = 0; i < newClass.length; i++) {
      if ((" " + elt.className + " ").indexOf(" " + newClass[i] + " ") == -1) {
        elt.className += " " + newClass[i];
        n++;
      }
    }
    return n;
  },
  /**
   * get the DOM button originaly targeted by a click, specialy done when an image is clicked inside a button.
   * @param {evt} evt click event object
   * @returns
   */
  getTargetWithImageInside(evt) {
    let target = evt.target;
    if (evt.target.nodeName.toLowerCase() === "i") {
      target = evt.target.parentNode;
    }
    return target;
  },
  createCeintureTitres(qty) {
    if (qty < 1 || qty > 5) return false;
    const dest = document.getElementById("ceintcolumnTitle");
    const champs = dest.querySelectorAll("input");
    const labels = dest.querySelectorAll("label");
    const br = dest.querySelectorAll("br");
    // création de champ :
    if (champs.length < qty) {
      dest.appendChild(utils.create("br"));
      dest.appendChild(
        utils.create("label", {
          for: "ceinttitlecol" + qty,
          innerHTML: "Colonne " + qty + " : ",
        }),
      );
      dest.appendChild(
        utils.create("input", {
          type: "text",
          id: "ceinttitlecol" + qty,
          placeholder: "Texte, ou rien",
        }),
      );
    } else if (champs.length > qty) {
      // suppression du dernier champ
      dest.removeChild(labels[champs.length - 1]);
      dest.removeChild(champs[champs.length - 1]);
      dest.removeChild(br[champs.length - 1]);
    }
  },
  /**
   * Récupère la valeur cochée d'un groupe d'input radio
   * @param {String} name nom DOM du groupe d'input radio
   * @returns valeur du radio coché
   */
  getRadioChecked: function (name) {
    let radio = document.getElementsByName(name);
    let returnValues = [];
    for (let i = 0, length = radio.length; i < length; i++) {
      if (radio[i].checked) {
        returnValues.push(radio[i].value);
      }
    }
    if (returnValues.length > 1) return returnValues.join("-");
    else if (returnValues.length === 1) return returnValues[0];
    else return false;
  },
  /**
   *
   * @param {string} value id select
   * @returns string
   */
  getSelectValue: function (id) {
    try {
      let select = document.getElementById(id);
      return select[select.selectedIndex].value;
    } catch (err) {
      console.log(err);
    }
  },
  /**
   * renvoit un nombre si le nombre est sous forme de chaine
   * @param {String} value number
   * @returns Number typed number or string
   */
  numberIfNumber: function (value) {
    if (String(Number(value)) === value) {
      return Number(value);
    } else {
      return value;
    }
  },
  // isEmpty, teste si un objet est vide ou pas
  // @param (Object) obj : objet ou tableau à analyser
  // return true pour vide
  // return false sinon
  isEmpty: function (obj) {
    var x;
    for (x in obj) {
      return false;
    }
    return true;
  },
  /**
   * shuffle an array
   * @param {Array} arr
   */
  shuffle: function (arr) {
    if (!Array.isArray(arr)) return false;
    let curId = arr.length;
    while (0 !== curId) {
      let randId = Math.floor(utils.alea() * curId);
      curId -= 1;
      let tmp = arr[curId];
      arr[curId] = arr[randId];
      arr[randId] = tmp;
    }
    return arr;
  },
  /**
   * Tire au sort un sous-ensemble de n couples [indexActivité, indexQuestion]
   * parmi ceux du panier, en garantissant au moins une question par activité
   * (ou une activité tirée au sort par question si trop d'activités), et en
   * répartissant le reste des questions le plus équitablement possible.
   * @param {Array} actsArray couples [indexActivité, indexQuestion] du panier complet
   * @param {integer} nbActivities nombre d'activités du panier
   * @param {integer} n nombre de questions à tirer
   * @returns {Array} sous-ensemble de couples, dans l'ordre des activités
   */
  drawRandomSubset: function (actsArray, nbActivities, n) {
    let groups = [];
    for (let z = 0; z < nbActivities; z++) groups[z] = [];
    for (const pair of actsArray) {
      groups[pair[0]].push(pair);
    }
    let order = utils.shuffle(
      Array.from({ length: nbActivities }, (_, z) => z),
    );
    let alloc = new Array(nbActivities).fill(0);
    let restant = Math.min(n, actsArray.length);
    while (restant > 0) {
      let avance = false;
      for (const z of order) {
        if (restant <= 0) break;
        if (alloc[z] < groups[z].length) {
          alloc[z]++;
          restant--;
          avance = true;
        }
      }
      if (!avance) break;
    }
    let result = [];
    for (let z = 0; z < nbActivities; z++) {
      if (alloc[z] === 0) continue;
      let picked = utils.shuffle(groups[z].slice()).slice(0, alloc[z]);
      picked.sort((a, b) => a[1] - b[1]);
      result.push(...picked);
    }
    return result;
  },
  /**
   * plie ou déplie la liste des exercices
   * @param {elt} elt DOM elt
   */
  deploy(elt) {
    // Le rang du titre vient de sa classe et non de son nom de balise :
    // l'arbre de recherche part de h2 depuis que le h1 du document est celui
    // de l'accueil, et une future retouche de la hiérarchie ne doit pas
    // casser le pliage. On ajoute et retire les classes plus/moins plutôt que
    // de réécrire className, qui effacerait rch-theme et consorts.
    const ouvrir = elt.classList.contains("plus");
    const majTitre = (titre) => {
      titre.classList.toggle("moins", ouvrir);
      titre.classList.toggle("plus", !ouvrir);
    };
    const majListe = (liste) => {
      liste.classList.toggle("showdown", ouvrir);
      liste.classList.toggle("hideup", !ouvrir);
    };
    majTitre(elt);
    if (elt.classList.contains("rch-chapitre")) {
      const liste = elt.nextElementSibling;
      if (liste !== null) majListe(liste);
    } else if (elt.classList.contains("rch-theme")) {
      let suivant = elt.nextElementSibling;
      while (suivant !== null && !suivant.classList.contains("rch-theme")) {
        if (suivant.nodeName === "UL") majListe(suivant);
        else if (suivant.classList.contains("rch-chapitre")) majTitre(suivant);
        suivant = suivant.nextElementSibling;
      }
    } else if (elt.classList.contains("rch-niveau")) {
      const racine = document.getElementById("resultat-chercher");
      racine
        .querySelectorAll(".rch-theme, .rch-chapitre")
        .forEach((el) => majTitre(el));
      racine.querySelectorAll("ul").forEach((el) => majListe(el));
    }
  },
  /**
   * fonctions utilisées pour l'import/export des activités.
   * @param {Array} array
   * @returns
   */
  tableToText(array) {
    if (array === undefined) return "";
    if (typeof array === "string") return array;
    return array.join(",");
  },
  textToTable(string) {
    if (string === undefined || string === "") return [];
    else return string.split(",").map(Number);
  },
  objToText(obj) {
    if (obj === undefined) return "";
    let string = "";
    let start = true;
    for (const i in obj) {
      if (start) {
        string += i + "." + utils.tableToText(obj[i]);
        start = false;
      } else {
        string += "-" + i + "." + utils.tableToText(obj[i]);
      }
    }
    return string;
  },
  textToObj(string) {
    let obj = {};
    let elts = string.split("-");
    for (let i = 0; i < elts.length; i++) {
      let subelts = elts[i].split(".");
      obj[subelts[0]] = utils.textToTable(subelts[1]);
    }
    return obj;
  },
  /**
   *
   * @param {string} chaine chaine à tester
   * @returns boolean
   */
  testIfLatex(chaine) {
    let isLatex = false;
    if (typeof chaine !== "string") return isLatex;
    isLatex =
      chaine.indexOf("\\") > -1 ||
      chaine.indexOf("x") > -1 ||
      chaine.indexOf("^") > -1;
    return isLatex;
  },
  /**
   * function removeClass
   * remove a class name from a DOM element
   *
   * @param elt : DOM element
   * @param className (String) : name of classname
   */
  removeClass: function (elt, className) {
    elt.classList.remove(className);
    /*if((" "+elt.className+" ").indexOf(" "+className+" ")>-1){
            var classes = elt.className.split(" "), newclasses="";
            for(let i=0;i<classes.length;i++){
                if(classes[i] !== className)newclasses+=" "+classes[i];
            }
            elt.className = newclasses.trim();
        }*/
  },
  /**
   * checkSecurity to avoid infinite loop
   *
   */
  checkSecurity() {
    utils.security--;
    if (utils.security < 0) {
      console.log("infinite loop");
      return false;
    } else return true;
  },
  toDecimalFr: function (value) {
    let parties = String(value).split(".");
    let partieEntiere = parties[0];
    let partieDecimale = "";
    if (parties.length > 1) partieDecimale = parties[1];
    if (partieEntiere.length > 3) {
      let s = partieEntiere.length % 3;
      partieEntiere =
        partieEntiere.substring(0, s) +
        "~" +
        partieEntiere.substring(s).match(/\d{3}/g).join("~");
    }
    if (partieDecimale.length > 3) {
      let nbgp = ~~(partieDecimale.length / 3);
      partieDecimale =
        partieDecimale.match(/\d{3}/g).join("~") +
        "~" +
        partieDecimale.substring(nbgp * 3);
    }
    if (partieDecimale.length) {
      partieDecimale = "{,}" + partieDecimale;
    }
    //debug(partieEntiere+partieDecimale);
    return partieEntiere + partieDecimale;
  },
  /**
   *
   */
  traiteLatex(str, fontType) {
    str = str.replace(/\&amp\;/g, "&");
    // suppression du displaystyle
    //        texTxt = texTxt.replace(/\\displaystyle/g, "");
    // remplacement de color par textcolor
    str = str.replace(/\\color\{/g, "\\textcolor{");
    // remplacement de &gt; et &lt;
    str = str.replace(/&gt;/g, "\\gt").replace(/&lt;/g, "\\lt");
    // recherche les nombres, décimaux ou pas
    const nbrgx = /(\d+\.*\d*)/g;
    // insère des espaces tous les 3 chiffres;
    str = str.replace(nbrgx, utils.toDecimalFr);
    // setFontType
    if (fontType === "sansSerif") str = "\\mathsf {" + str + "}";
    //texTxt = texTxt.replace(/\.(\d{3})(?=(\d+))/g,"$1~");
    //texTxt = texTxt.replace(/\./g, "{,}");
    return str;
  },
  /**
   * Rend une formule LaTeX avec KaTeX, dans un span porteur du LaTeX source.
   * C'est ce span[data-latex] que mathReRender et l'export ODT exploitent.
   * @param {String} latex formule déjà passée par traiteLatex
   * @returns {String} markup HTML
   */
  katexMarkup(latex) {
    return (
      `<span class="mm-math" data-latex="${escapeAttr(latex)}">` +
      katexRender(latex) +
      "</span>"
    );
  },
  /**
   * Rend toutes les formules $$...$$ contenues dans un élément.
   * Le parcours se fait sur les nœuds texte : les éléments déjà rendus et les
   * champs de saisie ne sont pas touchés, un second appel ne rend donc rien.
   * @param {Element} root racine du parcours
   * @param {String} fontType "serif" ou "sansSerif"
   */
  renderKatexInElement(root, fontType) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (node.nodeValue.indexOf("$$") === -1) {
          return NodeFilter.FILTER_REJECT;
        }
        return katexSkipped(node.parentNode)
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT;
      },
    });
    const targets = [];
    while (walker.nextNode()) targets.push(walker.currentNode);
    targets.forEach((node) => renderKatexInTextNode(node, fontType));
  },
  /**
   * Render the math
   * @param (dom) wtarget : window reference
   */
  mathRender: function (fontType, wtarget = false, diaporama = false) {
    let contents = ["enonce-content", "corrige-content", "sampleLayer"];
    if (!diaporama) {
      contents = [
        "enonce-content",
        "corrige-content",
        "activityOptions",
        "activityDescription",
        "activityConsigne",
        "creator-content"
      ];
    }
    if (Array.isArray(wtarget)) contents = wtarget;

    contents.forEach((id) => {
      // les cibles sont des identifiants, ou à défaut des sélecteurs CSS
      const content = document.getElementById(id);
      if (content !== null) {
        utils.renderKatexInElement(content, fontType);
      } else {
        document
          .querySelectorAll(id)
          .forEach((elt) => utils.renderKatexInElement(elt, fontType));
      }
    });
    document
      .querySelectorAll(".slide")
      .forEach((elt) => utils.renderKatexInElement(elt, fontType));
    // sans cible explicite, on balaie le reste de la page comme le faisait
    // renderMathInDocument : ce qui vient d'être rendu n'est pas revu
    if (!Array.isArray(wtarget)) {
      utils.renderKatexInElement(document.body, fontType);
    }
  },
  mathReRender(fontStyle) {
    document.querySelectorAll("span[data-latex]").forEach((latexEl) => {
      let latex = latexEl.dataset.latex;
      if (fontStyle === "sansSerif" && !latex.startsWith("\\mathsf")) {
        latex = "\\mathsf {" + latex + "}";
      } else if (
        (fontStyle === "" || fontStyle === "serif") &&
        latex.startsWith("\\mathsf")
      ) {
        latex = latex.slice(9, -1);
      }
      latexEl.dataset.latex = latex;
      latexEl.innerHTML = katexRender(latex);
    });
  },
  /**
   *
   * @param {object} someThing json object or array
   * @returns a clone of the object
   */
  clone(someThing) {
    if (someThing === undefined) return false;
    else if (typeof someThing === "object") {
      return JSON.parse(JSON.stringify(someThing));
    } else {
      return someThing;
    }
  },

  /**
   *
   * @param {Number} value
   * @param {Number} digits
   *
   * return {string} number with a fix digits
   */
  toDigits(value, digits) {
    let puissance = Number(1 + "e" + digits) - 1;
    while (String(value).length < String(puissance).length) {
      value = "0" + value;
    }
    return value;
  },
  /**
   *
   * @param {String} str
   * @returns {String} string url encoded non human readable
   */
  encodeUrlUnreadable(str) {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) =>
        String.fromCharCode(`0x${p1}`),
      ),
    );
  },
  /**
   *
   * @param {String} str
   * @returns {String} string url decoded non human readable
   */
  decodeUrlUnreadable(str) {
    return decodeURIComponent(
      atob(str)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );
  },
  isURLEncoded(str) {
    return !(
      str.indexOf("n=") > -1 ||
      str.indexOf("u=") > -1 ||
      str.indexOf("&p=") > 0 ||
      str.indexOf("&amp;p=") > 0 ||
      str.indexOf("&c=") > 0 ||
      str.indexOf("search=") === 0
    );
  },
};
