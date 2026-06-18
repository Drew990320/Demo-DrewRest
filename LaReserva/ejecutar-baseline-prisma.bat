@echo off
chcp 65001 >nul
cd /d "%~dp0api"

echo ========================================================================
echo  BASELINE PRISMA (solo si migrate deploy falla con error P3005)
echo
echo  Usa esto cuando la base de datos YA TIENE tablas pero Prisma dice que
echo  el esquema "no esta vacio" (suele pasar si antes usaste db push).
echo
echo  Si la base es NUEVA y vacia, NO ejecutes esto: solo inicio.bat
echo ========================================================================
echo.
pause

echo Marcando migraciones como ya aplicadas...
call npx prisma migrate resolve --applied 20250402120000_modo_para_llevar_empaque
if errorlevel 1 goto :err
call npx prisma migrate resolve --applied 20250402140000_caja_diaria
if errorlevel 1 goto :err
call npx prisma migrate resolve --applied 20250402180000_cocina_prioridad_proteina
if errorlevel 1 goto :err
call npx prisma migrate resolve --applied 20250405120000_pedido_historial
if errorlevel 1 goto :err
call npx prisma migrate resolve --applied 20250410140000_mesa_disponible_por_dia
if errorlevel 1 goto :err

echo.
echo Aplicando migraciones pendientes (si las hay)...
call npx prisma migrate deploy
if errorlevel 1 goto :err

echo.
echo Listo. Vuelve a usar inicio.bat para arrancar el sistema.
echo.
pause
exit /b 0

:err
echo.
echo Hubo un error. Revisa DATABASE_URL en api\.env y que PostgreSQL este en marcha.
pause
exit /b 1
