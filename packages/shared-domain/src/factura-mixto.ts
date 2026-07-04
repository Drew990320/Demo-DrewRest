import {
  asignarCantidadesParaSubtotal,
  type LineaAsignableCobro,
} from './asignar-cobro-por-monto';
import type { DetalleCobroCantidad } from './cobro-parcial';

export type RepartirMixtoOpciones = {
  lineasPadre?: LineaAsignableCobro[];
  /** Convierte cantidades de líneas padre al neto cobrado (descuentos). */
  netoDeCantidades?: (cantidades: Record<number, number>) => number;
  /** Expande padres a solicitudes finales (empaques, etc.). */
  expandirCantidades?: (
    cantidades: Record<number, number>,
  ) => DetalleCobroCantidad[];
};

/** Límite de columna INTEGER en PostgreSQL (INT4). */
export const COBRO_MIXTO_GRUPO_MAX = 2_147_483_647;

export type RepartoMixtoTransferencia = {
  transferenciaFactura: number;
  efectivoFactura: number;
  excesoDevolverEfectivo: number;
};

/** Reparto de factura según cuánto transfirió el cliente (puede superar el total). */
export function repartoMixtoDesdeTransferencia(
  total: number,
  transferenciaReal: number,
): RepartoMixtoTransferencia {
  const t = Math.max(0, Math.round(total));
  const tr = Math.max(0, Math.round(transferenciaReal));
  if (t <= 0) {
    return { transferenciaFactura: 0, efectivoFactura: 0, excesoDevolverEfectivo: 0 };
  }
  if (tr >= t) {
    return {
      transferenciaFactura: t,
      efectivoFactura: 0,
      excesoDevolverEfectivo: tr - t,
    };
  }
  return {
    transferenciaFactura: tr,
    efectivoFactura: t - tr,
    excesoDevolverEfectivo: 0,
  };
}

/**
 * Si el vuelto se devuelve por transferencia, se conserva todo el efectivo en la
 * venta (cuadre de caja) y el exceso total sale por transferencia.
 * En cualquier otro caso se usa el reparto clásico (transferencia primero).
 */
export function repartoMixtoConDevolucion(
  total: number,
  transferenciaReal: number,
  efectivoRecibido: number,
  devolucionMetodo?: 'efectivo' | 'transferencia' | 'domicilio' | 'mesero' | null,
): RepartoMixtoTransferencia {
  const t = Math.max(0, Math.round(total));
  const tr = Math.max(0, Math.round(transferenciaReal));
  const ef = Math.max(0, Math.round(efectivoRecibido));
  const vueltoTotal = tr + ef - t;

  if (devolucionMetodo === 'transferencia' && t > 0 && vueltoTotal > 0) {
    const efectivoFactura = Math.min(ef, t);
    return {
      transferenciaFactura: t - efectivoFactura,
      efectivoFactura,
      excesoDevolverEfectivo: vueltoTotal,
    };
  }

  return repartoMixtoDesdeTransferencia(t, tr);
}

/** Resta cantidades ya asignadas a un cobro parcial. */
export function restarSolicitudesCobro(
  total: DetalleCobroCantidad[],
  parcial: DetalleCobroCantidad[],
): DetalleCobroCantidad[] {
  const usado = new Map(parcial.map((s) => [s.id_detalle, s.cantidad]));
  const out: DetalleCobroCantidad[] = [];
  for (const s of total) {
    const q = s.cantidad - (usado.get(s.id_detalle) ?? 0);
    if (q > 0) out.push({ id_detalle: s.id_detalle, cantidad: q });
  }
  return out;
}

function lineasDesdeSolicitudes(
  solicitudes: DetalleCobroCantidad[],
  precioUnitarioPorDetalle: Record<number, number>,
): LineaAsignableCobro[] {
  return solicitudes
    .map((s) => ({
      id_detalle: s.id_detalle,
      precio_unitario: Math.round(precioUnitarioPorDetalle[s.id_detalle] ?? 0),
      cantidad_pendiente: s.cantidad,
    }))
    .filter((l) => l.precio_unitario > 0 && l.cantidad_pendiente > 0);
}

function solicitudesDesdeCantidadesParciales(
  solicitudes: DetalleCobroCantidad[],
  cantidades: Record<number, number>,
): DetalleCobroCantidad[] {
  const efectivo: DetalleCobroCantidad[] = [];
  for (const s of solicitudes) {
    const qE = cantidades[s.id_detalle] ?? 0;
    if (qE > 0) efectivo.push({ id_detalle: s.id_detalle, cantidad: qE });
  }
  return efectivo;
}

