# Arranca API + web sin ventanas CMD y abre el navegador.
# Llamado desde abrir-la-reserva.vbs (acceso directo en el escritorio).

param(
  [switch]$SoloNavegador
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$ApiDir = Join-Path $Root "api"
$WebDir = Join-Path $Root "web"
$ApiPort = 3000

function Show-ErrorBox {
  param([string]$Message)
  try {
    Add-Type -AssemblyName System.Windows.Forms
    [void][System.Windows.Forms.MessageBox]::Show(
      $Message,
      "La Reserva",
      [System.Windows.Forms.MessageBoxButtons]::OK,
      [System.Windows.Forms.MessageBoxIcon]::Error
    )
  } catch {
    Write-Host $Message
  }
}

function Invoke-HiddenProcess {
  param(
    [string]$FilePath,
    [string]$ArgumentList,
    [string]$WorkingDirectory,
    [string]$LogPath
  )
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $FilePath
  $psi.Arguments = $ArgumentList
  $psi.WorkingDirectory = $WorkingDirectory
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $p = [System.Diagnostics.Process]::Start($psi)
  $stdout = $p.StandardOutput.ReadToEnd()
  $stderr = $p.StandardError.ReadToEnd()
  $p.WaitForExit()
  if ($LogPath) {
    if ($stdout) { Add-Content -Path $LogPath -Value $stdout -Encoding UTF8 }
    if ($stderr) { Add-Content -Path $LogPath -Value $stderr -Encoding UTF8 }
  }
  return $p.ExitCode
}

function Invoke-HiddenCmd {
  param(
    [string]$Command,
    [string]$WorkingDirectory,
    [string]$LogPath
  )
  $comspec = $env:COMSPEC
  if (-not $comspec) { $comspec = "cmd.exe" }
  return Invoke-HiddenProcess -FilePath $comspec `
    -ArgumentList "/d /s /c `"$Command`"" `
    -WorkingDirectory $WorkingDirectory `
    -LogPath $LogPath
}

function Invoke-Prisma {
  param(
    [string[]]$PrismaArgs,
    [string]$LogPath
  )
  $prismaJs = Join-Path $ApiDir "node_modules\prisma\build\index.js"
  if (-not (Test-Path $prismaJs)) {
    if ($LogPath) {
      Add-Content -Path $LogPath -Value "No existe $prismaJs" -Encoding UTF8
    }
    return 1
  }
  $quoted = ($PrismaArgs | ForEach-Object {
    if ($_ -match '\s') { "`"$($_ -replace '"','\"')`"" } else { $_ }
  }) -join ' '
  return Invoke-HiddenProcess -FilePath "node" `
    -ArgumentList "`"$prismaJs`" $quoted" `
    -WorkingDirectory $ApiDir `
    -LogPath $LogPath
}

function Test-HttpOk {
  param([string]$Url, [int]$TimeoutSec = 2)
  try {
    $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec
    return $r.StatusCode -ge 200 -and $r.StatusCode -lt 400
  } catch {
    return $false
  }
}

function Wait-HttpOk {
  param([string]$Url, [int]$TimeoutSec = 90)
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    if (Test-HttpOk -Url $Url) { return $true }
    Start-Sleep -Milliseconds 400
  }
  return $false
}

function Get-ResolvedWebPort {
  param([int]$Preferred)
  $portFile = Join-Path $WebDir "web-port.txt"
  if (Test-Path $portFile) {
    $raw = (Get-Content $portFile -Raw).Trim()
    if ($raw -match '^\d+$') { return [int]$raw }
  }
  return $Preferred
}

function Start-HiddenNode {
  param(
    [string]$WorkingDirectory,
    [string[]]$NodeArgs,
    [string]$LogDir
  )
  New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
  $outLog = Join-Path $LogDir "stdout.log"
  $errLog = Join-Path $LogDir "stderr.log"
  "" | Set-Content -Path $outLog -Encoding UTF8
  "" | Set-Content -Path $errLog -Encoding UTF8
  Start-Process -FilePath "node" -ArgumentList $NodeArgs `
    -WorkingDirectory $WorkingDirectory `
    -WindowStyle Hidden `
    -RedirectStandardOutput $outLog `
    -RedirectStandardError $errLog | Out-Null
}

# --- Puerto web ---
$webPort = 8080
try {
  $found = & (Join-Path $PSScriptRoot "find-free-port.ps1") 2>$null
  if ($found) { $webPort = [int]$found }
} catch {
  $webPort = 8080
}

$webUrl = "http://127.0.0.1:$webPort/"

# Si ya está en marcha, solo abrir navegador
$resolvedPort = Get-ResolvedWebPort -Preferred $webPort
$webUrlResolved = "http://127.0.0.1:$resolvedPort/"
if ((Test-HttpOk -Url "http://127.0.0.1:$ApiPort/health") -and (Test-HttpOk -Url $webUrlResolved)) {
  Start-Process $webUrlResolved
  exit 0
}

if ($SoloNavegador) {
  Show-ErrorBox "La Reserva no está en marcha.`n`nEjecuta abrir-la-reserva o inicio.bat primero."
  exit 1
}

# Detener instancias anteriores
& (Join-Path $Root "scripts\detener.ps1")

# Validaciones
$mainJs = Join-Path $ApiDir "dist\main.js"
$mainJsNested = Join-Path $ApiDir "dist\src\main.js"
if (-not (Test-Path $mainJs) -and -not (Test-Path $mainJsNested)) {
  Show-ErrorBox "Falta api\dist\main.js.`nCopia la carpeta LaReserva\api completa del paquete de instalación."
  exit 1
}
if (-not (Test-Path (Join-Path $WebDir "index.html"))) {
  Show-ErrorBox "Falta web\index.html (export de Expo)."
  exit 1
}
if (-not (Test-Path (Join-Path $ApiDir ".env"))) {
  Show-ErrorBox "Falta api\.env con DATABASE_URL y JWT_SECRET.`nVer LEEME.txt"
  exit 1
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Show-ErrorBox "Node.js no está instalado.`nInstala Node.js LTS desde https://nodejs.org"
  exit 1
}
if (-not (Test-Path (Join-Path $ApiDir "vendor\shared-domain\dist\index.js"))) {
  Show-ErrorBox "Falta api\vendor\shared-domain.`nVuelve a empaquetar con npm run la-reserva:empaquetar"
  exit 1
}

