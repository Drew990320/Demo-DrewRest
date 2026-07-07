import {
  expandirDetallesParaCobro,
  expandirSolicitudesConEmpaques,
  idsDetallesPendientes,
  pedidoCobroCompleto,
  quedaPendienteTrasCobro,
  resolverSolicitudesCobro,
  subtotalDesdeSolicitudes,
} from './cobro-parcial';

const detalles = [
  { id_detalle: 1, id_detalle_padre: null, cobrado: false, cantidad: 2 },
  { id_detalle: 2, id_detalle_padre: 1, cobrado: false, cantidad: 2 },
  { id_detalle: 3, id_detalle_padre: null, cobrado: true, cantidad: 1 },
];

describe('cobro-parcial', () => {
  describe('expandirDetallesParaCobro', () => {
    it('incluye empaques hijos pendientes del ítem padre', () => {
      expect(expandirDetallesParaCobro(detalles, [1])).toEqual([1, 2]);
    });

    it('omite ítems ya cobrados', () => {
      expect(expandirDetallesParaCobro(detalles, [3])).toEqual([]);
    });
  });

  describe('idsDetallesPendientes', () => {
    it('lista solo pendientes', () => {
      expect(idsDetallesPendientes(detalles)).toEqual([1, 2]);
    });
  });

  describe('pedidoCobroCompleto', () => {
    it('requiere al menos un detalle y todos cobrados', () => {
      expect(pedidoCobroCompleto([{ cobrado: true }])).toBe(true);
      expect(pedidoCobroCompleto([{ cobrado: false }])).toBe(false);
      expect(pedidoCobroCompleto([])).toBe(false);
    });
  });

  describe('resolverSolicitudesCobro', () => {
    it('usa detalles_cobro cuando vienen explícitos', () => {
      const r = resolverSolicitudesCobro(
        { detalles_cobro: [{ id_detalle: 1, cantidad: 1.7 }] },
        detalles,
        [1, 2],
      );
      expect(r).toEqual([{ id_detalle: 1, cantidad: 1 }]);
    });

    it('expande ids y usa cantidad del detalle', () => {
      const r = resolverSolicitudesCobro({ id_detalles: [1] }, detalles, []);
      expect(r).toEqual([
        { id_detalle: 1, cantidad: 2 },
        { id_detalle: 2, cantidad: 2 },
      ]);
    });
  });

  describe('expandirSolicitudesConEmpaques', () => {
    it('agrega empaque hijo con la misma cantidad', () => {
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

    it('rechaza cantidad inválida', () => {
      expect(() =>
        expandirSolicitudesConEmpaques(detalles, [
          { id_detalle: 1, cantidad: 5 },
        ]),
      ).toThrow('Cantidad inválida');
    });
  });

  describe('subtotalDesdeSolicitudes', () => {
    it('calcula subtotal por cantidad cobrada', () => {
      const sub = subtotalDesdeSolicitudes(
        [
          { id_detalle: 1, precio_unitario: 15000, cantidad: 2 },
          { id_detalle: 2, precio_unitario: 1000, cantidad: 2 },
        ],
        [
          { id_detalle: 1, cantidad: 1 },
          { id_detalle: 2, cantidad: 2 },
        ],
      );
      expect(sub).toBe(17000);
    });
  });

  describe('quedaPendienteTrasCobro', () => {
    it('detecta unidades restantes sin cobrar', () => {
      expect(
        quedaPendienteTrasCobro(detalles, [{ id_detalle: 1, cantidad: 1 }]),
      ).toBe(true);
      expect(
        quedaPendienteTrasCobro(
          [
            { id_detalle: 1, id_detalle_padre: null, cobrado: false, cantidad: 2 },
          ],
          [{ id_detalle: 1, cantidad: 2 }],
        ),
      ).toBe(false);
    });
  });
});
