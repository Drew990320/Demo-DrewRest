# Utilidades para localizar pg_dump / pg_restore en Windows (PATH, Laragon, PostgreSQL oficial).
function Resolve-PostgresTool {
  param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('pg_dump', 'pg_restore', 'psql')]
    [string]$ToolName
  )

  $fromPath = Get-Command $ToolName -ErrorAction SilentlyContinue
  if ($fromPath -and $fromPath.Source) {
    return $fromPath.Source
  }

  $exe = "$ToolName.exe"
  $candidates = [System.Collections.Generic.List[string]]::new()

  if ($env:POSTGRES_BIN) {
    $candidates.Add((Join-Path $env:POSTGRES_BIN $exe))
  }

  $laragonRoots = @()
  if ($env:LARAGON_ROOT) { $laragonRoots += $env:LARAGON_ROOT }
  $laragonRoots += 'C:\laragon'

  foreach ($laragon in ($laragonRoots | Select-Object -Unique)) {
    if (-not (Test-Path $laragon)) { continue }
    $patterns = @(
      (Join-Path $laragon 'bin\postgresql\*\bin'),
      (Join-Path $laragon 'bin\postgres\*\bin'),
      (Join-Path $laragon 'bin\pgsql\*\bin')
    )
    foreach ($pattern in $patterns) {
      $bins = Get-ChildItem -Path $pattern -Directory -ErrorAction SilentlyContinue |
        Sort-Object Name -Descending
      foreach ($bin in $bins) {
        $candidates.Add((Join-Path $bin.FullName $exe))
      }
    }
  }

  $pgRoots = @('C:\Program Files\PostgreSQL', 'C:\Program Files (x86)\PostgreSQL')
  foreach ($pgRoot in $pgRoots) {
    if (-not (Test-Path $pgRoot)) { continue }
    $versions = Get-ChildItem -Path $pgRoot -Directory -ErrorAction SilentlyContinue |
      Sort-Object { [int]($_.Name -replace '\D', '') } -Descending
    foreach ($ver in $versions) {
      $candidates.Add((Join-Path $ver.FullName "bin\$exe"))
    }
  }

  foreach ($path in ($candidates | Select-Object -Unique)) {
    if ($path -and (Test-Path $path)) {
      return $path
    }
  }

  throw @"
No se encontró $exe.
Opciones:
  1) Abre la terminal desde Laragon (ya suele incluir PostgreSQL en PATH).
  2) Define POSTGRES_BIN, por ejemplo:
     `$env:POSTGRES_BIN = 'C:\Program Files\PostgreSQL\17\bin'
  3) Instala PostgreSQL client tools o activa PostgreSQL en Laragon (Menú → PostgreSQL).
"@
}
