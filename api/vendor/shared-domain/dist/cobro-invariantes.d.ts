/**
 * Invariantes y máquina de estados del cobro de un pedido.
 *
 * ## Máquina de estados (respecto al cobro)
 *
 * ```
 *   [abierto|en_cocina] ──cobro parcial──► parcialmente_pagado
 *         │                                        │
 *         │                                        │ cobro(s) que cierran
 *         │                                        ▼
 *         └──────── cobro total ────────────► facturado (pagado)
 *
 *   facturado ──reabrir todo (admin)──► abierto|en_cocina (todos los ítems pendientes)
 *   facturado|parcialmente_pagado ──revertir tanda (admin)──►
 *     parcialmente_pagado | pendiente (solo esa factura/grupo mixto)
 *     historial: cobro_reabierto + detalle.alcance = 'tanda'
 *   parcialmente_pagado ──cerrar anulando pendiente──► facturado
 *     (ítems no cobrados se anulan; no se revierten cobros previos)
 * ```
 *
 * El estado de cobro NO es un campo en Pedido: se deriva de
 * `Pedido.estado` + `DetallePedido.idFactura` + filas `Factura`.
 *
 * - pendiente: ninguna factura, todos los ítems con idFactura = null
 * - parcialmente_pagado: ≥1 factura y ≥1 ítem pendiente
 * - pagado: Pedido.estado = facturado (todos los ítems billables cobrados o anulados)
 *
 * ## Modalidades × formas de pago (soporte)
 *
 * | Modalidad   | efectivo | transferencia | mixto (efectivo+transferencia) |
 * |-------------|----------|---------------|--------------------------------|
 * | Normal      | sí       | sí            | sí (2 Factura + cobroMixtoGrupo) |
 * | Tandas      | sí       | sí            | sí por tanda                   |
 * | Por personas| sí       | sí            | sí por persona                 |
 * | Combinado   | sí       | sí            | sí por persona del grupo       |
 *
 * Mixto NUNCA es un MetodoPago en BD: son dos facturas enlazadas por cobroMixtoGrupo.
 *
 * ## Invariantes obligatorios
 *
 * 1. Ningún DetallePedido con idFactura puede volver a cobrarse.
 * 2. Suma de Factura.total del pedido ≤ total neto de ítems del pedido
 *    (igualdad al cerrar sin anulación).
 * 3. En un grupo mixto: total(efectivo) + total(transferencia) = total de la operación,
 *    y cada pata guarda su monto exacto (auditable).
 * 4. Montos en enteros COP (Math.round); sin float intermedio en totales.
 */
export type EstadoCobroPedido = 'pendiente' | 'parcialmente_pagado' | 'pagado';
export type FacturaCobroRef = {
    total: number;
    metodo_pago: string;
    cobro_mixto_grupo?: number | null;
    es_parcial?: boolean;
};
export type DetalleCobroRef = {
    id_detalle: number;
    cobrado: boolean;
    cantidad: number;
    precio_unitario: number;
};
/** Deriva el estado de cobro del pedido. */
export declare function estadoCobroPedido(opts: {
    estadoPedido: string;
    facturas: {
        total?: number;
    }[];
    detalles: {
        cobrado: boolean;
    }[];
}): EstadoCobroPedido;
export declare function totalFacturadoPedido(facturas: {
    total: number;
}[]): number;
export declare function totalNetoDetalles(detalles: {
    cantidad: number;
    precio_unitario: number;
    cobrado?: boolean;
}[]): number;
export declare function totalNetoDetallesCobrados(detalles: {
    cantidad: number;
    precio_unitario: number;
    cobrado: boolean;
}[]): number;
/**
 * ¿El reparto por cantidad de un mixto ya produce los montos exactos
 * de efectivo y transferencia? Si no, hay que partir precios.
 */
export declare function mixtoMontosCoincidenConReparto(totalLegEfectivo: number, totalLegTransferencia: number, efectivoFactura: number, transferenciaFactura: number): boolean;
/**
 * True cuando ambas patas del mixto tienen monto > 0 y el reparto por
 * cantidad no refleja esos montos (o alguna pata quedó vacía).
 */
export declare function necesitaSplitPrecioMixto(opts: {
    efectivoFactura: number;
    transferenciaFactura: number;
    solicitudesEfectivoLen: number;
    solicitudesTransferenciaLen: number;
    totalLegEfectivo: number;
    totalLegTransferencia: number;
}): boolean;
export type InvariantesCobroResultado = {
    ok: boolean;
    errores: string[];
};
/**
 * Valida invariantes auditables de un pedido tras uno o más cobros.
 * `totalPedidoNeto` es el total de todos los ítems (cobrados + pendientes),
 * sin descuentos de factura (bruto de líneas). Para validar vs facturas con
 * descuento, pasar `totalFacturadoMaximo` explícito.
 */
export declare function validarInvariantesCobroPedido(opts: {
    facturas: FacturaCobroRef[];
    detalles: DetalleCobroRef[];
    /** Tope: suma de facturas no puede superar este monto (neto cobrado esperado). */
    totalFacturadoMaximo?: number;
}): InvariantesCobroResultado;
/**
 * Reparte subtotal/descuentos de una operación entre patas mixto de forma
 * que la suma de totales coincida exactamente con el total de la operación.
 * La primera pata usa montos redondeados; la segunda recibe el residuo.
 */
export declare function importesProporcionalesMixto(full: {
    subtotal: number;
    descuento_sopas: number;
    descuento_muleros: number;
    descuento_promociones: number;
    total: number;
}, montoPrimeraPata: number): {
    primera: {
        subtotal: number;
        descuento_sopas: number;
        descuento_muleros: number;
        descuento_promociones: number;
        total: number;
    };
    segunda: {
        subtotal: number;
        descuento_sopas: number;
        descuento_muleros: number;
        descuento_promociones: number;
        total: number;
    };
};
