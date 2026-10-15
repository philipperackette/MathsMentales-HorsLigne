# Historique des paniers — design (restructuration + préparation nuage)

Date : 2026-08-22

Lot 1 livré le 2026-08-22. Lot 2 (synchronisation nuage) livré le 2026-08-23.

## Contexte et objectif

L'onglet « Historique » de `src/index.html` est la mémoire de travail du
professeur : chaque bouton « → Historique » y range l'adresse d'un diaporama,
d'une fiche, d'une interrogation, pour la retrouver plus tard.

Il n'est pas construit sur des données. `MM.js:3014` fait
`localStorage.setItem("history", contener.innerHTML)` : l'historique **est** le
HTML de la liste, sérialisé. Tout le reste en découle.

- Aucune recherche, aucun tri, aucun filtre, aucun renommage possibles : il n'y
  a rien à interroger, seulement une chaîne de balises.
- L'export produit un `.html`, l'import le réinjecte en `innerHTML`
  (`MM.js:3050`) sans la moindre validation — n'importe quel HTML entre dans la
  page.
- Toute évolution du gabarit d'une entrée oblige à rattraper l'existant à la
  main. C'est déjà arrivé : `lib.mathsmentales.js:116-126` parcourt le HTML
  restauré pour rajouter le bouton « ♻️ panier » aux entrées d'avant.
- Les actions sont reconnues par leur texte :
  `evt.target.innerHTML.indexOf("🛠 éditer")` (`lib.mathsmentales.js:917`).
  Changer un libellé casse la fonctionnalité.
- Le `TODO` de `MM.js:3012` (« on supprime les références qui datent de plus
  de… ») n'a jamais pu être fait : la liste grossit sans fin, et le contenu
  complet des paniers, toujours déplié, fait qu'on voit trois entrées par écran.

Objectif : reposer l'historique sur un modèle de données, en tirer une
présentation utilisable (recherche, filtres, cartes compactes), et le faire de
façon que la sauvegarde sur nuage (Nextcloud/ownCloud/kDrive) ne demande ensuite
aucune seconde migration.

## Portée

**Lot 1 — cette spec, à implémenter :**

- Modèle JSON des entrées, avec identifiant stable et horodatage.
- Migration automatique et sans perte de l'historique HTML existant.
- Deux mods : `historiqueDef.js` (pur, testé) et `historique.js` (stockage,
  migration, rendu).
- Nouvelle présentation : cartes compactes, regroupement chronologique,
  recherche, filtre par type, épinglage, renommage, suppression annulable.
- Export/import JSON, avec fusion ou remplacement au choix.
- Allègement de `MM.js` : l'historique en sort.

**Lot 2 — décrit ici, non implémenté :** synchronisation WebDAV
(Nextcloud/ownCloud/kDrive) via un proxy PHP, portée depuis `qcmcam2`. La
section « Préparation du lot 2 » fixe ce que le lot 1 doit garantir pour que le
lot 2 n'ait qu'un transport à ajouter.

**Hors scope :** dossiers créés par l'utilisateur, étiquettes, compte
utilisateur, backend applicatif. L'application reste autonome côté navigateur.

## Décisions de cadrage

| Question | Décision | Raison |
|---|---|---|
| Format de stockage | JSON structuré, clé `mm-historique-v2` | Préalable à toute recherche, tri, renommage et synchro ; le HTML sérialisé ne se requête pas |
| Historique existant | Migration automatique au chargement, ancienne clé `history` conservée intacte | Personne ne perd ses séances rangées, et le filet reste en place si la migration se révèle fautive |
| Organisation | Liste plate + recherche + filtres | Zéro rangement manuel à la charge du professeur ; se traduit directement en un fichier plat côté nuage |
| Découpage | `historiqueDef.js` pur + `historique.js` DOM | Reprend le motif `parkourDef.js` : logique pure testée au `node --test`, UI vérifiée à la main. La moitié pure portera la synchro du lot 2 |
| Purge des vieilles entrées | Action explicite proposée, jamais automatique | Détruire sans demande le travail d'un collègue est le pire défaut possible ici |
| Suppression d'une entrée | Annulation de 6 s, sans `confirm()` | Un `confirm()` répétitif se valide en réflexe ; l'annulation protège mieux. `confirm()` conservé pour « Vider », action massive |
| Disposition nuage (lot 2) | Un fichier `historique.json`, fusion par `id`/`modifie` | Une requête pour lire, une pour écrire ; l'`id` stable permet une vraie fusion entre deux postes, là où `qcmcam2` doit écraser faute d'identifiants partagés |

