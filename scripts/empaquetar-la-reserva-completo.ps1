# Empaqueta API + web en LaReserva\ para copiar a otro PC.
# Uso (desde la raiz del repo):
#   powershell -ExecutionPolicy Bypass -File scripts\empaquetar-la-reserva-completo.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot

Write-Host "=== La Reserva: empaquetado completo ===" -ForegroundColor Cyan
Write-Host ""

Push-Location $RepoRoot
try {
  npm run shared-domain:build
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  npm run api:build
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  & (Join-Path $PSScriptRoot "empaquetar-api-la-reserva.ps1")
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  & (Join-Path $PSScriptRoot "empaquetar-web-la-reserva.ps1")
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
  Pop-Location
}

Write-Host ""
Write-Host "=== Paquete listo en LaReserva\ ===" -ForegroundColor Green
Write-Host "Copia la carpeta LaReserva al PC del restaurante." -ForegroundColor Green
Write-Host "En ese PC: edita api\.env, activa licencia (bin\mostrar-id-maquina.bat) y ejecuta inicio.bat" -ForegroundColor Green
Write-Host ""
