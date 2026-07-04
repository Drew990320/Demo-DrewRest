import { agruparLineasFacturaCobroVista } from '@la-reserva/shared-domain/factura-lineas-group';

describe('agruparLineasFacturaCobroVista', () => {
  it('consolida fragmentos de precio del mismo plato (caso 3 picadas)', () => {
    const picada = (id: number, precio: number, cobrado: boolean) => ({
      id_detalle: id,
      id_producto: 50,
      id_detalle_padre: null as number | null,
      nombre_producto: 'Picada de la casa 750 gr',
      cantidad: 1,
      precio_unitario: precio,
      subtotal_linea: precio,
      cobrado,
    });
    const grupos = agruparLineasFacturaCobroVista([
      picada(1, 11_200, true),
      picada(2, 100_000, true),
      picada(3, 22_300, true),
      picada(4, 33_300, true),
      picada(5, 22_200, true),
      picada(6, 22_200, true),
      picada(7, 29_600, false),
      picada(8, 29_600, false),
      picada(9, 29_600, true),
    ]);
    const cobrados = grupos.filter((g) => g.cobrado);
    const pendientes = grupos.filter((g) => !g.cobrado);
    expect(cobrados).toHaveLength(1);
    expect(pendientes).toHaveLength(1);
    expect(cobrados[0].subtotal_linea).toBe(240_800);
    expect(pendientes[0].subtotal_linea).toBe(59_200);
    expect(cobrados[0].subtotal_linea + pendientes[0].subtotal_linea).toBe(
      300_000,
    );
  });
});
