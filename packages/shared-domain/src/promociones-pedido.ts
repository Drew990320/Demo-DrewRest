import type { LineaDescuento } from './descuentos-pedido';

/** Descuento por unidades de una categoría si hay suficientes ítems y subtotal de otros. */
export type ReglaPromocionPorCategoria = {
  id: string;
  activa: boolean;
  etiqueta: string;
  tipo: 'por_categoria';
  id_categoria: number;
  monto_por_unidad: number;
  /** Mínimo de unidades en la categoría (p. ej. 2 como en sopas). */
  min_unidades: number;
  /** Subtotal mínimo de ítems fuera de la categoría. */
  min_subtotal_otros: number;
};

/** Reservado para reglas futuras por bandera del pedido. */
export type ReglaPromocionPorFlagPedido = {
  id: string;
  activa: boolean;
  etiqueta: string;
  tipo: 'por_flag_pedido';
  flag: 'cliente_mulero';
  monto_por_plato_principal: number;
};

export type ReglaPromocion =
  | ReglaPromocionPorCategoria
  | ReglaPromocionPorFlagPedido;

export type DesglosePromocion = {
  id: string;
  etiqueta: string;
  monto: number;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v != null && !Array.isArray(v);
}

function parseReglaPorCategoria(raw: Record<string, unknown>): ReglaPromocionPorCategoria | null {
  if (raw.tipo !== 'por_categoria') return null;
  const id = String(raw.id ?? '').trim();
  const idCategoria = Number(raw.id_categoria);
  const monto = Math.round(Number(raw.monto_por_unidad) || 0);
  const minUnidades = Math.max(1, Math.round(Number(raw.min_unidades) || 2));
  const minOtros = Math.round(Number(raw.min_subtotal_otros) || 0);
  if (!id || !Number.isFinite(idCategoria) || idCategoria < 1) return null;
  const etiqueta = String(raw.etiqueta ?? '').trim() || `Promo cat. ${idCategoria}`;
  return {
    id,
    activa: raw.activa !== false,
    etiqueta,
    tipo: 'por_categoria',
    id_categoria: idCategoria,
    monto_por_unidad: monto,
    min_unidades: minUnidades,
    min_subtotal_otros: minOtros,
  };
}

/** Normaliza JSON de BD/API a reglas válidas. */
export function parseReglasPromocion(raw: unknown): ReglaPromocionPorCategoria[] {
  if (!Array.isArray(raw)) return [];
  const out: ReglaPromocionPorCategoria[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const regla = parseReglaPorCategoria(item);
    if (!regla || seen.has(regla.id)) continue;
    seen.add(regla.id);
    out.push(regla);
  }
  return out;
}

function calcReglaPorCategoria(
  lineas: LineaDescuento[],
  regla: ReglaPromocionPorCategoria,
): number {
  if (!regla.activa || regla.monto_por_unidad <= 0) return 0;

  const enCategoria = lineas.filter(
    (l) => l.id_categoria === regla.id_categoria,
  );
  const cant = enCategoria.reduce((s, l) => s + l.cantidad, 0);
  if (cant < regla.min_unidades) return 0;

  const otras = lineas.filter((l) => l.id_categoria !== regla.id_categoria);
  if (otras.length === 0) return 0;

  const subtotalOtras = otras.reduce((s, l) => s + l.subtotal_linea, 0);
  if (subtotalOtras <= regla.min_subtotal_otros) return 0;

  return cant * Math.round(regla.monto_por_unidad);
}

export function calcularDescuentoPromociones(
  lineas: LineaDescuento[],
  reglas: ReglaPromocionPorCategoria[] | unknown,
): { total: number; desglose: DesglosePromocion[] } {
  const lista = Array.isArray(reglas)
    ? reglas.every((r) => r && typeof r === 'object' && 'tipo' in r)
      ? (reglas as ReglaPromocionPorCategoria[])
      : parseReglasPromocion(reglas)
    : parseReglasPromocion(reglas);

  const desglose: DesglosePromocion[] = [];
  let total = 0;
  for (const regla of lista) {
    const monto = calcReglaPorCategoria(lineas, regla);
    if (monto <= 0) continue;
    desglose.push({ id: regla.id, etiqueta: regla.etiqueta, monto });
    total += monto;
  }
  return { total, desglose };
}

export function nuevaReglaPromocionId(): string {
  return `promo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
