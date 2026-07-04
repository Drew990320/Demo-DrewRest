/**
 * Genera license.key firmada para un PC concreto.
 * Solo el desarrollador/proveedor debe ejecutar esto (requiere private.pem).
 *
 * Uso:
 *   node scripts/generar-licencia.js --machine <id-completo> --cliente "Nombre Restaurante"
 *   node scripts/generar-licencia.js --machine <id> --cliente "X" --dias 365
 *   node scripts/generar-licencia.js --machine <id> --cliente "X" --out ruta\license.key
 *
 * Clave privada: scripts/license-keys/private.pem (no se empaqueta ni se sube a git).
 */
const { createPrivateKey, sign } = require('crypto');
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const out = { machine: null, cliente: null, dias: null, out: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--machine' || a === '-m') out.machine = argv[++i];
    else if (a === '--cliente' || a === '-c') out.cliente = argv[++i];
    else if (a === '--dias' || a === '-d') out.dias = Number(argv[++i]);
    else if (a === '--out' || a === '-o') out.out = argv[++i];
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

function canonicalPayload(payload) {
  return JSON.stringify({
    v: payload.v,
    machineId: payload.machineId,
    cliente: payload.cliente,
    issuedAt: payload.issuedAt,
    expiresAt: payload.expiresAt,
  });
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.machine || !args.cliente) {
    console.log(`
Uso:
  node scripts/generar-licencia.js --machine <id-completo> --cliente "Nombre"

Opciones:
  --machine, -m   ID completo del PC (64 hex)
  --cliente, -c   Nombre del restaurante / cliente
  --dias, -d      Vencimiento en N días (omitir = sin vencimiento)
  --out, -o       Ruta de salida (default: license.key en el directorio actual)
`);
    process.exit(args.help ? 0 : 1);
  }

  const machineId = String(args.machine).trim().toLowerCase().replace(/-/g, '');
  if (!/^[a-f0-9]{64}$/.test(machineId)) {
    console.error('Error: --machine debe ser el ID completo (64 caracteres hex).');
    process.exit(1);
  }

  const privatePath = path.join(__dirname, 'license-keys', 'private.pem');
  if (!fs.existsSync(privatePath)) {
    console.error('Error: no existe scripts/license-keys/private.pem');
    console.error('Genera el par de claves con: node scripts/generar-claves-licencia.js');
    process.exit(1);
  }

  const privateKey = createPrivateKey(fs.readFileSync(privatePath, 'utf8'));
  const issuedAt = new Date().toISOString();
  let expiresAt = null;
  if (args.dias != null && !Number.isNaN(args.dias) && args.dias > 0) {
    const end = new Date();
    end.setUTCDate(end.getUTCDate() + args.dias);
    expiresAt = end.toISOString();
  }

  const payload = {
    v: 1,
    machineId,
    cliente: String(args.cliente).trim(),
    issuedAt,
    expiresAt,
  };

  const signature = sign(null, Buffer.from(canonicalPayload(payload), 'utf8'), privateKey).toString(
    'base64',
  );

  const license = { payload, signature };
  const outPath = path.resolve(args.out || path.join(process.cwd(), 'license.key'));
  fs.writeFileSync(outPath, JSON.stringify(license, null, 2) + '\n', 'utf8');

  console.log('');
  console.log('Licencia generada:');
  console.log('  Cliente:   ' + payload.cliente);
  console.log('  PC:        ' + machineId);
  console.log('  Emisión:   ' + issuedAt);
  console.log('  Vence:     ' + (expiresAt ?? 'sin vencimiento'));
  console.log('  Archivo:   ' + outPath);
  console.log('');
  console.log('Copia license.key a la carpeta api\\ del PC del restaurante.');
  console.log('');
}

main();
