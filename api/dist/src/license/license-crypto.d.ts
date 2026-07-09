import type { LicenseFile, LicensePayload } from './types';
export declare function canonicalPayload(payload: LicensePayload): string;
export declare function verifyLicenseSignature(license: LicenseFile): boolean;
export declare function parseLicenseFile(raw: string): LicenseFile;