## Architecture

```
src/js/mods/historiqueDef.js       modèle pur : TYPES, normalise, fusionne, filtre, groupe, valide
src/js/mods/historiqueDef.test.mjs tests node --test
src/js/mods/historique.js          localStorage, migration HTML, rendu, délégation d'évènements
src/css/mathsmentales.css          styles de l'onglet (remplace les 3 règles actuelles, l.425-438)
src/index.html                     structure de l'onglet (remplace l.1081-1094)
```

Sortent de `MM.js` : `copyURLtoHistory` (l.2885-3016), `exportHistory`,
`showInputImportHistory`, `importHistory`, `removeFromHistory`,
`removeSelectionFromHistory`, `createSelectHistory`, `destroySelectHistory`,
`emptyHistory` (l.3018-3152), `getCartsContent` (l.1564-1578) — environ
230 lignes sur les 3872 du fichier.

Restent dans `MM.js` : la fabrication des URL (`paramsToURL`, `setURL`), qui
dépend des paniers vivants, et une nouvelle fonction `paniersVersDonnees()` qui
remplace `getCartsContent()` — même parcours de `MM.carts`, mais elle retourne
des objets simples au lieu d'un `<div>` de `<ul>`. `copyURLtoHistory()` se
réduit à calculer les deux URL puis appeler `historique.ajouter(...)`.

**Piège de nommage.** `MM.setHistory()` (`MM.js:2414`) n'a aucun rapport avec
l'historique des paniers : c'est `history.pushState` du navigateur. Les
nouveaux mods ne s'en approchent pas. Il n'est pas renommé (18 appels, hors
sujet).

## Modèle de données

Clé `mm-historique-v2` :

```js
{
  version: 2,
  entrees: [
    {
      id: "h-1756312800000-a3f",       // stable ; nom d'entrée côté nuage au lot 2
      type: "exam",                     // code brut, pas le libellé affiché
      titre: "Interro fractions 5e",    // renommable ; défaut = titre du 1er panier
      cree: 1756312800000,              // epoch ms
      modifie: 1756312800000,           // arbitre de conflit à la fusion
      epingle: false,
      url: "…&a=graine",                // « mêmes données »
      urlSansGraine: "…",               // « autres données »
      paniers: [
        { titre: "Diapo 1", activites: [ { id: "5CL3", titre: "Réduire", nbq: 6 } ] }
      ]
    }
  ]
}
```

Le nombre d'activités et le nombre de questions affichés sont **dérivés** de
`paniers` au moment du rendu, jamais stockés : stockés, ils divergeraient du
contenu réel.

`type` est un code (`"diaporama"`, `"exam"`, `"exosheet"`, `"cansheet"`,
`"ceinture"`, `"cartesflash"`, `"fichememo"`, `"puzzle"`, `"whogots"`,
`"dominos"`, `"assoc"`, `"wall"`, `"docLOOO"`, `"duel"`, `"inconnu"`). Libellé,
emoji et identifiant du bouton d'origine viennent d'une table unique `TYPES`
dans `historiqueDef.js`, qui remplace la cascade de quatorze `else if` de
`MM.js:2896-2957`. Filtres, icônes, libellés et retour visuel des boutons en
dérivent tous.

## Migration

Une fois, au premier chargement en v2, puis drapeau `mm-historique-migre`.

1. Lecture de `history`. Si vide ou absente : rien à faire.
2. Parsage avec `DOMParser` dans un document **inerte**. L'ancien blob n'est
   plus jamais réinjecté dans la page vivante.
