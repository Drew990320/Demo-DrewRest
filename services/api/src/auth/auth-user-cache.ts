import type { Rol, Usuario } from '@prisma/client';

export type UsuarioConRol = Usuario & { rol: Rol };

const TTL_MS = 60_000;
const cache = new Map<number, { user: UsuarioConRol; expiresAt: number }>();

export function getCachedAuthUser(idUsuario: number): UsuarioConRol | null {
  const row = cache.get(idUsuario);
  if (!row) return null;
  if (row.expiresAt <= Date.now()) {
    cache.delete(idUsuario);
    return null;
  }
  return row.user;
}

export function setCachedAuthUser(user: UsuarioConRol): void {
  cache.set(user.idUsuario, {
    user,
    expiresAt: Date.now() + TTL_MS,
  });
}

export function invalidateAuthUser(idUsuario: number): void {
  cache.delete(idUsuario);
}

export function clearAuthUserCache(): void {
  cache.clear();
}
