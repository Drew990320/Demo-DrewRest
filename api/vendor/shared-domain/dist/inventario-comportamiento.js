"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRESET_CONSUMIBLE_INTERNO = exports.PRESET_ACTIVO_INTERNO = exports.PRESET_PRODUCCION = exports.PRESET_COMERCIAL = exports.COMPORTAMIENTO_VACIO = exports.CLASES_INVENTARIO = void 0;
exports.esClaseInventario = esClaseInventario;
exports.resolverComportamiento = resolverComportamiento;
exports.parseComportamientoJson = parseComportamientoJson;
exports.comportamientoPermiteDeduccionAuto = comportamientoPermiteDeduccionAuto;
exports.comportamientoPermiteVentaDirecta = comportamientoPermiteVentaDirecta;
exports.CLASES_INVENTARIO = [
    'comercial',
    'produccion',
    'activo_interno',
    'consumible_interno',
];
exports.COMPORTAMIENTO_VACIO = {
    se_compra: false,
    se_vende_directamente: false,
    tiene_receta: false,
    descuenta_automaticamente: false,
    es_activo_fijo: false,
    requiere_lote: false,
    controla_seriales: false,
    permite_prestamo: false,
    permite_mantenimiento: false,
    permite_perdidas: false,
};
exports.PRESET_COMERCIAL = {
    se_compra: true,
    se_vende_directamente: true,
    tiene_receta: false,
    descuenta_automaticamente: true,
    es_activo_fijo: false,
    requiere_lote: false,
    controla_seriales: false,
    permite_prestamo: false,
    permite_mantenimiento: false,
    permite_perdidas: true,
};
exports.PRESET_PRODUCCION = {
    se_compra: true,
    se_vende_directamente: false,
    tiene_receta: false,
    descuenta_automaticamente: true,
    es_activo_fijo: false,
    requiere_lote: false,
    controla_seriales: false,
    permite_prestamo: false,
    permite_mantenimiento: false,
    permite_perdidas: true,
};
exports.PRESET_ACTIVO_INTERNO = {
    se_compra: true,
    se_vende_directamente: false,
    tiene_receta: false,
    descuenta_automaticamente: false,
    es_activo_fijo: true,
    requiere_lote: false,
    controla_seriales: true,
    permite_prestamo: true,
    permite_mantenimiento: true,
    permite_perdidas: true,
};
exports.PRESET_CONSUMIBLE_INTERNO = {
    se_compra: true,
    se_vende_directamente: false,
    tiene_receta: false,
    descuenta_automaticamente: false,
    es_activo_fijo: false,
    requiere_lote: false,
    controla_seriales: false,
    permite_prestamo: false,
    permite_mantenimiento: false,
    permite_perdidas: true,
};
const PRESETS = {
    comercial: exports.PRESET_COMERCIAL,
    produccion: exports.PRESET_PRODUCCION,
    activo_interno: exports.PRESET_ACTIVO_INTERNO,
    consumible_interno: exports.PRESET_CONSUMIBLE_INTERNO,
};
function esClaseInventario(v) {
    return exports.CLASES_INVENTARIO.includes(v);
}
/** Preset por clase con overrides opcionales (desde BD o UI). */
function resolverComportamiento(clase, overrides) {
    const base = PRESETS[clase] ?? exports.COMPORTAMIENTO_VACIO;
    if (!overrides)
        return base;
    return { ...base, ...overrides };
}
/** Parsea JSON almacenado en BD; ignora claves desconocidas. */
function parseComportamientoJson(raw, clase = 'produccion') {
    if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
        return resolverComportamiento(clase);
    }
    const o = raw;
    const overrides = {};
    const keys = Object.keys(exports.COMPORTAMIENTO_VACIO);
    for (const k of keys) {
        if (typeof o[k] === 'boolean')
            overrides[k] = o[k];
    }
    return resolverComportamiento(clase, overrides);
}
function comportamientoPermiteDeduccionAuto(c) {
    return c.descuenta_automaticamente && !c.es_activo_fijo;
}
function comportamientoPermiteVentaDirecta(c) {
    return c.se_vende_directamente && !c.es_activo_fijo;
}
