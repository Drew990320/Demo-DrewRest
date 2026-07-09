"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expandirDetallesParaCobro = expandirDetallesParaCobro;
exports.idsDetallesPendientes = idsDetallesPendientes;
exports.pedidoCobroCompleto = pedidoCobroCompleto;
exports.resolverSolicitudesCobro = resolverSolicitudesCobro;
exports.expandirSolicitudesConEmpaques = expandirSolicitudesConEmpaques;
exports.ordenarSolicitudesCobro = ordenarSolicitudesCobro;
exports.subtotalDesdeSolicitudes = subtotalDesdeSolicitudes;
exports.lineasDescuentoDesdeSolicitudes = lineasDescuentoDesdeSolicitudes;
exports.unidadesEnSolicitudes = unidadesEnSolicitudes;
exports.quedaPendienteTrasCobro = quedaPendienteTrasCobro;
exports.solicitudesDesdeCantidades = solicitudesDesdeCantidades;
/** Expande ítems seleccionados incluyendo empaques hijos aún pendientes de cobro. */
function expandirDetallesParaCobro(detalles, idsSolicitados) {
    const byId = new Map(detalles.map((d) => [d.id_detalle, d]));
    const out = new Set();
    for (const id of idsSolicitados) {
        const d = byId.get(id);
        if (!d || d.cobrado)
            continue;
        out.add(id);
        for (const hijo of detalles) {
            if (hijo.id_detalle_padre === id && !hijo.cobrado) {
                out.add(hijo.id_detalle);
            }
        }
    }
    return [...out];
}
function idsDetallesPendientes(detalles) {
    return detalles.filter((d) => !d.cobrado).map((d) => d.id_detalle);
}
function pedidoCobroCompleto(detalles) {
    return detalles.length > 0 && detalles.every((d) => d.cobrado);
}
function resolverSolicitudesCobro(opts, detalles, pendientes) {
    const byId = new Map(detalles.map((d) => [d.id_detalle, d]));
    if (opts.detalles_cobro?.length) {
        return opts.detalles_cobro
            .map((s) => ({
            id_detalle: s.id_detalle,
            cantidad: Math.floor(s.cantidad),
        }))
            .filter((s) => s.cantidad > 0);
    }
    const idsBase = opts.id_detalles?.length && opts.id_detalles.length > 0
        ? opts.id_detalles
        : pendientes;
    const ids = expandirDetallesParaCobro(detalles, idsBase);
    return ids.map((id) => {
        const d = byId.get(id);
        return { id_detalle: id, cantidad: d?.cantidad ?? 1 };
    });
}
/** Incluye empaques hijos pendientes; cobra hasta la cantidad disponible (empaque compartido). */
function expandirSolicitudesConEmpaques(detalles, solicitudes) {
    const map = new Map();
    for (const s of solicitudes) {
        const d = detalles.find((x) => x.id_detalle === s.id_detalle);
        if (!d || d.cobrado)
            continue;
        if (s.cantidad < 1 || s.cantidad > d.cantidad) {
            throw new Error(`Cantidad inválida para el ítem #${s.id_detalle}`);
        }
        map.set(s.id_detalle, s.cantidad);
        if (d.id_detalle_padre == null) {
            for (const h of detalles) {
                if (h.id_detalle_padre === s.id_detalle && !h.cobrado) {
                    const cantidadEmpaque = Math.min(s.cantidad, h.cantidad);
                    if (cantidadEmpaque > 0) {
                        map.set(h.id_detalle, cantidadEmpaque);
                    }
                }
            }
        }
    }
    return [...map.entries()].map(([id_detalle, cantidad]) => ({
        id_detalle,
        cantidad,
    }));
}
function ordenarSolicitudesCobro(detalles, solicitudes) {
    const byId = new Map(detalles.map((d) => [d.id_detalle, d]));
    return [...solicitudes].sort((a, b) => {
        const da = byId.get(a.id_detalle);
        const db = byId.get(b.id_detalle);
        const pa = da?.id_detalle_padre == null ? 0 : 1;
        const pb = db?.id_detalle_padre == null ? 0 : 1;
        return pa - pb || a.id_detalle - b.id_detalle;
    });
}
function subtotalDesdeSolicitudes(detalles, solicitudes) {
    const byId = new Map(detalles.map((d) => [d.id_detalle, d]));
    let subtotal = 0;
    for (const s of solicitudes) {
        const d = byId.get(s.id_detalle);
        if (!d)
            continue;
        subtotal += d.precio_unitario * s.cantidad;
    }
    return subtotal;
}
function lineasDescuentoDesdeSolicitudes(detalles, solicitudes) {
    const qty = new Map(solicitudes.map((s) => [s.id_detalle, s.cantidad]));
    return detalles
        .filter((d) => qty.has(d.id_detalle))
        .map((d) => {
        const q = qty.get(d.id_detalle);
        const pu = d.precio_unitario;
        return {
            id_detalle: d.id_detalle,
            cantidad: q,
            subtotal_linea: pu * q,
            nombre_producto: d.nombre_producto,
            categoria_nombre: d.categoria_nombre ?? '',
            id_categoria: d.id_categoria,
            id_producto: d.id_producto,
            precio_unitario: pu,
            es_plato_principal: d.es_plato_principal,
            participa_descuento_sopas: d.participa_descuento_sopas,
        };
    });
}
function unidadesEnSolicitudes(solicitudes) {
    return solicitudes.reduce((s, x) => s + x.cantidad, 0);
}
/** Tras aplicar estas cantidades, ¿queda algo pendiente en el pedido? */
function quedaPendienteTrasCobro(detalles, solicitudes) {
    const qty = new Map(solicitudes.map((s) => [s.id_detalle, s.cantidad]));
    return detalles.some((d) => {
        if (d.cobrado)
            return false;
        const cobrar = qty.get(d.id_detalle) ?? 0;
        return d.cantidad - cobrar > 0;
    });
}
function solicitudesDesdeCantidades(cantidades) {
    return Object.entries(cantidades)
        .map(([id, cantidad]) => ({
        id_detalle: Number(id),
        cantidad: Math.floor(cantidad),
    }))
        .filter((s) => s.cantidad > 0 && Number.isFinite(s.id_detalle));
}
