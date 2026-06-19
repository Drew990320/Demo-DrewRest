@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   La Reserva — IP para el celular
echo ========================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\show-lan-ip.ps1"
echo.
pause
