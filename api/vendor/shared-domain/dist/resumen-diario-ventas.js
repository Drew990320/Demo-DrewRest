"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agregarVentasResumenDiario = agregarVentasResumenDiario;
/** Agrupa líneas facturadas del día en platos por categoría e ítems del menú. */
function agregarVentasResumenDiario(lineas) {
    const byCatPlatos = new Map();
    const byProducto = new Map();
    for (const l of lineas) {
        if (l.es_acompanamiento_mazorca)
            continue;
        if (l.es_cuota_pendiente_reparto)
            continue;
        const prevProd = byProducto.get(l.id_producto);
        if (prevProd) {
            prevProd.cantidad += l.cantidad;
            prevProd.subtotal += l.subtotal_linea;
        }
        else {
            byProducto.set(l.id_producto, {
                id_producto: l.id_producto,
                nombre_producto: l.nombre_producto,
                categoria_nombre: l.categoria_nombre,
                cantidad: l.cantidad,
                subtotal: l.subtotal_linea,
            });
        }
        if (l.es_plato_principal) {
            const prevCat = byCatPlatos.get(l.categoria_nombre) ?? {
                cantidad: 0,
                subtotal: 0,
            };
            prevCat.cantidad += l.cantidad;
            prevCat.subtotal += l.subtotal_linea;
            byCatPlatos.set(l.categoria_nombre, prevCat);
        }
    }
    const platos_por_categoria = Array.from(byCatPlatos.entries())
        .map(([categoria_nombre, v]) => ({ categoria_nombre, ...v }))
        .sort((a, b) => b.subtotal - a.subtotal ||
        a.categoria_nombre.localeCompare(b.categoria_nombre, 'es'));
    const items_menu = Array.from(byProducto.values()).sort((a, b) => b.subtotal - a.subtotal ||
        b.cantidad - a.cantidad ||
        a.nombre_producto.localeCompare(b.nombre_producto, 'es'));
    return { platos_por_categoria, items_menu };
}
