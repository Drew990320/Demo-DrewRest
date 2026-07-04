import 'reflect-metadata';
import { aplicaControlStockBebida } from './stock-bebida';

describe('stock-bebida', () => {
  it('solo aplica en categorías bebida con control activo', () => {
    expect(
      aplicaControlStockBebida({
        idProducto: 1,
        controlStock: true,
        stockDisponible: 5,
        categoria: { esBebida: true },
      } as never),
    ).toBe(true);
    expect(
      aplicaControlStockBebida({
        idProducto: 1,
        controlStock: true,
        stockDisponible: 5,
        categoria: { esBebida: false },
      } as never),
    ).toBe(false);
  });
});
