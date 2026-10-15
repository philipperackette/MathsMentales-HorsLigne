# Parkour MathsMentales — design V2 (éditeur de parcours)

Date : 2026-08-22
Suite de : `docs/superpowers/specs/2026-08-21-parkour-mathsmentales-design.md` (moteur de jeu V1, livré)

## Contexte et objectif

La V1 a livré le moteur de jeu élève et un parcours de démonstration écrit à la
main en JSON. Un professeur qui veut son propre parcours n'a aujourd'hui aucun
outil : il doit rédiger le JSON à la main, y compris l'objet `panier` de chaque
étape, dont le format n'est documenté nulle part côté utilisateur.

Objectif de cette V2 : donner au professeur une page qui construit, vérifie et
diffuse un parcours, sans écrire une ligne de JSON et sans backend.

## Portée V2 (cette spec)

- Nouvelle app `parkoureditor` : création et modification d'un parcours complet
  (titre, thèmes, règles, étapes ordonnées).
- Saisie du contenu d'une étape en collant un lien de partage MathsMentales.
- Vérification réelle du panier (chargement des activités, comptage des
  questions disponibles).
- Diffusion en deux voies : fichier `.json` à héberger, ou lien élève
  auto-suffisant encodant le parcours.
- Règles du jeu (délais, seuil, nombre de questions) réglables par parcours.
- Mod partagé `parkourDef.js` définissant le format, sa validation et son
  encodage, consommé par l'éditeur comme par le jeu.

**Hors scope V2** (inchangé depuis la V1) : bibliothèque d'aide sur échec
répété, parcours 5e/4e/brevet, tout suivi ou tableau de bord professeur, tout
backend. Le jeu reste 100 % autonome côté navigateur.

## Décisions de cadrage

| Question | Décision | Raison |
|---|---|---|
| Saisie du contenu d'une étape | Coller un lien de partage MathsMentales | `utils` sait déjà parser cette URL en objet panier (`src/js/mods/utils.js:838-878`) ; aucun sélecteur d'activités à réécrire, le professeur reste dans l'interface qu'il connaît |
| Diffusion | Fichier `.json` **et** lien base64 | Le fichier suppose un hébergement (ENT, Nextcloud, GitLab raw) que tous n'ont pas ; le lien ne suppose rien mais n'est pas modifiable |
| Vérification | Chargement réel des activités | Un id d'activité erroné doit se voir à l'édition, pas quand un élève joue |
| Règles du jeu | Réglables par parcours | Sans cela, le délai de 12 h entre étapes rend tout usage en une séance impossible |
| Architecture | App dédiée + mod DOM-free partagé | Reprend le découpage V1 (logique pure testée / UI vérifiée à la main) et laisse le bundle élève inchangé |

## Architecture

```
src/parkoureditor.html          page unique de l'éditeur
src/js/lib.parkoureditor.js     UI : en-tête, thèmes, règles, étapes, export
src/css/parkoureditor.css       styles
src/js/mods/parkourDef.js       format : normalize / validate / encode / decode
src/js/mods/parkourDef.test.mjs tests node --test
```

`parkourDef.js` est sans accès au DOM et sert les deux côtés : l'éditeur produit
et valide, le jeu décode et lit les règles. Une seule définition du format, donc
pas de dérive possible entre l'outil et le moteur.

L'éditeur réutilise sans les modifier : `utils.js` (parsing d'URL, helpers DOM),
`cart.js` + `activity.js` (vérification réelle d'un panier), `Sortable` (déjà
vendoré dans `src/js/libs/`).

## Format du parcours V2

Tout ajout est optionnel : les parcours V1 existants, `demo-6e.json` compris, se
chargent sans modification.

