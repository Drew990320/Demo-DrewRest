# Empaqueta API + web en DrewRest\ para copiar a otro PC.
# Uso (desde la raiz del repo):
#   npm run DrewRest:Empaquetar
#   powershell -ExecutionPolicy Bypass -File scripts\empaquetar-drewrest-completo.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot

Write-Host "=== DrewRest: empaquetado completo ===" -ForegroundColor Cyan
Write-Host ""

Push-Location $RepoRoot
try {
  npm run shared-domain:build
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  npm run api:build
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  & (Join-Path $PSScriptRoot "empaquetar-api-drewrest.ps1")
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  & (Join-Path $PSScriptRoot "empaquetar-web-drewrest.ps1")
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
  Pop-Location
}

Write-Host ""
Write-Host "=== Paquete listo en DrewRest\ ===" -ForegroundColor Green
Write-Host "Copia la carpeta DrewRest al PC del restaurante." -ForegroundColor Green
Write-Host "En ese PC: edita api\.env, activa licencia (bin\mostrar-id-maquina.bat) y ejecuta inicio.bat" -ForegroundColor Green
Write-Host ""
