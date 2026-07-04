@echo off
chcp 65001 >nul
setlocal EnableExtensions
set "ROOT=%~dp0.."

cd /d "%ROOT%\api"

echo ========================================================================
echo  BASELINE PRISMA (solo si migrate deploy falla con error P3005)
echo
echo  Usa esto cuando la base de datos YA TIENE tablas pero Prisma no tiene
echo  el historial de migraciones (suele pasar si antes usaste db push).
echo
echo  Si la base es NUEVA y vacia, NO ejecutes esto: solo inicio.bat
echo ========================================================================
echo.
pause

echo Marcando todas las migraciones del paquete como ya aplicadas...
set "COUNT=0"
for /d %%M in ("%ROOT%\api\prisma\migrations\*") do (
  echo   - %%~nxM
  call npx prisma migrate resolve --applied "%%~nxM"
  if errorlevel 1 goto :err
  set /a COUNT+=1
)

if "%COUNT%"=="0" (
  echo [ERROR] No hay carpetas en api\prisma\migrations
  goto :err
)

echo.
echo Aplicando migraciones pendientes ^(si las hay^)...
call npx prisma migrate deploy
if errorlevel 1 goto :err

echo.
echo Listo ^(%COUNT% migraciones marcadas^). Vuelve a usar inicio.bat.
echo.
pause
exit /b 0

:err
echo.
echo Hubo un error. Revisa DATABASE_URL en api\.env y que PostgreSQL este en marcha.
pause
exit /b 1
