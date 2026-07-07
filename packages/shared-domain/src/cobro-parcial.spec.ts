import {
  expandirDetallesParaCobro,
  expandirSolicitudesConEmpaques,
  idsDetallesPendientes,
  lineasDescuentoDesdeSolicitudes,
  ordenarSolicitudesCobro,
  pedidoCobroCompleto,
  quedaPendienteTrasCobro,
  resolverSolicitudesCobro,
  solicitudesDesdeCantidades,
  subtotalDesdeSolicitudes,
  unidadesEnSolicitudes,
} from './cobro-parcial';

const detalles = [
  { id_detalle: 1, id_detalle_padre: null, cobrado: false, cantidad: 2 },
  { id_detalle: 2, id_detalle_padre: 1, cobrado: false, cantidad: 2 },
  { id_detalle: 3, id_detalle_padre: null, cobrado: true, cantidad: 1 },
  { id_detalle: 4, id_detalle_padre: null, cobrado: false, cantidad: 3 },
];

describe('cobro-parcial — expandir y pendientes', () => {
  it('expandirDetallesParaCobro incluye empaques hijos', () => {
    expect(expandirDetallesParaCobro(detalles, [1])).toEqual([1, 2]);
  });

  it('omite ítems ya cobrados', () => {
    expect(expandirDetallesParaCobro(detalles, [3])).toEqual([]);
  });

  it('idsDetallesPendientes lista solo no cobrados', () => {
    expect(idsDetallesPendientes(detalles)).toEqual([1, 2, 4]);
  });
});

describe('cobro-parcial — resolver solicitudes (factura dividida por ítems)', () => {
  it('detalles_cobro: cantidad parcial de un ítem', () => {
    const r = resolverSolicitudesCobro(
      { detalles_cobro: [{ id_detalle: 4, cantidad: 2 }] },
      detalles,
      [],
    );
    expect(r).toEqual([{ id_detalle: 4, cantidad: 2 }]);
  });

  it('detalles_cobro: trunca decimales a enteros', () => {
    const r = resolverSolicitudesCobro(
      { detalles_cobro: [{ id_detalle: 1, cantidad: 1.7 }] },
      detalles,
      [1, 2],
    );
    expect(r).toEqual([{ id_detalle: 1, cantidad: 1 }]);
  });

  it('id_detalles: expande padre con empaque y cantidad completa', () => {
    const r = resolverSolicitudesCobro({ id_detalles: [1] }, detalles, []);
    expect(r).toEqual([
      { id_detalle: 1, cantidad: 2 },
      { id_detalle: 2, cantidad: 2 },
    ]);
  });

  it('sin selección usa todos los pendientes', () => {
    const pendientes = idsDetallesPendientes(detalles);
    const r = resolverSolicitudesCobro({}, detalles, pendientes);
    expect(r.map((s) => s.id_detalle).sort()).toEqual([1, 2, 4]);
  });

  it('solo cobra un plato de varios (tanda parcial)', () => {
    const r = resolverSolicitudesCobro({ id_detalles: [4] }, detalles, []);
    expect(r).toEqual([{ id_detalle: 4, cantidad: 3 }]);
    expect(quedaPendienteTrasCobro(detalles, [{ id_detalle: 4, cantidad: 1 }])).toBe(
      true,
    );
    expect(quedaPendienteTrasCobro(detalles, [{ id_detalle: 4, cantidad: 3 }])).toBe(
      true,
    );
    expect(
      quedaPendienteTrasCobro(
        [
          { id_detalle: 4, id_detalle_padre: null, cobrado: false, cantidad: 3 },
        ],
        [{ id_detalle: 4, cantidad: 3 }],
      ),
    ).toBe(false);
  });
});

