"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agruparLineasFacturaCobroVista = agruparLineasFacturaCobroVista;
exports.agruparLineasFactura = agruparLineasFactura;
exports.esDetalleEtiquetaCombinado = esDetalleEtiquetaCombinado;
exports.esFacturaCuotaSobreTotal = esFacturaCuotaSobreTotal;
exports.parseMixtoPrecioNota = parseMixtoPrecioNota;
exports.limpiarNotaCocinaTicket = limpiarNotaCocinaTicket;
exports.agruparLineasFacturaPedidoTotal = agruparLineasFacturaPedidoTotal;
exports.lineasFacturaParaTicketPedidoTotal = lineasFacturaParaTicketPedidoTotal;
exports.lineasFacturaParaTicketSeleccionReferencia = lineasFacturaParaTicketSeleccionReferencia;
exports.consolidarLineasMixtoPrecio = consolidarLineasMixtoPrecio;
exports.lineasFacturaParaTicket = lineasFacturaParaTicket;
const categoria_reglas_1 = require("./categoria-reglas");
const orden_lineas_pedido_1 = require("./orden-lineas-pedido");
const cuota_pendiente_reparto_1 = require("./cuota-pendiente-reparto");
function esLineaEmpaqueAgrupable(d) {
    if (d.es_empacable)
        return true;
    if ((0, categoria_reglas_1.categoriaEsLineaEmpaque)(d.categoria_nombre ?? ''))
        return true;
    const nombre = (d.nombre_producto ?? '').trim().toLowerCase();
    return nombre.includes('empaque para llevar');
}
function claveFactura(d) {
    const pers = (d.personalizaciones ?? [])
        .map((p) => String(p.id_opcion ?? p.descripcion))
        .sort()
        .join(',');
    // Empaques van ligados a distintos platos; en ticket/factura se muestran en una sola línea.
    const padreKey = esLineaEmpaqueAgrupable(d)
        ? 'empaque'
        : String(d.id_detalle_padre ?? 'root');
    return [
        d.id_producto ?? d.nombre_producto,
        d.precio_unitario,
        (d.nota_cocina ?? '').trim(),
        pers,
        padreKey,
        d.cobrado ? '1' : '0',
    ].join('|');
}
/**
 * Agrupa líneas para la pantalla de cobro.
 * No separa por precio_unitario: los fragmentos de un mismo plato (mixto/cuota)
 * se muestran como una sola línea con el subtotal real.
 */
