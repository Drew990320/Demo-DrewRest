import {
  estadoCobroPedido,
  importesProporcionalesMixto,
  mixtoMontosCoincidenConReparto,
  necesitaSplitPrecioMixto,
  totalFacturadoPedido,
  validarInvariantesCobroPedido,
} from './cobro-invariantes';
import {
  dividirSolicitudesCobroMixto,
  repartoMixtoConDevolucion,
  repartoMixtoDesdeTransferencia,
  resumenCobrosPedidoTotal,
} from './factura-mixto';
import {
  quedaPendienteTrasCobro,
  pedidoCobroCompleto,
  subtotalDesdeSolicitudes,
} from './cobro-parcial';
import {
  repartirMontoEnCop,
  sumaPartesIgualTotal,
} from './repartir-monto-cop';

/**
 * Matriz de escenarios: modalidad × forma de pago × estado × bordes.
 * Cada caso documenta soporte, cobertura de test y riesgo histórico.
 */
describe('matriz cobro — redondeo por personas', () => {
  it.each([
    [30_000, 2],
    [30_000, 3],
    [10_050, 3],
    [1, 1],
    [99, 2],
    [100_000, 7],
  ])('repartirMontoEnCop(%i, %i) suma exacta', (total, n) => {
    const partes = repartirMontoEnCop(total, n);
    expect(partes).toHaveLength(n);
    expect(sumaPartesIgualTotal(partes, total)).toBe(true);
  });

  it('pedido de un solo cliente: una sola parte = total', () => {
    expect(repartirMontoEnCop(45_000, 1)).toEqual([45_000]);
  });

  it('monto 0 no genera partes', () => {
    expect(repartirMontoEnCop(0, 3)).toEqual([]);
  });
});

describe('matriz cobro — estado del pedido', () => {
  it('pendiente: sin facturas', () => {
    expect(
      estadoCobroPedido({
        estadoPedido: 'abierto',
        facturas: [],
        detalles: [{ cobrado: false }],
      }),
    ).toBe('pendiente');
  });

  it('parcialmente_pagado: facturas + ítems pendientes', () => {
    expect(
      estadoCobroPedido({
        estadoPedido: 'abierto',
        facturas: [{ total: 10_000 }],
        detalles: [{ cobrado: true }, { cobrado: false }],
      }),
    ).toBe('parcialmente_pagado');
  });

  it('pagado: estado facturado', () => {
    expect(
      estadoCobroPedido({
        estadoPedido: 'facturado',
        facturas: [{ total: 20_000 }],
        detalles: [{ cobrado: true }],
      }),
    ).toBe('pagado');
  });
});

describe('matriz cobro — tandas con métodos distintos', () => {
  it('tanda1 efectivo + tanda2 transferencia + tanda3 mixto: resumen auditable', () => {
    const facturas = [
      { id_factura: 1, metodo_pago: 'efectivo', total: 16_000 },
      { id_factura: 2, metodo_pago: 'transferencia', total: 16_000 },
      {
        id_factura: 3,
        metodo_pago: 'efectivo',
        cobro_mixto_grupo: 99,
        total: 10_000,
      },
      {
        id_factura: 4,
        metodo_pago: 'transferencia',
        cobro_mixto_grupo: 99,
        total: 6_000,
      },
    ];
    const resumen = resumenCobrosPedidoTotal(facturas);
    expect(totalFacturadoPedido(facturas)).toBe(48_000);
    expect(resumen.cobros_resumen).toEqual([
      { metodo_pago: 'efectivo', total: 26_000 },
      { metodo_pago: 'transferencia', total: 22_000 },
    ]);
    const inv = validarInvariantesCobroPedido({
      facturas,
      detalles: [
        { id_detalle: 1, cobrado: true, cantidad: 1, precio_unitario: 16_000 },
        { id_detalle: 2, cobrado: true, cantidad: 1, precio_unitario: 16_000 },
        { id_detalle: 3, cobrado: true, cantidad: 1, precio_unitario: 10_000 },
        { id_detalle: 4, cobrado: true, cantidad: 1, precio_unitario: 6_000 },
      ],
      totalFacturadoMaximo: 48_000,
    });
    expect(inv.ok).toBe(true);
  });

  it('quedaPendienteTrasCobro refleja tandas parciales', () => {
    const detalles = [
      { id_detalle: 1, id_detalle_padre: null, cobrado: false, cantidad: 2 },
      { id_detalle: 2, id_detalle_padre: null, cobrado: false, cantidad: 1 },
    ];
    expect(
      quedaPendienteTrasCobro(detalles, [{ id_detalle: 1, cantidad: 1 }]),
    ).toBe(true);
    expect(
      quedaPendienteTrasCobro(detalles, [
        { id_detalle: 1, cantidad: 2 },
        { id_detalle: 2, cantidad: 1 },
      ]),
    ).toBe(false);
  });
});

