import {
  compararLineasPedidoPorSeccion,
  seccionLineaPedido,
} from './orden-lineas-pedido';

describe('orden-lineas-pedido', () => {
  it('clasifica secciones según categoría y flags', () => {
    expect(
      seccionLineaPedido({
        es_acompanamiento_mazorca: true,
        nombre_producto: 'Mazorca (acompañamiento)',
      }),
    ).toBe('mazorca');
    expect(
      seccionLineaPedido({
        nombre_producto: 'Mazorca para dos',
        categoria_nombre: 'Entradas y adicionales',
      }),
    ).toBe('entrada');
    expect(
      seccionLineaPedido({
        categoria_nombre: 'Platos fuertes - Pollo',
        es_plato_principal: true,
      }),
    ).toBe('plato_fuerte');
    expect(
      seccionLineaPedido({ categoria_nombre: 'Menú infantil' }),
    ).toBe('menu_infantil');
    expect(
      seccionLineaPedido({ categoria_nombre: 'Entradas y adicionales' }),
    ).toBe('entrada');
    expect(
      seccionLineaPedido({ categoria_nombre: 'Bebidas sin alcohol' }),
    ).toBe('bebida');
    expect(
      seccionLineaPedido({
        categoria_nombre: 'Empaque',
        es_empacable: true,
      }),
    ).toBe('empacable');
  });

  it('ordena mazorca → plato → infantil → entrada → bebida → empaque', () => {
    const lineas = [
      { id_detalle: 6, categoria_nombre: 'Empaque', es_empacable: true },
      { id_detalle: 5, categoria_nombre: 'Bebidas sin alcohol' },
      { id_detalle: 4, categoria_nombre: 'Entradas y adicionales' },
      { id_detalle: 3, categoria_nombre: 'Menú infantil' },
      {
        id_detalle: 2,
        categoria_nombre: 'Platos fuertes - Res / Mixto',
        es_plato_principal: true,
      },
      { id_detalle: 1, es_acompanamiento_mazorca: true },
    ];
    const ordenados = [...lineas].sort(compararLineasPedidoPorSeccion);
    expect(ordenados.map((l) => l.id_detalle)).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
