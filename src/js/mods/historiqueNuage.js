/**
 * Synchronisation nuage de l'historique des paniers : configuration,
 * mot de passe, appels au proxy WebDAV, écran de configuration.
 *
 * Ce module importe historique.js (pas l'inverse) : la synchronisation
 * réutilise telle quelle historique.exporterJSON()/importerJSON(texte,
 * "fusion"), qui SONT déjà l'opération de synchronisation, sans le réseau
 * (garanti par le lot 1, voir la spec).
 */
import historique from "./historique.js";
import {
  parseAdresseNuage,
  normaliseChemin,
  construireAcces,
  construireRequeteProxy,
  interpreteStatut,
} from "./historiqueNuageDef.js";

// Adresse complète (pas un chemin relatif) : le proxy est déployé à la main
// sur www.mathsmentales.net, pas produit par le build de src/ — un chemin
// relatif ne fonctionnerait que si le front était lui-même servi depuis ce
// domaine, ce qui n'est pas le cas de
// https://mathsmentales.forge.apps.education.fr (GitLab Pages, aucun PHP).
const PROXY_URL = "https://www.mathsmentales.net/proxy/nextcloud.php";
const DOSSIER = "MathsMentales";
const FICHIER = DOSSIER + "/historique.json";
const FICHIER_TEMOIN = DOSSIER + "/.mm-test";

const CLE_CONFIG = "mm-historique-nuage";
const CLE_MDP = "mm-historique-nuage-mdp";
const CLE_MDP_RETENIR = "mm-historique-nuage-retenir";
const CLE_DERNIER_SYNC = "mm-historique-nuage-dernier-sync";

function lire(cle, zone) {
  try {
    return zone.getItem(cle);
  } catch (err) {
    return null;
  }
}
function ecrire(cle, valeur, zone) {
  try {
    zone.setItem(cle, valeur);
  } catch (err) {
    // Espace de stockage plein ou indisponible : rien à faire de plus, la
    // configuration reste simplement non persistée pour cette session.
  }
}
function effacer(cle, zone) {
  try {
    zone.removeItem(cle);
  } catch (err) {
    // idem
  }
}