function agruparLineasFacturaCobroVista(detalles) {
    const refPrices = preciosReferenciaProducto(detalles);
    const ordenados = (0, orden_lineas_pedido_1.ordenarLineasPedidoPorSeccion)(detalles);
    const orden = [];
    const map = new Map();
    for (const d of ordenados) {
        const pers = (d.personalizaciones ?? [])
            .map((p) => String(p.id_opcion ?? p.descripcion))
            .sort()
            .join(',');
        const padreKey = esLineaEmpaqueAgrupable(d)
            ? 'empaque'
            : String(d.id_detalle_padre ?? 'root');
        const key = [
            d.id_producto ?? d.nombre_producto,
            pers,
            padreKey,
            d.cobrado ? '1' : '0',
        ].join('|');
        const prev = map.get(key);
        if (!prev) {
            orden.push(key);
            map.set(key, { ...d, ids_detalle: [d.id_detalle] });
            continue;
        }
        prev.cantidad += d.cantidad;
        prev.subtotal_linea += d.subtotal_linea;
        prev.ids_detalle.push(d.id_detalle);
    }
    return orden
        .map((key) => {
        const g = map.get(key);
        if (!g)
            return null;
        const ref = refPrices.get(g.id_producto ?? g.nombre_producto) ?? 0;
        const preciosDistintos = g.ids_detalle.length > 1 && ref > 0;
        if (preciosDistintos) {
            const unidades = Math.max(1, Math.round(g.subtotal_linea / ref));
            return {
                ...g,
                cantidad: unidades,
                precio_unitario: unidades > 0 ? Math.round(g.subtotal_linea / unidades) : g.subtotal_linea,
            };
        }
        return g;
    })
        .filter((g) => g != null);
}
/** Agrupa ítems idénticos en factura / pre-cuenta (mismo producto, precio y personalización). */
function agruparLineasFactura(detalles) {
    const ordenados = (0, orden_lineas_pedido_1.ordenarLineasPedidoPorSeccion)(detalles);
    const orden = [];
    const map = new Map();
    for (const d of ordenados) {
        const key = claveFactura(d);
        const prev = map.get(key);
        if (!prev) {
            orden.push(key);
            map.set(key, { ...d, ids_detalle: [d.id_detalle] });
            continue;
        }
        prev.cantidad += d.cantidad;
        prev.subtotal_linea += d.subtotal_linea;
        prev.ids_detalle.push(d.id_detalle);
    }
    return orden
        .map((key) => map.get(key))
        .filter((g) => g != null);
}
const MIXTO_PRECIO_NOTA_RE = /mixto:\d+:(?:efectivo|transferencia)/i;
const COMBINADO_NOTA_RE = /combinado:\d+:\d+/i;
const CUOTA_PENDIENTE_NOTA_RE = /cuota_pendiente:\d+@\d+/i;
function esDetalleEtiquetaCombinado(nota) {
    return COMBINADO_NOTA_RE.test(nota ?? '');
}
/** Cuota sobre el total (no modo combinar con ítems fijos por persona). */
function esFacturaCuotaSobreTotal(personaPlanIndice, notasDetallesFactura) {
    return (personaPlanIndice != null &&
        personaPlanIndice > 0 &&
        !notasDetallesFactura.some(esDetalleEtiquetaCombinado));
}
function preciosReferenciaProducto(detalles) {
    const map = new Map();
    for (const d of detalles) {
        const key = d.id_producto ?? d.nombre_producto;
        const pu = Math.round(d.precio_unitario);
        const prev = map.get(key) ?? 0;
        if (pu > prev)
            map.set(key, pu);
    }
    return map;
}
/** Etiqueta interna de reparto mixto por precio; no debe verse en ticket. */
function parseMixtoPrecioNota(nota) {
    if (!nota?.includes('mixto:'))
        return null;
    const idx = nota.indexOf('mixto:');
    const tag = nota.slice(idx + 'mixto:'.length);
    const [orig, lado] = tag.split(':');
    if (lado !== 'efectivo' && lado !== 'transferencia')
        return null;
    const origId = Number(orig);
    if (!Number.isFinite(origId))
        return null;
    return { origId, lado };
}
function limpiarNotaCocinaTicket(nota) {
    if (!nota?.trim())
        return null;
    let s = nota.trim();
    s = s.replace(/\s*·\s*mixto:\d+:(?:efectivo|transferencia)/gi, '');
    s = s.replace(/\s*·\s*combinado:\d+:\d+/gi, '');
    s = s.replace(/\s*·\s*cuota_pendiente:\d+@\d+/gi, '');
    if ((MIXTO_PRECIO_NOTA_RE.test(s) ||
        COMBINADO_NOTA_RE.test(s) ||
        CUOTA_PENDIENTE_NOTA_RE.test(s)) &&
        !s
            .replace(MIXTO_PRECIO_NOTA_RE, '')
            .replace(COMBINADO_NOTA_RE, '')
            .replace(CUOTA_PENDIENTE_NOTA_RE, '')
            .trim()) {
        return null;
    }
    s = s
        .replace(MIXTO_PRECIO_NOTA_RE, '')
        .replace(COMBINADO_NOTA_RE, '')
        .replace(CUOTA_PENDIENTE_NOTA_RE, '')
        .trim();
    return s || null;
}
function nombreLineaTicket(d) {
    if ((0, cuota_pendiente_reparto_1.parseCuotaPendienteNota)(d.nota_cocina)) {
        return (0, cuota_pendiente_reparto_1.nombreProductoCuotaPendienteDisplay)(d.nombre_producto, d.nota_cocina);
    }
    return d.nombre_producto;
}
function claveFacturaPedidoTotal(d) {
    const pers = (d.personalizaciones ?? [])
        .map((p) => String(p.id_opcion ?? p.descripcion))
        .sort()
        .join(',');
    const padreKey = esLineaEmpaqueAgrupable(d)
        ? 'empaque'
        : String(d.id_detalle_padre ?? 'root');
    const nota = (limpiarNotaCocinaTicket(d.nota_cocina) ?? '').trim();
    return [d.id_producto ?? d.nombre_producto, pers, padreKey, nota].join('|');
}
/** Agrupa por producto en ticket total (ignora precios partidos por cobros parciales). */
function agruparLineasFacturaPedidoTotal(detalles) {
    const ordenados = (0, orden_lineas_pedido_1.ordenarLineasPedidoPorSeccion)(detalles.map((d) => ({
        ...d,
        nota_cocina: limpiarNotaCocinaTicket(d.nota_cocina),
    })));
    const orden = [];
    const map = new Map();
    for (const d of ordenados) {
        const key = claveFacturaPedidoTotal(d);
        const prev = map.get(key);
        if (!prev) {
            orden.push(key);
            map.set(key, { ...d, ids_detalle: [d.id_detalle] });
            continue;
        }
        prev.cantidad += d.cantidad;
        prev.subtotal_linea += d.subtotal_linea;
        prev.ids_detalle.push(d.id_detalle);
    }
    return orden
        .map((key) => map.get(key))
        .filter((g) => g != null);
}
function lineasFacturaParaTicketPedidoTotal(detalles) {
    const base = consolidarLineasMixtoPrecio(detalles);
    const refPrices = preciosReferenciaProducto(base);
    return agruparLineasFacturaPedidoTotal(base).map((g) => {
        const key = g.id_producto ?? g.nombre_producto;
        const ref = refPrices.get(key) ?? 0;
        const cantidad = ref > 0
            ? Math.max(1, Math.round(g.subtotal_linea / ref))
            : g.cantidad > 0
                ? g.cantidad
                : 1;
        const precioUnitario = ref > 0 ? ref : g.cantidad > 0 ? g.subtotal_linea / g.cantidad : 0;
        return {
            cantidad,
            nombre_producto: nombreLineaTicket(g),
            precio_unitario: precioUnitario,
            subtotal_linea: precioUnitario * cantidad,
            personalizaciones: (g.personalizaciones ?? []).map((p) => p.descripcion),
            nota_cocina: g.nota_cocina ?? null,
        };
    });
}
/** Líneas de referencia para ticket de cuota sobre ítems seleccionados (modo combinado). */
function lineasFacturaParaTicketSeleccionReferencia(detalles, pool) {
    const poolMap = new Map(pool.map((s) => [s.id_detalle, s.cantidad]));
    const filtrados = [];
    for (const d of detalles) {
        const q = poolMap.get(d.id_detalle);
        if (!q || q <= 0)
            continue;
        const take = Math.min(d.cantidad, q);
        const unit = d.precio_unitario ??
            (d.cantidad > 0 ? d.subtotal_linea / d.cantidad : 0);
        filtrados.push({
            ...d,
            cantidad: take,
            subtotal_linea: unit * take,
        });
    }
    if (filtrados.length === 0)
        return [];
    return lineasFacturaParaTicketPedidoTotal(filtrados);
}
/** Une rebanadas del mismo ítem partido por precio (pago mixto). */
function consolidarLineasMixtoPrecio(detalles) {
    const slices = new Map();
    const rest = [];
    for (const d of detalles) {
        const mixto = parseMixtoPrecioNota(d.nota_cocina);
        if (mixto) {
            const arr = slices.get(mixto.origId) ?? [];
            arr.push(d);
            slices.set(mixto.origId, arr);
            continue;
        }
        rest.push({
            ...d,
            nota_cocina: limpiarNotaCocinaTicket(d.nota_cocina),
        });
    }
    const merged = [...rest];
    for (const group of slices.values()) {
        if (group.length === 1) {
            merged.push({
                ...group[0],
                nota_cocina: limpiarNotaCocinaTicket(group[0].nota_cocina),
            });
            continue;
        }
        const base = group[0];
        const subtotal = group.reduce((s, x) => s + x.subtotal_linea, 0);
        merged.push({
            ...base,
            cantidad: 1,
            precio_unitario: subtotal,
            subtotal_linea: subtotal,
            nota_cocina: limpiarNotaCocinaTicket(base.nota_cocina),
        });
    }
    return merged;
}
function lineasFacturaParaTicket(detalles, opts) {
    const base = opts?.consolidarMixtoPrecio
        ? consolidarLineasMixtoPrecio(detalles)
        : detalles.map((d) => ({
            ...d,
            nota_cocina: limpiarNotaCocinaTicket(d.nota_cocina),
        }));
    return agruparLineasFactura(base).map((g) => ({
        cantidad: g.cantidad,
        nombre_producto: nombreLineaTicket(g),
        precio_unitario: g.cantidad > 0 ? g.subtotal_linea / g.cantidad : 0,
        subtotal_linea: g.subtotal_linea,
        personalizaciones: (g.personalizaciones ?? []).map((p) => p.descripcion),
        nota_cocina: g.nota_cocina ?? null,
    }));
}
