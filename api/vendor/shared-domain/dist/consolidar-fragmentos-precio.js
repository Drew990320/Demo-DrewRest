"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferirPrecioUnitarioCanonico = inferirPrecioUnitarioCanonico;
exports.planConsolidarFragmentosPrecioPendientes = planConsolidarFragmentosPrecioPendientes;
const factura_lineas_group_1 = require("./factura-lineas-group");
function notaSucia(nota) {
    const n = nota ?? '';
    return /mixto:\d+:/i.test(n) || /combinado:\d+:/i.test(n);
}
function preciosDistintos(precios) {
    const u = new Set(precios.map((p) => Math.round(p)));
    return u.size > 1;
}
/** Precio unitario canónico que explica el subtotal (enteros COP). */
function inferirPrecioUnitarioCanonico(total, preciosObservados, precioCatalogo) {
    const t = Math.round(total);
    if (t <= 0)
        return 0;
    const candidatos = new Set();
    for (const p of preciosObservados) {
        const r = Math.round(p);
        if (r > 0)
            candidatos.add(r);
    }
    const cat = Math.round(precioCatalogo ?? 0);
    if (cat > 0)
        candidatos.add(cat);
    const exactos = [...candidatos]
        .filter((p) => t % p === 0)
        .sort((a, b) => b - a);
    if (exactos.length > 0)
        return exactos[0];
    const preferido = cat > 0 ? cat : Math.max(0, ...candidatos);
    if (preferido <= 0)
        return 0;
    const n = Math.max(1, Math.round(t / preferido));
    if (Math.abs(n * preferido - t) <= n)
        return preferido;
    return 0;
}
function claveGrupo(d) {
    return [
        d.id_producto,
        d.personalizacion_key,
        d.enviado_cocina ? '1' : '0',
        d.listo_cocina ? '1' : '0',
        d.listo_para_recoger ? '1' : '0',
    ].join('|');
}
/**
 * Plan de merge: deja una fila por grupo con cantidad/precio enteros
 * y lista ids a eliminar.
 */
function planConsolidarFragmentosPrecioPendientes(detalles) {
    const pendientes = detalles.filter((d) => d.id_factura == null &&
        d.id_detalle_padre == null &&
        !d.es_cuota_pendiente_reparto &&
        d.cantidad > 0);
    const grupos = new Map();
    for (const d of pendientes) {
        const k = claveGrupo(d);
        const arr = grupos.get(k) ?? [];
        arr.push(d);
        grupos.set(k, arr);
    }
    const out = [];
    for (const group of grupos.values()) {
        if (group.length === 0)
            continue;
        const precios = group.flatMap((d) => Array.from({ length: d.cantidad }, () => Math.round(d.precio_unitario)));
        const total = group.reduce((s, d) => s + Math.round(d.precio_unitario) * d.cantidad, 0);
        const sucia = group.some((d) => notaSucia(d.nota_cocina));
        const distinta = preciosDistintos(precios);
        const variasFilas = group.length > 1;
        if (!sucia && !distinta && !variasFilas)
            continue;
        // Varias filas mismo precio limpio: también conviene una sola línea.
        if (!sucia && !distinta && variasFilas) {
            const pu = Math.round(group[0].precio_unitario);
            const cant = group.reduce((s, d) => s + d.cantidad, 0);
            const keep = [...group].sort((a, b) => a.id_detalle - b.id_detalle)[0];
            out.push({
                keepId: keep.id_detalle,
                cantidad: cant,
                precio_unitario: pu,
                nota_cocina: (0, factura_lineas_group_1.limpiarNotaCocinaTicket)(keep.nota_cocina),
                deleteIds: group
                    .filter((d) => d.id_detalle !== keep.id_detalle)
                    .map((d) => d.id_detalle),
            });
            continue;
        }
        const ref = inferirPrecioUnitarioCanonico(total, precios, group[0].precio_catalogo);
        if (ref <= 0)
            continue;
        const cantidad = Math.max(1, Math.round(total / ref));
        if (Math.abs(cantidad * ref - total) > cantidad)
            continue;
        const keep = [...group].sort((a, b) => {
            // Preferir fila sin nota sucia y precio canónico.
            const sa = notaSucia(a.nota_cocina) ? 1 : 0;
            const sb = notaSucia(b.nota_cocina) ? 1 : 0;
            if (sa !== sb)
                return sa - sb;
            const da = Math.abs(Math.round(a.precio_unitario) - ref);
            const db = Math.abs(Math.round(b.precio_unitario) - ref);
            if (da !== db)
                return da - db;
            return a.id_detalle - b.id_detalle;
        })[0];
        const deleteIds = group
            .filter((d) => d.id_detalle !== keep.id_detalle)
            .map((d) => d.id_detalle);
        const yaOk = deleteIds.length === 0 &&
            keep.cantidad === cantidad &&
            Math.round(keep.precio_unitario) === ref &&
            !notaSucia(keep.nota_cocina);
        if (yaOk)
            continue;
        out.push({
            keepId: keep.id_detalle,
            cantidad,
            precio_unitario: ref,
            nota_cocina: (0, factura_lineas_group_1.limpiarNotaCocinaTicket)(keep.nota_cocina),
            deleteIds,
        });
    }
    return out;
}
