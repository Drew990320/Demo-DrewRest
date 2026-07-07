# Genera el export web de Expo y lo copia a DrewRest\web\ para inicio.bat
# Uso (desde la raiz del repo, carpeta App):
#   npm run DrewRest:Empaquetar-Web
#   powershell -ExecutionPolicy Bypass -File scripts\empaquetar-web-drewrest.ps1
#
# Opcional: variable de entorno EXPO_PUBLIC_API_URL antes de ejecutar (si no, lee apps\mobile\.env).

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$DrewRestRoot = Join-Path $RepoRoot "DrewRest\DrewRest"
if (-not (Test-Path (Join-Path $DrewRestRoot "inicio.bat"))) {
  $DrewRestRoot = Join-Path $RepoRoot "DrewRest"
}
$Mobile = Join-Path $RepoRoot "apps\mobile"
$ExportOut = Join-Path $Mobile "dist"
$WebDst = Join-Path $DrewRestRoot "web"

if (-not (Test-Path (Join-Path $Mobile "package.json"))) {
  Write-Host "No se encuentra apps\mobile." -ForegroundColor Red
  exit 1
}

$apiUrl = $env:EXPO_PUBLIC_API_URL
if (-not $apiUrl) {
  $envFile = Join-Path $Mobile ".env"
  if (Test-Path $envFile) {
    $line = Get-Content $envFile -ErrorAction SilentlyContinue | Where-Object { $_ -match '^\s*EXPO_PUBLIC_API_URL=' } | Select-Object -First 1
    if ($line -match 'EXPO_PUBLIC_API_URL=(.+)') {
      $apiUrl = $matches[1].Trim().Trim('"').Trim("'")
    }
  }
}
if (-not $apiUrl) {
  $apiUrl = "http://192.168.1.7:3000"
  Write-Host "Usando EXPO_PUBLIC_API_URL por defecto: $apiUrl" -ForegroundColor Yellow
  Write-Host "(Define apps\mobile\.env o la variable de entorno para otra IP)" -ForegroundColor Yellow
}

Write-Host "EXPO_PUBLIC_API_URL=$apiUrl"
Write-Host ""

$env:EXPO_PUBLIC_API_URL = $apiUrl
$env:EXPO_PUBLIC_LOCAL_MODE = "false"

Write-Host "[1/2] expo export --platform web (en apps\mobile)..."
Push-Location $Mobile
try {
  npx expo export --platform web
} finally {
  Pop-Location
}

if (-not (Test-Path (Join-Path $ExportOut "index.html"))) {
  Write-Host ""
  Write-Host "No se encontro dist\index.html tras el export." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "[2/2] Copiando a DrewRest\web..."
New-Item -ItemType Directory -Force -Path (Split-Path $WebDst) | Out-Null
if (Test-Path $WebDst) {
  Remove-Item -Path $WebDst -Recurse -Force
}
Copy-Item -Path $ExportOut -Destination $WebDst -Recurse -Force

$PublicDir = Join-Path $Mobile "public"
if (Test-Path $PublicDir) {
  Get-ChildItem -Path $PublicDir -File | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination (Join-Path $WebDst $_.Name) -Force
  }
}

$iconSrc = Join-Path $WebDst "favicon.ico"
$iconDst = Join-Path $DrewRestRoot "icon.ico"
if (Test-Path $iconSrc) {
  Copy-Item -Path $iconSrc -Destination $iconDst -Force
  Write-Host "Icono de acceso directo: DrewRest\icon.ico" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "Listo: $WebDst" -ForegroundColor Green
Write-Host "Ejecuta DrewRest\inicio.bat" -ForegroundColor Green
Write-Host ""
