/**
 * Arranque en la nube (plan free): prepara BD y luego inicia el API.
 */
const { spawn } = require('child_process');
const path = require('path');

const apiRoot = path.join(__dirname, '..');

function runNodeScript(scriptName) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join('scripts', scriptName)], {
      cwd: apiRoot,
      stdio: 'inherit',
      env: process.env,
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${scriptName} salió con código ${code}`));
    });
  });
}

async function main() {
  console.log('[cloud-demo] Preparando base de datos...');
  await runNodeScript('prepare-cloud-db.js');

  console.log('[cloud-demo] Iniciando API...');
  // Cargar main después de preparar la BD; bootstrap() es async internamente.
  require(path.join(apiRoot, 'dist', 'src', 'main'));
}

main().catch((error) => {
  console.error('[cloud-demo] Arranque fallido:', error);
  process.exit(1);
});
