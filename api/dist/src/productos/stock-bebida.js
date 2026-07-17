"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aplicaControlStockBebida = aplicaControlStockBebida;
exports.descontarStockBebidaTx = descontarStockBebidaTx;
exports.reintegrarStockBebidaTx = reintegrarStockBebidaTx;
exports.ajustarStockBebidaTx = ajustarStockBebidaTx;
const common_1 = require("@nestjs/common");
const inventario_stock_producto_1 = require("../inventario/inventario-stock-producto");
function aplicaControlStockBebida(p) {
    return Boolean(p.controlStock && p.categoria?.esBebida);
}
async function descontarStockBebidaTx(tx, p, cantidad) {
    if (!aplicaControlStockBebida(p) || cantidad <= 0)
        return;
    const tenantId = p.idRestaurante ?? 1;
    const inv = await (0, inventario_stock_producto_1.inventarioComercialPorProductoTx)(tx, p.idProducto, tenantId);
    if ((0, inventario_stock_producto_1.productoUsaInventarioComercial)(inv)) {
        return;
    }
    const r = await tx.producto.updateMany({
        where: {
            idProducto: p.idProducto,
            controlStock: true,
            stockDisponible: { gte: cantidad },
        },
        data: { stockDisponible: { decrement: cantidad } },
    });
    if (r.count === 0) {
        throw new common_1.BadRequestException(`Stock insuficiente de «${p.nombre}» (disponible: ${p.stockDisponible})`);
    }
}
async function reintegrarStockBebidaTx(tx, p, cantidad) {
    if (!aplicaControlStockBebida(p) || cantidad <= 0)
        return;
    const tenantId = p.idRestaurante ?? 1;
    const inv = await (0, inventario_stock_producto_1.inventarioComercialPorProductoTx)(tx, p.idProducto, tenantId);
    if ((0, inventario_stock_producto_1.productoUsaInventarioComercial)(inv)) {
        return;
    }
    await tx.producto.update({
        where: { idProducto: p.idProducto },
        data: { stockDisponible: { increment: cantidad } },
    });
}
async function ajustarStockBebidaTx(tx, p, deltaCantidad) {
    if (deltaCantidad > 0) {
        await descontarStockBebidaTx(tx, p, deltaCantidad);
    }
    else if (deltaCantidad < 0) {
        await reintegrarStockBebidaTx(tx, p, -deltaCantidad);
    }
}
//# sourceMappingURL=stock-bebida.js.map