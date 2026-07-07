import type { LineaDescuento } from './descuentos-pedido';

/** Etiqueta activable en un pedido (convenio, empleado, etc.). */
export type EtiquetaPromocionPedido = {
  id: string;
  etiqueta: string;
  activa: boolean;
  descripcion?: string;
};

/** Descuento por unidades en una categoría concreta. */
export type ReglaPromocionPorCategoria = {
  id: string;
  activa: boolean;
  etiqueta: string;
  tipo: 'por_categoria';
  id_categoria: number;
  monto_por_unidad: number;
  min_unidades: number;
  min_subtotal_otros: number;
};

/**
 * Descuento por líneas cuya categoría tiene el flag `participa_descuento_sopas`
 * (nombre legacy en BD; en UI: «categoría marcada para promos»).
 */
export type ReglaPromocionPorCategoriaMarcada = {
  id: string;
  activa: boolean;
  etiqueta: string;
  tipo: 'por_categoria_marcada';
  monto_por_unidad: number;
  min_unidades: number;
  min_subtotal_otros: number;
};

/** Descuento por platos principales; opcionalmente solo si el pedido tiene una etiqueta. */
export type ReglaPromocionPorPlatoPrincipal = {
  id: string;
  activa: boolean;
  etiqueta: string;
  tipo: 'por_plato_principal';
  monto_por_unidad: number;
  min_unidades: number;
  /** Si se define, la regla solo aplica cuando el pedido incluye esta etiqueta. */
  requiere_etiqueta_pedido?: string;
};

/**
 * Cliente con etiqueta especial: todos los ítems de una categoría cobran un precio fijo
 * (ej. platos de $45k o $38k pasan a $35k si comparten categoría).
 */
export type ReglaPromocionPrecioFijoCategoria = {
  id: string;
  activa: boolean;
  etiqueta: string;
  tipo: 'precio_fijo_categoria';
  id_categoria: number;
  precio_fijo_unidad: number;
  requiere_etiqueta_pedido: string;
};

/**
 * Promoción N×M (ej. 2×1: compra 2, paga 1). Por categoría o por producto.
 * `alcance`: 'categoria' agrupa unidades de la categoría; 'producto' por ítem.
 */
export type ReglaPromocionCompraPaga = {
  id: string;
  activa: boolean;
  etiqueta: string;
  tipo: 'compra_paga';
  alcance: 'categoria' | 'producto';
  id_categoria?: number;
  id_producto?: number;
  compra_unidades: number;
  paga_unidades: number;
  requiere_etiqueta_pedido?: string;
  min_subtotal_pedido?: number;
};

/** Descuento cuando el subtotal del pedido supera un umbral (monto fijo o %). */
export type ReglaPromocionUmbralSubtotal = {
  id: string;
  activa: boolean;
  etiqueta: string;
  tipo: 'umbral_subtotal_pedido';
  min_subtotal_pedido: number;
  monto_descuento?: number;
  porcentaje_descuento?: number;
  requiere_etiqueta_pedido?: string;
};

export type ReglaPromocion =
  | ReglaPromocionPorCategoria
  | ReglaPromocionPorCategoriaMarcada
  | ReglaPromocionPorPlatoPrincipal
  | ReglaPromocionPrecioFijoCategoria
  | ReglaPromocionCompraPaga
  | ReglaPromocionUmbralSubtotal;

export type DesglosePromocion = {
  id: string;
  etiqueta: string;
  monto: number;
};

export const ETIQUETA_LEGACY_MULERO = 'cliente_especial';

export type ConfigPromocionesLegacy = {
  sopas_activo?: boolean;
  sopas_monto_por_unidad?: number;
  sopas_min_unidades?: number;
  umbral_subtotal_otros?: number;
  muleros_activo?: boolean;
  muleros_monto_por_plato_principal?: number;
  muleros_min_platos_principales?: number;
  reglas_promocion?: unknown;
  etiquetas_pedido?: unknown;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v != null && !Array.isArray(v);
}

