const TTL_MS = 60_000;

type MenuHoyPayload = { categorias: unknown[] };

let cache: { data: MenuHoyPayload; expiresAt: number } | null = null;

export function getCachedMenuHoy(): MenuHoyPayload | null {
  if (!cache || cache.expiresAt <= Date.now()) {
    if (cache) cache = null;
    return null;
  }
  return cache.data;
}

export function setCachedMenuHoy(data: MenuHoyPayload): void {
  cache = { data, expiresAt: Date.now() + TTL_MS };
}

export function invalidateMenuHoyCache(): void {
  cache = null;
}
