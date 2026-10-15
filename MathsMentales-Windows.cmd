@echo off
rem MathsMentales sans connexion internet (Windows 10 et 11).
rem Double-cliquez sur ce fichier, puis laissez la fenetre ouverte pendant l'utilisation.
rem Le serveur local est hors-ligne\serveur.ps1 (Windows PowerShell, deja installe).
setlocal
title MathsMentales - sans internet
cd /d "%~dp0"

if not exist "hors-ligne\serveur.ps1" (
    echo.
    echo  Le fichier hors-ligne\serveur.ps1 est introuvable.
    echo.
    echo  Le fichier ZIP n'a probablement pas ete decompresse :
    echo    1. fermez cette fenetre ;
    echo    2. clic droit sur le fichier ZIP, puis "Extraire tout..." ;
    echo    3. dans le dossier extrait, double-cliquez sur MathsMentales-Windows.cmd.
    echo.
    pause
    exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0hors-ligne\serveur.ps1" %*

rem On arrive ici seulement si le serveur s'est arrete : on garde la fenetre
rem ouverte pour que le message eventuel reste lisible.
echo.
echo  MathsMentales s'est arrete (code %errorlevel%).
echo  Si un message d'erreur est affiche ci-dessus, faites-en une capture d'ecran.
echo.
pause
