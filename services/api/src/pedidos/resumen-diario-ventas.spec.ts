import { agregarVentasResumenDiario } from '@la-reserva/shared-domain/resumen-diario-ventas';

describe('agregarVentasResumenDiario', () => {
  it('agrupa platos principales por categoría e ítems por producto', () => {
    const res = agregarVentasResumenDiario([
      {
        id_producto: 1,
        nombre_producto: 'Bandeja paisa',
        categoria_nombre: 'Platos fuertes',
        es_plato_principal: true,
        cantidad: 2,
        subtotal_linea: 50000,
      },
      {
        id_producto: 2,
        nombre_producto: 'Gaseosa',
        categoria_nombre: 'Bebidas',
        es_plato_principal: false,
        cantidad: 3,
        subtotal_linea: 9000,
      },
      {
        id_producto: 1,
        nombre_producto: 'Bandeja paisa',
        categoria_nombre: 'Platos fuertes',
        es_plato_principal: true,
        cantidad: 1,
        subtotal_linea: 25000,
      },
    ]);

    expect(res.platos_por_categoria).toEqual([
      { categoria_nombre: 'Platos fuertes', cantidad: 3, subtotal: 75000 },
    ]);
    expect(res.items_menu).toEqual([
      {
        id_producto: 1,
        nombre_producto: 'Bandeja paisa',
        categoria_nombre: 'Platos fuertes',
        cantidad: 3,
        subtotal: 75000,
      },
      {
        id_producto: 2,
        nombre_producto: 'Gaseosa',
        categoria_nombre: 'Bebidas',
        cantidad: 3,
        subtotal: 9000,
      },
    ]);
  });

  it('omite acompañamientos de mazorca', () => {
    const res = agregarVentasResumenDiario([
      {
        id_producto: 99,
        nombre_producto: 'Mazorca',
        categoria_nombre: 'Entradas',
        es_plato_principal: false,
        es_acompanamiento_mazorca: true,
        cantidad: 4,
        subtotal_linea: 0,
      },
    ]);
    expect(res.platos_por_categoria).toEqual([]);
    expect(res.items_menu).toEqual([]);
  });

  it('omite cuotas pendientes de reparto', () => {
    const res = agregarVentasResumenDiario([
      {
        id_producto: 100,
        nombre_producto: 'Saldo pendiente reparto (Persona +2)',
        categoria_nombre: 'Ajustes',
        es_plato_principal: false,
        es_cuota_pendiente_reparto: true,
        cantidad: 1,
        subtotal_linea: 1800,
      },
    ]);
    expect(res.platos_por_categoria).toEqual([]);
    expect(res.items_menu).toEqual([]);
  });
});
