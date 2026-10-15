import { utils, _ } from "./utils.js";
import content, { activities } from "./content.js";
import activitesURL from "./activitiesurl.js";
import jsYaml from "../libs/js-yaml.mjs.js";

export { library as default };

/**
 * Normalise un caractère pour la recherche : minuscule, sans accent,
 * apostrophes typographiques ramenées à '.
 * Renvoie toujours un seul caractère, pour garder les positions alignées
 * avec la chaîne d'origine (surlignage).
 * @param {String} c caractère
 */
function plierCaractere(c) {
  const p = c
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’´`]/g, "'");
  return p.length === 1 ? p : c.toLowerCase();
}
/**
 * Normalise une chaîne caractère par caractère (même longueur que l'original)
 * @param {String} s
 */
function plier(s) {
  return s.split("").map(plierCaractere).join("");
}
/**
 * Surligne dans un titre les termes cherchés, sans tenir compte des accents ni de la casse
 * @param {String} titre titre d'origine
 * @param {Array} termes termes déjà normalisés par plier()
 */
function surligner(titre, termes) {
  const chars = titre.split("");
  const plie = chars.map(plierCaractere).join("");
  const marque = new Array(chars.length).fill(false);
  // on ne surligne pas à l'intérieur des balises HTML du titre (<sup>…)
  const dansBalise = [];
  let balise = false;
  chars.forEach((c, i) => {
    if (c === "<") balise = true;
    dansBalise[i] = balise;
    if (c === ">") balise = false;
  });
  termes.forEach((terme) => {
    let pos = plie.indexOf(terme);
    while (pos > -1) {
      for (let i = pos; i < pos + terme.length; i++)
        if (!dansBalise[i]) marque[i] = true;
      pos = plie.indexOf(terme, pos + terme.length);
    }
  });
  let html = "";
  chars.forEach((c, i) => {
    if (marque[i] && !marque[i - 1]) html += "<mark>";
    html += c;
    if (marque[i] && !marque[i + 1]) html += "</mark>";
  });
  return html;
}
// lecture de la bibliotheque
const library = {
  ordre: {
    "grille-ecole": ["11", "10", "9", "8", "7"],
    "grille-college": ["6", "5", "4", "3"],
    "grille-lycee": ["2", "G", "K", "T", "H"],
  },
  /**
   * Ouvre un fichier de la library
   * @param {String} url adresse du fichier à ouvrir
   */
  load: async function (activityId, version) {
    // pour le développement, on peut lire une activité qui n'a pas encore été intégrée dans la bibliothèque
    // en fournissant ?u=id de l'activité.
    let source = "";
    let url = activitesURL[activityId];
    let regexp = /^(\d{1,2}|T|G|K|H)/; // le fichier commence par un nombre ou un T pour la terminale
    let level = regexp.exec(activityId)[0];
    if (url === undefined) {
      url = "N" + level + "/" + activityId + ".json";
    }
    if (location.hostname === "127.0.0.1") source = "../public/";
    try {
      if (url.indexOf(".yml") > 0) {
        let result = await fetch(
          source + "library/" + url + "?v" + version,
        ).then((res) => res.text());
        const json = jsYaml.load(result);
        if (json.id === undefined) json.id = activityId;
        return [json, activityId];
      } else {
        let result = await fetch(
          source + "library/" + url + "?v" + version,
        ).then((res) => res.json());
        if (result.id === undefined) result.id = activityId;
        return [result, activityId];
      }
    } catch (jsonError) {
      url = "N" + level + "/" + activityId + ".yml";
      let result = await fetch(source + "library/" + url + "?v" + version).then(
        (res) => res.text(),
      );
      const json = jsYaml.load(result);
      if (json.id === undefined) json.id = activityId;
      return [json, activityId];
    }
  },
  /**
   *
   * @param {String} url url du json à récupérer
   */
  loadJSON: async function (activityId, version) {
    let source = "";
    let regexp = /^(\d{1,2}|T|G|K|H)/; // le fichier commence par un nombre ou un T pour la terminale
    let level = regexp.exec(activityId)[0];
    let url = activitesURL[activityId];
    if (url === undefined) {
      url = "N" + level + "/" + activityId + ".json";
    }
    if (location.hostname === "127.0.0.1") source = "../public/";
    try {
      if (url.indexOf(".yml") > 0) {
        let result = await fetch(
          source + "library/" + url + "?v" + version,
        ).then((res) => res.text());
        const json = jsYaml.load(result);
        if (json.id === undefined) json.id = activityId;
        return json;
      } else {
        let result = await fetch(
          source + "library/" + url + "?v" + version,
        ).then((res) => res.json());
        if (result.id === undefined) result.id = activityId;
        return result;
      }
    } catch (jsonError) {
      url = "N" + level + "/" + activityId + ".yml";
      let result = await fetch(source + "library/" + url + "?v" + version).then(
        (res) => res.text(),
      );
      const json = jsYaml.load(result);
      if (json.id === undefined) json.id = activityId;
      return json;
    }
  },
  /**
   * Récupère les données d'une activité lors d'un import venant du chargement d'un panier préconfiguré.
   * @param {String} url adresse
   * @returns Promesse de chargement du fichier à charger
   */
  import: async function (activityId, version) {
    let source = "";
    let regexp = /^(\d{1,2}|T|G|K|H)/; // le fichier commence par un nombre ou un T pour la terminale
    let level = regexp.exec(activityId)[0];
    let url = activitesURL[activityId];
    if (url === undefined) {
      url = "N" + level + "/" + activityId + ".json";
    }
    if (location.hostname === "127.0.0.1") source = "../public/";
    try {
      if (url.indexOf(".yml") > 0) {
        let result = await fetch(
          source + "library/" + url + "?v" + version,
        ).then((res) => res.text());
        const json = jsYaml.load(result);
        if (json.id === undefined) json.id = activityId;
        return json;
      } else {
        let result = await fetch(
          source + "library/" + url + "?v" + version,
        ).then((res) => res.json());
        if (result.id === undefined) result.id = activityId;
        return result;
      }
    } catch (jsonError) {
      url = "N" + level + "/" + activityId + ".yml";
      let result = await fetch(source + "library/" + url + "?v" + version).then(
        (res) => res.text(),
      );
      const json = jsYaml.load(result);
      if (json.id === undefined) json.id = activityId;
      return json;
    }
  },
  /**
   * Ouvre le fichier de description de toutes les activités disponibles sur MathsMentales
   */
  openContents: function () {
    return content;
  },
  /**
   * Affiche la liste des activités provenant d'une recherche ou d'un niveau à afficher (base=true)
   * @param {String} level Niveau à afficher
   * @param {Boolean} base Niveau de base ou pas
   * @returns
   */
  displayContent: function (level, base = false) {
    let now = new Date().getTime(); // date du jour, pour afficher les mises à jour récentes
    if (content === undefined) {
      console.log("Pas de bibliothèque");
      return false;
    }
    let niveau = { nom: "Recherche", themes: {} };
    // Cas d'un code correspondant à MMv1
    if (_.isObject(level)) {
      niveau.nom = "Cette activité a été répartie en plusieurs";
      // on cherche les titres
      for (let exo in level) {
        let found = false; // le titre n'est pas encore trouvé
        for (let niv in content) {
          if (found) break;
          if (_.isObject(content[niv])) {
            for (let theme in content[niv].themes) {
              if (found) break;
              for (let chap in content[niv].themes[theme].chapitres) {
                if (found) break;
                if (content[niv].themes[theme].chapitres[chap].e.length > 0) {
                  if (found) break;
                  for (
                    let i = 0;
                    i < content[niv].themes[theme].chapitres[chap].e.length;
                    i++
                  ) {
                    let idExo = content[niv].themes[theme].chapitres[chap].e[i];
                    if (activities[idExo].u === level[exo].u) {
                      level[exo].t = activities[idExo].t;
                      found = true;
                      break;
                    }
                  }
                }
              }
            }
          }
        }
      }
      niveau.themes[0] = {
        nom: "Cliquer pour ouvrir une activité",
        chapitres: {
          MM1: { n: "Cliquer sur Rechercher pour revenir ici", e: level },
        },
      };
      // cas d'une recherche textuelle
    } else if (!base) {
      // recherche d'un terme
      if (level.length < 3) return false; // on ne prend pas les mots de moins de 3 lettres
      // niveaux sélectionnés
      const levels = document.querySelectorAll(
        "#searchLevels input[name='searchlevel']:checked",
      );
      const selectedLevels = [];
      levels.forEach((elt) => {
        selectedLevels.push(elt.value);
      });
      // construction du niveau par extraction des données.
      // termes normalisés (sans accent ni casse), mots vides retirés
      let chaineATrouver = plier(level)
        .split(" ")
        .filter((txt) => txt !== "");
      for (let niv in content) {
        // on ne cherche que dans les niveaux sélectionnés. Si pas de niveau sélectionné, on prend tout.
        if (selectedLevels.length > 0 && selectedLevels.indexOf(niv) < 0)
          continue;
        if (_.isObject(content[niv])) {
          // le niveau contient de chapitres
          for (let theme in content[niv].themes) {
            for (let chap in content[niv].themes[theme].chapitres) {
              let chapExo = [];
              for (
                let exo = 0,
                  lene = content[niv].themes[theme].chapitres[chap].e.length;
                exo < lene;
                exo++
              ) {
                let idExo = content[niv].themes[theme].chapitres[chap].e[exo];
                let lexo = activities[idExo];
                // chaque terme doit se trouver dans le titre ou la description
                const texte = plier(lexo.t + " " + (lexo.d || ""));
                if (chaineATrouver.every((txt) => texte.indexOf(txt) > -1)) {
                  chapExo.push({
                    t: surligner(lexo.t, chaineATrouver),
                    id: idExo,
                  });
                } else if (
                  chaineATrouver.every((txt) => {
                    return idExo.toLowerCase().indexOf(txt) > -1;
                  })
                ) {
                  // recherche dans le code de l'exo
                  chapExo.push({ t: lexo.t, id: idExo });
                }
              }
              // si chapExo! == [], alors on créée l'arbo
              if (chapExo.length > 0) {
                if (!niveau.themes[theme]) {
                  niveau.themes[theme] = {
                    nom:
                      content[niv].nom + "/" + content[niv].themes[theme].nom,
                    chapitres: {},
                  };
                }
                niveau.themes[theme].chapitres[chap] = {
                  n: content[niv].themes[theme].chapitres[chap].n,
                  e: chapExo,
                };
              }
            }
          }
        } else continue;
      }
      // cas d'un clic sur un niveau
    } else niveau = content[level];
    const eltAffichage = document.getElementById("resultat-chercher");
    let html = "";
    // Hiérarchie de titres : le h1 du document est celui de l'accueil, l'arbre
    // de recherche part donc de h2. Le niveau est porté par la classe, pas par
    // la balise, car utils.deploy et le CSS s'y réfèrent.
    if (!base && !_.isObject(level))
      html =
        "<h2 id='rch1' class='rch-niveau pointer moins'>Résultat de la recherche</h2>";
    else if (!_.isObject(level)) {
      html =
        "<h2 id='rch1' class='rch-niveau pointer moins'>Niveau " +
        niveau["nom"] +
        " (" +
        niveau["activitiesNumber"] +
        " act.)</h2>";
      // on vide le champ de recherche
      document.getElementById("searchinput").value = "";
    } else
      html =
        "<h2 class='rch-niveau'>Cette activité MathsMentales v1 a été répartie en plusieurs activités</h2>";
    //if(base && !_.isObject(level)) // on change l'url level est un niveau de la bibliothèque
    //MM.setHistory(niveau["nom"],"n="+level);
    // Affichage et mise en forme des données.
    // Si niveau 3e, on affiche le lien vers la liste des items du Brevet
    if (level === "3") {
      html += `<div id="itemsbrevet2026">Items des automatismes du brevet 2026</div>`;
    } else if (level === "6") {
      html += `<div id="items6e2025">Items de 6e (2025)</div>`;
    } else if (level === "5") {
      html += `<div id="items5e2026">Items de 5e (2026)</div>`;
    } else if (level === "4") {
      html += `<div id="items4e2027">Items de 4e (2027)</div>`;
    }
    let itemsNumber = 0;
    for (let i in niveau["themes"]) {
      //let first = true;
      let theme = false;
      let htmlt = ""; //(first)?"<span>":"";
      htmlt +=
        "<h3 class='rch-theme pointer moins' id='rch2" +
        i +
        "'>" +
        niveau.themes[i].nom +
        "</h3>";
      for (let j in niveau["themes"][i]["chapitres"]) {
        let chapitre = false;
        let htmlc = ""; //(first)?"":"<span>";
        htmlc +=
          "<h4 id='rch3" +
          i +
          "-" +
          j +
          "' class='rch-chapitre pointer moins'>" +
          niveau["themes"][i]["chapitres"][j]["n"] +
          "</h4>";
        htmlc += "<ul>";
        let nbexos = niveau["themes"][i]["chapitres"][j]["e"].length;
        if (nbexos) {
          itemsNumber += nbexos;
          theme = true;
          chapitre = true;
          const svg =
            "<svg xmlns='http://www.w3.org/2000/svg' class='actitityLink' width='1.2em' height='1.2em' viewBox='0 0 48 48'><g fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='4'><path d='M30 19H20a8 8 0 1 0 0 16h16a8 8 0 0 0 6-13.292' /><path d='M6 24.292A8 8 0 0 1 12 11h16a8 8 0 1 1 0 16H18' /></g></svg>";
          for (let k = 0, len = nbexos; k < len; k++) {
            // raw vaut soit l'id de l'activité (niveau de base, résolu via
            // activities), soit un objet {t,id[,new]} déjà résolu (résultat
            // de recherche ou activité MMv1)
            let raw = niveau["themes"][i]["chapitres"][j]["e"][k];
            let exoData = typeof raw === "string" ? activities[raw] : raw;
            let id = typeof raw === "string" ? raw : raw.id;
            let title = exoData["t"];
            if (exoData["new"]) {
              htmlc +=
                "<li id='rcli" +
                i +
                "-" +
                j +
                "-" +
                k +
                "' class='new tooltip' data-id='" +
                id +
                "'><input type='checkbox' class='checkitem' value='" +
                id +
                "'>" +
                title +
                "<div class='tooltiptext'>" +
                id +
                "</div><span class='link' data-link='" +
                id +
                "' title='Cliquer pour copier le lien\ndans le presse papier'>" +
                svg +
                "</span></li>";
            } else {
              htmlc +=
                "<li id='rcli" +
                i +
                "-" +
                j +
                "-" +
                k +
                "' class='tooltip' data-id='" +
                id +
                "'><input type='checkbox' class='checkitem' value='" +
                id +
                "'>" +
                title +
                "<div class='tooltiptext'>" +
                id +
                "</div><span class='link' title='Cliquer pour copier le lien\ndans le presse papier' data-link='" +
                id +
                "'>" +
                svg +
                "</span></li>";
            }
          }
        } else {
          htmlc += "<li>Pas encore d'exercice</li>";
        }
        htmlc += "</ul>";
        if (chapitre) {
          htmlt += htmlc; //+((first)?"":"</span>");
          /*if(first === true){
              htmlt += "</span>";
              first = false;
          }*/
        }
      }
      if (theme) html += htmlt;
    }
    eltAffichage.innerHTML = html;
    let target = document.getElementById("tab-chercher");
    target.className = "tabs-content-item";
    // Nombre de colonnes en fonction du contenu
    if (itemsNumber > 40 && utils.pageWidth() > 1000)
      utils.addClass(target, "cols3");
    else if (itemsNumber > 20 && utils.pageWidth() > 840)
      utils.addClass(target, "cols2");
    document.querySelector("#header-menu [numero='#tab-chercher']").click();
  },
};
