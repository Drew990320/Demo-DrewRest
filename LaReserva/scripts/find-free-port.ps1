# Devuelve el primer puerto TCP libre en el rango (stdout). Exit 1 si ninguno.
param(
  [int]$Start = 8080,
  [int]$End = 8104
)

function Test-PortAvailable {
  param([int]$Port)
  $listener = New-Object System.Net.Sockets.TcpListener ([System.Net.IPAddress]::Any, $Port)
  try {
    $listener.Start()
    $listener.Stop()
    return $true
  } catch {
    return $false
  }
}

for ($p = $Start; $p -le $End; $p++) {
  if (Test-PortAvailable $p) {
    Write-Output $p
    exit 0
  }
}

Write-Error "No hay puerto libre entre $Start y $End."
exit 1
