import {
  calcularDescuentoPromociones,
  parseReglasPromocion,
} from './promociones-pedido';
import type { LineaDescuento } from './descuentos-pedido';

describe('promociones-pedido', () => {
  const lineas: LineaDescuento[] = [
    {
      cantidad: 2,
      subtotal_linea: 20_000,
      nombre_producto: 'Sopa A',
      categoria_nombre: 'Sopas',
      id_categoria: 3,
    },
    {
      cantidad: 1,
      subtotal_linea: 35_000,
      nombre_producto: 'Bandeja',
      categoria_nombre: 'Platos',
      id_categoria: 1,
      es_plato_principal: true,
    },
  ];

  it('parseReglasPromocion filtra inválidas', () => {
    const reglas = parseReglasPromocion([
      {
        id: 'r1',
        activa: true,
        etiqueta: 'Promo sopas',
        tipo: 'por_categoria',
        id_categoria: 3,
        monto_por_unidad: 2000,
        min_unidades: 2,
        min_subtotal_otros: 30_000,
      },
      { tipo: 'otro' },
    ]);
    expect(reglas).toHaveLength(1);
    expect(reglas[0].etiqueta).toBe('Promo sopas');
  });

  it('aplica descuento por categoría con umbral de otros ítems', () => {
    const { total, desglose } = calcularDescuentoPromociones(lineas, [
      {
        id: 'r1',
        activa: true,
        etiqueta: 'Promo sopas',
        tipo: 'por_categoria',
        id_categoria: 3,
        monto_por_unidad: 2000,
        min_unidades: 2,
        min_subtotal_otros: 30_000,
      },
    ]);
    expect(total).toBe(4000);
    expect(desglose[0].monto).toBe(4000);
  });

  it('no aplica si no alcanza min_unidades', () => {
    const { total } = calcularDescuentoPromociones(
      [{ ...lineas[0], cantidad: 1, subtotal_linea: 10_000 }],
      [
        {
          id: 'r1',
          activa: true,
          etiqueta: 'Promo',
          tipo: 'por_categoria',
          id_categoria: 3,
          monto_por_unidad: 2000,
          min_unidades: 2,
          min_subtotal_otros: 0,
        },
      ],
    );
    expect(total).toBe(0);
  });
});