function parseReglaPorCategoria(
  raw: Record<string, unknown>,
): ReglaPromocionPorCategoria | null {
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

function parseReglaPorCategoriaMarcada(
  raw: Record<string, unknown>,
): ReglaPromocionPorCategoriaMarcada | null {
  if (raw.tipo !== 'por_categoria_marcada') return null;
  const id = String(raw.id ?? '').trim();
  const monto = Math.round(Number(raw.monto_por_unidad) || 0);
  const minUnidades = Math.max(1, Math.round(Number(raw.min_unidades) || 2));
  const minOtros = Math.round(Number(raw.min_subtotal_otros) || 0);
  if (!id) return null;
  const etiqueta =
    String(raw.etiqueta ?? '').trim() || 'Promoción por categoría marcada';
  return {
    id,
    activa: raw.activa !== false,
    etiqueta,
    tipo: 'por_categoria_marcada',
    monto_por_unidad: monto,
    min_unidades: minUnidades,
    min_subtotal_otros: minOtros,
  };
}

function parseReglaPorPlatoPrincipal(
  raw: Record<string, unknown>,
): ReglaPromocionPorPlatoPrincipal | null {
  if (raw.tipo !== 'por_plato_principal') return null;
  const id = String(raw.id ?? '').trim();
  const monto = Math.round(Number(raw.monto_por_unidad) || 0);
  const minUnidades = Math.max(1, Math.round(Number(raw.min_unidades) || 1));
  if (!id) return null;
  const etiqueta =
    String(raw.etiqueta ?? '').trim() || 'Promoción por plato principal';
  const req = raw.requiere_etiqueta_pedido;
  return {
    id,
    activa: raw.activa !== false,
    etiqueta,
    tipo: 'por_plato_principal',
    monto_por_unidad: monto,
    min_unidades: minUnidades,
    ...(typeof req === 'string' && req.trim()
      ? { requiere_etiqueta_pedido: req.trim() }
      : {}),
  };
}

function parseReglaPrecioFijoCategoria(
  raw: Record<string, unknown>,
): ReglaPromocionPrecioFijoCategoria | null {
  if (raw.tipo !== 'precio_fijo_categoria') return null;
  const id = String(raw.id ?? '').trim();
  const idCategoria = Number(raw.id_categoria);
  const precio = Math.round(Number(raw.precio_fijo_unidad) || 0);
  const req = String(raw.requiere_etiqueta_pedido ?? '').trim();
  if (!id || !Number.isFinite(idCategoria) || idCategoria < 1 || precio < 0 || !req) {
    return null;
  }
  const etiqueta =
    String(raw.etiqueta ?? '').trim() || `Precio fijo cat. ${idCategoria}`;
  return {
    id,
    activa: raw.activa !== false,
    etiqueta,
    tipo: 'precio_fijo_categoria',
    id_categoria: idCategoria,
    precio_fijo_unidad: precio,
    requiere_etiqueta_pedido: req,
  };
}

function parseReglaCompraPaga(
  raw: Record<string, unknown>,
): ReglaPromocionCompraPaga | null {
  if (raw.tipo !== 'compra_paga') return null;
  const id = String(raw.id ?? '').trim();
  const compra = Math.max(2, Math.round(Number(raw.compra_unidades) || 2));
  const paga = Math.max(1, Math.round(Number(raw.paga_unidades) || 1));
  if (!id || paga >= compra) return null;
  const alcanceRaw = String(raw.alcance ?? 'categoria');
  const alcance: 'categoria' | 'producto' =
    alcanceRaw === 'producto' ? 'producto' : 'categoria';
  const idCategoria =
    raw.id_categoria != null ? Number(raw.id_categoria) : undefined;
  const idProducto =
    raw.id_producto != null ? Number(raw.id_producto) : undefined;
  if (alcance === 'categoria' && (!idCategoria || idCategoria < 1)) return null;
  if (alcance === 'producto' && (!idProducto || idProducto < 1)) return null;
  const etiqueta = String(raw.etiqueta ?? '').trim() || `${compra}x${paga}`;
  const req = raw.requiere_etiqueta_pedido;
  const minSub = raw.min_subtotal_pedido;
  return {
    id,
    activa: raw.activa !== false,
    etiqueta,
    tipo: 'compra_paga',
    alcance,
    ...(alcance === 'categoria' && idCategoria
      ? { id_categoria: idCategoria }
      : {}),
    ...(alcance === 'producto' && idProducto ? { id_producto: idProducto } : {}),
    compra_unidades: compra,
    paga_unidades: paga,
    ...(typeof req === 'string' && req.trim()
      ? { requiere_etiqueta_pedido: req.trim() }
      : {}),
    ...(minSub != null && Number(minSub) > 0
      ? { min_subtotal_pedido: Math.round(Number(minSub)) }
      : {}),
  };
}

function parseReglaUmbralSubtotal(
  raw: Record<string, unknown>,
): ReglaPromocionUmbralSubtotal | null {
  if (raw.tipo !== 'umbral_subtotal_pedido') return null;
  const id = String(raw.id ?? '').trim();
  const minSub = Math.round(Number(raw.min_subtotal_pedido) || 0);
  const monto = raw.monto_descuento != null ? Math.round(Number(raw.monto_descuento)) : undefined;
  const pct =
    raw.porcentaje_descuento != null
      ? Math.min(100, Math.max(0, Math.round(Number(raw.porcentaje_descuento))))
      : undefined;
  if (!id || minSub <= 0 || ((monto ?? 0) <= 0 && (pct ?? 0) <= 0)) return null;
  const etiqueta =
    String(raw.etiqueta ?? '').trim() || 'Descuento por consumo';
  const req = raw.requiere_etiqueta_pedido;
  return {
    id,
    activa: raw.activa !== false,
    etiqueta,
    tipo: 'umbral_subtotal_pedido',
    min_subtotal_pedido: minSub,
    ...(monto != null && monto > 0 ? { monto_descuento: monto } : {}),
    ...(pct != null && pct > 0 ? { porcentaje_descuento: pct } : {}),
    ...(typeof req === 'string' && req.trim()
      ? { requiere_etiqueta_pedido: req.trim() }
      : {}),
  };
}

function parseRegla(raw: Record<string, unknown>): ReglaPromocion | null {
  return (
    parseReglaPorCategoria(raw) ??
    parseReglaPorCategoriaMarcada(raw) ??
    parseReglaPorPlatoPrincipal(raw) ??
    parseReglaPrecioFijoCategoria(raw) ??
    parseReglaCompraPaga(raw) ??
    parseReglaUmbralSubtotal(raw)
  );
}

/** Normaliza JSON de BD/API a reglas válidas. */
export function parseReglasPromocion(raw: unknown): ReglaPromocion[] {
  if (!Array.isArray(raw)) return [];
  const out: ReglaPromocion[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const regla = parseRegla(item);
    if (!regla || seen.has(regla.id)) continue;
    seen.add(regla.id);
    out.push(regla);
  }
  return out;
}

export function parseEtiquetasPedido(raw: unknown): EtiquetaPromocionPedido[] {
  if (!Array.isArray(raw)) return [];
  const out: EtiquetaPromocionPedido[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const id = String(item.id ?? '').trim();
    const etiqueta = String(item.etiqueta ?? '').trim();
    if (!id || !etiqueta || seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      etiqueta,
      activa: item.activa !== false,
      ...(typeof item.descripcion === 'string' && item.descripcion.trim()
        ? { descripcion: item.descripcion.trim() }
        : {}),
    });
  }
  return out;
}

