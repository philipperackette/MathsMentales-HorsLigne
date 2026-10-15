import utils from "./mods/utils.js";
import {
  DEFAULT_REGLES,
  countQuestions,
  decode,
  encode,
  normalize,
  validate,
} from "./mods/parkourDef.js";
import cart from "./mods/cart.js";
import Sortable from "./libs/sortable/sortable.core.esm.js";

const BROUILLON_KEY = "parkour-editeur-brouillon";

const REGLES_LABELS = {
  delaiDeblocageH: "Délai avant l'étape suivante (heures)",
  verrouEchecH: "Verrou après échecs répétés (heures)",
  tentativesAvantVerrou: "Échecs consécutifs avant verrou",
  seuilReussite: "Bonnes réponses pour réussir une étape",
  nbQuestions: "Questions par étape",
};

const SUPPORTS = [
  { value: "arbre", label: "🌳 Arbre" },
  { value: "toit", label: "🏠 Toit" },
  { value: "barre", label: "🤸 Barre" },
];

const MM_VERSION = utils.getVersion();

/** État d'édition : toujours un parcours normalisé. */
let def = nouveauParcours();
// instance Sortable de la liste d'étapes courante, détruite avant chaque
// nouveau render() (convention du dépôt, voir MM.js)
let etapesSortable = null;

function nouveauParcours() {
  return normalize({
    id: "mon-parcours",
    titre: "Mon parcours",
    themes: [{ id: "nombres", label: "Nombres et calculs" }],
    etapes: [],
  });
}

/** Transforme un titre en identifiant utilisable dans une clé de stockage. */
function slugify(texte) {
  return String(texte)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // retire les diacritiques isolés par NFD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function sauverBrouillon() {
  try {
    window.localStorage.setItem(BROUILLON_KEY, JSON.stringify(def));
  } catch {
    // quota plein ou stockage refusé : l'édition continue, sans filet
  }
}

function chargerBrouillon() {
  try {
    const brut = window.localStorage.getItem(BROUILLON_KEY);
    if (brut) def = normalize(JSON.parse(brut));
  } catch {
    def = nouveauParcours();
  }
}

/** Champ texte étiqueté, relié à une fonction de mise à jour. */
function champTexte(labelText, value, onChange) {
  const ligne = utils.create("div", { className: "pe-champ" });
  ligne.appendChild(utils.create("label", { textContent: labelText }));
  const input = utils.create("input", { type: "text", value: value });
  input.oninput = () => onChange(input.value);
  ligne.appendChild(input);
  return ligne;
}

function renderEntete() {
  const zone = document.getElementById("pe-entete");
  zone.innerHTML = "";
  zone.appendChild(utils.create("h2", { textContent: "Le parcours" }));

  // référence gardée pour mettre à jour l'identifiant sans re-rendre le champ
  // titre pendant la frappe (renderEntete() y ferait perdre le focus)
  let inputIdentifiant;

  zone.appendChild(
    champTexte("Titre affiché aux élèves", def.titre, (value) => {
      const ancienSlug = slugify(def.titre);
      def.titre = value;
      // tant que le prof n'a pas fixé l'identifiant à la main, il suit le titre
      if (def.id === ancienSlug || def.id === "mon-parcours") {
        def.id = slugify(value) || "mon-parcours";
        if (inputIdentifiant) inputIdentifiant.value = def.id;
      }
      sauverBrouillon();
      renderPied();
    }),
  );

  const champIdentifiant = champTexte(
    "Identifiant du parcours",
    def.id,
    (value) => {
      def.id = slugify(value);
      sauverBrouillon();
      renderPied();
    },
  );
  inputIdentifiant = champIdentifiant.querySelector("input");
  zone.appendChild(champIdentifiant);

  zone.appendChild(
    utils.create("p", {
      className: "pe-aide pe-avertissement",
      textContent:
        "L'identifiant est la clé de progression des élèves : le modifier après diffusion remet leur progression à zéro.",
    }),
  );

  const actions = utils.create("div", { className: "pe-champ" });
  const btnNouveau = utils.create("button", { textContent: "Nouveau parcours" });
  btnNouveau.onclick = () => {
    if (!window.confirm("Abandonner le parcours en cours d'édition ?")) return;
    def = nouveauParcours();
    sauverBrouillon();
    render();
  };
  actions.appendChild(btnNouveau);

  const inputFichier = utils.create("input", {
    type: "file",
    accept: ".json,application/json",
    className: "pe-import-fichier",
  });
  inputFichier.onchange = async () => {
    const fichier = inputFichier.files[0];
    if (!fichier) return;
    try {
      def = normalize(JSON.parse(await fichier.text()));
      sauverBrouillon();
      render();
    } catch {
      window.alert("Ce fichier n'est pas un parcours lisible.");
    }
    inputFichier.value = "";
  };

  const btnImportFichier = utils.create("button", {
    textContent: "Importer un fichier",
  });
  btnImportFichier.onclick = () => inputFichier.click();

  const btnImportLien = utils.create("button", {
    textContent: "Importer un lien",
  });
  btnImportLien.onclick = () => {
    const saisi = window.prompt("Coller le lien élève d'un parcours :");
    if (!saisi) return;
    try {
      // on accepte aussi bien le lien complet que le seul code
      const match = saisi.match(/[?&]d=([^&\s]+)/);
      def = decode(match ? match[1] : saisi.trim());
      sauverBrouillon();
      render();
    } catch (err) {
      window.alert("Import impossible : " + err.message);
    }
  };

  actions.appendChild(btnImportFichier);
  actions.appendChild(btnImportLien);
  actions.appendChild(inputFichier);
  zone.appendChild(actions);
}

