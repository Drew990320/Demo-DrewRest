export type LicensePayload = {
  /** Huella SHA-256 del PC autorizado */
  machineId: string;
  /** Nombre del restaurante / cliente */
  cliente: string;
  /** ISO date de emisión */
  issuedAt: string;
  /** ISO date de vencimiento, o null = sin vencimiento */
  expiresAt: string | null;
  /** Versión del formato de licencia */
  v: 1;
};

export type LicenseFile = {
  payload: LicensePayload;
  /** Firma Ed25519 en base64 del JSON canónico del payload */
  signature: string;
};
