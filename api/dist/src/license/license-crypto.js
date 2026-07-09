"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canonicalPayload = canonicalPayload;
exports.verifyLicenseSignature = verifyLicenseSignature;
exports.parseLicenseFile = parseLicenseFile;
const crypto_1 = require("crypto");
const public_key_1 = require("./public-key");
function canonicalPayload(payload) {
    return JSON.stringify({
        v: payload.v,
        machineId: payload.machineId,
        cliente: payload.cliente,
        issuedAt: payload.issuedAt,
        expiresAt: payload.expiresAt,
    });
}
function verifyLicenseSignature(license) {
    try {
        const key = (0, crypto_1.createPublicKey)(public_key_1.LICENSE_PUBLIC_KEY_PEM);
        const data = Buffer.from(canonicalPayload(license.payload), 'utf8');
        const sig = Buffer.from(license.signature, 'base64');
        return (0, crypto_1.verify)(null, data, key, sig);
    }
    catch {
        return false;
    }
}
function parseLicenseFile(raw) {
    const parsed = JSON.parse(raw);
    if (!parsed?.payload || typeof parsed.signature !== 'string') {
        throw new Error('Formato de licencia inválido');
    }
    const p = parsed.payload;
    if (p.v !== 1 ||
        typeof p.machineId !== 'string' ||
        typeof p.cliente !== 'string' ||
        typeof p.issuedAt !== 'string' ||
        !(p.expiresAt === null || typeof p.expiresAt === 'string')) {
        throw new Error('Campos de licencia incompletos o inválidos');
    }
    return parsed;
}
//# sourceMappingURL=license-crypto.js.map