function renderThemes() {
  const zone = document.getElementById("pe-themes");
  zone.innerHTML = "";
  zone.appendChild(utils.create("h2", { textContent: "Thèmes" }));
  zone.appendChild(
    utils.create("p", {
      className: "pe-aide",
      textContent:
        "Chaque thème donne une barre d'étoiles sur l'accueil du jeu.",
    }),
  );

  def.themes.forEach((theme, index) => {
    const ligne = utils.create("div", { className: "pe-champ" });
    const input = utils.create("input", { type: "text", value: theme.label });
    input.oninput = () => {
      theme.label = input.value;
      sauverBrouillon();
      renderPied();
    };
    ligne.appendChild(input);
    const btnSuppr = utils.create("button", { textContent: "Supprimer" });
    btnSuppr.onclick = () => {
      const utilise = def.etapes.filter((etape) => etape.theme === theme.id);
      if (utilise.length > 0) {
        window.alert(
          "Thème utilisé par : " +
            utilise.map((etape) => etape.titre || etape.id).join(", "),
        );
        return;
      }
      def.themes.splice(index, 1);
      sauverBrouillon();
      render();
    };
    ligne.appendChild(btnSuppr);
    zone.appendChild(ligne);
  });

  const btnAjout = utils.create("button", { textContent: "Ajouter un thème" });
  btnAjout.onclick = () => {
    const idsExistants = new Set(def.themes.map((theme) => theme.id));
    // le numéro suit la longueur de la liste, qui redescend après une
    // suppression : on incrémente donc jusqu'à un slug réellement libre pour
    // ne jamais faire coïncider deux thèmes sur le même id
    let n = def.themes.length + 1;
    let label = "Nouveau thème " + n;
    let id = slugify(label);
    while (idsExistants.has(id)) {
      n += 1;
      label = "Nouveau thème " + n;
      id = slugify(label);
    }
    def.themes.push({ id, label });
    sauverBrouillon();
    render();
  };
  zone.appendChild(btnAjout);
}

function renderRegles() {
  const zone = document.getElementById("pe-regles");
  zone.innerHTML = "";
  const details = utils.create("details");
  details.appendChild(
    utils.create("summary", { textContent: "Règles du jeu (avancé)" }),
  );
  details.appendChild(
    utils.create("p", {
      className: "pe-aide",
      textContent:
        "Laisser tel quel pour le comportement habituel. Mettre 0 heure de délai pour un parcours jouable en une seule séance.",
    }),
  );
  for (const key of Object.keys(DEFAULT_REGLES)) {
    const ligne = utils.create("div", { className: "pe-champ" });
    ligne.appendChild(utils.create("label", { textContent: REGLES_LABELS[key] }));
    const input = utils.create("input", {
      type: "number",
      min: "0",
      step: key.endsWith("H") ? "0.25" : "1",
      value: String(def.regles[key]),
    });
    input.oninput = () => {
      const value = Number(input.value);
      if (input.value !== "" && !Number.isNaN(value)) def.regles[key] = value;
      sauverBrouillon();
      renderPied();
    };
    ligne.appendChild(input);
    details.appendChild(ligne);
  }
  zone.appendChild(details);
}

