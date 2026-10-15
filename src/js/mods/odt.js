import JSZip from "../libs/jszip-esm2015.js";

/**
 * Export des paniers MathsMentales vers LibreOffice.
 *
 * Deux formats :
 *  - Writer (.odt) : les questions (et/ou les réponses) sous forme de listes numérotées ;
 *  - Impress (.odp) : une diapositive par question, avec alternance énoncé / réponse.
 *
 * Le DOM des onglets « énoncés » et « corrigés » est d'abord converti en une
 * structure intermédiaire (voir readSections) commune aux deux générateurs.
 */

const PX_TO_CM = 2.54 / 96;
// largeur d'une colonne de tableau exporté
const TABLE_COLUMN_CM = 2.6;
// page A4 du document Writer, marges réduites pour gagner de la place
const PAGE_WIDTH_CM = 21;
const PAGE_MARGIN_CM = 1;
// éléments qui n'ont aucun sens dans un document bureautique
const SKIPPED_TAGS = new Set([
  "BUTTON",
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "INPUT",
  "SELECT",
  "TEXTAREA",
  "CANVAS",
  "AUDIO",
  "VIDEO",
]);
// blocs qui ne peuvent pas vivre à l'intérieur d'un <text:p>
const BLOCK_TAGS = new Set([
  "DIV",
  "P",
  "TABLE",
  "UL",
  "OL",
  "LI",
  "FIGURE",
  "SECTION",
  "H1",
  "H2",
  "H3",
  "H4",
]);

/* ------------------------------------------------------------------ */
/* Utilitaires XML                                                     */
/* ------------------------------------------------------------------ */

