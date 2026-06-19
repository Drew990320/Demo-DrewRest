# Delega al script portable de LaReserva (misma logica en el PC del restaurante).
param(
  [int]$WebPort = 8080,
  [int]$ApiPort = 3000,
  [switch]$Compact
)

$local = Join-Path $PSScriptRoot '..\LaReserva\scripts\show-lan-ip.ps1'
if (-not (Test-Path $local)) {
  Write-Host "No se encuentra LaReserva\scripts\show-lan-ip.ps1" -ForegroundColor Red
  exit 1
}

& $local -WebPort $WebPort -ApiPort $ApiPort @PSBoundParameters
