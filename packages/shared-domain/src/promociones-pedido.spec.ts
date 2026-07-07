import {
  calcularDescuentoPromociones,
  ETIQUETA_LEGACY_MULERO,
  type ReglaPromocion,
} from './promociones-pedido';

describe('promociones-pedido (reglas avanzadas)', () => {
  it('precio fijo por categoría para cliente especial', () => {
    const reglas: ReglaPromocion[] = [
      {
        id: 'pf1',
        activa: true,
        etiqueta: 'Tarifa cliente especial',
        tipo: 'precio_fijo_categoria',
        id_categoria: 2,
        precio_fijo_unidad: 35_000,
        requiere_etiqueta_pedido: ETIQUETA_LEGACY_MULERO,
      },
    ];
    const lineas = [
      {
        cantidad: 1,
        subtotal_linea: 45_000,
        nombre_producto: 'Bandeja A',
        categoria_nombre: 'Platos',
        id_categoria: 2,
        precio_unitario: 45_000,
      },
      {
        cantidad: 2,
        subtotal_linea: 76_000,
        nombre_producto: 'Bandeja B',
        categoria_nombre: 'Platos',
        id_categoria: 2,
        precio_unitario: 38_000,
      },
    ];
    const sinEtiqueta = calcularDescuentoPromociones(lineas, reglas, []);
    expect(sinEtiqueta.total).toBe(0);

    const conEtiqueta = calcularDescuentoPromociones(lineas, reglas, [
      ETIQUETA_LEGACY_MULERO,
    ]);
    // (45000-35000) + (76000 - 2*35000) = 10000 + 6000
    expect(conEtiqueta.total).toBe(16_000);
  });

  it('2x1 por categoría', () => {
    const reglas: ReglaPromocion[] = [
      {
        id: '2x1',
        activa: true,
        etiqueta: '2x1 bebidas',
        tipo: 'compra_paga',
        alcance: 'categoria',
        id_categoria: 5,
        compra_unidades: 2,
        paga_unidades: 1,
      },
    ];
    const lineas = [
      {
        cantidad: 3,
        subtotal_linea: 15_000,
        nombre_producto: 'Gaseosa',
        categoria_nombre: 'Bebidas',
        id_categoria: 5,
        precio_unitario: 5_000,
      },
    ];
    const r = calcularDescuentoPromociones(lineas, reglas, []);
    // 3 unidades → 1 set de 2 → 1 gratis × 5000
    expect(r.total).toBe(5_000);
  });

  it('descuento por umbral de subtotal', () => {
    const reglas: ReglaPromocion[] = [
      {
        id: 'umbral',
        activa: true,
        etiqueta: '10% consumo alto',
        tipo: 'umbral_subtotal_pedido',
        min_subtotal_pedido: 100_000,
        porcentaje_descuento: 10,
      },
    ];
    const bajo = calcularDescuentoPromociones(
      [
        {
          cantidad: 1,
          subtotal_linea: 80_000,
          nombre_producto: 'X',
          categoria_nombre: 'Y',
        },
      ],
      reglas,
      [],
    );
    expect(bajo.total).toBe(0);

    const alto = calcularDescuentoPromociones(
      [
        {
          cantidad: 1,
          subtotal_linea: 120_000,
          nombre_producto: 'X',
          categoria_nombre: 'Y',
        },
      ],
      reglas,
      [],
    );
    expect(alto.total).toBe(12_000);
  });
});
