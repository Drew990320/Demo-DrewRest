import { formatCOP } from './format';

/** Solo dígitos del monto (máx. 14 cifras). */
export function sanitizeMontoDigitos(s: string): string {
  return s.replace(/\D/g, '').slice(0, 14);
}

/** Convierte dígitos del input a pesos enteros COP. */
export function parseCOPDigits(s: string): number {
  const d = sanitizeMontoDigitos(s);
  if (!d) return 0;
  const n = parseInt(d, 10);
  return Number.isFinite(n) ? n : 0;
}

/** Dígitos para el estado del input a partir de un monto guardado. */
export function digitsFromMonto(monto: number): string {
  if (!monto) return '';
  return String(Math.round(monto));
}

/** En pago mixto: el otro método recibe lo que falta del total. */
export function montoMixtoComplemento(total: number, montoLado: number): number {
  const t = Math.max(0, Math.round(total));
  const lado = Math.max(0, Math.round(montoLado));
  if (t <= 0) return 0;
  return Math.max(0, t - lado);
}

export type DevolucionExcesoMetodo =
  | 'efectivo'
  | 'transferencia'
  | 'domicilio'
  | 'mesero';

export type RepartoMixtoTransferencia = {
  /** Monto que se registra en la factura de transferencia. */
  transferenciaFactura: number;
  /** Monto que se registra en la factura de efectivo. */
  efectivoFactura: number;
  /** Exceso a devolver (efectivo, transferencia, domicilio o mesero). */
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
 */
export function repartoMixtoConDevolucion(
  total: number,
  transferenciaReal: number,
  efectivoRecibido: number,
  devolucionMetodo?: DevolucionExcesoMetodo | null,
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

export type ResumenTransferenciaUi = {
  total: number;
  transferenciaReal: number;
  exceso: number;
  falta: number;
};

export function resumenTransferenciaUi(
  total: number,
  transferenciaReal: number,
): ResumenTransferenciaUi {
  const t = Math.max(0, Math.round(total));
  const tr = Math.max(0, Math.round(transferenciaReal));
  return {
    total: t,
    transferenciaReal: tr,
    exceso: tr > t ? tr - t : 0,
    falta: tr > 0 && tr < t ? t - tr : 0,
  };
}

export function puedeConfirmarCobroTransferencia(
  total: number,
  transferenciaReal: number,
  devolucionExcesoMetodo?: DevolucionExcesoMetodo | null,
): boolean {
  const r = resumenTransferenciaUi(total, transferenciaReal);
  if (r.total <= 0 || r.transferenciaReal <= 0) return false;
  if (r.falta > 0) return false;
  if (r.exceso > 0 && !devolucionExcesoMetodo) return false;
  return true;
}

export function textoResumenCobroTransferencia(
  total: number,
  transferenciaReal: number,
  devolucionExcesoMetodo?: DevolucionExcesoMetodo | null,
): string {
  const r = resumenTransferenciaUi(total, transferenciaReal);
  if (r.transferenciaReal <= 0) return 'Indica cuánto transfirió el cliente';
  if (r.falta > 0) {
    return `Faltan ${formatCOP(r.falta)} para cubrir ${formatCOP(r.total)}`;
  }
  if (r.exceso > 0) {
    if (!devolucionExcesoMetodo) {
      return `Indica qué representa el exceso de ${formatCOP(r.exceso)}`;
    }
    if (devolucionExcesoMetodo === 'efectivo') {
      return `Devuelve ${formatCOP(r.exceso)} en efectivo (sale de caja)`;
    }
    if (devolucionExcesoMetodo === 'domicilio') {
      return `Paga ${formatCOP(r.exceso)} al domiciliario (sale de caja)`;
    }
    if (devolucionExcesoMetodo === 'mesero') {
      return `Paga ${formatCOP(r.exceso)} al mesero (sale de caja)`;
    }
    return `Devuelve ${formatCOP(r.exceso)} por transferencia`;
  }
  return `${formatCOP(r.total)} transferencia`;
}

export type ResumenMixtoUi = {
  total: number;
  transferenciaReal: number;
  efectivoRecibido: number;
  transferenciaFactura: number;
  efectivoFactura: number;
  faltaTotal: number;
  vueltoTotal: number;
  vueltoPorTransferencia: number;
  vueltoPorEfectivo: number;
  /** Sugerencia informativa (no se escribe en el otro campo). */
  sugerenciaEfectivo: number | null;
  sugerenciaTransferencia: number | null;
};

/** UI y validación de cobro mixto con dos montos independientes. */
export function resumenMixtoUi(
  total: number,
  transferenciaReal: number,
  efectivoRecibido: number,
): ResumenMixtoUi {
  const t = Math.max(0, Math.round(total));
  const tr = Math.max(0, Math.round(transferenciaReal));
  const ef = Math.max(0, Math.round(efectivoRecibido));
  const vacio: ResumenMixtoUi = {
    total: t,
    transferenciaReal: tr,
    efectivoRecibido: ef,
    transferenciaFactura: 0,
    efectivoFactura: 0,
    faltaTotal: t,
    vueltoTotal: 0,
    vueltoPorTransferencia: 0,
    vueltoPorEfectivo: 0,
    sugerenciaEfectivo: null,
    sugerenciaTransferencia: null,
  };
  if (t <= 0) return { ...vacio, faltaTotal: 0 };

  const reparto = repartoMixtoDesdeTransferencia(t, tr);
  const suma = tr + ef;

  if (reparto.excesoDevolverEfectivo > 0) {
    const vueltoPorTransferencia = reparto.excesoDevolverEfectivo;
    const vueltoPorEfectivo = ef;
    return {
      total: t,
      transferenciaReal: tr,
      efectivoRecibido: ef,
      transferenciaFactura: reparto.transferenciaFactura,
      efectivoFactura: 0,
      faltaTotal: 0,
      vueltoTotal: vueltoPorTransferencia + vueltoPorEfectivo,
      vueltoPorTransferencia,
      vueltoPorEfectivo,
      sugerenciaEfectivo: null,
      sugerenciaTransferencia: null,
    };
  }

  const faltaTotal = Math.max(0, t - suma);
  const vueltoPorEfectivo = Math.max(0, ef - reparto.efectivoFactura);
  const vueltoTotal = vueltoPorEfectivo;

  let sugerenciaEfectivo: number | null = null;
  let sugerenciaTransferencia: number | null = null;
  if (tr > 0 && ef === 0 && tr < t) {
    sugerenciaEfectivo = t - tr;
  }
  if (ef > 0 && tr === 0 && ef < t) {
    sugerenciaTransferencia = t - ef;
  }

  return {
    total: t,
    transferenciaReal: tr,
    efectivoRecibido: ef,
    transferenciaFactura: reparto.transferenciaFactura,
    efectivoFactura: reparto.efectivoFactura,
    faltaTotal,
    vueltoTotal,
    vueltoPorTransferencia: 0,
    vueltoPorEfectivo,
    sugerenciaEfectivo,
    sugerenciaTransferencia,
  };
}

export function puedeConfirmarCobroMixto(
  r: ResumenMixtoUi,
  devolucionExcesoMetodo?: DevolucionExcesoMetodo | null,
): boolean {
  if (r.total <= 0) return false;
  if (r.transferenciaReal <= 0) return false;
  if (r.transferenciaFactura >= r.total) {
    if (r.vueltoPorTransferencia > 0 && !devolucionExcesoMetodo) return false;
    return true;
  }
  if (r.efectivoRecibido <= 0) return false;
  if (r.faltaTotal > 0) return false;
  if (r.vueltoPorTransferencia > 0 && !devolucionExcesoMetodo) return false;
  return r.efectivoRecibido >= r.efectivoFactura;
}

export function textoResumenCobroMixto(
  r: ResumenMixtoUi,
  devolucionExcesoMetodo?: DevolucionExcesoMetodo | null,
): string {
  if (r.transferenciaReal <= 0) return 'Indica cuánto transfirió el cliente';
  if (r.transferenciaFactura < r.total && r.efectivoRecibido <= 0) {
    return 'Indica cuánto paga en efectivo';
  }
  if (r.faltaTotal > 0) {
    return `Faltan ${formatCOP(r.faltaTotal)} para cubrir ${formatCOP(r.total)}`;
  }
  if (r.vueltoTotal > 0) {
    if (r.vueltoPorTransferencia > 0 && !devolucionExcesoMetodo) {
      return `Indica cómo devolver el vuelto de ${formatCOP(r.vueltoTotal)}`;
    }
    if (devolucionExcesoMetodo === 'transferencia') {
      return `Devuelve ${formatCOP(r.vueltoTotal)} por transferencia`;
    }
    if (devolucionExcesoMetodo === 'domicilio') {
      return r.vueltoPorTransferencia > 0
        ? `Paga ${formatCOP(r.vueltoTotal)} al domiciliario (sale de caja)`
        : `Entrega ${formatCOP(r.vueltoTotal)} al domiciliario`;
    }
    if (devolucionExcesoMetodo === 'mesero') {
      return r.vueltoPorTransferencia > 0
        ? `Paga ${formatCOP(r.vueltoTotal)} al mesero (sale de caja)`
        : `Entrega ${formatCOP(r.vueltoTotal)} al mesero`;
    }
    if (devolucionExcesoMetodo === 'efectivo' || r.vueltoPorTransferencia === 0) {
      return r.vueltoPorTransferencia > 0
        ? `Devuelve ${formatCOP(r.vueltoTotal)} en efectivo (sale de caja)`
        : `Devuelve ${formatCOP(r.vueltoTotal)} en efectivo al cliente`;
    }
    return `Indica cómo devolver el vuelto de ${formatCOP(r.vueltoTotal)}`;
  }
  if (r.efectivoFactura > 0) {
    return `${formatCOP(r.efectivoFactura)} efectivo + ${formatCOP(r.transferenciaFactura)} transferencia`;
  }
  return `${formatCOP(r.transferenciaFactura)} transferencia`;
}

/** Actualiza reparto desde efectivo solo si no parece billete para vuelto. */
export function debeActualizarRepartoMixtoDesdeEfectivo(
  total: number,
  transferenciaDigits: string,
  recibeDigits: string,
): boolean {
  const recibido = parseCOPDigits(recibeDigits);
  const transfer = parseCOPDigits(transferenciaDigits);
  const reparto = repartoMixtoDesdeTransferencia(total, transfer);
  if (reparto.excesoDevolverEfectivo > 0) return false;
  return recibido > 0 && recibido <= reparto.efectivoFactura;
}

/** Valor visible en el TextInput con formato de moneda COP. */
export function formatCOPInput(digitos: string): string {
  if (digitos === '') return '';
  return formatCOP(parseCOPDigits(digitos));
}
