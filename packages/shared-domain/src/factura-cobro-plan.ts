import { asignarCantidadesParaSubtotal } from './asignar-cobro-por-monto';
import {
  expandirSolicitudesConEmpaques,
  ordenarSolicitudesCobro,
  type DetalleCobroCantidad,
  type DetalleSerialCobro,
} from './cobro-parcial';

export type ModoDividirCuenta = 'platos' | 'personas' | 'combinado';

export type FacturaPlanSlice = {
  persona_plan_indice?: number | null;
  cobro_mixto_grupo?: number | null;
};

/** Facturas del plan actual (desde facturasBasePlan). */
export type ResumenSaldoPlan = {
  cobrado: number;
  saldoRestante: number;
  saldoOmitido: number;
};

/** Saldo del reparto combinado/por personas (cuotas omitidas quedan como pendiente). */
export function resumenSaldoPlanCombinado(opts: {
  planBaseTotal: number;
  facturasSlice: { total: number }[];
  planMontos: number[];
  personasOmitidas: number[];
}): ResumenSaldoPlan {
  const cobrado = opts.facturasSlice.reduce((s, f) => s + f.total, 0);
  const saldoRestante = Math.max(0, Math.round(opts.planBaseTotal) - cobrado);
  const saldoOmitido = opts.personasOmitidas.reduce(
    (s, i) => s + (opts.planMontos[i] ?? 0),
    0,
  );
  return { cobrado, saldoRestante, saldoOmitido };
}

export function contarCobrosPlanHechos(
  facturas: FacturaPlanSlice[],
  base: number,
): number {
  const slice = facturas.slice(base);
  const indices = new Set(
    slice
      .map((f) => f.persona_plan_indice)
      .filter((x): x is number => typeof x === 'number' && x > 0),
  );
  if (indices.size > 0) return indices.size;

  const gruposMixto = new Set(
    slice
      .map((f) => f.cobro_mixto_grupo)
      .filter((x): x is number => typeof x === 'number' && x > 0),
  );
  if (gruposMixto.size > 0) {
    const sinGrupo = slice.filter(
      (f) => f.cobro_mixto_grupo == null || f.cobro_mixto_grupo <= 0,
    ).length;
    return gruposMixto.size + sinGrupo;
  }
  return slice.length;
}

export function firmaCantidadesPlan(cantidades: Record<number, number>): string {
  return JSON.stringify(
    Object.entries(cantidades)
      .filter(([, q]) => q > 0)
      .sort(([a], [b]) => Number(a) - Number(b)),
  );
}

export function personaPlanYaCobradaEnSlice(
  facturas: FacturaPlanSlice[],
  base: number,
  planIdx: number,
): boolean {
  return facturas.slice(base).some((f) => f.persona_plan_indice === planIdx);
}

export type LineaAsignablePlan = {
  id_detalle: number;
  precio_unitario: number;
  cantidad_pendiente: number;
};

export type AsignacionCobro = {
  cantidades: Record<number, number>;
  total: number;
  solicitudes: DetalleCobroCantidad[];
};

export function lineasAsignablesCobroPlan(opts: {
  detalles: {
    id_detalle: number;
    id_detalle_padre: number | null;
    cobrado?: boolean;
    es_cuota_pendiente_reparto?: boolean;
    precio_unitario: number;
    cantidad: number;
  }[];
  pendienteDetalle: (id: number) => number;
  modoDividir: ModoDividirCuenta;
  dividirCuenta: boolean;
  cantidadesCobro: Record<number, number>;
}): LineaAsignablePlan[] {
  return opts.detalles
    .filter(
      (d) =>
        d.id_detalle_padre == null &&
        !d.cobrado &&
        !d.es_cuota_pendiente_reparto,
    )
    .map((d) => {
      const pend = opts.pendienteDetalle(d.id_detalle);
      const enPool =
        opts.modoDividir === 'combinado' ||
        (opts.dividirCuenta && opts.modoDividir === 'platos')
          ? Math.min(pend, opts.cantidadesCobro[d.id_detalle] ?? 0)
          : pend;
      return {
        id_detalle: d.id_detalle,
        precio_unitario: d.precio_unitario,
        cantidad_pendiente: enPool,
      };
    })
    .filter((l) => l.cantidad_pendiente > 0);
}

