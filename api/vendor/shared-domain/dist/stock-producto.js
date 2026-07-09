"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productoAgotado = productoAgotado;
exports.productoVisibleEnMenu = productoVisibleEnMenu;
exports.puedePedirCantidad = puedePedirCantidad;
exports.stockEtiqueta = stockEtiqueta;
function productoAgotado(p) {
    return Boolean(p.control_stock) && Math.max(0, p.stock_disponible ?? 0) <= 0;
}
/** Si el producto debe listarse en el menú del día. */
function productoVisibleEnMenu(p) {
    if (p.activo === false)
        return false;
    if (!productoAgotado(p))
        return true;
    return p.ocultar_sin_stock === false;
}
function puedePedirCantidad(p, cantidad) {
    if (cantidad < 1)
        return false;
    if (!p.control_stock)
        return true;
    return (p.stock_disponible ?? 0) >= cantidad;
}
function stockEtiqueta(p) {
    if (!p.control_stock)
        return null;
    const n = Math.max(0, p.stock_disponible ?? 0);
    return n <= 0 ? 'Agotado' : `Quedan ${n}`;
}