function asegurarAmbosLadosMixto(
  solicitudes: DetalleCobroCantidad[],
  efectivo: DetalleCobroCantidad[],
  transferencia: DetalleCobroCantidad[],
  montoNetoEfectivo: number,
  totalNetoCompleto: number,
  lineas: LineaAsignableCobro[],
): { efectivo: DetalleCobroCantidad[]; transferencia: DetalleCobroCantidad[] } {
  if (montoNetoEfectivo <= 0 || montoNetoEfectivo >= totalNetoCompleto) {
    return { efectivo, transferencia };
  }

  let e = [...efectivo];
  let t = [...transferencia];
  const totalUnidades = solicitudes.reduce((s, x) => s + x.cantidad, 0);

  if (e.length === 0 && t.length > 0 && totalUnidades >= 2) {
    const linea = [...lineas].sort(
      (a, b) => a.precio_unitario - b.precio_unitario,
    )[0];
    if (linea) {
      e = [{ id_detalle: linea.id_detalle, cantidad: 1 }];
      t = restarSolicitudesCobro(solicitudes, e);
    }
  } else if (t.length === 0 && e.length > 0 && totalUnidades >= 2) {
    const candidato = [...e].sort((a, b) => {
      const pa =
        lineas.find((l) => l.id_detalle === a.id_detalle)?.precio_unitario ?? 0;
      const pb =
        lineas.find((l) => l.id_detalle === b.id_detalle)?.precio_unitario ?? 0;
      return pb - pa;
    })[0];
    if (candidato) {
      e = e
        .map((x) =>
          x.id_detalle === candidato.id_detalle
            ? { ...x, cantidad: x.cantidad - 1 }
            : x,
        )
        .filter((x) => x.cantidad > 0);
      t = restarSolicitudesCobro(solicitudes, e);
    }
  }

  return { efectivo: e, transferencia: t };
}

/**
 * Reparte ítems de un cobro entre factura efectivo y transferencia (mismo turno).
 */
export function dividirSolicitudesCobroMixto(
  solicitudes: DetalleCobroCantidad[],
  precioUnitarioPorDetalle: Record<number, number>,
  montoNetoEfectivo: number,
  totalNetoCompleto: number,
  opciones?: RepartirMixtoOpciones,
): {
  efectivo: DetalleCobroCantidad[];
  transferencia: DetalleCobroCantidad[];
} {
  if (montoNetoEfectivo <= 0) {
    return { efectivo: [], transferencia: [...solicitudes] };
  }
  if (montoNetoEfectivo >= totalNetoCompleto) {
    return { efectivo: [...solicitudes], transferencia: [] };
  }

  const lineas =
    opciones?.lineasPadre ?? lineasDesdeSolicitudes(solicitudes, precioUnitarioPorDetalle);

  if (lineas.length === 0) {
    return { efectivo: [], transferencia: [...solicitudes] };
  }

  const brutoTotal = lineas.reduce(
    (s, l) => s + l.precio_unitario * l.cantidad_pendiente,
    0,
  );
  let subBruto =
    totalNetoCompleto > 0 && brutoTotal > 0
      ? Math.round((montoNetoEfectivo / totalNetoCompleto) * brutoTotal)
      : montoNetoEfectivo;

  const netoDeCantidades =
    opciones?.netoDeCantidades ??
    ((cantidades: Record<number, number>) => {
      const parcial = solicitudesDesdeCantidadesParciales(solicitudes, cantidades);
      const bruto = parcial.reduce(
        (s, x) =>
          s +
          (precioUnitarioPorDetalle[x.id_detalle] ?? 0) * x.cantidad,
        0,
      );
      return Math.round(bruto);
    });

  const expandir =
    opciones?.expandirCantidades ??
    ((cantidades: Record<number, number>) =>
      solicitudesDesdeCantidadesParciales(solicitudes, cantidades));

  let cantidades = asignarCantidadesParaSubtotal(lineas, subBruto);
  let netoEfectivo = netoDeCantidades(cantidades);

  for (let i = 0; i < 14; i++) {
    if (Object.keys(cantidades).length === 0) break;
    if (netoEfectivo > 0 && netoEfectivo <= montoNetoEfectivo) break;
    if (netoEfectivo > montoNetoEfectivo) {
      subBruto = Math.max(
        0,
        Math.round(subBruto * (montoNetoEfectivo / netoEfectivo) * 0.97),
      );
    } else {
      subBruto = Math.min(brutoTotal, Math.round(subBruto * 1.04));
    }
    cantidades = asignarCantidadesParaSubtotal(lineas, subBruto);
    netoEfectivo = netoDeCantidades(cantidades);
  }

  let efectivo = expandir(cantidades);
  let transferencia = restarSolicitudesCobro(solicitudes, efectivo);

  ({ efectivo, transferencia } = asegurarAmbosLadosMixto(
    solicitudes,
    efectivo,
    transferencia,
    montoNetoEfectivo,
    totalNetoCompleto,
    lineas,
  ));

  if (efectivo.length === 0 && transferencia.length === 0) {
    return { efectivo: [], transferencia: [...solicitudes] };
  }

  return { efectivo, transferencia };
}