/** Échappe le texte destiné à un nœud XML */
function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
/** Échappe une valeur d'attribut XML */
function escAttr(str) {
  return esc(str).replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
/** Arrondit une longueur en centimètres au centième */
function round2(value) {
  return Math.round(100 * value) / 100;
}

/* ------------------------------------------------------------------ */
/* Contexte de génération : styles automatiques et images              */
/* ------------------------------------------------------------------ */

/**
 * Accumule les styles de texte réellement utilisés et les images à zipper.
 * Un style n'est écrit dans content.xml que s'il a servi.
 */
class Context {
  constructor() {
    this.textStyles = new Map(); // clé de propriétés -> nom de style
    this.tableWidths = new Set(); // nombres de colonnes rencontrés
    this.images = []; // {file, content}
    this.formulas = []; // {dir, content} sous-documents Math
    this.counter = 0;
  }
  /**
   * Renvoie le nom du style de texte correspondant aux propriétés demandées.
   * @param {Object} props {color, bold, italic, underline, position}
   */
  textStyle(props) {
    const key = JSON.stringify(props);
    if (this.textStyles.has(key)) return this.textStyles.get(key);
    const name = "MMT" + this.textStyles.size;
    this.textStyles.set(key, name);
    return name;
  }
  /** Ajoute une image SVG au document et renvoie son chemin dans le ZIP */
  addSVG(content) {
    const file = `Pictures/image_${this.images.length}.svg`;
    this.images.push({ file, content });
    return file;
  }
  /**
   * Ajoute une formule comme sous-document ODF et renvoie sa référence.
   * Writer accepte le MathML écrit directement dans content.xml, pas Impress :
   * le sous-document est la forme comprise par les deux.
   *
   * Le MathML est doublé d'une annotation StarMath, que LibreOffice préfère à
   * son propre import MathML : la formule est alors composée par son moteur
   * natif, et reste éditable dans Math.
   * @param {Element} node élément <math> produit par KaTeX
   * @param {string|null} color couleur du texte environnant
   */
  addFormula(node, color) {
    const dir = `Formule${this.formulas.length + 1}`;
    const mathml = serializeMathMLChildren(node);
    // LibreOffice ignore mathcolor sur <math> : la couleur doit venir d'un mstyle
    const body = color
      ? `<math:mstyle mathcolor="${escAttr(color)}">${mathml}</math:mstyle>`
      : mathml;
    const starmath = starMathFormule(node, color);
    this.formulas.push({
      dir,
      content:
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<math:math xmlns:math="http://www.w3.org/1998/Math/MathML" display="block">' +
        "<math:semantics>" +
        body +
        (starmath
          ? `<math:annotation encoding="StarMath 5.0">${esc(starmath)}</math:annotation>`
          : "") +
        "</math:semantics></math:math>",
    });
    return "./" + dir;
  }
  /** Nom du style de tableau pour un nombre de colonnes donné */
  tableStyle(columns) {
    this.tableWidths.add(columns);
    return "MMTable" + columns;
  }
  /** XML des styles automatiques réellement utilisés */
  autoStylesXML() {
    let xml = this.textStylesXML();
    for (const columns of this.tableWidths) {
      xml +=
        `<style:style style:name="MMTable${columns}" style:family="table">` +
        `<style:table-properties style:width="${columns * TABLE_COLUMN_CM}cm" table:align="left"/>` +
        `</style:style>`;
    }
    return xml;
  }
  /** XML des styles de texte utilisés */
  textStylesXML() {
    let xml = "";
    for (const [key, name] of this.textStyles) {
      const p = JSON.parse(key);
      let props = "";
      if (p.color) props += ` fo:color="${escAttr(p.color)}"`;
      if (p.bold)
        props += ' fo:font-weight="bold" style:font-weight-asian="bold"';
      if (p.italic) props += ' fo:font-style="italic"';
      if (p.underline)
        props +=
          ' style:text-underline-style="solid" style:text-underline-width="auto"';
      if (p.position) props += ` style:text-position="${p.position}"`;
      xml += `<style:style style:name="${name}" style:family="text"><style:text-properties${props}/></style:style>`;
    }
    return xml;
  }
}

/* ------------------------------------------------------------------ */
/* Couleurs                                                            */
/* ------------------------------------------------------------------ */

const NAMED_COLORS = {
  red: "#CC0000",
  rouge: "#CC0000",
  blue: "#0000CC",
  bleu: "#0000CC",
  green: "#008000",
  vert: "#008000",
  orange: "#E07000",
  purple: "#800080",
  violet: "#800080",
  turquoise: "#008080",
  magenta: "#CC00CC",
  gray: "#666666",
  grey: "#666666",
  black: "#000000",
};

/** Traduit une couleur CSS (nom, #rgb, rgb()) en #RRGGBB, ou null */
function cssColor(value) {
  if (!value) return null;
  const v = String(value).trim().toLowerCase();
  if (NAMED_COLORS[v]) return NAMED_COLORS[v];
  let m = /^#([0-9a-f]{3})$/.exec(v);
  if (m)
    return (
      "#" +
      m[1]
        .split("")
        .map((c) => c + c)
        .join("")
        .toUpperCase()
    );
  m = /^#([0-9a-f]{6})$/.exec(v);
  if (m) return "#" + m[1].toUpperCase();
  m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(v);
  if (m) {
    return (
      "#" +
      [m[1], m[2], m[3]]
        .map((n) => Number(n).toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase()
    );
  }
  return null;
}

/**
 * Propriétés de texte apportées par un élément HTML (classes, balise, style).
 * Renvoie null si l'élément n'apporte aucune mise en forme.
 */
function inlineProps(el) {
  const props = {};
  const tag = el.nodeName;
  if (tag === "B" || tag === "STRONG") props.bold = true;
  if (tag === "I" || tag === "EM") props.italic = true;
  if (tag === "U") props.underline = true;
  if (tag === "SUP") props.position = "super 58%";
  if (tag === "SUB") props.position = "sub 58%";
  const classes = String(el.getAttribute("class") || "").split(/\s+/);
  for (const c of classes) {
    const color = NAMED_COLORS[c];
    if (color) props.color = color;
    if (c === "bold" || c === "gras") props.bold = true;
    if (c === "italic" || c === "italique") props.italic = true;
  }
  const styleColor = cssColor(el.style && el.style.color);
  if (styleColor) props.color = styleColor;
  if (el.style && /bold|[7-9]00/.test(el.style.fontWeight || ""))
    props.bold = true;
  if (el.style && el.style.fontStyle === "italic") props.italic = true;
  return Object.keys(props).length ? props : null;
}

/** Fusionne les propriétés héritées et celles de l'élément courant */
function mergeProps(inherited, own) {
  if (!own) return inherited;
  return Object.assign({}, inherited, own);
}

/** L'élément est-il masqué à l'écran ? */
function isHidden(el) {
  if (el.classList && el.classList.contains("hidden")) return true;
  const style = el.getAttribute && el.getAttribute("style");
  // JSXGraph masque ses textes de service (l'infobox « 0,0 ») de ces deux façons
  return !!style && /display\s*:\s*none|visibility\s*:\s*hidden/.test(style);
}

/* ------------------------------------------------------------------ */
/* MathML                                                              */
/* ------------------------------------------------------------------ */

/**
 * Sérialise un arbre MathML en balises préfixées math: (namespace ODF).
 * Les attributs de mesure ajoutés par MathsMentales sont retirés.
 */
function serializeMathML(node, root = false) {
  if (node.nodeType === 3) return esc(node.nodeValue);
  if (node.nodeType !== 1) return "";
  const name = (node.localName || node.nodeName).toLowerCase();
  let attrs = "";
  if (node.attributes) {
    for (const attr of Array.from(node.attributes)) {
      const an = attr.name;
      if (an === "xmlns" || an.startsWith("xmlns:")) continue;
      if (an.indexOf(":") > -1) continue; // préfixes inconnus du namespace math
      if (root && (an === "width" || an === "height")) continue;
      attrs += ` ${an}="${escAttr(attr.value)}"`;
    }
  }
  return `<math:${name}${attrs}>${serializeMathMLChildren(node)}</math:${name}>`;
}

/** Sérialise uniquement le contenu d'un élément MathML */
function serializeMathMLChildren(node) {
  let inner = "";
  for (const child of Array.from(node.childNodes)) {
    inner += serializeMathML(child);
  }
  return inner;
}

/* ------------------------------------------------------------------ */
/* Traduction MathML -> StarMath                                       */
/* ------------------------------------------------------------------ */

/*
 * À l'ouverture d'un objet Math, LibreOffice relit en priorité l'annotation
 * « StarMath 5.0 » du sous-document, et ne se rabat sur le MathML qu'à défaut.
 * Traduire les formules dans son propre langage lui rend donc la main sur la
 * composition : chapeaux et flèches étirés, racines et fractions au gabarit
 * maison, formule éditable telle que l'utilisateur l'aurait saisie.
 */

/** Caractères MathML sans effet visible, à ne pas traduire */
const STARMATH_INVISIBLES = /^[⁡-⁤​‌‍﻿]+$/;
/** Symboles et opérateurs : contenu du nœud -> jeton StarMath */
const STARMATH_SYMBOLES = {
  "−": "-",
  "–": "-",
  "×": "times",
  "·": "cdot",
  "⋅": "cdot",
  "∗": "*",
  "÷": "div",
  "≤": "<=",
  "⩽": "<=",
  "≥": ">=",
  "⩾": ">=",
  "≠": "<>",
  "≈": "approx",
  "≃": "simeq",
  "∼": "sim",
  "≡": "equiv",
  "∝": "prop",
  "±": "+-",
  "∓": "-+",
  "∞": "infinity",
  "∈": "in",
  "∉": "notin",
  "∋": "owns",
  "⊂": "subset",
  "⊆": "subseteq",
  "⊃": "supset",
  "⊇": "supseteq",
  "∩": "intersection",
  "∪": "union",
  "∅": "emptyset",
  "∀": "forall",
  "∃": "exists",
  "¬": "neg",
  "∧": "and",
  "∨": "or",
  "→": "rightarrow",
  "←": "leftarrow",
  "↔": "leftrightarrow",
  "⇒": "drarrow",
  "⇐": "dlarrow",
  "⇔": "dlrarrow",
  "↦": "rightarrow",
  "∑": "sum",
  "∏": "prod",
  "∐": "coprod",
  "∫": "int",
  "∬": "iint",
  "∭": "iiint",
  "∮": "lint",
  "√": "sqrt",
  "∂": "partial",
  "∇": "nabla",
  "∠": "angle",
  "…": "dotslow",
  "⋯": "dotsaxis",
  "⋮": "dotsvert",
  "⋱": "dotsdown",
  "′": "'",
  "″": "''",
  ℝ: "setR",
  ℕ: "setN",
  ℤ: "setZ",
  ℚ: "setQ",
  ℂ: "setC",
  "%": '"%"',
  "|": '"|"',
  "{": "lbrace",
  "}": "rbrace",
  "‖": "ldline",
};
/** Lettres grecques : caractère -> symbole StarMath */
const STARMATH_GREC = {
  α: "%alpha",
  β: "%beta",
  γ: "%gamma",
  δ: "%delta",
  ε: "%epsilon",
  ζ: "%zeta",
  η: "%eta",
  θ: "%theta",
  ι: "%iota",
  κ: "%kappa",
  λ: "%lambda",
  μ: "%mu",
  ν: "%nu",
  ξ: "%xi",
  π: "%pi",
  ρ: "%rho",
  σ: "%sigma",
  τ: "%tau",
  υ: "%upsilon",
  φ: "%phi",
  χ: "%chi",
  ψ: "%psi",
  ω: "%omega",
  Γ: "%GAMMA",
  Δ: "%DELTA",
  Θ: "%THETA",
  Λ: "%LAMBDA",
  Ξ: "%XI",
  Π: "%PI",
  Σ: "%SIGMA",
  Φ: "%PHI",
  Ψ: "%PSI",
  Ω: "%OMEGA",
};
/** Délimiteurs de \left … \right : caractère -> jetons ouvrant et fermant */
const STARMATH_DELIMITEURS = {
  "(": ["(", ")"],
  ")": ["(", ")"],
  "[": ["[", "]"],
  "]": ["[", "]"],
  "{": ["lbrace", "rbrace"],
  "}": ["lbrace", "rbrace"],
  "⟨": ["langle", "rangle"],
  "⟩": ["langle", "rangle"],
  "⌈": ["lceil", "rceil"],
  "⌉": ["lceil", "rceil"],
  "⌊": ["lfloor", "rfloor"],
  "⌋": ["lfloor", "rfloor"],
  "|": ["lline", "rline"],
  "∣": ["lline", "rline"],
  "‖": ["ldline", "rdline"],
  "∥": ["ldline", "rdline"],
};
/** Parenthèses appariées dans leur séquence : elles peuvent rester nues */
const PARENTHESES_NUES = new WeakSet();
/** Crochets dont StarMath fait un groupement, donc à apparier avant d'écrire */
const STARMATH_PAIRES = { "(": ")", "[": "]" };
/**
 * Signes de <mover>/<munder> unaires. Les caractères combinants d'origine
 * figurent à côté de leur substitut, adapteAccents pouvant ne pas être passé.
 */
const STARMATH_ACCENTS = {
  ˆ: "widehat",
  "^": "widehat",
  "̂": "widehat",
  "˜": "widetilde",
  "~": "widetilde",
  "̃": "widetilde",
  "‾": "overline",
  "¯": "overline",
  "̄": "overline",
  "→": "widevec",
  "⃗": "widevec",
  "¨": "ddot",
  "̈": "ddot",
  "˙": "dot",
  "̇": "dot",
  ˇ: "check",
  "̌": "check",
  "˘": "breve",
  "̆": "breve",
  ˊ: "acute",
  "́": "acute",
  ˋ: "grave",
  "̀": "grave",
};
/** Lettres ajourées de \mathbb : caractère -> ensemble StarMath */
const STARMATH_ENSEMBLES = {
  R: "setR",
  N: "setN",
  Z: "setZ",
  Q: "setQ",
  C: "setC",
};
/** Fonctions reconnues telles quelles par StarMath */
const STARMATH_FONCTIONS = new Set([
  "sin",
  "cos",
  "tan",
  "cot",
  "sinh",
  "cosh",
  "tanh",
  "coth",
  "arcsin",
  "arccos",
  "arctan",
  "arccot",
  "arsinh",
  "arcosh",
  "artanh",
  "arcoth",
  "ln",
  "log",
  "exp",
  "lim",
  "liminf",
  "limsup",
]);
/** Jetons acceptant les indices sous forme from/to plutôt que _ et ^ */
const STARMATH_GRANDS = new Set([
  "sum",
  "prod",
  "coprod",
  "int",
  "iint",
  "iiint",
  "lint",
  "union",
  "intersection",
  "lim",
  "liminf",
  "limsup",
]);
/** Couleurs CSS courantes absentes du vocabulaire StarMath */
const STARMATH_HEX = {
  orange: "ffa500",
  purple: "800080",
  brown: "a52a2a",
  pink: "ffc0cb",
  darkgreen: "006400",
  darkblue: "00008b",
  darkred: "8b0000",
  orangered: "ff4500",
  violet: "ee82ee",
  indigo: "4b0082",
  gold: "ffd700",
  teal: "008080",
  navy: "000080",
  olive: "808000",
  silver: "c0c0c0",
  maroon: "800000",
  lime: "00ff00",
  aqua: "00ffff",
  fuchsia: "ff00ff",
};
/** Couleurs nommées comprises par toutes les versions de LibreOffice */
const STARMATH_COULEURS = new Set([
  "black",
  "white",
  "red",
  "green",
  "blue",
  "cyan",
  "magenta",
  "yellow",
  "gray",
]);
/** Jetons infixes : StarMath leur réclame un terme de part et d'autre */
const STARMATH_INFIXES = new Set([
  "=",
  "<",
  ">",
  "<=",
  ">=",
  "<>",
  "*",
  "/",
  "times",
  "cdot",
  "div",
  "over",
  "wideslash",
  "approx",
  "simeq",
  "sim",
  "equiv",
  "prop",
  "in",
  "notin",
  "owns",
  "subset",
  "subseteq",
  "supset",
  "supseteq",
  "union",
  "intersection",
  "and",
  "or",
]);

/** Texte littéral StarMath : les guillemets, sans échappement, sont doublés */
function smTexte(str) {
  return '"' + String(str).replace(/"/g, "''") + '"';
}
/** Opérande StarMath : les accolades ne servent qu'au groupement */
function smGroupe(str) {
  return "{" + smTermes(str) + "}";
}
/**
 * Complète une suite de termes des littéraux vides qui lui manquent :
 * LibreOffice rejette la formule entière si un opérateur infixe n'a rien à sa
 * gauche ou à sa droite — l'étoile de ℝ*, le = qui ouvre une réponse colorée —
 * ou si un groupement est vide.
 */
function smTermes(str) {
  const contenu = (str || "").trim();
  if (!contenu) return '""';
  const jetons = contenu.split(/\s+/);
  const avant = STARMATH_INFIXES.has(jetons[0]) ? '"" ' : "";
  const apres = STARMATH_INFIXES.has(jetons[jetons.length - 1]) ? ' ""' : "";
  return avant + contenu + apres;
}
/**
 * Traduit les enfants d'un nœud, séparés par des espaces.
 * Deux passes préalables évitent des sorties illisibles ou invalides :
 * les nombres décimaux sont recollés, et les parenthèses appariées repérées.
 */
function smListe(node) {
  return smSequence(Array.from(node.childNodes));
}
/** Traduction d'une suite de nœuds frères */
function smSequence(enfants) {
  marqueParentheses(enfants);
  const parts = [];
  for (let i = 0; i < enfants.length; i++) {
    const child = enfants[i];
    if (child.nodeType === 3) {
      if (child.nodeValue.trim()) parts.push(smTexte(child.nodeValue));
      continue;
    }
    const decimal = smDecimal(enfants, i);
    if (decimal) {
      parts.push(decimal);
      i += 2; // le séparateur et la partie décimale sont consommés
      continue;
    }
    const part = starMath(child);
    if (part) parts.push(part);
  }
  return parts.join(" ");
}
/** Nom d'un élément, en minuscules */
function smNom(node) {
  return node.nodeType === 1
    ? (node.localName || node.nodeName).toLowerCase()
    : "";
}
/**
 * Nombre décimal écrit en trois nœuds (12 , 5) : StarMath espacerait la
 * virgule comme une ponctuation, un littéral garde le nombre d'un seul tenant.
 * @returns {string} littéral StarMath, ou "" si la séquence n'en est pas un
 */
function smDecimal(enfants, i) {
  const [gauche, milieu, droite] = [enfants[i], enfants[i + 1], enfants[i + 2]];
  if (!droite || smNom(gauche) !== "mn" || smNom(droite) !== "mn") return "";
  if (smNom(milieu) !== "mo") return "";
  const separateur = milieu.textContent.trim();
  if (separateur !== "," && separateur !== ".") return "";
  return smTexte(
    gauche.textContent.trim() + separateur + droite.textContent.trim(),
  );
}
/**
 * Repère dans une séquence les parenthèses et crochets qui vont par paires :
 * StarMath en fait un groupement, et refuse la formule s'il en manque un —
 * cas courant des intervalles à la française, [0 ; 1[. Les esseulés seront
 * écrits en littéral, seule forme qui ne réclame pas de partenaire.
 */
function marqueParentheses(enfants) {
  const attente = [];
  for (const child of enfants) {
    if (smNom(child) !== "mo" || child.getAttribute("fence") === "true")
      continue;
    const texte = child.textContent.trim();
    if (STARMATH_PAIRES[texte]) {
      attente.push(child);
      continue;
    }
    for (let i = attente.length - 1; i >= 0; i--) {
      if (STARMATH_PAIRES[attente[i].textContent.trim()] !== texte) continue;
      PARENTHESES_NUES.add(attente[i]);
      PARENTHESES_NUES.add(child);
      attente.length = i;
      break;
    }
  }
}
/** Contenu d'un nœud feuille, débarrassé des caractères invisibles */
function smContenu(node) {
  const text = node.textContent;
  return STARMATH_INVISIBLES.test(text) ? "" : text;
}
/**
 * Couleur CSS -> argument de la commande color.
 * @returns {string} jeton StarMath, ou "" si la couleur est intraduisible
 */
function smCouleur(color) {
  const value = String(color || "")
    .trim()
    .toLowerCase();
  if (!value) return "";
  if (STARMATH_COULEURS.has(value)) return value;
  if (value === "grey") return "gray";
  // « color hex » n'est pas compris de LibreOffice, qui affiche les chiffres
  // du code comme du texte : les couleurs libres passent par « color rgb »
  const rgb = (r, v, b) => `rgb ${r} ${v} ${b}`;
  const octets = (h) =>
    rgb(
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    );
  if (STARMATH_HEX[value]) return octets(STARMATH_HEX[value]);
  let hex = /^#([0-9a-f]{6})$/.exec(value);
  if (hex) return octets(hex[1]);
  hex = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(value);
  if (hex) {
    return octets(hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]);
  }
  const css = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/.exec(value);
  if (css) {
    const octet = (n) => Math.min(255, Number(n));
    return rgb(octet(css[1]), octet(css[2]), octet(css[3]));
  }
  return "";
}
/** <mi> : variable en italique, fonction ou symbole en romain */
function smIdentifiant(node) {
  const text = smContenu(node).trim();
  if (!text) return "";
  const variante = node.getAttribute("mathvariant") || "";
  if (variante === "double-struck" && STARMATH_ENSEMBLES[text])
    return STARMATH_ENSEMBLES[text];
  if (STARMATH_GREC[text]) return STARMATH_GREC[text];
  if (STARMATH_SYMBOLES[text]) return STARMATH_SYMBOLES[text];
  if (STARMATH_FONCTIONS.has(text)) return text;
  if (variante === "normal") return smTexte(text);
  if (/^[A-Za-z]$/.test(text)) return text; // variable : italique par défaut
  if (/^[A-Za-z]+$/.test(text)) return "func " + text;
  return smTexte(text);
}
/** <mn> : les nombres non entiers passent en littéral pour rester intacts */
function smNombre(node) {
  const text = smContenu(node).trim();
  if (!text) return "";
  return /^[0-9]+$/.test(text) ? text : smTexte(text);
}
/** <mo> : opérateur, relation ou délimiteur isolé */
function smOperateur(node) {
  const text = smContenu(node).trim();
  if (!text) return "";
  if (STARMATH_PAIRES[text] || text === ")" || text === "]")
    return PARENTHESES_NUES.has(node) ? text : smTexte(text);
  if (STARMATH_SYMBOLES[text]) return STARMATH_SYMBOLES[text];
  if (STARMATH_GREC[text]) return STARMATH_GREC[text];
  if (STARMATH_FONCTIONS.has(text)) return text;
  if (/^[-+=<>;:,.!/*']$/.test(text)) return text;
  return smTexte(text);
}
/** Le nœud est-il un délimiteur de \left … \right ? */
function estDelimiteur(node) {
  return (
    smNom(node) === "mo" &&
    node.getAttribute("fence") === "true" &&
    STARMATH_DELIMITEURS[smContenu(node).trim()] !== undefined
  );
}
/** Jeton d'un délimiteur, du côté ouvrant (0) ou fermant (1) */
function smDelimiteur(node, cote) {
  return STARMATH_DELIMITEURS[smContenu(node).trim()][cote];
}
/**
 * <mrow> : suite de termes, éventuellement encadrée par une paire \left…\right.
 * Les délimiteurs deviennent alors left/right, seule forme qui les étire et qui
 * tolère les paires dépareillées comme l'intervalle [0 ; 1[.
 */
function smRangee(node) {
  const children = Array.from(node.children);
  const first = children.length > 1 && estDelimiteur(children[0]);
  const last =
    children.length > 1 && estDelimiteur(children[children.length - 1]);
  if (!first && !last) return smListe(node);
  const inner = smSequence(
    children.slice(first ? 1 : 0, last ? -1 : undefined),
  );
  const open = first ? smDelimiteur(children[0], 0) : "none";
  const close = last ? smDelimiteur(children[children.length - 1], 1) : "none";
  return `left ${open} ${inner} right ${close}`;
}
/** <mfrac> : fraction, coefficient binomial ou barre oblique */
function smFraction(node) {
  const [num, den] = Array.from(node.children);
  const haut = smGroupe(num ? starMath(num) : "");
  const bas = smGroupe(den ? starMath(den) : "");
  const trait = node.getAttribute("linethickness");
  if (trait !== null && /^0[a-z%]*$/.test(trait.trim()))
    return `binom ${haut} ${bas}`;
  if (node.getAttribute("bevelled") === "true")
    return `${haut} wideslash ${bas}`;
  return `${haut} over ${bas}`;
}
/**
 * Indice et exposant. Les grands opérateurs (somme, intégrale, limite) n'en
 * acceptent pas en StarMath : leurs bornes s'écrivent from et to.
 * @param {Element|null} base
 * @param {Element|null} indice
 * @param {Element|null} exposant
 */
function smScripts(base, indice, exposant) {
  if (!base) return "";
  const jeton = starMath(base);
  const grand = STARMATH_GRANDS.has(jeton);
  let out = grand ? jeton : smGroupe(jeton);
  if (indice) out += ` ${grand ? "from" : "_"} ${smGroupe(starMath(indice))}`;
  if (exposant) out += ` ${grand ? "to" : "^"} ${smGroupe(starMath(exposant))}`;
  return out;
}
/** <mover> : accent étiré, accolade supérieure, ou borne d'un grand opérateur */
function smSurmonte(node) {
  const children = Array.from(node.children);
  const base = children[0];
  const signe = children[children.length - 1];
  if (!base || children.length < 2) return smListe(node);
  const texte = signe.textContent.trim();
  if (STARMATH_ACCENTS[texte])
    return `${STARMATH_ACCENTS[texte]} ${smGroupe(starMath(base))}`;
  if (texte === "⏞") return `${smGroupe(starMath(base))} overbrace {}`;
  const jeton = starMath(base);
  const grand = STARMATH_GRANDS.has(jeton);
  return `${grand ? jeton : smGroupe(jeton)} ${grand ? "to" : "csup"} ${smGroupe(starMath(signe))}`;
}
/** <munder> : soulignement, accolade inférieure, ou borne d'un grand opérateur */
function smSousmonte(node) {
  const children = Array.from(node.children);
  const base = children[0];
  const signe = children[children.length - 1];
  if (!base || children.length < 2) return smListe(node);
  const texte = signe.textContent.trim();
  if (texte === "‾" || texte === "_" || texte === "̲")
    return `underline ${smGroupe(starMath(base))}`;
  if (texte === "⏟") return `${smGroupe(starMath(base))} underbrace {}`;
  const jeton = starMath(base);
  const grand = STARMATH_GRANDS.has(jeton);
  return `${grand ? jeton : smGroupe(jeton)} ${grand ? "from" : "csub"} ${smGroupe(starMath(signe))}`;
}
/** <munderover> : bornes d'un grand opérateur, ou double script centré */
function smEncadre(node) {
  const [base, dessous, dessus] = Array.from(node.children);
  if (!base) return "";
  const jeton = starMath(base);
  const grand = STARMATH_GRANDS.has(jeton);
  const bas = smGroupe(dessous ? starMath(dessous) : "");
  const haut = smGroupe(dessus ? starMath(dessus) : "");
  return grand
    ? `${jeton} from ${bas} to ${haut}`
    : `${smGroupe(jeton)} csub ${bas} csup ${haut}`;
}
/** <mtable> : tableau aligné, y compris le corps d'un \begin{cases} */
function smTableau(node) {
  const alignement = (cell, row) => {
    const align =
      cell.getAttribute("columnalign") ||
      row.getAttribute("columnalign") ||
      node.getAttribute("columnalign") ||
      "";
    if (align.startsWith("left")) return "alignl ";
    if (align.startsWith("right")) return "alignr ";
    return "";
  };
  const lignes = Array.from(node.children)
    .filter((row) => (row.localName || "").toLowerCase() === "mtr")
    .map((row) =>
      Array.from(row.children)
        .map((cell) => alignement(cell, row) + smGroupe(smListe(cell)))
        .join(" # "),
    );
  return `matrix{${lignes.join(" ## ")}}`;
}
/** <mstyle> : couleur, graisse et style hérités par le terme qui suit */
function smStyle(node) {
  let corps = smListe(node);
  const variante = node.getAttribute("mathvariant") || "";
  if (variante.indexOf("bold") > -1) corps = `bold ${smGroupe(corps)}`;
  if (variante.indexOf("italic") > -1) corps = `italic ${smGroupe(corps)}`;
  const couleur = smCouleur(node.getAttribute("mathcolor"));
  return couleur ? `color ${couleur} ${smGroupe(corps)}` : corps;
}
/**
 * Traduit un nœud MathML en StarMath.
 * Sous-ensemble couvert : celui que produit KaTeX pour les activités —
 * mrow, mi, mn, mo, mtext, mspace, mfrac, msqrt, mroot, msup/msub/msubsup,
 * mover/munder/munderover, mstyle, mpadded, mphantom, menclose, mtable.
 * Tout nœud inconnu est traversé plutôt qu'abandonné.
 * @param {Node} node
 * @returns {string} formule StarMath, vide si le nœud n'a rien donné
 */
function starMath(node) {
  if (node.nodeType === 3) {
    const text = node.nodeValue.trim();
    return text ? smTexte(node.nodeValue) : "";
  }
  if (node.nodeType !== 1) return "";
  const name = (node.localName || node.nodeName).toLowerCase();
  switch (name) {
    case "mi":
      return smIdentifiant(node);
    case "mn":
      return smNombre(node);
    case "mo":
      return smOperateur(node);
    case "mtext": {
      const text = smContenu(node);
      return text ? smTexte(text) : "";
    }
    case "mspace":
      return "~";
    case "mrow":
      return smRangee(node);
    case "mfrac":
      return smFraction(node);
    case "msqrt":
      return `sqrt ${smGroupe(smListe(node))}`;
    case "mroot": {
      const [base, indice] = Array.from(node.children);
      return `nroot ${smGroupe(indice ? starMath(indice) : "")} ${smGroupe(base ? starMath(base) : "")}`;
    }
    case "msup": {
      const [base, exposant] = Array.from(node.children);
      return smScripts(base, null, exposant);
    }
    case "msub": {
      const [base, indice] = Array.from(node.children);
      return smScripts(base, indice, null);
    }
    case "msubsup": {
      const [base, indice, exposant] = Array.from(node.children);
      return smScripts(base, indice, exposant);
    }
    case "mover":
      return smSurmonte(node);
    case "munder":
      return smSousmonte(node);
    case "munderover":
      return smEncadre(node);
    case "mstyle":
      return smStyle(node);
    case "mphantom":
      return `phantom ${smGroupe(smListe(node))}`;
    case "menclose": {
      const notation = node.getAttribute("notation") || "";
      const barre = /strike|cancel/.test(notation);
      return barre ? `overstrike ${smGroupe(smListe(node))}` : smListe(node);
    }
    case "mtable":
      return smTableau(node);
    case "mtr":
    case "mtd":
    case "mpadded": // \colorbox : StarMath n'a pas de fond, le contenu suffit
    case "semantics":
    case "math":
    default:
      return smListe(node);
  }
}
/**
 * Formule StarMath complète, couleur d'ensemble comprise.
 * @param {Element} node élément <math>
 * @param {string|null} color couleur du texte environnant
 */
function starMathFormule(node, color) {
  const corps = smListe(node);
  if (!corps) return "";
  const couleur = smCouleur(color);
  return couleur ? `color ${couleur} ${smGroupe(corps)}` : smTermes(corps);
}

/* ------------------------------------------------------------------ */
/* Traduction MathML -> texte brut                                     */
/* ------------------------------------------------------------------ */

/*
 * Une cellule de tableau ne peut pas accueillir d'objet sous Impress, qui
 * n'ancre rien dans du texte : la formule y est écrite en clair, à plat.
 * Writer, lui, garde ses objets Math.
 */

/** Faut-il parenthéser un morceau placé au-dessus ou au-dessous d'une barre ? */
function parenthese(texte) {
  return /^[\wÀ-ÿ,.]*$/.test(texte) ? texte : `(${texte})`;
}

/**
 * Traduit un nœud MathML en texte brut : fractions à la barre oblique,
 * puissances au chapeau, racines au radical.
 * @returns {string} texte lisible, vide si le nœud n'a rien donné
 */
function texteMathML(node) {
  if (node.nodeType === 3) {
    return STARMATH_INVISIBLES.test(node.nodeValue) ? "" : node.nodeValue;
  }
  if (node.nodeType !== 1) return "";
  const enfants = Array.from(node.children);
  const liste = () =>
    Array.from(node.childNodes)
      .map((child) => texteMathML(child))
      .join("");
  const morceau = (index) =>
    enfants[index] ? texteMathML(enfants[index]) : "";
  switch ((node.localName || node.nodeName).toLowerCase()) {
    case "mfrac":
      return `${parenthese(morceau(0))}/${parenthese(morceau(1))}`;
    case "msqrt":
      return `√${parenthese(liste())}`;
    case "mroot":
      return `${morceau(1)}√${parenthese(morceau(0))}`;
    case "msup":
      return `${morceau(0)}^${parenthese(morceau(1))}`;
    case "msub":
      return `${morceau(0)}_${parenthese(morceau(1))}`;
    case "msubsup":
      return `${morceau(0)}_${parenthese(morceau(1))}^${parenthese(morceau(2))}`;
    case "mspace":
      return " ";
    case "mtd":
      return liste() + " ";
    case "mtr":
      return liste().trim() + " ";
    default:
      return liste();
  }
}

/**
 * Formule MathML : taille en centimètres et contenu ODF de l'objet.
 * @param {Element} node élément <math> porteur des attributs width/height (px)
 */
function formulaParts(node, ctx, scale = 1, color = null) {
  const width = (Number(node.getAttribute("width")) || 40) * PX_TO_CM * scale;
  const height = (Number(node.getAttribute("height")) || 20) * PX_TO_CM * scale;
  const href = ctx.addFormula(node, color);
  return {
    width: Math.max(0.5, Math.round(100 * width) / 100),
    height: Math.max(0.4, Math.round(100 * height) / 100),
    object:
      `<draw:object xlink:href="${escAttr(href)}" xlink:type="simple"` +
      ` xlink:show="embed" xlink:actuate="onLoad"/>`,
  };
}

/** Cadre ODF ancré dans le texte contenant une formule MathML */
function formulaFrame(node, ctx, color) {
  const { width, height, object } = formulaParts(node, ctx, 1, color);
  return (
    `<draw:frame draw:style-name="MMFormula" text:anchor-type="as-char"` +
    ` svg:width="${width}cm" svg:height="${height}cm">` +
    object +
    `</draw:frame>`
  );
}

/* ------------------------------------------------------------------ */
/* Images SVG                                                          */
/* ------------------------------------------------------------------ */

/** Facteurs de conversion des unités CSS absolues vers le pixel */
const CSS_UNITS = {
  px: 1,
  pt: 96 / 72,
  pc: 16,
  cm: 96 / 2.54,
  mm: 96 / 25.4,
  in: 96,
};

/**
 * Convertit une longueur CSS (« 120 », « 10em », « 4cm »…) en pixels.
 * Les SVG dessinés à la main portent souvent un viewBox en unités Inkscape
 * (millimètres) et une taille d'affichage en em : lire le viewBox comme des
 * pixels donnerait une image minuscule dans le document exporté.
 */
function cssLength(value, node) {
  if (!value) return 0;
  const match = String(value)
    .trim()
    .match(/^(-?[\d.]+)\s*([a-z%]*)$/i);
  if (!match) return 0;
  const n = parseFloat(match[1]);
  if (!isFinite(n) || n <= 0) return 0;
  const unit = (match[2] || "px").toLowerCase();
  if (CSS_UNITS[unit]) return n * CSS_UNITS[unit];
  if (unit !== "em" && unit !== "rem" && unit !== "ex") return 0;
  let fontSize = 16;
  try {
    const target = unit === "rem" ? document.documentElement : node;
    fontSize = parseFloat(getComputedStyle(target).fontSize) || 16;
  } catch (e) {
    /* pas de rendu disponible */
  }
  return unit === "ex" ? n * fontSize * 0.5 : n * fontSize;
}

/** Rapport largeur/hauteur du viewBox, 0 s'il est absent ou invalide */
function viewBoxRatio(svg) {
  const viewBox = svg.getAttribute("viewBox");
  if (!viewBox) return 0;
  const parts = viewBox
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  if (parts.length !== 4 || !(parts[2] > 0) || !(parts[3] > 0)) return 0;
  return parts[2] / parts[3];
}

/**
 * Dimensions d'affichage d'un <svg>, en pixels : mesure écran, puis attributs
 * width/height, puis viewBox en dernier recours.
 */
function svgSize(svg) {
  try {
    const box = svg.getBoundingClientRect();
    if (box.width > 0 && box.height > 0) return [box.width, box.height];
  } catch (e) {
    /* pas de rendu disponible */
  }
  const w = cssLength(svg.getAttribute("width"), svg);
  const h = cssLength(svg.getAttribute("height"), svg);
  if (w > 0 && h > 0) return [w, h];
  const ratio = viewBoxRatio(svg);
  if (ratio) {
    if (w > 0) return [w, w / ratio];
    if (h > 0) return [h * ratio, h];
    const viewBox = svg
      .getAttribute("viewBox")
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    return [viewBox[2], viewBox[3]];
  }
  if (w > 0 || h > 0) return [w || h, h || w];
  return [300, 150];
}

/**
 * Retire les éléments masqués d'un SVG cloné.
 * JSXGraph laisse dans la figure des éléments cachés — dont l'infobox qui
 * affiche « 0,0 » — qu'il masque par display="none" ou visibility:hidden ;
 * un export les rendrait visibles.
 */
function cleanSVG(svg) {
  const hiddenNodes = svg.querySelectorAll(
    '[display="none"], [visibility="hidden"], [style*="display: none"],' +
      ' [style*="display:none"], [style*="visibility: hidden"],' +
      ' [style*="visibility:hidden"]',
  );
  hiddenNodes.forEach((node) => node.remove());
  return svg;
}

/**
 * Propriétés de style SVG reportées en attributs, avec leur valeur initiale :
 * une valeur identique à la valeur initiale n'est pas écrite.
 */
const SVG_STYLE_PROPS = {
  fill: "rgb(0, 0, 0)",
  "fill-opacity": "1",
  "fill-rule": "nonzero",
  stroke: "none",
  "stroke-width": "1px",
  "stroke-opacity": "1",
  "stroke-linecap": "butt",
  "stroke-linejoin": "miter",
  "stroke-dasharray": "none",
  "stroke-miterlimit": "4",
  opacity: "1",
  "font-style": "normal",
  "font-weight": "400",
  "text-anchor": "start",
  "letter-spacing": "normal",
};
/** Propriétés reportées uniquement sur les nœuds de texte */
const SVG_TEXT_PROPS = ["font-family", "font-size"];
/** Longueurs à écrire sans unité : LibreOffice ignore « 2px » */
const SVG_UNITLESS_PROPS = new Set([
  "stroke-width",
  "font-size",
  "letter-spacing",
]);

/** Couleur CSS -> { color, opacity } avec la couleur en hexadécimal */
function svgColor(value) {
  const match = value.match(
    /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[,/]\s*([\d.%]+)\s*)?\)$/i,
  );
  if (!match) return { color: value, opacity: null };
  const hex = [1, 2, 3]
    .map((i) => Math.round(Number(match[i])).toString(16).padStart(2, "0"))
    .join("");
  let opacity = null;
  if (match[4] !== undefined) {
    opacity = match[4].endsWith("%")
      ? String(parseFloat(match[4]) / 100)
      : match[4];
  }
  return { color: "#" + hex, opacity };
}

/**
 * Recopie sur le clone les styles calculés du SVG affiché.
 * Scratchblocks (et les figures dessinées à la main) colorent leurs éléments
 * par des règles CSS placées dans une balise <style> : LibreOffice n'applique
 * pas ces sélecteurs et rend toute la figure en noir. On fige donc les styles
 * en attributs de présentation, puis on retire les feuilles de style devenues
 * inutiles.
 */
function inlineSVGStyles(source, clone) {
  const sources = [source, ...source.querySelectorAll("*")];
  const clones = [clone, ...clone.querySelectorAll("*")];
  if (sources.length !== clones.length) return clone;
  const hidden = [];
  sources.forEach((node, i) => {
    const target = clones[i];
    if ((node.localName || "").toLowerCase() === "style") return;
    let style;
    try {
      style = getComputedStyle(node);
    } catch (e) {
      return; /* nœud non rendu */
    }
    if (!style || !style.getPropertyValue) return;
    // les définitions ne sont pas rendues mais restent référencées par <use>
    const inDefs =
      node.closest &&
      node.closest("defs, symbol, clipPath, mask, marker, pattern");
    if (
      !inDefs &&
      (style.display === "none" || style.visibility === "hidden")
    ) {
      hidden.push(target);
      return;
    }
    const props = Object.keys(SVG_STYLE_PROPS);
    if (/^(text|tspan|textPath)$/i.test(node.localName || "")) {
      props.push(...SVG_TEXT_PROPS);
    }
    props.forEach((prop) => {
      let value = style.getPropertyValue(prop);
      if (!value) return;
      value = value.trim();
      if (value === SVG_STYLE_PROPS[prop]) {
        // valeur initiale : un attribut resté sur le clone la contredirait
        if (target.hasAttribute(prop)) target.removeAttribute(prop);
        return;
      }
      if (prop === "fill" || prop === "stroke") {
        const { color, opacity } = svgColor(value);
        value = color;
        if (opacity !== null) target.setAttribute(prop + "-opacity", opacity);
      } else if (SVG_UNITLESS_PROPS.has(prop) && value.endsWith("px")) {
        value = value.slice(0, -2);
      } else if (prop === "font-family") {
        // les guillemets autour des noms de police perturbent LibreOffice
        value = value.replace(/["']/g, "");
      }
      target.setAttribute(prop, value);
    });
    target.removeAttribute("style");
    target.removeAttribute("class");
  });
  hidden.forEach((node) => node.remove());
  clone.querySelectorAll("style").forEach((node) => node.remove());
  return clone;
}

/** Image SVG : taille en centimètres, contenu ODF, et ajout du fichier au ZIP */
function imageParts(svg, ctx, maxWidthCm) {
  // le SVG reçu est une copie détachée : styles et dimensions se lisent sur
  // l'original resté dans la page (voir linkLiveSVG)
  const live = svg.mmLiveSource || svg;
  const [w, h] = svgSize(live);
  const clone = cleanSVG(inlineSVGStyles(live, svg.cloneNode(true)));
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  if (!clone.getAttribute("viewBox")) {
    clone.setAttribute("viewBox", `0 0 ${w} ${h}`);
  }
  clone.setAttribute("width", w);
  clone.setAttribute("height", h);
  let markup;
  try {
    markup = new XMLSerializer().serializeToString(clone);
  } catch (e) {
    return null;
  }
  const file = ctx.addSVG('<?xml version="1.0" encoding="UTF-8"?>\n' + markup);
  let width = w * PX_TO_CM;
  let height = h * PX_TO_CM;
  if (maxWidthCm && width > maxWidthCm) {
    height = (height * maxWidthCm) / width;
    width = maxWidthCm;
  }
  return {
    width: Math.round(100 * width) / 100,
    height: Math.round(100 * height) / 100,
    object:
      `<draw:image xlink:href="${escAttr(file)}" xlink:type="simple"` +
      ` xlink:show="embed" xlink:actuate="onLoad"/>`,
  };
}

/** Cadre ODF ancré dans le texte contenant une image SVG */
function imageFrame(svg, ctx, maxWidthCm) {
  const parts = imageParts(svg, ctx, maxWidthCm);
  if (!parts) return "";
  return (
    `<draw:frame draw:style-name="MMImage" text:anchor-type="as-char"` +
    ` svg:width="${parts.width}cm" svg:height="${parts.height}cm">` +
    parts.object +
    `</draw:frame>`
  );
}

/* ------------------------------------------------------------------ */
/* HTML -> ODF                                                         */
/* ------------------------------------------------------------------ */

/** Le nœud est-il une formule MathML ? */
function isMath(node) {
  return (
    node.nodeType === 1 &&
    ((node.localName || node.nodeName).toLowerCase() === "math" ||
      node.namespaceURI === "http://www.w3.org/1998/Math/MathML")
  );
}
/** Le nœud est-il un dessin SVG ? */
function isSVG(node) {
  return (
    node.nodeType === 1 &&
    (node.localName || node.nodeName).toLowerCase() === "svg"
  );
}

/**
 * Accumulateur de blocs ODF : les contenus en ligne s'agrègent dans un
 * paragraphe courant, les tableaux et les blocs le referment.
 */
class BlockWriter {
  constructor(ctx, options = {}) {
    this.ctx = ctx;
    this.blocks = []; // {type:"p", inner, style} | {type:"table", xml}
    this.current = "";
    this.maxWidthCm = options.maxWidthCm || 16;
    this.paragraphStyle = options.paragraphStyle || null;
    // Impress n'accepte pas d'objet ancré dans le texte : formules, images et
    // tableaux deviennent alors des blocs autonomes posés sur la diapositive.
    this.standalone = !!options.standaloneObjects;
    // ... et une cellule de tableau, qui n'accueille que du texte, y reçoit
    // les formules écrites en clair plutôt qu'un objet qu'Impress jetterait.
    this.mathAsText = !!options.mathAsText;
  }
  write(xml) {
    this.current += xml;
  }
  /** Ferme le paragraphe en cours s'il contient quelque chose */
  flush() {
    if (this.current.trim() === "") {
      this.current = "";
      return;
    }
    this.blocks.push({
      type: "p",
      inner: this.current,
      style: this.paragraphStyle,
    });
    this.current = "";
  }
  /** Ajoute un tableau, qui ne peut pas vivre dans un paragraphe */
  block(xml, meta) {
    this.flush();
    this.blocks.push(Object.assign({ type: "table", xml }, meta));
  }
  /** Ajoute une formule ou une image posée seule sur une diapositive */
  object(parts, kind) {
    this.flush();
    this.blocks.push({
      type: "object",
      kind,
      xml: parts.object,
      width: parts.width,
      height: parts.height,
    });
  }
  /** Liste des blocs ; au moins un paragraphe pour ne jamais rien produire de vide */
  list() {
    this.flush();
    if (!this.blocks.length) {
      this.blocks.push({ type: "p", inner: "", style: this.paragraphStyle });
    }
    return this.blocks;
  }
  /** Blocs non vides, pour la mise en page des diapositives */
  slideBlocks() {
    return this.list().filter((b) => b.type !== "p" || b.inner.trim() !== "");
  }
  result() {
    return blocksToXML(this.list());
  }
}

/** Rend un bloc en XML ODF */
function blockToXML(block) {
  if (block.type === "table") return block.xml;
  const style = block.style ? ` text:style-name="${escAttr(block.style)}"` : "";
  if (!block.inner) return `<text:p${style}/>`;
  return `<text:p${style}>${block.inner}</text:p>`;
}
/** Rend une suite de blocs */
function blocksToXML(blocks) {
  return blocks.map(blockToXML).join("");
}
/**
 * Détache un item non numéroté du précédent : seul son premier paragraphe
 * porte l'espacement, pour ne pas aérer l'intérieur de l'item.
 */
function spaceBlocks(blocks) {
  if (blocks.length && blocks[0].type === "p") {
    return [
      Object.assign({}, blocks[0], { style: "MMSansNumero" }),
      ...blocks.slice(1),
    ];
  }
  return blocks;
}

/**
 * Préfixe la numérotation manuelle d'un item (utilisé quand un tableau
 * empêche de recourir à une vraie liste ODF).
 */
function numberBlocks(blocks, number) {
  const numbered = blocks.map((b) =>
    b.type === "p" ? Object.assign({}, b, { style: "MMItemSuite" }) : b,
  );
  const prefix = `${number}.<text:tab/>`;
  if (numbered.length && numbered[0].type === "p") {
    numbered[0] = Object.assign({}, numbered[0], {
      style: "MMItem",
      inner: prefix + numbered[0].inner,
    });
  } else {
    numbered.unshift({ type: "p", inner: prefix, style: "MMItem" });
  }
  return numbered;
}

/**
 * Parcourt un nœud HTML et écrit son équivalent ODF dans le writer.
 * @param {Node} node
 * @param {BlockWriter} writer
 * @param {Object} props propriétés de texte héritées
 */
function walk(node, writer, props) {
  if (node.nodeType === 3) {
    const text = node.nodeValue;
    if (text === "") return;
    writer.write(styled(esc(text), props, writer.ctx));
    return;
  }
  if (node.nodeType !== 1) return;
  const tag = (node.nodeName || "").toUpperCase();
  if (SKIPPED_TAGS.has(tag)) return;
  if (isHidden(node)) return;
  if (isMath(node)) {
    if (writer.mathAsText) {
      const texte = texteMathML(node).trim();
      if (texte) writer.write(styled(esc(texte), props, writer.ctx));
      return;
    }
    if (writer.standalone) {
      writer.object(
        formulaParts(node, writer.ctx, 1, props && props.color),
        "formula",
      );
    } else {
      writer.write(formulaFrame(node, writer.ctx, props && props.color));
    }
    return;
  }
  if (isSVG(node)) {
    if (writer.standalone) {
      const parts = imageParts(node, writer.ctx, writer.maxWidthCm);
      if (parts) writer.object(parts, "image");
    } else {
      writer.write(imageFrame(node, writer.ctx, writer.maxWidthCm));
    }
    return;
  }
  if (tag === "BR") {
    writer.write("<text:line-break/>");
    return;
  }
  if (tag === "IMG") {
    // les images bitmap ne sont pas transférées, on garde le texte alternatif
    const alt = node.getAttribute("alt");
    if (alt) writer.write(styled(esc(alt), props, writer.ctx));
    return;
  }
  if (tag === "TABLE") {
    const rows = node.querySelectorAll("tr").length;
    // un tableau imbriqué reste dans du texte : la règle des cellules tient
    writer.block(
      tableXML(node, writer.ctx, writer.standalone || writer.mathAsText),
      { rows },
    );
    return;
  }
  const own = mergeProps(props, inlineProps(node));
  if (BLOCK_TAGS.has(tag)) {
    writer.flush();
    for (const child of Array.from(node.childNodes)) walk(child, writer, own);
    writer.flush();
    return;
  }
  for (const child of Array.from(node.childNodes)) walk(child, writer, own);
}

/** Entoure du contenu en ligne d'un text:span stylé si nécessaire */
function styled(xml, props, ctx) {
  if (!props || !Object.keys(props).length) return xml;
  const name = ctx.textStyle(props);
  return `<text:span text:style-name="${name}">${xml}</text:span>`;
}

/**
 * Convertit un <table> HTML en table ODF.
 * @param {Boolean} mathAsText écrire les formules des cellules en clair
 */
function tableXML(table, ctx, mathAsText) {
  const rows = Array.from(table.querySelectorAll("tr"));
  let columns = 0;
  for (const row of rows) {
    columns = Math.max(columns, row.querySelectorAll("td,th").length);
  }
  if (!columns) return "<text:p/>";
  ctx.counter += 1;
  let xml = `<table:table table:name="Tableau${ctx.counter}" table:style-name="${ctx.tableStyle(columns)}">`;
  xml += `<table:table-column table:style-name="MMTableColumn" table:number-columns-repeated="${columns}"/>`;
  for (const row of rows) {
    xml += "<table:table-row>";
    const cells = Array.from(row.querySelectorAll("td,th"));
    for (const cell of cells) {
      const writer = new BlockWriter(ctx, { maxWidthCm: 6, mathAsText });
      const props = cell.nodeName === "TH" ? { bold: true } : null;
      for (const child of Array.from(cell.childNodes)) {
        walk(child, writer, mergeProps(null, props));
      }
      const span =
        Number(cell.getAttribute("colspan")) > 1
          ? ` table:number-columns-spanned="${Number(cell.getAttribute("colspan"))}"`
          : "";
      xml += `<table:table-cell table:style-name="MMTableCell" office:value-type="string"${span}>${writer.result()}</table:table-cell>`;
      for (let k = 1; k < (Number(cell.getAttribute("colspan")) || 1); k++) {
        xml += "<table:covered-table-cell/>";
      }
    }
    for (let k = cells.length; k < columns; k++) {
      xml += `<table:table-cell table:style-name="MMTableCell" office:value-type="string"><text:p/></table:table-cell>`;
    }
    xml += "</table:table-row>";
  }
  xml += "</table:table>";
  return xml;
}

/** Convertit un élément HTML complet en liste de blocs ODF */
function nodeToBlockList(node, ctx, options = {}) {
  const writer = new BlockWriter(ctx, options);
  if (node) {
    for (const child of Array.from(node.childNodes)) walk(child, writer, null);
  }
  return writer.list();
}
/* ------------------------------------------------------------------ */
/* Lecture du DOM MathsMentales                                        */
/* ------------------------------------------------------------------ */

/**
 * Signes diacritiques dont LibreOffice n'a pas de glyphe autonome, et leur
 * équivalent affichable. Les caractères combinants (U+03xx, U+20Dx) sortent
 * sinon entourés d'un rond pointillé, et le ^ ASCII en carré blanc.
 */
const ACCENTS_ODF = {
  "^": "ˆ", // ^ -> ˆ circonflexe
  "̂": "ˆ",
  "~": "˜", // ~ -> ˜ tilde
  "̃": "˜",
  "¯": "‾", // macron -> ‾ barre haute
  "̄": "‾",
  "⃗": "→", // flèche de vecteur -> →
  "⃖": "←",
  "̀": "ˋ",
  "́": "ˊ",
  "̆": "˘",
  "̇": "˙",
  "̈": "¨",
  "̌": "ˇ",
};

/**
 * Rend les accents lisibles par LibreOffice : son import MathML jette purement
 * et simplement les <mover accent="true"> (le chapeau de \widehat, la flèche de
 * \vec, la barre de \overline disparaissent). Sans l'attribut, il les lit comme
 * un script centré — d'où aussi la substitution des caractères combinants.
 * @param {Element} math racine MathML modifiée sur place
 */
function adapteAccents(math) {
  Array.from(math.querySelectorAll("mover, munder")).forEach((el) => {
    el.removeAttribute("accent");
    el.removeAttribute("accentunder");
    // base puis signe : le signe est toujours le dernier enfant
    const signe = el.lastElementChild;
    if (!signe) return;
    const remplacement = ACCENTS_ODF[signe.textContent];
    if (remplacement) signe.textContent = remplacement;
  });
}

/**
 * Récupère le MathML que KaTeX a déjà produit dans une formule rendue.
 * L'annotation LaTeX et l'enveloppe <semantics> sont retirées : addFormula
 * fournit la sienne, et LibreOffice n'a pas l'usage de l'annotation.
 * @param {Element} el span[data-latex] cloné
 * @returns {Element|null} copie du <math>, prête à être sérialisée
 */
function extractMathML(el) {
  const source = el.querySelector("math");
  if (!source) return null;
  const math = source.cloneNode(true);
  Array.from(math.querySelectorAll("annotation, annotation-xml")).forEach((n) =>
    n.remove(),
  );
  Array.from(math.children).forEach((child) => {
    if ((child.localName || "").toLowerCase() !== "semantics") return;
    while (child.firstChild) math.insertBefore(child.firstChild, child);
    child.remove();
  });
  adapteAccents(math);
  return math;
}

/**
 * Remplace les formules rendues par KaTeX par les éléments <math> qu'elles
 * contiennent. Les dimensions sont mesurées sur le DOM vivant (source), pas
 * sur le clone.
 * @param {Element} clone copie détachée du <li>
 * @param {Element} source <li> encore dans la page
 */
function replaceLatex(clone, source) {
  const cloned = clone.querySelectorAll("span[data-latex]");
  const live = source ? source.querySelectorAll("span[data-latex]") : [];
  cloned.forEach((el, index) => {
    const parent = el.parentNode;
    if (!parent) return;
    let width = 40;
    let height = 20;
    const reference = live[index] || el;
    try {
      const box = reference.getBoundingClientRect();
      if (box.width > 0) width = box.width;
      if (box.height > 0) height = box.height;
    } catch (e) {
      /* pas de mise en page disponible */
    }
    const math = extractMathML(el);
    if (!math) {
      // repli : on garde le texte brut plutôt que de tout faire échouer
      parent.replaceChild(
        clone.ownerDocument.createTextNode(el.dataset.latex),
        el,
      );
      return;
    }
    math.setAttribute("width", width);
    math.setAttribute("height", height);
    parent.replaceChild(math, el);
  });
}

/* ------------------------------------------------------------------ */
/* Fusion texte + formules (Impress)                                   */
/* ------------------------------------------------------------------ */

const MATHML_NS = "http://www.w3.org/1998/Math/MathML";

/** Structure d'un tableau : chaque cellule fusionne pour son propre compte */
const TABLE_TAGS = new Set([
  "TABLE",
  "THEAD",
  "TBODY",
  "TFOOT",
  "TR",
  "TD",
  "TH",
  "CAPTION",
  "COLGROUP",
  "COL",
]);

/** Le nœud interrompt-il la suite de contenu en ligne d'une même ligne ? */
function rompLaLigne(node) {
  if (node.nodeType !== 1) return false;
  const tag = (node.nodeName || "").toUpperCase();
  return (
    tag === "BR" || BLOCK_TAGS.has(tag) || TABLE_TAGS.has(tag) || isSVG(node)
  );
}

/** Le nœud est-il, ou contient-il, une formule ? */
function contientMath(node) {
  if (node.nodeType !== 1) return false;
  return isMath(node) || !!(node.querySelector && node.querySelector("math"));
}

/** <mtext> portant un morceau de texte */
function mtextNode(doc, texte) {
  const el = doc.createElementNS(MATHML_NS, "mtext");
  el.appendChild(doc.createTextNode(texte));
  return el;
}

/** Enveloppe des nœuds MathML dans un <mstyle> portant couleur et graisse */
function habille(doc, enfants, props) {
  const variante =
    (props.bold ? "bold" : "") +
    (props.bold && props.italic ? "-" : "") +
    (props.italic ? "italic" : "");
  if (!props.color && !variante) {
    return enfants;
  }
  const style = doc.createElementNS(MATHML_NS, "mstyle");
  if (props.color) style.setAttribute("mathcolor", props.color);
  if (variante) style.setAttribute("mathvariant", variante);
  enfants.forEach((child) => style.appendChild(child));
  return [style];
}

/**
 * Traduit une suite de nœuds HTML en nœuds MathML : le texte devient
 * <mtext>, les formules déjà rendues sont reprises telles quelles.
 * @returns {Array<Node>} nœuds détachés, prêts à être adoptés par un <math>
 */
function versMathML(nodes, doc) {
  const parts = [];
  for (const node of nodes) {
    if (node.nodeType === 3) {
      if (node.nodeValue) parts.push(mtextNode(doc, node.nodeValue));
      continue;
    }
    if (node.nodeType !== 1) continue;
    const tag = (node.nodeName || "").toUpperCase();
    if (SKIPPED_TAGS.has(tag) || isHidden(node)) continue;
    if (isMath(node)) {
      parts.push(...Array.from(node.childNodes));
      continue;
    }
    if (tag === "IMG") {
      const alt = node.getAttribute("alt");
      if (alt) parts.push(mtextNode(doc, alt));
      continue;
    }
    const enfants = versMathML(Array.from(node.childNodes), doc);
    if (!enfants.length) continue;
    const props = inlineProps(node);
    parts.push(...(props ? habille(doc, enfants, props) : enfants));
  }
  return parts;
}

/**
 * Encombrement d'un seul nœud affiché : les rectangles d'un nœud sont ses
 * fragments de ligne, jamais superposés. Leurs largeurs s'additionnent — un
 * texte replié tiendra sur une seule ligne dans la formule — et la hauteur
 * est celle d'un fragment.
 * @returns {Object|null} {width, height}, null si le nœud n'occupe rien
 */
function mesureNoeud(node) {
  let rects = [];
  if (node.nodeType === 1) {
    rects = Array.from(node.getClientRects());
  } else if (node.nodeType === 3) {
    const range = node.ownerDocument.createRange();
    range.selectNodeContents(node);
    rects = Array.from(range.getClientRects());
  }
  rects = rects.filter((r) => r.width > 0 && r.height > 0);
  if (!rects.length) return null;
  return {
    width: rects.reduce((sum, r) => sum + r.width, 0),
    height: Math.max(...rects.map((r) => r.height)),
  };
}

/**
 * Dimensions en pixels d'une suite de nœuds, mesurées sur le DOM vivant :
 * les largeurs s'ajoutent, la hauteur est celle du plus haut. Mesurer nœud
 * par nœud est indispensable — une sélection couvrant toute la suite
 * découperait une fraction en deux « lignes ».
 * À défaut de mise en page, les formules portent déjà leur taille et le texte
 * est estimé.
 */
function mesureSuite(utiles) {
  const vivants = utiles.map((u) => u.live).filter(Boolean);
  if (vivants.length) {
    try {
      const boites = vivants.map(mesureNoeud).filter(Boolean);
      if (boites.length) {
        return {
          width: boites.reduce((sum, b) => sum + b.width, 0),
          height: Math.max(...boites.map((b) => b.height)),
        };
      }
    } catch (e) {
      /* pas de mise en page disponible */
    }
  }
  let width = 0;
  let height = 20;
  for (const { node } of utiles) {
    if (isMath(node)) {
      width += Number(node.getAttribute("width")) || 40;
      height = Math.max(height, Number(node.getAttribute("height")) || 20);
    } else {
      // largeur moyenne d'un caractère à la taille de rendu habituelle
      width += 8 * (node.textContent || "").length;
    }
  }
  return { width: Math.max(40, width), height };
}

/*
 * Un objet Math n'est pas dessiné à sa taille naturelle : LibreOffice l'étire
 * jusqu'aux bords de son cadre. Or sa boîte réserve autour de la formule une
 * bande verticale à peu près constante, proportionnelle à la taille de la
 * police et non au contenu — la boîte KaTeX, elle, colle à la ligne. La
 * hauteur du cadre se déduit donc de la police, jamais de l'interligne (que
 * les feuilles de style de MathsMentales étirent) ni de la mesure d'écran.
 */
const BOITE_EM = 1.55;
// fraction, exposant ou racine : la formule déborde de la bande ordinaire
const BOITE_HAUTE = 0.35;
/** Constructions plus hautes qu'une ligne ordinaire */
const MATH_HAUTS =
  "mfrac, msqrt, mroot, msup, msub, msubsup, mover, munder, munderover, mtable";

/** Taille de police de l'élément, en pixels */
function taillePolice(el) {
  const vue = el.ownerDocument && el.ownerDocument.defaultView;
  if (!vue) return 0;
  const police = parseFloat(vue.getComputedStyle(el).fontSize);
  return isFinite(police) && police > 0 ? police : 0;
}

/**
 * Donne aux formules la hauteur de boîte que LibreOffice leur réserve, pour
 * que l'étirement du cadre respecte leurs proportions. La largeur, elle,
 * reste celle mesurée à l'écran.
 * @param {Element} clone copie de l'item, modifiée sur place
 * @param {Number} police taille de police de l'item, en pixels
 */
function ajusteHauteurFormules(clone, police) {
  if (!police) return;
  clone.querySelectorAll("math").forEach((math) => {
    const haute = math.querySelector(MATH_HAUTS) ? BOITE_HAUTE : 0;
    math.setAttribute("height", (BOITE_EM + haute) * police);
  });
}

/**
 * Remplace une suite de nœuds en ligne par la formule unique qui la traduit.
 * @param {Array} suite [{node, live}] nœuds consécutifs d'une même ligne
 * @param {Element} parent élément qui les contient
 */
function fusionneSuite(suite, parent) {
  const utiles = suite.filter(({ node }) => {
    if (node.nodeType === 3) return node.nodeValue !== "";
    if (node.nodeType !== 1) return false;
    const tag = (node.nodeName || "").toUpperCase();
    return !SKIPPED_TAGS.has(tag) && !isHidden(node);
  });
  if (!utiles.some(({ node }) => contientMath(node))) return;
  // une formule seule est déjà l'objet attendu : rien à fusionner
  if (utiles.length === 1 && isMath(utiles[0].node)) return;
  const doc = parent.ownerDocument;
  const { width, height } = mesureSuite(utiles);
  const parts = versMathML(
    utiles.map((u) => u.node),
    doc,
  );
  if (!parts.length) return;
  const math = doc.createElementNS(MATHML_NS, "math");
  parts.forEach((part) => math.appendChild(part));
  math.setAttribute("width", width);
  math.setAttribute("height", height);
  parent.insertBefore(math, suite[0].node);
  suite.forEach(({ node }) => node.remove());
}

/**
 * Regroupe en une seule formule chaque suite de texte et de formules d'une
 * même ligne. Impress n'ancre pas d'objet dans le texte : sans cela, une
 * phrase et ses formules seraient éparpillées en blocs distincts.
 * Les dimensions sont mesurées sur le DOM vivant, jumeau du clone.
 * @param {Element} clone copie détachée, modifiée sur place
 * @param {Element} live élément correspondant, encore dans la page
 */
function fusionneFormules(clone, live) {
  const enfants = Array.from(clone.childNodes);
  const jumeaux = live ? Array.from(live.childNodes) : [];
  // sans structures superposables, on renonce à mesurer plutôt qu'à fusionner
  const mesurable = jumeaux.length === enfants.length;
  let suite = [];
  const termine = () => {
    if (suite.length) fusionneSuite(suite, clone);
    suite = [];
  };
  enfants.forEach((node, index) => {
    const jumeau = mesurable ? jumeaux[index] : null;
    if (rompLaLigne(node)) {
      termine();
      if (!isSVG(node)) fusionneFormules(node, jumeau);
      return;
    }
    suite.push({ node, live: jumeau });
  });
  termine();
}

/**
 * Relie chaque SVG de la copie au SVG affiché correspondant.
 * La copie est détachée du document : ni les styles calculés ni les dimensions
 * à l'écran n'y sont lisibles, il faut donc garder l'original sous la main.
 */
function linkLiveSVG(clone, source) {
  const live = source.querySelectorAll("svg");
  const copies = clone.querySelectorAll("svg");
  if (live.length !== copies.length) return;
  copies.forEach((svg, i) => {
    svg.mmLiveSource = live[i];
  });
}

/** L'élément est-il mis en page, donc mesurable ? */
function estMesurable(el) {
  try {
    return el.getBoundingClientRect().width > 0;
  } catch (e) {
    return false;
  }
}

/**
 * Copies posées hors écran le temps d'un export. Les figures SVG ne sont
 * mesurées et dépouillées de leurs styles qu'à la construction du document :
 * les copies vivent donc jusque-là (voir retireHotesMesure).
 */
const hotesMesure = [];

/**
 * Copie mise en page hors écran d'un item que rien ne mesure.
 * L'export part de l'onglet « Document » : les onglets « énoncés » et
 * « corrigés » sont alors en display:none, où tout rectangle vaut zéro.
 * La copie reprend la police de l'original et n'est pas contrainte en
 * largeur : chaque ligne y garde sa longueur naturelle. Elle est seulement
 * déportée hors du cadre, jamais masquée — un style calculé « invisible »
 * viderait les figures à l'export.
 * @returns {Element|null} la copie mesurable, ou null si le document s'y refuse
 */
function mesureHorsEcran(li) {
  const doc = li.ownerDocument;
  const vue = doc && doc.defaultView;
  if (!vue || !doc.body) return null;
  const style = vue.getComputedStyle(li);
  const hote = doc.createElement("div");
  hote.setAttribute("aria-hidden", "true");
  hote.style.cssText =
    "position:absolute;left:-10000px;top:0;pointer-events:none;" +
    "width:max-content;max-width:none;margin:0;padding:0";
  hote.style.fontFamily = style.fontFamily;
  hote.style.fontSize = style.fontSize;
  hote.style.fontWeight = style.fontWeight;
  hote.style.fontStyle = style.fontStyle;
  hote.style.lineHeight = style.lineHeight;
  const copie = li.cloneNode(true);
  hote.appendChild(copie);
  doc.body.appendChild(hote);
  hotesMesure.push(hote);
  return copie;
}

/** Retire les copies de mesure une fois le document construit */
function retireHotesMesure() {
  while (hotesMesure.length) hotesMesure.pop().remove();
}

/**
 * Copie d'un <li> prête à être convertie.
 * @param {Boolean} fusion fusionner texte et formules d'une même ligne
 */
function prepareItem(li, fusion) {
  // les mesures se prennent sur une copie hors écran quand l'onglet est masqué
  const source = (!estMesurable(li) && mesureHorsEcran(li)) || li;
  const clone = li.cloneNode(true);
  linkLiveSVG(clone, source);
  replaceLatex(clone, source);
  if (fusion) {
    fusionneFormules(clone, source);
    ajusteHauteurFormules(clone, taillePolice(source));
  }
  // les boutons « Figure » n'ont pas de sens dans un document imprimé
  clone.querySelectorAll("button, input").forEach((n) => n.remove());
  // ... et l'espace insécable qui les précédait non plus
  const last = clone.lastChild;
  if (last && last.nodeType === 3 && /^[\s ]*$/.test(last.nodeValue)) {
    last.remove();
  }
  return clone;
}

/**
 * Lit les onglets « énoncés » et « corrigés » et renvoie une structure
 * indépendante du format de sortie.
 *
 * @param {Object} options {fusionMath} : fusionner texte et formules d'une
 *   même ligne en une formule unique, nécessaire pour Impress.
 * @returns {Array} [{title, items:[{enonce, corrige}]}]
 *   enonce et corrige sont des <li> clonés (ou null).
 */
function readSections(enonceDOM, corrigeDOM, options = {}) {
  const fusion = !!options.fusionMath;
  // un export abandonné en cours de route a pu laisser des copies de mesure
  retireHotesMesure();
  const read = (root) => {
    const groups = [];
    if (!root) return groups;
    // MathsMentales place un <div> par panier, contenant un <h3> et un <ol>.
    // On part des <div> pour ne pas confondre une liste imbriquée dans une
    // réponse avec la liste des questions.
    const panels = Array.from(root.children).filter((c) =>
      c.querySelector("ol"),
    );
    const lists = panels.length
      ? panels.map((panel) => [
          panel.querySelector("ol"),
          panel.querySelector("h3"),
        ])
      : Array.from(root.querySelectorAll("ol")).map((list) => [list, null]);
    for (const [list, heading] of lists) {
      let title = heading ? heading.textContent : "";
      if (!title) {
        let node = list.previousElementSibling;
        while (node && node.nodeName !== "H3")
          node = node.previousElementSibling;
        if (node) title = node.textContent;
      }
      groups.push({
        title,
        items: Array.from(list.children).filter((c) => c.nodeName === "LI"),
      });
    }
    return groups;
  };
  const enonces = read(enonceDOM);
  const corriges = read(corrigeDOM);
  const count = Math.max(enonces.length, corriges.length);
  const sections = [];
  for (let i = 0; i < count; i++) {
    const e = enonces[i];
    const c = corriges[i];
    const title = (e && e.title) || (c && c.title) || "";
    const length = Math.max(e ? e.items.length : 0, c ? c.items.length : 0);
    const items = [];
    for (let j = 0; j < length; j++) {
      items.push({
        enonce: e && e.items[j] ? prepareItem(e.items[j], fusion) : null,
        corrige: c && c.items[j] ? prepareItem(c.items[j], fusion) : null,
      });
    }
    sections.push({ title, items });
  }
  return sections;
}

/* ------------------------------------------------------------------ */
/* Fichiers communs aux deux formats                                   */
/* ------------------------------------------------------------------ */

const CONTENT_NS = `xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
    xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
    xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0"
    xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
    xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
    xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0"
    xmlns:presentation="urn:oasis:names:tc:opendocument:xmlns:presentation:1.0"
    xmlns:math="http://www.w3.org/1998/Math/MathML"
    office:version="1.3"`;

/** Styles de cadres et de tableaux, communs à tous les documents */
const FRAME_STYLES = `
    <style:style style:name="MMFormula" style:family="graphic">
      <style:graphic-properties style:vertical-pos="middle" style:vertical-rel="text"
        style:wrap="none" fo:padding="0cm" fo:border="none" draw:stroke="none" draw:fill="none"/>
    </style:style>
    <style:style style:name="MMImage" style:family="graphic">
      <style:graphic-properties style:vertical-pos="middle" style:vertical-rel="text"
        style:wrap="none" fo:padding="0cm" fo:border="none" draw:stroke="none" draw:fill="none"/>
    </style:style>
    <style:style style:name="MMTableColumn" style:family="table-column">
      <style:table-column-properties style:column-width="${TABLE_COLUMN_CM}cm"/>
    </style:style>
    <style:style style:name="MMTableCell" style:family="table-cell">
      <style:table-cell-properties fo:border="0.5pt solid #000000" fo:padding="0.1cm"
        fo:background-color="#FFFFFF" style:vertical-align="middle"/>
    </style:style>`;

function buildMetaXML(title) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-meta xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
                      xmlns:dc="http://purl.org/dc/elements/1.1/"
                      xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0" office:version="1.3">
  <office:meta>
    <meta:generator>MathsMentales</meta:generator>
    <dc:title>${esc(title)}</dc:title>
    <meta:creation-date>${new Date().toISOString()}</meta:creation-date>
  </office:meta>
</office:document-meta>`;
}

/**
 * settings.xml : la déclaration de macro n'est écrite que pour les documents
 * qui en embarquent une (Writer).
 * @param {String|null} macroName nom de la macro, ou null
 */
function buildSettings(macroName) {
  const script = macroName
    ? `
            <config:config-item-map-indexed config:name="ScriptConfiguration">
                <config:config-item-map-entry>
                    <config:config-item config:name="EventType" config:type="string">Script</config:config-item>
                    <config:config-item config:name="Script" config:type="string">vnd.sun.star.script:Standard.Module1.${macroName}?language=Basic&amp;location=document</config:config-item>
                </config:config-item-map-entry>
            </config:config-item-map-indexed>`
    : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-settings xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
    xmlns:config="urn:oasis:names:tc:opendocument:xmlns:config:1.0"
    xmlns:xlink="http://www.w3.org/1999/xlink" office:version="1.3">
    <office:settings>
        <config:config-item-set config:name="ooo:configuration-settings">${script}
        </config:config-item-set>
    </office:settings>
</office:document-settings>`;
}

function buildScriptLC() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE library:libraries PUBLIC "-//OpenOffice.org//DTD OfficeDocument 1.0//EN" "libraries.dtd">
<library:libraries xmlns:library="http://openoffice.org/2000/library" xmlns:xlink="http://www.w3.org/1999/xlink">
    <library:library library:name="Standard" library:link="false" library:readonly="false" library:passwordprotected="false"/>
</library:libraries>`;
}

function buildScriptLB() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE library:library PUBLIC "-//OpenOffice.org//DTD OfficeDocument 1.0//EN" "library.dtd">
<library:library xmlns:library="http://openoffice.org/2000/library" library:name="Standard" library:readonly="false" library:passwordprotected="false">
    <library:element library:name="Module1"/>
</library:library>`;
}

/**
 * Macro Basic de rafraîchissement des formules, réservée à Writer : sous
 * Impress elle ne donnait rien, et les formules y sont de toute façon étirées
 * à la taille de leur cadre.
 */
function buildMacro() {
  const code = `Sub RefreshAllMathFormulas
    Dim oDoc As Object
    Dim nCount As Integer
    On Error Resume Next
    oDoc = ThisComponent
    nCount = 0

    REM Writer : les formules sont des objets embarqués du document
    If Not IsNull(oDoc.getEmbeddedObjects()) Then
        Dim oObjects As Object
        oObjects = oDoc.getEmbeddedObjects()
        For i = 0 To oObjects.getCount() - 1
            RefreshOneObject(oObjects.getByIndex(i))
            nCount = nCount + 1
        Next i
    End If

    oDoc.CurrentController.getFrame().ContainerWindow.setVisible(False)
    oDoc.CurrentController.getFrame().ContainerWindow.setVisible(True)
    MsgBox "Rafraîchissement terminé : " &amp; nCount &amp; " objet(s) parcouru(s).", 64, "MathsMentales"
End Sub

Sub RefreshOneObject(oElement As Object)
    On Error Resume Next
    If IsNull(oElement) Then Exit Sub
    If IsNull(oElement.ExtendedControlOverEmbeddedObject) Then Exit Sub
    oElement.ExtendedControlOverEmbeddedObject.update()
End Sub`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE script:module PUBLIC "-//OpenOffice.org//DTD OfficeDocument 1.0//EN" "module.dtd">
<script:module xmlns:script="http://openoffice.org/2000/script" script:name="Module1" script:language="StarBasic">${code}</script:module>`;
}

/** Raccourci CTRL + MAJ + G vers la macro de rafraîchissement */
function buildAccelerator() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<accel:acceleratorlist xmlns:accel="http://openoffice.org/2001/accel" xmlns:xlink="http://www.w3.org/1999/xlink">
    <accel:item accel:code="KEY_G" accel:shift="true" accel:mod1="true" xlink:href="vnd.sun.star.script:Standard.Module1.RefreshAllMathFormulas?language=Basic&amp;location=document"/>
</accel:acceleratorlist>`;
}

/**
 * manifest.xml : uniquement les fichiers réellement présents dans le ZIP.
 * @param {Boolean} macro le document embarque-t-il la macro Basic ?
 */
function buildManifest(mediaType, images, formulas, macro) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.3">
  <manifest:file-entry manifest:full-path="/" manifest:version="1.3" manifest:media-type="${mediaType}"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="settings.xml" manifest:media-type="text/xml"/>`;
  if (macro) {
    xml += `
  <manifest:file-entry manifest:full-path="Configurations2/" manifest:media-type="application/vnd.sun.xml.ui.configuration"/>
  <manifest:file-entry manifest:full-path="Configurations2/accelerator/current.xml" manifest:media-type=""/>
  <manifest:file-entry manifest:full-path="Basic/" manifest:media-type="application/binary"/>
  <manifest:file-entry manifest:full-path="Basic/script-lc.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="Basic/Standard/" manifest:media-type="application/binary"/>
  <manifest:file-entry manifest:full-path="Basic/Standard/script-lb.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="Basic/Standard/Module1.xml" manifest:media-type="text/xml"/>`;
  }
  if (images.length) {
    xml += `\n  <manifest:file-entry manifest:full-path="Pictures/" manifest:media-type=""/>`;
  }
  for (const image of images) {
    xml += `\n  <manifest:file-entry manifest:full-path="${escAttr(image.file)}" manifest:media-type="image/svg+xml"/>`;
  }
  for (const formula of formulas) {
    xml +=
      `\n  <manifest:file-entry manifest:full-path="${escAttr(formula.dir)}/" manifest:version="1.3" manifest:media-type="application/vnd.oasis.opendocument.formula"/>` +
      `\n  <manifest:file-entry manifest:full-path="${escAttr(formula.dir)}/content.xml" manifest:media-type="text/xml"/>`;
  }
  xml += "\n</manifest:manifest>";
  return xml;
}

/**
 * Ajoute au ZIP les parties communes (mimetype, macros, images, manifeste).
 * @param {Boolean} macro embarquer la macro de rafraîchissement (Writer seul)
 */
function packCommonParts(zip, mediaType, ctx, title, macro) {
  zip.file("mimetype", mediaType, { compression: "STORE" });
  zip.file("meta.xml", buildMetaXML(title));
  zip.file(
    "settings.xml",
    buildSettings(macro ? "RefreshAllMathFormulas" : null),
  );
  if (macro) {
    zip.file("Basic/script-lc.xml", buildScriptLC());
    zip.file("Basic/Standard/script-lb.xml", buildScriptLB());
    zip.file("Basic/Standard/Module1.xml", buildMacro());
    zip.file("Configurations2/accelerator/current.xml", buildAccelerator());
  }
  zip.file(
    "META-INF/manifest.xml",
    buildManifest(mediaType, ctx.images, ctx.formulas, macro),
  );
  for (const image of ctx.images) {
    zip.file(image.file, image.content);
  }
  for (const formula of ctx.formulas) {
    zip.file(formula.dir + "/content.xml", formula.content);
  }
  return zip;
}

/**
 * Construit le ZIP d'un document, sans le télécharger.
 * @param {String} kind "writer" ou "impress"
 * @returns {Object} {zip, mediaType, extension}
 */
function buildDocument(
  kind,
  title,
  sections,
  options = { questions: true, answers: true },
) {
  const ctx = new Context();
  const zip = new JSZip();
  const impress = kind === "impress";
  // le contenu est construit en premier : il alimente styles et images
  let content;
  try {
    content = impress
      ? buildPresentationContentXML(sections, ctx, options)
      : buildTextContentXML(sections, ctx, options);
  } finally {
    // les figures viennent d'être mesurées : les copies hors écran ont fait
    // leur office
    retireHotesMesure();
  }
  zip.file("content.xml", content);
  zip.file(
    "styles.xml",
    impress ? buildPresentationStylesXML() : buildTextStylesXML(),
  );
  const mediaType = impress ? ODP_MEDIA : ODT_MEDIA;
  // la macro de rafraîchissement reste sans effet sous Impress : inutile de
  // l'y embarquer, et d'y faire ouvrir un document porteur de macros
  packCommonParts(zip, mediaType, ctx, title || "document", !impress);
  return { zip, mediaType, extension: impress ? ".odp" : ".odt" };
}

/** Construit puis télécharge le document */
async function buildAndDownload(kind, title, sections, options) {
  const { zip, mediaType, extension } = buildDocument(
    kind,
    title,
    sections,
    options,
  );
  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: mediaType,
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  download(blob, (title || "document") + extension);
  return blob;
}

/** Propose le fichier au téléchargement */
function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    link.remove();
  }, 0);
}

