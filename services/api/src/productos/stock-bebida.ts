import { BadRequestException } from '@nestjs/common';
import type { Categoria, Prisma, Producto } from '@prisma/client';

export type ProductoStockCtx = Producto & {
  categoria?: Pick<Categoria, 'esBebida'>;
};

export function aplicaControlStockBebida(p: ProductoStockCtx): boolean {
  return Boolean(p.controlStock && p.categoria?.esBebida);
}

export async function descontarStockBebidaTx(
  tx: Prisma.TransactionClient,
  p: ProductoStockCtx,
  cantidad: number,
): Promise<void> {
  if (!aplicaControlStockBebida(p) || cantidad <= 0) return;
  const r = await tx.producto.updateMany({
    where: {
      idProducto: p.idProducto,
      controlStock: true,
      stockDisponible: { gte: cantidad },
    },
    data: { stockDisponible: { decrement: cantidad } },
  });
  if (r.count === 0) {
    throw new BadRequestException(
      `Stock insuficiente de «${p.nombre}» (disponible: ${p.stockDisponible})`,
    );
  }
}

export async function reintegrarStockBebidaTx(
  tx: Prisma.TransactionClient,
  p: ProductoStockCtx,
  cantidad: number,
): Promise<void> {
  if (!aplicaControlStockBebida(p) || cantidad <= 0) return;
  await tx.producto.update({
    where: { idProducto: p.idProducto },
    data: { stockDisponible: { increment: cantidad } },
  });
}

export async function ajustarStockBebidaTx(
  tx: Prisma.TransactionClient,
  p: ProductoStockCtx,
  deltaCantidad: number,
): Promise<void> {
  if (deltaCantidad > 0) {
    await descontarStockBebidaTx(tx, p, deltaCantidad);
  } else if (deltaCantidad < 0) {
    await reintegrarStockBebidaTx(tx, p, -deltaCantidad);
  }
}
