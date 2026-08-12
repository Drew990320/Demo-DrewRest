"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reintegrarStockRetailTx = reintegrarStockRetailTx;
exports.descontarStockRetailTx = descontarStockRetailTx;
const common_1 = require("@nestjs/common");
function esRetail(det) {
    return det.producto.categoria.canal === 'retail';
}
async function reintegrarStockRetailTx(tx, det, cantidad = det.cantidad) {
    if (!esRetail(det) || cantidad <= 0)
        return;
    if (det.idProductoVariante != null) {
        await tx.productoVariante.update({
            where: { idVariante: det.idProductoVariante },
            data: { stockDisponible: { increment: cantidad } },
        });
        return;
    }
    if (det.producto.controlStock) {
        await tx.producto.update({
            where: { idProducto: det.idProducto },
            data: { stockDisponible: { increment: cantidad } },
        });
    }
}
async function descontarStockRetailTx(tx, det, cantidad) {
    if (!esRetail(det) || cantidad <= 0)
        return;
    if (det.idProductoVariante != null) {
        const v = await tx.productoVariante.findUnique({
            where: { idVariante: det.idProductoVariante },
        });
        if (!v || (det.producto.controlStock && v.stockDisponible < cantidad)) {
            throw new common_1.BadRequestException('Stock insuficiente de la variante');
        }
        await tx.productoVariante.update({
            where: { idVariante: det.idProductoVariante },
            data: { stockDisponible: { decrement: cantidad } },
        });
        return;
    }
    if (det.producto.controlStock) {
        const p = await tx.producto.findUnique({
            where: { idProducto: det.idProducto },
        });
        if (!p || p.stockDisponible < cantidad) {
            throw new common_1.BadRequestException('Stock insuficiente');
        }
        await tx.producto.update({
            where: { idProducto: det.idProducto },
            data: { stockDisponible: { decrement: cantidad } },
        });
    }
}
//# sourceMappingURL=stock-retail.js.map