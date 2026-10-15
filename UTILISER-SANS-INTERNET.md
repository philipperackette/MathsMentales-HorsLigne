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

#### Premier lancement (une seule fois)

macOS bloque au premier lancement les fichiers téléchargés sur internet qui ne sont pas signés par un développeur enregistré auprès d'Apple (l'enregistrement est payant). C'est le cas de `MathsMentales-Mac.command` : il s'agit d'un simple fichier texte de quelques lignes, que vous pouvez lire avec TextEdit avant de le lancer. Voici comment l'autoriser.

1. Double-cliquez sur **`MathsMentales-Mac.command`**.
2. macOS affiche : « *« MathsMentales-Mac.command » n'a pas été ouvert* » (ou, selon la version, « *Apple n'a pas pu confirmer que « MathsMentales-Mac.command » ne contenait pas de logiciels malveillants…* »).
   Cliquez sur **Terminé**. ⚠️ **Ne cliquez pas sur « Placer dans la corbeille »**, qui supprimerait le fichier.
3. Ouvrez le menu Apple (la pomme en haut à gauche de l'écran) → **Réglages Système…** → **Confidentialité et sécurité**, puis descendez jusqu'à la rubrique **Sécurité**. Vous y trouvez :
   > *« MathsMentales-Mac.command » a été bloqué pour protéger votre Mac.*

   Cliquez sur **Ouvrir quand même**. Ce bouton n'apparaît que pendant environ une heure après l'étape 1 ; s'il n'est plus là, recommencez à l'étape 1.
4. macOS demande une dernière confirmation : cliquez sur **Ouvrir quand même**, puis saisissez le mot de passe de la session (ou utilisez Touch ID).
5. Une fenêtre du Terminal s'ouvre, puis MathsMentales s'affiche dans le navigateur.
6. Si macOS demande si **« Terminal » peut accéder aux fichiers** de votre dossier Téléchargements (ou Documents, Bureau), cliquez sur **Autoriser** : sans cela, le serveur ne peut pas lire les fichiers de MathsMentales et la page reste vide ou incomplète.

Sur les versions de macOS antérieures à macOS 15 (Sequoia), on peut aussi faire, à la place des étapes 2 à 4 : clic droit (ou Ctrl+clic) sur le fichier → **Ouvrir**, puis **Ouvrir**.

Cette autorisation est mémorisée : les fois suivantes, un double-clic suffit. Elle est à refaire si vous téléchargez une nouvelle version du ZIP.

#### Utilisation habituelle

1. Double-cliquez sur **`MathsMentales-Mac.command`** : le Terminal s'ouvre, puis MathsMentales s'affiche dans le navigateur.
2. **Laissez la fenêtre du Terminal ouverte** pendant l'utilisation (vous pouvez la réduire dans le Dock).
3. Pour arrêter, fermez la fenêtre du Terminal (ou Ctrl+C). Si le Terminal demande s'il faut mettre fin aux processus en cours, cliquez sur **Terminer**.

#### Sans aucun message de sécurité

Ouvrez l'application **Terminal** (Applications → Utilitaires), tapez `perl ` (avec une espace à la fin), faites glisser dans la fenêtre le fichier `hors-ligne/serveur.pl` du dossier MathsMentales, puis appuyez sur Entrée. MathsMentales s'ouvre dans le navigateur ; fermez la fenêtre du Terminal pour l'arrêter.

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
