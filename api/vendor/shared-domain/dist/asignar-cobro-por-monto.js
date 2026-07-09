"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asignarCantidadesParaSubtotal = asignarCantidadesParaSubtotal;
/**
 * Asigna cantidades por línea (padres) para aproximar un subtotal bruto objetivo.
 * Los empaques hijos se expanden al facturar vía expandirSolicitudesConEmpaques.
 */
function asignarCantidadesParaSubtotal(lineas, subtotalObjetivo) {
    const out = {};
    const objetivo = Math.round(subtotalObjetivo);
    if (objetivo <= 0 || lineas.length === 0)
        return out;
    let restante = objetivo;
    const porPrecioDesc = [...lineas].sort((a, b) => b.precio_unitario - a.precio_unitario);
    for (const l of porPrecioDesc) {
        if (restante <= 0)
            break;
        const pu = Math.round(l.precio_unitario);
        if (pu <= 0)
            continue;
        const ya = out[l.id_detalle] ?? 0;
        const maxQ = l.cantidad_pendiente - ya;
        if (maxQ <= 0)
            continue;
        const q = Math.min(maxQ, Math.floor(restante / pu));
        if (q > 0) {
            out[l.id_detalle] = ya + q;
            restante -= q * pu;
        }
    }
    if (restante > 0) {
        const porPrecioAsc = [...lineas].sort((a, b) => a.precio_unitario - b.precio_unitario);
        for (const l of porPrecioAsc) {
            const pu = Math.round(l.precio_unitario);
            if (pu <= 0)
                continue;
            const ya = out[l.id_detalle] ?? 0;
            if (ya >= l.cantidad_pendiente)
                continue;
            out[l.id_detalle] = ya + 1;
            restante -= pu;
            if (restante <= 0)
                break;
        }
    }
    return out;
}
