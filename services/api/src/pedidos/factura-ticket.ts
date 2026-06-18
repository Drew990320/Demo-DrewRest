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
  total: number;
  metodo_pago?: 'efectivo' | 'transferencia' | 'tarjeta';
  emitida_en: string;
  /** Marca visual en el ticket impreso (no altera datos de la factura). */
  es_reimpresion?: boolean;
  /** Cobro de una parte del pedido (dividir cuenta). */
  es_cobro_parcial?: boolean;
  /** Resumen de todo el pedido ya pagado (varios cobros). */
  es_total_pedido?: boolean;
  /** Desglose por cobro cuando el pedido se pagó en varias facturas. */
  cobros_resumen?: { metodo_pago: 'efectivo' | 'transferencia' | 'tarjeta'; total: number }[];
  /** Vista previa impresa antes del cobro; no registra pago. */
  es_precuenta?: boolean;
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
  return mp;
}
