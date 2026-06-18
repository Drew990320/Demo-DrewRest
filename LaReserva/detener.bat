@echo off
chcp 65001 >nul
setlocal EnableExtensions

echo Cerrando La Reserva ^(API y web^)...
echo.

REM Ventanas abiertas por inicio.bat
taskkill /FI "WINDOWTITLE eq LaReserva_API*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq LaReserva_Web*" /T /F >nul 2>&1

REM Por si quedaron procesos node huérfanos
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0detener.ps1"

echo Listo.
echo.
pause