export type FacturaMixtoRef = {
  id_factura: number;
  metodo_pago: string;
  persona_plan_indice?: number | null;
  cobro_mixto_grupo?: number | null;
  total: number;
  /** Permite emparejar mixtos antiguos sin cobro_mixto_grupo al reimprimir. */
  emitida_en?: string | Date;
};

function mismoInstanteCobro(
  a: string | Date | undefined,
  b: string | Date | undefined,
): boolean {
  if (!a || !b) return false;
  return new Date(a).getTime() === new Date(b).getTime();
}

/**
 * ID de grupo para cobrar efectivo + transferencia en la misma operación.
 * Debe caber en INT4 de PostgreSQL (no usar Date.now() en milisegundos).
 */
export function nuevoCobroMixtoGrupo(nowMs: number = Date.now()): number {
  const sec = Math.floor(nowMs / 1000);
  const salt = Math.floor(Math.random() * 1000);
  const id = sec + salt;
  if (id <= COBRO_MIXTO_GRUPO_MAX) return id;
  return (sec % 2_000_000_000) + salt + 1;
}

export function cobroMixtoGrupoValido(
  value: number | null | undefined,
): value is number {
  return (
    value != null &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= COBRO_MIXTO_GRUPO_MAX
  );
}

export function esGrupoPagoMixto(facturas: FacturaMixtoRef[]): boolean {
  if (facturas.length < 2) return false;
  const metodos = new Set(facturas.map((f) => f.metodo_pago));
  return metodos.has('efectivo') && metodos.has('transferencia');
}

function parMixtoSinGrupo<T extends FacturaMixtoRef>(
  facturas: T[],
  actual: T,
): T[] | null {
  if (actual.cobro_mixto_grupo != null || !actual.emitida_en) return null;
  const opuesto =
    actual.metodo_pago === 'efectivo' ? 'transferencia' : 'efectivo';
  const hermano = facturas.find(
    (f) =>
      f.id_factura !== actual.id_factura &&
      f.cobro_mixto_grupo == null &&
      mismoInstanteCobro(f.emitida_en, actual.emitida_en) &&
      f.metodo_pago === opuesto,
  );
  if (!hermano) return null;
  const par = [actual, hermano];
  return esGrupoPagoMixto(par) ? par : null;
}

/**
 * Facturas que forman una misma tanda de cobro a partir de una factura.
 * - Mixto: ambas patas (cobro_mixto_grupo o persona del plan).
 * - Simple: solo esa factura.
 */
export function facturasDeTandaCobro<T extends FacturaMixtoRef>(
  facturas: T[],
  idFactura: number,
): T[] {
  const actual = facturas.find((f) => f.id_factura === idFactura);
  if (!actual) return [];
  return agruparFacturasMixto(facturas, actual);
}

/** Facturas del mismo cobro mixto (mismo grupo o misma persona del plan). */
export function agruparFacturasMixto<T extends FacturaMixtoRef>(
  facturas: T[],
  actual: T,
): T[] {
  if (actual.cobro_mixto_grupo != null) {
    const porGrupo = facturas.filter(
      (f) => f.cobro_mixto_grupo === actual.cobro_mixto_grupo,
    );
    if (esGrupoPagoMixto(porGrupo)) return porGrupo;
  }
  if (actual.persona_plan_indice != null && actual.persona_plan_indice > 0) {
    const porPersona = facturas.filter(
      (f) => f.persona_plan_indice === actual.persona_plan_indice,
    );
    if (esGrupoPagoMixto(porPersona)) return porPersona;
  }
  const parSinGrupo = parMixtoSinGrupo(facturas, actual);
  if (parSinGrupo) return parSinGrupo;
  return [actual];
}

export function cobrosResumenMixto(
  facturas: FacturaMixtoRef[],
): { metodo_pago: 'efectivo' | 'transferencia'; total: number }[] {
  const orden = ['efectivo', 'transferencia'] as const;
  return orden
    .map((metodo) => {
      const total = facturas
        .filter((f) => f.metodo_pago === metodo)
        .reduce((s, f) => s + f.total, 0);
      return total > 0 ? { metodo_pago: metodo, total } : null;
    })
    .filter(
      (
        x,
      ): x is { metodo_pago: 'efectivo' | 'transferencia'; total: number } =>
        x != null,
    );
}

