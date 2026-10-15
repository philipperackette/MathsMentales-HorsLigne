> **Copie de travail de MathsMentales**
>
> Ce dépôt est une copie de [MathsMentales](https://www.mathsmentales.net/), créé par **Sébastien Cogez** et ses contributeurs (voir « Auteurs » ci-dessous), publié sous licence [Apache 2.0](LICENSE).
>
> - Source : <https://forge.apps.education.fr/mathsmentales/mathsmentales.forge.apps.education.fr>
> - Version reprise : branche `master` au **11 octobre 2026** — version 2.4.11, commit `a39d7713e0a9d3efcace9a2e29419fae3b34b361`
> - Modifications par rapport à l'original : ajout de cette note ; retrait du dossier `RebexTinyWebServer` (petit serveur web local pour Windows, sous licence propriétaire qui n'autorise pas la redistribution).
>
> Pour utiliser MathsMentales ou contribuer au projet officiel, rendez-vous sur le site et sur la Forge ci-dessus.

---

## Mathsmentales
Projet de réécriture du site MathsMentales.net qui permet de créer des diaporamas de calcul mental sans effort
Démo : https://www.mathsmentales.net/
Ancien site : https://www.mathsmentales.net/old

### Auteurs
 * L’auteur principal est Sébastien COGEZ. Des collègues ont suggéré des activités qu’il a développées.
 * Guillaume Valmont a écrit et corrigé quelques activités et a proposé une possibilité d’échange entre MathsMentales et des sites qui l’intégreraient par iframe.
 * Sandrine Cartier-lange a créé quelques activités autour de Pythagore et pour le lycée
 * Éric Elter a eu une relecture très attentive de plusieurs activités et en a proposé de nouvelles.
 * Fayçal TIB a voulu créer quelques activités pour le lycée (inachevées)
 * Mikael Le Mentec a modifié ou créé quelques activités en collège et lycée
 * Xavier Levet s’est lancé dans la création d’activités pour le CM en sept 2025
 * Dominique PORRONE a commencé la création d’activités pour le collège en septembre 2025
 
