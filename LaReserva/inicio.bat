
@echo off
chcp 65001 >nul
setlocal EnableExtensions

cd /d "%~dp0"

echo ========================================
echo   La Reserva - Iniciando sistema
echo ========================================
echo.

if not exist "%~dp0api\dist\main.js" (
  if not exist "%~dp0api\dist\src\main.js" (
    echo [ERROR] No se encuentra api\dist\main.js ni api\dist\src\main.js
    echo.
    echo Esta carpeta LaReserva\api debe contener el servidor compilado.
    echo.
    echo Si estas en el proyecto de desarrollo ^(monorepo^):
    echo   1^) Compila el API:  cd services\api   y   npm run build
    echo   2^) Empaqueta a LaReserva:  powershell -ExecutionPolicy Bypass -File scripts\empaquetar-api-la-reserva.ps1
    echo      ^(ejecutar desde la raiz del repo, carpeta donde estan services y LaReserva^)
    echo.
    echo Si ya entregaron el paquete: copia aqui la carpeta api\ completa ^(dist, prisma, node_modules, package.json^).
    echo.
    pause
    exit /b 1
  )
)

if not exist "%~dp0api\package.json" (
  echo [ERROR] Falta api\package.json
  pause
  exit /b 1
)

if not exist "%~dp0web\index.html" (
  echo [ERROR] Falta web\index.html ^(export estatico de Expo^).
  echo.
  echo Si estas en el proyecto de desarrollo:
  echo   powershell -ExecutionPolicy Bypass -File scripts\empaquetar-web-la-reserva.ps1
  echo   ^(desde la raiz del repo; genera apps\mobile\dist y copia a LaReserva\web^)
  echo.
  echo Si entregaron el paquete: debe existir la carpeta web\ con index.html y assets.
  echo.
  pause
  exit /b 1
)

if not exist "%~dp0api\.env" (
  echo [ERROR] Falta api\.env ^(DATABASE_URL, JWT_SECRET, PORT, etc.^)
  echo         Ver LEEME.txt
  pause
  exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js no esta en el PATH. Instala Node.js LTS desde nodejs.org
  pause
  exit /b 1
)

echo [1/3] Migraciones de base de datos ^(Prisma^)...
cd /d "%~dp0api"
call npx prisma migrate deploy
if errorlevel 1 (
  echo.
  echo [ERROR] prisma migrate deploy fallo. Revisa DATABASE_URL en api\.env
  echo         y que PostgreSQL este en marcha.
  echo.
  echo Si el error es P3005 ^(base no vacia / esquema ya existente^):
  echo   Cierra esta ventana y ejecuta UNA VEZ:  ejecutar-baseline-prisma.bat
  echo   Luego vuelve a iniciar con inicio.bat
  echo.
  pause
  exit /b 1
)

echo.
echo [2/4] Verificando datos iniciales ^(roles, usuarios y mesas^)...
if exist "%~dp0api\scripts\bootstrap-inicial.js" (
  call node --env-file="%~dp0api\.env" "%~dp0api\scripts\bootstrap-inicial.js"
  if errorlevel 1 (
    echo.
    echo [ERROR] Fallo el bootstrap inicial de datos.
    echo         Revisa la salida anterior y la conexion a la BD en api\.env
    pause
    exit /b 1
  )
) else (
  echo [WARN] No se encontro scripts\bootstrap-inicial.js. Se omite bootstrap.
)

echo.
echo [3/4] Iniciando API ^(puerto 3000^)...
if exist "%~dp0api\dist\main.js" (
  start "LaReserva_API" /D "%~dp0api" cmd /k "node --env-file=.env dist/main.js"
) else (
  start "LaReserva_API" /D "%~dp0api" cmd /k "node --env-file=.env dist/src/main.js"
)
if errorlevel 1 (
  echo [ERROR] No se pudo iniciar el API.
  pause
  exit /b 1
)

REM Puerto 8080: no requiere ejecutar como administrador en Windows.
set "WEB_PORT=8080"

echo.
echo [4/4] Iniciando web estatica ^(puerto %WEB_PORT%, accesible en la red^)...
start "LaReserva_Web" /D "%~dp0web" cmd /k "node spa-server.js"

echo.
echo ========================================
echo   Listo
echo ========================================
echo   App web en ESTE PC:
echo     http://localhost:%WEB_PORT%
echo.
echo   IP para el CELULAR ^(misma Wi-Fi^):
powershell -NoProfile -ExecutionPolicy Bypass -Command "$w=Get-NetIPAddress -AddressFamily IPv4|Where-Object{$_.InterfaceAlias -match 'Wi-Fi|WLAN|Wireless|802.11' -and $_.IPAddress -notlike '169.254.*'}|Select-Object -First 1;if($w){Write-Host ('    http://{0}:' + '%WEB_PORT%' -f $w.IPAddress);Write-Host ('    API: http://{0}:3000/health' -f $w.IPAddress)}else{Write-Host '    Ejecuta mostrar-ip.bat o ipconfig para ver la IPv4 Wi-Fi'}"
echo.
echo   IMPORTANTE:
echo   - Usa la IP del adaptador Wi-Fi ^(NO 192.168.56.x de VirtualBox^).
echo   - Si el puerto %WEB_PORT% esta ocupado, serve fallara: cierra lo que lo use
echo     o cambia WEB_PORT en este .bat.
echo   - Si el celular no entra: ejecuta abrir-firewall.bat como administrador.
echo   - Misma red Wi-Fi en PC y celular ^(no datos moviles^).
echo.
echo   Para detener: ejecuta detener.bat o cierra las ventanas API y Web.
echo ========================================
echo.
pause
