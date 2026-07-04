import {
  inferirPrecioUnitarioCanonico,
  planConsolidarFragmentosPrecioPendientes,
} from '@la-reserva/shared-domain/consolidar-fragmentos-precio';

describe('consolidar fragmentos de precio pendientes', () => {
  it('infiere precio de catálogo cuando los fragmentos no lo contienen', () => {
    expect(
      inferirPrecioUnitarioCanonico(100_000, [33_400, 33_300, 33_300], 100_000),
    ).toBe(100_000);
  });

  it('recompone 3 picadas fragmentadas en una sola línea de 3×100k', () => {
    const base = {
      id_producto: 50,
      id_detalle_padre: null as number | null,
      id_factura: null as number | null,
      nota_cocina: null as string | null,
      enviado_cocina: false,
      listo_cocina: false,
      listo_para_recoger: false,
      personalizacion_key: '',
      precio_catalogo: 100_000,
    };
    const plan = planConsolidarFragmentosPrecioPendientes([
      { ...base, id_detalle: 1, cantidad: 1, precio_unitario: 33_400 },
      { ...base, id_detalle: 2, cantidad: 2, precio_unitario: 100_000 },
      { ...base, id_detalle: 3, cantidad: 1, precio_unitario: 33_300 },
      { ...base, id_detalle: 4, cantidad: 1, precio_unitario: 33_300 },
    ]);
    expect(plan).toHaveLength(1);
    expect(plan[0].cantidad).toBe(3);
    expect(plan[0].precio_unitario).toBe(100_000);
    expect(plan[0].deleteIds.length).toBe(3);
  });

  it('no toca líneas ya limpias de un solo precio', () => {
    const plan = planConsolidarFragmentosPrecioPendientes([
      {
        id_detalle: 1,
        id_producto: 50,
        id_detalle_padre: null,
        id_factura: null,
        cantidad: 3,
        precio_unitario: 100_000,
        nota_cocina: null,
        enviado_cocina: false,
        listo_cocina: false,
        listo_para_recoger: false,
        personalizacion_key: '',
        precio_catalogo: 100_000,
      },
    ]);
    expect(plan).toEqual([]);
  });
});
