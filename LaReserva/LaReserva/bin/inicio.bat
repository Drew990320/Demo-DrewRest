
@echo off
chcp 65001 >nul
setlocal EnableExtensions
set "ROOT=%~dp0.."
cd /d "%ROOT%"

set "WEB_PORT="
for /f "usebackq delims=" %%p in (`powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\find-free-port.ps1"`) do set "WEB_PORT=%%p"
if not defined WEB_PORT set "WEB_PORT=8080"

echo ========================================
echo   La Reserva - Iniciando sistema
echo ========================================
echo.
echo Cerrando instancias anteriores (si las hay)...
taskkill /FI "WINDOWTITLE eq LaReserva_API*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq LaReserva_Web*" /T /F >nul 2>&1
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\detener.ps1"
echo.
if not "%WEB_PORT%"=="8080" (
  echo   Puerto web: %WEB_PORT% ^(8080 ocupado por otro servicio^)
) else (
  echo   Puerto web: %WEB_PORT%
)
echo.
echo   Celulares en la red: admin - Conexion movil (QR y URL en la app).
echo.

if not exist "%ROOT%\api\dist\main.js" (
  if not exist "%ROOT%\api\dist\src\main.js" (
    echo [ERROR] No se encuentra api\dist\main.js ni api\dist\src\main.js
    echo.
    echo Copia la carpeta LaReserva\api completa del paquete de instalacion
    echo ^(dist, prisma, node_modules, vendor, package.json^).
    echo.
    pause
    exit /b 1
  )
)

if not exist "%ROOT%\api\package.json" (
  echo [ERROR] Falta api\package.json
  pause
  exit /b 1
)

if not exist "%ROOT%\web\index.html" (
  echo [ERROR] Falta web\index.html ^(export estatico de Expo^).
  pause
  exit /b 1
)

if not exist "%ROOT%\api\.env" (
  if exist "%ROOT%\api\.env.example" (
    echo [AVISO] No existe api\.env — se crea desde .env.example
    copy /Y "%ROOT%\api\.env.example" "%ROOT%\api\.env" >nul
    echo         Edita api\.env con tu PostgreSQL ^(DATABASE_URL^) y JWT_SECRET.
    echo         Luego vuelve a ejecutar inicio.bat
    echo.
    pause
    exit /b 1
  )
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

cd /d "%ROOT%\api"

if not exist "%ROOT%\api\node_modules\" (
  echo [0/4] Instalando dependencias ^(primera vez o carpeta sin node_modules^)...
  call npm install --omit=dev
  if errorlevel 1 (
    echo [ERROR] npm install fallo.
    pause
    exit /b 1
  )
  echo.
)

if not exist "%ROOT%\api\vendor\shared-domain\dist\index.js" (
  echo [ERROR] Falta vendor\shared-domain en api\.
  echo         Usa el paquete LaReserva generado con npm run la-reserva:empaquetar
  pause
  exit /b 1
)

echo [1/4] Base de datos ^(Prisma generate + migrate deploy^)...
call npx prisma generate
if errorlevel 1 goto :migrate_err
call npx prisma migrate deploy
if errorlevel 1 goto :migrate_err
goto :migrate_ok

:migrate_err
echo.
echo [ERROR] Fallo la preparacion de la base de datos.
echo         Revisa DATABASE_URL en api\.env y que PostgreSQL este en marcha.
echo.
echo Si el error es P3005 ^(base no vacia / esquema ya existente sin historial^):
echo   Cierra esta ventana y ejecuta UNA VEZ:  bin\ejecutar-baseline-prisma.bat
echo   Luego vuelve a iniciar con inicio.bat
echo.
echo Si el error es P1000: usuario o contraseña incorrectos en DATABASE_URL.
echo.
pause
exit /b 1

:migrate_ok
echo.
echo [2/4] Verificando datos iniciales ^(roles, usuarios y mesas^)...
if exist "%ROOT%\api\scripts\bootstrap-inicial.js" (
  call node --env-file="%ROOT%\api\.env" "%ROOT%\api\scripts\bootstrap-inicial.js"
  if errorlevel 1 (
    echo.
    echo [ERROR] Fallo el bootstrap inicial de datos.
    pause
    exit /b 1
  )
) else (
  echo [WARN] No se encontro scripts\bootstrap-inicial.js. Se omite bootstrap.
)

echo.
echo [3/4] Iniciando API ^(puerto 3000, con reinicio automatico^)...
if exist "%ROOT%\api\run-forever.js" (
  start "LaReserva_API" /D "%ROOT%\api" cmd /k "node run-forever.js"
) else if exist "%ROOT%\api\dist\main.js" (
  start "LaReserva_API" /D "%ROOT%\api" cmd /k "node --env-file=.env dist/main.js"
) else (
  start "LaReserva_API" /D "%ROOT%\api" cmd /k "node --env-file=.env dist/src/main.js"
)

echo.
echo [4/4] Iniciando web estatica ^(puerto %WEB_PORT%, con reinicio automatico^)...
if exist "%ROOT%\web\run-forever.js" (
  start "LaReserva_Web" /D "%ROOT%\web" cmd /k "set WEB_PORT=%WEB_PORT%&& node run-forever.js"
) else (
  start "LaReserva_Web" /D "%ROOT%\web" cmd /k "set WEB_PORT=%WEB_PORT%&& node spa-server.js"
)

timeout /t 2 /nobreak >nul
if exist "%ROOT%\web\web-port.txt" (
  set /p WEB_PORT=<"%ROOT%\web\web-port.txt"
)

echo.
echo ========================================
echo   Listo
echo ========================================
echo   App web en ESTE PC:
echo     http://localhost:%WEB_PORT%
echo.
echo   Celulares (misma red Wi-Fi): admin - Conexion movil - escanea el QR.
echo.
echo   Si 8080 estaba ocupado ^(p. ej. Postgres EDB^), la web usa el puerto %WEB_PORT%.
echo   Mira la ventana LaReserva_Web para confirmar el puerto.
echo.
echo   IMPORTANTE:
echo   - PostgreSQL debe estar instalado y la base creada ^(ver LEEME.txt^).
echo   - Al actualizar LaReserva, conserva api\.env del PC ^(no lo sobreescribas^).
echo   - inicio.bat aplica migraciones pendientes automaticamente.
echo   - Si el celular no entra: bin\abrir-firewall.bat como administrador.
echo   - Para que no se caiga al dejar el PC quieto: bin\evitar-suspension.bat
echo   - NO cierres las ventanas LaReserva_API y LaReserva_Web ^(minimizar si^).
echo     Cerrar el navegador en este PC NO apaga el servidor; cerrar esas ventanas SI.
echo.
echo   Para detener: ejecuta detener.bat ^(no cierres solo el navegador^).
echo ========================================
echo.
pause
