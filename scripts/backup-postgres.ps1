# Respaldo diario de PostgreSQL para DrewRest.
# Uso: powershell -File scripts/backup-postgres.ps1 [-EnvFile services/api/.env]
param(
  [string]$EnvFile = "services/api/.env",
  [string]$BackupDir = "backups/postgres",
  [int]$RetentionDays = 7
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

$pgDump = Resolve-PostgresTool -ToolName 'pg_dump'
Write-Host "Usando: $pgDump"

$dbUrl = Read-DatabaseUrl -Path $EnvFile
$db = Parse-PostgresUrl -Url $dbUrl

$targetDir = Join-Path $root $BackupDir
New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outFile = Join-Path $targetDir ("drewrest-{0}-{1}.dump" -f $db.Database, $stamp)

$env:PGPASSWORD = $db.Password
try {
  & $pgDump `
    -h $db.Host `
    -p $db.Port `
    -U $db.User `
    -d $db.Database `
    -Fc `
    --no-owner `
    --no-privileges `
    -f $outFile
  if ($LASTEXITCODE -ne 0) {
    throw "pg_dump terminó con código $LASTEXITCODE"
  }
}
finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

$sizeMb = [math]::Round((Get-Item $outFile).Length / 1MB, 2)
Write-Host "Backup OK: $outFile ($sizeMb MB)"

$cutoff = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem $targetDir -Filter "drewrest-*.dump" |
  Where-Object { $_.LastWriteTime -lt $cutoff } |
  ForEach-Object {
    Remove-Item $_.FullName -Force
    Write-Host "Eliminado backup antiguo: $($_.Name)"
  }
