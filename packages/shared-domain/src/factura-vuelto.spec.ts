import {
  calcularDetalleExcesoCobro,
  calcularVueltoCliente,
  lineasTicketExcesoCobro,
  parseDetalleExcesoCobro,
} from './factura-vuelto';

describe('calcularDetalleExcesoCobro', () => {
  it('efectivo: vuelto cuando recibe de mas', () => {
    expect(
      calcularDetalleExcesoCobro({
        total: 25_000,
        metodo: 'efectivo',
        monto_recibido_efectivo: 50_000,
      }),
    ).toEqual({
      monto_recibido_efectivo: 50_000,
      vuelto_cliente_efectivo: 25_000,
      vuelto_cliente_transferencia: 0,
      pago_domiciliario: 0,
      pago_mesero: 0,
    });
  });

  it('transferencia: exceso devuelto en efectivo', () => {
    expect(
      calcularDetalleExcesoCobro({
        total: 30_000,
        metodo: 'transferencia',
        monto_transferencia: 35_000,
        devolucion_exceso_metodo: 'efectivo',
      }),
    ).toEqual({
      monto_transferencia_recibido: 35_000,
      vuelto_cliente_efectivo: 5_000,
      vuelto_cliente_transferencia: 0,
      pago_domiciliario: 0,
      pago_mesero: 0,
    });
  });

  it('transferencia: exceso a domiciliario', () => {
    expect(
      calcularDetalleExcesoCobro({
        total: 30_000,
        metodo: 'transferencia',
        monto_transferencia: 35_000,
        devolucion_exceso_metodo: 'domicilio',
      }),
    ).toEqual({
      monto_transferencia_recibido: 35_000,
      vuelto_cliente_efectivo: 0,
      vuelto_cliente_transferencia: 0,
      pago_domiciliario: 5_000,
      pago_mesero: 0,
    });
  });

  it('transferencia: exceso al mesero', () => {
    expect(
      calcularDetalleExcesoCobro({
        total: 30_000,
        metodo: 'transferencia',
        monto_transferencia: 35_000,
        devolucion_exceso_metodo: 'mesero',
      }),
    ).toEqual({
      monto_transferencia_recibido: 35_000,
      vuelto_cliente_efectivo: 0,
      vuelto_cliente_transferencia: 0,
      pago_domiciliario: 0,
      pago_mesero: 5_000,
    });
  });

  it('mixto: vuelto en efectivo', () => {
    expect(
      calcularDetalleExcesoCobro({
        total: 40_000,
        metodo: 'mixto',
        monto_transferencia: 20_000,
        monto_recibido_efectivo: 30_000,
      }),
    ).toEqual({
      monto_recibido_efectivo: 30_000,
      monto_transferencia_recibido: 20_000,
      vuelto_cliente_efectivo: 10_000,
      vuelto_cliente_transferencia: 0,
      pago_domiciliario: 0,
      pago_mesero: 0,
    });
  });

  it('mixto: transferencia cubre total y exceso a domicilio', () => {
    expect(
      calcularDetalleExcesoCobro({
        total: 48_000,
        metodo: 'mixto',
        monto_transferencia: 50_000,
        monto_recibido_efectivo: 10_000,
        devolucion_exceso_metodo: 'domicilio',
      }),
    ).toEqual({
      monto_recibido_efectivo: 10_000,
      monto_transferencia_recibido: 50_000,
      vuelto_cliente_efectivo: 10_000,
      vuelto_cliente_transferencia: 0,
      pago_domiciliario: 2_000,
      pago_mesero: 0,
    });
  });

  it('mixto: vuelto por transferencia conserva efectivo en venta', () => {
    expect(
      calcularDetalleExcesoCobro({
        total: 48_000,
        metodo: 'mixto',
        monto_transferencia: 20_000,
        monto_recibido_efectivo: 33_000,
        devolucion_exceso_metodo: 'transferencia',
      }),
    ).toEqual({
      monto_recibido_efectivo: 33_000,
      monto_transferencia_recibido: 20_000,
      vuelto_cliente_efectivo: 0,
      vuelto_cliente_transferencia: 5_000,
      pago_domiciliario: 0,
      pago_mesero: 0,
    });
  });
});

describe('calcularVueltoCliente', () => {
  it('ignora domicilio/mesero (solo vuelto al cliente)', () => {
    expect(
      calcularVueltoCliente({
        total: 30_000,
        metodo: 'transferencia',
        monto_transferencia: 35_000,
        devolucion_exceso_metodo: 'domicilio',
      }),
    ).toBeNull();
  });
});

describe('lineasTicketExcesoCobro', () => {
  it('efectivo: VUELTO simple', () => {
    const d = calcularDetalleExcesoCobro({
      total: 25_000,
      metodo: 'efectivo',
      monto_recibido_efectivo: 50_000,
    })!;
    const lineas = lineasTicketExcesoCobro(d);
    expect(lineas.find((l) => l.etiqueta === 'VUELTO')).toEqual({
      etiqueta: 'VUELTO',
      monto: 25_000,
      destacado: true,
    });
  });

  it('domicilio: PAGO DOMICILIARIO simple', () => {
    const d = calcularDetalleExcesoCobro({
      total: 30_000,
      metodo: 'transferencia',
      monto_transferencia: 35_000,
      devolucion_exceso_metodo: 'domicilio',
    })!;
    expect(lineasTicketExcesoCobro(d).find((l) => l.etiqueta === 'PAGO DOMICILIARIO')).toEqual({
      etiqueta: 'PAGO DOMICILIARIO',
      monto: 5_000,
      destacado: true,
    });
  });

  it('mesero: PAGO MESERO simple', () => {
    const d = calcularDetalleExcesoCobro({
      total: 30_000,
      metodo: 'transferencia',
      monto_transferencia: 35_000,
      devolucion_exceso_metodo: 'mesero',
    })!;
    expect(lineasTicketExcesoCobro(d).find((l) => l.etiqueta === 'PAGO MESERO')).toEqual({
      etiqueta: 'PAGO MESERO',
      monto: 5_000,
      destacado: true,
    });
  });
});

describe('parseDetalleExcesoCobro', () => {
  it('parsea JSON persistido', () => {
    const raw = {
      monto_transferencia_recibido: 35_000,
      vuelto_cliente_efectivo: 0,
      vuelto_cliente_transferencia: 0,
      pago_domiciliario: 5_000,
      pago_mesero: 0,
    };
    expect(parseDetalleExcesoCobro(raw)?.pago_domiciliario).toBe(5_000);
  });
});
