
# Script de Resguardo de Código Versionado
# ---------------------------------------------

# Leer versión desde package.json
$packageContent = Get-Content "package.json" | ConvertFrom-Json
$version = $packageContent.version -replace '\.', '-'

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupName = "V$($version)_BACKUP_$timestamp"
$backupPath = Join-Path (Get-Location) "backups\$backupName"

Write-Host "--- Iniciando Resguardo de Sistema Version: v$($packageContent.version) ---" -ForegroundColor Cyan

# Crear carpeta de backup
if (!(Test-Path $backupPath)) {
    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
}

$itemsToBackup = @("src", "public", "package.json", "vite.config.js", ".env", "index.html", "tailwind.config.js", "postcss.config.js")

foreach ($item in $itemsToBackup) {
    if (Test-Path $item) {
        Write-Host "Copiando $item..."
        Copy-Item -Path $item -Destination $backupPath -Recurse -Force
    }
}

Write-Host "--- Resguardo completado con éxito en: $backupPath ---" -ForegroundColor Green
