# Copia el API compilado a LaReserva\api\ para usar con LaReserva\inicio.bat
# Uso (desde la raiz del repo, carpeta App):
#   powershell -ExecutionPolicy Bypass -File scripts\empaquetar-api-la-reserva.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$ApiSrc = Join-Path $RepoRoot "services\api"
$ApiDst = Join-Path $RepoRoot "LaReserva\api"
$MainJs = Join-Path $ApiSrc "dist\main.js"
$MainJsNested = Join-Path $ApiSrc "dist\src\main.js"

if (-not (Test-Path $MainJs) -and (Test-Path $MainJsNested)) {
  $MainJs = $MainJsNested
}

if (-not (Test-Path $MainJs)) {
  Write-Host ""
  Write-Host "No existe dist\main.js (ni dist\src\main.js). Primero compila el API:" -ForegroundColor Yellow
  Write-Host "  cd services\api" -ForegroundColor Cyan
  Write-Host "  npm run build" -ForegroundColor Cyan
  Write-Host ""
  exit 1
}

Write-Host "Origen: $ApiSrc"
Write-Host "Destino: $ApiDst"
Write-Host ""

New-Item -ItemType Directory -Force -Path $ApiDst | Out-Null

Write-Host "[1/3] Copiando dist y prisma..."
Remove-Item -Path (Join-Path $ApiDst "dist") -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path (Join-Path $ApiDst "prisma") -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path (Join-Path $ApiSrc "dist") -Destination (Join-Path $ApiDst "dist") -Recurse -Force
Copy-Item -Path (Join-Path $ApiSrc "prisma") -Destination (Join-Path $ApiDst "prisma") -Recurse -Force
Copy-Item -Path (Join-Path $ApiSrc "package.json") -Destination (Join-Path $ApiDst "package.json") -Force
if (Test-Path (Join-Path $ApiSrc "package-lock.json")) {
  Copy-Item -Path (Join-Path $ApiSrc "package-lock.json") -Destination (Join-Path $ApiDst "package-lock.json") -Force
}
$bootstrapSrc = Join-Path $RepoRoot "scripts\bootstrap-inicial-api.js"
if (Test-Path $bootstrapSrc) {
  $dstScripts = Join-Path $ApiDst "scripts"
  New-Item -ItemType Directory -Force -Path $dstScripts | Out-Null
  Copy-Item -Path $bootstrapSrc -Destination (Join-Path $dstScripts "bootstrap-inicial.js") -Force
}

$envExample = Join-Path $ApiSrc ".env.example"
if (Test-Path $envExample) {
  Copy-Item $envExample (Join-Path $ApiDst ".env.example") -Force
  if (-not (Test-Path (Join-Path $ApiDst ".env"))) {
    Copy-Item $envExample (Join-Path $ApiDst ".env")
    Write-Host "      Creado .env desde .env.example. Edita USER, PASSWORD y JWT_SECRET en LaReserva\api\.env"
  }
}

Write-Host "[2/3] npm ci --omit=dev (instala dependencias de produccion en LaReserva\api)..."
Push-Location $ApiDst
try {
  npm ci --omit=dev
} finally {
  Pop-Location
}

Write-Host "[3/3] Listo."
Write-Host ""
Write-Host "Siguiente paso: si aun no existe, crea LaReserva\api\.env (puedes partir de .env.example)." -ForegroundColor Green
Write-Host "Luego ejecuta LaReserva\inicio.bat" -ForegroundColor Green
Write-Host ""
