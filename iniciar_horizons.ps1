# -----------------------------
# Script seguro para iniciar Horizons
# -----------------------------

# Ruta de tu proyecto Horizons
$projectPath = "C:\Users\USER\Desktop\horizons-export-8133f64e-cdf8-4769-82d9-80717b17affc (2)"

# Cambiar a la carpeta del proyecto
Set-Location $projectPath

# Instalar dependencias si no existen
if (!(Test-Path "$projectPath\node_modules")) {
    Write-Output "Instalando dependencias..."
    npm install
} else {
    Write-Output "Dependencias ya instaladas."
}

# Iniciar Horizons en segundo plano
Write-Output "Iniciando Horizons..."
$process = Start-Process -FilePath "powershell.exe" -ArgumentList "npm start" -PassThru

# Esperar hasta que el servidor esté escuchando
$maxAttempts = 20
$attempt = 0
$serverUp = $false

while (-not $serverUp -and $attempt -lt $maxAttempts) {
    Start-Sleep -Seconds 2
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 1
        if ($response.StatusCode -eq 200) {
            $serverUp = $true
        }
    } catch {
        # No pasa nada, seguimos intentando
    }
    $attempt++
}

if ($serverUp) {
    Write-Output "Servidor listo. Abriendo navegador..."
    Start-Process "http://localhost:3000"
} else {
    Write-Output "No se pudo conectar al servidor en localhost:3000. Revisa Horizons."
}
