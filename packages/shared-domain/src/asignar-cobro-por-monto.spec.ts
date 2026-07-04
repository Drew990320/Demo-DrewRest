import { asignarCantidadesParaSubtotal } from './asignar-cobro-por-monto';

describe('asignarCantidadesParaSubtotal', () => {
  const lineas = [
    { id_detalle: 1, precio_unitario: 30_000, cantidad_pendiente: 2 },
    { id_detalle: 2, precio_unitario: 15_000, cantidad_pendiente: 2 },
  ];

  it('asigna unidades hasta acercarse al subtotal', () => {
    const q = asignarCantidadesParaSubtotal(lineas, 45_000);
    const bruto =
      (q[1] ?? 0) * 30_000 + (q[2] ?? 0) * 15_000;
    expect(bruto).toBeGreaterThanOrEqual(45_000);
    expect(q[1] ?? 0).toBeGreaterThan(0);
  });

  it('devuelve vacío si objetivo es 0', () => {
    expect(asignarCantidadesParaSubtotal(lineas, 0)).toEqual({});
  });
});
