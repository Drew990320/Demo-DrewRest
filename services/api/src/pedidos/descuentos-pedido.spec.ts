import {
  calcularDescuentosPedido,
  esLineaSopa,
  UMBRAL_SUBTOTAL_OTROS_COP,
} from './descuentos-pedido';

const configBase = {
  sopas_activo: true,
  sopas_monto_por_unidad: 5000,
  muleros_activo: true,
  muleros_monto_por_plato_principal: 3000,
  umbral_subtotal_otros: UMBRAL_SUBTOTAL_OTROS_COP,
};

describe('descuentos-pedido', () => {
  describe('esLineaSopa', () => {
    it('detecta sopa por categoría o nombre', () => {
      expect(
        esLineaSopa({
          cantidad: 1,
          subtotal_linea: 10000,
          nombre_producto: 'Sancocho',
          categoria_nombre: 'Sopas',
        }),
      ).toBe(true);
      expect(
        esLineaSopa({
          cantidad: 1,
          subtotal_linea: 10000,
          nombre_producto: 'Sopa del día',
          categoria_nombre: 'Entradas',
          participa_descuento_sopas: true,
        }),
      ).toBe(true);
      expect(
        esLineaSopa({
          cantidad: 1,
          subtotal_linea: 10000,
          nombre_producto: 'Arroz',
          categoria_nombre: 'Platos fuertes',
          participa_descuento_sopas: false,
        }),
      ).toBe(false);
    });
  });

  describe('calcularDescuentosPedido', () => {
    it('no aplica promoción legacy de sopas con una sola sopa', () => {
      const r = calcularDescuentosPedido(
        [
          {
            cantidad: 1,
            subtotal_linea: 12000,
            nombre_producto: 'Sopa de pollo',
            categoria_nombre: 'Sopas',
          },
          {
            cantidad: 1,
            subtotal_linea: UMBRAL_SUBTOTAL_OTROS_COP + 1,
            nombre_producto: 'Churrasco',
            categoria_nombre: 'Platos fuertes',
          },
        ],
        configBase,
        false,
      );
      expect(r.descuento_promociones).toBe(0);
    });

    it('aplica promoción legacy de sopas con 2+ sopas y subtotal alto en otros ítems', () => {
      const r = calcularDescuentosPedido(
        [
          {
            cantidad: 2,
            subtotal_linea: 20000,
            nombre_producto: 'Sopa A',
            categoria_nombre: 'Sopas',
          },
          {
            cantidad: 1,
            subtotal_linea: UMBRAL_SUBTOTAL_OTROS_COP + 1000,
            nombre_producto: 'Churrasco',
            categoria_nombre: 'Platos fuertes',
          },
        ],
        configBase,
        false,
      );
      expect(r.descuento_promociones).toBe(2 * 5000);
    });

    it('aplica promoción legacy de sopas con min_unidades configurable', () => {
      const r = calcularDescuentosPedido(
        [
          {
            cantidad: 3,
            subtotal_linea: 30000,
            nombre_producto: 'Sopa A',
            categoria_nombre: 'Sopas',
          },
          {
            cantidad: 1,
            subtotal_linea: UMBRAL_SUBTOTAL_OTROS_COP + 1000,
            nombre_producto: 'Churrasco',
            categoria_nombre: 'Platos fuertes',
          },
        ],
        { ...configBase, sopas_min_unidades: 3 },
        false,
      );
      expect(r.descuento_promociones).toBe(3 * 5000);
    });

    it('no aplica promoción por plato principal si no alcanza min_unidades', () => {
      const r = calcularDescuentosPedido(
        [
          {
            cantidad: 1,
            subtotal_linea: 50000,
            nombre_producto: 'Churrasco',
            categoria_nombre: 'Platos fuertes',
            es_plato_principal: true,
          },
        ],
        { ...configBase, muleros_min_platos_principales: 2 },
        { cliente_mulero: true },
      );
      expect(r.descuento_promociones).toBe(0);
    });

    it('aplica promoción por platos principales con etiqueta de cliente especial', () => {
      const r = calcularDescuentosPedido(
        [
          {
            cantidad: 2,
            subtotal_linea: 50000,
            nombre_producto: 'Churrasco',
            categoria_nombre: 'Platos fuertes',
            es_plato_principal: true,
          },
        ],
        configBase,
        { cliente_mulero: true },
      );
      expect(r.descuento_promociones).toBe(2 * 3000);
    });

    it('no aplica promoción por plato principal sin etiqueta en el pedido', () => {
      const r = calcularDescuentosPedido(
        [
          {
            cantidad: 2,
            subtotal_linea: 50000,
            nombre_producto: 'Churrasco',
            categoria_nombre: 'Platos fuertes',
            es_plato_principal: true,
          },
        ],
        configBase,
        { cliente_mulero: false },
      );
      expect(r.descuento_promociones).toBe(0);
    });
  });
});
