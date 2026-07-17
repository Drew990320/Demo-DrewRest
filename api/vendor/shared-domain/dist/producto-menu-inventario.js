"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.etiquetaVinculoInventario = etiquetaVinculoInventario;
exports.productoTieneVinculoInventario = productoTieneVinculoInventario;
function etiquetaVinculoInventario(v) {
    const partes = [];
    if (v.receta_activa) {
        partes.push(v.lineas_receta > 0
            ? `receta (${v.lineas_receta})`
            : 'receta');
    }
    if (v.comercial)
        partes.push('stock comercial');
    if (!partes.length)
        return null;
    return partes.join(' · ');
}
function productoTieneVinculoInventario(v) {
    if (!v)
        return false;
    return v.comercial || v.receta_activa;
}
