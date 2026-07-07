# Delega al script portable del paquete on-prem (DrewRest o legado LaReserva).
param(
  [int]$WebPort = 8080,
  [int]$ApiPort = 3000,
  [switch]$Compact
)

$candidates = @(
  (Join-Path $PSScriptRoot '..\DrewRest\scripts\show-lan-ip.ps1'),
  (Join-Path $PSScriptRoot '..\LaReserva\scripts\show-lan-ip.ps1')
)

$local = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $local) {
  Write-Host "No se encuentra DrewRest\scripts\show-lan-ip.ps1" -ForegroundColor Red
  exit 1
}

& $local -WebPort $WebPort -ApiPort $ApiPort @PSBoundParameters
