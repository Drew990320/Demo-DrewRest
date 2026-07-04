/**
 * Supervisor del servidor web estático: reinicia spa-server.js si termina.
 */
const { spawn } = require('child_process');
const path = require('path');

const cwd = __dirname;
const RESTART_MS = 3000;
let stopping = false;
let child = null;

function stamp() {
  return new Date().toLocaleString('es-CO', { hour12: false });
}

function run() {
  if (stopping) return;
  child = spawn(process.execPath, [path.join(cwd, 'spa-server.js')], {
    cwd,
    stdio: 'inherit',
    env: process.env,
  });
  child.on('exit', (code, signal) => {
    child = null;
    if (stopping) return;
    console.error(
      `\n[${stamp()}] Servidor web terminó (código ${code ?? '—'}, señal ${signal ?? '—'}). Reinicio en ${RESTART_MS / 1000} s…`,
    );
    setTimeout(run, RESTART_MS);
  });
}

function shutdown() {
  stopping = true;
  if (child) child.kill('SIGTERM');
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log(`[${stamp()}] Supervisor web — reinicio automático activo.`);
run();
