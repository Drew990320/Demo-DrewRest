# Muestra IPv4 utiles para EXPO_PUBLIC_API_URL (API en el PC, app en el movil).
Write-Host "Adaptadores IPv4 (referencia):" -ForegroundColor Cyan
Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.PrefixOrigin -ne 'WellKnown' -or $_.InterfaceAlias -notmatch 'Loopback' } |
  Where-Object { $_.IPAddress -notlike '169.254.*' } |
  Sort-Object InterfaceAlias |
  ForEach-Object { Write-Host ("  {0,-28} {1}" -f $_.InterfaceAlias, $_.IPAddress) }

Write-Host ""
Write-Host "Notas:" -ForegroundColor DarkGray
Write-Host "  - 192.168.56.x suele ser VirtualBox/red virtual: el telefono en Wi-Fi no la usa."
Write-Host "  - Para el celular en la misma Wi-Fi que este PC, usa la IP del adaptador Wi-Fi (abajo)."
Write-Host ""

$wifi = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -notlike '169.254.*' -and
    $_.InterfaceAlias -match 'Wi-Fi|WLAN|Wireless|802\.11'
  } |
  Select-Object -First 1

if ($wifi) {
  $url = "http://$($wifi.IPAddress):3000"
  $web = "http://$($wifi.IPAddress):8080"
  Write-Host "En el CELULAR (misma Wi-Fi), abre en el navegador:" -ForegroundColor Green
  Write-Host "  $web"
  Write-Host ""
  Write-Host "Prueba el API desde el celular:" -ForegroundColor Green
  Write-Host "  $url/health"
  Write-Host ""
  Write-Host "Para empaquetar APK/web con esta IP (opcional en dev):" -ForegroundColor DarkGray
  Write-Host "  EXPO_PUBLIC_API_URL=$url"
} else {
  Write-Host "No se detecto adaptador Wi-Fi por nombre. Elige la IP de la red donde esta el telefono" -ForegroundColor Yellow
  Write-Host "  (suele ser 192.168.x.x en la misma subred que el router)." -ForegroundColor Yellow
  Write-Host '  Ejemplo: EXPO_PUBLIC_API_URL=http://192.168.1.7:3000'
}
