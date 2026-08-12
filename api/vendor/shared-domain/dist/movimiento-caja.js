"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metodoMovimientoCaja = metodoMovimientoCaja;
exports.impactoMovimientoCajaEfectivo = impactoMovimientoCajaEfectivo;
exports.etiquetaTipoMovimientoCaja = etiquetaTipoMovimientoCaja;
exports.resumenImpactoMovimientosCaja = resumenImpactoMovimientosCaja;
exports.calcularEfectivoEsperadoEnCaja = calcularEfectivoEsperadoEnCaja;
/** Efectivo o transferencia; null/omitido = efectivo (entradas históricas). */
function metodoMovimientoCaja(m) {
    return m.metodo_devolucion === 'transferencia' ? 'transferencia' : 'efectivo';
}
/** Impacto en efectivo físico en caja (+ entra, − sale). */
function impactoMovimientoCajaEfectivo(m) {
    const monto = Math.round(Number(m.monto) || 0);
    if (monto <= 0)
        return 0;
    switch (m.tipo) {
        case 'entrada_manual':
            return metodoMovimientoCaja(m) === 'efectivo' ? monto : 0;
        case 'salida_manual':
            return metodoMovimientoCaja(m) === 'efectivo' ? -monto : 0;
        case 'pago_domicilio':
        case 'pago_mesero':
        case 'cuota_gasto_fijo':
            return -monto;
        case 'devolucion_exceso_transferencia':
            return m.metodo_devolucion === 'efectivo' ? -monto : 0;
        default:
            return 0;
    }
}
function etiquetaTipoMovimientoCaja(tipo) {
    switch (tipo) {
        case 'entrada_manual':
            return 'Entrada de caja';
        case 'salida_manual':
            return 'Salida de caja';
        case 'pago_domicilio':
            return 'Pago domiciliario';
        case 'pago_mesero':
            return 'Pago al mesero (exceso transfer.)';
        case 'cuota_gasto_fijo':
            return 'Fondo gasto fijo';
        case 'devolucion_exceso_transferencia':
            return 'Devolución (exceso transferencia)';
        default:
            return tipo;
    }
}
function resumenImpactoMovimientosCaja(movimientos) {
    let total_entradas_manual = 0;
    let total_entradas_manual_transferencia = 0;
    let total_salidas_manual = 0;
    let total_salidas_manual_transferencia = 0;
    let total_devoluciones_efectivo = 0;
    let total_pagos_domicilio = 0;
    let total_pagos_mesero_exceso = 0;
    let total_cuotas_gasto_fijo = 0;
    let neto_movimientos_caja = 0;
    for (const m of movimientos) {
        const impacto = impactoMovimientoCajaEfectivo(m);
        neto_movimientos_caja += impacto;
        const monto = Math.round(Number(m.monto) || 0);
        if (m.tipo === 'entrada_manual') {
            if (metodoMovimientoCaja(m) === 'transferencia') {
                total_entradas_manual_transferencia += monto;
            }
            else {
                total_entradas_manual += monto;
            }
        }
        else if (m.tipo === 'salida_manual') {
            if (metodoMovimientoCaja(m) === 'transferencia') {
                total_salidas_manual_transferencia += monto;
            }
            else {
                total_salidas_manual += monto;
            }
        }
        else if (m.tipo === 'pago_domicilio')
            total_pagos_domicilio += monto;
        else if (m.tipo === 'pago_mesero')
            total_pagos_mesero_exceso += monto;
        else if (m.tipo === 'cuota_gasto_fijo')
            total_cuotas_gasto_fijo += monto;
        else if (m.tipo === 'devolucion_exceso_transferencia' &&
            m.metodo_devolucion === 'efectivo') {
            total_devoluciones_efectivo += monto;
        }
    }
    return {
        total_entradas_manual,
        total_entradas_manual_transferencia,
        total_salidas_manual,
        total_salidas_manual_transferencia,
        total_devoluciones_efectivo,
        total_pagos_domicilio,
        total_pagos_mesero_exceso,
        total_cuotas_gasto_fijo,
        neto_movimientos_caja,
    };
}
/**
 * Cuadre de efectivo físico en caja.
 * Prioriza agrupar entradas y salidas antes de restar:
 *   (base + ventas + entradas) − (pagos meseros + salidas + devoluciones + domicilios + mesero exceso)
 */
function calcularEfectivoEsperadoEnCaja(input) {
    const monto_base_efectivo = Math.round(Number(input.monto_base_efectivo) || 0);
    const ventas_efectivo = Math.round(Number(input.ventas_efectivo) || 0);
    const total_pagos_meseros = Math.round(Number(input.total_pagos_meseros) || 0);
    const impacto = resumenImpactoMovimientosCaja(input.movimientos ?? []);
    const subtotal_entradas_caja = monto_base_efectivo + ventas_efectivo + impacto.total_entradas_manual;
    const subtotal_salidas_caja = total_pagos_meseros +
        impacto.total_salidas_manual +
        impacto.total_devoluciones_efectivo +
        impacto.total_pagos_domicilio +
        impacto.total_pagos_mesero_exceso +
        impacto.total_cuotas_gasto_fijo;
    const efectivo_esperado_en_caja = subtotal_entradas_caja - subtotal_salidas_caja;
    return {
        monto_base_efectivo,
        ventas_efectivo,
        total_pagos_meseros,
        total_entradas_manual: impacto.total_entradas_manual,
        total_entradas_manual_transferencia: impacto.total_entradas_manual_transferencia,
        total_salidas_manual: impacto.total_salidas_manual,
        total_salidas_manual_transferencia: impacto.total_salidas_manual_transferencia,
        total_devoluciones_efectivo: impacto.total_devoluciones_efectivo,
        total_pagos_domicilio: impacto.total_pagos_domicilio,
        total_pagos_mesero_exceso: impacto.total_pagos_mesero_exceso,
        total_cuotas_gasto_fijo: impacto.total_cuotas_gasto_fijo,
        subtotal_entradas_caja,
        subtotal_salidas_caja,
        efectivo_esperado_en_caja,
        neto_movimientos_caja: impacto.neto_movimientos_caja,
    };
}
