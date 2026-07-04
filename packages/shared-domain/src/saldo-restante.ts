/**
 * Ítem interno «Saldo pendiente»: absorbe abonos parciales (plan personas / combinado)
 * sin partir platos reales del pedido.
 *
 * - Mesa: oculto (mismo flag es_cuota_pendiente_reparto).
 * - Cobro: línea cobrable del reparto; los platos del alcance quedan intactos.
 * - Al liquidar el saldo, solo se marcan cobrados los platos del alcance
 *   (todos en personas; pool en combinado).
 *
 * Nota:
 * - `saldo_restante` → reparto sobre el total del pedido.
 * - `saldo_restante@1:2,5:1` → pool combinado (id_detalle:cantidad).
 */

export const NOMBRE_PRODUCTO_SALDO_RESTANTE = 'Saldo restante';

/** Nombre visible en app / ticket. */
export const NOMBRE_DISPLAY_SALDO_PENDIENTE = 'Saldo pendiente';

/** Línea pendiente con el monto aún por cobrar. */
export const SALDO_RESTANTE_NOTA = 'saldo_restante';

/**
 * Remanente tras repartir el saldo en platos enteros (no absorbe platos).
 * Ej.: cuota omitida que no alcanza para otro plato del menú.
 */
export const SALDO_RESTANTE_FRAGMENTO_NOTA = 'saldo_restante#fragmento';

/** Abono ya aplicado (ligado a una factura). */
export const SALDO_ABONO_NOTA = 'saldo_restante:abono';

export type SaldoPoolRef = {
  id_detalle: number;
  cantidad: number;
};

export function esNotaSaldoRestantePendiente(
  nota: string | null | undefined,
): boolean {
  const n = (nota ?? '').trim();
  return (
    n === SALDO_RESTANTE_NOTA ||
    n === SALDO_RESTANTE_FRAGMENTO_NOTA ||
    n.startsWith(`${SALDO_RESTANTE_NOTA}@`)
  );
}

/** Saldo ya reconciliado a platos: solo el fragmento huérfano. */
export function esNotaSaldoFragmentoHuerfano(
  nota: string | null | undefined,
): boolean {
  return (nota ?? '').trim() === SALDO_RESTANTE_FRAGMENTO_NOTA;
}

export function esNotaSaldoAbono(nota: string | null | undefined): boolean {
  return (nota ?? '').trim().startsWith(SALDO_ABONO_NOTA);
}

export function esDetalleSaldoRestante(d: {
  nota_cocina?: string | null;
  es_cuota_pendiente_reparto?: boolean;
  nombre_producto?: string;
}): boolean {
  if (esNotaSaldoRestantePendiente(d.nota_cocina) || esNotaSaldoAbono(d.nota_cocina)) {
    return true;
  }
  return (
    Boolean(d.es_cuota_pendiente_reparto) &&
    (d.nombre_producto === NOMBRE_PRODUCTO_SALDO_RESTANTE ||
      d.nombre_producto === NOMBRE_DISPLAY_SALDO_PENDIENTE ||
      d.nombre_producto === 'Saldo pendiente reparto')
  );
}

/** Codifica el alcance del saldo (total o pool combinado). */
export function formatSaldoRestanteNota(pool?: SaldoPoolRef[] | null): string {
  if (pool == null || pool.length === 0) return SALDO_RESTANTE_NOTA;
  const parts = pool
    .filter((p) => p.id_detalle > 0 && p.cantidad > 0)
    .map((p) => `${p.id_detalle}:${p.cantidad}`);
  if (parts.length === 0) return SALDO_RESTANTE_NOTA;
  return `${SALDO_RESTANTE_NOTA}@${parts.join(',')}`;
}

/** Pool de platos del saldo combinado; `null` = sobre el total. */
export function parseSaldoRestantePool(
  nota: string | null | undefined,
): SaldoPoolRef[] | null {
  const n = (nota ?? '').trim();
  if (!esNotaSaldoRestantePendiente(n)) return null;
  if (n === SALDO_RESTANTE_NOTA) return null;
  const payload = n.slice(SALDO_RESTANTE_NOTA.length + 1);
  if (!payload) return null;
  const out: SaldoPoolRef[] = [];
  for (const part of payload.split(',')) {
    const [idRaw, qtyRaw] = part.split(':');
    const id_detalle = Number(idRaw);
    const cantidad = Number(qtyRaw);
    if (!Number.isFinite(id_detalle) || id_detalle <= 0) continue;
    if (!Number.isFinite(cantidad) || cantidad <= 0) continue;
    out.push({ id_detalle, cantidad });
  }
  return out.length > 0 ? out : null;
}

