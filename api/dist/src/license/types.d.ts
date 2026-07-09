export type LicensePayload = {
    machineId: string;
    cliente: string;
    issuedAt: string;
    expiresAt: string | null;
    v: 1;
};
export type LicenseFile = {
    payload: LicensePayload;
    signature: string;
};
