export type FacturaLinea = {
    cantidad: number;
    nombre_producto: string;
    subtotal_linea: number;
    personalizaciones: string[];
    nota_cocina: string | null;
};
export type FacturaTicket = {
    id_pedido: number;
    id_factura?: number;
    mesa_numero: number;
    mesa_etiqueta: string;
    num_comensales: number;
    mesero: string;
    modo_servicio: 'en_mesa' | 'para_llevar';
    lineas: FacturaLinea[];
    subtotal: number;
    descuento_sopas: number;
    descuento_muleros: number;
    descuento_promociones: number;
    promociones_desglose?: {
        etiqueta: string;
        monto: number;
    }[];
    total: number;
    metodo_pago?: 'efectivo' | 'transferencia' | 'tarjeta' | 'mixto';
    emitida_en: string;
    es_reimpresion?: boolean;
    es_cobro_parcial?: boolean;
    es_cuota_personas?: boolean;
    es_cuota_combinado?: boolean;
    es_cobro_combinado?: boolean;
    es_total_pedido?: boolean;
    cobros_resumen?: {
        metodo_pago: 'efectivo' | 'transferencia' | 'tarjeta';
        total: number;
    }[];
    es_precuenta?: boolean;
    detalle_exceso_cobro?: {
        monto_recibido_efectivo?: number;
        monto_transferencia_recibido?: number;
        vuelto_cliente_efectivo: number;
        vuelto_cliente_transferencia: number;
        pago_domiciliario: number;
        pago_mesero: number;
    };
    vuelto_cliente?: {
        monto_recibido_efectivo?: number;
        monto_transferencia_recibido?: number;
        vuelto_total: number;
        vuelto_efectivo: number;
        vuelto_transferencia: number;
    };
    copia_destinatario?: 'negocio' | 'cliente';
};
export declare function labelMetodoPago(mp: FacturaTicket['metodo_pago']): string;
