
# Script de Restauración del Sistema
# ---------------------------------------------
# Uso: .\scripts\restore-system.ps1 -BackupFolder "NombreDeLaCarpetaEnBackups"

param (
    [Parameter(Mandatory = $true)]
    [string]$BackupFolder
)

$rootPath = Get-Location
$backupSource = Join-Path $rootPath "backups\$BackupFolder"

if (!(Test-Path $backupSource)) {
    Write-Host "Error: No se encontró la carpeta de backup $backupSource" -ForegroundColor Red
    exit
}

Write-Host "--- Iniciando Proceso de Restauración ---" -ForegroundColor Yellow
Write-Host "Origen: $BackupFolder"
Write-Host "Destino: RAÍZ DEL SISTEMA"

# Confirmación de seguridad
Write-Host "ADVERTENCIA: Se sobrescribirán los archivos actuales del sistema." -ForegroundColor Red

$itemsToRestore = @("src", "public", "package.json", "vite.config.js", ".env", "index.html", "tailwind.config.js", "postcss.config.js")

foreach ($item in $itemsToRestore) {
    $sourcePath = Join-Path $backupSource $item
    $destPath = Join-Path $rootPath $item

    if (Test-Path $sourcePath) {
        Write-Host "Restaurando $item..."
        if (Test-Path $destPath) {
            Remove-Item -Path $destPath -Recurse -Force | Out-Null
        }
        Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
    }
}

Write-Host "--- Restauración completada con éxito ---" -ForegroundColor Green
Write-Host "El sistema ha vuelto a la versión contenida en $BackupFolder"
