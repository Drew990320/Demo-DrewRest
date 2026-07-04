@echo off
chcp 65001 >nul
setlocal EnableExtensions
set "ROOT=%~dp0.."

echo Cerrando La Reserva ^(API y web^)...
echo.

taskkill /FI "WINDOWTITLE eq LaReserva_API*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq LaReserva_Web*" /T /F >nul 2>&1

powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\detener.ps1"

echo Listo.
echo.
pause
