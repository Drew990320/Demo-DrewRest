"use strict";
/**
 * Tipos de movimiento de inventario (ledger).
 * Incluye mapeo desde valores legacy de la API actual.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.esMovimientoEntrada = esMovimientoEntrada;
exports.normalizarTipoMovLegacy = normalizarTipoMovLegacy;
exports.tipoMovCanonico = tipoMovCanonico;
const ENTRADAS = new Set([
    'compra',
    'entrada',
    'devolucion',
    'reposicion',
    'produccion',
    'inventario_fisico',
]);
function esMovimientoEntrada(tipo) {
    return ENTRADAS.has(tipo);
}
function normalizarTipoMovLegacy(tipo) {
    switch (tipo) {
        case 'entrada':
            return 'entrada';
        case 'consumo':
            return 'consumo';
        case 'ajuste':
            return 'ajuste';
        default:
            return tipo;
    }
}
function tipoMovCanonico(tipo) {
    switch (tipo) {
        case 'entrada':
            return 'compra';
        case 'consumo':
            return 'consumo_manual';
        case 'ajuste':
            return 'ajuste_manual';
        default:
            return tipo;
    }
}
