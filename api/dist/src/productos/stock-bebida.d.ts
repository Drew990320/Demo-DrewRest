import type { Categoria, Prisma, Producto } from '@prisma/client';
export type ProductoStockCtx = Producto & {
    categoria?: Pick<Categoria, 'esBebida'>;
};
export declare function aplicaControlStockBebida(p: ProductoStockCtx): boolean;
export declare function descontarStockBebidaTx(tx: Prisma.TransactionClient, p: ProductoStockCtx, cantidad: number): Promise<void>;
export declare function reintegrarStockBebidaTx(tx: Prisma.TransactionClient, p: ProductoStockCtx, cantidad: number): Promise<void>;
export declare function ajustarStockBebidaTx(tx: Prisma.TransactionClient, p: ProductoStockCtx, deltaCantidad: number): Promise<void>;
