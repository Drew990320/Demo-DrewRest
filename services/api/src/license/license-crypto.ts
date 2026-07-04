import { createPublicKey, verify } from 'crypto';
import { LICENSE_PUBLIC_KEY_PEM } from './public-key';
import type { LicenseFile, LicensePayload } from './types';

/** Serialización estable del payload (mismo orden que al firmar). */
export function canonicalPayload(payload: LicensePayload): string {
  return JSON.stringify({
    v: payload.v,
    machineId: payload.machineId,
    cliente: payload.cliente,
    issuedAt: payload.issuedAt,
    expiresAt: payload.expiresAt,
  });
}

export function verifyLicenseSignature(license: LicenseFile): boolean {
  try {
    const key = createPublicKey(LICENSE_PUBLIC_KEY_PEM);
    const data = Buffer.from(canonicalPayload(license.payload), 'utf8');
    const sig = Buffer.from(license.signature, 'base64');
    return verify(null, data, key, sig);
  } catch {
    return false;
  }
}

export function parseLicenseFile(raw: string): LicenseFile {
  const parsed = JSON.parse(raw) as LicenseFile;
  if (!parsed?.payload || typeof parsed.signature !== 'string') {
    throw new Error('Formato de licencia inválido');
  }
  const p = parsed.payload;
  if (
    p.v !== 1 ||
    typeof p.machineId !== 'string' ||
    typeof p.cliente !== 'string' ||
    typeof p.issuedAt !== 'string' ||
    !(p.expiresAt === null || typeof p.expiresAt === 'string')
  ) {
    throw new Error('Campos de licencia incompletos o inválidos');
  }
  return parsed;
}