describe('cobro-parcial — empaques y subtotales', () => {
  it('expandirSolicitudesConEmpaques replica cantidad al hijo', () => {
    const r = expandirSolicitudesConEmpaques(detalles, [
      { id_detalle: 1, cantidad: 1 },
    ]);
    expect(r).toEqual(
      expect.arrayContaining([
        { id_detalle: 1, cantidad: 1 },
        { id_detalle: 2, cantidad: 1 },
      ]),
    );
  });

  it('cobra empaques disponibles aunque haya menos que los platos', () => {
    const r = expandirSolicitudesConEmpaques(
      [
        { id_detalle: 1, id_detalle_padre: null, cobrado: false, cantidad: 4 },
        { id_detalle: 2, id_detalle_padre: 1, cobrado: false, cantidad: 1 },
      ],
      [{ id_detalle: 1, cantidad: 4 }],
    );
    expect(r).toEqual(
      expect.arrayContaining([
        { id_detalle: 1, cantidad: 4 },
        { id_detalle: 2, cantidad: 1 },
      ]),
    );
  });

  it('rechaza cantidad mayor al pendiente', () => {
    expect(() =>
      expandirSolicitudesConEmpaques(detalles, [{ id_detalle: 1, cantidad: 5 }]),
    ).toThrow('Cantidad inválida');
  });

  it('subtotalDesdeSolicitudes con cantidades parciales', () => {
    const sub = subtotalDesdeSolicitudes(
      [
        { id_detalle: 1, precio_unitario: 15_000, cantidad: 2 },
        { id_detalle: 2, precio_unitario: 1_000, cantidad: 2 },
        { id_detalle: 4, precio_unitario: 8_000, cantidad: 3 },
      ],
      [
        { id_detalle: 1, cantidad: 1 },
        { id_detalle: 2, cantidad: 1 },
        { id_detalle: 4, cantidad: 2 },
      ],
    );
    expect(sub).toBe(15_000 + 1_000 + 16_000);
  });

  it('ordenarSolicitudesCobro pone padres antes que hijos', () => {
    const orden = ordenarSolicitudesCobro(detalles, [
      { id_detalle: 2, cantidad: 1 },
      { id_detalle: 1, cantidad: 1 },
    ]);
    expect(orden[0].id_detalle).toBe(1);
    expect(orden[1].id_detalle).toBe(2);
  });
});

describe('cobro-parcial — estado del pedido tras tandas', () => {
  it('pedidoCobroCompleto requiere todos cobrados', () => {
    expect(pedidoCobroCompleto([{ cobrado: true }, { cobrado: true }])).toBe(true);
    expect(pedidoCobroCompleto([{ cobrado: true }, { cobrado: false }])).toBe(false);
    expect(pedidoCobroCompleto([])).toBe(false);
  });

  it('solicitudesDesdeCantidades ignora ceros y negativos', () => {
    expect(solicitudesDesdeCantidades({ 1: 2, 2: 0, 3: -1 })).toEqual([
      { id_detalle: 1, cantidad: 2 },
    ]);
  });

  it('unidadesEnSolicitudes suma cantidades', () => {
    expect(
      unidadesEnSolicitudes([
        { id_detalle: 1, cantidad: 2 },
        { id_detalle: 4, cantidad: 1 },
      ]),
    ).toBe(3);
  });

  it('lineasDescuentoDesdeSolicitudes solo incluye ítems cobrados', () => {
    const lineas = lineasDescuentoDesdeSolicitudes(
      [
        {
          id_detalle: 1,
          cantidad: 2,
          precio_unitario: 10_000,
          nombre_producto: 'Picada',
          categoria_nombre: 'Platos',
        },
        {
          id_detalle: 4,
          cantidad: 3,
          precio_unitario: 5_000,
          nombre_producto: 'Bebida',
          categoria_nombre: 'Bebidas',
        },
      ],
      [{ id_detalle: 4, cantidad: 1 }],
    );
    expect(lineas).toHaveLength(1);
    expect(lineas[0]).toMatchObject({
      id_detalle: 4,
      cantidad: 1,
      subtotal_linea: 5_000,
    });
  });
});
