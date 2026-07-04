import {
  agruparCobrosVista,
  agruparFacturasMixto,
  cobrosResumenMixto,
  facturasIdsImpresionUnica,
  resumenCobrosPedidoTotal,
} from '@la-reserva/shared-domain/factura-mixto';

describe('factura-mixto agrupación', () => {
  const mixto = [
    {
      id_factura: 10,
      metodo_pago: 'efectivo',
      cobro_mixto_grupo: 99,
      total: 30000,
    },
    {
      id_factura: 11,
      metodo_pago: 'transferencia',
      cobro_mixto_grupo: 99,
      total: 20000,
    },
  ];

  it('agrupa cobro mixto por cobro_mixto_grupo', () => {
    const vistas = agruparCobrosVista(mixto);
    expect(vistas).toHaveLength(1);
    expect(vistas[0].tipo).toBe('mixto');
    if (vistas[0].tipo === 'mixto') {
      expect(cobrosResumenMixto(vistas[0].cobros)).toEqual([
        { metodo_pago: 'efectivo', total: 30000 },
        { metodo_pago: 'transferencia', total: 20000 },
      ]);
    }
  });

  it('no mezcla cobros de la misma persona si no son mixto', () => {
    const facturas = [
      ...mixto,
      {
        id_factura: 12,
        metodo_pago: 'efectivo',
        persona_plan_indice: 1,
        total: 15000,
      },
    ];
    const vistas = agruparCobrosVista(facturas);
    expect(vistas).toHaveLength(2);
    expect(vistas.some((v) => v.tipo === 'mixto')).toBe(true);
    expect(vistas.some((v) => v.tipo === 'simple')).toBe(true);
  });

  it('deduplica ids de impresión de mixto', () => {
    expect(facturasIdsImpresionUnica(mixto)).toEqual([10]);
  });

  it('resume pedido total con un solo mixto', () => {
    const resumen = resumenCobrosPedidoTotal(mixto);
    expect(resumen.metodo_pago).toBe('mixto');
    expect(resumen.cobros_resumen).toEqual([
      { metodo_pago: 'efectivo', total: 30000 },
      { metodo_pago: 'transferencia', total: 20000 },
    ]);
  });

  it('empareja mixtos sin cobro_mixto_grupo al reimprimir', () => {
    const sinGrupo = [
      {
        id_factura: 211,
        metodo_pago: 'transferencia',
        total: 600,
        emitida_en: '2026-07-02T12:42:56.000Z',
      },
      {
        id_factura: 210,
        metodo_pago: 'efectivo',
        total: 400,
        emitida_en: '2026-07-02T12:42:56.000Z',
      },
    ];
    const grupo = agruparFacturasMixto(sinGrupo, sinGrupo[0]);
    expect(grupo).toHaveLength(2);
    expect(cobrosResumenMixto(grupo)).toEqual([
      { metodo_pago: 'efectivo', total: 400 },
      { metodo_pago: 'transferencia', total: 600 },
    ]);
  });
});
