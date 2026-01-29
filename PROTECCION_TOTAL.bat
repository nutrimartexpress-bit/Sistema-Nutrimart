@echo off
title PROTECCIÓN TOTAL DE DATOS - AGENTE BACKEND
echo ===================================================
echo   SISTEMA DE PROTECCION TOTAL DE DATOS (ANTIGRAVITY)
echo ===================================================
echo.
echo 1. Resguardando Codigo Fuente y Configuraciones...
powershell -ExecutionPolicy Bypass -File scripts\backup-code.ps1
echo.
echo 2. Resguardando Datos de la Nube (Supabase)...
node scripts\backup-supabase.js
echo.
echo ===================================================
echo   PROTECCION COMPLETADA EXITOSAMENTE
echo   Los archivos estan seguros en la carpeta /backups
echo ===================================================
pause
