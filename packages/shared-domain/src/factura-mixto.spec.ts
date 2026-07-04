import {
  COBRO_MIXTO_GRUPO_MAX,
  agruparCobrosVista,
  cobroMixtoGrupoValido,
  cobrosResumenMixto,
  consolidarCobrosResumenPorMetodo,
  dividirSolicitudesCobroMixto,
  facturasDeTandaCobro,
  facturasIdsImpresionUnica,
  nuevoCobroMixtoGrupo,
  resumenCobrosPedidoTotal,
  restarSolicitudesCobro,
} from './factura-mixto';

describe('nuevoCobroMixtoGrupo', () => {
  it('cabe en INT4 de PostgreSQL', () => {
    const id = nuevoCobroMixtoGrupo(1_782_995_878_637);
    expect(id).toBeGreaterThan(0);
    expect(id).toBeLessThanOrEqual(COBRO_MIXTO_GRUPO_MAX);
    expect(cobroMixtoGrupoValido(id)).toBe(true);
  });

  it('rechaza Date.now() en milisegundos', () => {
    expect(cobroMixtoGrupoValido(1_782_995_878_637)).toBe(false);
  });
});

describe('facturasDeTandaCobro', () => {
  it('devuelve solo la factura simple', () => {
    const facturas = [
      { id_factura: 1, metodo_pago: 'efectivo', total: 10_000 },
      { id_factura: 2, metodo_pago: 'transferencia', total: 20_000 },
    ];
    expect(facturasDeTandaCobro(facturas, 1).map((f) => f.id_factura)).toEqual([
      1,
    ]);
  });

  it('incluye ambas patas del mixto al pedir cualquiera', () => {
    const facturas = [
      {
        id_factura: 1,
        metodo_pago: 'efectivo',
        cobro_mixto_grupo: 42,
        total: 10_000,
      },
      {
        id_factura: 2,
        metodo_pago: 'transferencia',
        cobro_mixto_grupo: 42,
        total: 5_000,
      },
      { id_factura: 3, metodo_pago: 'efectivo', total: 8_000 },
    ];
    expect(
      facturasDeTandaCobro(facturas, 2)
        .map((f) => f.id_factura)
        .sort(),
    ).toEqual([1, 2]);
    expect(facturasDeTandaCobro(facturas, 3).map((f) => f.id_factura)).toEqual([
      3,
    ]);
  });

  it('devuelve vacío si la factura no existe', () => {
    expect(
      facturasDeTandaCobro(
        [{ id_factura: 1, metodo_pago: 'efectivo', total: 1 }],
        99,
      ),
    ).toEqual([]);
  });
});

describe('agruparCobrosVista', () => {
  it('une efectivo y transferencia del mismo grupo', () => {
    const vistas = agruparCobrosVista([
      {
        id_factura: 1,
        metodo_pago: 'efectivo',
        cobro_mixto_grupo: 42,
        total: 10000,
      },
      {
        id_factura: 2,
        metodo_pago: 'transferencia',
        cobro_mixto_grupo: 42,
        total: 5000,
      },
    ]);
    expect(vistas).toHaveLength(1);
    expect(vistas[0].tipo).toBe('mixto');
    if (vistas[0].tipo === 'mixto') {
      expect(cobrosResumenMixto(vistas[0].cobros)).toEqual([
        { metodo_pago: 'efectivo', total: 10000 },
        { metodo_pago: 'transferencia', total: 5000 },
      ]);
      expect(facturasIdsImpresionUnica(vistas[0].cobros)).toEqual([1]);
    }
  });
});

describe('dividirSolicitudesCobroMixto', () => {
  const solicitudes = [
    { id_detalle: 1, cantidad: 1 },
    { id_detalle: 2, cantidad: 1 },
  ];
  const precios = { 1: 24_000, 2: 24_000 };

  it('reparte ítems en ambos métodos cuando hay efectivo y transferencia', () => {
    const { efectivo, transferencia } = dividirSolicitudesCobroMixto(
      solicitudes,
      precios,
      28_000,
      48_000,
      {
        lineasPadre: [
          { id_detalle: 1, precio_unitario: 24_000, cantidad_pendiente: 1 },
          { id_detalle: 2, precio_unitario: 24_000, cantidad_pendiente: 1 },
        ],
      },
    );
    expect(efectivo.length).toBeGreaterThan(0);
    expect(transferencia.length).toBeGreaterThan(0);
    const brutoEfectivo = efectivo.reduce(
      (s, x) => s + (precios[x.id_detalle] ?? 0) * x.cantidad,
      0,
    );
    const brutoTransferencia = transferencia.reduce(
      (s, x) => s + (precios[x.id_detalle] ?? 0) * x.cantidad,
      0,
    );
    expect(brutoEfectivo + brutoTransferencia).toBe(48_000);
    expect(brutoEfectivo).toBeLessThanOrEqual(28_000);
  });

  it('restarSolicitudesCobro deja el saldo pendiente', () => {
    const parcial = [{ id_detalle: 1, cantidad: 1 }];
    expect(restarSolicitudesCobro(solicitudes, parcial)).toEqual([
      { id_detalle: 2, cantidad: 1 },
    ]);
  });
});

describe('resumenCobrosPedidoTotal', () => {
  it('consolida varios cobros parciales en una línea por método', () => {
    const resumen = resumenCobrosPedidoTotal([
      {
        id_factura: 1,
        metodo_pago: 'efectivo',
        total: 16000,
      },
      {
        id_factura: 2,
        metodo_pago: 'transferencia',
        total: 16000,
      },
      {
        id_factura: 3,
        metodo_pago: 'efectivo',
        cobro_mixto_grupo: 99,
        total: 10000,
      },
      {
        id_factura: 4,
        metodo_pago: 'transferencia',
        cobro_mixto_grupo: 99,
        total: 6000,
      },
    ]);

    expect(resumen.cobros_resumen).toEqual([
      { metodo_pago: 'efectivo', total: 26000 },
      { metodo_pago: 'transferencia', total: 22000 },
    ]);
  });
});

describe('consolidarCobrosResumenPorMetodo', () => {
  it('suma montos del mismo método', () => {
    expect(
      consolidarCobrosResumenPorMetodo([
        { metodo_pago: 'efectivo', total: 16000 },
        { metodo_pago: 'transferencia', total: 16000 },
        { metodo_pago: 'efectivo', total: 10000 },
        { metodo_pago: 'transferencia', total: 6000 },
      ]),
    ).toEqual([
      { metodo_pago: 'efectivo', total: 26000 },
      { metodo_pago: 'transferencia', total: 22000 },
    ]);
  });
});