/**
 * Version diffusable du parcours : les champs de travail de l'éditeur
 * (le lien collé) ne partent pas chez les élèves.
 * @returns {object}
 */
function parcoursPublie() {
  const publie = normalize(def);
  publie.etapes = publie.etapes.map((etape) => {
    const copie = { ...etape };
    delete copie.lien;
    return copie;
  });
  return publie;
}

/** Déclenche le téléchargement d'un fichier texte généré côté navigateur. */
function telecharger(nomFichier, contenu) {
  const blob = new Blob([contenu], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const lien = utils.create("a", { href: url, download: nomFichier });
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  URL.revokeObjectURL(url);
}

/** URL du jeu portant le parcours complet dans son paramètre ?d=. */
function lienEleve() {
  const base = new URL("parkour.html", window.location.href);
  return base.href + "?d=" + encode(parcoursPublie());
}

/** Rendu du pied de page : rapport de validation et actions d'export. */
function renderPied() {
  const zone = document.getElementById("pe-pied");
  zone.innerHTML = "";
  const rapport = validate(def);

  if (rapport.erreurs.length === 0 && rapport.avertissements.length === 0) {
    zone.appendChild(
      utils.create("p", { className: "pe-ok", textContent: "Parcours prêt." }),
    );
  } else {
    const liste = utils.create("ul");
    for (const message of rapport.erreurs) {
      liste.appendChild(
        utils.create("li", { className: "pe-erreur", textContent: message }),
      );
    }
    for (const message of rapport.avertissements) {
      liste.appendChild(
        utils.create("li", {
          className: "pe-avertissement",
          textContent: message,
        }),
      );
    }
    zone.appendChild(liste);
  }

  const actions = utils.create("div", { className: "pe-champ" });
  const bloquant = rapport.erreurs.length > 0;

  const btnFichier = utils.create("button", {
    textContent: "Télécharger le fichier .json",
    disabled: bloquant,
  });
  btnFichier.onclick = () => {
    telecharger(
      (def.id || "parcours") + ".json",
      JSON.stringify(parcoursPublie(), null, 2),
    );
  };

  const btnLien = utils.create("button", {
    textContent: "Copier le lien élève",
    disabled: bloquant,
  });
  btnLien.onclick = async () => {
    const lien = lienEleve();
    try {
      await navigator.clipboard.writeText(lien);
      btnLien.textContent = "Lien copié !";
      setTimeout(() => {
        btnLien.textContent = "Copier le lien élève";
      }, 2000);
    } catch {
      window.prompt("Copie manuelle du lien :", lien);
    }
  };

  actions.appendChild(btnFichier);
  actions.appendChild(btnLien);
  zone.appendChild(actions);
}

/**
 * Extrait le premier panier d'un lien de partage MathsMentales.
 * utils.getUrlVars attend un objet de type URL (il lit .search et .hash) et
 * renvoie vars.c, un objet de paniers indexés par id de panier.
 * @param {string} lien URL collée par le professeur
 * @returns {object} panier au format cart.import
 * @throws {Error} si le lien n'est pas exploitable
 */
function panierFromUrl(lien) {
  let url;
  try {
    url = new URL(String(lien).trim());
  } catch {
    throw new Error("Ce n'est pas une adresse valide.");
  }
  let vars;
  try {
    // utils.getUrlVars appelle decodeURI en interne, qui lève URIError sur un
    // simple "%" isolé dans le lien collé (encodage partiel, copier-coller
    // tronqué…) : on l'englobe pour rendre un message en français plutôt que
    // de laisser fuiter « URI malformed ».
    vars = utils.getUrlVars(url);
  } catch {
    throw new Error("Ce lien contient un encodage invalide, impossible à lire.");
  }
  const paniers = vars && vars.c ? Object.values(vars.c) : [];
  if (paniers.length === 0) {
    throw new Error(
      "Ce lien ne contient aucun panier d'activités. Utilise le lien de partage d'un diaporama.",
    );
  }
  if (!paniers[0].a || Object.keys(paniers[0].a).length === 0) {
    throw new Error("Le panier de ce lien ne contient aucune activité.");
  }
  return paniers[0];
}

/**
 * Charge réellement les activités d'un panier pour vérifier qu'elles existent.
 * cart.import() avale ses propres erreurs et résout toujours : il faut
 * inspecter ce qui a été chargé (même précaution que lib.parkour.js).
 * @param {object} panier
 * @returns {Promise<{titres: string[], nbQuestions: number}>}
 */
async function verifierPanier(panier) {
  const panierCart = new cart(0);
  await panierCart.import(panier, false, MM_VERSION);
  const activities = panierCart.activities || [];
  const chargees = activities.filter((a) => a !== undefined);
  if (chargees.length === 0) {
    throw new Error(
      "Aucune activité n'a pu être chargée : identifiants inconnus ou connexion coupée.",
    );
  }
  const attendues = Object.keys(panier.a).length;
  if (chargees.length < attendues) {
    throw new Error(
      chargees.length + " activité(s) chargée(s) sur " + attendues + " attendue(s).",
    );
  }
  return {
    titres: chargees.map((a) => a.title),
    nbQuestions: countQuestions(panier),
  };
}

function nouvelleEtape() {
  const numero = def.etapes.length + 1;
  return {
    // id laissé vide : normalize() attribue le premier id "eNN" libre, pour ne
    // jamais réutiliser celui d'une étape existante (clé de progression élève)
    id: "",
    theme: def.themes.length > 0 ? def.themes[0].id : "",
    titre: "Étape " + numero,
    support: SUPPORTS[(numero - 1) % SUPPORTS.length].value,
    panier: {},
    // lien conservé pour ré-affichage ; retiré à l'export
    lien: "",
  };
}

/** Une carte d'étape : titre, thème, support, lien, résumé, actions. */
function carteEtape(etape, index) {
  const carte = utils.create("div", { className: "pe-etape" });

  const entete = utils.create("div", { className: "pe-etape-entete" });
  entete.appendChild(
    utils.create("span", {
      className: "pe-poignee",
      title: "Glisser pour réordonner",
      textContent: "⠿",
    }),
  );
  const inputTitre = utils.create("input", {
    type: "text",
    value: etape.titre || "",
  });
  inputTitre.oninput = () => {
    etape.titre = inputTitre.value;
    sauverBrouillon();
    renderPied();
  };
  entete.appendChild(inputTitre);

  const selectTheme = utils.create("select");
  for (const theme of def.themes) {
    const option = utils.create("option", {
      value: theme.id,
      textContent: theme.label,
    });
    if (theme.id === etape.theme) option.selected = true;
    selectTheme.appendChild(option);
  }
  selectTheme.onchange = () => {
    etape.theme = selectTheme.value;
    sauverBrouillon();
    renderPied();
  };
  entete.appendChild(selectTheme);

  const selectSupport = utils.create("select");
  for (const support of SUPPORTS) {
    const option = utils.create("option", {
      value: support.value,
      textContent: support.label,
    });
    if (support.value === etape.support) option.selected = true;
    selectSupport.appendChild(option);
  }
  selectSupport.onchange = () => {
    etape.support = selectSupport.value;
    sauverBrouillon();
  };
  entete.appendChild(selectSupport);
  carte.appendChild(entete);

  const ligneLien = utils.create("div", { className: "pe-champ" });
  const inputLien = utils.create("input", {
    type: "text",
    value: etape.lien || "",
    placeholder: "Coller ici le lien de partage MathsMentales",
  });
  inputLien.oninput = () => {
    etape.lien = inputLien.value;
    sauverBrouillon();
  };
  ligneLien.appendChild(inputLien);

  const resume = utils.create("div", { className: "pe-resume" });
  const nbDeclare = countQuestions(etape.panier);
  if (nbDeclare > 0) {
    resume.textContent = nbDeclare + " questions annoncées par le panier.";
  }

  const btnVerifier = utils.create("button", { textContent: "Vérifier" });
  btnVerifier.onclick = async () => {
    btnVerifier.disabled = true;
    resume.className = "pe-resume";
    resume.textContent = "Chargement des activités…";
    try {
      const panier = panierFromUrl(inputLien.value);
      const infos = await verifierPanier(panier);
      etape.panier = panier;
      etape.lien = inputLien.value;
      if (!etape.titre) etape.titre = panier.t || "";
      const manque = infos.nbQuestions < def.regles.nbQuestions;
      resume.className = "pe-resume " + (manque ? "pe-avertissement" : "pe-ok");
      resume.textContent =
        infos.titres.join(" · ") +
        " — " +
        infos.nbQuestions +
        " questions disponibles" +
        (manque ? " pour " + def.regles.nbQuestions + " demandées." : ".");
      sauverBrouillon();
      renderPied();
    } catch (err) {
      resume.className = "pe-resume pe-erreur";
      resume.textContent = err.message;
    } finally {
      btnVerifier.disabled = false;
    }
  };
  ligneLien.appendChild(btnVerifier);
  carte.appendChild(ligneLien);
  carte.appendChild(resume);

  const actions = utils.create("div", { className: "pe-etape-actions" });
  const btnTester = utils.create("button", { textContent: "Tester" });
  btnTester.onclick = () => {
    if (countQuestions(etape.panier) === 0) {
      window.alert("Vérifie d'abord le lien de cette étape.");
      return;
    }
    // parcours jetable : id horodaté (progression isolée) et déblocage immédiat
    const essai = normalize({
      id: "parkour-test-" + Date.now(),
      titre: "Test : " + (etape.titre || "étape"),
      regles: { ...def.regles, delaiDeblocageH: 0 },
      themes: def.themes,
      etapes: [{ ...etape, lien: undefined }],
    });
    const base = new URL("parkour.html", window.location.href);
    window.open(base.href + "?d=" + encode(essai), "_blank");
  };
  actions.appendChild(btnTester);
  const btnDupliquer = utils.create("button", { textContent: "Dupliquer" });
  btnDupliquer.onclick = () => {
    const copie = JSON.parse(JSON.stringify(etape));
    copie.id = "";
    copie.titre = (etape.titre || "Étape") + " (copie)";
    def.etapes.splice(index + 1, 0, copie);
    def = normalize(def);
    sauverBrouillon();
    render();
  };
  const btnSupprimer = utils.create("button", { textContent: "Supprimer" });
  btnSupprimer.onclick = () => {
    if (!window.confirm("Supprimer « " + (etape.titre || etape.id) + " » ?")) {
      return;
    }
    def.etapes.splice(index, 1);
    sauverBrouillon();
    render();
  };
  actions.appendChild(btnDupliquer);
  actions.appendChild(btnSupprimer);
  carte.appendChild(actions);

  return carte;
}

function renderEtapes() {
  const zone = document.getElementById("pe-etapes");
  zone.innerHTML = "";
  zone.appendChild(utils.create("h2", { textContent: "Étapes" }));
  zone.appendChild(
    utils.create("p", {
      className: "pe-aide",
      textContent:
        "L'ordre des étapes définit les prérequis : une étape ne s'ouvre qu'après la précédente.",
    }),
  );

  const liste = utils.create("div", { id: "pe-etapes-liste" });
  def.etapes.forEach((etape, index) => {
    liste.appendChild(carteEtape(etape, index));
  });
  zone.appendChild(liste);

  // détruit le sortable de l'ancien render() avant d'en recréer un sur le
  // nouveau DOM (convention du dépôt, voir MM.js)
  if (etapesSortable) {
    etapesSortable.destroy();
    etapesSortable = null;
  }
  if (def.etapes.length > 0) {
    etapesSortable = new Sortable(liste, {
      animation: 150,
      handle: ".pe-poignee",
      onEnd: (evt) => {
        const [deplacee] = def.etapes.splice(evt.oldIndex, 1);
        def.etapes.splice(evt.newIndex, 0, deplacee);
        sauverBrouillon();
        // Sortable termine encore son propre traitement sur ces nœuds à la
        // sortie de onEnd ; reconstruire le DOM de façon synchrone ici lui
        // ferait perdre ses repères. On diffère donc le rendu.
        setTimeout(render, 0);
      },
    });
  }

  const btnAjout = utils.create("button", { textContent: "Ajouter une étape" });
  btnAjout.onclick = () => {
    def.etapes.push(nouvelleEtape());
    def = normalize(def);
    sauverBrouillon();
    render();
  };
  zone.appendChild(btnAjout);
}

function render() {
  renderEntete();
  renderThemes();
  renderRegles();
  renderEtapes();
  renderPied();
}

chargerBrouillon();
render();
