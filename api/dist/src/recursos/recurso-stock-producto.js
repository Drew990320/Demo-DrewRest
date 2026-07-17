"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recursoComercialPorProductoTx = recursoComercialPorProductoTx;
exports.syncStockProductoDesdeRecursoTx = syncStockProductoDesdeRecursoTx;
const inventario_unidades_1 = require("@drewrest/shared-domain/inventario-unidades");
async function recursoComercialPorProductoTx(tx, idProducto, idRestaurante) {
    return tx.recurso.findFirst({
        where: {
            idProducto,
            idRestaurante,
            categoria: { puedeVenderse: true },
            estado: { not: 'baja' },
        },
        include: { categoria: true },
    });
}
async function syncStockProductoDesdeRecursoTx(tx, idProducto, idRestaurante) {
    const rec = await recursoComercialPorProductoTx(tx, idProducto, idRestaurante);
    if (!rec)
        return;
    const n = Math.max(0, Math.floor((0, inventario_unidades_1.redondearInventario)(Number(rec.stock))));
    await tx.producto.update({
        where: { idProducto },
        data: {
            controlStock: true,
            stockDisponible: n,
        },
    });
}
//# sourceMappingURL=recurso-stock-producto.js.map