const historiqueNuage = {
  /** Configuration persistée, jamais le mot de passe (voir chargerMotDePasse). */
  chargerConfig() {
    const brut = lire(CLE_CONFIG, localStorage);
    if (!brut) return null;
    try {
      const config = JSON.parse(brut);
      return config !== null && typeof config === "object" ? config : null;
    } catch (err) {
      return null;
    }
  },

  sauverConfig(config) {
    ecrire(CLE_CONFIG, JSON.stringify(config), localStorage);
  },

  effacerConfig() {
    effacer(CLE_CONFIG, localStorage);
    effacer(CLE_DERNIER_SYNC, localStorage);
    this.oublierMotDePasse();
  },

  motDePasseRetenu() {
    return lire(CLE_MDP_RETENIR, localStorage) === "1";
  },

  /**
   * Par défaut le mot de passe ne survit pas à la fermeture de l'onglet
   * (sessionStorage) — « Retenir sur cet appareil » bascule sur
   * localStorage, avec l'avertissement affiché côté écran de configuration
   * (poste partagé en salle des profs). Le reste de la configuration, sans
   * le mot de passe, est toujours conservé via sauverConfig() ci-dessus.
   */
  chargerMotDePasse() {
    const zone = this.motDePasseRetenu() ? localStorage : sessionStorage;
    return lire(CLE_MDP, zone) || "";
  },

  sauverMotDePasse(motDePasse, retenir) {
    effacer(CLE_MDP, sessionStorage);
    effacer(CLE_MDP, localStorage);
    if (retenir) {
      ecrire(CLE_MDP_RETENIR, "1", localStorage);
      ecrire(CLE_MDP, motDePasse, localStorage);
    } else {
      effacer(CLE_MDP_RETENIR, localStorage);
      ecrire(CLE_MDP, motDePasse, sessionStorage);
    }
  },

  oublierMotDePasse() {
    effacer(CLE_MDP, sessionStorage);
    effacer(CLE_MDP, localStorage);
    effacer(CLE_MDP_RETENIR, localStorage);
  },

  /** Requête brute au proxy. Ne lève jamais : les erreurs réseau deviennent `{statut: 0}`. */
  async fetchProxy(methode, acces, chemin, contenu) {
    const propre = normaliseChemin(chemin);
    if (propre === null) return { statut: 0, texte: "" };
    try {
      const reponse = await fetch(PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "MathsMentales" },
        body: JSON.stringify(construireRequeteProxy(methode, acces, propre, contenu)),
      });
      return { statut: reponse.status, texte: await reponse.text() };
    } catch (err) {
      return { statut: 0, texte: "" };
    }
  },

  async lireFichier(acces, chemin) {
    const { statut, texte } = await this.fetchProxy("GET", acces, chemin);
    const resultat = interpreteStatut(statut, texte, { ecriture: false });
    return resultat.ok ? { ok: true, texte } : resultat;
  },

  async ecrireFichier(acces, chemin, contenu) {
    const { statut, texte } = await this.fetchProxy("PUT", acces, chemin, contenu);
    return interpreteStatut(statut, texte, { ecriture: true });
  },

  /** MKCOL : 405 (dossier déjà présent) est un succès au même titre que 201. */
  async creerDossier(acces, chemin) {
    const { statut, texte } = await this.fetchProxy("MKCOL", acces, chemin);
    if (statut === 405) return { ok: true };
    return interpreteStatut(statut, texte, { ecriture: true });
  },

  async supprimerFichier(acces, chemin) {
    const { statut, texte } = await this.fetchProxy("DELETE", acces, chemin);
    return interpreteStatut(statut, texte, { ecriture: true });
  },

  /**
   * PROPFIND racine pour valider l'accès + le mot de passe, puis dépôt et
   * suppression d'un fichier témoin pour détecter un accès en lecture
   * seule (droit de dépôt non accordé).
   */
  async testerConnexion(acces) {
    const { statut, texte } = await this.fetchProxy("PROPFIND", acces, "");
    // { ecriture: true } : la racine existe forcément (l'utilisateur vient
    // de la configurer), donc un 401 ici signifie sans ambiguïté un mot de
    // passe refusé, jamais une ressource absente.
    const racine = interpreteStatut(statut, texte, { ecriture: true });
    if (!racine.ok) return racine;
    // Le dossier MathsMentales/ peut ne pas exister encore sur un partage
    // tout neuf : sans cette création préalable (idempotente), le PUT du
    // fichier témoin échouerait faute de dossier parent, et un partage
    // parfaitement inscriptible serait à tort signalé en lecture seule.
    await this.creerDossier(acces, DOSSIER);
    const ecriture = await this.ecrireFichier(acces, FICHIER_TEMOIN, "test");
    if (!ecriture.ok) return { ok: true, inscriptible: false };
    await this.supprimerFichier(acces, FICHIER_TEMOIN);
    return { ok: true, inscriptible: true };
  },

  /**
   * Synchronise l'historique local avec le fichier distant. Réutilise
   * telle quelle la garantie du lot 1 : exporterJSON()/importerJSON(texte,
   * "fusion") SONT l'opération de synchronisation, sans le réseau — cette
   * fonction n'ajoute que le transport.
   *
   * 1. Dossier MathsMentales/ créé s'il n'existe pas encore (idempotent).
   * 2. Fichier distant absent (premier envoi) : on y écrit l'export local.
   * 3. Fichier distant présent : fusion dans l'historique local
   *    (importerJSON en mode "fusion", qui persiste immédiatement en
   *    local), puis réécriture du fichier distant avec l'export local
   *    fusionné — pour que les entrées locales-seules remontent aussi.
   */
  async synchroniser() {
    const config = this.chargerConfig();
    if (config === null) return { ok: false, erreurs: ["Aucune synchronisation configurée."] };
    const acces = construireAcces(config, this.chargerMotDePasse());

    const dossier = await this.creerDossier(acces, DOSSIER);
    if (!dossier.ok) return { ok: false, erreurs: [dossier.message] };

    const distant = await this.lireFichier(acces, FICHIER);
    if (!distant.ok && distant.code !== "absent") {
      return { ok: false, erreurs: [distant.message] };
    }

    let ajoutees = 0;
    if (distant.ok) {
      const resultat = historique.importerJSON(distant.texte, "fusion");
      if (!resultat.ok) return { ok: false, erreurs: resultat.erreurs };
      ajoutees = resultat.ajoutees;
    }

    // Capturé avant l'écriture réseau : un changement local fait pendant
    // l'attente du PUT (renommer, supprimer…) doit rester postérieur à cet
    // horodatage, sinon nonSynchronise() le croirait à tort déjà poussé.
    const maintenant = Date.now();
    const envoi = await this.ecrireFichier(acces, FICHIER, historique.exporterJSON());
    if (!envoi.ok) return { ok: false, erreurs: [envoi.message] };
    ecrire(CLE_DERNIER_SYNC, String(maintenant), localStorage);

    return { ok: true, ajoutees };
  },

  /** Horodatage (ms) de la dernière synchronisation réussie, `null` si aucune. */
  dernierSync() {
    const brut = lire(CLE_DERNIER_SYNC, localStorage);
    const nombre = Number(brut);
    return brut !== null && Number.isFinite(nombre) ? nombre : null;
  },

  /**
   * Vrai si une configuration est active et que l'historique local contient
   * des changements postérieurs à la dernière synchronisation réussie —
   * ajout, renommage, épinglage ou suppression (les tombstones portent aussi
   * modifie, donc une suppression compte). Sert à la fois à l'alerte de
   * fermeture d'onglet et à la proposition de synchro à l'ouverture.
   */
  nonSynchronise() {
    if (this.chargerConfig() === null) return false;
    const entrees = historique.charger();
    if (entrees.length === 0) return false;
    const dernier = this.dernierSync();
    if (dernier === null) return true;
    return entrees.some((entree) => entree.modifie > dernier);
  },

  /**
   * Bandeau de proposition dans l'onglet Historique, à l'ouverture de
   * l'application : signaler() suffit pas ici, il faut un bouton en plus du
   * texte, comme pour l'annulation de suppression.
   */
  proposerSynchro() {
    if (!this.nonSynchronise()) return;
    const zone = historique.section && historique.section.querySelector("#hist-annonce");
    if (!zone) return;
    zone.textContent = "Des changements locaux ne sont pas encore synchronisés · ";
    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.textContent = "Synchroniser";
    bouton.addEventListener("click", () => this.synchroniserEtRafraichir());
    zone.appendChild(bouton);
    zone.className = "hist-annonce hist-annonce-visible";
  },

  /**
   * Supprime le fichier distant (pas la configuration locale, ni l'historique
   * local : voir effacerConfig() pour ça). Un fichier déjà absent (404) n'est
   * pas une erreur — c'est l'état visé.
   */
  async supprimerSauvegarde() {
    const config = this.chargerConfig();
    if (config === null) return { ok: false, erreurs: ["Aucune synchronisation configurée."] };
    const acces = construireAcces(config, this.chargerMotDePasse());
    const resultat = await this.supprimerFichier(acces, FICHIER);
    if (resultat.ok || resultat.code === "absent") return { ok: true };
    return { ok: false, erreurs: [resultat.message] };
  },

  /** Construit et affiche l'écran de configuration de la synchronisation. */
  ouvrirConfig() {
    if (document.getElementById("hist-nuage-fond") !== null) return;
    const config = this.chargerConfig() || {};
    const fond = document.createElement("div");
    fond.id = "hist-nuage-fond";
    fond.className = "hist-nuage-fond";
    const boite = document.createElement("div");
    boite.className = "hist-nuage-boite";
    boite.innerHTML = `
      <button type="button" id="hist-nuage-fermer" class="hist-nuage-fermer" aria-label="Fermer">✕</button>
      <h3>Synchronisation nuage</h3>
      <p class="hist-nuage-aide">
        Lien de partage protégé par mot de passe (Nextcloud, apps.education.fr…),
        ou racine d’un compte WebDAV (kDrive, Synology, Infomaniak…).
      </p>
      <label class="hist-nuage-champ">
        Adresse
        <input type="url" id="hist-nuage-adresse" placeholder="https://…" value="">
      </label>
      <label class="hist-nuage-champ hidden" id="hist-nuage-champ-identifiant">
        Identifiant
        <input type="text" id="hist-nuage-identifiant" value="">
      </label>
      <label class="hist-nuage-champ">
        Mot de passe
        <input type="password" id="hist-nuage-mdp" value="">
      </label>
      <label class="hist-nuage-case">
        <input type="checkbox" id="hist-nuage-retenir" ${this.motDePasseRetenu() ? "checked" : ""}>
        Retenir sur cet appareil
      </label>
      <p class="hist-nuage-avertissement">
        Sur un poste partagé (salle des profs), laissez cette case décochée :
        le mot de passe serait sinon utilisable et lisible par la prochaine personne
        utilisant ce navigateur.
      </p>
      <div class="hist-nuage-actions">
        <button type="button" id="hist-nuage-tester">Tester la connexion</button>
        <button type="button" id="hist-nuage-enregistrer">Enregistrer</button>
        <button type="button" id="hist-nuage-oublier">Oublier cette configuration</button>
      </div>
      <div class="hist-nuage-actions">
        <button type="button" id="hist-nuage-supprimer-distant" class="hist-danger">🗑️ Supprimer la sauvegarde distante</button>
      </div>
      <p id="hist-nuage-statut" class="hist-nuage-statut" role="status" aria-live="polite"></p>`;
    fond.appendChild(boite);
    document.body.appendChild(fond);

    // Assigné via la propriété DOM .value, jamais via l'attribut HTML
    // value="..." ci-dessus (laissé vide, statique) : ces valeurs viennent de
    // saisies utilisateur (identifiant, mot de passe, adresse) et ne doivent
    // jamais être interpolées dans innerHTML, sous peine d'injection HTML/JS
    // stockée (voir revue de sécurité).
    boite.querySelector("#hist-nuage-adresse").value =
      config.mode === "partage"
        ? "https://" + (config.instance || "") + "/s/" + (config.jeton || "")
        : config.baseUrl || "";
    boite.querySelector("#hist-nuage-identifiant").value = config.identifiant || "";
    boite.querySelector("#hist-nuage-mdp").value = this.chargerMotDePasse();

    const champIdentifiant = boite.querySelector("#hist-nuage-champ-identifiant");
    const majAffichageMode = () => {
      const adresse = parseAdresseNuage(boite.querySelector("#hist-nuage-adresse").value.trim());
      champIdentifiant.className = "hist-nuage-champ" + (adresse !== null && adresse.mode === "compte" ? "" : " hidden");
    };
    majAffichageMode();
    boite.querySelector("#hist-nuage-adresse").addEventListener("input", majAffichageMode);

    const litFormulaire = () => {
      const adresse = parseAdresseNuage(boite.querySelector("#hist-nuage-adresse").value.trim());
      if (adresse === null) return null;
      const config =
        adresse.mode === "partage"
          ? adresse
          : Object.assign(adresse, { identifiant: boite.querySelector("#hist-nuage-identifiant").value.trim() });
      const motDePasse = boite.querySelector("#hist-nuage-mdp").value;
      const retenir = boite.querySelector("#hist-nuage-retenir").checked;
      return { config, motDePasse, retenir };
    };

    const statut = boite.querySelector("#hist-nuage-statut");
    boite.querySelector("#hist-nuage-tester").addEventListener("click", async () => {
      const saisie = litFormulaire();
      if (saisie === null) {
        statut.textContent = "Adresse invalide : une adresse https, avec /s/<jeton> pour un partage.";
        return;
      }
      statut.textContent = "Test en cours…";
      const resultat = await this.testerConnexion(construireAcces(saisie.config, saisie.motDePasse));
      statut.textContent = resultat.ok
        ? "Connexion réussie" + (resultat.inscriptible ? "." : ", mais en lecture seule : le dépôt a échoué.")
        : resultat.message;
    });

    boite.querySelector("#hist-nuage-enregistrer").addEventListener("click", () => {
      const saisie = litFormulaire();
      if (saisie === null) {
        statut.textContent = "Adresse invalide : une adresse https, avec /s/<jeton> pour un partage.";
        return;
      }
      this.sauverConfig(saisie.config);
      this.sauverMotDePasse(saisie.motDePasse, saisie.retenir);
      fond.parentNode.removeChild(fond);
      historique.signaler("Synchronisation configurée.");
    });

    const fermer = () => fond.parentNode.removeChild(fond);
    boite.querySelector("#hist-nuage-fermer").addEventListener("click", fermer);
    fond.addEventListener("click", (evt) => {
      if (evt.target === fond) fermer();
    });

    boite.querySelector("#hist-nuage-oublier").addEventListener("click", () => {
      this.effacerConfig();
      fermer();
      historique.signaler("Configuration nuage oubliée.");
    });

    boite.querySelector("#hist-nuage-supprimer-distant").addEventListener("click", async () => {
      // Action irréversible, partagée entre postes : le fichier disparaît
      // pour tout le monde, contrairement à « Oublier cette configuration »
      // (purement local). Un confirm() classique suffit, comme pour « Vider
      // l'historique » dans historique.js.
      if (
        !window.confirm(
          "Supprimer la sauvegarde distante ?\n\nLes autres appareils synchronisés avec cette adresse perdront cette copie de l’historique au prochain contact. Votre historique local n’est pas touché.",
        )
      ) {
        return;
      }
      statut.textContent = "Suppression en cours…";
      const resultat = await this.supprimerSauvegarde();
      statut.textContent = resultat.ok
        ? "Sauvegarde distante supprimée."
        : "Échec de la suppression : " + resultat.erreurs.join(" ");
    });
  },

  /** Synchronise puis rend compte du résultat dans l'onglet Historique. */
  async synchroniserEtRafraichir() {
    if (this.chargerConfig() === null) {
      this.ouvrirConfig();
      return;
    }
    historique.signaler("Synchronisation en cours…");
    const resultat = await this.synchroniser();
    historique.signaler(
      resultat.ok
        ? "Synchronisation réussie" + (resultat.ajoutees > 0 ? " · " + resultat.ajoutees + " entrée(s) reçue(s)." : ".")
        : "Échec de la synchronisation : " + resultat.erreurs.join(" "),
    );
    historique.rendre();
  },
};

export default historiqueNuage;
