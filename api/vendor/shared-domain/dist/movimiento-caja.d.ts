export type TipoMovimientoCaja = 'devolucion_exceso_transferencia' | 'entrada_manual' | 'salida_manual' | 'pago_domicilio' | 'pago_mesero';
export type MetodoDevolucionExceso = 'efectivo' | 'transferencia';
/** Destino del exceso cuando el cliente transfirió más del total del pedido. */
export type ExcesoTransferenciaDestino = MetodoDevolucionExceso | 'domicilio' | 'mesero';
export type MovimientoCajaLike = {
    tipo: TipoMovimientoCaja;
    monto: number;
    metodo_devolucion?: MetodoDevolucionExceso | null;
};
/** Impacto en efectivo físico en caja (+ entra, − sale). */
export declare function impactoMovimientoCajaEfectivo(m: MovimientoCajaLike): number;
export declare function etiquetaTipoMovimientoCaja(tipo: TipoMovimientoCaja): string;
export declare function resumenImpactoMovimientosCaja(movimientos: MovimientoCajaLike[]): {
    total_entradas_manual: number;
    total_salidas_manual: number;
    total_devoluciones_efectivo: number;
    total_pagos_domicilio: number;
    total_pagos_mesero_exceso: number;
    neto_movimientos_caja: number;
};
export type CuadreCajaEfectivoInput = {
    monto_base_efectivo: number;
    ventas_efectivo: number;
    total_pagos_meseros?: number;
    movimientos?: MovimientoCajaLike[];
};
export type CuadreCajaEfectivo = {
    monto_base_efectivo: number;
    ventas_efectivo: number;
    total_pagos_meseros: number;
    total_entradas_manual: number;
    total_salidas_manual: number;
    total_devoluciones_efectivo: number;
    total_pagos_domicilio: number;
    total_pagos_mesero_exceso: number;
    /** Caja inicial + ventas efectivo + entradas manuales */
    subtotal_entradas_caja: number;
    /** Pagos meseros + salidas manuales + devoluciones + domicilios + mesero (exceso) */
    subtotal_salidas_caja: number;
    /** subtotal_entradas_caja − subtotal_salidas_caja */
    efectivo_esperado_en_caja: number;
    neto_movimientos_caja: number;
};
/**
 * Cuadre de efectivo físico en caja.
 * Prioriza agrupar entradas y salidas antes de restar:
 *   (base + ventas + entradas) − (pagos meseros + salidas + devoluciones + domicilios + mesero exceso)
 */
export declare function calcularEfectivoEsperadoEnCaja(input: CuadreCajaEfectivoInput): CuadreCajaEfectivo;
