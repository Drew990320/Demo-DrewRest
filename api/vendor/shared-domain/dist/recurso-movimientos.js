"use strict";
/**
 * Tipos de movimiento del ledger de recursos + validaciones por flags de categoría.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIPOS_MOVIMIENTO_RECURSO = void 0;
exports.esTipoMovimientoRecurso = esTipoMovimientoRecurso;
exports.esMovimientoEntradaRecurso = esMovimientoEntradaRecurso;
exports.esMovimientoSalidaRecurso = esMovimientoSalidaRecurso;
exports.deltaStockMovimientoRecurso = deltaStockMovimientoRecurso;
exports.validarMovimientoContraFlags = validarMovimientoContraFlags;
exports.tipoMovimientoDesdeInventarioLegacy = tipoMovimientoDesdeInventarioLegacy;
exports.TIPOS_MOVIMIENTO_RECURSO = [
    'compra',
    'consumo',
    'venta',
    'produccion',
    'transferencia',
    'ajuste',
    'devolucion',
    'perdida',
    'dano',
    'robo',
    'mantenimiento',
    'baja',
    'consumo_receta',
];
function esTipoMovimientoRecurso(v) {
    return exports.TIPOS_MOVIMIENTO_RECURSO.includes(v);
}
/** Tipos que aumentan stock (cantidad > 0 suma). */
const ENTRADAS = new Set([
    'compra',
    'produccion',
    'devolucion',
    'ajuste', // signo lo da el delta
]);
/** Tipos que siempre restan stock. */
const SALIDAS = new Set([
    'consumo',
    'venta',
    'perdida',
    'dano',
    'robo',
    'baja',
    'consumo_receta',
    'mantenimiento',
]);
function esMovimientoEntradaRecurso(tipo) {
    return ENTRADAS.has(tipo) && tipo !== 'ajuste';
}
function esMovimientoSalidaRecurso(tipo) {
    return SALIDAS.has(tipo);
}
/**
 * Delta de stock: positivo = entrada, negativo = salida.
 * Para `ajuste`, `cantidad` puede venir firmada o con signo en el campo cantidad.
 */
function deltaStockMovimientoRecurso(tipo, cantidad) {
    const abs = Math.abs(cantidad);
    if (tipo === 'ajuste' || tipo === 'transferencia') {
        return cantidad;
    }
    if (esMovimientoSalidaRecurso(tipo))
        return -abs;
    if (esMovimientoEntradaRecurso(tipo))
        return abs;
    return cantidad;
}
function validarMovimientoContraFlags(tipo, flags) {
    if (!flags.controla_stock && tipo !== 'mantenimiento' && tipo !== 'baja') {
        return {
            ok: false,
            motivo: 'Esta categoría no controla stock; solo mantenimiento o baja',
        };
    }
    if ((tipo === 'consumo' || tipo === 'consumo_receta' || tipo === 'venta') &&
        !flags.controla_stock) {
        return { ok: false, motivo: 'No se puede consumir/vender sin control de stock' };
    }
    if (tipo === 'venta' && !flags.puede_venderse) {
        return { ok: false, motivo: 'Esta categoría no permite venta directa' };
    }
    if (tipo === 'transferencia' && !flags.tiene_ubicacion) {
        return { ok: false, motivo: 'Transferencia requiere categoría con ubicación' };
    }
    return { ok: true };
}
/** Mapea tipo de movimiento legacy de inventario al ledger de recursos. */
function tipoMovimientoDesdeInventarioLegacy(tipo) {
    switch (tipo) {
        case 'entrada':
        case 'compra':
        case 'reposicion':
            return 'compra';
        case 'consumo':
        case 'consumo_manual':
            return 'consumo';
        case 'consumo_receta':
            return 'consumo_receta';
        case 'venta':
            return 'venta';
        case 'produccion':
            return 'produccion';
        case 'ajuste':
        case 'ajuste_manual':
        case 'inventario_fisico':
            return 'ajuste';
        case 'devolucion':
            return 'devolucion';
        case 'perdida':
        case 'vencimiento':
            return 'perdida';
        case 'dano':
            return 'dano';
        case 'transferencia':
            return 'transferencia';
        case 'prestamo':
            return 'transferencia';
        case 'mantenimiento':
            return 'mantenimiento';
        default:
            return 'ajuste';
    }
}