/* ------------------------------------------------------------------ */
/* Writer (.odt)                                                       */
/* ------------------------------------------------------------------ */

const ODT_MEDIA = "application/vnd.oasis.opendocument.text";

function buildTextStylesXML() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
                        xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
                        xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
                        xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" office:version="1.3">
  <office:styles>
    <style:style style:name="Standard" style:family="paragraph" style:class="text"/>
    <style:style style:name="MMTitre" style:family="paragraph" style:parent-style-name="Standard">
      <style:text-properties fo:font-size="14pt" fo:font-weight="bold"/>
      <style:paragraph-properties fo:margin-top="0.4cm" fo:margin-bottom="0.2cm"/>
    </style:style>
    <style:style style:name="MMAvertissement" style:family="paragraph" style:parent-style-name="Standard">
      <style:text-properties fo:font-size="10pt" fo:font-style="italic" fo:color="#CC0000"/>
    </style:style>
    <style:style style:name="MMItem" style:family="paragraph" style:parent-style-name="Standard">
      <style:paragraph-properties fo:margin-left="1.27cm" fo:text-indent="-0.635cm" fo:margin-top="0.15cm">
        <style:tab-stops><style:tab-stop style:position="1.27cm"/></style:tab-stops>
      </style:paragraph-properties>
    </style:style>
    <style:style style:name="MMItemSuite" style:family="paragraph" style:parent-style-name="Standard">
      <style:paragraph-properties fo:margin-left="1.27cm"/>
    </style:style>
    <style:style style:name="MMSansNumero" style:family="paragraph" style:parent-style-name="Standard">
      <style:paragraph-properties fo:margin-top="0.15cm"/>
    </style:style>
    <style:style style:name="MMTitreSaut" style:family="paragraph" style:parent-style-name="MMTitre">
      <style:paragraph-properties fo:break-before="page"/>
    </style:style>
    <style:style style:name="MMSautDePage" style:family="paragraph" style:parent-style-name="Standard">
      <style:paragraph-properties fo:break-before="page"/>
    </style:style>
  </office:styles>
  <office:automatic-styles>
    <style:page-layout style:name="MMPageLayout">
      <style:page-layout-properties fo:page-width="${PAGE_WIDTH_CM}cm" fo:page-height="29.7cm"
        style:print-orientation="portrait" fo:margin-top="${PAGE_MARGIN_CM}cm"
        fo:margin-bottom="${PAGE_MARGIN_CM}cm" fo:margin-left="${PAGE_MARGIN_CM}cm"
        fo:margin-right="${PAGE_MARGIN_CM}cm"/>
    </style:page-layout>
  </office:automatic-styles>
  <office:master-styles>
    <style:master-page style:name="Standard" style:page-layout-name="MMPageLayout"/>
  </office:master-styles>
