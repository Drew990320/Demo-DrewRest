import { Prisma } from '@prisma/client';

/** Bloquea la fila de mesa hasta commit (evita carreras al abrir/transferir). */
export async function lockMesaEnTx(
  tx: Prisma.TransactionClient,
  idMesa: number,
): Promise<void> {
  await tx.$queryRaw`SELECT id_mesa FROM mesa WHERE id_mesa = ${idMesa} FOR UPDATE`;
}

/** Bloquea la fila de pedido hasta commit (evita cobros parciales concurrentes). */
export async function lockPedidoEnTx(
  tx: Prisma.TransactionClient,
  idPedido: number,
): Promise<void> {
  await tx.$queryRaw`SELECT id_pedido FROM pedido WHERE id_pedido = ${idPedido} FOR UPDATE`;
}