3. Pour chaque `<li>` :
   - `span.bold` → type reconnu **par son emoji** (robuste aux renommages de
     libellés) et date française reparsée en epoch ;
   - premier `a[href]` → `url`, second → `urlSansGraine` ;
   - `ul` → `paniers` (`span.bold` = titre du panier, `li` = titres
     d'activités ; les `nbq` ne figurent pas dans l'ancien HTML et restent
     indéfinis) ;
   - `titre` = titre du premier panier, sinon libellé du type.
4. Une entrée impossible à parser n'est pas jetée : elle est conservée avec
   `type: "inconnu"` et son `url`, seule donnée qui compte réellement.
5. `history` n'est **ni supprimée ni réécrite**.

L'ancien export `.html` reste accepté à l'import : il passe par le même parseur
inerte. Aucune sauvegarde existante ne devient illisible.

## Mod `historiqueDef.js` (pur, sans DOM)

```js
TYPES                                   // { exam: { libelle, emoji, bouton }, … }
normalise(entree)                       // valeurs par défaut, bornes, champs manquants
cree({ type, url, urlSansGraine, paniers, titre })   // fabrique une entrée complète
fusionne(entreesA, entreesB)            // par id ; à id égal, `modifie` le plus récent gagne
filtre(entrees, { recherche, types })   // titre + titres d'activités, insensible casse/accents
trie(entrees)                           // épinglés d'abord, puis `modifie` décroissant
groupeParDate(entrees, maintenant)      // [{ cle: "aujourdhui"|"semaine"|"2026-09", entrees }]
valideImport(objet)                     // forme du fichier ; retourne { ok, entrees, erreurs }
compte(entree)                          // { activites, questions } dérivés
anciennes(entrees, mois, maintenant)    // entrées non épinglées plus vieilles que N mois
```

`fusionne` et `valideImport` sont les deux fonctions que le lot 2 réutilise
telles quelles : la synchronisation nuage est exactement un import en mode
fusion, avec un transport réseau devant.

## Mod `historique.js` (stockage et vue)

Moitié stockage :

```js
charger()            // lit, migre si besoin, met en cache
sauver()             // écrit ; QuotaExceededError capturé (voir Robustesse)
ajouter({ type, url, urlSansGraine, paniers, titre })
renommer(id, titre)
epingler(id)
supprimer(ids)       // tableau : couvre la suppression unitaire et la sélection multiple
vider()
nettoyerAnciens(mois)
exporterJSON()
importerJSON(texte, mode)   // mode : "fusion" | "remplacement"
```

Moitié vue : `monter(section)`, appelée une seule fois par
`lib.mathsmentales.js`. Elle construit l'en-tête, la barre d'outils et la
liste, et pose **une** délégation de clic.

**Fin du couplage par le texte.** Les actions portent
`data-action="editer|panier|supprimer|epingler|renommer"` et `data-id`. Plus
aucun test sur `innerHTML`.

**Dédoublonnage** : à `url` identique, l'entrée existante est mise à jour
(`modifie` rafraîchi) et remonte en tête. Le rapprochement se fait sur les
données, plus par un sélecteur CSS avec échappement de quotes
(`MM.js:2984`).

**Accueil.** Le bloc « reprendre » (`lib.mathsmentales.js:128-140`) lit
aujourd'hui les trois premiers `<li>` du DOM de l'onglet. Il interrogera
`historique.charger()` — comportement visible identique, dépendance au HTML
supprimée.

## Interface

### En-tête

Aujourd'hui, six actions en `<span class="pointer underline">` sur une seule
ligne, toutes du même poids (`index.html:1083-1093`), « 💥 Vider l'historique »
— la plus destructrice — en tête.

```
Historique des paniers                                    23 entrées
┌───────────────────────────────────────────────────────────────────┐
│ 🔎 Rechercher…              [Tous les types ▾]  [☑]  [⋯]          │
└───────────────────────────────────────────────────────────────────┘
```

- **Recherche** sur le titre de l'entrée et sur les titres d'activités des
  paniers, filtrée à la frappe. Pas de debounce : le filtrage est en mémoire.
- **Filtre par type** : peuplé uniquement avec les types réellement présents.
  Un professeur qui ne fait que des diaporamas ne voit pas quatorze entrées
  inutiles.
- **`⋯`** regroupe Exporter, Importer, Nettoyer (entrées > 6 mois), Vider. Les
  deux destructives y sont ensemble, en bas, séparées d'un trait.
