# Cierra procesos node de La Reserva (API Nest, spa-server web) si siguen activos.
$procs = Get-CimInstance Win32_Process -Filter "name = 'node.exe'" -ErrorAction SilentlyContinue
foreach ($p in $procs) {
  $cl = $p.CommandLine
  if ($null -eq $cl) { continue }
  if ($cl -match 'dist[\\/]main\.js' -or $cl -match 'dist[\\/]src[\\/]main\.js') {
    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
    continue
  }
  if ($cl -match 'spa-server\.js') {
    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
    continue
  }
  if ($cl -match 'serve' -and ($cl -match 'npx' -or $cl -match '\\web\\' -or $cl -match '/web/')) {
    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
  }
}