/** Etiqueta legible del pool (nombres de platos) para la UI. */
export function notaDisplaySaldoPendiente(
  nota: string | null | undefined,
  nombresPorDetalle?: Map<number, string> | Record<number, string>,
): string | null {
  const pool = parseSaldoRestantePool(nota);
  if (pool == null || pool.length === 0) return null;
  const getNombre = (id: number) => {
    if (!nombresPorDetalle) return `#${id}`;
    if (nombresPorDetalle instanceof Map) {
      return nombresPorDetalle.get(id) ?? `#${id}`;
    }
    return nombresPorDetalle[id] ?? `#${id}`;
  };
  const labels = pool.map((p) => {
    const nombre = getNombre(p.id_detalle);
    return p.cantidad > 1 ? `${p.cantidad}× ${nombre}` : nombre;
  });
  return `Reparto de: ${labels.join(', ')}`;
}

/** Monto pendiente del saldo (solo líneas no cobradas de saldo pendiente). */
export function montoSaldoRestantePendiente(
  detalles: {
    cobrado?: boolean;
    id_factura?: number | null;
    nota_cocina?: string | null;
    precio_unitario: number;
    cantidad: number;
  }[],
): number {
  return detalles
    .filter(
      (d) =>
        !d.cobrado &&
        d.id_factura == null &&
        esNotaSaldoRestantePendiente(d.nota_cocina),
    )
    .reduce(
      (s, d) => s + Math.round(d.precio_unitario) * d.cantidad,
      0,
    );
}

/** Detalle de saldo pendiente aún no cobrado (si existe). */
export function detalleSaldoRestantePendiente<
  T extends {
    cobrado?: boolean;
    id_factura?: number | null;
    nota_cocina?: string | null;
  },
>(detalles: T[]): T | undefined {
  return detalles.find(
    (d) =>
      !d.cobrado &&
      d.id_factura == null &&
      esNotaSaldoRestantePendiente(d.nota_cocina),
  );
}

export type PlatoParaDistribuirSaldo = {
  id_detalle: number;
  precio_unitario: number;
  cantidad: number;
};

export type LiberacionPlatoSaldo = {
  id_detalle: number;
  /** Unidades que quedan pendientes para cobrar por platos. */
  cantidad: number;
};

export type DistribucionSaldoEnPlatos = {
  /**
   * Unidades liberadas por línea (pueden ser parciales: 1 de 3 picadas).
   * @deprecated Preferir `liberaciones`.
   */
  idsLiberados: number[];
  /** Unidades a dejar pendientes por platos (sin partir el precio unitario). */
  liberaciones: LiberacionPlatoSaldo[];
  montoPlatos: number;
  /** Remanente que no forma un plato completo. */
  montoSaldoRestante: number;
};

/**
 * Reparte un saldo pendiente en unidades enteras del menú (sin partir precios).
 * Prioriza mayor precio unitario. Ej.: saldo 150.000 y 3× picada 100.000
 * → libera 1 picada y deja 50.000 como saldo pendiente.
 */
export function distribuirSaldoEnPlatos(
  saldoMonto: number,
  platos: PlatoParaDistribuirSaldo[],
): DistribucionSaldoEnPlatos {
  let resto = Math.max(0, Math.round(saldoMonto));
  if (resto <= 0 || platos.length === 0) {
    return {
      idsLiberados: [],
      liberaciones: [],
      montoPlatos: 0,
      montoSaldoRestante: resto,
    };
  }

  const ordenados = platos
    .map((p) => ({
      id_detalle: p.id_detalle,
      precio_unitario: Math.round(p.precio_unitario),
      cantidad: Math.max(1, p.cantidad),
    }))
    .filter((p) => p.precio_unitario > 0)
    .sort(
      (a, b) =>
        b.precio_unitario - a.precio_unitario ||
        a.id_detalle - b.id_detalle,
    );

  const liberaciones: LiberacionPlatoSaldo[] = [];
  for (const p of ordenados) {
    if (p.precio_unitario > resto) continue;
    const maxUnidades = Math.min(
      p.cantidad,
      Math.floor(resto / p.precio_unitario),
    );
    if (maxUnidades < 1) continue;
    liberaciones.push({ id_detalle: p.id_detalle, cantidad: maxUnidades });
    resto -= maxUnidades * p.precio_unitario;
    if (resto <= 0) break;
  }

  const montoPlatos = Math.max(0, Math.round(saldoMonto) - resto);
  return {
    idsLiberados: liberaciones.map((l) => l.id_detalle),
    liberaciones,
    montoPlatos,
    montoSaldoRestante: resto,
  };
}

/**
 * True si los platos pendientes aún están «absorbidos» por el saldo (reparto
 * personas/combinado sin reconciliar a platos): el valor de platos supera al saldo.
 */
export function saldoNecesitaReconciliarAPlatos(
  montoSaldo: number,
  platosPendientes: PlatoParaDistribuirSaldo[],
  notaSaldo?: string | null,
): boolean {
  if (montoSaldo <= 0) return false;
  const totalPlatos = platosPendientes.reduce(
    (s, p) => s + Math.round(p.precio_unitario) * Math.max(1, p.cantidad),
    0,
  );
  // Fragmento sin platos pendientes: reconcile previo falló (marcó todo cobrado).
  if (esNotaSaldoFragmentoHuerfano(notaSaldo)) {
    return totalPlatos === 0;
  }
  // Platos absorbidos aún valen más que el saldo → hay que repartir.
  return totalPlatos > montoSaldo;
}