export function resolverSolicitudesDesdeCantidadesPlan(
  serial: DetalleSerialCobro[],
  cantidades: Record<number, number>,
): DetalleCobroCantidad[] {
  const base = Object.entries(cantidades)
    .filter(([, q]) => q > 0)
    .map(([id, cantidad]) => ({
      id_detalle: Number(id),
      cantidad,
    }));
  if (base.length === 0) return [];
  try {
    return ordenarSolicitudesCobro(
      serial,
      expandirSolicitudesConEmpaques(serial, base),
    );
  } catch {
    return [];
  }
}

/**
 * Reparto en modo combinado: ítems marcados con +/− y monto dividido entre N personas.
 * Si hay menos unidades que personas, cada uno paga su cuota y el API divide el precio del ítem.
 * Con más unidades, se asignan ítems hasta la cuota en pesos (no por conteo de unidades).
 */
export function asignacionCobroCombinado(
  montoNeto: number,
  personaIndice: number,
  totalPersonas: number,
  lineasAsignables: LineaAsignablePlan[],
  serial: DetalleSerialCobro[],
  totalNeto: (solicitudes: DetalleCobroCantidad[]) => number,
): AsignacionCobro | null {
  const lineas = lineasAsignables.filter((l) => l.precio_unitario > 0);
  if (lineas.length === 0 || montoNeto <= 0 || totalPersonas < 1) return null;

  const totalUnidades = lineas.reduce((s, l) => s + l.cantidad_pendiente, 0);
  if (totalUnidades < 1) return null;

  if (totalUnidades < totalPersonas) {
    const cantidades = Object.fromEntries(
      lineas.map((l) => [l.id_detalle, l.cantidad_pendiente]),
    );
    const solicitudes = resolverSolicitudesDesdeCantidadesPlan(serial, cantidades);
    if (solicitudes.length === 0) return null;
    return { cantidades, total: montoNeto, solicitudes };
  }

  return asignacionCobroPorPersonasPendiente(
    montoNeto,
    personaIndice,
    totalPersonas,
    lineas,
    serial,
    totalNeto,
    false,
  );
}

export function asignacionCobroPorPersonasPendiente(
  montoNeto: number,
  personaIndice: number,
  totalPersonas: number,
  lineasAsignables: LineaAsignablePlan[],
  serial: DetalleSerialCobro[],
  totalNeto: (solicitudes: DetalleCobroCantidad[]) => number,
  soloCuota = false,
): AsignacionCobro | null {
  const lineas = lineasAsignables.filter((l) => l.precio_unitario > 0);
  if (lineas.length === 0 || montoNeto <= 0) return null;

  const esUltimaPersona = !soloCuota && personaIndice >= totalPersonas - 1;
  let cantidades: Record<number, number>;

  if (esUltimaPersona) {
    cantidades = Object.fromEntries(
      lineas.map((l) => [l.id_detalle, l.cantidad_pendiente]),
    );
    const solicitudes = resolverSolicitudesDesdeCantidadesPlan(serial, cantidades);
    if (solicitudes.length === 0) return null;
    return { cantidades, total: totalNeto(solicitudes), solicitudes };
  }

  const brutoPendiente = lineas.reduce(
    (s, l) => s + l.precio_unitario * l.cantidad_pendiente,
    0,
  );
  const solicitudesPendientes = resolverSolicitudesDesdeCantidadesPlan(
    serial,
    Object.fromEntries(lineas.map((l) => [l.id_detalle, l.cantidad_pendiente])),
  );
  const totalPendienteNeto = totalNeto(solicitudesPendientes);
  let subBruto =
    totalPendienteNeto > 0 && brutoPendiente > 0
      ? Math.round((montoNeto / totalPendienteNeto) * brutoPendiente)
      : montoNeto;

  for (let i = 0; i < 10; i++) {
    cantidades = asignarCantidadesParaSubtotal(lineas, subBruto);
    if (Object.keys(cantidades).length === 0) break;
    const solicitudes = resolverSolicitudesDesdeCantidadesPlan(serial, cantidades);
    if (solicitudes.length === 0) break;
    const total = totalNeto(solicitudes);
    if (total <= montoNeto) {
      return { cantidades, total, solicitudes };
    }
    subBruto = Math.max(0, Math.round(subBruto * (montoNeto / total) * 0.98));
    if (subBruto <= 0) break;
  }

  cantidades = asignarCantidadesParaSubtotal(lineas, subBruto);
  if (Object.keys(cantidades).length === 0) return null;
  const solicitudes = resolverSolicitudesDesdeCantidadesPlan(serial, cantidades);
  if (solicitudes.length === 0) return null;
  const total = totalNeto(solicitudes);
  if (total > montoNeto) return null;
  return { cantidades, total, solicitudes };
}

