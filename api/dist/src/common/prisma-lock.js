"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lockMesaEnTx = lockMesaEnTx;
exports.lockPedidoEnTx = lockPedidoEnTx;
async function lockMesaEnTx(tx, idMesa) {
    await tx.$queryRaw `SELECT id_mesa FROM mesa WHERE id_mesa = ${idMesa} FOR UPDATE`;
}
async function lockPedidoEnTx(tx, idPedido) {
    await tx.$queryRaw `SELECT id_pedido FROM pedido WHERE id_pedido = ${idPedido} FOR UPDATE`;
}
//# sourceMappingURL=prisma-lock.js.map