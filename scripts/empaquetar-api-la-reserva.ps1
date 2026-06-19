# Copia el API compilado a LaReserva\api\ para usar con LaReserva\inicio.bat
# Uso (desde la raiz del repo, carpeta App):
#   powershell -ExecutionPolicy Bypass -File scripts\empaquetar-api-la-reserva.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$ApiSrc = Join-Path $RepoRoot "services\api"
$ApiDst = Join-Path $RepoRoot "LaReserva\api"
$SharedSrc = Join-Path $RepoRoot "packages\shared-domain"
$VendorDst = Join-Path $ApiDst "vendor\shared-domain"
$MainJs = Join-Path $ApiSrc "dist\main.js"
$MainJsNested = Join-Path $ApiSrc "dist\src\main.js"

if (-not (Test-Path $MainJs) -and (Test-Path $MainJsNested)) {
  $MainJs = $MainJsNested
}

if (-not (Test-Path $MainJs)) {
  Write-Host ""
  Write-Host "No existe dist\main.js (ni dist\src\main.js). Primero compila el API:" -ForegroundColor Yellow
  Write-Host "  npm run la-reserva:empaquetar-api" -ForegroundColor Cyan
  Write-Host "  (o: cd services\api && npm run build)" -ForegroundColor Cyan
  Write-Host ""
  exit 1
}

if (-not (Test-Path (Join-Path $SharedSrc "dist\index.js"))) {
  Write-Host "Falta packages\shared-domain\dist. Ejecuta: npm run shared-domain:build" -ForegroundColor Red
  exit 1
}

Write-Host "Origen API: $ApiSrc"
Write-Host "Destino:    $ApiDst"
Write-Host ""

New-Item -ItemType Directory -Force -Path $ApiDst | Out-Null

Write-Host "[1/4] Copiando dist, prisma y scripts..."
Remove-Item -Path (Join-Path $ApiDst "dist") -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path (Join-Path $ApiDst "prisma") -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path (Join-Path $ApiSrc "dist") -Destination (Join-Path $ApiDst "dist") -Recurse -Force
Copy-Item -Path (Join-Path $ApiSrc "prisma") -Destination (Join-Path $ApiDst "prisma") -Recurse -Force

$bootstrapSrc = Join-Path $RepoRoot "scripts\bootstrap-inicial-api.js"
if (Test-Path $bootstrapSrc) {
  $dstScripts = Join-Path $ApiDst "scripts"
  New-Item -ItemType Directory -Force -Path $dstScripts | Out-Null
  Copy-Item -Path $bootstrapSrc -Destination (Join-Path $dstScripts "bootstrap-inicial.js") -Force
}

function Write-Utf8NoBom {
  param([string]$Path, [string]$Content)
  [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))
}

Write-Host "[2/4] Empaquetando shared-domain en vendor\ (portable, sin monorepo)..."
Remove-Item -Path (Join-Path $ApiDst "vendor") -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $VendorDst | Out-Null
Copy-Item -Path (Join-Path $SharedSrc "dist") -Destination (Join-Path $VendorDst "dist") -Recurse -Force

$sharedPkg = Get-Content (Join-Path $SharedSrc "package.json") -Raw | ConvertFrom-Json
$vendorPkg = [ordered]@{
  name = $sharedPkg.name
  version = $sharedPkg.version
  private = $true
  main = $sharedPkg.main
  types = $sharedPkg.types
  exports = $sharedPkg.exports
}
Write-Utf8NoBom -Path (Join-Path $VendorDst "package.json") -Content ($vendorPkg | ConvertTo-Json -Depth 20)

Write-Host "[3/4] Generando package.json de produccion..."
$pkgRaw = Get-Content (Join-Path $ApiSrc "package.json") -Raw | ConvertFrom-Json
$prod = [ordered]@{
  name = $pkgRaw.name
  version = $pkgRaw.version
  private = $true
  license = "UNLICENSED"
  scripts = [ordered]@{
    postinstall = "prisma generate"
    "prisma:deploy" = "prisma migrate deploy"
  }
  prisma = $pkgRaw.prisma
  dependencies = [ordered]@{}
}

foreach ($prop in $pkgRaw.dependencies.PSObject.Properties) {
  if ($prop.Name -eq "@la-reserva/shared-domain") {
    $prod.dependencies["@la-reserva/shared-domain"] = "file:./vendor/shared-domain"
  } else {
    $prod.dependencies[$prop.Name] = $prop.Value
  }
}
# Prisma CLI necesario en el PC del restaurante para migrate deploy
$prod.dependencies["prisma"] = "5.22.0"

Write-Utf8NoBom -Path (Join-Path $ApiDst "package.json") -Content ($prod | ConvertTo-Json -Depth 20)

Remove-Item -Path (Join-Path $ApiDst "package-lock.json") -Force -ErrorAction SilentlyContinue

$envExample = Join-Path $ApiSrc ".env.example"
if (Test-Path $envExample) {
  Copy-Item $envExample (Join-Path $ApiDst ".env.example") -Force
  if (-not (Test-Path (Join-Path $ApiDst ".env"))) {
    Copy-Item $envExample (Join-Path $ApiDst ".env")
    Write-Host "      Creado api\.env desde .env.example (edita DATABASE_URL y JWT_SECRET)."
  } else {
    Write-Host "      Se conserva api\.env existente."
  }
}

Write-Host "[4/4] npm install --omit=dev (dependencias + node_modules portable)..."
Push-Location $ApiDst
try {
  npm install --omit=dev
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
  Pop-Location
}

Write-Host ""
Write-Host "Listo: LaReserva\api" -ForegroundColor Green
Write-Host "Siguiente: npm run la-reserva:empaquetar-web  (o la-reserva:empaquetar todo)" -ForegroundColor Green
Write-Host "Luego en el PC destino: LaReserva\inicio.bat" -ForegroundColor Green
Write-Host ""
