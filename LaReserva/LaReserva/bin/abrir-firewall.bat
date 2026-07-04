@echo off
chcp 65001 >nul
set "ROOT=%~dp0.."
echo Abre reglas de firewall para La Reserva ^(puertos 3000 API y 8080 web^).
echo Puede pedir permiso de administrador.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"\"%ROOT%\scripts\abrir-firewall.ps1\"\"'"
pause