Pour ceux qui veulent participer, voir [cette documentation](https://forge.apps.education.fr/mathsmentales/mathsmentales.forge.apps.education.fr/-/blob/master/CONTRIBUTING.md?ref_type=heads)

### Nouveautés apportées par cette version :
 * nouvelle interface : tous les réglages dans une page, affichage d’exemples de questions pour mieux comprendre
 * possibilité de créer jusqu’à 4 paniers d’activités
 * possibilité d’afficher des exemples avant de commencer le diaporama
 * possibilité d’affichage multiples des questions
   * jusqu’à 4 différents
   * à chaque affichage peut être associé un panier différent
 * possibilité de créer son propre diapo en ligne (développement non commencé)
 * de nombreuses autres possibilités d’utilisation que le diaporama en ligne : mur d’activités, flash cards, fichier odt, feuille d’exercices, d’interro, fiche mémo, duel...
 * internationalisation (ou pas)
 * modularisation des scripts javascript, ce qui empêche de trouver par exemples les réponses par la console :D
 * possibilité de faire lire automatiquement certains énoncés, pour certains exercices de dictées, mais aussi pour les déficients visuels
 * éditeur d’activité en json (projet d’en faire un en yaml, plus facile à lire)

### bibliothèques externes
 * ~~[KateX](https://katex.org/) pour afficher les maths (MIT licence)~~ remplacé par mathslive le 26/08/2025
 * [KAS](https://github.com/Khan/KAS) outil de la Kahn academy pour évaluer des expressions littérales (MIT licence)
 * [Underscore](https://underscorejs.org/) pour pouvoir invoquer KAS (MIT Licence) une partie du code a été conservée pour réduire le poids
 * [knack.css](https://www.knacss.com/) framework css simple et léger ([licence WTFPL](http://www.wtfpl.net/))
 * [bulma-steps](https://github.com/Wikiki/bulma-steps) du projet css [bulma](https://bulma.io/)
 * [algebrite.js](http://algebrite.org/) An extensive math library symbolic computation (MIT licence)
 * [Sortable.js](http://sortablejs.github.io/Sortable/) Javascript library for reorderable drag-and-drop lists (MIT licence)
 * [seedrandom.js](https://github.com/davidbau/seedrandom) pour créer des nombres aléatoires "controlés" (MIT licence)
 * ~~[Chart.js](https://www.chartjs.org/) pour représenter des statistiques (MIT licence)~~ remplacé par une bibliothèque développée à l'aide de Claude ia
 * [JSXGraph](http://jsxgraph.uni-bayreuth.de/wp/index.html) pour les représentations graphiques et la géométrie, notamment [JessieCode](https://github.com/jsxgraph/JessieCode) qui permet de réaliser des figures facilement (LGPL & MIT licences)
 * ~~[asciimath2tex](https://github.com/christianp/asciimath2tex) pour taper plus rapidement les formules de maths (Licence Apache 2.0)~~ inutilisé à présent
 * ~~[qrious](https://github.com/neocotic/qrious) pour générer les qrcodes (GPLv3 licence)~~ remplacé par qr-code-styling
 * [qt-code-styling](https://qr-code-styling.com/) pour générer des QRCodes (licence MIT)
 * [mathlive](https://mathlive.io/) pour l’interface de saisie utilisateur pour répondre en ligne (MIT license) et pour l’affichage des formules mathématiques
 * [tinyweb](https://www.ritlabs.com/en/products/tinyweb/) pour le mini serveur web sous windows. (licence non libre, Cf. fichier de licence)
 * [sonothèque](https://lasonotheque.org), source des bruitages utilisés pour réveiller l’attention des élèves entre chaque diapo
 * [Vanilla-picker](https://github.com/Sphinxxxx/vanilla-picker) sélectionneur de couleur en pur javascript (ISC Licence)
 * ~~[threejs](https://threejs.org) qui me permet d’afficher solides en 3D dans le navigateur (MIT license)~~ JSXGraph propose à présent des vues 3D
 ù [js-yaml](https://nodeca.github.io/js-yaml/) Uh parseur de fichier yaml en fichier json. Le yaml est beaucoup plus simple à lire.

### icones et images
* "Circle Icons" de Nick Roach [iconfinder](https://www.iconfinder.com/iconsets/circle-icons-1) parfois retouchées, licence GPL
* usage d’[Emoji](https://emojipedia.org/) dans l’affichage des ressources
* Images de [Undraw](https://undraw.co/illustrations) pour illustrer la page "à propos" et quelques icones
* Les images du mode duel viennent du site [freepik](https://www.freepik.com) dont j’ai acquis les licences, elles ne sont pas disponibles sur github ni en téléchargement en accord avec les termes de la licence. Si je trouve d’autres images de qualité, je changerai cela.
* [Color Palette](https://icons8.com/icon/A5KjfdAgYLNE/color-palette) icon by [Icons8](https://icons8.com)
* Meteor Icons by Daniel [meteoricons.com](https://meteoricons.com/), avec ajout d’axes et centres de symétrie licence MIT
* [Icon Park](https://icon-sets.iconify.design/icon-park-outline/) icones d’illustration pour certains exercices.
* [Flag Icons](https://flagicons.lipis.dev/), avec ajout d’axes et centre de symétrie, licence MIT
* Icones de [SVG Repo](https://www.svgrepo.com/collection/calcite-sharp-line-icons/) domaine publique

### fonts
* Digital Numbers Font [Copyright (c) 2015, Stephan Ahlf](https://github.com/s-a/digital-numbers-font) licensed under the SIL Open Font License, Version 1.1.
* Baloo 2 [Designed by Ek Type](https://file.openfont.org/archive/baloo2.zip) licensed under the SIL Open Font License, Version 1.1.
* Nunito [Designed by Vernon Adams, Cyreal, Jacques Le Bailly](https://file.openfont.org/archive/nunito.zip) licensed under the SIL Open Font License, Version 1.1.

### liens directs :
* https://seb-cogez.github.io/mathsmentales/index.html?n=4 envoie sur le niveau 4e
* https://seb-cogez.github.io/mathsmentales/index.html?u=5NC7 envoie directement sur l’activité 5NC7
* [https://mathsmentales.net/index.html?i=321,e=correction,o=no,s=1,so=h,f=n,a=&p=0~t=ceinturebleue2br~c=1~o=true_i=6ND10~o=2~q=2.~p=~t=32~n=2_i=8MC1~o=2,3,4,5~q=2.0,1-3.-4.0,1-5.~p=~t=30~n=3_i=5DA2~o=4~q=1.-3.-4.~p=~t=41~n=2_i=3NB3~o=1~q=1.~p=~t=15~n=3](https://mathsmentales.net/index.html?i=321,e=correction,o=no,s=1,so=h,f=n,a=&p=0~t=ceinturebleue2br~c=1~o=true_i=6ND10~o=2~q=2.~p=~t=32~n=2_i=8MC1~o=2,3,4,5~q=2.0,1-3.-4.0,1-5.~p=~t=30~n=3_i=5DA2~o=4~q=1.-3.-4.~p=~t=41~n=2_i=3NB3~o=1~q=1.~p=~t=15~n=3) envoie sur un diaporama qui démarre automatiquement.

# inclure dans un site :
Rien n’empêche d’inclure un diaporama dans un site, ou sur un genialy.
À présent, vous pouvez même récupérer le score, et d’autres données en utilisant le protocole postMessage de javascript. Pour cela, il faut ajouter &embed=http://votresite.org à la fin de l’url d’inclusion.
En échange, MathsMentales renverra à votre site un objet JSON contenant les données suivantes :
 * url: adresse du diaporama complète
 * graine: la graine aléatoire utilisée pour la génération des données
 * touchable : true si MM a été affiché dans un environnement tactile
Cela permettra par exemple que le diaporama est terminé, et du coup déclencher d’autres actions.
Au besoin, vous pouvez demander des paramètres supplémentaires.

Et si on est en mode online :
 * nbBonnesReponses: score de l’élève qui a répondu
 * nbMauvaisesReponses: nombre de mauvaises réponses,
 * slider: numero du panneau d’affichage (jusqu’à 4 possibles)

## Développement
- installer nodejs, npm, git, vscodium (avec l’extension Live Server (Five Server))
- récupérer le code sur gitlab
- npm install (pour avoir toutes les dépendences)
- gulp pour passer en production dans le dossier dist qu’il suffit ensuite de mettre en ligne
- les fichiers de la bibliothèque sont dans public/library
- les fichier de dév sont dans src/
- gulp permet de produire les fichiers de production dans public (à mettre sur son site perso), sauf quelques fichiers se trouvant dans src/library/illustrations à ne pas oublier

### Changement de fonctionnement de la bibliothèque d’activités.
Elle est à présent réalisée à l’aide de fichiers json peu complexes

La bibliothèque d’activités se trouve dans le dossier public\library

Ces fichiers json comportent des *données obligatoires* :
 * **title** : titre de l’activité
 * **auteur** : auteur de l’activité (si autre que S. COGEZ)
 * ~~**ID** : un identifiant unique de l’activité pour la retrouver facilement dans la base de données, correspond au nom du fichier json : ID.json (pas de doublon !),~~ ex : 6ND6 rangé dans N6 (niveau 6e) sous le code 6ND (Cf structure.json pour le classement) 6ND6 pour le numéro dans l’ordre de création des fichiers. Plus besoin d’ID, c’est le nom du fichier qui le désigne, ex : 6ND6.json
 * **dest** : la liste des niveaux et sous partie qui seront peuplés par l’activité, ex 7NA1 sera rangé en CM2 (**7**e) > **N**umérique > Comprendre et utiliser les nombres (**A**) > 1ère activité
 * **vars** : objet json contenant la ou les variables utilisées dans l’activité
   * une variable est une chaine ou un tableau. elle est interprétée pour tirer au sort des nombres uniques, des tableaux de nombres, un élément d’un tableau ...
     * des entiers min_max ou min_max_quantité ou min_max_^liste de valeurs à éviter ou min_max_quantité_^&,val1,val2... & signifie pas de double. Exemple : "1_10_2_^&,5" tire au hasard deux nombres différents entre 1 et 10 inclus qui ne valent pas 5
     * des décimaux dmin_max_précision (pouvant être négative pour les puissances de 10 positives). Exemple : "d0.1_2_2" tire un nombre à deux chiffres après la virgule compris entre 0.1 et 2 inclus
     * une valeur dans un tableau. Exemple : [10,100,1000] var tirer l’un des nombres de la liste
   * une variable a pourra être reprise dans une autre variable par un appel de type :var ou :var[2] pour la 3e valeur d’un tableau s’il n’est pas associé à une autre variable (voir les précisions suivantes) pour utiliser la variable var. Attention, les déclarations sont chronologiques :var ne peut être appelée avant sa déclaration.
   * des calculs utilisant la bibliothèque math peuvent être effectués dans les paires d’accolades, exemple : ${MMmath.multiply(:a,:b)}
   * d’autres traitements peuvent être effectués à l’aide de fonctions javascript ${:a.toUpperCase()}
   * Note : les variables présentes dans l’activité et redéfinies dans une option sont définies dans l’ordre de déclaration globale. Il faut bien l’avoir en tête. Il vaut mieux éviter de redéclarer une variable globale...
* **question** : chaine unique ou tableau de chaines contenant le texte de la question
  * pour le cas du tableau, il est possible de choisir le type de question à afficher lors du paramétrage de l’activité
* **answer** : chaine unique ou tableau de chaines contenant la réponse à la question. L’énoncé de la question peut être repris en indiquant :question directement dans la chaine, sans accolades si vous ajoutez |15 les 15 premiers caractères seront ignorés dans la recopie.

ainsi que des *données optionnelles* :

* Pour l’activité :
  * **description** : texte décrivant de manière plus précise l’activité
  * **options** : tableau d’objets json pouvant contenir *title*, *vars*, *question*, *answer*, *figure*, et/ou *value*
    * une variable non définie prend la valeur de l’objet parent.
    * une variable de même nom remplace la valeur de l’objet parent
  * **type** : valeurs possible : "texte", "latex" qui indique le type de rendu des questions/réponses
  * **repeat** : Possibilité de répéter une question (le moteur évite normalement les répétitions de questions, mais parfois, c’est impossible car l’énoncé est visuel et les questions sont toujours les mêmes) valeurs possibles : true (on évite que la question se répète dans les 5 dernières questions) ou un nombre x (on évite que la réponse se répète plus de 2 fois dans les x dernières questions)
  valeur par défaut : false (si non défini)
  * **textSize** : taille du texte de la question, permet de modifier la taille d’affichage par défaut. valeurs possibles : "medium" ou "small" 
  * **speech** : 1, indique si l’exercice peut être lu par la synthèse vocale text to speech
  * **params** : cases à cocher proposées au professeur, indépendantes des options. Ex : `"params":{"soi":{"label":"Proposer parfois le nombre lui-même","defaut":true}}`. Dans les *vars*, *question*, *answer* et *value*, `:soi` vaut `true` (case cochée) ou `false`. `defaut` vaut `true` si omis. Le nom ne doit contenir ni `-`, ni `.`, ni `~`, ni `=` (il est mémorisé dans l’URL sous la forme `~pa=soi.0` quand la case est décochée). Pour une probabilité : `${:soi && utils.alea()<0.25 ? :a : …}` (éviter `MMmath.aleaInt(1,4)===1` qui donne 1/6 : les bornes ont une demi-chance). Exemple : 6ND14. Avec `"exclut":{"b":3}` dans un paramètre, la case cochée exclut la valeur 3 du tirage de la variable entière `b` (intervalle `min_max`), en conservant l’anti-répétition du moteur. `"groupe":"Ne pas tirer"` affiche un intitulé devant les cases consécutives qui le partagent (le `label` de chaque case peut alors se limiter à `0`, `1`…). Exemple : 6ND6.
  * **consigne** : un texte donnant une consigne commune pour toutes les options de l’activité

* Pour l’activité ou une option :
  * **consts** : objet contenant des données constantes, telles que des tableaux, ces données peuvent contenir des variables. Définies pour l’activité, elles sont accessibles dans les options. Si des constantes sont définies dans les options, les constantes globales sont concaténées avec elles
  * **value** : chaine ou tableau de chaines contenant les réponses attendues dans le formulaire de réponse en ligne
  * **figure** : chaine contenant une figure illustrant l’activité. On peut par exemple faire référence à une figure d’une table contenant des svg, svg contenant des variables. héhéhé !
  * **figureCorrection** : figure de la correction, dans le cas où la question demande de tracer une figure.
  * **shortq** : question au format court (sans la consigne par exemple) pour un export plus lisible dans les ceintures, doit suivre la forme de "questions" : une chaine ou un tableau. si l’on prévoit un emplacement de réponse dans la question, il n’y a pas d’espace de réponse derrière. Pour l’emplacement de la réponse, on utilisera \\colorbox{#ECECEC}{\\quad} (un quad laisse de la place pour environ 2 chiffres pas trop grands)
  * **keys** : tableau d’au plus huit éléments contenant les touches optionnelles pour le clavier virtuel.
  * **audio** : texte à faire lire par le moteur text to speech de l’appareil utilisé, souvent la question dépouillée de mise en forme. Il faut parfois bidouiller, car les maths ne sont pas toujours lues correctement.
  * **valueType** : chaine qui indique le type de réponse attendue, pour une correction en ligne plus précise
    * "liste" pour des listes de nombres séparées par des point-virgule de type "3;2;54;5.4"
    * "inInterval" pour des nombres situés dans des intervalles de type "1.6-6.45"
 
 Le tableau de touches par défaut est ["÷","×","-","+","(","x","x²","√"];
 
 Les touches disponibles pour le moment :
 * "_" touche vide
 * "/" fraction
 * "pi"
 * ";"
 * "<"
 * ">"
 * "="
 * "^" exposant
 * "10n" puissance de 10
 * "h"
 * "min"
 * les caractères a, b, c, e, t, :, u, v, x, y, z, A, L
 * "aigu", "obtus", "droit"
 * "o", "n" oui/non
 * "V", "F" VRAI/FAUX
 * les unités A, L, l, m, g et %

---
### à faire à l’insertion d’un nouvel exercice
Suite à la réalisation d’une ou plusieurs nouvelles activités, il faut les intégrer dans la bibliothèque.

Pour cela, depuis le terminal de VSCode, par exemple, se rendre dans le dossier public\library, (cd public\library) puis taper **node scan**. Cela recrée le fichier qui référence tous les exercices dans une arborescence chargée au lancement de MathsMentales.
Suite à cela, il faut recompiler les fichiers js. Pour cela, detourner à la racine de MathsMentales et taper **gulp** puis entrée.

Les fichiers à mettre en ligne sur un site se trouvent dans le dossier public.

### structure des fichiers d’activités

Fichier structure pour démarrer la création d’un exercice.

``` js
{
    "title":"", // titre
    "type":"", // laisser vide ou supprimer pour des notations de maths
    "dest":[""], // Codes des chapitres de destination
    "consts":{"d":""}, // constantes utilisées, non obligatoires
    "vars":{"a":"", "b":"", "c":["u","v","t","x", "y", "z"]}, // variables utilisées, non obligatoires si dans les options
    "options":[{
        "name":"", // utilisé pour l’affichage des exemples
        "question": ["", ""], // [] ou txt, remplace la variable commune, peut être omis
        "shortq":["",""]// version courte de la/des question(s)
        "answer":"", // remplace la variable commune, peut être omis
        "vars":{}, // remplace les variables communes, peut être omis
        "consts":{}, // remplace les constantes communes, peut être omis
        "value":"" // remplace les valeurs attendues dans réponse online, peut être omis
    }
    ],
    "question":"", // question commune non obligatoire si dans touetes les options
    "shortq":"",// question courte (pour les ceintures par exemple)
    "answer":"", // réponse commune non obligatoire si dans toutes les options
    "value":""  // valeurs attendue si réponse online commune non obligatoire si dans toutes les options
}
```

Et en yaml, extension de fichier .yml
L’indentation est importante pour la compréhension du fichier

``` yaml
title: blabla
type: text ou latex
dest: [chap1, chap2, ...]
speech: 1 # les questions seront lues telles quelles, sauf si vous définissez ce qu’il faut lire par audio

consts: # constantes utilisées globalement.
# Attention, si elles contiennent des variables, ces variables doivent être définies dans toutes les options
  nom1: valeurs
  nom2: valeurs
vars: # variables globales, disponibles dans toutes les options
  v1: valeur
  v2: valeur
options:
  - name: un texte qui décrit l’option
    vars:
      v3: valeur # ne pas utiliser des noms utilisés dans les constantes ou les variables globales
      v4: valeur
    question: un texte ou une formule, objet de la question
    answer: :question reprend la question
    shortq: question version courte
    audio: le texte à voix haute qui reprend la question
    value: la valeur courte attendue pour les ceintures, ou la version online. # si elle n’existe pas, c’est answer qui est pris je crois
```

### Exemples :

Tables de multiplciation : avec du latex, type par défaut, donc non indiqué

```js
{
    "title":"Tables de Multiplications", // obligatoire
    "dest":["6ND", "7ND"], // obligatoire, permet de placer l’activité dans les listes de chaque niveau correspondant.
                           //Les références utilisées sont à consulter dans le fichier library/structure.json
    "vars":{
      "a":"1_10", // a : entier entre 1 et 10
      "b":"2_10" // b entier entre 2 et 10
      },
    "question":[
      "\\bold{:a}\\times:b", // en gras le nombre a multiplié par le nombre b
      ":b\\times\\bold{:a}" // le nombre b multiplié par le nombre a, en gras
      ],
    "answer":":question=\\color{red}{${:a*:b}}", // une seule réponse possible on peut reprendre la variable question ici sans ${}, c’est la seule possible dans cette chaine
    "value":"${:a*:b}" // valeur attendue dans le corrigé
}
```

Tables de multiplication sans le 0 et le 1 en yaml

```yaml
title: Tables de multiplication classiques (sans 0 et 1)
dest: # chapitres où sera intégrée l’activité
  - 6ND
  - 7ND
  - 8ND # on aurait pu écrire [6ND, 7ND, 8ND]
description: Connaitre les tables de multiplications de 2 à 12, sous plusieurs formes
type: latex # pas obligatoire, c’est la valeur par défaut
options:
  - name: Table de 2
    vars:
      m: '2_10'
      n: 2
      r: ${2*:m}
  - name: Table de 3
    vars:
      m: '2_10'
      n: 3
      r: ${3*:m}
  - name: Table de 4
    vars:
      m: '2_10'
      n: 4
      r: ${4*:m}
# Je n’ai pas mis toutes les tables pour l’exemple, c’est un peu répétitif
question: # forme de question commune à toutes les options
  - :n\times:m=?
  - :m\times:n=?
  - :r = :n\times ?
  - :r\div:n=?
answer: # à chaque question sa réponse
  - :n\times:m=\color{red}{:r}
  - :m\times:n=\color{red}{:r}
  - :r = :n\times \color{red}{:m}
  - :r\div:n=\color{red}{:m}
value: # à chaque question la valeur attendue pour évaluation ou pour les réponses courtes dans les ceintures
  - :r
  - :r
  - :m
  - :m
```

Développer une identité remarquable. vars commun à toutes les options
Il est possible de choisir parmi les types de questions, celle qui sera affichée dans le diaporama.

```js
{
    "title":"Développer une identité remarquable",
    "dest":["3ND"]
    // var a : entier entre 1 et 10
    // var b : entier entre 2 et 10
    // var c : variable
    "vars":{
      "a":"1_10",
      "b":"2_10",
      "x":["u","v","t","x", "y", "z"]
      },
    "options":[{
        "name":"(ax+b)²",
        "question": [
          "(${MMmath.signIfOne(:a)}:x+:b)^2", // (ax + b)², le a pouvant être 1, on utilise MMmath.signIfOne qui remplace le nombre par rien si 1 ou - si -1
          "(:b+${MMmath.signIfOne(:a)}:x)^2" // (b + ax)²
          ],
          // reponse : (ax+b)² = en rouge ax²+2ab+b² on utilise MMmath.multiply et MMmath.pow plutôt que * et ^ qui peuvent créer des pb d’arrondi
        "answer":":question=\\color{red}{${MMmath.signIfOne(MMmath.pow(:a,2))}:x^2+${MMmath.multiply(2,:a,:b)}:x+${MMmath.pow(:b,2)}}",
        "value":"${MMmath.signIfOne(MMmath.pow(:a,2))}:x^2+${MMmath.multiply(2,:a,:b)}:x+${MMmath.pow(:b,2)}"    
    },
    {
        "name":"(ax-b)²",
        "question": ["(${MMmath.signIfOne(:a)}:x-:b)^2", "(:b-${MMmath.signIfOne(:a)}:x)^2"],
        "answer":":question=\\color{red}{${MMmath.signIfOne(MMmath.pow(:a,2))}:x^2-${MMmath.multiply(2,:a,:b)}:x+${MMmath.pow(:b,2)}}",
        "value":"${MMmath.signIfOne(MMmath.pow(:a,2))}:x^2-${MMmath.multiply(2,:a,:b)}:x+${MMmath.pow(:b,2)}"    
    },
    {
        "name":"(ax-b)(ax+b)",
        "question": [
            "(${MMmath.signIfOne(:a)}:x-:b)(${MMmath.signIfOne(:a)}:x+:b)", // (ax-b)(ax+b)
            "(${MMmath.signIfOne(:a)}:x-:b)(:b+${MMmath.signIfOne(:a)}:x)", // (ax-b)(b+ax)
            "(${MMmath.signIfOne(:a)}:x+:b)(${MMmath.signIfOne(:a)}:x-:b)", // (ax+b)(ax-b)
            "(${:b}+${MMmath.signIfOne(:a)}:x)(${MMmath.signIfOne(:a)}:x-:b)"], // (b-ax)(ax-b)
        "answer":":question=\\color{red}{${MMmath.signIfOne(MMmath.pow(:a,2))}:x^2-${MMmath.pow(:b,2)}}",
        "value":"${MMmath.signIfOne(MMmath.pow(:a,2))}:x^2-${MMmath.pow(:b,2)}"    
    }
    ]
}
```

Conversions
``` js
{
    "title":"Conversions vers les unités de base",
    "dest":["7MA", "6MA", "6MD"], // chapitres de destination dans l’arborescence
    "options":[
        // var k : unité d’où convertir et multiplicande
        // var p : précision max (négative : multiples de l’unité, positive : sous-multiples) et nombre max
        // var z : intervalle la précision
        // var x : intervalle de tirage entre 0 et p nombre max, avec la précision p max et non nul ^0
        {
          "name":"m",
          "vars":{
            "q":"m",
            "k":[["km",1000], ["hm",100], ["dam",10], ["dm",0.1], ["cm",0.01], ["mm",0.001]], // pour chaque unité on associe le multiplicande permettant la conversion
            "p":[[0.1,2],[1,1],[0,10],[-1,100],[-2,1000]], // le premier nombre est la précision, le second est la limite supérieure pour la génération du nombre
            "z":":p[0]_3", // définition de la précision de l’arrondi : 0,1-0,001 ou 1-0,001 ou 10-0,001 ou encore 100-0,001
            "x":"d0_:p[1]_:z_^0"} // d indique qu’on veut des nombres décimaux, nombre entre 0 et 1, 10, 100 ou 1000, non nul
            },
        {
          "name":"L",
          "vars":{
            "q":"L",
            "k":[["hL",100], ["daL",10], ["dL",0.1], ["cL",0.01], ["mL",0.001]],
            "p":[[0,0],[-1,10],[-2,100],[-3,1000]],
            "z":":p[0]_3",
            "x":"d0_${:p[1]}_:z_^0"
          }
        },
        {
          "name":"g",
          "vars":{
            "q":"g",
            "k":[["kg",1000], ["hg",100], ["dag",10], ["dg",0.1], ["cg",0.01], ["mg",0.001]],
            "p":[[0,0],[-1,10],[-2,100],[-3,1000]],
            "z":":p[0]_3",
            "x":"d0_${:p[1]}_:z_^0"
            }
          }
    ],
    "description":"Conversions des multiples et sous-multiples des m, L et g vers les m, L et g",
    "question":"\\text{Convertir } :x \\text{ ${:k[0]} en }\\color{blue}\\text{:q}",
    "answer":":x \\text{ ${:k[0]}} = \\color{red}{${MMmath.round(:x*:k[1],7)}\\text{ :q}}",
    "value":"${MMmath.round(:x*:k[1],7)}\\text{ :q}"
}
```

Exemple avec du texte
``` js
{
  "type":"text",
  "title":"Table de 3",
  "dest":["11NC"], // chapitre de destination 11 pour le CP, N pour les nombres, C pour le cacul avec les nombres
  "vars":{
    "a":"2_10"
  }
  "question":"Combien font $$3\\times :a$$ ?",
  "answer":"$$3\\times :a=\\color{red}{${3*:a}}$$"
  "value":"${3*:a}"
}
```

Exemple avec chartjs : représentation de données statistiques
``` js
{
    "title":"Test de graphique",
    "type":"text", // pour affichier des maths, il faudra utiliser les marqueurs $$ $$ autour des expressions
    "dest":["5DA", "4DA", "3DA"],
    "vars":{
      "a":"10_100_5_^&", // tire 5 entiers entre 10 et 100, tous différents (^&)
      "b":[["fraises", "bananes", "oranges", "kiwis", "pommes"], ["vélo", "trotinette", "voiture", "bus", "scooter"]] // choisit l’un des deux tableaux
      },
    "figure":{
      "type":"chart", // sera affiché à l’aide de la bibliothèque chartjs
      "content":{ // les données passées à l’objet chartjs
        "type":"vertical", // le type de représentation (vertical, horizontal, pie, semicircular)
        "labels":[":b[0]", ":b[1]", ":b[2]", ":b[3]", ":b[4]"]
        "data":[":a[0]",":a[1]",":a[2]",":a[3]",":a[4]"]
        // les datas à afficher, dont les couleurs
        "options":{"title":"Graphique","colors": ["#3e95cd", "#8e5ea2","#3cba9f","#e8c3b9","#c45850"]}}
        },
    "question":"Quelle est la donnée la plus représentée ?", // la question posée
    "answer":"C’est ${:b[:a.indexOf(Math.max(...:a))]}", // la réponse attendue (le max de la série)
    "value":"${Math.max(...:a)}"
}
```

Exemple avec JSXGraph
``` js
{
    "dest":["3DD"],
    "title":"Lire l’ordonnée à l’origine",
    "type":"text",
    "vars":{"a":"d-2_2_1", "b":"-3_3"}, // a est le coeff, b est l’ordonnée à l’origine
    "figure":{
        "type":"graph", // usage de jsxgraph
        "boundingbox":[-5,5,5,-5], // taille de la boite de tracés (xmin,ymax,xmax,ymin)
        "axis":true, // affiche les axes
        "grid":true, // affiche la grille
        "content" :[
                ["functiongraph",":a*x+:b"] // functiongraph va tracer la représentation de la formule
            ]    
        },
    "question":"Quelle est l’ordonnée à l’origine de la fonction affine ?",
    "answer":"L’ordonnée à l’origine de la fonction est <span class='red'>:b</span>",
    "value":":b" // valeur attendue en réponse
}
```

### Historique des paniers (onglet « Historique »)

L’onglet « Historique » retrouve les diaporamas (et autres activités : ceinture, duel, fiche mémo…) qu’on a déjà générés, avec leurs paniers. Il n’a longtemps été que le `innerHTML` de sa propre liste, stocké tel quel dans `localStorage`. Il repose à présent sur un petit modèle de données JSON, décrit ici pour qui voudrait le faire évoluer (voir aussi `docs/superpowers/specs/2026-08-22-historique-design.md`).

* **Stockage** : `localStorage["mm-historique-v2"]` contient `{ "version": 2, "entrees": [...] }`.
* **Forme d’une entrée** :
  * **id** : identifiant stable (ex. `h-1755878400000-a1b2c3`), sert de clé de rapprochement lors d’une fusion (import, restauration après suppression, et plus tard synchronisation) ; il n’est jamais recalculé pour une entrée existante.
  * **type** : un code parmi `diaporama`, `cansheet`, `exosheet`, `exam`, `duel`, `ceinture`, `cartesflash`, `fichememo`, `puzzle`, `whogots`, `dominos`, `assoc`, `wall`, `docLOOO`, `inconnu`. La table `TYPES` de `src/js/mods/historiqueDef.js` associe à chaque code un libellé, un emoji et l’id du bouton « → Historique » correspondant dans `index.html`.
  * **titre** : titre affiché (personnalisable), calculé par défaut à partir du premier panier non vide, sinon du libellé du type.
  * **cree**, **modifie** : dates en millisecondes depuis l’epoch.
  * **epingle** : booléen ; une entrée épinglée reste en tête de liste et échappe au nettoyage automatique des entrées anciennes.
  * **url**, **urlSansGraine** : adresse complète du diaporama, avec et sans la graine aléatoire.
  * **paniers** : tableau de `{ titre, activites: [{ id, titre, nbq }] }` ; `nbq` (nombre de questions) est absent quand il n’est pas connu, plutôt que forcé à 0.
* **Ancienne clé conservée** : `localStorage["history"]`, l’ancien historique au format HTML, n’est **jamais réécrite ni supprimée**. Elle sert uniquement, au premier chargement, à alimenter une migration à sens unique vers `mm-historique-v2` (un drapeau `mm-historique-migre` évite de la relire à chaque démarrage) ; elle reste ensuite en lecture seule comme filet de sécurité si la migration se révélait fautive. De même, un contenu illisible sous `mm-historique-v2` n’est jamais perdu : il est mis de côté sous `mm-historique-v2-corrompu`.
* **Export** : le bouton d’export télécharge `mathsmentales-historique.json`, un fichier JSON de même forme que le stockage (`{ version, entrees }`, indenté sur 2 espaces).
* **Import** : accepte ce format JSON, ainsi que les anciens exports `.html` (repassés par le même analyseur que la migration, jamais réinjectés dans la page). Deux modes : fusion (par défaut — à `id` égal, la version modifiée le plus récemment l’emporte) ou remplacement complet de l’historique.
* **Synchronisation nuage** : l’historique peut être synchronisé avec un serveur WebDAV (Nextcloud, Synology, Infomaniak, kDrive…) pour la portabilité entre appareils. Le proxy `public/proxy/nextcloud.php`, déployé manuellement sur `www.mathsmentales.net` (en dehors de la CI GitLab, comme `getshort.php`), relaie les requêtes WebDAV pour contourner le blocage CORS d’un partage Nextcloud public. Pour autoriser un hébergeur WebDAV hors du domaine `*.apps.education.fr`, il faut créer sur le serveur le fichier `public/proxy/webdavhosts.php` à partir du modèle `public/proxy/webdavhosts.php.exemple` (ce fichier réel n’est jamais committé — il figure dans `.gitignore`). Le fichier synchronisé sur le serveur est `MathsMentales/historique.json`, identique en format à l’export local. La configuration et le mot de passe sont gérés par trois clés : `mm-historique-nuage` (adresse WebDAV et mode de partage/compte, sans le mot de passe, en localStorage), `mm-historique-nuage-mdp` (le mot de passe proprement dit, en sessionStorage par défaut, ou en localStorage seulement si l’utilisateur a coché la case « Retenir sur cet appareil »), et `mm-historique-nuage-retenir` (le drapeau enregistrant ce choix, en localStorage). Attention : ce proxy relaie les requêtes reçues sans authentification ni limitation de débit propre — rien n’empêche un tiers de s’en servir pour tenter des mots de passe en force brute contre un partage Nextcloud, avec l’IP de `mathsmentales.net` comme origine apparente. Tant qu’aucune limitation applicative n’est ajoutée, l’opérateur du serveur devrait envisager une limitation au niveau du serveur web (fail2ban, limite de connexions Apache/Nginx, etc.).

La logique pure (création, normalisation, filtre, tri, groupement par date, fusion, validation d’import) vit dans `src/js/mods/historiqueDef.js`, sans DOM ni dépendance, testée par `src/js/mods/historiqueDef.test.mjs`. Le stockage, la migration et le rendu de l’onglet vivent dans `src/js/mods/historique.js`.
