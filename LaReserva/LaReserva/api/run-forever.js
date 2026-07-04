/**
 * Supervisor del API en el PC del restaurante: reinicia Node si el proceso termina.
 * Usado por LaReserva\inicio.bat (no hace falta npm).
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const cwd = __dirname;
const RESTART_MS = 3000;
let stopping = false;
let child = null;

const entry = fs.existsSync(path.join(cwd, 'dist', 'main.js'))
  ? path.join('dist', 'main.js')
  : path.join('dist', 'src', 'main.js');

function stamp() {
  return new Date().toLocaleString('es-CO', { hour12: false });
}

function run() {
  if (stopping) return;
  child = spawn(process.execPath, ['--env-file=.env', entry], {
    cwd,
    stdio: 'inherit',
    env: process.env,
  });
  child.on('exit', (code, signal) => {
    child = null;
    if (stopping) return;
    // 78 = licencia inválida / ausente (no reiniciar en bucle)
    if (code === 78) {
      console.error(`\n[${stamp()}] API detenido por licencia (código 78). No se reinicia.`);
      console.error('Activa la licencia (bin\\mostrar-id-maquina.bat) y vuelve a iniciar.');
      process.exit(78);
      return;
    }
    console.error(
      `\n[${stamp()}] API terminó (código ${code ?? '—'}, señal ${signal ?? '—'}). Reinicio en ${RESTART_MS / 1000} s…`,
    );
    console.error('Si se repite: revisa PostgreSQL y el mensaje de error anterior.');
    setTimeout(run, RESTART_MS);
  });
}

function shutdown() {
  stopping = true;
  if (child) child.kill('SIGTERM');
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log(`[${stamp()}] Supervisor API — reinicio automático activo.`);
run();
