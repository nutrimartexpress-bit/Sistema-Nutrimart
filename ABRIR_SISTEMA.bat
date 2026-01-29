@echo off
setlocal
title SISTEMA DE FACTURACION HORIZON 2026
echo ======================================================
echo       SISTEMA DE FACTURACION HORIZON 2026
echo ======================================================
echo.
echo Iniciando servidor local y abriendo el sistema...
echo.
cd /d "%~dp0"

:: Abrir el navegador automaticamente
start "" "http://localhost:3000"

:: Lanzar el servidor de desarrollo
npm run dev

echo.
echo El servidor se ha detenido. Presione cualquier tecla para salir.
pause
