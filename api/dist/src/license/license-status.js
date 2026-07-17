"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leerEstadoLicencia = leerEstadoLicencia;
const fs_1 = require("fs");
const path_1 = require("path");
const drewtech_soporte_1 = require("@drewrest/shared-domain/drewtech-soporte");
const license_crypto_1 = require("./license-crypto");
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
function leerEstadoLicencia() {
    const base = {
        warn_within_days: drewtech_soporte_1.LICENSE_WARN_WITHIN_DAYS,
        drewtech_telefono: drewtech_soporte_1.DREWTECH_TELEFONO,
        drewtech_telefono_label: drewtech_soporte_1.DREWTECH_TELEFONO_LABEL,
        drewtech_horario: drewtech_soporte_1.DREWTECH_HORARIO_ATENCION,
    };
    if (process.env.LICENSE_SKIP === 'true' || process.env.LICENSE_SKIP === '1') {
        return {
            ...base,
            skipped: true,
            presente: false,
            cliente: null,
            expires_at: null,
            days_left: null,
            warn: false,
            titulo: null,
            mensaje: null,
        };
    }
    const path = findLicenseFile();
    if (!path) {
        return {
            ...base,
            skipped: false,
            presente: false,
            cliente: null,
            expires_at: null,
            days_left: null,
            warn: false,
            titulo: null,
            mensaje: null,
        };
    }
    try {
        const license = (0, license_crypto_1.parseLicenseFile)((0, fs_1.readFileSync)(path, 'utf8'));
        const expiresAt = license.payload.expiresAt;
        const daysLeft = (0, drewtech_soporte_1.diasHastaVencimientoLicencia)(expiresAt);
        const warn = (0, drewtech_soporte_1.debeAvisarLicenciaProxima)(expiresAt);
        return {
            ...base,
            skipped: false,
            presente: true,
            cliente: license.payload.cliente ?? null,
            expires_at: expiresAt,
            days_left: daysLeft,
            warn,
            titulo: warn && daysLeft != null ? (0, drewtech_soporte_1.tituloAvisoLicencia)(daysLeft) : null,
            mensaje: warn && daysLeft != null ? (0, drewtech_soporte_1.mensajeAvisoLicenciaDrewTech)(daysLeft) : null,
        };
    }
    catch {
        return {
            ...base,
            skipped: false,
            presente: true,
            cliente: null,
            expires_at: null,
            days_left: null,
            warn: false,
            titulo: null,
            mensaje: null,
        };
    }
}
//# sourceMappingURL=license-status.js.map