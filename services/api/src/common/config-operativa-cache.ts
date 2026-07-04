import type { ConfigOperativa, Prisma } from '@prisma/client';

export type ConfigOperativaRow = ConfigOperativa &
  Prisma.ConfigOperativaGetPayload<{
    include: {
      productoMazorca: { select: { idProducto: true; nombre: true } };
      productoSodaAlmuerzo: { select: { idProducto: true; nombre: true } };
      productoCuotaPendiente: { select: { idProducto: true; nombre: true } };
    };
  }>;

const TTL_MS = 60_000;
let cache: { row: ConfigOperativaRow; expiresAt: number } | null = null;

export function getCachedConfigOperativaRow(): ConfigOperativaRow | null {
  if (!cache || cache.expiresAt <= Date.now()) {
    if (cache) cache = null;
    return null;
  }
  return cache.row;
}

export function setCachedConfigOperativaRow(row: ConfigOperativaRow): void {
  cache = { row, expiresAt: Date.now() + TTL_MS };
}

export function invalidateConfigOperativaCache(): void {
  cache = null;
}