function lineaMarcadaPromo(linea: LineaDescuento): boolean {
  if (linea.participa_descuento_sopas != null) {
    return linea.participa_descuento_sopas;
  }
  const cat = (linea.categoria_nombre ?? '').toLowerCase();
  const nom = (linea.nombre_producto ?? '').toLowerCase();
  return cat.includes('sopa') || nom.includes('sopa');
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

function calcReglaPorCategoriaMarcada(
  lineas: LineaDescuento[],
  regla: ReglaPromocionPorCategoriaMarcada,
): number {
  if (!regla.activa || regla.monto_por_unidad <= 0) return 0;

  const marcadas = lineas.filter(lineaMarcadaPromo);
  const cant = marcadas.reduce((s, l) => s + l.cantidad, 0);
  if (cant < regla.min_unidades) return 0;

  const otras = lineas.filter((l) => !lineaMarcadaPromo(l));
  if (otras.length === 0) return 0;

  const subtotalOtras = otras.reduce((s, l) => s + l.subtotal_linea, 0);
  if (subtotalOtras <= regla.min_subtotal_otros) return 0;

  return cant * Math.round(regla.monto_por_unidad);
}

function precioUnitarioLinea(linea: LineaDescuento): number {
  if (linea.precio_unitario != null && linea.precio_unitario > 0) {
    return Math.round(linea.precio_unitario);
  }
  if (linea.cantidad > 0) {
    return Math.round(linea.subtotal_linea / linea.cantidad);
  }
  return 0;
}

function etiquetaPermiteRegla(
  requiere: string | undefined,
  etiquetasPedido: Set<string>,
): boolean {
  if (!requiere) return true;
  return etiquetasPedido.has(requiere);
}

function subtotalLineas(lineas: LineaDescuento[]): number {
  return lineas.reduce((s, l) => s + l.subtotal_linea, 0);
}

function calcReglaPorPlatoPrincipal(
  lineas: LineaDescuento[],
  regla: ReglaPromocionPorPlatoPrincipal,
  etiquetasPedido: Set<string>,
): number {
  if (!regla.activa || regla.monto_por_unidad <= 0) return 0;
  if (!etiquetaPermiteRegla(regla.requiere_etiqueta_pedido, etiquetasPedido)) {
    return 0;
  }

  const cant = lineas
    .filter((l) => l.es_plato_principal)
    .reduce((s, l) => s + l.cantidad, 0);
  if (cant < regla.min_unidades) return 0;

  return cant * Math.round(regla.monto_por_unidad);
}

function calcReglaPrecioFijoCategoria(
  lineas: LineaDescuento[],
  regla: ReglaPromocionPrecioFijoCategoria,
  etiquetasPedido: Set<string>,
): number {
  if (!regla.activa) return 0;
  if (!etiquetaPermiteRegla(regla.requiere_etiqueta_pedido, etiquetasPedido)) {
    return 0;
  }

  let desc = 0;
  for (const l of lineas) {
    if (l.id_categoria !== regla.id_categoria) continue;
    const objetivo = regla.precio_fijo_unidad * l.cantidad;
    if (l.subtotal_linea > objetivo) {
      desc += l.subtotal_linea - objetivo;
    }
  }
  return desc;
}

function calcReglaCompraPaga(
  lineas: LineaDescuento[],
  regla: ReglaPromocionCompraPaga,
  etiquetasPedido: Set<string>,
): number {
  if (!regla.activa) return 0;
  if (!etiquetaPermiteRegla(regla.requiere_etiqueta_pedido, etiquetasPedido)) {
    return 0;
  }
  if (
    regla.min_subtotal_pedido != null &&
    regla.min_subtotal_pedido > 0 &&
    subtotalLineas(lineas) < regla.min_subtotal_pedido
  ) {
    return 0;
  }

  const unidadesGratisPorPromo =
    regla.compra_unidades - regla.paga_unidades;

  if (regla.alcance === 'producto' && regla.id_producto != null) {
    let total = 0;
    for (const l of lineas) {
      if (l.id_producto !== regla.id_producto) continue;
      const sets = Math.floor(l.cantidad / regla.compra_unidades);
      total += sets * unidadesGratisPorPromo * precioUnitarioLinea(l);
    }
    return total;
  }

  if (regla.id_categoria == null) return 0;
  const enCategoria = lineas.filter((l) => l.id_categoria === regla.id_categoria);
  const cant = enCategoria.reduce((s, l) => s + l.cantidad, 0);
  if (cant < regla.compra_unidades) return 0;
  const sub = enCategoria.reduce((s, l) => s + l.subtotal_linea, 0);
  const puPromedio = cant > 0 ? Math.round(sub / cant) : 0;
  const sets = Math.floor(cant / regla.compra_unidades);
  return sets * unidadesGratisPorPromo * puPromedio;
}

function calcReglaUmbralSubtotal(
  lineas: LineaDescuento[],
  regla: ReglaPromocionUmbralSubtotal,
  etiquetasPedido: Set<string>,
): number {
  if (!regla.activa) return 0;
  if (!etiquetaPermiteRegla(regla.requiere_etiqueta_pedido, etiquetasPedido)) {
    return 0;
  }
  const sub = subtotalLineas(lineas);
  if (sub < regla.min_subtotal_pedido) return 0;

  if (regla.monto_descuento != null && regla.monto_descuento > 0) {
    return Math.min(Math.round(regla.monto_descuento), sub);
  }
  if (regla.porcentaje_descuento != null && regla.porcentaje_descuento > 0) {
    return Math.min(
      Math.round((sub * regla.porcentaje_descuento) / 100),
      sub,
    );
  }
  return 0;
}

export function calcularDescuentoPromociones(
  lineas: LineaDescuento[],
  reglas: ReglaPromocion[] | unknown,
  etiquetasPedido: string[] = [],
): { total: number; desglose: DesglosePromocion[] } {
  const lista = Array.isArray(reglas)
    ? reglas.every((r) => r && typeof r === 'object' && 'tipo' in r)
      ? (reglas as ReglaPromocion[])
      : parseReglasPromocion(reglas)
    : parseReglasPromocion(reglas);

  const etiquetas = new Set(etiquetasPedido);
  const desglose: DesglosePromocion[] = [];
  let total = 0;

  for (const regla of lista) {
    let monto = 0;
    if (regla.tipo === 'por_categoria') {
      monto = calcReglaPorCategoria(lineas, regla);
    } else if (regla.tipo === 'por_categoria_marcada') {
      monto = calcReglaPorCategoriaMarcada(lineas, regla);
    } else if (regla.tipo === 'por_plato_principal') {
      monto = calcReglaPorPlatoPrincipal(lineas, regla, etiquetas);
    } else if (regla.tipo === 'precio_fijo_categoria') {
      monto = calcReglaPrecioFijoCategoria(lineas, regla, etiquetas);
    } else if (regla.tipo === 'compra_paga') {
      monto = calcReglaCompraPaga(lineas, regla, etiquetas);
    } else if (regla.tipo === 'umbral_subtotal_pedido') {
      monto = calcReglaUmbralSubtotal(lineas, regla, etiquetas);
    }
    if (monto <= 0) continue;
    desglose.push({ id: regla.id, etiqueta: regla.etiqueta, monto });
    total += monto;
  }
  return { total, desglose };
}

/** Convierte columnas legacy de config_descuento a reglas unificadas (solo si faltan). */
export function migrarLegacyConfigPromociones(
  cfg: ConfigPromocionesLegacy,
): {
  reglas: ReglaPromocion[];
  etiquetas_pedido: EtiquetaPromocionPedido[];
} {
  const reglas = parseReglasPromocion(cfg.reglas_promocion ?? []);
  const etiquetas = parseEtiquetasPedido(cfg.etiquetas_pedido ?? []);
  const ids = new Set(reglas.map((r) => r.id));

  if (
    cfg.sopas_activo &&
    !ids.has('legacy-sopas') &&
    Math.round(Number(cfg.sopas_monto_por_unidad) || 0) > 0
  ) {
    reglas.push({
      id: 'legacy-sopas',
      activa: true,
      etiqueta: 'Promoción por categoría marcada',
      tipo: 'por_categoria_marcada',
      monto_por_unidad: Math.round(Number(cfg.sopas_monto_por_unidad) || 0),
      min_unidades: Math.max(1, Math.round(cfg.sopas_min_unidades ?? 2)),
      min_subtotal_otros: Math.round(Number(cfg.umbral_subtotal_otros) || 0),
    });
    ids.add('legacy-sopas');
  }

  const tieneEtiquetaMulero = etiquetas.some(
    (e) => e.id === ETIQUETA_LEGACY_MULERO,
  );
  if (!tieneEtiquetaMulero && cfg.muleros_activo) {
    etiquetas.push({
      id: ETIQUETA_LEGACY_MULERO,
      etiqueta: 'Cliente especial',
      activa: true,
      descripcion: 'Activa promociones que requieren esta etiqueta en el pedido.',
    });
  }

  if (
    cfg.muleros_activo &&
    !ids.has('legacy-plato-principal') &&
    Math.round(Number(cfg.muleros_monto_por_plato_principal) || 0) > 0
  ) {
    reglas.push({
      id: 'legacy-plato-principal',
      activa: true,
      etiqueta: 'Promoción por plato principal',
      tipo: 'por_plato_principal',
      monto_por_unidad: Math.round(
        Number(cfg.muleros_monto_por_plato_principal) || 0,
      ),
      min_unidades: Math.max(
        1,
        Math.round(cfg.muleros_min_platos_principales ?? 1),
      ),
      requiere_etiqueta_pedido: ETIQUETA_LEGACY_MULERO,
    });
  }

  return { reglas, etiquetas_pedido: etiquetas };
}

export function nuevaReglaPromocionId(): string {
  return `promo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function nuevaEtiquetaPedidoId(): string {
  return `etq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
