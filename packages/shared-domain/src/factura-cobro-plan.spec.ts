import { subtotalDesdeSolicitudes } from './cobro-parcial';
import {
  asignacionCobroCombinado,
  asignacionCobroPersonaPlan,
  asignacionCobroPorPersonasPendiente,
  contarCobrosPlanHechos,
  firmaCantidadesPlan,
  lineasAsignablesCobroPlan,
  personaPlanYaCobradaEnSlice,
  resumenSaldoPlanCombinado,
} from './factura-cobro-plan';
import { repartirMontoEnCop } from './repartir-monto-cop';

const serial = [
  { id_detalle: 10, id_detalle_padre: null, cobrado: false, cantidad: 2 },
  { id_detalle: 11, id_detalle_padre: null, cobrado: false, cantidad: 1 },
  { id_detalle: 12, id_detalle_padre: null, cobrado: false, cantidad: 1 },
];

const detalles = [
  {
    id_detalle: 10,
    id_detalle_padre: null,
    cobrado: false,
    precio_unitario: 24_000,
    cantidad: 2,
  },
  {
    id_detalle: 11,
    id_detalle_padre: null,
    cobrado: false,
    precio_unitario: 18_000,
    cantidad: 1,
  },
  {
    id_detalle: 12,
    id_detalle_padre: null,
    cobrado: false,
    precio_unitario: 12_000,
    cantidad: 1,
  },
];

const totalNeto = (solicitudes: { id_detalle: number; cantidad: number }[]) =>
  subtotalDesdeSolicitudes(detalles, solicitudes);

const lineasPlatos = lineasAsignablesCobroPlan({
  detalles,
  pendienteDetalle: (id) => detalles.find((d) => d.id_detalle === id)?.cantidad ?? 0,
  modoDividir: 'platos',
  dividirCuenta: true,
  cantidadesCobro: { 10: 1, 11: 1 },
});

describe('factura-cobro-plan — resumen y conteo del plan', () => {
  it('resumenSaldoPlanCombinado con cuota omitida', () => {
    const planMontos = repartirMontoEnCop(66_000, 3);
    const resumen = resumenSaldoPlanCombinado({
      planBaseTotal: 66_000,
      facturasSlice: [{ total: planMontos[0] }],
      planMontos,
      personasOmitidas: [2],
    });
    expect(resumen.cobrado).toBe(planMontos[0]);
    expect(resumen.saldoOmitido).toBe(planMontos[1]);
    expect(resumen.saldoRestante).toBe(66_000 - planMontos[0]);
  });

  it('contarCobrosPlanHechos por persona_plan_indice', () => {
    const facturas = [
      { persona_plan_indice: 1 },
      { persona_plan_indice: 2 },
      { persona_plan_indice: null },
    ];
    expect(contarCobrosPlanHechos(facturas, 0)).toBe(2);
  });

  it('contarCobrosPlanHechos agrupa mixto como un cobro', () => {
    const facturas = [
      { cobro_mixto_grupo: 99, persona_plan_indice: null },
      { cobro_mixto_grupo: 99, persona_plan_indice: null },
      { cobro_mixto_grupo: null, persona_plan_indice: null },
    ];
    expect(contarCobrosPlanHechos(facturas, 0)).toBe(2);
  });

  it('personaPlanYaCobradaEnSlice', () => {
    const facturas = [{ persona_plan_indice: 1 }, { persona_plan_indice: 2 }];
    expect(personaPlanYaCobradaEnSlice(facturas, 0, 1)).toBe(true);
    expect(personaPlanYaCobradaEnSlice(facturas, 0, 3)).toBe(false);
  });

  it('firmaCantidadesPlan es estable y ordenada', () => {
    expect(firmaCantidadesPlan({ 12: 1, 10: 2 })).toBe(
      firmaCantidadesPlan({ 10: 2, 12: 1 }),
    );
  });
});

describe('factura-cobro-plan — modo platos (selección +/−)', () => {
  it('lineasAsignablesCobroPlan limita al pool marcado', () => {
    expect(lineasPlatos).toEqual([
      { id_detalle: 10, precio_unitario: 24_000, cantidad_pendiente: 1 },
      { id_detalle: 11, precio_unitario: 18_000, cantidad_pendiente: 1 },
    ]);
  });

  it('asignacionCobroPersonaPlan platos respeta monto parcial', () => {
    const monto = 30_000;
    const asig = asignacionCobroPersonaPlan({
      montoNeto: monto,
      modoDividir: 'platos',
      totalReferencia: 42_000,
      lineasAsignables: lineasPlatos,
      serial,
      totalNeto,
    });
    expect(asig).not.toBeNull();
    expect(asig!.total).toBeLessThanOrEqual(monto);
    expect(asig!.total).toBeGreaterThan(0);
  });
});

describe('factura-cobro-plan — modo personas (reparto igual)', () => {
  const lineas = lineasAsignablesCobroPlan({
    detalles,
    pendienteDetalle: (id) => detalles.find((d) => d.id_detalle === id)?.cantidad ?? 0,
    modoDividir: 'personas',
    dividirCuenta: true,
    cantidadesCobro: {},
  });

  const totalPedido = totalNeto(
    lineas.flatMap((l) => [{ id_detalle: l.id_detalle, cantidad: l.cantidad_pendiente }]),
  );
  const cuotas = repartirMontoEnCop(totalPedido, 3);

  it('primera persona no excede su cuota', () => {
    const asig = asignacionCobroPorPersonasPendiente(
      cuotas[0],
      0,
      3,
      lineas,
      serial,
      totalNeto,
    );
    expect(asig).not.toBeNull();
    expect(asig!.total).toBeLessThanOrEqual(cuotas[0]);
  });

  it('última persona absorbe el remanente de platos', () => {
    const asig = asignacionCobroPorPersonasPendiente(
      cuotas[2],
      2,
      3,
      lineas,
      serial,
      totalNeto,
    );
    expect(asig).not.toBeNull();
    expect(Object.values(asig!.cantidades).reduce((s, q) => s + q, 0)).toBeGreaterThan(0);
  });
});

describe('factura-cobro-plan — modo combinado', () => {
  const lineasCombinado = lineasAsignablesCobroPlan({
    detalles: [detalles[1]],
    pendienteDetalle: () => 1,
    modoDividir: 'combinado',
    dividirCuenta: true,
    cantidadesCobro: { 11: 1 },
  });

  it('menos unidades que personas: cuota fija sin partir platos', () => {
    const cuota = 9_000;
    const asig = asignacionCobroCombinado(
      cuota,
      0,
      3,
      lineasCombinado,
      serial.filter((s) => s.id_detalle === 11),
      totalNeto,
    );
    expect(asig).not.toBeNull();
    expect(asig!.total).toBe(cuota);
    expect(asig!.cantidades[11]).toBe(1);
  });

  it('asignacionCobroPersonaPlan combinado delega correctamente', () => {
    const asig = asignacionCobroPersonaPlan({
      montoNeto: 12_000,
      modoDividir: 'combinado',
      totalReferencia: 18_000,
      lineasAsignables: lineasCombinado,
      serial: serial.filter((s) => s.id_detalle === 11),
      totalNeto,
      personaIndice: 0,
      totalPersonas: 2,
    });
    expect(asig).not.toBeNull();
    expect(asig!.total).toBeLessThanOrEqual(12_000);
  });
});
