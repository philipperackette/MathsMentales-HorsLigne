import { ComputeEngine } from '../libs/compute-engine/compute-engine.esm.js';
import MMmath from './math.js';
const ce = new ComputeEngine()

// extrait [numerateur, denominateur] d'une réponse écrite en \frac{a}{b} ou a/b, sinon null
function extractFraction (str) {
  if (typeof str !== "string") return null;
  const s = str.trim();
  let m = s.match(/^\\frac\{(-?\d+)\}\{(-?\d+)\}$/);
  if (m) return [parseInt(m[1], 10), parseInt(m[2], 10)];
  m = s.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
  if (m) return [parseInt(m[1], 10), parseInt(m[2], 10)];
  return null;
}

// une fraction saisie non réduite (gcd != 1) n'est jamais valide, même si numériquement égale à la réponse attendue
function fractionNonSimplifiee (userAnswer) {
  const frac = extractFraction(userAnswer);
  if (!frac) return false;
  const [num, den] = frac;
  if (den === 0) return false;
  return MMmath.pgcd(Math.abs(num), Math.abs(den)) !== 1;
}

// une expression contenant encore des parenthèses n'est pas développée/réduite,
// même si elle est numériquement/symboliquement égale à la réponse attendue
// (ex : élève qui recopie l'expression de la question au lieu de supprimer les parenthèses)
function expressionAvecParentheses (userAnswer) {
  if (typeof userAnswer !== "string") return false;
  return userAnswer.includes("(") || userAnswer.includes(")");
}

// une expression contenant encore un signe de multiplication n'est pas réduite,
// même si numériquement correcte (ex : "5\times b\times7" au lieu de "35b" : les
// facteurs numériques n'ont pas été multipliés entre eux). ce.parse() combine
// déjà les facteurs numériques d'une Multiply en un seul coefficient dès la
// canonicalisation, donc la comparaison canonical/simplify ne détecte pas ce cas :
// il faut un test syntaxique sur la chaîne saisie
function expressionAvecMultiplication (userAnswer) {
  if (typeof userAnswer !== "string") return false;
  // mathlive peut sérialiser le signe × en commande LaTeX (\times, \cdot) ou en
  // caractère brut (×, ·), selon la façon dont il a été saisi
  return /\\times|\\cdot|\*|×|·/.test(userAnswer);
}

// découpe une expression en monômes sur les +/- de tête (pas ceux d'un exposant, ex "x^{-2}")
function decouperTermes (userAnswer) {
  const nettoye = userAnswer.replace(/\s+/g, "");
  return nettoye.split(/(?<!\^)(?=[+-])/).filter(t => t.length > 0);
}

// dans un monôme, le coefficient doit s'écrire devant la/les lettre(s) ("18y", pas "y18"),
// et un coefficient valant 1 ne doit pas être écrit explicitement devant une lettre
// ("yz", pas "1yz"). ce.parse() réordonne et simplifie déjà silencieusement ces deux
// cas dès la canonicalisation (coefficient replacé en tête, "1" supprimé), donc la
// comparaison canonical/simplify ne les détecte pas : il faut un test syntaxique
function expressionCoefficientMalFormee (userAnswer) {
  if (typeof userAnswer !== "string") return false;
  for (const terme of decouperTermes(userAnswer)) {
    const sansSigneNiExposant = terme
      .replace(/^[+-]/, "")
      .replace(/\^\{?-?\d+\}?/g, "");
    const m = sansSigneNiExposant.match(/^(\d*)([a-zA-Z]*)$/);
    if (!m) return true; // chiffre après une lettre, ou forme inattendue
    const [, coefficient, lettres] = m;
    if (coefficient === "1" && lettres.length > 0) return true; // coefficient 1 explicite
  }
  return false;
}

