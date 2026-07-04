/**
 * Genera (o regenera) el par de claves Ed25519 para licencias.
 * Tras regenerar, actualiza services/api/src/license/public-key.ts con la clave pública.
 *
 * Uso: node scripts/generar-claves-licencia.js
 */
const { generateKeyPairSync } = require('crypto');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'license-keys');
fs.mkdirSync(dir, { recursive: true });

const privatePath = path.join(dir, 'private.pem');
const publicPath = path.join(dir, 'public.pem');

if (fs.existsSync(privatePath)) {
  console.error('Ya existe scripts/license-keys/private.pem');
  console.error('Si regeneras, TODAS las licencias anteriores dejarán de valer.');
  console.error('Borra private.pem y public.pem a mano si quieres forzar una nueva clave.');
  process.exit(1);
}

const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const pubPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
const privPem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

fs.writeFileSync(privatePath, privPem);
fs.writeFileSync(publicPath, pubPem);

console.log('Claves creadas en scripts/license-keys/');
console.log('');
console.log('Copia la clave pública a services/api/src/license/public-key.ts:');
console.log('');
console.log(pubPem);
console.log('Guarda private.pem en un lugar seguro. No lo subas a git ni lo empaquetes.');
