"use strict";
/** Línea de pedido con producto repartible y sin reparto completo de subítems. */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sumaCantidadesSubitems = sumaCantidadesSubitems;
exports.detalleSubitemsPendientes = detalleSubitemsPendientes;
function sumaCantidadesSubitems(subitems) {
    if (!subitems?.length)
        return 0;
    return subitems.reduce((acc, item) => acc + Number(item.cantidad || 0), 0);
}
/**
 * True si el producto usa subítems repartibles y la suma asignada
 * no coincide con la cantidad de la línea (incluye suma 0 = pendiente).
 */
function detalleSubitemsPendientes(d) {
    if (!d.usa_subitems_repartibles)
        return false;
    return sumaCantidadesSubitems(d.subitems) !== d.cantidad;
}
