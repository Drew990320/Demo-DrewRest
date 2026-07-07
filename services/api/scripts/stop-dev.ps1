# Detiene la API local para liberar query_engine-windows.dll.node antes de prisma generate.
param(
  [switch]$Thorough
)

$apiRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$killed = @()

$portPid = (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
  Select-Object -First 1).OwningProcess
if ($portPid) {
  Stop-Process -Id $portPid -Force -ErrorAction SilentlyContinue
  $killed += $portPid
  Write-Host "Proceso $portPid (puerto 3000) detenido"
  Start-Sleep -Milliseconds 250
}

if ($Thorough) {
  Get-CimInstance Win32_Process -Filter "name='node.exe'" -ErrorAction SilentlyContinue |
    Where-Object {
      $cmd = $_.CommandLine
      $cmd -and (
        $cmd -like "*$apiRoot*" -or
        ($cmd -match 'services[\\/]api' -and $cmd -match 'nest')
      )
    } |
    ForEach-Object {
      if ($killed -notcontains $_.ProcessId) {
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
        Write-Host "Proceso $($_.ProcessId) (api/nest) detenido"
        $killed += $_.ProcessId
      }
    }
  if ($killed.Count -gt 0) {
    Start-Sleep -Milliseconds 250
  }
}

if ($killed.Count -eq 0) {
  Write-Host 'Puerto 3000 libre'
}
