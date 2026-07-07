/**
 * Arranque en la nube (plan free): prepara BD y luego inicia el API.
 */
const { execSync } = require('child_process');
const path = require('path');

const apiRoot = path.join(__dirname, '..');

try {
  console.log('[cloud-demo] Preparando base de datos...');
  execSync('node scripts/prepare-cloud-db.js', {
    cwd: apiRoot,
    stdio: 'inherit',
    env: process.env,
  });

  console.log('[cloud-demo] Iniciando API...');
  require(path.join(apiRoot, 'dist', 'src', 'main'));
} catch (error) {
  console.error('[cloud-demo] Arranque fallido:', error);
  process.exit(1);
}
