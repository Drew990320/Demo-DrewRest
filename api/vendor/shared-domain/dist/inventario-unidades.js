"use strict";
/**
 * Sistema de unidades y conversiones genérico (masa, volumen, conteo, empaque).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizarUnidad = normalizarUnidad;
exports.definicionUnidad = definicionUnidad;
exports.mismaDimension = mismaDimension;
exports.convertirCantidad = convertirCantidad;
exports.redondearInventario = redondearInventario;
const UNIDADES = {
    mg: { codigo: 'mg', dimension: 'masa', factor_base: 0.001 },
    g: { codigo: 'g', dimension: 'masa', factor_base: 1 },
    gr: { codigo: 'g', dimension: 'masa', factor_base: 1 },
    gramo: { codigo: 'g', dimension: 'masa', factor_base: 1 },
    gramos: { codigo: 'g', dimension: 'masa', factor_base: 1 },
    kg: { codigo: 'kg', dimension: 'masa', factor_base: 1000 },
    kilo: { codigo: 'kg', dimension: 'masa', factor_base: 1000 },
    kilogramo: { codigo: 'kg', dimension: 'masa', factor_base: 1000 },
    ml: { codigo: 'ml', dimension: 'volumen', factor_base: 1 },
    mililitro: { codigo: 'ml', dimension: 'volumen', factor_base: 1 },
    mililitros: { codigo: 'ml', dimension: 'volumen', factor_base: 1 },
    l: { codigo: 'l', dimension: 'volumen', factor_base: 1000 },
    lt: { codigo: 'l', dimension: 'volumen', factor_base: 1000 },
    litro: { codigo: 'l', dimension: 'volumen', factor_base: 1000 },
    litros: { codigo: 'l', dimension: 'volumen', factor_base: 1000 },
    u: { codigo: 'u', dimension: 'conteo', factor_base: 1 },
    un: { codigo: 'u', dimension: 'conteo', factor_base: 1 },
    unidad: { codigo: 'u', dimension: 'conteo', factor_base: 1 },
    unidades: { codigo: 'u', dimension: 'conteo', factor_base: 1 },
    porcion: { codigo: 'porcion', dimension: 'conteo', factor_base: 1 },
    porciones: { codigo: 'porcion', dimension: 'conteo', factor_base: 1 },
    paquete: { codigo: 'paquete', dimension: 'empaque', factor_base: 1 },
    paquetes: { codigo: 'paquete', dimension: 'empaque', factor_base: 1 },
    caja: { codigo: 'caja', dimension: 'empaque', factor_base: 1 },
    cajas: { codigo: 'caja', dimension: 'empaque', factor_base: 1 },
    bolsa: { codigo: 'bolsa', dimension: 'empaque', factor_base: 1 },
    bolsas: { codigo: 'bolsa', dimension: 'empaque', factor_base: 1 },
    bulto: { codigo: 'bulto', dimension: 'empaque', factor_base: 1 },
    bultos: { codigo: 'bulto', dimension: 'empaque', factor_base: 1 },
};
function normalizarUnidad(unidad) {
    return unidad.trim().toLowerCase().replace(/\s+/g, '');
}
function definicionUnidad(unidad) {
    const key = normalizarUnidad(unidad);
    return UNIDADES[key] ?? null;
}
function mismaDimension(unidadA, unidadB) {
    const a = definicionUnidad(unidadA);
    const b = definicionUnidad(unidadB);
    if (!a || !b)
        return false;
    return a.dimension === b.dimension;
}
function buscarConversionDirecta(desde, hacia, conversiones) {
    const d = normalizarUnidad(desde);
    const h = normalizarUnidad(hacia);
    for (const c of conversiones) {
        const o = normalizarUnidad(c.unidad_origen);
        const dest = normalizarUnidad(c.unidad_destino);
        if (o === d && dest === h && c.factor > 0)
            return c.factor;
        if (o === h && dest === d && c.factor > 0)
            return 1 / c.factor;
    }
    return null;
}
/**
 * Convierte cantidad entre unidades.
 * 1) Catálogo estándar (g↔kg, ml↔l).
 * 2) Tabla de conversiones del negocio (ej. 1 bulto = 25 kg).
 */
function convertirCantidad(cantidad, desde, hacia, conversiones = []) {
    if (!Number.isFinite(cantidad)) {
        return {
            ok: false,
            error: {
                codigo: 'sin_conversion',
                mensaje: 'Cantidad inválida',
            },
        };
    }
    const dNorm = normalizarUnidad(desde);
    const hNorm = normalizarUnidad(hacia);
    if (dNorm === hNorm) {
        return { ok: true, cantidad, unidad: hacia };
    }
    const custom = buscarConversionDirecta(desde, hacia, conversiones);
    if (custom != null) {
        return { ok: true, cantidad: cantidad * custom, unidad: hacia };
    }
    const defDesde = definicionUnidad(desde);
    const defHacia = definicionUnidad(hacia);
    if (defDesde && defHacia) {
        if (defDesde.dimension !== defHacia.dimension) {
            return {
                ok: false,
                error: {
                    codigo: 'dimension_incompatible',
                    mensaje: `No se puede convertir ${desde} (${defDesde.dimension}) a ${hacia} (${defHacia.dimension}) sin regla explícita`,
                },
            };
        }
        const enBase = cantidad * defDesde.factor_base;
        const resultado = enBase / defHacia.factor_base;
        return { ok: true, cantidad: resultado, unidad: hacia };
    }
    return {
        ok: false,
        error: {
            codigo: defDesde || defHacia ? 'sin_conversion' : 'unidad_desconocida',
            mensaje: `Sin conversión de ${desde} a ${hacia}`,
        },
    };
}
/** Redondeo estable para inventario (3 decimales). */
function redondearInventario(n) {
    return Math.round(n * 1000) / 1000;
}