```json
{
  "id": "parkour-demo-6e",
  "titre": "Parkour 6e — démo",
  "regles": {
    "delaiDeblocageH": 12,
    "verrouEchecH": 6,
    "tentativesAvantVerrou": 3,
    "seuilReussite": 8,
    "nbQuestions": 10
  },
  "themes": [{ "id": "nombres", "label": "Nombres et calculs" }],
  "etapes": [
    {
      "id": "e01",
      "theme": "nombres",
      "titre": "Écriture décimale",
      "support": "arbre",
      "panier": { "t": "…", "c": "1", "o": "true", "a": { "0": { "i": "6NB1", "t": 8, "n": 10 } } }
    }
  ]
}
```

- `regles` absent ou partiel : les champs manquants prennent les valeurs
  actuelles du moteur (12 h, 6 h, 3 tentatives, seuil 8, 10 questions).
- Les délais sont exprimés en **heures**, en nombre décimal accepté
  (`0.25` = 15 min, `0` = déblocage immédiat pour un usage en une séance). Plus
  lisible qu'une durée en millisecondes pour qui édite le fichier à la main.
- `panier` reste exactement l'objet consommé par `cart.import()`, inchangé
  depuis la V1.

## Mod `parkourDef.js`

| Export | Rôle |
|---|---|
| `DEFAULT_REGLES` | Les constantes actuelles du moteur |
| `normalize(def)` | Complète : règles fusionnées avec les valeurs par défaut, `themes`/`etapes` garantis présents, ids d'étape attribués s'ils manquent |
| `countQuestions(panier)` | Somme des `n` des activités d'un panier, sans rien charger |
| `validate(def)` | Retourne `{ erreurs, avertissements }` — voir ci-dessous |
| `encode(def)` / `decode(str)` | Base64 URL-safe, même technique que `ParkourState.exportCode`/`importCode` |

`parkourDef.js` n'importe rien, comme `parkourState.js`. C'est une contrainte
et non un choix esthétique : `utils.js` importe MathLive, qui échoue au
chargement hors navigateur (`HTMLElement is not defined`), donc tout mod
important `utils` devient intestable au `node --test`.

Conséquence : l'extraction du panier depuis une URL de partage
(`panierFromUrl`, qui a besoin de `utils.getUrlVars`) vit dans
`lib.parkoureditor.js`, pas dans le mod. C'est un adaptateur de quelques
lignes — `utils.getUrlVars(new URL(str)).c` puis premier panier de l'objet —
couvert par la vérification manuelle et non par un test automatisé.

`validate` distingue deux niveaux :

