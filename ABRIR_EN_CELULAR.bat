@echo off
setlocal
title ABRIR EN CELULAR - SISTEMA HORIZON
color 0A

echo ======================================================
echo       CONECTAR DESDE EL CELULAR
echo ======================================================
echo.
echo Para usar la app en tu celular:
echo 1. Conecta tu celular al WIFI (el mismo que esta PC).
echo 2. Abre el navegador (Chrome/Safari) en tu celular.
echo 3. Escribe EXACTAMENTE esta direccion:
echo.

:: Intentar obtener la IP (funciona en espanol e ingles)
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set IP=%%a
)
:: Limpiar espacios en blanco
set IP=%IP: =%

if "%IP%"=="" (
    echo [ERROR] No se pudo detectar la IP automaticamente.
    echo Por favor, busca tu IP manualmente.
) else (
    echo      http://%IP%:3000
    echo.
    echo.
    echo      (Ejemplo: http://192.168.100.3:3000)
    echo.
)
echo ======================================================
echo.
echo Presiona cualquier tecla para INICIAR el sistema...
pause >nul

echo.
echo Iniciando servidor... no cierres esta ventana.
echo.

:: Iniciar servidor
call npm run dev
