# Parkour MathsMentales — design V1 (moteur de jeu)

Statut : proposé, en attente de revue.
Source idée : `/home/sebc/Documents/MathsMentales/Gamification automatismes avec MathsMentales`.

## Contexte et objectif

Gamifier le travail des automatismes (`src/automatismes-6e.html`) avec un mode
en ligne autocorrigé, pour donner envie à un collégien d'y revenir. Nom du
jeu : **Parkour MathsMentales**. L'élève avance de support en support (arbre,
toit, barre...) sur un parcours de notions à difficulté progressive, mixant
numérique et géométrie.

## Portée V1 (cette spec)

- Moteur de jeu jouable côté élève : nouvel app `parkour`.
- Un parcours de démonstration réduit (~12 étapes) livré avec le code,
  écrit à la main en JSON.
- Stockage de progression 100% navigateur (localStorage), avec export/import
  d'un code de sauvegarde pour changer d'appareil.

**Hors scope V1** (différé, conforme à l'idée d'origine et aux échanges de
cadrage) :
- Éditeur de parcours pour le professeur (génère les fichiers parcours) — V2.
- Bibliothèque d'aide / obstacle de secours en cas d'échec répété sur une
  notion — Futur, déjà noté comme "bibliothèque à construire" dans l'idée
  d'origine.
- Parcours 5e / 4e / brevet — Futur, mentionné dans l'idée d'origine.
- Tout suivi/tableau de bord professeur, tout backend — explicitement exclu :
  le jeu reste 100% autonome côté élève, cohérent avec le site actuel
  (statique, GitLab Pages, aucun serveur applicatif).

## Architecture

Nouvel entrypoint, suivant la convention multi-entrypoint du repo (un app =
un HTML + un `lib.<module>.js`, logique partagée dans `mods/`) :

- `src/parkour.html` — page unique (accueil + jeu, état géré en JS, pas de
  navigation multi-pages).
- `src/js/lib.parkour.js` — rendu, boucle de jeu, câblage événements.
  Ajouté au tableau `builds` de `gulpfile.cjs`.
- `src/js/mods/parkourState.js` — nouveau mod **sans DOM** : classe
  `ParkourState` qui porte toute la logique de progression (statuts,
  tentatives, timers, score, étoiles, sérialisation localStorage,
  encodage/décodage du code de sauvegarde). Isolé et testable indépendamment
  du rendu, sur le modèle de la séparation déjà en place entre `cart.js`
  (données) et `lib.ceinture.js` (UI).
- `src/css/parkour.css` — un stylesheet par app, comme le reste.

Réutilisation du code partagé existant, aucune modification requise dessus :
- `activity.js` — génération des questions/réponses (déjà utilisé partout).
- `keyboard.js` + `analysereponse.js` — saisie clavier virtuel et correction
  autogradée, pattern déjà en place dans `duel.js` (seul autre mode 1
  question à la fois avec saisie corrigée en ligne).
- `cart.js` — une étape de parcours embarque un panier au format
  `cart.export()`/`import()` existant : aucun nouveau format d'activités à
  inventer, `library.js`/`activity.js` savent déjà le lire.

Approches écartées (voir échange de cadrage) : étendre `wall.js` (flashcards
autocorrigées, pas de saisie — mauvais fit) ou piloter depuis `diaporama.js`
(déjà gros, coupler un mode jeu dessus fragiliserait l'existant pour un gain
de partage faible, `analysereponse.js` étant déjà un mod partagé accessible
directement).

## Format du fichier parcours

JSON, récupéré par `fetch` (mirroring le pattern de `library.js`) :

```json
{
  "id": "parkour-demo-6e",
  "titre": "Parkour 6e",
  "themes": [
    { "id": "nombres", "label": "Nombres et calculs" },
    { "id": "geometrie", "label": "Géométrie" }
  ],
  "etapes": [
    {
      "id": "e01",
      "theme": "nombres",
      "titre": "Écriture décimale",
      "support": "arbre",
      "panier": { "t": "...", "c": "1", "o": "true", "a": { "0": "..." } }
    }
  ]
}
```

- `panier` = exactement l'objet que `cart.import(obj, ...)` consomme
  aujourd'hui (mêmes clés `t`/`c`/`o`/`a`/...). Une étape doit contenir assez
  d'activités/options pour tirer 10 questions.
- `theme` posé explicitement par étape (pas dérivé de `dest` des activités,
  qui peut être multi-chapitre) — garde le moteur simple.
- Parcours par défaut chargé depuis `public/parkour/demo-6e.json` ; un
  paramètre `?parcours=<url>` permet de charger un parcours externe
  générique (fichier hébergé ailleurs — mathsmentales, raw gitlab, nextcloud,
  etc.), comme demandé dans l'idée d'origine.

