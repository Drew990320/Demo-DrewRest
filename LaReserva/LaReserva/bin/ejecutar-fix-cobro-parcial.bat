@echo off
chcp 65001 >nul
setlocal EnableExtensions
set "ROOT=%~dp0.."

cd /d "%ROOT%\api"

if not exist ".env" (
  echo [ERROR] Falta api\.env
  pause
  exit /b 1
)

echo Aplicando migraciones Prisma ^(incluye cobro parcial / subfacturas^)...
call npx prisma migrate deploy
if errorlevel 1 (
  echo.
  echo Si falla con P3005, ejecuta primero bin\ejecutar-baseline-prisma.bat
  pause
  exit /b 1
)

echo.
echo Listo. Reinicia el API con inicio.bat si estaba en marcha.
echo.
pause
