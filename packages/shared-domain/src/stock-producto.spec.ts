import {
  puedePedirCantidad,
  productoAgotado,
  productoVisibleEnMenu,
} from './stock-producto';

describe('stock-producto', () => {
  it('sin control de stock siempre visible y pedible', () => {
    expect(
      productoVisibleEnMenu({ activo: true, control_stock: false }),
    ).toBe(true);
    expect(puedePedirCantidad({ control_stock: false }, 99)).toBe(true);
  });

  it('agotado oculto por defecto', () => {
    const p = {
      activo: true,
      control_stock: true,
      stock_disponible: 0,
      ocultar_sin_stock: true,
    };
    expect(productoAgotado(p)).toBe(true);
    expect(productoVisibleEnMenu(p)).toBe(false);
    expect(puedePedirCantidad(p, 1)).toBe(false);
  });

  it('agotado visible si admin desactiva ocultar', () => {
    const p = {
      activo: true,
      control_stock: true,
      stock_disponible: 0,
      ocultar_sin_stock: false,
    };
    expect(productoVisibleEnMenu(p)).toBe(true);
  });
});
