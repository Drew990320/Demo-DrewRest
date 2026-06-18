@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   La Reserva — IP para el celular
echo ========================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\scripts\show-lan-ip.ps1" 2>nul
if errorlevel 1 (
  echo No se pudo ejecutar show-lan-ip.ps1. En cmd escribe:  ipconfig
  echo Busca "Adaptador de LAN inalambrica Wi-Fi" y la IPv4.
)
echo.
echo En el CELULAR ^(misma Wi-Fi que este PC^), abre en el navegador:
echo   http://LA_IP_DE_ARRIBA:8080
echo.
echo Si inicio.bat uso otro puerto ^(ventana LaReserva_Web^), cambia 8080 por ese numero.
echo.
echo Prueba tambien el API desde el celular:
echo   http://LA_IP_DE_ARRIBA:3000/health
echo   ^(debe responder algo como {"status":"ok"}^)
echo.
pause
