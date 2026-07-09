"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferirTipoProteina = inferirTipoProteina;
exports.tipoProteinaResuelto = tipoProteinaResuelto;
exports.normalizarPrioridadCocinaModo = normalizarPrioridadCocinaModo;
exports.esCategoriaPlatoFuerte = esCategoriaPlatoFuerte;
exports.esParrilladaPicadaOCompartir = esParrilladaPicadaOCompartir;
exports.esPlatoFuerteCerdo = esPlatoFuerteCerdo;
exports.detalleMarcaPrioridadBaja = detalleMarcaPrioridadBaja;
exports.prioridadAutomaticaResuelta = prioridadAutomaticaResuelta;
exports.prioridadAutomaticaDesdeDetalles = prioridadAutomaticaDesdeDetalles;
exports.prioridadCocinaEfectiva = prioridadCocinaEfectiva;
exports.ordenarPedidosCocina = ordenarPedidosCocina;
exports.contarPorcionesPendientesCocina = contarPorcionesPendientesCocina;
/**
 * Etiqueta opcional de cocina (agrupación / visual). Ya no define prioridad automática.
 */
function inferirTipoProteina(categoriaNombre, nombreProducto) {
    const c = categoriaNombre.toLowerCase();
    const n = nombreProducto.toLowerCase();
    if (c.includes('bebida') || c.includes('empaque'))
        return 'ninguno';
    if (c.includes('cerdo') || n.includes('cerdo') || n.includes('bondiola')) {
        return 'cerdo';
    }
    if (n.includes('chorizo') || n.includes('parrillada'))
        return 'cerdo';
    if (n.includes('costilla') && c.includes('cerdo'))
        return 'cerdo';
    if (c.includes('pollo') || n.includes('pollo') || n.includes('pechuga')) {
        return 'pollo';
    }
    if (n.includes('nuggets'))
        return 'pollo';
    if (c.includes('pescado') || n.includes('pescado') || n.includes('salmón')) {
        return 'pescado';
    }
    if (c.includes('vegetar') ||
        n.includes('vegetar') ||
        n.includes('vegano')) {
        return 'vegetariano';
    }
    if (c.includes('res') || c.includes('mixto')) {
        if (n.includes('chata'))
            return 'res';
        return 'otro';
    }
    if (c.includes('infantil'))
        return 'pollo';
    if (c.includes('entrada') || c.includes('adicional')) {
        if (n.includes('chorizo'))
            return 'cerdo';
        return 'otro';
    }
    if (c.includes('para compartir') || c.includes('picada'))
        return 'otro';
    if (c.includes('sopa'))
        return 'otro';
    return 'otro';
}
/** Tipo en catálogo; sin inferencia en runtime. */
function tipoProteinaResuelto(db, _categoriaNombre, _nombreProducto) {
    if (db && db !== 'ninguno')
        return db;
    return 'ninguno';
}
function normalizarPrioridadCocinaModo(modo, legacyAutomatica) {
    if (modo === 'fifo' || modo === 'por_reglas' || modo === 'solo_manual') {
        return modo;
    }
    if (legacyAutomatica === true)
        return 'por_reglas';
    return 'fifo';
}
/** @deprecated Reglas legacy La Reserva (cerdo / parrillada por nombre). Solo seed/migración. */
function esCategoriaPlatoFuerte(categoriaNombre) {
    return categoriaNombre.toLowerCase().startsWith('platos fuertes');
}
/** @deprecated */
function esParrilladaPicadaOCompartir(categoriaNombre, nombreProducto) {
    const c = categoriaNombre.toLowerCase();
    const n = nombreProducto.toLowerCase();
    if (c.includes('para compartir') || c.includes('picada'))
        return true;
    return n.includes('parrillada') || n.includes('picada');
}
/** @deprecated */
function esPlatoFuerteCerdo(categoriaNombre) {
    return categoriaNombre.toLowerCase().includes('cerdo');
}
function detalleMarcaPrioridadBaja(d) {
    if (d.producto_prioridad_cocina_baja === true)
        return true;
    if (d.producto_prioridad_cocina_baja === false)
        return false;
    if (!d.categoria_prioridad_cocina_baja)
        return false;
    return d.es_plato_principal !== false;
}
/**
 * Prioridad automática según modo operativo.
 * - fifo / solo_manual: todas alta (orden por hora).
 * - por_reglas: baja si categoría o producto tienen flag.
 */
function prioridadAutomaticaResuelta(detalles, opts) {
    const modo = normalizarPrioridadCocinaModo(opts?.modo, opts?.automaticaActiva);
    if (modo === 'fifo' || modo === 'solo_manual') {
        return 'alta';
    }
    for (const d of detalles) {
        if (!d.marcar_cocina)
            continue;
        if (detalleMarcaPrioridadBaja(d))
            return 'baja';
    }
    return 'alta';
}
/** @deprecated Reglas legacy por nombre (La Reserva). No usar en runtime. */
function prioridadAutomaticaDesdeDetalles(detalles) {
    for (const d of detalles) {
        if (!d.marcar_cocina)
            continue;
        const cat = d.categoria_nombre ?? '';
        const nombre = d.nombre_producto ?? '';
        if (esParrilladaPicadaOCompartir(cat, nombre)) {
            return 'baja';
        }
        if (!esCategoriaPlatoFuerte(cat))
            continue;
        if (esPlatoFuerteCerdo(cat) ||
            inferirTipoProteina(cat, nombre) === 'cerdo') {
            return 'baja';
        }
    }
    return 'alta';
}
function prioridadCocinaEfectiva(auto, override) {
    if (override === 'alta' || override === 'baja') {
        return { nivel: override, origen: 'manual' };
    }
    return { nivel: auto, origen: 'auto' };
}
function ordenarPedidosCocina(pedidos) {
    return [...pedidos].sort((a, b) => {
        const pa = a.prioridad_cocina === 'alta' ? 0 : 1;
        const pb = b.prioridad_cocina === 'alta' ? 0 : 1;
        if (pa !== pb)
            return pa - pb;
        const ta = typeof a.creado_en === 'string'
            ? new Date(a.creado_en).getTime()
            : a.creado_en.getTime();
        const tb = typeof b.creado_en === 'string'
            ? new Date(b.creado_en).getTime()
            : b.creado_en.getTime();
        return ta - tb;
    });
}
/** Porciones de cocina enviadas y aún no marcadas listas. */
function contarPorcionesPendientesCocina(pedidos) {
    let n = 0;
    for (const p of pedidos) {
        for (const d of p.detalles) {
            if (d.marcar_cocina && (d.enviado_cocina ?? false) && !d.listo_cocina) {
                n += d.cantidad;
            }
        }
    }
    return n;
}
