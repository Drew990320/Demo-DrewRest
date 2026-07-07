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
  promociones_desglose?: { etiqueta: string; monto: number }[];
  total: number;
  metodo_pago?: 'efectivo' | 'transferencia' | 'tarjeta' | 'mixto';
  emitida_en: string;
  /** Marca visual en el ticket impreso (no altera datos de la factura). */
  es_reimpresion?: boolean;
  /** Cobro de una parte del pedido (dividir cuenta). */
  es_cobro_parcial?: boolean;
  /** Cuota por personas: líneas muestran el pedido completo (referencia). */
  es_cuota_personas?: boolean;
  /** Cuota combinada: líneas muestran la selección marcada (referencia). */
  es_cuota_combinado?: boolean;
  /** Ítems marcados en esta tanda (modo combinar / platos). */
  es_cobro_combinado?: boolean;
  /** Resumen de todo el pedido ya pagado (varios cobros). */
  es_total_pedido?: boolean;
  /** Desglose por cobro cuando el pedido se pagó en varias facturas. */
  cobros_resumen?: { metodo_pago: 'efectivo' | 'transferencia' | 'tarjeta'; total: number }[];
  /** Vista previa impresa antes del cobro; no registra pago. */
  es_precuenta?: boolean;
  /** Instrucciones de vuelto/exceso persistidas al cobrar. */
  detalle_exceso_cobro?: {
    monto_recibido_efectivo?: number;
    monto_transferencia_recibido?: number;
    vuelto_cliente_efectivo: number;
    vuelto_cliente_transferencia: number;
    pago_domiciliario: number;
    pago_mesero: number;
  };
  /** @deprecated Usar detalle_exceso_cobro */
  vuelto_cliente?: {
    monto_recibido_efectivo?: number;
    monto_transferencia_recibido?: number;
    vuelto_total: number;
    vuelto_efectivo: number;
    vuelto_transferencia: number;
  };
  /** Etiqueta de copia al imprimir dos tickets (negocio + cliente). */
  copia_destinatario?: 'negocio' | 'cliente';
};

export function labelMetodoPago(
  mp: FacturaTicket['metodo_pago'],
): string {
  if (!mp) return 'Pendiente de pago';
  if (mp === 'efectivo') return 'Efectivo';
  if (mp === 'transferencia') return 'Transferencia';
  if (mp === 'tarjeta') return 'Tarjeta';
  if (mp === 'mixto') return 'Pago mixto';
  return mp;
}
