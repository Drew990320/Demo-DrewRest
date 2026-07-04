import { lineasComandaParaTicket } from './comanda-lineas-group';

describe('comanda-lineas-group', () => {
  it('ordena comanda: mazorca → entrada → sopa → plato fuerte', () => {
    const lineas = lineasComandaParaTicket([
      {
        id_detalle: 1,
        id_detalle_padre: null,
        nombre_producto: 'Bondiola al barril',
        cantidad: 3,
        categoria_nombre: 'Platos fuertes - Cerdo',
        es_plato_principal: true,
      },
      {
        id_detalle: 2,
        id_detalle_padre: null,
        nombre_producto: 'Mazorca (acompañamiento)',
        cantidad: 7,
        es_acompanamiento_mazorca: true,
      },
      {
        id_detalle: 3,
        id_detalle_padre: null,
        nombre_producto: 'Lomo al barril',
        cantidad: 6,
        categoria_nombre: 'Platos fuertes - Cerdo',
        es_plato_principal: true,
      },
      {
        id_detalle: 4,
        id_detalle_padre: null,
        nombre_producto: 'Entrada de chorizo',
        cantidad: 2,
        categoria_nombre: 'Entradas y adicionales',
      },
      {
        id_detalle: 5,
        id_detalle_padre: null,
        nombre_producto: 'Sopa del día',
        cantidad: 1,
        categoria_nombre: 'Sopa del día',
      },
    ]);

    expect(lineas.map((l) => l.nombre_producto)).toEqual([
      'Mazorca (acompañamiento)',
      'Entrada de chorizo',
      'Sopa del día',
      'Bondiola al barril',
      'Lomo al barril',
    ]);
  });
});