// deux termes purement numériques (sans lettre) non regroupés en une seule constante
// ("17x+6+4" au lieu de "17x+10") : ce.parse() calcule déjà 6+4=10 dès la
// canonicalisation (comme pour un produit de deux nombres), donc la comparaison
// canonical/simplify ne le détecte pas non plus : test syntaxique sur le nombre
// de termes purement numériques
function expressionConstantesNonRegroupees (userAnswer) {
  if (typeof userAnswer !== "string") return false;
  let nbConstantes = 0;
  for (const terme of decouperTermes(userAnswer)) {
    if (/^[+-]?\d+$/.test(terme)) nbConstantes++;
  }
  return nbConstantes > 1;
}

// une expression dont les termes de même degré (x, x^2, constante...) ne sont pas
// regroupés n'est pas réduite, même si numériquement correcte
// (ex : "3x+2+4x" au lieu de "7x+2", ou "x^2+3x+2x^2" au lieu de "3x^2+3x")
// ce.parse() ne fait que canonicaliser (garde les termes séparés) alors que
// simplify() les regroupe : si les deux formes diffèrent, il restait du regroupement à faire
function expressionTermesNonRegroupes (expr) {
  try {
    return JSON.stringify(expr.json) !== JSON.stringify(expr.simplify().json);
  } catch (error) {
    return false;
  }
}

// une racine carrée n'est pas simplifiée si la saisie contient encore un produit,
// des parenthèses, plusieurs termes, plusieurs radicaux, un coefficient 1 explicite
// ou un radicande contenant un facteur carré (ex : "10\\sqrt{90}" au lieu de "30\\sqrt{10}").
// ce.parse() simplifie les radicaux dès la canonicalisation, d'où le test syntaxique
function racineNonSimplifiee (userAnswer) {
  if (typeof userAnswer !== "string") return false;
  const s = userAnswer.replace(/\s+/g, "");
  if (/\\times|\\cdot|\*|×|·|\(|\)/.test(s)) return true;
  if (decouperTermes(s).length > 1) return true;
  if (/^[+-]?1\\sqrt/.test(s)) return true;
  const radicaux = [...s.matchAll(/\\sqrt(\{([^}]*)\}|(\d))/g)];
  if (radicaux.length > 1) return true;
  for (const r of radicaux) {
    const radicande = r[2] !== undefined ? r[2] : r[3];
    if (!/^\d+$/.test(radicande)) return true;
    const n = parseInt(radicande, 10);
    if (n < 2 || MMmath.racineSimplifiable(n)) return true;
  }
  return false;
}

