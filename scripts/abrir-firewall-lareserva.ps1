# Reglas entrantes TCP para La Reserva (ejecutar como administrador).
$ErrorActionPreference = 'Stop'
$rules = @(
  @{ Name = 'LaReserva API (3000)'; Port = 3000 },
  @{ Name = 'LaReserva Web (8080)'; Port = 8080 }
)
foreach ($r in $rules) {
  $existing = Get-NetFirewallRule -DisplayName $r.Name -ErrorAction SilentlyContinue
  if ($existing) {
    Write-Host "Ya existe: $($r.Name)" -ForegroundColor DarkGray
    continue
  }
  New-NetFirewallRule -DisplayName $r.Name -Direction Inbound -Action Allow -Protocol TCP -LocalPort $r.Port | Out-Null
  Write-Host "Creada regla: $($r.Name)" -ForegroundColor Green
}
Write-Host ""
Write-Host "Listo. Prueba desde el celular: http://IP_DEL_PC:8080" -ForegroundColor Green
Read-Host "Enter para cerrar"
