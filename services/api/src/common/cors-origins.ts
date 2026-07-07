type CorsOriginCallback = (err: Error | null, allow?: boolean) => void;

/** Lista de orígenes permitidos desde CORS_ORIGINS (coma-separados). Vacío = LAN abierta. */
export function resolveCorsOrigin():
  | boolean
  | ((origin: string | undefined, callback: CorsOriginCallback) => void) {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) return true;

  const allowlist = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (allowlist.length === 0) return true;

  return (origin: string | undefined, callback: CorsOriginCallback) => {
    if (!origin || allowlist.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS bloqueado para origen: ${origin}`));
  };
}
