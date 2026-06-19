# Muestra la IPv4 del PC para conectar celulares (Wi-Fi preferido, Ethernet si no hay Wi-Fi).
# Excluye adaptadores virtuales (VirtualBox, VMware, Hyper-V, WSL, Docker, etc.).
param(
  [int]$WebPort = 8080,
  [int]$ApiPort = 3000,
  [switch]$Compact
)

$ErrorActionPreference = 'SilentlyContinue'

$ExcludeAdapter = 'Loopback|VirtualBox|VMware|Hyper-V|vEthernet|WSL|Docker|Virtual|TAP|TUN|Npcap|Bluetooth|VPN|Host-Only|Default Switch|Kernel Debug|Npcap Loopback'
$WifiPattern = 'Wi-Fi|WLAN|Wireless|802\.11'
$EthPattern = 'Ethernet|Etherneto|Conexi.n de .rea local|\bLAN\b'

function Get-AdapterIpv4 {
  param([Microsoft.Management.Infrastructure.CimInstance]$NetAdapter)

  Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex $NetAdapter.ifIndex |
    Where-Object {
      $_.IPAddress -notlike '127.*' -and
      $_.IPAddress -notlike '169.254.*' -and
      $_.IPAddress -notlike '192.168.56.*'
    } |
    Select-Object -First 1
}

function Find-RestaurantLanAdapter {
  $up = @(Get-NetAdapter | Where-Object {
    $_.Status -eq 'Up' -and $_.Name -notmatch $ExcludeAdapter
  })

  if ($up.Count -eq 0) { return $null }

  $wifi = @($up | Where-Object { $_.Name -match $WifiPattern } | Select-Object -First 1)
  if ($wifi.Count -gt 0) { return $wifi[0] }

  $eth = @($up | Where-Object {
    $_.Name -match $EthPattern -and $_.Name -notmatch $WifiPattern
  } | Select-Object -First 1)
  if ($eth.Count -gt 0) { return $eth[0] }

  return ($up | Select-Object -First 1)
}

$adapter = Find-RestaurantLanAdapter

if (-not $adapter) {
  if ($Compact) {
    Write-Host '  [AVISO] No se detecto Wi-Fi ni Ethernet activos (sin adaptadores virtuales).'
    Write-Host '          Ejecuta mostrar-ip.bat o ipconfig tras conectar la red.'
  } else {
    Write-Host 'No se detecto Wi-Fi ni Ethernet activos.' -ForegroundColor Yellow
    Write-Host 'Conecta el PC a la red del restaurante y revisa ipconfig.' -ForegroundColor Yellow
  }
  exit 1
}

$addr = Get-AdapterIpv4 -NetAdapter $adapter
if (-not $addr) {
  if ($Compact) {
    Write-Host "  [AVISO] Adaptador $($adapter.Name) activo pero sin IPv4 valida."
  } else {
    Write-Host "Adaptador $($adapter.Name) activo pero sin IPv4 valida." -ForegroundColor Yellow
  }
  exit 1
}

$ip = $addr.IPAddress
$webUrl = "http://${ip}:$WebPort"
$apiUrl = "http://${ip}:$ApiPort"
$healthUrl = "$apiUrl/health"
$kind = if ($adapter.Name -match $WifiPattern) { 'Wi-Fi' } else { 'Ethernet' }

if ($Compact) {
  Write-Host "  Adaptador: $kind ($($adapter.Name))"
  Write-Host "  En el CELULAR (misma red), abre:"
  Write-Host "    $webUrl"
  Write-Host "  Comprobar API:"
  Write-Host "    $healthUrl"
} else {
  Write-Host "Adaptador: $kind - $($adapter.Name)" -ForegroundColor Cyan
  Write-Host "IPv4:      $ip" -ForegroundColor Green
  Write-Host ""
  Write-Host "En el CELULAR (misma red Wi-Fi o cable al mismo router), abre:" -ForegroundColor Green
  Write-Host "  $webUrl"
  Write-Host ""
  Write-Host "Prueba el API desde el celular:" -ForegroundColor Green
  Write-Host "  $healthUrl"
  Write-Host ""
  Write-Host "En ESTE PC (navegador local):" -ForegroundColor DarkGray
  Write-Host "  http://localhost:$WebPort"
}

exit 0
