export type CierreCajaMesaResumen = {

  mesa_numero: number;

  mesa_etiqueta: string;

  pedidos_atendidos: number;

  total_facturado: number;

};



/** Ticket resumen de cierre del día (solo totales de caja). */

export type CierreCajaTicket = {

  fecha: string;

  /** Total consumido / facturado en el día. */
  total_facturado: number;

  total_facturas: number;

  monto_base_efectivo: number;

  totales_por_metodo: {

    efectivo: number;

    transferencia: number;

  };

  efectivo_esperado_en_caja: number;

  emitida_en: string;

};



export type BaseCajaTicket = {

  fecha: string;

  monto_base_efectivo: number;

  emitida_en: string;

};


