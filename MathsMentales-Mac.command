#!/bin/bash
# MathsMentales sans connexion internet (macOS).
# Double-cliquez sur ce fichier, puis laissez la fenêtre du Terminal ouverte
# pendant l'utilisation. Le serveur local est hors-ligne/serveur.pl (Perl,
# déjà présent sur macOS).
cd "$(dirname "$0")" || exit 1
PERL=/usr/bin/perl
[ -x "$PERL" ] || PERL="$(command -v perl)"
if [ -z "$PERL" ]; then
    echo "Perl est introuvable sur ce Mac : impossible de lancer MathsMentales hors ligne."
    echo "Appuyez sur Entrée pour fermer."
    read -r
    exit 1
fi
exec "$PERL" hors-ligne/serveur.pl "$@"
