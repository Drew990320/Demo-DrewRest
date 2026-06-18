import {
  PRECIO_EMPAQUE_PARA_LLEVAR_COP,
  precioEmpaqueParaLlevarDecimal,
  productoCobraEmpaqueParaLlevarPorPlatoFuerte,
} from './empaque-para-llevar';

describe('empaque-para-llevar', () => {
  it('expone precio fijo de empaque', () => {
    expect(PRECIO_EMPAQUE_PARA_LLEVAR_COP).toBe(1000);
    expect(Number(precioEmpaqueParaLlevarDecimal())).toBe(1000);
  });

  describe('productoCobraEmpaqueParaLlevarPorPlatoFuerte', () => {
    it('cobra empaque en platos fuertes no empacables', () => {
      expect(
        productoCobraEmpaqueParaLlevarPorPlatoFuerte({
          esPlatoPrincipal: true,
          esEmpacable: false,
          categoria: { nombre: 'Platos fuertes - Res' },
        }),
      ).toBe(true);
    });

    it('cobra empaque en menú infantil', () => {
      expect(
        productoCobraEmpaqueParaLlevarPorPlatoFuerte({
          esPlatoPrincipal: false,
          esEmpacable: false,
          categoria: { nombre: 'Menú infantil' },
        }),
      ).toBe(true);
    });

    it('no cobra si el producto ya es empaque', () => {
      expect(
        productoCobraEmpaqueParaLlevarPorPlatoFuerte({
          esPlatoPrincipal: true,
          esEmpacable: true,
          categoria: { nombre: 'Platos fuertes - Res' },
        }),
      ).toBe(false);
    });

    it('no cobra en categorías que no aplican', () => {
      expect(
        productoCobraEmpaqueParaLlevarPorPlatoFuerte({
          esPlatoPrincipal: false,
          esEmpacable: false,
          categoria: { nombre: 'Bebidas' },
        }),
      ).toBe(false);
    });
  });
});
