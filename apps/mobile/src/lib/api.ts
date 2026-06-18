import { API_URL } from './config';
import { localApi } from './local-api';
import { deleteOfflineCache, readOfflineCache, writeOfflineCache } from './offline-cache';
import { invalidateMenuTodayCache } from './menu-cache';
import { storage } from './storage';

const inflightGet = new Map<string, Promise<unknown>>();

export type ApiOptions = RequestInit & {
  token?: string | null;
  /**
   * Solo en GET: guarda la respuesta y, si no hay red, devuelve la última copia válida (~10 min).
   */
  cacheKey?: string;
};

export async function api<T = unknown>(
  path: string,
  opts: ApiOptions = {},
): Promise<T> {
  if (process.env.EXPO_PUBLIC_LOCAL_MODE === 'true') {
    return localApi<T>(path, opts);
  }

  const { cacheKey, token, ...fetchOpts } = opts;
  const method = (fetchOpts.method ?? 'GET').toUpperCase();
  const isGet = method === 'GET';

  const headers = new Headers(fetchOpts.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const url = `${API_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;

  const wrapNetworkError = (e: unknown): Error => {
    const base = `No se pudo conectar con el API (${API_URL}). `;
    const isExpoWeb =
      typeof window !== 'undefined' && typeof window.document !== 'undefined';
    const hint = isExpoWeb
      ? 'En el navegador (Expo Web) en este PC pon en .env: EXPO_PUBLIC_API_URL=http://127.0.0.1:3000 (o http://localhost:3000). La IP LAN (192.168.x.x) suele fallar si no es la de este equipo o el API no está en marcha. '
      : '';
    const tail =
      'Comprueba que Nest esté en marcha (puerto 3000), el firewall y que la URL coincida con tu red.';
    if (
      e instanceof TypeError ||
      (e instanceof Error && /failed to fetch|network request failed/i.test(e.message))
    ) {
      return new Error(`${base}${hint}${tail}`);
    }
    return e instanceof Error ? e : new Error(String(e));
  };

  const run = async (): Promise<T> => {
    let res: Response;
    const t0 = Date.now();
    try {
      res = await fetch(url, { ...fetchOpts, headers });
    } catch (e) {
      if (__DEV__) {
        const ms = Date.now() - t0;
        console.warn(
          '[api] fetch falló',
          { method, url, ms, error: e instanceof Error ? e.message : String(e) },
        );
      }
      throw wrapNetworkError(e);
    }
    if (__DEV__) {
      const ms = Date.now() - t0;
      if (ms > 4000) {
        console.warn('[api] respuesta lenta', { method, url, ms, status: res.status });
      }
    }
    const body = (await res.json().catch(() => null)) as unknown;
    if (res.ok && !isGet && /\/productos(\/|\?|$)/.test(url)) {
      await deleteOfflineCache('menu_today').catch(() => undefined);
      invalidateMenuTodayCache();
    }
    if (!res.ok) {
      if (res.status === 401) {
        await storage.deleteItem('lr_token');
        await storage.deleteItem('lr_user');
      }
      const err =
        body && typeof body === 'object' && body !== null
          ? (body as Record<string, unknown>)
          : {};
      const msg = Array.isArray(err.message)
        ? (err.message as string[]).join(', ')
        : (err.message as string) || res.statusText;
      throw new Error(msg || `HTTP ${res.status}`);
    }
    if (cacheKey && isGet) {
      await writeOfflineCache(cacheKey, body as T);
    }
    return body as T;
  };

  try {
    if (isGet && cacheKey) {
      const dedupeKey = `${cacheKey}:${url}`;
      const existing = inflightGet.get(dedupeKey);
      if (existing) {
        return (await existing) as T;
      }
      const promise = run();
      inflightGet.set(dedupeKey, promise);
      try {
        return await promise;
      } finally {
        inflightGet.delete(dedupeKey);
      }
    }
    return await run();
  } catch (e) {
    if (cacheKey && isGet) {
      const cached = await readOfflineCache<T>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }
    throw wrapNetworkError(e);
  }
}