- Tous ces contrôles deviennent de vrais `<button>` : ce sont aujourd'hui des
  `<span>`, inatteignables au clavier.
- Quand des entrées dépassent 6 mois, l'en-tête l'annonce : « 7 entrées de
  plus de 6 mois · Nettoyer ». Le nettoyage épargne les entrées épinglées.

### Liste

Séparateurs chronologiques : « 📌 Épinglés » (hors chronologie, en tête), puis
« Aujourd'hui », « Cette semaine », « Septembre 2026 »…

### Carte

```
┌─────────────────────────────────────────────────────────┐
│ ☑ 📊 Tables de multiplication 6e        il y a 2 h   ⋯  │
│    3 activités · 12 questions · Diaporama               │
│    ▸ Détail des paniers                                 │
│    [🎯 Ouvrir] [🎲 Autres données] [🛠] [♻️] [📌] [❌]   │
└─────────────────────────────────────────────────────────┘
```

- Titre renommable en place (`contenteditable` sur le `span`, validé à `blur`
  et `Entrée`, `Échap` annule).
- Date relative affichée, date complète en `title`.
- Contenu des paniers dans un `<details>` replié par défaut : une vingtaine
  d'entrées tiennent à l'écran, contre trois aujourd'hui.
- « 🎯 Ouvrir » et « 🎲 Autres données » restent de vrais `<a href>` : on doit
  pouvoir les ouvrir dans un nouvel onglet et copier le lien au clic droit. Ce
  sont les deux seules actions qui ne sont pas des boutons, et c'est délibéré.
- « ❌ Supprimer » retire l'entrée et affiche « Entrée supprimée · Annuler »
  pendant 6 s.

### État vide

Inexistant aujourd'hui : l'onglet s'ouvre sur du blanc. Deux messages :

- historique vide : explication du remplissage par les boutons
  « → Historique » ;
- filtre sans résultat : « Aucun résultat pour "thalès" · Effacer la
  recherche ».

### Import

L'import lit du JSON, le valide (`valideImport`), puis **demande** : fusionner
avec l'existant, ou remplacer. Les fichiers `.html` des anciens exports restent
acceptés, via le parseur inerte de la migration.

### Mobile et accessibilité

- Palier `max-width: 600px`, déjà utilisé dans la feuille : actions en icônes
  seules, métadonnées repliées sous le titre.
- Animations soumises à `prefers-reduced-motion`, comme le reste de la feuille
  (l.412, l.1161).
- Contrôles au clavier, `aria-label` sur les actions en icône seule, zone
  d'annonce `aria-live="polite"` pour les suppressions et les résultats de
  recherche.

## Robustesse

- **Quota.** `localStorage` plafonne autour de 5 Mo. Le JSON est plus compact
  que le HTML actuel, donc la marge augmente. `sauver()` capture
  `QuotaExceededError` et propose le nettoyage, au lieu de l'échec muet
  d'aujourd'hui.
- **Données corrompues.** `charger()` sur un JSON illisible ne vide pas
  l'historique : il conserve la valeur brute sous `mm-historique-v2-corrompu`,
  repart sur une liste vide et le signale.
- **Titres.** Les titres saisis sont insérés en `textContent`, jamais en
  `innerHTML`.

## Tests

Stratégie du projet : logique pure au `node --test`, UI vérifiée à la main.

`src/js/mods/historiqueDef.test.mjs` :

- `normalise` : champs manquants complétés ; `epingle` absent → `false` ;
  `modifie` absent → `cree`.
- `fusionne` : `id` disjoints → union ; `id` commun → la version au `modifie`
  le plus récent gagne ; fusion idempotente ; fusion commutative sur le
  résultat.
- `filtre` : correspondance sur le titre, sur un titre d'activité d'un panier,
  insensible à la casse et aux accents ; recherche vide → tout ; type inconnu →
  aucun résultat.
- `trie` : épinglés en tête quel que soit `modifie` ; tri décroissant ensuite.
- `groupeParDate` : bornes aujourd'hui/semaine/mois autour d'une date fixée.
- `valideImport` : objet valide accepté ; version absente refusée ; entrée sans
  `url` refusée ; fichier vide refusé ; les erreurs sont explicites.