$logApi = Join-Path $ApiDir "logs"
$logWeb = Join-Path $WebDir "logs"
New-Item -ItemType Directory -Force -Path $logApi | Out-Null
New-Item -ItemType Directory -Force -Path $logWeb | Out-Null
$setupLog = Join-Path $logApi "setup.log"

# npm install (primera vez)
if (-not (Test-Path (Join-Path $ApiDir "node_modules"))) {
  $code = Invoke-HiddenCmd -Command "npm install --omit=dev" `
    -WorkingDirectory $ApiDir -LogPath $setupLog
  if ($code -ne 0) {
    Show-ErrorBox "npm install fallo.`nRevisa api\logs\setup.log o ejecuta inicio.bat."
    exit 1
  }
}

# Prisma (CLI local; no usar npx.cmd — falla en Node 24 sin npm embebido)
$prismaClientOk = Test-Path (Join-Path $ApiDir "node_modules\.prisma\client\index.js")
if (-not $prismaClientOk) {
  $code = Invoke-Prisma -PrismaArgs @("generate") -LogPath $setupLog
  if ($code -ne 0) {
    Show-ErrorBox "Prisma generate fallo.`nRevisa api\logs\setup.log`nO ejecuta inicio.bat."
    exit 1
  }
}
$code = Invoke-Prisma -PrismaArgs @("migrate", "deploy") -LogPath $setupLog
if ($code -ne 0) {
  Show-ErrorBox @"
Fallo la migracion de base de datos.
Revisa api\.env y que PostgreSQL este en marcha.
Si el error es P3005: ejecutar-baseline-prisma.bat (una vez).
Detalle: api\logs\setup.log
"@
  exit 1
}

# Bootstrap
$bootstrap = Join-Path $ApiDir "scripts\bootstrap-inicial.js"
if (Test-Path $bootstrap) {
  $code = Invoke-HiddenProcess -FilePath "node" `
    -ArgumentList "--env-file=.env `"$bootstrap`"" `
    -WorkingDirectory $ApiDir -LogPath $setupLog
  if ($code -ne 0) {
    Show-ErrorBox "Fallo la verificacion de datos iniciales.`nRevisa api\logs\setup.log"
    exit 1
  }
}

# Arrancar supervisores (sin ventana)
if (Test-Path (Join-Path $ApiDir "run-forever.js")) {
  Start-HiddenNode -WorkingDirectory $ApiDir -NodeArgs @("run-forever.js") -LogDir $logApi
} elseif (Test-Path $mainJs) {
  Start-HiddenNode -WorkingDirectory $ApiDir -NodeArgs @("--env-file=.env", "dist/main.js") -LogDir $logApi
} else {
  Start-HiddenNode -WorkingDirectory $ApiDir -NodeArgs @("--env-file=.env", "dist/src/main.js") -LogDir $logApi
}

$env:WEB_PORT = "$webPort"
if (Test-Path (Join-Path $WebDir "run-forever.js")) {
  Start-HiddenNode -WorkingDirectory $WebDir -NodeArgs @("run-forever.js") -LogDir $logWeb
} else {
  Start-HiddenNode -WorkingDirectory $WebDir -NodeArgs @("spa-server.js") -LogDir $logWeb
}

# Esperar servicios
if (-not (Wait-HttpOk -Url "http://127.0.0.1:$ApiPort/health" -TimeoutSec 120)) {
  Show-ErrorBox @"
El API no respondió a tiempo.
Revisa PostgreSQL y api\logs\stderr.log
Puedes usar inicio.bat para ver errores en pantalla.
"@
  exit 1
}

$resolvedPort = Get-ResolvedWebPort -Preferred $webPort
$openUrl = "http://127.0.0.1:$resolvedPort/"
if (-not (Wait-HttpOk -Url $openUrl -TimeoutSec 60)) {
  Show-ErrorBox @"
La web no respondió a tiempo.
Revisa web\logs\stderr.log
Puerto esperado: $resolvedPort
"@
  exit 1
}

Start-Process $openUrl
exit 0
