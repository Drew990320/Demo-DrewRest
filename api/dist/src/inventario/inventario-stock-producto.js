"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventarioComercialPorProductoTx = inventarioComercialPorProductoTx;
exports.syncStockProductoDesdeInventarioTx = syncStockProductoDesdeInventarioTx;
exports.productoUsaInventarioComercial = productoUsaInventarioComercial;
const inventario_unidades_1 = require("@drewrest/shared-domain/inventario-unidades");
async function inventarioComercialPorProductoTx(tx, idProducto, idRestaurante) {
    return tx.inventario.findFirst({
        where: {
            idProducto,
            idRestaurante,
            claseInventario: 'comercial',
        },
    });
}
async function syncStockProductoDesdeInventarioTx(tx, idProducto, idRestaurante) {
    const inv = await inventarioComercialPorProductoTx(tx, idProducto, idRestaurante);
    if (!inv)
        return;
    const n = Math.max(0, Math.floor((0, inventario_unidades_1.redondearInventario)(Number(inv.cantidadActual))));
    await tx.producto.update({
        where: { idProducto },
        data: {
            controlStock: true,
            stockDisponible: n,
        },
    });
}
function productoUsaInventarioComercial(inv) {
    return inv != null;
}
//# sourceMappingURL=inventario-stock-producto.js.map