</office:document-styles>`;
}

/* Tableau « n° | question | réponse » : largeurs en cm, sur la largeur utile */
const QR_NUM_CM = 1.2;
const QR_BODY_CM = round2(PAGE_WIDTH_CM - 2 * PAGE_MARGIN_CM - QR_NUM_CM);

/** Styles du tableau questions/réponses */
const TABLE_QR_STYLES = `
    <style:style style:name="MMTableQR" style:family="table">
      <style:table-properties style:width="${round2(QR_NUM_CM + QR_BODY_CM)}cm" table:align="margins"/>
    </style:style>
    <style:style style:name="MMRowQR" style:family="table-row">
      <style:table-row-properties fo:keep-together="always"/>
    </style:style>
    <style:style style:name="MMColNumero" style:family="table-column">
      <style:table-column-properties style:column-width="${QR_NUM_CM}cm"/>
    </style:style>
    <style:style style:name="MMColQR1" style:family="table-column">
      <style:table-column-properties style:column-width="${QR_BODY_CM}cm"/>
    </style:style>
    <style:style style:name="MMColQR2" style:family="table-column">
      <style:table-column-properties style:column-width="${round2(QR_BODY_CM / 2)}cm"/>
    </style:style>
    <style:style style:name="MMColQRSansNum1" style:family="table-column">
      <style:table-column-properties style:column-width="${round2(QR_BODY_CM + QR_NUM_CM)}cm"/>
    </style:style>
    <style:style style:name="MMColQRSansNum2" style:family="table-column">
      <style:table-column-properties style:column-width="${round2((QR_BODY_CM + QR_NUM_CM) / 2)}cm"/>
    </style:style>
    <style:style style:name="MMEntete" style:family="paragraph" style:parent-style-name="Standard">
      <style:paragraph-properties fo:text-align="center"/>
      <style:text-properties fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="MMCellNumero" style:family="paragraph" style:parent-style-name="Standard">
      <style:paragraph-properties fo:text-align="center"/>
    </style:style>`;

/** En-têtes du tableau questions/réponses */
const QR_ENTETES = { enonce: "Question", corrige: "Réponse" };

/**
 * Rend une section sous forme de tableau : une ligne par question, les
 * colonnes demandées par « Intégrer », précédées d'une colonne de numéros
 * quand la numérotation est demandée.
 * @param {Object} section {title, items}
 * @param {Context} ctx
 * @param {Object} options {questions:Boolean, answers:Boolean, numbered:Boolean}
 */
function tableauQR(section, ctx, options) {
  const colonnes = [];
  if (options.questions) colonnes.push("enonce");
  if (options.answers) colonnes.push("corrige");
  if (!colonnes.length) return "";
  const numerote = options.numbered !== false;
  const largeurUtile = numerote ? QR_BODY_CM : QR_BODY_CM + QR_NUM_CM;
  const styleColonne =
    (numerote ? "MMColQR" : "MMColQRSansNum") + colonnes.length;
  const largeurColonne = largeurUtile / colonnes.length;
  const cellule = (contenu) =>
    `<table:table-cell table:style-name="MMTableCell" office:value-type="string">${contenu}</table:table-cell>`;
  ctx.counter += 1;
  let xml = `<table:table table:name="TableauQR${ctx.counter}" table:style-name="MMTableQR">`;
  if (numerote) xml += `<table:table-column table:style-name="MMColNumero"/>`;
  xml += `<table:table-column table:style-name="${styleColonne}" table:number-columns-repeated="${colonnes.length}"/>`;
  // l'en-tête est répété quand le tableau se poursuit sur la page suivante
  xml +=
    '<table:table-header-rows><table:table-row table:style-name="MMRowQR">';
  if (numerote)
    xml += cellule('<text:p text:style-name="MMEntete">n°</text:p>');
  for (const colonne of colonnes) {
    xml += cellule(
      `<text:p text:style-name="MMEntete">${esc(QR_ENTETES[colonne])}</text:p>`,
    );
  }
  xml += "</table:table-row></table:table-header-rows>";
  section.items.forEach((item, index) => {
    // une question ne doit pas être coupée entre deux pages
    xml += '<table:table-row table:style-name="MMRowQR">';
    if (numerote) {
      xml += cellule(
        `<text:p text:style-name="MMCellNumero">${index + 1}</text:p>`,
      );
    }
    for (const colonne of colonnes) {
      xml += cellule(
        blocksToXML(
          nodeToBlockList(item[colonne], ctx, { maxWidthCm: largeurColonne }),
        ),
      );
    }
    xml += "</table:table-row>";
  });
  return xml + "</table:table>";
}

/** content.xml d'un document Writer */
function buildTextContentXML(sections, ctx, options) {
  let body = `<text:p text:style-name="MMAvertissement">${esc(
    "⚠ Rafraîchir les formules mathématiques : CTRL + MAJ + G, ou Outils > Macros > Exécuter la macro > Standard > Module1 > RefreshAllMathFormulas",
  )}</text:p><text:p/>`;

  const numerote = options.numbered !== false;

  /**
   * ODF n'autorise pas de tableau dans un élément de liste : dès qu'un item
   * en contient un, toute la série passe en numérotation manuelle.
   * Sans numérotation, les items sont de simples suites de paragraphes,
   * séparées par l'espacement du style MMSansNumero.
   */
  const writeList = (items, pick) => {
    const rendered = items.map((item) => nodeToBlockList(pick(item), ctx));
    if (!numerote) {
      return rendered
        .map((blocks) => blocksToXML(spaceBlocks(blocks)))
        .join("");
    }
    const hasTable = rendered.some((blocks) =>
      blocks.some((b) => b.type === "table"),
    );
    if (hasTable) {
      let xml = "";
      rendered.forEach((blocks, index) => {
        xml += blocksToXML(numberBlocks(blocks, index + 1));
      });
      return xml;
    }
    let xml =
      '<text:list text:style-name="MMNumerotation" text:continue-numbering="false">';
    for (const blocks of rendered) {
      xml += `<text:list-item>${blocksToXML(blocks)}</text:list-item>`;
    }
    return xml + "</text:list>";
  };

  /** Titre d'une série, éventuellement précédé d'un saut de page */
  const titreSerie = (texte, saut) => {
    if (texte && texte.trim()) {
      return `<text:p text:style-name="${saut ? "MMTitreSaut" : "MMTitre"}">${esc(texte)}</text:p>`;
    }
    return saut ? '<text:p text:style-name="MMSautDePage"/>' : "";
  };
  /** Titre de la série de corrigés d'un panier */
  const titreCorrection = (section) =>
    options.questions ? "Correction " + section.title : section.title;

  const layout = options.layout || "suite";
  if (layout === "tableau") {
    for (const section of sections) {
      body += titreSerie(section.title, false);
      body += tableauQR(section, ctx, options);
    }
  } else if (layout === "page" && options.questions && options.answers) {
    // toutes les questions d'abord, les corrigés sur une nouvelle page
    for (const section of sections) {
      body += titreSerie(section.title, false);
      body += writeList(section.items, (item) => item.enonce);
    }
    sections.forEach((section, index) => {
      body += titreSerie(titreCorrection(section), index === 0);
      body += writeList(section.items, (item) => item.corrige);
    });
  } else {
    for (const section of sections) {
      if (options.questions) {
        if (section.title) {
          body += `<text:p text:style-name="MMTitre">${esc(section.title)}</text:p>`;
        }
        body += writeList(section.items, (item) => item.enonce);
      }
      if (options.answers) {
        const title = titreCorrection(section);
        if (title.trim()) {
          body += `<text:p text:style-name="MMTitre">${esc(title)}</text:p>`;
        }
        body += writeList(section.items, (item) => item.corrige);
      }
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content ${CONTENT_NS}>
  <office:automatic-styles>
    <text:list-style style:name="MMNumerotation">
      <text:list-level-style-number text:level="1" style:num-format="1" style:num-suffix=".">
        <style:list-level-properties text:list-level-position-and-space-mode="label-alignment">
          <style:list-level-label-alignment text:label-followed-by="listtab" text:list-tab-stop-position="1.27cm" fo:text-indent="-0.635cm" fo:margin-left="1.27cm"/>
        </style:list-level-properties>
      </text:list-level-style-number>
    </text:list-style>${FRAME_STYLES}${TABLE_QR_STYLES}
    ${ctx.autoStylesXML()}
  </office:automatic-styles>
  <office:body>
    <office:text>${body}</office:text>
  </office:body>
</office:document-content>`;
}

