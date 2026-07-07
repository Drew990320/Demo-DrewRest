import {
  acumularVentaPorMetodoPago,
  calcularEfectivoEsperadoEnCaja,
  impactoMovimientoCajaEfectivo,
  resumenImpactoMovimientosCaja,
  totalesPorMetodoResumenVacios,
} from './movimiento-caja';

describe('movimiento-caja', () => {
  it('excluye crédito de totales de caja inmediata', () => {
    const totales = totalesPorMetodoResumenVacios();
    acumularVentaPorMetodoPago(totales, 'efectivo', 10000);
    acumularVentaPorMetodoPago(totales, 'credito', 25000);
    acumularVentaPorMetodoPago(totales, 'transferencia', 5000);
    expect(totales).toEqual({
      efectivo: 10000,
      transferencia: 5000,
      credito: 25000,
    });
  });

  it('calcula impacto por tipo', () => {
    expect(
      impactoMovimientoCajaEfectivo({
        tipo: 'entrada_manual',
        monto: 50000,
      }),
    ).toBe(50000);
    expect(
      impactoMovimientoCajaEfectivo({
        tipo: 'salida_manual',
        monto: 12000,
      }),
    ).toBe(-12000);
    expect(
      impactoMovimientoCajaEfectivo({
        tipo: 'pago_domicilio',
        monto: 7000,
      }),
    ).toBe(-7000);
    expect(
      impactoMovimientoCajaEfectivo({
        tipo: 'pago_mesero',
        monto: 15000,
      }),
    ).toBe(-15000);
    expect(
      impactoMovimientoCajaEfectivo({
        tipo: 'devolucion_exceso_transferencia',
        monto: 8000,
        metodo_devolucion: 'efectivo',
      }),
    ).toBe(-8000);
    expect(
      impactoMovimientoCajaEfectivo({
        tipo: 'devolucion_exceso_transferencia',
        monto: 8000,
        metodo_devolucion: 'transferencia',
      }),
    ).toBe(0);
  });

  it('resume totales del día', () => {
    const r = resumenImpactoMovimientosCaja([
      { tipo: 'entrada_manual', monto: 100000 },
      { tipo: 'salida_manual', monto: 30000 },
      {
        tipo: 'devolucion_exceso_transferencia',
        monto: 5000,
        metodo_devolucion: 'efectivo',
      },
    ]);
    expect(r.total_entradas_manual).toBe(100000);
    expect(r.total_salidas_manual).toBe(30000);
    expect(r.total_devoluciones_efectivo).toBe(5000);
    expect(r.total_pagos_domicilio).toBe(0);
    expect(r.neto_movimientos_caja).toBe(65000);
  });

  it('cuenta pago domiciliario como salida de caja', () => {
    const cuadre = calcularEfectivoEsperadoEnCaja({
      monto_base_efectivo: 100_000,
      ventas_efectivo: 0,
      movimientos: [{ tipo: 'pago_domicilio', monto: 8_000 }],
    });
    expect(cuadre.total_pagos_domicilio).toBe(8_000);
    expect(cuadre.subtotal_salidas_caja).toBe(8_000);
    expect(cuadre.efectivo_esperado_en_caja).toBe(92_000);
  });

  it('cuenta pago mesero exceso como salida de caja', () => {
    const cuadre = calcularEfectivoEsperadoEnCaja({
      monto_base_efectivo: 100_000,
      ventas_efectivo: 0,
      movimientos: [{ tipo: 'pago_mesero', monto: 12_000 }],
    });
    expect(cuadre.total_pagos_mesero_exceso).toBe(12_000);
    expect(cuadre.subtotal_salidas_caja).toBe(12_000);
    expect(cuadre.efectivo_esperado_en_caja).toBe(88_000);
  });

  it('agrupa entradas y salidas antes de restar', () => {
    const cuadre = calcularEfectivoEsperadoEnCaja({
      monto_base_efectivo: 200_000,
      ventas_efectivo: 850_000,
      total_pagos_meseros: 40_000,
      movimientos: [
        { tipo: 'entrada_manual', monto: 100_000 },
        { tipo: 'salida_manual', monto: 30_000 },
        {
          tipo: 'devolucion_exceso_transferencia',
          monto: 5_000,
          metodo_devolucion: 'efectivo',
        },
      ],
    });
    expect(cuadre.subtotal_entradas_caja).toBe(1_150_000);
    expect(cuadre.subtotal_salidas_caja).toBe(75_000);
    expect(cuadre.efectivo_esperado_en_caja).toBe(1_075_000);
    expect(cuadre.efectivo_esperado_en_caja).toBe(
      cuadre.subtotal_entradas_caja - cuadre.subtotal_salidas_caja,
    );
    expect(cuadre.efectivo_esperado_en_caja).toBe(
      200_000 + 850_000 - 40_000 + cuadre.neto_movimientos_caja,
    );
  });
});