- **Erreurs** (bloquent l'export) : aucune étape ; étape référençant un thème
  inexistant ; panier vide ou absent ; id d'étape ou id de thème dupliqué ;
  `seuilReussite` déclaré supérieur à `nbQuestions` déclaré ; étape dont le
  panier fournit moins de questions que `seuilReussite` (l'étape serait
  impossible à réussir).
- **Avertissements** (n'empêchent pas l'export) : étape dont le panier fournit
  moins de questions que `nbQuestions` mais au moins `seuilReussite` ; thème
  sans aucune étape.

## Interface de l'éditeur

Page unique, quatre blocs empilés, plus un pied de page collant.

**En-tête parcours.** Titre libre ; id slugifié depuis le titre, modifiable.
L'id est la clé `localStorage` de progression des élèves : le modifier après
diffusion remet leur progression à zéro, l'éditeur l'affiche en avertissement.
Boutons *Importer un parcours* (fichier `.json` ou lien collé) et *Nouveau*.

**Thèmes.** Liste éditable de couples label / id auto. Ce sont les barres
d'étoiles de l'accueil du jeu. Suppression refusée si une étape utilise le
thème, avec la liste des étapes concernées.

**Règles.** Bloc repliable, fermé par défaut, cinq champs numériques
pré-remplis aux valeurs par défaut. Fermé, le comportement est celui de la V1 :
le professeur ne rencontre ce bloc que s'il le cherche.

**Étapes.** Liste de cartes réordonnables par glisser-déposer (Sortable) —
l'ordre définit les prérequis. Chaque carte porte :

- titre, thème (select), support (select arbre 🌳 / toit 🏠 / barre 🤸) ;
- un champ « lien MathsMentales » et un bouton *Vérifier* : `panierFromUrl`
  puis `cart.import` réel, affichant les titres des activités chargées et le
  total de questions disponibles, en rouge si ce total est inférieur à
  `nbQuestions` ;
- les boutons *Tester*, *Dupliquer*, *Supprimer*.

*Tester* n'ajoute aucun mode au jeu : il ouvre `parkour.html?d=<base64>` dans un
nouvel onglet, avec un parcours jetable d'une seule étape, d'id
`parkour-test-<horodatage>` et de règle `delaiDeblocageH: 0`. La progression de
test est donc isolée et ne pollue aucun vrai parcours.

**Pied de page collant.** Sortie de `validate()` en direct (erreurs en rouge,
avertissements en orange) et boutons *Télécharger le .json* / *Copier le lien
élève*. L'export est bloqué tant qu'une erreur subsiste.

**Brouillon.** Autosauvegarde dans `localStorage` sous
`parkour-editeur-brouillon`, rechargée à l'ouverture, avec un bouton *Repartir
de zéro*. Évite de tout perdre sur un onglet fermé par accident.

## Impacts sur le jeu

**Chargement (`loadParcours`).** Ordre de priorité : `?d=<base64>` décodé par
`parkourDef.decode` ; sinon `?parcours=<url>` par `fetch` (inchangé) ; sinon la
démo. Le résultat passe par `parkourDef.normalize()` dans tous les cas.

**Taille du lien.** `demo-6e.json` pèse 3 ko, soit environ 4 ko de base64 : sans
problème pour un navigateur, trop long pour un QR code. C'est précisément ce que
couvre la voie « fichier ». Aucune compression n'est introduite.

**Durcissement XSS.** `renderThemes()` et le rendu des étapes injectent
aujourd'hui titres et labels via `innerHTML` (`src/js/lib.parkour.js:58-67`). En
V1 le risque restait théorique. Avec un lien auto-suffisant qu'un élève peut
recevoir de n'importe qui, un parcours forgé peut injecter du HTML ou du script
dans la page du jeu. Correctif inclus dans ce lot : titres de parcours, labels
de thèmes et titres d'étapes rendus en `textContent`. Les énoncés d'activités
continuent d'utiliser `innerHTML` — ils viennent de la bibliothèque et portent
du LaTeX, c'est un autre chemin de confiance.

**`parkourState.js`.** Le constructeur lit ses paramètres depuis
`parkourDef.normalize(parcoursDef).regles` ; les constantes de module deviennent
les valeurs par défaut portées par le mod. `getStatus`, `recordAttempt` et
`computeScore` s'appuient sur `this.regles`.

**`lib.parkour.js`.** Suppression de `UNLOCK_DELAY_MS` (ligne 26) et de
`MAX_ETAPE_SCORE` (ligne 28), dupliqués et faux dès que les règles changent ;
recalcul depuis `parkourState.regles`. Même traitement pour les libellés
« / 10 bonnes réponses » et « / 250 » affichés en fin d'étape.

**Nombre de questions jouées.** Aujourd'hui l'étape joue *toutes* les questions
que le panier produit ; le compte de 10 vient de ce que la démo demande `n=10`.
`nbQuestions` devenant une règle, `startEtape` tire au sort puis tronque à
`regles.nbQuestions`, et `tempsPrevu` n'additionne plus que les questions
retenues.

**Build.** Ajout de `"parkoureditor"` au tableau `builds` de `gulpfile.cjs`. Le
script `test` couvrant déjà `src/js/mods/*.test.mjs`, `parkourDef.test.mjs` est
pris automatiquement.

**Cohérence des règles.** `nbQuestions` et `seuilReussite` ne sont pas deux
champs indépendants : un `seuilReussite` supérieur au `nbQuestions` déclaré
rend l'étape mathématiquement impossible à réussir. `normalize()` borne
défensivement les deux (entiers ≥ 1, `seuilReussite` plafonné à
`nbQuestions`), y compris pour un parcours reçu par `?d=` sans passer par
l'éditeur ; `validate()` élève cette incohérence — comme un panier fournissant
moins de questions que `seuilReussite` — au rang d'erreur bloquant l'export,
pour que le professeur la voie avant de diffuser plutôt que de la découvrir
via des élèves verrouillés sur une étape injouable.

**Risque résiduel assumé : progression écrasée par réutilisation d'id.**
`ParkourState.save()` écrit l'objet de progression complet sous la clé
`parkour-progress-<id>` ; `load()` ne fusionne que les étapes de la définition
courante avec ce qui est stocké. Un lien `?d=` forgé qui déclare l'id d'un
vrai parcours existant, mais avec une seule étape (ou des étapes différentes),
écrase donc silencieusement la progression déjà enregistrée sous cet id pour
les autres étapes. Il n'y a pas de correctif simple : l'id doit rester stable
d'une diffusion à l'autre pour que l'élève retrouve sa progression, ce qui est
précisément ce qui rend l'id falsifiable. Le vecteur préexistait déjà avec
`?parcours=<url>` en V1 (une URL peut tout aussi bien répondre avec un
parcours de même id mais de contenu différent) ; c'est le prix assumé de
l'absence de backend — aucune autorité ne peut confirmer qu'un id appartient
à qui prétend le diffuser. Ce risque n'est pas corrigé dans ce lot.

## Tests

Stratégie identique à la V1 : logique pure testée au `node --test`, UI vérifiée
à la main dans le navigateur. Aucun runner DOM n'est introduit.

`src/js/mods/parkourDef.test.mjs` :

- `normalize` : règles absentes → valeurs par défaut ; règles partielles →
  fusion ; `nbQuestions`/`seuilReussite` bornés (entiers ≥ 1, seuil plafonné au
  nombre de questions) ; ids d'étape manquants → attribués, ids existants
  préservés (ce sont les clés de progression des élèves) ; `demo-6e.json`
  normalisé sans perte de contenu.
- `validate` : détecte thème inexistant, panier vide, id d'étape ou de thème
  dupliqué, parcours sans étape, `seuilReussite` déclaré supérieur à
  `nbQuestions` déclaré ; bloque (n'avertit plus) un panier plus petit que
  `seuilReussite` ; avertit sur un panier sous-dimensionné mais suffisant pour
  réussir.
- `encode`/`decode` : aller-retour fidèle, accents et apostrophes préservés,
  chaîne corrompue → erreur explicite.

Ajouts à `src/js/mods/parkourState.test.mjs` : délai 0 rendant l'étape suivante
immédiatement disponible ; seuil de réussite et `nbQuestions` personnalisés. Les
22 tests existants doivent rester verts sans modification.

Vérifications manuelles : créer un parcours de deux étapes de bout en bout,
l'exporter en fichier puis en lien, rejouer les deux, réimporter le fichier dans
l'éditeur, réordonner les étapes, et vérifier qu'un titre contenant `<script>`
s'affiche littéralement dans le jeu.

## Découpage prévisionnel

1. `parkourDef` : format, `normalize`, `validate`.
2. `encode` / `decode`.
3. Règles lues par `parkourState`.
4. `?d=` et durcissement `textContent` côté jeu.
5. Squelette de l'éditeur : en-tête, thèmes, règles.
6. Cartes d'étapes : vérification du panier, réordonnancement.
7. Export fichier et lien, brouillon, *Tester*.
8. Vérification manuelle complète.

Les tâches 1 à 4 ont de la valeur seules : le jeu accepte les liens
auto-suffisants et les règles personnalisées avant que la moindre ligne d'UI
d'éditeur soit écrite.
