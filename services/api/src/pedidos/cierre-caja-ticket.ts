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

  /** Pagos por turno registrados en Meseros (turno). */
  total_pagos_meseros?: number;

  /** Devoluciones de exceso en transferencia pagadas en efectivo. */
  total_devoluciones_efectivo?: number;

  total_entradas_manual?: number;
  total_salidas_manual?: number;
  total_pagos_domicilio?: number;
  total_pagos_mesero_exceso?: number;

  subtotal_entradas_caja?: number;
  subtotal_salidas_caja?: number;

  emitida_en: string;

};



export type BaseCajaTicket = {

  fecha: string;

  monto_base_efectivo: number;

  emitida_en: string;

};

/** Comprobante al registrar el arqueo de cierre del día. */
export type BaseCajaCierreTicket = {
  fecha: string;
  monto_base_cierre_efectivo: number;
  efectivo_esperado_en_caja?: number;
  emitida_en: string;
};

/** Comprobante de entrada o salida manual de caja. */
export type MovimientoCajaTicket = {
  id_movimiento: number;
  tipo: 'entrada_manual' | 'salida_manual';
  fecha: string;
  monto: number;
  motivo: string;
  registrado_por: string;
  creado_en: string;
  emitida_en: string;
};


