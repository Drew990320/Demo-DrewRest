# Restaura un respaldo .dump de PostgreSQL (formato pg_dump -Fc).
# Uso: powershell -File scripts/restore-postgres.ps1 -DumpFile backups/postgres/archivo.dump
param(
  [Parameter(Mandatory = $true)]
  [string]$DumpFile,
  [string]$EnvFile = "services/api/.env",
  [switch]$Force
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
. (Join-Path $PSScriptRoot 'postgres-tools.ps1')

function Read-DatabaseUrl {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    throw "No se encontró el archivo de entorno: $Path"
  }
  foreach ($line in Get-Content $Path) {
    $trim = $line.Trim()
    if ($trim -match '^\s*#' -or $trim -eq '') { continue }
    if ($trim -match '^DATABASE_URL\s*=\s*"?([^"#]+)"?') {
      return $Matches[1].Trim()
    }
  }
  throw "DATABASE_URL no está definida en $Path"
}

function Parse-PostgresUrl {
  param([string]$Url)
  $m = [regex]::Match(
    $Url,
    '^postgresql://([^:/@]+)(?::([^@]*))?@([^:/]+)(?::(\d+))?/([^?]+)'
  )
  if (-not $m.Success) {
    throw "DATABASE_URL con formato no reconocido."
  }
  return @{
    User = $m.Groups[1].Value
    Password = $m.Groups[2].Value
    Host = $m.Groups[3].Value
    Port = if ($m.Groups[4].Success -and $m.Groups[4].Value) { $m.Groups[4].Value } else { '5432' }
    Database = $m.Groups[5].Value
  }
}

$dumpPath = if ([System.IO.Path]::IsPathRooted($DumpFile)) { $DumpFile } else { Join-Path $root $DumpFile }
if (-not (Test-Path $dumpPath)) {
  throw "No se encontró el archivo de respaldo: $dumpPath"
}

$pgRestore = Resolve-PostgresTool -ToolName 'pg_restore'
Write-Host "Usando: $pgRestore"

$dbUrl = Read-DatabaseUrl -Path $EnvFile
$db = Parse-PostgresUrl -Url $dbUrl

Write-Host "ADVERTENCIA: esto sobrescribirá datos en la base '$($db.Database)' en $($db.Host):$($db.Port)."
if (-not $Force) {
  $confirm = Read-Host "Escribe RESTAURAR para continuar"
  if ($confirm -ne 'RESTAURAR') {
    Write-Host "Cancelado."
    exit 0
  }
}

$env:PGPASSWORD = $db.Password
try {
  & $pgRestore `
    -h $db.Host `
    -p $db.Port `
    -U $db.User `
    -d $db.Database `
    --clean `
    --if-exists `
    --no-owner `
    --no-privileges `
    $dumpPath
  if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne 1) {
    # pg_restore puede devolver 1 por avisos no fatales
    throw "pg_restore terminó con código $LASTEXITCODE"
  }
}
finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host "Restore completado desde: $dumpPath"
Write-Host "Reinicia la API de DrewRest y verifica /health/ready."
