import {
  SALDO_RESTANTE_NOTA,
  distribuirSaldoEnPlatos,
  esDetalleSaldoRestante,
  esNotaSaldoAbono,
  esNotaSaldoRestantePendiente,
  formatSaldoRestanteNota,
  montoSaldoRestantePendiente,
  notaDisplaySaldoPendiente,
  parseSaldoRestantePool,
  saldoNecesitaReconciliarAPlatos,
} from './saldo-restante';

describe('saldo-restante — notas y pool combinado', () => {
  it('detecta nota saldo pendiente total y con pool', () => {
    expect(esNotaSaldoRestantePendiente('saldo_restante')).toBe(true);
    expect(esNotaSaldoRestantePendiente('saldo_restante@1:2,5:1')).toBe(true);
    expect(esNotaSaldoRestantePendiente('saldo_restante#fragmento')).toBe(true);
    expect(esNotaSaldoRestantePendiente('otro')).toBe(false);
  });

  it('formatSaldoRestanteNota y parseSaldoRestantePool son inversos', () => {
    const pool = [
      { id_detalle: 1, cantidad: 2 },
      { id_detalle: 5, cantidad: 1 },
    ];
    const nota = formatSaldoRestanteNota(pool);
    expect(nota).toBe('saldo_restante@1:2,5:1');
    expect(parseSaldoRestantePool(nota)).toEqual(pool);
    expect(parseSaldoRestantePool(SALDO_RESTANTE_NOTA)).toBeNull();
  });

  it('notaDisplaySaldoPendiente muestra nombres del pool', () => {
    const label = notaDisplaySaldoPendiente('saldo_restante@10:2,12:1', {
      10: 'Picada',
      12: 'Gaseosa',
    });
    expect(label).toBe('Reparto de: 2× Picada, Gaseosa');
  });

  it('esNotaSaldoAbono detecta abonos ligados a factura', () => {
    expect(esNotaSaldoAbono('saldo_restante:abono:42')).toBe(true);
    expect(esNotaSaldoAbono('saldo_restante')).toBe(false);
  });

  it('esDetalleSaldoRestante por nota o producto interno', () => {
    expect(
      esDetalleSaldoRestante({
        nota_cocina: 'saldo_restante',
        nombre_producto: 'Otro',
      }),
    ).toBe(true);
    expect(
      esDetalleSaldoRestante({
        es_cuota_pendiente_reparto: true,
        nombre_producto: 'Saldo pendiente',
      }),
    ).toBe(true);
  });
});

describe('saldo-restante — monto pendiente en factura dividida', () => {
  it('montoSaldoRestantePendiente solo líneas no cobradas', () => {
    const monto = montoSaldoRestantePendiente([
      {
        cobrado: false,
        nota_cocina: 'saldo_restante',
        precio_unitario: 25_000,
        cantidad: 1,
      },
      {
        cobrado: true,
        nota_cocina: 'saldo_restante',
        precio_unitario: 10_000,
        cantidad: 1,
      },
      {
        cobrado: false,
        nota_cocina: null,
        precio_unitario: 15_000,
        cantidad: 1,
      },
    ]);
    expect(monto).toBe(25_000);
  });
});

describe('saldo-restante — distribuir abono en platos enteros', () => {
  const platos = [
    { id_detalle: 1, precio_unitario: 100_000, cantidad: 3 },
    { id_detalle: 2, precio_unitario: 50_000, cantidad: 2 },
  ];

  it('libera platos enteros priorizando mayor precio', () => {
    const dist = distribuirSaldoEnPlatos(150_000, platos);
    expect(dist.liberaciones).toEqual([
      { id_detalle: 1, cantidad: 1 },
      { id_detalle: 2, cantidad: 1 },
    ]);
    expect(dist.montoPlatos).toBe(150_000);
    expect(dist.montoSaldoRestante).toBe(0);
  });

  it('agota saldo con varias unidades del mismo plato', () => {
    const dist = distribuirSaldoEnPlatos(250_000, platos);
    expect(dist.liberaciones).toEqual([
      { id_detalle: 1, cantidad: 2 },
      { id_detalle: 2, cantidad: 1 },
    ]);
    expect(dist.montoSaldoRestante).toBe(0);
  });

  it('saldo menor que el plato más barato queda como remanente', () => {
    const dist = distribuirSaldoEnPlatos(30_000, platos);
    expect(dist.liberaciones).toEqual([]);
    expect(dist.montoSaldoRestante).toBe(30_000);
  });

  it('saldoNecesitaReconciliarAPlatos cuando platos valen más que el saldo', () => {
    expect(saldoNecesitaReconciliarAPlatos(50_000, platos)).toBe(true);
    expect(saldoNecesitaReconciliarAPlatos(500_000, platos)).toBe(false);
  });
});
