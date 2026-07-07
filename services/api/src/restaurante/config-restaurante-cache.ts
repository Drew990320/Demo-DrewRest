import type { ConfigRestaurante } from '@prisma/client';

const TTL_MS = 60_000;
let cache: { row: ConfigRestaurante; expiresAt: number } | null = null;

export function getCachedConfigRestaurante(): ConfigRestaurante | null {
  if (!cache || cache.expiresAt <= Date.now()) {
    if (cache) cache = null;
    return null;
  }
  return cache.row;
}

export function setCachedConfigRestaurante(row: ConfigRestaurante): void {
  cache = { row, expiresAt: Date.now() + TTL_MS };
}

export function invalidateConfigRestauranteCache(): void {
  cache = null;
}
