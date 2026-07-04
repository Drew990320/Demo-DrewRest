@echo off
chcp 65001 >nul
setlocal EnableExtensions

echo ========================================
echo   La Reserva - Evitar suspension del PC
echo ========================================
echo.
echo Este PC hace de servidor. Si Windows entra en suspension,
echo la app deja de funcionar para todos los celulares.
echo.
echo Configurando (solo con corriente / enchufado):
echo   - Sin suspension automatica
echo   - Sin hibernacion automatica
echo   - Monitor puede apagarse a los 30 min (ahorro de energia)
echo.

powercfg /change standby-timeout-ac 0
if errorlevel 1 goto :err
powercfg /change hibernate-timeout-ac 0
if errorlevel 1 goto :err
powercfg /change monitor-timeout-ac 30
if errorlevel 1 goto :err

echo Listo.
echo.
echo Recomendaciones adicionales:
echo   - Deja abiertas (o minimizadas) las ventanas LaReserva_API y LaReserva_Web.
echo   - No cierres sesion en Windows; bloquear pantalla esta bien.
echo   - PostgreSQL debe seguir en marcha.
echo   - Para detener el sistema usa detener.bat, no cierres solo el navegador.
echo.
pause
exit /b 0

:err
echo.
echo [ERROR] No se pudo cambiar la configuracion de energia.
echo         Ejecuta este archivo como administrador o cambialo manualmente:
echo         Panel de control - Opciones de energia - Suspension: Nunca
echo.
pause
exit /b 1
