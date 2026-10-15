@echo off
rem MathsMentales sans connexion internet (Windows 10 et 11).
rem Double-cliquez sur ce fichier, puis laissez la fenetre ouverte pendant l'utilisation.
rem Le serveur local est hors-ligne\serveur.ps1 (Windows PowerShell, deja installe).
title MathsMentales - sans internet
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0hors-ligne\serveur.ps1" %*
if errorlevel 1 pause
