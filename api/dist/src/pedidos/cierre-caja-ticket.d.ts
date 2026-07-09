export type CierreCajaMesaResumen = {
    mesa_numero: number;
    mesa_etiqueta: string;
    pedidos_atendidos: number;
    total_facturado: number;
};
export type CierreCajaTicket = {
    fecha: string;
    total_facturado: number;
    total_facturas: number;
    monto_base_efectivo: number;
    totales_por_metodo: {
        efectivo: number;
        transferencia: number;
    };
    efectivo_esperado_en_caja: number;
    total_pagos_meseros?: number;
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
export type BaseCajaCierreTicket = {
    fecha: string;
    monto_base_cierre_efectivo: number;
    efectivo_esperado_en_caja?: number;
    emitida_en: string;
};
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
