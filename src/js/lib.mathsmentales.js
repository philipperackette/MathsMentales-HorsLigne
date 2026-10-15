import protos from "./mods/protos.js";
import utils from "./mods/utils.js";
// MathsMentales core
import MM from "./mods/MM.js";
import library from "./mods/library.js";
import sound from "./mods/sound.js";
import speech from "./mods/speech.js";
import historique from "./mods/historique.js";
import historiqueNuage from "./mods/historiqueNuage.js";
import { TYPES } from "./mods/historiqueDef.js";
import Picker from "./libs/vanilla-picker/vanilla-picker.esm.js";

window.onload = function () {
  MM.version = utils.getVersion();
  // detection de l'hébergement sur la forge
  if (window.location.host == "mathsmentales.forge.apps.education.fr") {
    const accueil = document.getElementById("accueillogo");
    if (accueil)
      accueil.innerHTML = `<i class="sprite sprite-logocm160x132 logoMM"></i>
            <h1>Automatismes et calcul mental à données aléatoires</h1>
            <p>
                Ceci est la version de <span class="red">test de MathsMentales</span>, dont le code source est accessible sur la <a href="https://forge.apps.education.fr/mathsmentales/mathsmentales.forge.apps.education.fr">Forge des communs numériques.</a>
            </p>
            <p>
                Préferez utiliser la version stable sur <a href="https://mathsmentales.net">https://mathsmentales.net</a>
            </p>
            <p>
                Merci de signaler les <b>bugs</b> sous forme de <b>ticket</b> sur <a href="https://forge.apps.education.fr/mathsmentales/mathsmentales.forge.apps.education.fr/-/issues">le dépot mathsmentales</a> .
            </p>`;
  }
  // detect if touching interface
  let listener = function (evt) {
    // the user touched the screen!
    MM.touched = true;
    window.removeEventListener("touchstart", listener, false);
  };
  window.addEventListener("touchstart", listener, false);
  // for ascii notations, used by math parser
  //MM.ascii2tex = new AsciiMathParser();
  MM.resetCarts();
  // interface
  let tabsButtons = document.querySelectorAll("#header-menu .tabs-menu-link");
  tabsButtons.forEach((element, index) => {
    element.onclick = function () {
      MM.showTab(element);
    };
    // navigation clavier entre onglets, attendue pour un role="tablist"
    element.onkeydown = function (evt) {
      let cible = null;
      if (evt.key === "ArrowRight")
        cible = tabsButtons[(index + 1) % tabsButtons.length];
      else if (evt.key === "ArrowLeft")
        cible =
          tabsButtons[(index - 1 + tabsButtons.length) % tabsButtons.length];
      else if (evt.key === "Home") cible = tabsButtons[0];
      else if (evt.key === "End") cible = tabsButtons[tabsButtons.length - 1];
      if (cible === null) return;
      evt.preventDefault();
      cible.focus();
      MM.showTab(cible);
    };
  });
  document.getElementById("btnaccueil").onclick = function (element) {
    MM.showTab(element.target);
  };
  MM.checkValues();
  MM.initializeAlea(Date());
  MM.setSeed();
  MM.setFontType();
  MM.content = library.openContents();
  MM.createTuiles();
  // création des tuiles des niveaux
  MM.createSearchCheckboxes();
  // put the good default selected
  document.getElementById("chooseParamType").value = "paramsdiapo";
  // aligne la tuile cochée et la barre d'actions sur ce défaut
  MM.showParameters("paramsdiapo");
  // Liste des formats produits, construite depuis le sélecteur de l'onglet
  // Paramétrer : une seule source, pas de liste à tenir à jour en double.
  const listeFormats = document.getElementById("liste-formats");
  document.querySelectorAll("#chooseParamType option").forEach((option) => {
    listeFormats.appendChild(
      utils.create("li", { innerHTML: option.textContent }),
    );
  });
  // Recherche depuis l'accueil : le champ de l'onglet Rechercher reste le
  // seul moteur, on lui passe la main dès le 3e caractère pour que la suite
  // de la frappe se fasse là où s'affichent les résultats.
  const rechercheAccueil = document.getElementById("recherche-accueil");
  rechercheAccueil.oninput = () => {
    const saisie = rechercheAccueil.value;
    if (saisie.length < 3) return;
    const champ = document.getElementById("searchinput");
    champ.value = saisie;
    rechercheAccueil.value = "";
    library.displayContent(saisie);
    champ.focus();
    champ.setSelectionRange(saisie.length, saisie.length);
  };
  // l'accueil est l'onglet ouvert au démarrage : son bouton doit le refléter
  MM.showTab("tab-accueil");
  // check if parameters from URL
  MM.checkURL();
  if (MM.embededIn) {
    window.parent.postMessage(
      { url: window.location.href, ready: "ok" },
      MM.embededIn,
    );
  }
  sound.getPlayer();
  // to show de good checked display
  MM.setDispositionEnonce(utils.getRadioChecked("Enonces"));
  // Historique : le mod construit et gère tout l'onglet. Les deux actions qui
  // touchent aux paniers vivants lui sont passées en rappels, pour qu'il n'ait
  // pas à importer MM.js (cycle d'import).
  historique.monter(document.getElementById("tab-historique"), {
    onEditer: (url) => MM.checkURL(url, false, true),
    onPanier: (url) => MM.addAsCarts(url),
    onPanierCourant: (url) => MM.addToCurrentCart(url),
    onConfigurerNuage: () => historiqueNuage.ouvrirConfig(),
    onSynchroniser: () => historiqueNuage.synchroniserEtRafraichir(),
  });
  // Synchro nuage active mais pas encore poussée depuis les derniers
  // changements locaux : proposée ici plutôt que lancée seule, un mot de
  // passe non retenu (poste partagé) ferait sinon échouer une synchro
  // automatique à chaque ouverture, silencieusement pour l'utilisateur.
  historiqueNuage.proposerSynchro();
  // Même logique en sortie : fermer l'onglet sans avoir synchronisé laisse
  // les autres postes ignorer les derniers changements tant qu'aucun d'eux
  // ne resynchronise. Un beforeunload natif est le seul moyen fiable
  // d'avertir avant la fermeture réelle (un simple message ne suffirait pas,
  // signaler() ne bloque rien).
  window.addEventListener("beforeunload", (evt) => {
    if (!historiqueNuage.nonSynchronise()) return;
    evt.preventDefault();
    evt.returnValue = "";
  });
  // L'historique était chargé sans jamais être proposé : il fallait penser à
  // ouvrir l'onglet pour retrouver la séance de la veille. Les trois dernières
  // deviennent des raccourcis sur l'accueil.
  const listeReprise = document.getElementById("liste-reprise");
  if (listeReprise !== null) {
    historique
      .charger()
      .slice(0, 3)
      .forEach((entree) => {
        const typeInfo = TYPES[entree.type] || TYPES.inconnu;
        const libelleType = `${typeInfo.emoji} ${typeInfo.libelle}`;
        const dateEntree = new Date(entree.modifie).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        });
        const bouton = utils.create("button", {
          type: "button",
          className: "btn-plain",
          title: "Rouvrir cette sélection dans Paramétrer",
          textContent: `${libelleType} (${dateEntree}) ${entree.titre}`,
        });
        bouton.onclick = () => MM.checkURL(entree.url, false, true);
        const item = utils.create("li");
        item.appendChild(bouton);
        listeReprise.appendChild(item);
      });
    if (listeReprise.hasChildNodes())
      document.getElementById("reprise").classList.remove("hidden");
  }
  // ajout des pickers de colors
  for (let i = 0; i < 4; i++) {
    let leparent = document.getElementById("sddiv" + (i + 1));
    MM.colorSelectors[i] = new Picker({ parent: leparent, color: "#FFFFFF" });
    MM.colorSelectors[i].onChange = function (color) {
      leparent.style.background = color.rgbaString;
      MM.colors[i] = color.rgbaString;
    };
  }
  document.querySelector("input[name='online'][value='no']").checked = true;
  // events sur les boutons
  // open Menu sur smartphone
  const openMenuButton = document.getElementById("openMenuButton");
  openMenuButton.onclick = () => {
    document
      .getElementById("nav-menu-niveaux")
      .classList.toggle("hidden-phone");
    document.getElementById("header-menu").classList.toggle("hidden-phone");
    // croix animée du bouton et état annoncé aux lecteurs d'écran
    const ouvert = openMenuButton.classList.toggle("change");
    openMenuButton.setAttribute("aria-expanded", ouvert);
    openMenuButton.setAttribute(
      "aria-label",
      ouvert ? "Masquer le menu" : "Afficher le menu",
    );
  };
  // fermeture de tous les sous-menus de niveaux
  const fermerSousMenus = () => {
    document
      .querySelectorAll("#nav-menu-niveaux > ul > li > ul")
      .forEach((elem) => {
        elem.classList.remove("show");
      });
    document
      .querySelectorAll("#nav-menu-niveaux > ul > li > button")
      .forEach((elem) => {
        elem.setAttribute("aria-expanded", "false");
      });
  };
  document
    .querySelectorAll("#nav-menu-niveaux > ul > li > button")
    .forEach((el) => {
      el.onclick = () => {
        const dejaOuvert = el.getAttribute("aria-expanded") === "true";
        fermerSousMenus();
        if (!dejaOuvert) {
          el.parentNode.querySelector("ul").classList.add("show");
          el.setAttribute("aria-expanded", "true");
        }
      };
    });
  // menus
  const boutonsNiveaux = document.querySelectorAll(
    "#nav-menu-niveaux li li button",
  );
  for (const bouton of boutonsNiveaux) {
    bouton.onclick = () => {
      MM.cocherNiveauRecherche(bouton.dataset.niv);
      library.displayContent(bouton.dataset.niv, true);
      MM.setHistory(
        "MathsMentales niveau " + bouton.innerHTML,
        "n=" + bouton.dataset.niv,
      );
      fermerSousMenus();
    };
  }
  // Les sous-menus s'ouvrent au clic, y compris là où le survol fonctionne :
  // sans cela ils resteraient ouverts une fois le pointeur parti.
  document.addEventListener("click", (evt) => {
    if (!evt.target.closest("#nav-menu-niveaux")) fermerSousMenus();
  });
  document.addEventListener("keydown", (evt) => {
    if (evt.key === "Escape") fermerSousMenus();
  });
  // bouton de choix direct d'activité
  document.getElementById("activityDirectID").onkeyup = (evt) => {
    // si la toucne est enter
    if (evt.key === "Enter") {
      if (!MM.loadActivity(evt.target.value)) {
        document.getElementById("activityOptions").innerHTML =
          "<br>Activité <b>" + evt.target.value + "</b> non trouvée";
      }
    }
  };
  // ouvrons l'interface des paniers pour que tout le monde sache qu'il y en a !
  MM.showCartInterface();
  // boutons de gestion d'activité dans le panier
  document.getElementById("addToCart").onclick = () => {
    MM.addToCart();
  };
  document.getElementById("unlinkCart").onclick = () => {
    MM.unlinkActivity();
  };
  document.getElementById("removeFromCart").onclick = () => {
    MM.removeFromCart();
  };
  document.getElementById("tempo-slider").oninput = (evt) => {
    if (evt.target.value < 2) evt.target.value = 0;
    MM.changeTempoValue(evt.target.value);
  };
  document.getElementById("tempo-slider").onchange = () => {
    MM.carts[MM.selectedCart].display(MM.carts);
  };
  document.getElementById("nbq-slider").oninput = (evt) => {
    MM.changeNbqValue(evt.target.value);
  };
  document.getElementById("nbq-slider").onchange = () => {
    MM.carts[MM.selectedCart].display(MM.carts);
    MM.refreshQuestionsAndAnswers();
  };
  // radio orientation séparation
  document.getElementById("radiodir1").onclick = () => {
    MM.setDispositionDoubleEnonce("h");
  };
  document.getElementById("radiodir2").onclick = () => {
    MM.setDispositionDoubleEnonce("v");
  };
  // radio intro diaporama
  document.getElementById("radiobeforeslider1").onclick = (evt) => {
    MM.setIntroType(evt.target.value);
  };
  document.getElementById("radiobeforeslider2").onclick = (evt) => {
    MM.setIntroType(evt.target.value);
  };
  document.getElementById("radiobeforeslider3").onclick = (evt) => {
    MM.setIntroType(evt.target.value);
  };
  document.getElementById("playerlist").oninput = (evt) => {
    sound.select(evt.target.value);
  };
  // panier 1
  document.getElementById("btncartclose1").onclick = () => {
    MM.emptyCart(1);
  };
  document.getElementById("titlecart1").onblur = (evt) => {
    MM.carts[0].title = evt.target.innerText;
  };
  document.getElementById("imgordercart1").onclick = (evt) => {
    MM.carts[0].changeOrder(evt.target);
  };
  document.getElementById("progress-cart1").onclick = (evt) => {
    MM.carts[0].changeProgress(evt.target);
  };
  document.getElementById("randomdraw-cart1").onclick = (evt) => {
    MM.carts[0].changeRandomDraw(evt.currentTarget);
  };
  document.getElementById("imgduplicatecart1").onclick = () => {
    if (MM.carts.length < 4) {
      MM.addCart();
      MM.carts[0].duplicate(MM.carts);
    }
  };
  // panier 2
  document.getElementById("btncartdelete2").onclick = () => {
    MM.removeCart(2);
  };
  document.getElementById("btncartclose2").onclick = () => {
    MM.emptyCart(2);
  };
  document.getElementById("titlecart2").onblur = (evt) => {
    MM.carts[1].title = evt.target.innerText;
  };
  document.getElementById("imgordercart2").onclick = (evt) => {
    MM.carts[1].changeOrder(evt.target);
  };
  document.getElementById("progress-cart2").onclick = (evt) => {
    MM.carts[1].changeProgress(evt.target);
  };
  document.getElementById("randomdraw-cart2").onclick = (evt) => {
    MM.carts[1].changeRandomDraw(evt.currentTarget);
  };
  document.getElementById("imgduplicatecart2").onclick = () => {
    if (MM.carts.length < 4) {
      MM.addCart();
      MM.carts[1].duplicate(MM.carts);
    }
  };
  // panier 3
  document.getElementById("btncartdelete3").onclick = () => {
    MM.removeCart(3);
  };
  document.getElementById("btncartclose3").onclick = () => {
    MM.emptyCart(3);
  };
  document.getElementById("titlecart3").onblur = (evt) => {
    MM.carts[2].title = evt.target.innerText;
  };
  document.getElementById("imgordercart3").onclick = (evt) => {
    MM.carts[2].changeOrder(evt.target);
  };
  document.getElementById("progress-cart3").onclick = (evt) => {
    MM.carts[2].changeProgress(evt.target);
  };
  document.getElementById("randomdraw-cart3").onclick = (evt) => {
    MM.carts[2].changeRandomDraw(evt.currentTarget);
  };
  document.getElementById("imgduplicatecart3").onclick = () => {
    if (MM.carts.length < 4) {
      MM.addCart();
      MM.carts[2].duplicate(MM.carts);
    }
  };
  // panier 4
  document.getElementById("btncartdelete4").onclick = () => {
    MM.removeCart(4);
  };
  document.getElementById("btncartclose4").onclick = () => {
    MM.emptyCart(4);
  };
  document.getElementById("titlecart4").onblur = (evt) => {
    MM.carts[3].title = evt.target.innerText;
  };
  document.getElementById("progress-cart4").onclick = (evt) => {
    MM.carts[3].changeProgress(evt.target);
  };
  document.getElementById("imgordercart4").onclick = (evt) => {
    MM.carts[3].changeOrder(evt.target);
  };
  document.getElementById("randomdraw-cart4").onclick = (evt) => {
    MM.carts[3].changeRandomDraw(evt.currentTarget);
  };
  // radio online
  document.getElementById("radioonline1").onclick = (evt) => {
    MM.setOnlineState(evt.target.value);
  };
  document.getElementById("radioonline2").onclick = (evt) => {
    MM.setOnlineState(evt.target.value);
  };
  // radio nb d'énoncés
  document.getElementById("radionbenonces1").onclick = () => {
    MM.setDispositionEnonce(1);
    MM.refreshQuestionsAndAnswers();
  };
  document.getElementById("radionbenonces2").onclick = () => {
    MM.setDispositionEnonce(2);
    MM.refreshQuestionsAndAnswers();
  };
  document.getElementById("radionbenonces3").onclick = () => {
    MM.setDispositionEnonce(3);
    MM.refreshQuestionsAndAnswers();
  };
  document.getElementById("radionbenonces4").onclick = () => {
    MM.setDispositionEnonce(4);
    MM.refreshQuestionsAndAnswers();
  };
  // radio face to face
  document.getElementById("radioftf1").onclick = () => {
    MM.setFacetoFace("n");
  };
  document.getElementById("radioftf2").onclick = () => {
    MM.setFacetoFace("y");
  };
  // radio fin de diaporama
  document.getElementById("radioendslider1").onclick = (evt) => {
    MM.setEndType(evt.target.value);
  };
  document.getElementById("radioendslider2").onclick = (evt) => {
    MM.setEndType(evt.target.value);
  };
  document.getElementById("radioendslider3").onclick = (evt) => {
    MM.setEndType(evt.target.value);
  };
  // radio audio
  MM.speech = new speech();
  if (MM.speech.exists) {
    document.getElementById("radioaudioon").onclick = (evt) => {
      MM.setAudio(evt.target.value);
    };
    document.getElementById("radioaudiooff").onclick = (evt) => {
      MM.setAudio(evt.target.value);
    };
    document.getElementById("audiorepeat").oninput = (evt) => {
      MM.setAudioRepetitions(evt.target.value);
    };
    let select = document.getElementById("selectVoice");
    if (!MM.speech.generateSelectOptions(select)) {
      // création d'un bouton de génération car obligation d'interagir avec le navigateur pour générer
      let button = utils.create("button", {
        innerHTML: "🎶",
        title: "Cliquer pour détecter les langues disponibles",
      });
      button.onclick = (evt) => {
        MM.speech.generateSelectOptions(select);
        evt.target.parentNode.removeChild(evt.target);
      };
      document.getElementById("voix").appendChild(button);
    }
    select.onchange = (ev) => {
      MM.speech.setVoice(ev.target.value);
      MM.audioSamples.forEach((val) => {
        MM.speech.speak(val, false);
      });
    };
    document.getElementById("btntestreader").onclick = () => {
      if (!select.hasChildNodes()) {
        MM.speech.initialize();
        MM.speech;
      }
      MM.audioSamples.forEach((val) => {
        MM.speech.speak(val, false);
      });
    };
    document.getElementById("btnstopreader").onclick = () => {
      MM.speech.stop();
    };
  }
  // lien direct items Brevet 3e
  document.getElementById("liendirectitems3e").onclick = (e) => {
    e.preventDefault();
    MM.setHistory("MathsMentales items Brevet 2026", "n=i3");
    MM.showTab("tab-chercher");
    MM.loadFromServer("brevet-2025.html");
  };
  // boutons démarrage
  document.getElementById("btnstart").onclick = () => {
    MM.start();
  };
  document.getElementById("btnadresse").onclick = () => {
    MM.copyURL("diaporama");
  };
  document.getElementById("btncopytohistoric").onclick = () => {
    MM.copyURLtoHistory("diaporama");
  };
  // bouton d'inclusion de la variable aléatoire
  document.getElementById("aleaInURL").onchange = () => {
    MM.setSeed("checkSwitched");
  };
  document.getElementById("fontType").onchange = () => {
    MM.setFontType();
  };
  // boutons génération documents
  document.getElementById("chooseParamType").onchange = (evt) => {
    MM.showParameters(evt.target.value);
  };
  // tuiles → showParameters, qui resynchronise le select et la barre d'actions
  document.getElementById("param-type-choix").addEventListener("change", (evt) => {
    if (evt.target.name !== "paramtype") return;
    MM.showParameters(evt.target.value);
    MM.enregistrerParams();
  });
  document.getElementById("barre-action-principale").onclick = () =>
    MM.declencherActionType("principal");
  document.getElementById("barre-action-adresse").onclick = () =>
    MM.declencherActionType("adresse");
  document.getElementById("barre-action-historique").onclick = () =>
    MM.declencherActionType("historique");
  // document LibreOffice
  document.getElementById("btngeneratedoc").onclick = () => {
    MM.createODTDoc();
  };
  document.getElementById("btn-doc-adresse").onclick = () => {
    MM.copyURL("docLOOO");
  };
  document.getElementById("btn-doc-copytohistoric").onclick = () => {
    MM.copyURLtoHistory("docLOOO");
  };
  // fiche d'exercices
  document.getElementById("btngeneratesheet").onclick = () => {
    MM.createExercicesSheet();
  };
  document.getElementById("btn-ex-adresse").onclick = () => {
    MM.copyURL("exosheet");
  };
  document.getElementById("btn-ex-copytohistoric").onclick = () => {
    MM.copyURLtoHistory("exosheet");
  };
  document.getElementById("extitle").oninput = (evt) => {
    MM.carts[0].title = evt.target.value;
  };
  // interros
  document.getElementById("btngenerateexams").onclick = () => {
    MM.createExamSheet();
  };
  document.getElementById("btn-exam-adresse").onclick = () => {
    MM.copyURL("exam");
  };
  document.getElementById("btn-exam-copytohistoric").onclick = () => {
    MM.copyURLtoHistory("exam");
  };
  document.getElementById("inttitle").oninput = (evt) => {
    MM.carts[0].title = evt.target.value;
  };
  // ceintures
  document.getElementById("ceintcolsval").oninput = (evt) => {
    document.getElementById("ceintcols").innerHTML = evt.target.value;
    utils.createCeintureTitres(evt.target.value);
  };
  document.getElementById("ceintrowsval").oninput = (evt) => {
    document.getElementById("ceintrows").innerHTML = evt.target.value;
  };
  document.getElementById("ceintqtyvalue").oninput = (evt) => {
    document.getElementById("ceintqty").innerHTML = evt.target.value;
  };
  document.getElementById("btngenerateceinture").onclick = () => {
    MM.createCeintureSheet();
  };
  document.getElementById("btn-ceinture-adresse").onclick = () => {
    MM.copyURL("ceinture");
  };
  document.getElementById("btn-ceinture-copytohistoric").onclick = () => {
    MM.copyURLtoHistory("ceinture");
  };
  document.getElementById("ceinttitle").oninput = (evt) => {
    MM.carts[0].title = evt.target.value;
  };
  // course au nombres
  document.getElementById("canqtyvalue").oninput = (evt) => {
    document.getElementById("canqty").innerHTML = evt.target.value;
  };
  document.getElementById("btn-can-adresse").onclick = () => {
    MM.copyURL("cansheet");
  };
  document.getElementById("btn-can-copytohistoric").onclick = () => {
    MM.copyURLtoHistory("cansheet");
  };
  document.getElementById("btngenerateCAN").onclick = () => {
    MM.createCourseAuxNombres();
  };
  document.getElementById("cantitle").oninput = (evt) => {
    MM.carts[0].title = evt.target.value;
  };
  // flash cards
  document.getElementById("btngenerateFC").onclick = () => {
    MM.createFlashCards();
  };
  document.getElementById("btn-flash-adresse").onclick = () => {
    MM.copyURL("cartesflash");
  };
  document.getElementById("btn-flash-copytohistoric").onclick = () => {
    MM.copyURLtoHistory("cartesflash");
  };
  // fiches memo
  document.getElementById("btngenerateFM").onclick = () => {
    MM.createFicheMemo();
  };
  document.getElementById("btn-memo-adresse").onclick = () => {
    MM.copyURL("fichememo");
  };
  document.getElementById("btn-memo-copytohistoric").onclick = () => {
    MM.copyURLtoHistory("fichememo");
  };
  // Panneau d'activités
  document.getElementById("btngenerateWall").onclick = () => {
    MM.createWall();
  };
  document.getElementById("btn-wall-adresse").onclick = () => {
    MM.copyURL("wall");
  };
  document.getElementById("btn-wall-copytohistoric").onclick = () => {
    MM.copyURLtoHistory("wall");
  };
  // j'ai / qui a ?
  document.getElementById("btngenerateWG").onclick = () => {
    MM.createWhoGots();
  };
  document.getElementById("cardsNbValue").oninput = (evt) => {
    document.getElementById("cardsNb").innerHTML = evt.target.value;
  };
  document.getElementById("btn-wg-adresse").onclick = () => {
    MM.copyURL("whogots");
  };
  document.getElementById("btn-wg-copytohistoric").onclick = () => {
    MM.copyURLtoHistory("whogots");
  };
  // dominos
  document.getElementById("dominosNbValue").oninput = (evt) => {
    document.getElementById("dominosNb").innerHTML = evt.target.value;
  };
  document.getElementById("dominosDoublons").onclick = (evt) => {
    let text = document.getElementById("dominosDoublonsText");
    if (evt.target.checked) text.innerHTML = "Oui";
    else text.innerHTML = "Non";
  };
  document.getElementById("dominosDoublons").checked = true;
  document.getElementById("WGDoublons").onclick = (evt) => {
    let text = document.getElementById("WGDoublonsText");
    if (evt.target.checked) text.innerHTML = "Oui";
    else text.innerHTML = "Non";
  };
  document.getElementById("btngenerateDominos").onclick = () => {
    MM.createDominos();
  };
  document.getElementById("btn-dominos-adresse").onclick = () => {
    MM.copyURL("dominos");
  };
  document.getElementById("btn-dominos-copytohistoric").onclick = () => {
    MM.copyURLtoHistory("dominos");
  };
  // puzzles
  document.getElementById("btngeneratePuzzle").onclick = () => {
    MM.createPuzzle();
  };
  document.getElementById("btn-puzzle-adresse").onclick = () => {
    MM.copyURL("puzzle");
  };
  document.getElementById("btn-puzzle-copytohistoric").onclick = () => {
    MM.copyURLtoHistory("puzzle");
  };
  // associations
  document.getElementById("assocsChronoYes").onclick = () => {
    MM.setAssocsChrono();
  };
  document.getElementById("btngenerateAssoc").onclick = () => {
    MM.createAssocGame();
  };
  document.getElementById("btn-assoc-adresse").onclick = () => {
    MM.copyURL("assoc");
  };
  document.getElementById("btn-assoc-copytohistoric").onclick = () => {
    MM.copyURLtoHistory("assoc");
  };
  // duels
  document.getElementById("btn-duel-start").onclick = () => {
    MM.duelLaunch();
  };
  document.getElementById("btn-duel-adresse").onclick = () => {
    MM.copyURL("duel");
  };
  document.getElementById("btn-duel-copytohistoric").onclick = () => {
    MM.copyURLtoHistory("duel");
  };
  document.getElementById("duelbackgroundselect").onchange = (evt) => {
    document.getElementById("duelbg").style.backgroundImage =
      "url('./library/illustrations/backgrounds/bg" +
      evt.target.value +
      ".jpg')";
  };
  document.getElementById("duelbg").style.backgroundImage =
    "url('./library/illustrations/backgrounds/bg" +
    utils.getSelectValue("duelbackgroundselect") +
    ".jpg')";
  // boutons d'exemples
  document
    .getElementById("btn-annotation2")
    .addEventListener("click", (evt) => {
      let target = utils.getTargetWithImageInside(evt);
      MM.annotateThisThing("divparams", target.id);
    });
  document.getElementById("btn-shuffle").onclick = () => {
    MM.editedActivity.display("sample", MM);
  };
  // boutons section énoncés
  document.getElementById("btn-annotation-enonce").onclick = (evt) => {
    let target = utils.getTargetWithImageInside(evt);
    MM.annotateThisThing("enonce-content", target.id);
  };
  // zooms
  document.getElementById("enonce-content").onclick = (evt) => {
    if (evt.target.dataset.what === "in") {
      MM.zooms[evt.target.dataset.zoom].plus();
    } else if (evt.target.dataset.what === "out") {
      MM.zooms[evt.target.dataset.zoom].minus();
    }
  };
  document.getElementById("corrige-content").onclick = (evt) => {
    if (evt.target.dataset.what === "in") {
      MM.zooms[evt.target.dataset.zoom].plus();
    } else if (evt.target.dataset.what === "out") {
      MM.zooms[evt.target.dataset.zoom].minus();
    } else if (evt.target.innerHTML === "Figure") {
      MM.memory[evt.target.dataset.id].toggle();
    }
  };
  // bouton section Enoncé pour export vers Pixel Art
  document.getElementById("btn-export-enonce-pixelart").onclick = () => {
    // copy value of textarea to clipboard
    navigator.clipboard.writeText(
      document.getElementById("text-export-pixelart").value,
    );
    alert("Copié dans le presse-papiers !");
  };
  document.querySelectorAll(".btntohistoric").forEach((btn) => {
    btn.onclick = () => {
      MM.copyURLtoHistory(
        document.getElementById("chooseParamType").value.substring(6),
      );
    };
  });
  // boutons section corrigés
  document
    .querySelector("#tab-corrige aside")
    .addEventListener("click", (evt) => {
      let target = utils.getTargetWithImageInside(evt);
      switch (target.id) {
        case "btn-annotation-corrige":
          MM.annotateThisThing("corrige-content", target.id);
          break;
        case "btn-restart-otherdata":
          MM.start();
          break;
        case "btn-restart-samedata":
          // the true value force to restart with same datas
          MM.start(true);
          break;
        default:
          break;
      }
    });
  // moteur de recherche d'activité
  let minuteurRecherche;
  document.getElementById("searchinput").onkeyup = (evt) => {
    const searchString = evt.target.value;
    // une frappe chasse la précédente : displayContent parcourt toute la
    // bibliothèque, inutile de le faire à chaque caractère
    clearTimeout(minuteurRecherche);
    // sous 3 caractères displayContent sort sans rien dire : on l'explique
    if (searchString.length > 0 && searchString.length < 3) {
      const manque = 3 - searchString.length;
      document.getElementById("resultat-chercher").innerHTML =
        "<p>Encore " +
        manque +
        " caractère" +
        (manque > 1 ? "s" : "") +
        " : la recherche démarre à 3.</p>";
      return;
    }
    minuteurRecherche = setTimeout(() => {
      // check if filters
      let filters = "";
      const searchFilters = document.querySelectorAll(
        "#searchLevels input:checked",
      );
      if (searchFilters !== null) {
        filters = [...searchFilters].map((e) => e.value).join(",");
      }
      if (searchString.length > 2) {
        MM.setHistory(
          "MathsMentales recherche :" + searchString,
          "search=" + searchString + "&f=" + filters,
        );
      }
      library.displayContent(searchString);
    }, 250);
  };
  document
    .getElementById("resultat-chercher")
    .addEventListener("click", async (evt) => {
      if (evt.target.classList.contains("actitityLink")) {
        await navigator.clipboard.writeText(
          utils.baseURL + "?u=" + evt.target.parentNode.dataset.id,
        );
        evt.target.classList.add("red");
        setTimeout(() => {
          evt.target.classList.remove("red");
        }, 1500);
      } else if (evt.target.type === "checkbox") {
        return;
      } else if (/^rch[123]/.test(evt.target.id)) {
        // titres de l'arbre : niveau (rch1), thème (rch2…), chapitre (rch3…)
        utils.deploy(evt.target);
      } else if (evt.target.id.indexOf("rcli") === 0) {
        // clic sur une activite
        MM.loadActivity(evt.target.dataset.id);
      } else if (evt.target.parentNode.id.indexOf("rcli") === 0) {
        MM.loadActivity(evt.target.parentNode.dataset.id);
      } else if (evt.target.id === "itemsbrevet2026") {
        // ouvrir le lien vers les items du brevet
        MM.loadFromServer("brevet-2025.html");
        MM.setHistory("Exercice", "n=i3");
      } else if (evt.target.id === "items6e2025") {
        // ouvrir le lien vers les items de 6e 2025
        MM.loadFromServer("automatismes-6e.html");
        MM.setHistory("Exercice", "n=i6");
      } else if (evt.target.id === "items5e2026") {
        // ouvrir le lien vers les items de 5e 2026
        MM.loadFromServer("automatismes-5e.html");
        MM.setHistory("Exercice", "n=i5");
      } else if (evt.target.id === "items4e2027") {
        // ouvrir le lien vers les items de 4e 2027
        MM.loadFromServer("automatismes-4e.html");
        MM.setHistory("Exercice", "n=i5");
      }
    });
  // bouton d'ajout au panier
  document.getElementById("btn-addToCart").onclick = () => {
    let selection = document.querySelectorAll(
      "#resultat-chercher .checkitem:checked",
    );
    if (selection.length > 0) {
      let allActivities = [];
      let nbq = Number(document.getElementById("addToCartNbq").value);
      selection.forEach((el) => {
        allActivities.push(library.loadJSON(el.value, MM.version));
      });
      Promise.all(allActivities)
        .then((data) => {
          data.forEach((val) => {
            MM.carts[MM.selectedCart].addActivity(val, nbq);
          });
          let tab = document.querySelector(
            "[numero$='parameters'].tabs-menu-link",
          );
          MM.resetAllTabs();
          utils.addClass(tab, "is-active");
          document.getElementById("tab-parameters").style.display = "";
          MM.refreshQuestionsAndAnswers();
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      console.log("Pas d'activité à ajouter au panier");
    }
  };
  // boutons aléatorisation
  document.getElementById("btn-params-aleakey").onclick = () => {
    MM.setSeed(utils.seedGenerator());
    // on popule les exemples dans les onglets
    MM.refreshQuestionsAndAnswers();
  };
  document.getElementById("btn-params-aleakey-enonces").onclick = () => {
    MM.setSeed(utils.seedGenerator());
    // on popule les exemples dans les onglets
    MM.refreshQuestionsAndAnswers();
  };
  document.getElementById("btn-params-aleakey-corriges").onclick = () => {
    MM.setSeed(utils.seedGenerator());
    // on popule les exemples dans les onglets
    MM.refreshQuestionsAndAnswers();
  };
  /**
   * Comportements sur les éléments fixes
   */
  // évènements sur les activités dans les paniers
  for (let i = 0; i < 4; i++) {
    const liste = document.getElementById("cart" + i + "-list");
    liste.addEventListener("click", (evt) => {
      if (evt.target.dataset.actid !== undefined) {
        MM.editActivity(evt.target.dataset.actid);
      } else if (evt.target.dataset.actidtoremove !== undefined) {
        MM.removeFromCart(evt.target.dataset.actidtoremove);
      } else if (evt.target.dataset.actidmovecopy !== undefined) {
        MM.ouvrirMenuDeplacerCopier(evt.target.dataset.actidmovecopy, evt.target);
      }
    });
    // réglages durée / nombre de questions saisis dans la ligne du panier.
    // « change » plutôt que « input » : on ne régénère pas les questions à
    // chaque frappe, seulement à la validation ou au clic sur les flèches.
    liste.addEventListener("change", (evt) => {
      if (evt.target.dataset.tempoact !== undefined) {
        MM.regleActivite(i, evt.target, "tempo");
      } else if (evt.target.dataset.nbqact !== undefined) {
        MM.regleActivite(i, evt.target, "nbq");
      }
    });
  }
  /**
   * boutons paniers, images contenues dans des button
   */
  document.getElementById("cartsMenu").addEventListener("click", (evt) => {
    let target = utils.getTargetWithImageInside(evt);
    if (target.value) {
      MM.showCart(target.value);
    } else if (target.id === "addcart") {
      MM.addCart();
    }
  });
  /**
   * cases à cocher dans le choix des options d'une activité
   */
  document
    .getElementById("activityOptions")
    .addEventListener("click", (evt) => {
      if (evt.target.id === "chckallopt") {
        MM.editedActivity.setOption("all", evt.target.checked);
      } else if (evt.target.id.indexOf("param-") === 0) {
        MM.editedActivity.setParam(evt.target.value, evt.target.checked);
      } else if (evt.target.id.indexOf("o") === 0) {
        MM.editedActivity.setOption(evt.target.value, evt.target.checked);
      } else if (evt.target.id.indexOf("checkAllOptions") === 0) {
        const toutesOptions = document.querySelectorAll(
          "#activityOptions > span > ul",
        );
        const i = Number(evt.target.value);
        let count = 0;
        toutesOptions.forEach(() => {
          //const input = option.querySelector(`li:nth-of-type(${i+1}) input`)
          //input.checked = evt.target.checked;
          MM.editedActivity.setOption(count + "-" + i, evt.target.checked);
          count++;
        });
      }
      MM.populateQuestionsAndAnswers();
    });
  // L'URL prime toujours sur les réglages mémorisés : dès qu'elle porte
  // quelque chose, MM.checkURL est seul maître de l'état de l'onglet.
  const urlPorteDesParametres =
    window.location.search.length > 1 || window.location.hash.length > 1;
  MM.activerBarreActions();
  if (!urlPorteDesParametres) MM.restaurerParams();
  document
    .getElementById("colparameters")
    .addEventListener("change", (evt) => {
      if (evt.target.name === "radiodocformat" || evt.target.name === "radiodoc")
        MM.majPresentationDoc();
      MM.enregistrerParams();
    });
};
