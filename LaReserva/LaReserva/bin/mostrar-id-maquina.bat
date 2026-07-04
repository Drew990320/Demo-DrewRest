@echo off
chcp 65001 >nul
setlocal EnableExtensions
set "ROOT=%~dp0.."
cd /d "%ROOT%\api"

if not exist "scripts\license\mostrar-id-maquina.js" (
  echo [ERROR] No se encuentra scripts\license\mostrar-id-maquina.js
  echo         Usa un paquete LaReserva generado con npm run la-reserva:empaquetar
  pause
  exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js no esta en el PATH. Instala Node.js LTS desde nodejs.org
  pause
  exit /b 1
)

node "scripts\license\mostrar-id-maquina.js"
echo.
pause
