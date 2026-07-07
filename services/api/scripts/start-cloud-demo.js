/**
 * Arranque local/Docker: prepara BD y luego inicia el API.
 * En Render, la BD se prepara con preDeployCommand (prepare-cloud-db.js).
 */
const { execSync } = require('child_process');
const path = require('path');

const apiRoot = path.join(__dirname, '..');

if (process.env.RENDER) {
  require(path.join(apiRoot, 'dist', 'src', 'main'));
} else {
  execSync('node scripts/prepare-cloud-db.js', {
    cwd: apiRoot,
    stdio: 'inherit',
    env: process.env,
  });
  require(path.join(apiRoot, 'dist', 'src', 'main'));
}
