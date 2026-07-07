import {
  PRECIO_EMPAQUE_PARA_LLEVAR_COP,
  empaqueCompartidoEnPedido,
  empaqueFaltanteEnDetallePadre,
  nuevaCantidadEmpaqueTrasCambioPadre,
  productoCobraEmpaqueParaLlevarPorPlatoFuerte,
  resumenEmpaqueParaLlevar,
} from '@la-reserva/shared-domain/empaque-para-llevar';
import { precioEmpaqueParaLlevarDecimal } from './empaque-para-llevar';

describe('empaque-para-llevar', () => {
  const plato = {
    id_detalle: 1,
    id_detalle_padre: null as number | null,
    cantidad: 1,
    es_empacable: false,
    es_plato_principal: true,
    categoria_nombre: 'Platos fuertes - Res',
  };

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

    it('cobra empaque si el producto está marcado plato principal aunque la categoría no sea plato fuerte', () => {
      expect(
        productoCobraEmpaqueParaLlevarPorPlatoFuerte({
          es_plato_principal: true,
          es_empacable: false,
          categoria_nombre: 'Para compartir',
        }),
      ).toBe(true);
    });
  });

  describe('resumenEmpaqueParaLlevar', () => {
    it('detecta empaques faltantes (3 platos, 2 empaques)', () => {
      const detalles = [
        { ...plato, id_detalle: 1 },
        { ...plato, id_detalle: 2 },
        { ...plato, id_detalle: 3 },
        {
          id_detalle: 10,
          id_detalle_padre: 1,
          cantidad: 1,
          es_empacable: true,
        },
        {
          id_detalle: 11,
          id_detalle_padre: 2,
          cantidad: 1,
          es_empacable: true,
        },
      ];
      expect(resumenEmpaqueParaLlevar('para_llevar', detalles)).toEqual({
        unidades_plato: 3,
        unidades_empaque: 2,
        unidades_faltantes: 1,
      });
    });

    it('ignora pedidos en mesa', () => {
      expect(resumenEmpaqueParaLlevar('en_mesa', [plato])).toBeNull();
    });
  });

  describe('empaqueCompartidoEnPedido', () => {
    it('detecta empaque compartido (3 platos, 2 empaques)', () => {
      const resumen = resumenEmpaqueParaLlevar('para_llevar', [
        { ...plato, id_detalle: 1 },
        { ...plato, id_detalle: 2 },
        { ...plato, id_detalle: 3 },
        {
          id_detalle: 10,
          id_detalle_padre: 1,
          cantidad: 1,
          es_empacable: true,
        },
        {
          id_detalle: 11,
          id_detalle_padre: 2,
          cantidad: 1,
          es_empacable: true,
        },
      ]);
      expect(empaqueCompartidoEnPedido(resumen)).toBe(true);
    });
  });

  describe('nuevaCantidadEmpaqueTrasCambioPadre', () => {
    it('sube empaques al aumentar platos', () => {
      expect(nuevaCantidadEmpaqueTrasCambioPadre(1, 1, 4)).toBe(4);
    });

    it('agrega empaques por el delta al aumentar platos', () => {
      expect(nuevaCantidadEmpaqueTrasCambioPadre(1, 3, 4)).toBe(2);
    });

    it('limita empaques al bajar platos', () => {
      expect(nuevaCantidadEmpaqueTrasCambioPadre(4, 4, 2)).toBe(2);
    });

    it('respeta empaque compartido al bajar platos', () => {
      expect(nuevaCantidadEmpaqueTrasCambioPadre(1, 4, 2)).toBe(1);
    });
  });

  describe('empaqueFaltanteEnDetallePadre', () => {
    it('cuenta faltante por línea', () => {
      const padre = {
        id_detalle: 5,
        id_detalle_padre: null,
        cantidad: 2,
        es_plato_principal: true,
        categoria_nombre: 'Platos fuertes - Res',
      };
      expect(
        empaqueFaltanteEnDetallePadre(padre, [
          padre,
          {
            id_detalle: 6,
            id_detalle_padre: 5,
            cantidad: 1,
            es_empacable: true,
          },
        ]),
      ).toBe(1);
    });
  });
});
