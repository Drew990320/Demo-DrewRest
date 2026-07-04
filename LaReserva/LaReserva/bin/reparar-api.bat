@echo off
chcp 65001 >nul
setlocal EnableExtensions
set "ROOT=%~dp0.."

cd /d "%ROOT%"

echo ========================================
echo   La Reserva - Reparar API
echo ========================================
echo.

if not exist "%ROOT%\api\package.json" (
  echo [ERROR] No existe api\package.json
  echo Copia la carpeta LaReserva\api completa desde el paquete de desarrollo.
  pause
  exit /b 1
)

if not exist "%ROOT%\api\vendor\shared-domain\dist\index.js" (
  echo [ERROR] Falta api\vendor\shared-domain
  echo.
  echo No copies solo api\dist. Necesitas la carpeta api\ entera:
  echo   dist, prisma, vendor, package.json y node_modules ^(o ejecuta este script^).
  echo.
  echo En desarrollo: npm run la-reserva:empaquetar
  pause
  exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Instala Node.js LTS desde https://nodejs.org
  pause
  exit /b 1
)

cd /d "%ROOT%\api"

echo [1/2] npm install --omit=dev ...
call npm install --omit=dev
if errorlevel 1 (
  echo [ERROR] npm install fallo.
  pause
  exit /b 1
)

echo.
echo [2/2] prisma generate ...
call npx prisma generate
if errorlevel 1 (
  echo [ERROR] prisma generate fallo.
  pause
  exit /b 1
)

if not exist "%ROOT%\api\node_modules\@la-reserva\shared-domain\dist\usuario-display.js" (
  if not exist "%ROOT%\api\node_modules\@la-reserva\shared-domain\package.json" (
    echo.
    echo [AVISO] Sigue faltando @la-reserva/shared-domain en node_modules.
    echo Vuelve a copiar api\vendor\ desde el paquete nuevo.
    pause
    exit /b 1
  )
)

echo.
echo Listo. Cierra LaReserva_API si estaba abierto y ejecuta inicio.bat
echo.
pause