/**
 * Génère et télécharge un document Writer.
 * @param {String} title
 * @param {Array} sections structure renvoyée par readSections
 * @param {Object} options {questions:Boolean, answers:Boolean}
 */
async function generateODT(title, sections, options) {
  return buildAndDownload("writer", title, sections, options);
}

/* ------------------------------------------------------------------ */
/* Impress (.odp)                                                      */
/* ------------------------------------------------------------------ */

const ODP_MEDIA = "application/vnd.oasis.opendocument.presentation";
const SLIDE_WIDTH = 28; // cm, format 16/9
const SLIDE_HEIGHT = 15.75;

function buildPresentationStylesXML() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
                        xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
                        xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
                        xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0"
                        xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" office:version="1.3">
  <office:styles>
    <style:style style:name="Standard" style:family="paragraph" style:class="text"/>
  </office:styles>
  <office:automatic-styles>
    <style:page-layout style:name="PM1">
      <style:page-layout-properties fo:page-width="${SLIDE_WIDTH}cm" fo:page-height="${SLIDE_HEIGHT}cm"
        style:print-orientation="landscape" fo:margin-top="0cm" fo:margin-bottom="0cm"
        fo:margin-left="0cm" fo:margin-right="0cm"/>
    </style:page-layout>
    <style:style style:name="dp1" style:family="drawing-page">
      <style:drawing-page-properties draw:background-size="border" draw:fill="none"/>
    </style:style>
  </office:automatic-styles>
  <office:master-styles>
    <style:master-page style:name="Default" style:page-layout-name="PM1" draw:style-name="dp1"/>
  </office:master-styles>
