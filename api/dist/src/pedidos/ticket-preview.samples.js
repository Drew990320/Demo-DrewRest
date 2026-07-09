"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TICKET_PREVIEW_CATALOG = void 0;
exports.catalogItemForTipo = catalogItemForTipo;
exports.buildSampleEscPosBuffer = buildSampleEscPosBuffer;
const comanda_escpos_builder_1 = require("./comanda-escpos.builder");
const cierre_caja_escpos_builder_1 = require("./cierre-caja-escpos.builder");
const cuentas_divididas_escpos_builder_1 = require("./cuentas-divididas-escpos.builder");
const factura_escpos_builder_1 = require("./factura-escpos.builder");
exports.TICKET_PREVIEW_CATALOG = [
    {
        id: 'comanda',
        label: 'Comanda de cocina',
        grupo: 'Cocina',
        descripcion: 'Platos sin precios para la cocina.',
    },
    {
        id: 'comanda_adicional',
        label: 'Comanda adicional',
        grupo: 'Cocina',
        descripcion: 'Solo platos nuevos de un segundo envío.',
    },
    {
        id: 'comanda_reimpresion',
        label: 'Reimpresión de comanda',
        grupo: 'Cocina',
        descripcion: 'Marca REIMPRESIÓN en el ticket.',
    },
    {
        id: 'precuenta',
        label: 'Pre-cuenta',
        grupo: 'Cobro',
        descripcion: 'Vista previa antes del cobro; no registra pago.',
    },
    {
        id: 'factura_efectivo',
        label: 'Factura (efectivo)',
        grupo: 'Cobro',
        descripcion: 'Ticket de cobro con ítems, descuentos y total.',
    },
    {
        id: 'factura_negocio',
        label: 'Copia negocio',
        grupo: 'Cobro',
        descripcion: 'Segunda copia para archivo del restaurante.',
    },
    {
        id: 'factura_cliente',
        label: 'Copia cliente',
        grupo: 'Cobro',
        descripcion: 'Copia entregada al comensal.',
    },
    {
        id: 'factura_reimpresion',
        label: 'Reimpresión de factura',
        grupo: 'Cobro',
        descripcion: 'Ticket marcado como reimpresión.',
    },
    {
        id: 'factura_parcial',
        label: 'Cobro parcial',
        grupo: 'Cobro',
        descripcion: 'Parte de la cuenta en una tanda.',
    },
    {
        id: 'factura_mixto',
        label: 'Pago mixto',
        grupo: 'Cobro',
        descripcion: 'Efectivo + transferencia en un cobro.',
    },
    {
        id: 'factura_total_pedido',
        label: 'Total del pedido',
        grupo: 'Cobro',
        descripcion: 'Resumen con todos los cobros del pedido.',
    },
    {
        id: 'factura_fiado',
        label: 'Cobro fiado',
        grupo: 'Cobro',
        descripcion: 'Cliente queda debiendo; datos de crédito.',
    },
    {
        id: 'cuentas_divididas',
        label: 'Cuentas divididas',
        grupo: 'Cobro',
        descripcion: 'Detalle de pedidos cobrados en varias facturas.',
    },
    {
        id: 'cierre_caja',
        label: 'Cierre de caja',
        grupo: 'Caja',
        descripcion: 'Totales del día y efectivo esperado.',
    },
    {
        id: 'base_caja',
        label: 'Base de caja (apertura)',
        grupo: 'Caja',
        descripcion: 'Comprobante al abrir el día.',
    },
    {
        id: 'base_caja_cierre',
        label: 'Arqueo de cierre',
        grupo: 'Caja',
        descripcion: 'Base registrada al cerrar caja.',
    },
    {
        id: 'movimiento_entrada',
        label: 'Entrada manual de caja',
        grupo: 'Caja',
        descripcion: 'Ingreso de efectivo con motivo.',
    },
    {
        id: 'movimiento_salida',
        label: 'Salida manual de caja',
        grupo: 'Caja',
        descripcion: 'Retiro de efectivo con motivo.',
    },
];
const DEMO_EMITIDA = '2026-07-09T18:30:00.000Z';
const lineasDemoFactura = [
    {
        cantidad: 2,
        nombre_producto: 'Bandeja paisa',
        subtotal_linea: 56000,
        personalizaciones: ['Sin chicharrón'],
        nota_cocina: null,
    },
    {
        cantidad: 1,
        nombre_producto: 'Limonada natural',
        subtotal_linea: 6000,
        personalizaciones: [],
        nota_cocina: null,
    },
    {
        cantidad: 1,
        nombre_producto: 'Empaque para llevar',
        subtotal_linea: 2000,
        personalizaciones: [],
        nota_cocina: null,
    },
];
function facturaBase(overrides = {}) {
    return {
        id_pedido: 1042,
        id_factura: 891,
        mesa_numero: 7,
        mesa_etiqueta: 'Mesa 7',
        num_comensales: 3,
        mesero: 'Ana López',
        modo_servicio: 'en_mesa',
        lineas: lineasDemoFactura,
        subtotal: 64000,
        descuento_sopas: 0,
        descuento_muleros: 4000,
        descuento_promociones: 0,
        total: 60000,
        metodo_pago: 'efectivo',
        emitida_en: DEMO_EMITIDA,
        ...overrides,
    };
}
function comandaBase(overrides = {}) {
    return {
        id_pedido: 1042,
        mesa_numero: 7,
        mesa_etiqueta: 'Mesa 7',
        num_comensales: 3,
        mesero: 'Ana López',
        modo_servicio: 'en_mesa',
        lineas: [
            {
                id_detalle: 1,
                cantidad: 2,
                nombre_producto: 'Bandeja paisa',
                nota_cocina: 'Sin chicharrón',
                personalizaciones: ['Arroz aparte'],
            },
            {
                id_detalle: 2,
                cantidad: 1,
                nombre_producto: 'Mazorca desgranada',
                nota_cocina: null,
                personalizaciones: ['Con queso costeño'],
            },
        ],
        emitida_en: DEMO_EMITIDA,
        ...overrides,
    };
}
const SAMPLE_BUILDERS = {
    comanda: (w) => (0, comanda_escpos_builder_1.buildComandaEscPos)(comandaBase(), w),
    comanda_adicional: (w) => (0, comanda_escpos_builder_1.buildComandaEscPos)(comandaBase({ es_adicional: true }), w),
    comanda_reimpresion: (w) => (0, comanda_escpos_builder_1.buildComandaEscPos)(comandaBase({ es_reimpresion: true }), w),
    precuenta: (w) => (0, factura_escpos_builder_1.buildFacturaEscPos)(facturaBase({ es_precuenta: true, metodo_pago: undefined }), w),
    factura_efectivo: (w) => (0, factura_escpos_builder_1.buildFacturaEscPos)(facturaBase(), w),
    factura_negocio: (w) => (0, factura_escpos_builder_1.buildFacturaEscPos)(facturaBase({ copia_destinatario: 'negocio' }), w),
    factura_cliente: (w) => (0, factura_escpos_builder_1.buildFacturaEscPos)(facturaBase({ copia_destinatario: 'cliente' }), w),
    factura_reimpresion: (w) => (0, factura_escpos_builder_1.buildFacturaEscPos)(facturaBase({ es_reimpresion: true }), w),
    factura_parcial: (w) => (0, factura_escpos_builder_1.buildFacturaEscPos)(facturaBase({
        es_cobro_parcial: true,
        lineas: lineasDemoFactura.slice(0, 2),
        subtotal: 62000,
        total: 58000,
    }), w),
    factura_mixto: (w) => (0, factura_escpos_builder_1.buildFacturaEscPos)(facturaBase({
        metodo_pago: 'mixto',
        cobros_resumen: [
            { metodo_pago: 'efectivo', total: 35000 },
            { metodo_pago: 'transferencia', total: 25000 },
        ],
        detalle_exceso_cobro: {
            monto_recibido_efectivo: 40000,
            monto_transferencia_recibido: 25000,
            vuelto_cliente_efectivo: 5000,
            vuelto_cliente_transferencia: 0,
            pago_domiciliario: 0,
            pago_mesero: 0,
        },
    }), w),
    factura_total_pedido: (w) => (0, factura_escpos_builder_1.buildFacturaEscPos)(facturaBase({
        es_total_pedido: true,
        cobros_resumen: [
            { metodo_pago: 'efectivo', total: 32000 },
            { metodo_pago: 'transferencia', total: 28000 },
        ],
    }), w),
    factura_fiado: (w) => (0, factura_escpos_builder_1.buildFacturaEscPos)(facturaBase({
        metodo_pago: 'fiado',
        fiado_cliente: 'Carlos Méndez',
        fiado_telefono: '300 123 4567',
    }), w),
    cuentas_divididas: (w) => {
        const ticket = {
            fecha: '2026-07-09',
            emitida_en: DEMO_EMITIDA,
            pedidos: [
                {
                    id_pedido: 1042,
                    mesa_numero: 7,
                    mesa_etiqueta: 'Mesa 7',
                    total_pedido: 120000,
                    facturas: [
                        {
                            tanda: 1,
                            id_factura: 891,
                            total: 60000,
                            metodo_pago: 'efectivo',
                            emitida_en: DEMO_EMITIDA,
                            es_parcial: true,
                        },
                        {
                            tanda: 2,
                            id_factura: 892,
                            total: 60000,
                            metodo_pago: 'transferencia',
                            emitida_en: DEMO_EMITIDA,
                            es_parcial: true,
                        },
                    ],
                },
            ],
        };
        return (0, cuentas_divididas_escpos_builder_1.buildCuentasDivididasEscPos)(ticket, w);
    },
    cierre_caja: (w) => {
        const ticket = {
            fecha: '2026-07-09',
            total_facturado: 2450000,
            total_facturas: 87,
            monto_base_efectivo: 150000,
            totales_por_metodo: {
                efectivo: 980000,
                transferencia: 1320000,
                fiado: 150000,
            },
            total_fiados_dia: 150000,
            efectivo_esperado_en_caja: 1130000,
            total_pagos_meseros: 45000,
            total_devoluciones_efectivo: 12000,
            total_entradas_manual: 20000,
            total_salidas_manual: 8000,
            emitida_en: DEMO_EMITIDA,
        };
        return (0, cierre_caja_escpos_builder_1.buildCierreCajaEscPos)(ticket, w);
    },
    base_caja: (w) => {
        const ticket = {
            fecha: '2026-07-09',
            monto_base_efectivo: 150000,
            emitida_en: DEMO_EMITIDA,
        };
        return (0, cierre_caja_escpos_builder_1.buildBaseCajaEscPos)(ticket, w);
    },
    base_caja_cierre: (w) => {
        const ticket = {
            fecha: '2026-07-09',
            monto_base_cierre_efectivo: 148000,
            efectivo_esperado_en_caja: 1130000,
            emitida_en: DEMO_EMITIDA,
        };
        return (0, cierre_caja_escpos_builder_1.buildBaseCajaCierreEscPos)(ticket, w);
    },
    movimiento_entrada: (w) => {
        const ticket = {
            id_movimiento: 12,
            tipo: 'entrada_manual',
            fecha: '2026-07-09',
            monto: 50000,
            motivo: 'Cambio adicional para turno noche',
            registrado_por: 'Admin Demo',
            creado_en: DEMO_EMITIDA,
            emitida_en: DEMO_EMITIDA,
        };
        return (0, cierre_caja_escpos_builder_1.buildMovimientoCajaEscPos)(ticket, w);
    },
    movimiento_salida: (w) => {
        const ticket = {
            id_movimiento: 13,
            tipo: 'salida_manual',
            fecha: '2026-07-09',
            monto: 30000,
            motivo: 'Compra urgente de insumos',
            registrado_por: 'Admin Demo',
            creado_en: DEMO_EMITIDA,
            emitida_en: DEMO_EMITIDA,
        };
        return (0, cierre_caja_escpos_builder_1.buildMovimientoCajaEscPos)(ticket, w);
    },
};
function catalogItemForTipo(tipo) {
    return exports.TICKET_PREVIEW_CATALOG.find((c) => c.id === tipo);
}
function buildSampleEscPosBuffer(tipo, charWidth) {
    const build = SAMPLE_BUILDERS[tipo];
    if (!build) {
        throw new Error(`Tipo de ticket no válido: ${tipo}`);
    }
    return build(charWidth);
}
//# sourceMappingURL=ticket-preview.samples.js.map