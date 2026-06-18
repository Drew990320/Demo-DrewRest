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
          nombre_producto: 'Arroz',
          categoria_nombre: 'Platos fuertes',
        }),
      ).toBe(false);
    });
  });

  describe('calcularDescuentosPedido', () => {
    it('no aplica descuento de sopas con una sola sopa', () => {
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
      expect(r.descuento_sopas).toBe(0);
    });

    it('aplica descuento de sopas con 2+ sopas y subtotal alto en otros ítems', () => {
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
      expect(r.descuento_sopas).toBe(2 * 5000);
    });

    it('aplica descuento muleros por platos principales', () => {
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
        true,
      );
      expect(r.descuento_muleros).toBe(2 * 3000);
    });

    it('no aplica muleros si el cliente no es camionero', () => {
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
        false,
      );
      expect(r.descuento_muleros).toBe(0);
    });
  });
});
