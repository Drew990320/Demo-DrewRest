"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lineasComandaParaTicket = lineasComandaParaTicket;
const cocina_producto_1 = require("./cocina-producto");
function claveComanda(d) {
    const pers = (d.personalizaciones ?? [])
        .map((p) => String(p.id_opcion ?? p.descripcion))
        .sort()
        .join(',');
    return [
        d.id_producto ?? d.nombre_producto,
        (d.nota_cocina ?? '').trim(),
        pers,
        d.id_detalle_padre ?? 'root',
    ].join('|');
}
function compararLineasComanda(a, b) {
    const ta = (0, cocina_producto_1.ordenTipoLineaCocina)((0, cocina_producto_1.tipoLineaCocina)(a));
    const tb = (0, cocina_producto_1.ordenTipoLineaCocina)((0, cocina_producto_1.tipoLineaCocina)(b));
    if (ta !== tb)
        return ta - tb;
    return a.id_detalle - b.id_detalle;
}
function lineasComandaParaTicket(detalles) {
    const ordenados = [...detalles].sort(compararLineasComanda);
    const orden = [];
    const map = new Map();
    for (const d of ordenados) {
        const key = claveComanda(d);
        const prev = map.get(key);
        if (!prev) {
            orden.push(key);
            map.set(key, {
                id_detalle: d.id_detalle,
                cantidad: d.cantidad,
                nombre_producto: d.nombre_producto,
                nota_cocina: d.nota_cocina ?? null,
                personalizaciones: (d.personalizaciones ?? []).map((p) => p.descripcion),
                id_producto: d.id_producto,
                id_categoria: d.id_categoria,
                _ids: [d.id_detalle],
            });
            continue;
        }
        prev.cantidad += d.cantidad;
        prev._ids.push(d.id_detalle);
    }
    return orden.map((key) => {
        const row = map.get(key);
        return {
            id_detalle: row.id_detalle,
            cantidad: row.cantidad,
            nombre_producto: row.nombre_producto,
            nota_cocina: row.nota_cocina,
            personalizaciones: row.personalizaciones,
            ...(row.id_producto != null ? { id_producto: row.id_producto } : {}),
            ...(row.id_categoria != null ? { id_categoria: row.id_categoria } : {}),
        };
    });
}
