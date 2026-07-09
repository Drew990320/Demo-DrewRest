export type DevolucionExcesoMetodo = 'efectivo' | 'transferencia' | 'domicilio' | 'mesero';
/** Snapshot persistido al cobrar: instrucciones operativas para mesero/caja. */
export type DetalleExcesoCobro = {
    monto_recibido_efectivo?: number;
    monto_transferencia_recibido?: number;
    vuelto_cliente_efectivo: number;
    vuelto_cliente_transferencia: number;
    pago_domiciliario: number;
    pago_mesero: number;
};
export type LineaTicketExcesoCobro = {
    etiqueta: string;
    monto: number;
    /** Línea resumen en negrita (VUELTO, PAGO DOMICILIARIO, etc.). */
    destacado?: boolean;
};
export type CalcularDetalleExcesoCobroInput = {
    total: number;
    metodo: 'efectivo' | 'transferencia' | 'mixto';
    monto_recibido_efectivo?: number | null;
    monto_transferencia?: number | null;
    devolucion_exceso_metodo?: DevolucionExcesoMetodo | null;
};
/** @deprecated Usar DetalleExcesoCobro en tickets nuevos. */
export type VueltoClienteInfo = {
    monto_recibido_efectivo?: number;
    monto_transferencia_recibido?: number;
    vuelto_total: number;
    vuelto_efectivo: number;
    vuelto_transferencia: number;
};
export type CalcularVueltoClienteInput = CalcularDetalleExcesoCobroInput;
export declare function detalleExcesoCobroActivo(d: DetalleExcesoCobro): boolean;
export declare function parseDetalleExcesoCobro(raw: unknown): DetalleExcesoCobro | null;
/** Totales simples para el ticket: una línea clara por acción. */
export declare function resumenesSimplesExcesoCobro(d: DetalleExcesoCobro): {
    etiqueta: string;
    monto: number;
}[];
/** Líneas ordenadas para ticket impreso / correo. */
export declare function lineasTicketExcesoCobro(d: DetalleExcesoCobro): LineaTicketExcesoCobro[];
export declare function calcularDetalleExcesoCobro(params: CalcularDetalleExcesoCobroInput): DetalleExcesoCobro | null;
/** Solo vuelto al cliente (compatibilidad). */
export declare function calcularVueltoCliente(params: CalcularVueltoClienteInput): VueltoClienteInfo | null;
