import { repartoMixtoConDevolucion } from './factura-mixto';

export type DevolucionExcesoMetodo =
  | 'efectivo'
  | 'transferencia'
  | 'domicilio'
  | 'mesero';

/** Snapshot persistido al cobrar: instrucciones operativas para mesero/caja. */
export type DetalleExcesoCobro = {
  monto_recibido_efectivo?: number;
  monto_transferencia_recibido?: number;
  vuelto_cliente_efectivo: number;
  vuelto_cliente_transferencia: number;
  pago_domiciliario: number;
  pago_mesero: number;
};

export type LineaTicketExcesoCobro = {
  etiqueta: string;
  monto: number;
  /** Línea resumen en negrita (VUELTO, PAGO DOMICILIARIO, etc.). */
  destacado?: boolean;
};

export type CalcularDetalleExcesoCobroInput = {
  total: number;
  metodo: 'efectivo' | 'transferencia' | 'mixto';
  monto_recibido_efectivo?: number | null;
  monto_transferencia?: number | null;
  devolucion_exceso_metodo?: DevolucionExcesoMetodo | null;
};

/** @deprecated Usar DetalleExcesoCobro en tickets nuevos. */
export type VueltoClienteInfo = {
  monto_recibido_efectivo?: number;
  monto_transferencia_recibido?: number;
  vuelto_total: number;
  vuelto_efectivo: number;
  vuelto_transferencia: number;
};

export type CalcularVueltoClienteInput = CalcularDetalleExcesoCobroInput;

export function detalleExcesoCobroActivo(d: DetalleExcesoCobro): boolean {
  return (
    d.vuelto_cliente_efectivo > 0 ||
    d.vuelto_cliente_transferencia > 0 ||
    d.pago_domiciliario > 0 ||
    d.pago_mesero > 0
  );
}

export function parseDetalleExcesoCobro(raw: unknown): DetalleExcesoCobro | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const num = (k: string) => {
    const v = o[k];
    return typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : 0;
  };
  const opt = (k: string) => {
    const v = o[k];
    return typeof v === 'number' && Number.isFinite(v) && v > 0
      ? Math.round(v)
      : undefined;
  };
  const d: DetalleExcesoCobro = {
    monto_recibido_efectivo: opt('monto_recibido_efectivo'),
    monto_transferencia_recibido: opt('monto_transferencia_recibido'),
    vuelto_cliente_efectivo: num('vuelto_cliente_efectivo'),
    vuelto_cliente_transferencia: num('vuelto_cliente_transferencia'),
    pago_domiciliario: num('pago_domiciliario'),
    pago_mesero: num('pago_mesero'),
  };
  return detalleExcesoCobroActivo(d) ||
    d.monto_recibido_efectivo != null ||
    d.monto_transferencia_recibido != null
    ? d
    : null;
}

/** Totales simples para el ticket: una línea clara por acción. */
export function resumenesSimplesExcesoCobro(
  d: DetalleExcesoCobro,
): { etiqueta: string; monto: number }[] {
  const out: { etiqueta: string; monto: number }[] = [];
  const vueltoCliente =
    d.vuelto_cliente_efectivo + d.vuelto_cliente_transferencia;
  if (vueltoCliente > 0) {
    out.push({ etiqueta: 'VUELTO', monto: vueltoCliente });
  }
  if (d.pago_domiciliario > 0) {
    out.push({ etiqueta: 'PAGO DOMICILIARIO', monto: d.pago_domiciliario });
  }
  if (d.pago_mesero > 0) {
    out.push({ etiqueta: 'PAGO MESERO', monto: d.pago_mesero });
  }
  return out;
}

