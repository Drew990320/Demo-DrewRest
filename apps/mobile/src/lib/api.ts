import { API_URL } from './config';
import { deleteOfflineCache, readOfflineCache, writeOfflineCache } from './offline-cache';
import { invalidateMenuTodayCache } from './menu-cache';
import { ApiHttpError, ApiNetworkError, isApiHttpError, MENSAJE_SIN_CONEXION } from './api-error';
import {
  notifyUnauthorized,
  parseUnauthorizedMessage,
} from './auth-session';
import { tryRefreshAccessToken } from './auth-token-refresh';

const inflightGet = new Map<string, Promise<unknown>>();

/** Evita peticiones colgadas cuando el API o la red se saturan. */
const DEFAULT_REQUEST_TIMEOUT_MS = 25_000;

export type ApiOptions = RequestInit & {
  token?: string | null;
  /**
   * Solo en GET: guarda la respuesta y, si no hay red, devuelve la última copia válida (~10 min).
   */
  cacheKey?: string;
  /** Si es false, un GET fallido no devuelve caché offline (obligatorio antes de cobrar). */
  offlineFallback?: boolean;
  /** Timeout en ms (por defecto 25s). */
  timeoutMs?: number;
};

function mergeAbortSignals(
  external: AbortSignal | null | undefined,
  timeoutMs: number,
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const onExternalAbort = () => controller.abort();
  if (external) {
    if (external.aborted) {
      controller.abort();
    } else {
      external.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer);
      external?.removeEventListener('abort', onExternalAbort);
    },
  };
}

export async function api<T = unknown>(
  path: string,
  opts: ApiOptions = {},
): Promise<T> {
  const {
    cacheKey,
    token,
    offlineFallback = true,
    timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
    ...fetchOpts
  } = opts;

  if (process.env.EXPO_PUBLIC_LOCAL_MODE === 'true') {
    try {
      // Solo en modo local: evita meter ~5k líneas de mock en el bundle de producción.
      const { localApi } = await import('./local-api');
      return await localApi<T>(path, opts);
    } catch (e) {
      if (isApiHttpError(e) && e.status === 401 && token) {
        await notifyUnauthorized(parseUnauthorizedMessage(e.message), e.message);
      }
      throw e;
    }
  }

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
    if (
      e instanceof ApiNetworkError ||
      e instanceof ApiHttpError
    ) {
      return e;
    }
    if (
      e instanceof Error &&
      (e.name === 'AbortError' || /aborted|timeout/i.test(e.message))
    ) {
      return new ApiNetworkError(MENSAJE_SIN_CONEXION, API_URL);
    }
    if (
      e instanceof TypeError ||
      (e instanceof Error && /failed to fetch|network request failed/i.test(e.message))
    ) {
      if (__DEV__) {
        const isExpoWeb =
          typeof window !== 'undefined' && typeof window.document !== 'undefined';
        console.warn('[api] sin conexión', {
          url: API_URL,
          hint: isExpoWeb
            ? 'Revisa EXPO_PUBLIC_API_URL en .env'
            : 'Revisa que el servidor esté en marcha y la red sea la misma',
        });
      }
      return new ApiNetworkError(MENSAJE_SIN_CONEXION, API_URL);
    }
    return e instanceof Error ? e : new Error(String(e));
  };

  const run = async (): Promise<T> => {
    let res: Response;
    const t0 = Date.now();
    const { signal, cleanup } = mergeAbortSignals(fetchOpts.signal, timeoutMs);
    try {
      res = await fetch(url, { ...fetchOpts, headers, signal });
    } catch (e) {
      if (__DEV__) {
        const ms = Date.now() - t0;
        console.warn(
          '[api] fetch falló',
          { method, url, ms, error: e instanceof Error ? e.message : String(e) },
        );
      }
      throw wrapNetworkError(e);
    } finally {
      cleanup();
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
    if (res.ok && !isGet) {
      const pedidoMatch = url.match(/\/pedidos\/(\d+)(?:\/|$)/);
      if (pedidoMatch) {
        const pedidoCacheKey = `pedido_${pedidoMatch[1]}`;
        await deleteOfflineCache(pedidoCacheKey).catch(() => undefined);
        for (const key of [...inflightGet.keys()]) {
          if (key.startsWith(`${pedidoCacheKey}:`)) {
            inflightGet.delete(key);
          }
        }
      }
      // Vaciar día / cancelar reabiertos invalidan el resumen en caché.
      if (/\/pedidos\/resumen-diario\//.test(url)) {
        for (const key of [...inflightGet.keys()]) {
          if (key.startsWith('resumen_')) {
            inflightGet.delete(key);
          }
        }
        await deleteOfflineCache('resumen_hoy').catch(() => undefined);
        try {
          const u = new URL(url);
          const f = u.searchParams.get('fecha')?.trim();
          if (f) {
            await deleteOfflineCache(`resumen_${f}`).catch(() => undefined);
          }
        } catch {
          /* ignore */
        }
      }
    }
    if (!res.ok) {
      const err =
        body && typeof body === 'object' && body !== null
          ? (body as Record<string, unknown>)
          : {};
      const msg = Array.isArray(err.message)
        ? (err.message as string[]).join(', ')
        : (err.message as string) || res.statusText;
      const message = msg || `HTTP ${res.status}`;
      if (res.status === 401 && token) {
        const renewed = await tryRefreshAccessToken();
        if (renewed) {
          headers.set('Authorization', `Bearer ${renewed}`);
          const { signal: retrySignal, cleanup: retryCleanup } = mergeAbortSignals(
            fetchOpts.signal,
            timeoutMs,
          );
          try {
            const retryRes = await fetch(url, {
              ...fetchOpts,
              headers,
              signal: retrySignal,
            });
            const retryBody = (await retryRes.json().catch(() => null)) as unknown;
            if (retryRes.ok) {
              if (cacheKey && isGet) {
                await writeOfflineCache(cacheKey, retryBody as T);
              }
              return retryBody as T;
            }
          } finally {
            retryCleanup();
          }
        }
        await notifyUnauthorized(parseUnauthorizedMessage(message), message);
      }
      throw new ApiHttpError(message, res.status);
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
    if (cacheKey && isGet && offlineFallback) {
      const cached = await readOfflineCache<T>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }
    throw wrapNetworkError(e);
  }
}
