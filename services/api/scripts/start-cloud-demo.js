/**
 * Arranque en la nube (plan free): prepara BD y luego inicia el API.
 * Render free no admite preDeployCommand, así que todo ocurre al arrancar.
 */
const { execSync } = require('child_process');
const path = require('path');

const apiRoot = path.join(__dirname, '..');

execSync('node scripts/prepare-cloud-db.js', {
  cwd: apiRoot,
  stdio: 'inherit',
  env: process.env,
});

require(path.join(apiRoot, 'dist', 'src', 'main'));
