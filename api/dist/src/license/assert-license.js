"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LICENSE_EXIT_CODE = void 0;
exports.assertValidLicense = assertValidLicense;
const fs_1 = require("fs");
const path_1 = require("path");
const license_crypto_1 = require("./license-crypto");
const machine_id_1 = require("./machine-id");
function licensePaths() {
    const cwd = process.cwd();
    const envPath = process.env.LICENSE_FILE?.trim();
    const paths = [
        envPath,
        (0, path_1.join)(cwd, 'license.key'),
        (0, path_1.join)(cwd, 'license.json'),
        (0, path_1.join)(__dirname, '..', '..', 'license.key'),
        (0, path_1.join)(__dirname, '..', '..', 'license.json'),
    ].filter((p) => Boolean(p));
    return [...new Set(paths)];
}
function findLicenseFile() {
    for (const p of licensePaths()) {
        if ((0, fs_1.existsSync)(p))
            return p;
    }
    return null;
}
function isExpired(payload) {
    if (!payload.expiresAt)
        return false;
    const end = Date.parse(payload.expiresAt);
    if (Number.isNaN(end))
        return true;
    return Date.now() > end;
}
exports.LICENSE_EXIT_CODE = 78;
function printBlocked(message, machineId) {
    const display = (0, machine_id_1.formatMachineIdDisplay)(machineId);
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
    process.exit(exports.LICENSE_EXIT_CODE);
}
function assertValidLicense() {
    if (process.env.LICENSE_SKIP === 'true' || process.env.LICENSE_SKIP === '1') {
        console.warn('[licencia] LICENSE_SKIP activo — comprobación omitida (solo desarrollo).');
        return null;
    }
    const enforce = process.env.LICENSE_ENFORCE === 'true' ||
        process.env.LICENSE_ENFORCE === '1' ||
        process.env.NODE_ENV === 'production';
    const machineId = (0, machine_id_1.getMachineId)();
    const licensePath = findLicenseFile();
    if (!licensePath) {
        if (!enforce) {
            console.warn(`[licencia] Sin license.key (ID PC: ${(0, machine_id_1.formatMachineIdDisplay)(machineId)}). En producción será obligatorio.`);
            return null;
        }
        printBlocked('No se encontró el archivo de licencia (api\\license.key).', machineId);
    }
    let license;
    try {
        license = (0, license_crypto_1.parseLicenseFile)((0, fs_1.readFileSync)(licensePath, 'utf8'));
    }
    catch (e) {
        const detail = e instanceof Error ? e.message : String(e);
        printBlocked(`No se pudo leer la licencia: ${detail}`, machineId);
    }
    if (!(0, license_crypto_1.verifyLicenseSignature)(license)) {
        printBlocked('La licencia está alterada o no es auténtica (firma inválida).', machineId);
    }
    if (license.payload.machineId.toLowerCase() !== machineId.toLowerCase()) {
        printBlocked('Esta licencia pertenece a otro PC. No se puede mover la instalación a este equipo.', machineId);
    }
    if (isExpired(license.payload)) {
        printBlocked(`La licencia de "${license.payload.cliente}" venció el ${license.payload.expiresAt}.`, machineId);
    }
    console.log(`[licencia] OK — ${license.payload.cliente} (PC ${(0, machine_id_1.formatMachineIdDisplay)(machineId)})`);
    return license.payload;
}
//# sourceMappingURL=assert-license.js.map