import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { parseLicenseFile, verifyLicenseSignature } from './license-crypto';
import { formatMachineIdDisplay, getMachineId } from './machine-id';
import type { LicensePayload } from './types';

function licensePaths(): string[] {
  const cwd = process.cwd();
  const envPath = process.env.LICENSE_FILE?.trim();
  const paths = [
    envPath,
    join(cwd, 'license.key'),
    join(cwd, 'license.json'),
    join(__dirname, '..', '..', 'license.key'),
    join(__dirname, '..', '..', 'license.json'),
  ].filter((p): p is string => Boolean(p));
  return [...new Set(paths)];
}

function findLicenseFile(): string | null {
  for (const p of licensePaths()) {
    if (existsSync(p)) return p;
  }
  return null;
}

function isExpired(payload: LicensePayload): boolean {
  if (!payload.expiresAt) return false;
  const end = Date.parse(payload.expiresAt);
  if (Number.isNaN(end)) return true;
  return Date.now() > end;
}

/** Código de salida: licencia inválida (run-forever no reinicia). */
export const LICENSE_EXIT_CODE = 78;

function printBlocked(message: string, machineId: string): never {
  const display = formatMachineIdDisplay(machineId);
  console.error('');
  console.error('╔══════════════════════════════════════════════════════════════╗');
  console.error('║  LICENCIA NO VÁLIDA                                          ║');
  console.error('╚══════════════════════════════════════════════════════════════╝');
  console.error('');
  console.error(`  ${message}`);
  console.error('');
  console.error(`  ID de este PC:  ${display}`);
  console.error(`  (completo)      ${machineId}`);
  console.error('');
  console.error('  Para activar:');
  console.error('    1. En este PC ejecuta:  bin\\mostrar-id-maquina.bat');
  console.error('    2. Envía el ID al proveedor del software.');
  console.error('    3. Coloca el archivo license.key en la carpeta api\\');
  console.error('    4. Vuelve a iniciar el servidor.');
  console.error('');
  console.error('  La licencia queda anclada a este equipo. No funciona si se');
  console.error('  copia la carpeta a otro PC o se altera el archivo license.key.');
  console.error('');
  process.exit(LICENSE_EXIT_CODE);
}

/**
 * Valida la licencia antes de arrancar el API.
 * En desarrollo/tests: LICENSE_SKIP=true omite la comprobación.
 * En producción (NODE_ENV=production) la licencia es obligatoria.
 */
export function assertValidLicense(): LicensePayload | null {
  if (process.env.LICENSE_SKIP === 'true' || process.env.LICENSE_SKIP === '1') {
    console.warn('[licencia] LICENSE_SKIP activo — comprobación omitida (solo desarrollo).');
    return null;
  }

  const enforce =
    process.env.LICENSE_ENFORCE === 'true' ||
    process.env.LICENSE_ENFORCE === '1' ||
    process.env.NODE_ENV === 'production';

  const machineId = getMachineId();
  const licensePath = findLicenseFile();

  if (!licensePath) {
    if (!enforce) {
      console.warn(
        `[licencia] Sin license.key (ID PC: ${formatMachineIdDisplay(machineId)}). En producción será obligatorio.`,
      );
      return null;
    }
    printBlocked('No se encontró el archivo de licencia (api\\license.key).', machineId);
  }

  let license;
  try {
    license = parseLicenseFile(readFileSync(licensePath, 'utf8'));
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    printBlocked(`No se pudo leer la licencia: ${detail}`, machineId);
  }

  if (!verifyLicenseSignature(license)) {
    printBlocked('La licencia está alterada o no es auténtica (firma inválida).', machineId);
  }

  if (license.payload.machineId.toLowerCase() !== machineId.toLowerCase()) {
    printBlocked(
      'Esta licencia pertenece a otro PC. No se puede mover la instalación a este equipo.',
      machineId,
    );
  }

  if (isExpired(license.payload)) {
    printBlocked(
      `La licencia de "${license.payload.cliente}" venció el ${license.payload.expiresAt}.`,
      machineId,
    );
  }

  console.log(
    `[licencia] OK — ${license.payload.cliente} (PC ${formatMachineIdDisplay(machineId)})`,
  );
  return license.payload;
}