</office:document-styles>`;
}

/* Zone utile pour le contenu d'une diapositive */
const SLIDE_MARGIN = 1.5;
const SLIDE_BODY_TOP = 2.6;
const SLIDE_BODY_BOTTOM = 0.8;

/** Hauteur réservée à un bloc de diapositive */
function slideBlockHeight(block) {
  if (block.type === "object") return block.height;
  if (block.type === "table") return Math.max(1, block.rows || 2) * 1.1;
  return 1.4;
}

/**
 * Met les objets (figures et formules) à l'échelle de la place restante.
 * Impress étire un objet à la taille de son cadre : les formules grandissent
 * donc comme les images, et leur cadre garde le rapport mesuré à l'écran pour
 * qu'elles ne soient pas déformées.
 * @param {Array} blocks blocs de la diapositive, modifiés sur place
 */
function fitObjects(blocks, bodyWidth, availableHeight) {
  const objects = blocks.filter((b) => b.type === "object");
  if (!objects.length) return;
  const used = blocks
    .filter((b) => b.type !== "object")
    .reduce((sum, b) => sum + slideBlockHeight(b), 0);
  const free = availableHeight - used;
  if (free <= 0) return;
  const naturalHeight = objects.reduce((sum, b) => sum + b.height, 0);
  if (naturalHeight <= 0) return;
  let factor = free / naturalHeight;
  // aucun objet ne doit dépasser la largeur utile
  for (const object of objects) {
    if (object.width > 0) factor = Math.min(factor, bodyWidth / object.width);
  }
  if (factor <= 1) return;
  for (const object of objects) {
    object.width = round2(object.width * factor);
    object.height = round2(object.height * factor);
  }
}

/**
 * Une diapositive : bandeau de titre puis les blocs empilés et centrés.
 * Impress n'ancre pas d'objet dans le texte : chaque formule, image ou
 * tableau devient une forme autonome posée sous le texte qui la précède.
 */
function slideXML(index, title, node, ctx) {
  const bodyWidth = SLIDE_WIDTH - 2 * SLIDE_MARGIN;
  const writer = new BlockWriter(ctx, {
    maxWidthCm: bodyWidth,
    paragraphStyle: "MMSlideText",
    standaloneObjects: true,
  });
  if (node) {
    for (const child of Array.from(node.childNodes)) walk(child, writer, null);
  }
  const blocks = writer.slideBlocks();

  let xml = `<draw:page draw:name="page${index}" draw:style-name="dp1" draw:master-page-name="Default">
    <draw:frame draw:style-name="MMSlideFrame" draw:text-style-name="MMSlideTitle"
        svg:width="${bodyWidth}cm" svg:height="1.4cm" svg:x="${SLIDE_MARGIN}cm" svg:y="0.7cm">
      <draw:text-box><text:p text:style-name="MMSlideTitle">${esc(title)}</text:p></draw:text-box>
    </draw:frame>`;

  const available = SLIDE_HEIGHT - SLIDE_BODY_TOP - SLIDE_BODY_BOTTOM;
  const gap = 0.4;
  // figures et formules sont mesurées à leur taille écran : sur une
  // diapositive, elles occupent la place que le texte et les tableaux laissent
  fitObjects(
    blocks,
    bodyWidth,
    available - gap * Math.max(0, blocks.length - 1),
  );

  let total = blocks.reduce((sum, b) => sum + slideBlockHeight(b), 0);
  total += gap * Math.max(0, blocks.length - 1);
  // réduction homothétique si la diapositive déborde malgré tout
  const shrink = total > available ? available / total : 1;
  let y = SLIDE_BODY_TOP + Math.max(0, (available - total * shrink) / 2);

  for (const block of blocks) {
    const height = slideBlockHeight(block) * shrink;
    if (block.type === "p") {
      xml += `<draw:frame draw:style-name="MMSlideFrame" draw:text-style-name="MMSlideText"
        svg:width="${bodyWidth}cm" svg:height="${round2(height)}cm" svg:x="${SLIDE_MARGIN}cm" svg:y="${round2(y)}cm">
      <draw:text-box>${blockToXML(block)}</draw:text-box>
    </draw:frame>`;
    } else if (block.type === "object") {
      let width = block.width * shrink;
      let objectHeight = height;
      if (width > bodyWidth) {
        objectHeight = (objectHeight * bodyWidth) / width;
        width = bodyWidth;
      }
      const x = SLIDE_MARGIN + (bodyWidth - width) / 2;
      xml += `<draw:frame draw:style-name="MMSlideFrame"
        svg:width="${round2(width)}cm" svg:height="${round2(objectHeight)}cm" svg:x="${round2(x)}cm" svg:y="${round2(y)}cm">${block.xml}</draw:frame>`;
    } else {
      xml += `<draw:frame draw:style-name="MMSlideFrame"
        svg:width="${bodyWidth}cm" svg:height="${round2(height)}cm" svg:x="${SLIDE_MARGIN}cm" svg:y="${round2(y)}cm">${block.xml}</draw:frame>`;
    }
    y += height + gap;
  }
  return xml + "</draw:page>";
}

/** content.xml d'une présentation Impress */
function buildPresentationContentXML(sections, ctx, options) {
  let pages = "";
  let index = 0;
  for (const section of sections) {
    section.items.forEach((item, rank) => {
      const number = rank + 1;
      const base = section.title ? section.title + " — " : "";
      if (options.questions && item.enonce) {
        index += 1;
        pages += slideXML(index, `${base}Question ${number}`, item.enonce, ctx);
      }
      if (options.answers && item.corrige) {
        index += 1;
        pages += slideXML(index, `${base}Réponse ${number}`, item.corrige, ctx);
      }
    });
  }
  if (!pages) {
    pages = slideXML(1, "MathsMentales", null, ctx);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content ${CONTENT_NS}>
  <office:automatic-styles>${FRAME_STYLES}
    <style:style style:name="MMSlideFrame" style:family="graphic">
      <style:graphic-properties draw:fill="none" draw:stroke="none"
        draw:auto-grow-height="true" draw:textarea-vertical-align="middle"
        fo:padding="0cm" fo:border="none"/>
    </style:style>
    <style:style style:name="MMSlideTitle" style:family="paragraph">
      <style:paragraph-properties fo:text-align="center"/>
      <style:text-properties fo:font-size="22pt" fo:font-weight="bold" fo:color="#1A4E8A"/>
    </style:style>
    <style:style style:name="MMSlideText" style:family="paragraph">
      <style:paragraph-properties fo:text-align="center"/>
      <style:text-properties fo:font-size="28pt"/>
    </style:style>
    ${ctx.autoStylesXML()}
  </office:automatic-styles>
  <office:body>
    <office:presentation>${pages}</office:presentation>
  </office:body>
</office:document-content>`;
}

/**
 * Génère et télécharge une présentation Impress.
 * options.questions / options.answers : quand les deux sont vrais, les
 * diapositives alternent énoncé puis réponse pour chaque question.
 */
async function generateODP(title, sections, options) {
  return buildAndDownload("impress", title, sections, options);
}

export {
  generateODT as default,
  generateODT,
  generateODP,
  readSections,
  buildDocument,
};