/** Suma varios cobros parciales en una línea por método (ticket total del pedido). */
export function consolidarCobrosResumenPorMetodo(
  cobros: { metodo_pago: 'efectivo' | 'transferencia'; total: number }[],
): { metodo_pago: 'efectivo' | 'transferencia'; total: number }[] {
  const orden = ['efectivo', 'transferencia'] as const;
  return orden
    .map((metodo) => {
      const total = cobros
        .filter((c) => c.metodo_pago === metodo)
        .reduce((s, c) => s + c.total, 0);
      return total > 0 ? { metodo_pago: metodo, total } : null;
    })
    .filter(
      (
        x,
      ): x is { metodo_pago: 'efectivo' | 'transferencia'; total: number } =>
        x != null,
    );
}

export type CobroVista<T extends FacturaMixtoRef> =
  | { tipo: 'simple'; cobro: T }
  | { tipo: 'mixto'; cobros: T[]; key: string };

/** Agrupa cobros mixtos para mostrar una sola fila en UI e impresión. */
export function agruparCobrosVista<T extends FacturaMixtoRef>(
  cobros: T[],
): CobroVista<T>[] {
  const vistas: CobroVista<T>[] = [];
  const procesadas = new Set<number>();

  for (const cobro of cobros) {
    if (procesadas.has(cobro.id_factura)) continue;
    const grupo = agruparFacturasMixto(cobros, cobro);
    if (grupo.length > 1 && esGrupoPagoMixto(grupo)) {
      for (const g of grupo) procesadas.add(g.id_factura);
      const key =
        cobro.cobro_mixto_grupo != null
          ? `mixto-${cobro.cobro_mixto_grupo}`
          : `mixto-p${cobro.persona_plan_indice}-f${cobro.id_factura}`;
      vistas.push({ tipo: 'mixto', cobros: grupo, key });
    } else {
      procesadas.add(cobro.id_factura);
      vistas.push({ tipo: 'simple', cobro });
    }
  }

  return vistas;
}

/** Una id_factura por cobro lógico (evita imprimir el mismo ticket mixto dos veces). */
export function facturasIdsImpresionUnica<T extends FacturaMixtoRef>(
  facturas: T[],
): number[] {
  return agruparCobrosVista(facturas).map((v) =>
    v.tipo === 'mixto'
      ? Math.min(...v.cobros.map((c) => c.id_factura))
      : v.cobro.id_factura,
  );
}

export type CobroResumenPedidoTotal = {
  metodo_pago: 'efectivo' | 'transferencia' | 'mixto';
  total: number;
};

/** Resumen de cobros de un pedido para ticket total (agrupa mixtos). */
export function resumenCobrosPedidoTotal<T extends FacturaMixtoRef>(
  facturas: T[],
): {
  cobros: CobroResumenPedidoTotal[];
  metodo_pago?: 'efectivo' | 'transferencia' | 'mixto';
  cobros_resumen?: { metodo_pago: 'efectivo' | 'transferencia'; total: number }[];
} {
  const vistas = agruparCobrosVista(facturas);
  const cobros: CobroResumenPedidoTotal[] = vistas.map((v) => {
    if (v.tipo === 'mixto') {
      const desglose = cobrosResumenMixto(v.cobros);
      return {
        metodo_pago: 'mixto' as const,
        total: desglose.reduce((s, d) => s + d.total, 0),
      };
    }
    return {
      metodo_pago: v.cobro.metodo_pago as 'efectivo' | 'transferencia',
      total: v.cobro.total,
    };
  });

  if (vistas.length === 1 && vistas[0].tipo === 'mixto') {
    return {
      cobros,
      metodo_pago: 'mixto',
      cobros_resumen: cobrosResumenMixto(vistas[0].cobros),
    };
  }

  if (vistas.length === 1 && vistas[0].tipo === 'simple') {
    const m = vistas[0].cobro.metodo_pago as 'efectivo' | 'transferencia';
    return {
      cobros,
      metodo_pago: m,
      cobros_resumen: undefined,
    };
  }

  const cobros_resumen: { metodo_pago: 'efectivo' | 'transferencia'; total: number }[] =
    [];
  for (const v of vistas) {
    if (v.tipo === 'mixto') {
      cobros_resumen.push(...cobrosResumenMixto(v.cobros));
    } else {
      cobros_resumen.push({
        metodo_pago: v.cobro.metodo_pago as 'efectivo' | 'transferencia',
        total: v.cobro.total,
      });
    }
  }

  return { cobros, cobros_resumen: consolidarCobrosResumenPorMetodo(cobros_resumen) };
}
