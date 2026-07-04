import type { Rol, Usuario } from '@prisma/client';

export type UsuarioConRol = Usuario & { rol: Rol };

const TTL_MS = 60_000;
const MAX_ENTRIES = 200;
const cache = new Map<number, { user: UsuarioConRol; expiresAt: number }>();

function evictExpired(now: number): void {
  for (const [id, row] of cache) {
    if (row.expiresAt <= now) cache.delete(id);
  }
}

function evictOldestIfFull(): void {
  if (cache.size < MAX_ENTRIES) return;
  const first = cache.keys().next().value;
  if (first != null) cache.delete(first);
}

export function getCachedAuthUser(idUsuario: number): UsuarioConRol | null {
  const row = cache.get(idUsuario);
  if (!row) return null;
  if (row.expiresAt <= Date.now()) {
    cache.delete(idUsuario);
    return null;
  }
  // Refresh LRU order (Map insertion order).
  cache.delete(idUsuario);
  cache.set(idUsuario, row);
  return row.user;
}

export function setCachedAuthUser(user: UsuarioConRol): void {
  const now = Date.now();
  evictExpired(now);
  if (cache.has(user.idUsuario)) {
    cache.delete(user.idUsuario);
  } else {
    evictOldestIfFull();
  }
  cache.set(user.idUsuario, {
    user,
    expiresAt: now + TTL_MS,
  });
}

export function invalidateAuthUser(idUsuario: number): void {
  cache.delete(idUsuario);
}

export function clearAuthUserCache(): void {
  cache.clear();
}