## Boucle de jeu (une étape = 10 questions)

Pour chaque étape jouée :
1. `ParkourState` tire/instancie les activités du panier via `activity.js`
   (comme `duel.js`/`diaporama.js`), génère 10 questions.
2. Une question affichée à la fois. Saisie via `keyboard.js`, correction via
   `analyseReponse` (même pattern que `duel.js`). Pas de minuteur bloquant ni
   d'avancement automatique — l'élève répond à son rythme, mais le temps est
   mesuré.
3. Pour chaque question : `t_debut = Date.now()` à l'affichage, `t_fin` à la
   validation de la réponse. `tempsReel += (t_fin - t_debut)/1000`.
   `tempsPrevu` = somme des `activity.tempo` des 10 questions tirées (champ
   déjà existant, déjà utilisé ainsi dans `lib.diaporama.js` via
   `totaltimes`).

### Score (sur 250)

- **Base** : 20 points par bonne réponse, 10 questions → 200 points max.
- **Bonus temps** : 50 points max, obtenu si `tempsReel ≤ 0.5 × tempsPrevu`.
  Dégressif linéaire entre 50% et 100% du temps prévu, 0 au-delà :

  ```
  ratio = tempsReel / tempsPrevu
  bonus = 50                          si ratio ≤ 0.5
  bonus = 0                           si ratio ≥ 1
  bonus = 50 × (1 - ratio) / 0.5      sinon
  ```

- **Score total** = base + bonus, affiché en fin d'étape, sur 250.
- `ParkourState` garde le **meilleur score** par étape (les étapes sont
  rejouables à volonté une fois passées) — sert de motivation à rejouer,
  affiché sur la carte de l'étape.

### Condition de réussite (déblocage) — hypothèse à valider

Le déblocage de l'étape suivante reste conditionné à la **justesse**, pas au
score global : **≥ 8 bonnes réponses sur 10** (indépendant du bonus temps).
Raison : mélanger vitesse et déblocage risquerait de laisser passer un élève
rapide mais peu sûr. Le score sur 250 est un indicateur de performance/rejeu,
pas une porte. À confirmer ou ajuster à la revue de cette spec.

### Tentatives et verrous temporels

États d'une étape :
- `LOCKED_PREREQ` — étape précédente pas encore réussie.
- `LOCKED_TIMER` — précédente réussie mais délai de 12h pas écoulé
  (`unlockAt = passedAt_precedente + 12h`). Ce délai ne s'applique qu'au
  **premier** déblocage d'une étape, jamais à un rejeu d'étape déjà passée.
- `LOCKED_FAIL` — 3 tentatives consécutives sans atteindre 8/10 sur cette
  étape → `lockedUntil = now + 6h`, compteur de tentatives remis à 0 après
  déblocage.
- `AVAILABLE` — jouable maintenant.
- `PASSED` — déjà réussie, rejouable librement à tout moment (nouvelles
  données aléatoires à chaque partie via `activity.generate()`).

## Étoiles par thème

Par thème : `étoiles = nombre d'étapes PASSED du thème / nombre total
d'étapes du thème`, affiché en barre/étoiles qui se remplit. Ne dépend pas du
score, seulement du statut passé/pas passé — reste lisible même si un élève
rejoue une étape avec un score plus bas une fois.

## Stockage et code de sauvegarde

- Clé localStorage : `parkour-progress-<parcoursId>` (id du fichier parcours,
  pour ne pas mélanger deux parcours différents sur le même navigateur).
- Contenu : par étape — statut, `passedAt`, `attemptsInWindow`,
  `lockedUntil`/`unlockAt`, `bestScore`. Pas de score global agrégé stocké
  (recalculable depuis les étapes si besoin d'affichage).
- **Code de sauvegarde** : bouton "copier mon code" =
  `base64(JSON.stringify(state))` affiché/copiable ; "restaurer" = coller le
  code → `JSON.parse` → validation de forme minimale (clés attendues) →
  écrase le localStorage courant. Pas de chiffrement/signature : confiance
  client assumée, cohérent avec l'absence de backend.

## Page d'accueil

Boutons Commencer / Continuer / Réinitialiser (réinitialiser demande
confirmation, efface le localStorage du parcours courant). Visuel du parcours
(supports arbre/toit/barre...) : V1 = pictos simples (SVG/emoji basiques
génériques par type de support), pas d'illustration sur mesure — l'habillage
graphique riche est une amélioration future, non bloquante pour le moteur.

## Hors scope V1 (rappel)

Éditeur de parcours, bibliothèque d'aide sur échec répété, parcours
5e/4e/brevet, tout suivi professeur ou serveur — voir section Portée.
