import { tipoLineaCocina } from '@la-reserva/shared-domain/cocina-producto';

describe('tipoLineaCocina', () => {
  it('detecta mazorca de acompañamiento', () => {
    expect(
      tipoLineaCocina({
        nombre_producto: 'Mazorca (acompañamiento)',
        es_acompanamiento_mazorca: true,
      }),
    ).toBe('mazorca');
  });

  it('detecta adicional por nombre', () => {
    expect(
      tipoLineaCocina({
        nombre_producto: 'Adicional de chorizo',
        categoria_nombre: 'Entradas y adicionales',
      }),
    ).toBe('adicional');
  });

  it('detecta entrada por nombre', () => {
    expect(
      tipoLineaCocina({
        nombre_producto: 'Entrada de chorizo',
        categoria_nombre: 'Entradas y adicionales',
      }),
    ).toBe('entrada');
  });

  it('detecta plato fuerte', () => {
    expect(
      tipoLineaCocina({
        nombre_producto: 'Pechuga a la plancha',
        categoria_nombre: 'Platos fuertes - Res',
        es_plato_principal: true,
      }),
    ).toBe('plato');
  });

  it('detecta sopa del día', () => {
    expect(
      tipoLineaCocina({
        nombre_producto: 'Sopa del día',
        categoria_nombre: 'Sopa del día',
      }),
    ).toBe('sopa');
  });

  it('detecta para compartir como plato', () => {
    expect(
      tipoLineaCocina({
        nombre_producto: 'Picada de la casa 500g',
        categoria_nombre: 'Para compartir',
      }),
    ).toBe('plato');
  });

  it('clasifica papas en entradas como entrada', () => {
    expect(
      tipoLineaCocina({
        nombre_producto: 'Papas a la francesa',
        categoria_nombre: 'Entradas y adicionales',
      }),
    ).toBe('entrada');
  });
});