/** Líneas ordenadas para ticket impreso / correo. */
export function lineasTicketExcesoCobro(
  d: DetalleExcesoCobro,
): LineaTicketExcesoCobro[] {
  const out: LineaTicketExcesoCobro[] = [];
  if (d.monto_recibido_efectivo != null && d.monto_recibido_efectivo > 0) {
    out.push({
      etiqueta: 'Recibido efectivo',
      monto: d.monto_recibido_efectivo,
    });
  }
  if (
    d.monto_transferencia_recibido != null &&
    d.monto_transferencia_recibido > 0
  ) {
    out.push({
      etiqueta: 'Recibido transfer.',
      monto: d.monto_transferencia_recibido,
    });
  }
  for (const r of resumenesSimplesExcesoCobro(d)) {
    out.push({ ...r, destacado: true });
  }
  return out;
}

export function calcularDetalleExcesoCobro(
  params: CalcularDetalleExcesoCobroInput,
): DetalleExcesoCobro | null {
  const t = Math.max(0, Math.round(params.total));
  if (t <= 0) return null;
  const ef = Math.max(0, Math.round(params.monto_recibido_efectivo ?? 0));
  const tr = Math.max(0, Math.round(params.monto_transferencia ?? 0));
  const dev = params.devolucion_exceso_metodo ?? null;

  const withMontos = (): DetalleExcesoCobro => ({
    ...(ef > 0 ? { monto_recibido_efectivo: ef } : {}),
    ...(tr > 0 ? { monto_transferencia_recibido: tr } : {}),
    vuelto_cliente_efectivo: 0,
    vuelto_cliente_transferencia: 0,
    pago_domiciliario: 0,
    pago_mesero: 0,
  });

  const asignarExceso = (d: DetalleExcesoCobro, monto: number) => {
    if (monto <= 0 || !dev) return;
    switch (dev) {
      case 'efectivo':
        d.vuelto_cliente_efectivo += monto;
        break;
      case 'transferencia':
        d.vuelto_cliente_transferencia += monto;
        break;
      case 'domicilio':
        d.pago_domiciliario += monto;
        break;
      case 'mesero':
        d.pago_mesero += monto;
        break;
    }
  };

  if (params.metodo === 'efectivo') {
    if (ef <= t) return null;
    const d = withMontos();
    d.vuelto_cliente_efectivo = ef - t;
    return d;
  }

  if (params.metodo === 'transferencia') {
    if (tr <= t) return null;
    const d = withMontos();
    asignarExceso(d, tr - t);
    return detalleExcesoCobroActivo(d) ? d : null;
  }

  const vueltoTotal = tr + ef - t;
  if (vueltoTotal <= 0) return null;

  const reparto = repartoMixtoConDevolucion(t, tr, ef, dev);
  const d = withMontos();

  if (dev === 'transferencia') {
    d.vuelto_cliente_transferencia = vueltoTotal;
    return d;
  }

  if (reparto.excesoDevolverEfectivo > 0 && tr >= t) {
    d.vuelto_cliente_efectivo = ef;
    asignarExceso(d, tr - t);
    return detalleExcesoCobroActivo(d) ? d : null;
  }

  const vueltoEf = Math.max(0, ef - reparto.efectivoFactura);
  if (vueltoEf <= 0) return null;
  d.vuelto_cliente_efectivo = vueltoEf;
  return d;
}

/** Solo vuelto al cliente (compatibilidad). */
export function calcularVueltoCliente(
  params: CalcularVueltoClienteInput,
): VueltoClienteInfo | null {
  const d = calcularDetalleExcesoCobro(params);
  if (!d) return null;
  const vuelto_efectivo = d.vuelto_cliente_efectivo;
  const vuelto_transferencia = d.vuelto_cliente_transferencia;
  const vuelto_total = vuelto_efectivo + vuelto_transferencia;
  if (vuelto_total <= 0) return null;
  return {
    monto_recibido_efectivo: d.monto_recibido_efectivo,
    monto_transferencia_recibido: d.monto_transferencia_recibido,
    vuelto_total,
    vuelto_efectivo,
    vuelto_transferencia,
  };
}
