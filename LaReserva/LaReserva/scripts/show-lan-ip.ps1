# Muestra la IPv4 del PC para conectar celulares (Wi-Fi preferido, Ethernet si no hay Wi-Fi).
# Excluye adaptadores virtuales (VirtualBox, VMware, Hyper-V, WSL, Docker, etc.).
param(
  [int]$WebPort = 8080,
  [int]$ApiPort = 3000,
  [switch]$Compact
)

$ErrorActionPreference = 'SilentlyContinue'

$ExcludeAdapter = 'Loopback|VirtualBox|VMware|Hyper-V|vEthernet|WSL|Docker|Virtual|TAP|TUN|Npcap|Bluetooth|VPN|Host-Only|Default Switch|Kernel Debug|Npcap Loopback|Tailscale|ZeroTier|OpenVPN|Hamachi|Radmin'
$WifiPattern = 'Wi-?Fi|WLAN|Wireless|802\.11|Inalámbrica|Inalambrica'
$EthPattern = 'Ethernet|Etherneto|Conexi.n de .rea local|\bLAN\b|Red de .rea'

function Test-Ipv4Valida {
  param([string]$Ip)
  if ($Ip -like '127.*') { return $false }
  if ($Ip -like '169.254.*') { return $false }
  if ($Ip -like '192.168.56.*') { return $false }
  return $true
}

function Write-IpLine {
  param([string]$Text)
  if ($Compact) {
    Write-Output $Text
  } else {
    Write-Host $Text
  }
}

function Find-LanViaNetAdapter {
  $up = @(Get-NetAdapter | Where-Object {
    $_.Status -eq 'Up' -and $_.Name -notmatch $ExcludeAdapter
  })
  if ($up.Count -eq 0) { return $null }

  $ordered = @(
    $up | Where-Object { $_.Name -match $WifiPattern }
    $up | Where-Object { $_.Name -match $EthPattern -and $_.Name -notmatch $WifiPattern }
    $up
  ) | ForEach-Object { $_ } | Select-Object -First 1

  foreach ($adapter in $ordered) {
    if (-not $adapter) { continue }
    $addr = Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex $adapter.ifIndex |
      Where-Object { Test-Ipv4Valida $_.IPAddress } |
      Select-Object -First 1
    if ($addr) {
      return @{
        Name = $adapter.Name
        IP = $addr.IPAddress
        Kind = if ($adapter.Name -match $WifiPattern) { 'Wi-Fi' } elseif ($adapter.Name -match $EthPattern) { 'Ethernet' } else { 'Red' }
      }
    }
  }
  return $null
}

function Find-LanViaDotNet {
  $best = $null
  $bestPri = -1
  foreach ($ni in [System.Net.NetworkInterface]::GetAllNetworkInterfaces()) {
    if ($ni.OperationalStatus -ne [System.Net.NetworkOperationalStatus]::Up) { continue }
    $name = $ni.Name
    if ($name -match $ExcludeAdapter) { continue }

    $pri = 1
    if ($name -match $WifiPattern) { $pri = 3 }
    elseif ($name -match $EthPattern) { $pri = 2 }

    foreach ($ua in $ni.GetIPProperties().UnicastAddresses) {
      if ($ua.Address.AddressFamily -ne [System.Net.Sockets.AddressFamily]::InterNetwork) { continue }
      $ip = $ua.Address.ToString()
      if (-not (Test-Ipv4Valida $ip)) { continue }
      if ($pri -gt $bestPri) {
        $bestPri = $pri
        $kind = if ($name -match $WifiPattern) { 'Wi-Fi' } elseif ($name -match $EthPattern) { 'Ethernet' } else { 'Red' }
        $best = @{ Name = $name; IP = $ip; Kind = $kind }
      }
    }
  }
  return $best
}

$lan = Find-LanViaNetAdapter
if (-not $lan) {
  $lan = Find-LanViaDotNet
}

if (-not $lan) {
  Write-IpLine 'No se detecto una red activa con IP valida en este PC.'
  Write-IpLine 'Conecta el PC al Wi-Fi del restaurante y vuelve a intentar.'
  Write-IpLine 'Si ya estas conectado, abre CMD y ejecuta: ipconfig'
  exit 1
}

$ip = $lan.IP
$webUrl = "http://${ip}:$WebPort"
$apiUrl = "http://${ip}:$ApiPort"
$healthUrl = "$apiUrl/health"

if ($Compact) {
  Write-IpLine "Adaptador: $($lan.Kind) ($($lan.Name))"
  Write-IpLine 'En el CELULAR (misma red), abre:'
  Write-IpLine "  $webUrl"
  Write-IpLine 'Comprobar API:'
  Write-IpLine "  $healthUrl"
  Write-IpLine "En este PC: http://localhost:$WebPort"
} else {
  Write-Host "Adaptador: $($lan.Kind) - $($lan.Name)" -ForegroundColor Cyan
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