function analyseReponse (goodAnswer, userAnswer, valueType = false) {
  // on utilise dfrac pour l'affichage des fractions
  if (typeof goodAnswer === "string") {
    goodAnswer = goodAnswer.replace('dfrac', 'frac');
    goodAnswer = goodAnswer.replace(/\\text\{([^}]*)\}/g, "$1");
  }
  if (typeof userAnswer === "string") {
    // forcer l'utilisation de frac pour les fractions
      userAnswer = userAnswer.replace('dfrac', "frac");
      // suppression des &
      userAnswer = userAnswer.replace(/\&amp\;/g, "&");
      // suppression du displaystyle
      userAnswer = userAnswer.replace(/\\displaystyle/g, "");
      // remplacement de &gt; et &lt;
      userAnswer = userAnswer.replace(/&gt;/g, "\\gt").replace(/&lt;/g, "\\lt");
      userAnswer = userAnswer.replace(/>/g, "\\gt").replace(/</g, "\\lt");
      // si l'utilisateur a entré un texte \text{...}, on l'enleve
      userAnswer = userAnswer.replace(/\\text\{([^}]*)\}/g, "$1");
  }
  // console.log(goodAnswer, userAnswer);
    if (valueType !== false) {
      // confrontation de listes séparées par des ;
      if (valueType === "liste") {
        let arrayUser = userAnswer.split(";").map(value => value.trim()).sort((a, b) => a - b);
        let arrayExpected = goodAnswer.split(";").map(value => value.trim()).sort((a, b) => a - b);
        // comparons les contenus en transformant en une chaine
        if (arrayUser.toString() === arrayExpected.toString()) {
          return true
        } else {
          return false
        }
      } else if (valueType === "listeOrdonnee") {
        let arrayUser = userAnswer.split(";");
        let arrayExpected = goodAnswer.split(";");
        // comparons les contenus en transformant en une chaine
        if (arrayUser.toString() === arrayExpected.toString()) {
          return true
        } else {
          return false
        }
      } else if (valueType === "inInterval") {
        // ici la valeur doit être comprise entre les deux bornes de l'intervalle
        let minmax = goodAnswer.split("-").map(value => Number(value));
        // minmax[0] est la borne inf et minmax[1] est la borne sup;
        if (Number(userAnswer) > minmax[0] && Number(userAnswer) < minmax[1]) {
          return true
        } else {
          return false
        }
      } else if (valueType === "sansZeroInutile") {
          // Suppression des zéros initiaux et finaux inutiles dans les nombres
          const cleanedUser = String(userAnswer).replace(/^(-)?0+\.?0*(\d+)?$/, (match, sign, _, num) => {
            return num ? (sign ? `-${num}` : `0.${num}`) : (sign ? '-0' : '0');
          }).replace(/\.?0+$/, '');
          const cleanedExpected = String(goodAnswer).replace(/^(-)?0+\.?0*(\d+)?$/, (match, sign, _, num) => {
            return num ? (sign ? `-${num}` : `0.${num}`) : (sign ? '-0' : '0');
          }).replace(/\.?0+$/, '');
          // Comparaison après nettoyage
          return cleanedUser === cleanedExpected;
      } else if (valueType === "fractionIrreductible") {
        if (fractionNonSimplifiee(userAnswer)) {
          // fraction numériquement correcte mais non réduite : refusée (ex. simplification de fraction)
          return false;
        } else return true;
      } else if (valueType === "racineSimplifiee") {
        if (racineNonSimplifiee(userAnswer)) {
          // valeur correcte mais racine non simplifiée ou calcul non effectué : refusée
          return false;
        }
        try {
          return ce.parse(String(goodAnswer)).isSame(ce.parse(String(userAnswer)));
        } catch (error) {
          return false;
        }
      } else if (valueType === "expressionSimplifiee") {
        if (expressionAvecParentheses(userAnswer)) {
          // expression numériquement correcte mais parenthèses non supprimées : refusée
          return false;
        }
        if (expressionAvecMultiplication(userAnswer)) {
          // expression numériquement correcte mais facteurs non multipliés entre eux : refusée
          return false;
        }
        if (expressionCoefficientMalFormee(userAnswer)) {
          // coefficient placé après la lettre, ou "1" écrit explicitement devant une lettre : refusée
          return false;
        }
        if (expressionConstantesNonRegroupees(userAnswer)) {
          // plusieurs termes purement numériques non additionnés entre eux : refusée
          return false;
        }
        try {
          const userExpr = ce.parse(String(userAnswer));
          if (expressionTermesNonRegroupes(userExpr)) {
            // expression numériquement correcte mais termes de même degré non regroupés : refusée
            return false;
          }
          return ce.parse(String(goodAnswer)).simplify().isSame(userExpr.simplify());
        } catch (error) {
          return false;
        }
      }
    } else if (String(userAnswer).toLowerCase() == String(goodAnswer).toLowerCase()) {
      // égalité brute de chaines
      return true;
    } else {
      // usage de comparaison par le moteur de Compute engine
      const expr1 = ce.parse(String(goodAnswer));
      const expr2 = ce.parse(String(userAnswer));
      try {
        if (expr1.isSame(expr2)) {
          return true
        } else {
          return false
        }
      } catch (error) {
        return false
      }
    }
  }

 export default analyseReponse
