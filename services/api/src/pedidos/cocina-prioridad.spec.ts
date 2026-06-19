import {
  contarPorcionesPendientesCocina,
  inferirTipoProteina,
  ordenarPedidosCocina,
  prioridadAutomaticaDesdeDetalles,
  prioridadCocinaEfectiva,
  tipoProteinaResuelto,
} from './cocina-prioridad';

describe('cocina-prioridad', () => {
  describe('inferirTipoProteina', () => {
    it('clasifica bebidas y empaques como ninguno', () => {
      expect(inferirTipoProteina('Bebidas', 'Coca Cola')).toBe('ninguno');
      expect(inferirTipoProteina('Empaque', 'Bolsa')).toBe('ninguno');
    });

    it('detecta cerdo por categoría o nombre', () => {
      expect(inferirTipoProteina('Platos fuertes', 'Bondiola')).toBe('cerdo');
      expect(inferirTipoProteina('Cerdo', 'Costilla')).toBe('cerdo');
    });

    it('detecta pollo', () => {
      expect(inferirTipoProteina('Pollo', 'Pechuga')).toBe('pollo');
      expect(inferirTipoProteina('Menú infantil', 'Nuggets')).toBe('pollo');
    });
  });

  describe('tipoProteinaResuelto', () => {
    it('usa el tipo de BD si no es ninguno', () => {
      expect(tipoProteinaResuelto('res', 'Pollo', 'Algo')).toBe('res');
    });

    it('infiere cuando BD es ninguno', () => {
      expect(tipoProteinaResuelto('ninguno', 'Pollo', 'Pechuga')).toBe('pollo');
    });
  });

  describe('prioridadAutomaticaDesdeDetalles', () => {
    const det = (
      categoria: string,
      nombre: string,
      marcar = true,
    ) => ({
      categoria_nombre: categoria,
      nombre_producto: nombre,
      marcar_cocina: marcar,
    });

    it('alta si solo hay mazorcas, entradas o adicionales', () => {
      expect(
        prioridadAutomaticaDesdeDetalles([
          det('Entradas y adicionales', 'Chorizo'),
          det('Acompañamientos', 'Mazorca'),
        ]),
      ).toBe('alta');
    });

    it('alta con plato fuerte pollo o res sin cerdo', () => {
      expect(
        prioridadAutomaticaDesdeDetalles([
          det('Platos fuertes - Pollo', 'Pechuga a la plancha'),
          det('Entradas y adicionales', 'Chorizo'),
        ]),
      ).toBe('alta');
      expect(
        prioridadAutomaticaDesdeDetalles([
          det('Platos fuertes - Res / Mixto', 'Chata'),
        ]),
      ).toBe('alta');
    });

    it('baja con plato fuerte cerdo', () => {
      expect(
        prioridadAutomaticaDesdeDetalles([
          det('Platos fuertes - Cerdo', 'Bondiola'),
        ]),
      ).toBe('baja');
    });

    it('baja con parrillada aunque sea categoría res/mixto', () => {
      expect(
        prioridadAutomaticaDesdeDetalles([
          det(
            'Platos fuertes - Res / Mixto',
            'Parrillada mixta (cortes de lomo, costilla y chorizo)',
          ),
        ]),
      ).toBe('baja');
    });

    it('baja con picada o para compartir', () => {
      expect(
        prioridadAutomaticaDesdeDetalles([
          det('Para compartir', 'Picada La Reserva'),
        ]),
      ).toBe('baja');
    });

    it('ignora líneas que no van a cocina', () => {
      expect(
        prioridadAutomaticaDesdeDetalles([
          det('Platos fuertes - Cerdo', 'Bondiola', false),
        ]),
      ).toBe('alta');
    });
  });

  describe('prioridadCocinaEfectiva', () => {
    it('respeta override manual', () => {
      expect(prioridadCocinaEfectiva('alta', 'baja')).toEqual({
        nivel: 'baja',
        origen: 'manual',
      });
    });

    it('usa automática sin override', () => {
      expect(prioridadCocinaEfectiva('baja', null)).toEqual({
        nivel: 'baja',
        origen: 'auto',
      });
    });
  });

  describe('ordenarPedidosCocina', () => {
    it('ordena alta antes que baja y por fecha dentro del mismo nivel', () => {
      const pedidos = [
        { prioridad_cocina: 'baja' as const, creado_en: new Date('2026-01-02') },
        { prioridad_cocina: 'alta' as const, creado_en: new Date('2026-01-03') },
        { prioridad_cocina: 'alta' as const, creado_en: new Date('2026-01-01') },
      ];
      const sorted = ordenarPedidosCocina(pedidos);
      expect(sorted.map((p) => p.creado_en)).toEqual([
        new Date('2026-01-01'),
        new Date('2026-01-03'),
        new Date('2026-01-02'),
      ]);
    });
  });

  describe('contarPorcionesPendientesCocina', () => {
    it('suma cantidades enviadas a cocina y no listas', () => {
      const n = contarPorcionesPendientesCocina([
        {
          detalles: [
            {
              marcar_cocina: true,
              enviado_cocina: true,
              listo_cocina: false,
              cantidad: 2,
            },
            {
              marcar_cocina: true,
              enviado_cocina: false,
              listo_cocina: false,
              cantidad: 3,
            },
            {
              marcar_cocina: true,
              enviado_cocina: true,
              listo_cocina: true,
              cantidad: 1,
            },
          ],
        },
      ]);
      expect(n).toBe(2);
    });
  });
});
