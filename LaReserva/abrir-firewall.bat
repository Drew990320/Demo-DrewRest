@echo off
chcp 65001 >nul
echo Abre reglas de firewall para La Reserva ^(puertos 3000 API y 8080 web^).
echo Puede pedir permiso de administrador.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"\"%~dp0..\scripts\abrir-firewall-lareserva.ps1\"\"'"
pause
