export type CuentaDivididaFactura = {
    tanda: number;
    id_factura: number;
    total: number;
    metodo_pago: 'efectivo' | 'transferencia' | string;
    emitida_en: string;
    es_parcial: boolean;
};
export type CuentaDivididaPedido = {
    id_pedido: number;
    mesa_numero: number;
    mesa_etiqueta: string;
    total_pedido: number;
    facturas: CuentaDivididaFactura[];
};
export type CuentasDivididasTicket = {
    fecha: string;
    pedidos: CuentaDivididaPedido[];
    emitida_en: string;
};
