import type { ConfigRestaurante } from '@prisma/client';
export declare function getCachedConfigRestaurante(): ConfigRestaurante | null;
export declare function setCachedConfigRestaurante(row: ConfigRestaurante): void;
export declare function invalidateConfigRestauranteCache(): void;