describe('matriz cobro — mixto montos exactos (causa raíz permutación)', () => {
  const solicitudes = [
    { id_detalle: 1, cantidad: 1 },
    { id_detalle: 2, cantidad: 1 },
  ];
  const precios = { 1: 24_000, 2: 24_000 };
  const total = 48_000;

  it('reparto desde transferencia define patas exactas', () => {
    const r = repartoMixtoDesdeTransferencia(total, 20_000);
    expect(r).toEqual({
      transferenciaFactura: 20_000,
      efectivoFactura: 28_000,
      excesoDevolverEfectivo: 0,
    });
    expect(r.efectivoFactura + r.transferenciaFactura).toBe(total);
  });

  it('vuelto por transferencia conserva todo el efectivo en la venta', () => {
    const r = repartoMixtoConDevolucion(total, 20_000, 33_000, 'transferencia');
    expect(r).toEqual({
      transferenciaFactura: 15_000,
      efectivoFactura: 33_000,
      excesoDevolverEfectivo: 5_000,
    });
    expect(r.efectivoFactura + r.transferenciaFactura).toBe(total);
  });

  it('split por cantidad NO garantiza montos (bug histórico)', () => {
    const reparto = repartoMixtoDesdeTransferencia(total, 20_000);
    const { efectivo, transferencia } = dividirSolicitudesCobroMixto(
      solicitudes,
      precios,
      reparto.efectivoFactura,
      total,
      {
        lineasPadre: [
          { id_detalle: 1, precio_unitario: 24_000, cantidad_pendiente: 1 },
          { id_detalle: 2, precio_unitario: 24_000, cantidad_pendiente: 1 },
        ],
      },
    );
    const legEf = subtotalDesdeSolicitudes(
      [
        { id_detalle: 1, precio_unitario: 24_000, cantidad: 1 },
        { id_detalle: 2, precio_unitario: 24_000, cantidad: 1 },
      ],
      efectivo,
    );
    const legTr = subtotalDesdeSolicitudes(
      [
        { id_detalle: 1, precio_unitario: 24_000, cantidad: 1 },
        { id_detalle: 2, precio_unitario: 24_000, cantidad: 1 },
      ],
      transferencia,
    );
    // Históricamente se registraba 24k/24k en lugar de 28k/20k.
    expect(legEf + legTr).toBe(total);
    expect(
      mixtoMontosCoincidenConReparto(
        legEf,
        legTr,
        reparto.efectivoFactura,
        reparto.transferenciaFactura,
      ),
    ).toBe(false);
    expect(
      necesitaSplitPrecioMixto({
        efectivoFactura: reparto.efectivoFactura,
        transferenciaFactura: reparto.transferenciaFactura,
        solicitudesEfectivoLen: efectivo.length,
        solicitudesTransferenciaLen: transferencia.length,
        totalLegEfectivo: legEf,
        totalLegTransferencia: legTr,
      }),
    ).toBe(true);
  });

  it('un solo plato mixto siempre necesita split por precio', () => {
    expect(
      necesitaSplitPrecioMixto({
        efectivoFactura: 10_000,
        transferenciaFactura: 14_000,
        solicitudesEfectivoLen: 0,
        solicitudesTransferenciaLen: 1,
        totalLegEfectivo: 0,
        totalLegTransferencia: 24_000,
      }),
    ).toBe(true);
  });

  it('importesProporcionalesMixto: patas suman el total exacto', () => {
    const full = {
      subtotal: 48_000,
      descuento_sopas: 0,
      descuento_muleros: 0,
      descuento_promociones: 0,
      total: 48_000,
    };
    const { primera, segunda } = importesProporcionalesMixto(full, 28_000);
    expect(primera.total).toBe(28_000);
    expect(segunda.total).toBe(20_000);
    expect(primera.total + segunda.total).toBe(48_000);
    expect(primera.subtotal + segunda.subtotal).toBe(48_000);
  });

  it('importesProporcionalesMixto con descuentos conserva totales', () => {
    const full = {
      subtotal: 50_000,
      descuento_sopas: 2_000,
      descuento_muleros: 0,
      descuento_promociones: 0,
      total: 48_000,
    };
    const { primera, segunda } = importesProporcionalesMixto(full, 28_000);
    expect(primera.total + segunda.total).toBe(48_000);
    expect(
      primera.subtotal -
        primera.descuento_sopas -
        primera.descuento_muleros -
        primera.descuento_promociones,
    ).toBe(primera.total);
    expect(
      segunda.subtotal -
        segunda.descuento_sopas -
        segunda.descuento_muleros -
        segunda.descuento_promociones,
    ).toBe(segunda.total);
    expect(primera.subtotal + segunda.subtotal).toBe(50_000);
    expect(primera.descuento_sopas + segunda.descuento_sopas).toBe(2_000);
  });
});

