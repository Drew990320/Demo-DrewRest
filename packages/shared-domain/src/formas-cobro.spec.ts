import { calcularDetalleExcesoCobro, calcularVueltoCliente } from './factura-vuelto';
import {
  repartoMixtoConDevolucion,
  repartoMixtoDesdeTransferencia,
} from './factura-mixto';

/**
 * Matriz de formas de cobro: efectivo, transferencia, mixto y destinos del exceso.
 * Complementa factura-vuelto.spec con escenarios de integración cobro dividido.
 */
describe('formas de cobro — efectivo', () => {
  it('pago exacto no genera detalle de exceso', () => {
    expect(
      calcularDetalleExcesoCobro({
        total: 45_000,
        metodo: 'efectivo',
        monto_recibido_efectivo: 45_000,
      }),
    ).toBeNull();
  });

  it('vuelto en efectivo tras tanda parcial', () => {
    const totalTanda = 20_000;
    const exceso = calcularDetalleExcesoCobro({
      total: totalTanda,
      metodo: 'efectivo',
      monto_recibido_efectivo: 50_000,
    });
    expect(exceso?.vuelto_cliente_efectivo).toBe(30_000);
    expect(
      calcularVueltoCliente({
        total: totalTanda,
        metodo: 'efectivo',
        monto_recibido_efectivo: 50_000,
      })?.vuelto_total,
    ).toBe(30_000);
  });
});

describe('formas de cobro — transferencia', () => {
  it('transferencia exacta no genera detalle de exceso', () => {
    expect(
      calcularDetalleExcesoCobro({
        total: 32_000,
        metodo: 'transferencia',
        monto_transferencia: 32_000,
      }),
    ).toBeNull();
  });

  it.each([
    ['efectivo', { vuelto_cliente_efectivo: 7_000, pago_domiciliario: 0, pago_mesero: 0 }],
    ['domicilio', { vuelto_cliente_efectivo: 0, pago_domiciliario: 7_000, pago_mesero: 0 }],
    ['mesero', { vuelto_cliente_efectivo: 0, pago_domiciliario: 0, pago_mesero: 7_000 }],
  ] as const)('exceso transferencia → %s', (destino, esperado) => {
    expect(
      calcularDetalleExcesoCobro({
        total: 30_000,
        metodo: 'transferencia',
        monto_transferencia: 37_000,
        devolucion_exceso_metodo: destino,
      }),
    ).toMatchObject(esperado);
  });
});

describe('formas de cobro — mixto', () => {
  const total = 48_000;

  it('reparto clásico: transferencia primero, resto efectivo', () => {
    const r = repartoMixtoDesdeTransferencia(total, 20_000);
    expect(r).toEqual({
      transferenciaFactura: 20_000,
      efectivoFactura: 28_000,
      excesoDevolverEfectivo: 0,
    });
  });

  it('transferencia cubre total: exceso a devolver', () => {
    const r = repartoMixtoDesdeTransferencia(total, 55_000);
    expect(r.transferenciaFactura).toBe(48_000);
    expect(r.efectivoFactura).toBe(0);
    expect(r.excesoDevolverEfectivo).toBe(7_000);
  });

  it('devolución por transferencia conserva efectivo en caja', () => {
    const r = repartoMixtoConDevolucion(total, 20_000, 33_000, 'transferencia');
    expect(r).toEqual({
      transferenciaFactura: 15_000,
      efectivoFactura: 33_000,
      excesoDevolverEfectivo: 5_000,
    });
    expect(r.efectivoFactura + r.transferenciaFactura).toBe(total);
  });

  it('mixto con vuelto en efectivo al cliente', () => {
    const exceso = calcularDetalleExcesoCobro({
      total,
      metodo: 'mixto',
      monto_transferencia: 20_000,
      monto_recibido_efectivo: 35_000,
    });
    expect(exceso?.vuelto_cliente_efectivo).toBe(7_000);
    expect(exceso?.monto_transferencia_recibido).toBe(20_000);
  });

  it('mixto con exceso total a domiciliario', () => {
    const exceso = calcularDetalleExcesoCobro({
      total: 48_000,
      metodo: 'mixto',
      monto_transferencia: 50_000,
      monto_recibido_efectivo: 10_000,
      devolucion_exceso_metodo: 'domicilio',
    });
    expect(exceso?.pago_domiciliario).toBe(2_000);
    expect(exceso?.vuelto_cliente_efectivo).toBe(10_000);
  });
});

describe('formas de cobro — tandas parciales con distinto método', () => {
  it('primera tanda efectivo y segunda transferencia suman el total', () => {
    const totalPedido = 60_000;
    const tanda1 = 25_000;
    const tanda2 = totalPedido - tanda1;

    const e1 = calcularDetalleExcesoCobro({
      total: tanda1,
      metodo: 'efectivo',
      monto_recibido_efectivo: 30_000,
    });
    const e2 = calcularDetalleExcesoCobro({
      total: tanda2,
      metodo: 'transferencia',
      monto_transferencia: 40_000,
      devolucion_exceso_metodo: 'efectivo',
    });

    expect((e1?.vuelto_cliente_efectivo ?? 0) + tanda1).toBe(30_000);
    expect(e2?.vuelto_cliente_efectivo).toBe(5_000);
    expect(tanda1 + tanda2).toBe(totalPedido);
  });
});
