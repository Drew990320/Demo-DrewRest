/** Permite a `api()` renovar el JWT antes de cerrar sesión por 401. */
let refreshAccessToken: (() => Promise<string | null>) | null = null;

export function registerAccessTokenRefresher(
  fn: (() => Promise<string | null>) | null,
): void {
  refreshAccessToken = fn;
}

export async function tryRefreshAccessToken(): Promise<string | null> {
  if (!refreshAccessToken) return null;
  try {
    return await refreshAccessToken();
  } catch {
    return null;
  }
}
