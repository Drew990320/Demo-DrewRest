import type { ConfigOperativa, Prisma } from '@prisma/client';
export type ConfigOperativaRow = ConfigOperativa & Prisma.ConfigOperativaGetPayload<{
    include: {
        productoMazorca: {
            select: {
                idProducto: true;
                nombre: true;
            };
        };
        productoSodaAlmuerzo: {
            select: {
                idProducto: true;
                nombre: true;
            };
        };
        productoCuotaPendiente: {
            select: {
                idProducto: true;
                nombre: true;
            };
        };
    };
}>;
export declare function getCachedConfigOperativaRow(): ConfigOperativaRow | null;
export declare function setCachedConfigOperativaRow(row: ConfigOperativaRow): void;
export declare function invalidateConfigOperativaCache(): void;