- `anciennes` : les épinglées ne sont jamais retournées.

Vérifications manuelles : ranger une entrée de chaque type ; migrer un
`localStorage` réel issu de la version actuelle ; renommer, épingler,
rechercher, filtrer, supprimer puis annuler ; exporter en JSON et réimporter en
fusion puis en remplacement ; importer un ancien export `.html` ; vérifier
qu'un titre contenant `<script>` s'affiche littéralement ; recharger la page et
retrouver l'état ; contrôler les raccourcis « reprendre » de l'accueil.

## Préparation du lot 2 (nuage)

Non implémenté ici. Cette section fixe ce que le lot 1 garantit.

**Transport.** Le WebDAV des partages publics bloque en CORS — constaté et
documenté côté `qcmcam2` (`docs/specs/nextcloud-library.md`), non contournable
depuis le navigateur. `proxy/nextcloud.php` de `qcmcam2` (410 lignes) se porte
quasi tel quel : POST en entrée, méthodes limitées à
`PROPFIND|GET|PUT|DELETE|MKCOL`, port 443 seul, contrôle d'origine, liste
blanche d'hébergeurs (`webdavhosts.php`), aucun log du contenu ni des secrets.
Il se déploie là où vit déjà `getshort.php` (`MM.js:3217`), c'est-à-dire sur
mathsmentales.net — GitLab Pages n'exécute aucun PHP. Comme dans `qcmcam2`,
l'URL du proxy sera **absolue** : l'application doit fonctionner depuis les
deux origines.

**Modes d'accès**, repris de `personalStorage.ts` : lien de partage protégé par
mot de passe (Nextcloud/apps.education.fr), ou compte WebDAV quelconque
(kDrive, Synology, Infomaniak). Le mode se déduit de l'URL saisie (`/s/<jeton>`
→ partage, sinon racine de compte). `https` imposé.

**Disposition distante.** Un seul fichier `MathsMentales/historique.json`, au
format d'export du lot 1. Une requête pour lire, une pour écrire. Un fichier
par entrée imposerait un `PROPFIND` puis N `GET` pour un gain nul sur une liste
plate. Point à trancher au lot 2 : la taille, au-delà de quelques centaines
d'entrées avec le détail des paniers.

**Fusion plutôt qu'écrasement.** `qcmcam2` écrase (`groupes.json`,
`sessions.json`) faute d'identifiants stables partagés entre postes. Ici l'`id`
est stable et `modifie` tranche : `historiqueDef.fusionne` fait converger deux
postes (maison / salle de classe) sans perte, ce qui est le cas d'usage visé.

**Ce que le lot 1 garantit.** `exporterJSON()` et
`importerJSON(texte, "fusion")` **sont** déjà l'opération de synchronisation,
sans le réseau. Le lot 2 n'ajoute qu'un transport et un écran de configuration.
Aucune reprise du modèle, aucune seconde migration.

**Secrets.** Le mot de passe d'application ne va pas en clair dans
`localStorage` par défaut : `sessionStorage`, sauf « Retenir sur cet appareil »
explicitement coché — même règle que `personalStorage.ts`.

## Découpage prévisionnel

1. `historiqueDef.js` + `historiqueDef.test.mjs` : modèle pur, table `TYPES`,
   fusion, filtrage, tri, groupement, validation.
2. `historique.js`, moitié stockage : `charger`/`sauver`, migration depuis
   `history`, garde-fou de quota.
3. `historique.js`, moitié vue : structure de l'onglet, cartes, délégation
   d'évènements ; `index.html` et `mathsmentales.css` mis à jour.
4. Bascule de `MM.js` : `paniersVersDonnees()`, `copyURLtoHistory()` réduite,
   suppression des neuf fonctions d'historique ; `lib.mathsmentales.js` appelle
   `historique.monter()` et alimente les raccourcis « reprendre » depuis le
   mod.
5. Recherche, filtres, épinglage, renommage, nettoyage > 6 mois.
6. Export/import JSON, lecture des anciens `.html`, état vide, annulation de
   suppression.