export function asignacionCobroPersonaPlan(opts: {
  montoNeto: number;
  modoDividir: ModoDividirCuenta;
  totalReferencia: number;
  lineasAsignables: LineaAsignablePlan[];
  serial: DetalleSerialCobro[];
  totalNeto: (solicitudes: DetalleCobroCantidad[]) => number;
  personaIndice?: number;
  totalPersonas?: number;
  soloCuota?: boolean;
}): AsignacionCobro | null {
  const { montoNeto, modoDividir, totalReferencia, lineasAsignables, serial, totalNeto } =
    opts;
  if (montoNeto <= 0) return null;

  if (modoDividir === 'combinado') {
    const personaIndice = opts.personaIndice ?? 0;
    const totalPersonas = opts.totalPersonas ?? 1;
    if (totalPersonas < 1) return null;
    return asignacionCobroCombinado(
      montoNeto,
      personaIndice,
      totalPersonas,
      lineasAsignables,
      serial,
      totalNeto,
    );
  }

  if (modoDividir === 'personas') {
    const personaIndice = opts.personaIndice ?? 0;
    const totalPersonas = opts.totalPersonas ?? 1;
    if (totalPersonas < 1) return null;
    return asignacionCobroPorPersonasPendiente(
      montoNeto,
      personaIndice,
      totalPersonas,
      lineasAsignables,
      serial,
      totalNeto,
      opts.soloCuota ?? false,
    );
  }

  if (lineasAsignables.length === 0) return null;

  const brutoPendiente = lineasAsignables.reduce(
    (s, l) => s + l.precio_unitario * l.cantidad_pendiente,
    0,
  );
  let subBruto =
    totalReferencia > 0 && brutoPendiente > 0
      ? Math.round((montoNeto / totalReferencia) * brutoPendiente)
      : montoNeto;

  let cantidades: Record<number, number> = {};
  let solicitudes: DetalleCobroCantidad[] = [];
  let total = 0;

  if (opts.soloCuota) {
    cantidades = asignarCantidadesParaSubtotal(lineasAsignables, subBruto);
    if (Object.keys(cantidades).length === 0) {
      const linea = [...lineasAsignables].sort(
        (a, b) => b.precio_unitario - a.precio_unitario,
      )[0];
      if (linea) cantidades = { [linea.id_detalle]: 1 };
    }
    solicitudes = resolverSolicitudesDesdeCantidadesPlan(serial, cantidades);
    if (solicitudes.length === 0) return null;
    return { cantidades, total: totalNeto(solicitudes), solicitudes };
  }

  for (let i = 0; i < 10; i++) {
    cantidades = asignarCantidadesParaSubtotal(lineasAsignables, subBruto);
    if (Object.keys(cantidades).length === 0) break;
    solicitudes = resolverSolicitudesDesdeCantidadesPlan(serial, cantidades);
    if (solicitudes.length === 0) break;
    total = totalNeto(solicitudes);
    if (total <= montoNeto) {
      return { cantidades, total, solicitudes };
    }
    subBruto = Math.max(0, Math.round(subBruto * (montoNeto / total) * 0.98));
    if (subBruto <= 0) break;
  }

  if (Object.keys(cantidades).length === 0 || solicitudes.length === 0) return null;
  if (total > montoNeto) return null;
  return { cantidades, total, solicitudes };
}