describe('matriz cobro — split por personas con métodos distintos', () => {
  it('persona A efectivo + persona B transferencia: sin sobre-pago', () => {
    const total = 30_000;
    const [a, b] = repartirMontoEnCop(total, 2);
    const facturas = [
      { metodo_pago: 'efectivo', total: a },
      { metodo_pago: 'transferencia', total: b },
    ];
    expect(totalFacturadoPedido(facturas)).toBe(total);
    expect(
      validarInvariantesCobroPedido({
        facturas,
        detalles: [
          { id_detalle: 1, cobrado: true, cantidad: 1, precio_unitario: a },
          { id_detalle: 2, cobrado: true, cantidad: 1, precio_unitario: b },
        ],
        totalFacturadoMaximo: total,
      }).ok,
    ).toBe(true);
  });

  it('persona con mixto: grupo completo y montos > 0', () => {
    const inv = validarInvariantesCobroPedido({
      facturas: [
        {
          metodo_pago: 'efectivo',
          total: 8_000,
          cobro_mixto_grupo: 7,
        },
        {
          metodo_pago: 'transferencia',
          total: 7_000,
          cobro_mixto_grupo: 7,
        },
      ],
      detalles: [
        { id_detalle: 1, cobrado: true, cantidad: 1, precio_unitario: 15_000 },
      ],
      totalFacturadoMaximo: 15_000,
    });
    expect(inv.ok).toBe(true);
  });
});

describe('matriz cobro — bordes', () => {
  it('sobre-pago detectado', () => {
    const inv = validarInvariantesCobroPedido({
      facturas: [{ metodo_pago: 'efectivo', total: 50_000 }],
      detalles: [
        { id_detalle: 1, cobrado: true, cantidad: 1, precio_unitario: 40_000 },
      ],
      totalFacturadoMaximo: 40_000,
    });
    expect(inv.ok).toBe(false);
    expect(inv.errores.some((e) => e.includes('Sobre-pago'))).toBe(true);
  });

  it('doble cobro de ítem: pedidoCobroCompleto solo si todos marcados una vez', () => {
    expect(
      pedidoCobroCompleto([
        { cobrado: true },
        { cobrado: true },
      ]),
    ).toBe(true);
    expect(pedidoCobroCompleto([{ cobrado: false }])).toBe(false);
  });

  it('grupo mixto incompleto se reporta', () => {
    const inv = validarInvariantesCobroPedido({
      facturas: [
        { metodo_pago: 'efectivo', total: 10_000, cobro_mixto_grupo: 1 },
      ],
      detalles: [
        { id_detalle: 1, cobrado: true, cantidad: 1, precio_unitario: 10_000 },
      ],
    });
    expect(inv.ok).toBe(false);
  });
});
