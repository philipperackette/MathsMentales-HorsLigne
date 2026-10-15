# Utiliser MathsMentales sans internet

Cette copie de MathsMentales peut fonctionner sur un ordinateur **sans connexion internet**, sous **Windows** ou **macOS**, sans rien installer : un petit serveur web, déjà inclus, tourne sur l'ordinateur pendant l'utilisation et ouvre MathsMentales dans le navigateur.

> Pourquoi un serveur ? Le navigateur refuse de faire fonctionner MathsMentales si l'on ouvre simplement le fichier `index.html` : il faut passer par une adresse web, même locale (`http://127.0.0.1:1180`). Ce serveur n'est accessible que depuis l'ordinateur lui-même, pas depuis le réseau.

## 1. Récupérer MathsMentales (une seule fois, avec internet)

1. Sur la page GitHub du dépôt, cliquez sur le bouton vert **Code**, puis **Download ZIP**.
2. Décompressez le fichier ZIP :
   - **Windows** : clic droit sur le ZIP, **Extraire tout…** (ne lancez rien depuis l'intérieur du ZIP) ;
   - **Mac** : double-clic sur le ZIP.
3. Rangez le dossier obtenu où vous voulez (Documents, clé USB…). Il fonctionne depuis n'importe quel emplacement.

## 2. Lancer MathsMentales

### Windows (10 et 11)

1. Double-cliquez sur **`MathsMentales-Windows.cmd`**.
2. La première fois, Windows peut afficher « Windows a protégé votre ordinateur » : cliquez sur **Informations complémentaires**, puis **Exécuter quand même**.
3. Une fenêtre noire s'ouvre, puis MathsMentales s'affiche dans le navigateur.
4. **Laissez la fenêtre noire ouverte** pendant l'utilisation. Pour arrêter, fermez-la.

### Mac

1. Double-cliquez sur **`MathsMentales-Mac.command`**.
2. La première fois, macOS peut refuser de l'ouvrir (« développeur non identifié » ou « Apple n'a pas pu vérifier… ») :
   - macOS 15 et suivants : ouvrez **Réglages Système → Confidentialité et sécurité**, descendez jusqu'au message concernant `MathsMentales-Mac.command` et cliquez sur **Ouvrir quand même** ;
   - versions précédentes : clic droit (ou Ctrl+clic) sur le fichier, **Ouvrir**, puis **Ouvrir**.
3. Une fenêtre du Terminal s'ouvre, puis MathsMentales s'affiche dans le navigateur.
4. **Laissez la fenêtre du Terminal ouverte** pendant l'utilisation. Pour arrêter, fermez-la (ou Ctrl+C).

Autre possibilité sur Mac, sans message de sécurité : ouvrez l'application **Terminal**, tapez `perl ` (avec une espace), faites glisser dans la fenêtre le fichier `hors-ligne/serveur.pl` du dossier MathsMentales, puis appuyez sur Entrée.

## 3. Bon à savoir

- **Historique** : MathsMentales garde l'historique des diaporamas dans le navigateur, pour l'adresse `http://127.0.0.1:1180`. Utilisez toujours le même navigateur pour le retrouver. Si le port 1180 est déjà occupé, le serveur prend le suivant (1181…) et le signale : l'historique est alors distinct.
- **Ce qui ne fonctionne pas sans internet** : ce qui dépend du serveur officiel mathsmentales.net, comme les liens courts ou la synchronisation de l'historique en ligne.
- **Mettre à jour** : téléchargez de nouveau le ZIP et remplacez l'ancien dossier.
- **Ça ne démarre pas sous Windows** (la fenêtre se ferme ou parle de scripts désactivés) : l'administration informatique de l'établissement bloque peut-être les scripts PowerShell ; c'est à voir avec elle.
- **Ancien lanceur** : `public/startMM.cmd` fonctionne toujours ; il appelle désormais `MathsMentales-Windows.cmd`.

## Pour les curieux

Les serveurs sont dans le dossier `hors-ligne/` :

- `serveur.ps1` (Windows) utilise Windows PowerShell 5.1, inclus dans Windows 10 et 11 ;
- `serveur.pl` (macOS, Linux) utilise Perl, inclus dans macOS.

Tous deux servent le dossier MathsMentales tel quel, n'écoutent que sur `127.0.0.1`, refusent toute adresse qui sortirait du dossier, et ouvrent `src/index.html`, comme le faisait l'ancien lanceur `public/startMM.cmd` avec RebexTinyWebServer. Sur Linux : `perl hors-ligne/serveur.pl`.
