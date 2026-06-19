import { tituloLugarMesa } from './mesa-label';

export type DetalleCocinaLike = {
  id_detalle: number;
  id_producto?: number;
  id_detalle_padre?: number | null;
  nombre_producto?: string;
  cantidad: number;
  categoria_nombre?: string;
  tipo_proteina?: string;
  nota_cocina?: string | null;
  personalizaciones?: { id_opcion?: number; descripcion: string }[];
  enviado_cocina?: boolean;
  listo_para_recoger?: boolean;
  es_bebida?: boolean;
  es_empacable?: boolean;
  es_acompanamiento_mazorca?: boolean;
  marcar_cocina: boolean;
  listo_cocina: boolean;
};

export type PedidoCocinaLike = {
  mesa_numero: number;
  mesero?: {
    nombre?: string;
    apellido?: string;
  };
  detalles: DetalleCocinaLike[];
};

export function detalleVisibleEnCocina(d: DetalleCocinaLike): boolean {
  return (
    d.marcar_cocina &&
    (d.enviado_cocina ?? false) &&
    !d.listo_cocina &&
    !d.es_bebida &&
    !d.es_empacable
  );
}

export function pedidoActivoEnCocina(pedido: PedidoCocinaLike): boolean {
  return pedido.detalles.some(detalleVisibleEnCocina);
}

export function ordenarDetallesCocina<T extends DetalleCocinaLike>(
  detalles: T[],
): T[] {
  const visibles = detalles.filter(detalleVisibleEnCocina);
  const skip = (d: DetalleCocinaLike) => d.es_bebida || d.es_empacable;
  return [...visibles].sort((a, b) => {
    if (a.es_acompanamiento_mazorca !== b.es_acompanamiento_mazorca) {
      return a.es_acompanamiento_mazorca ? -1 : 1;
    }
    if (skip(a) === skip(b)) return a.id_detalle - b.id_detalle;
    return skip(a) ? 1 : -1;
  });
}

export type LineaCocinaGrupo<T extends DetalleCocinaLike = DetalleCocinaLike> =
  T & {
    ids_detalle: number[];
    /** Todas las líneas del grupo están listas para recoger. */
    listo_para_recoger: boolean;
    /** Algunas líneas listas, otras no (p. ej. agregadas en distintos momentos). */
    listo_para_recoger_parcial: boolean;
  };

function claveAgrupacionCocina(d: DetalleCocinaLike): string {
  const pers = (d.personalizaciones ?? [])
    .map((p) => String(p.id_opcion ?? p.descripcion))
    .sort()
    .join(',');
  return [
    d.id_producto ?? (d.nombre_producto ?? '').trim(),
    (d.nota_cocina ?? '').trim(),
    pers,
    d.id_detalle_padre ?? 'root',
  ].join('|');
}

/**
 * Agrupa platos visibles en cocina (mismo producto/nota/personalización),
 * aunque se hayan agregado en distintos momentos o por distintos usuarios.
 */
export function agruparLineasCocinaVisibles<T extends DetalleCocinaLike>(
  detalles: T[],
): LineaCocinaGrupo<T>[] {
  const byId = new Map(detalles.map((d) => [d.id_detalle, d]));
  const visibles = ordenarDetallesCocina(detalles);
  const orden: string[] = [];
  const map = new Map<string, LineaCocinaGrupo<T>>();

  for (const d of visibles) {
    const key = claveAgrupacionCocina(d);
    const prev = map.get(key);
    if (!prev) {
      orden.push(key);
      const listo = Boolean(d.listo_para_recoger);
      map.set(key, {
        ...d,
        ids_detalle: [d.id_detalle],
        cantidad: d.cantidad,
        listo_para_recoger: listo,
        listo_para_recoger_parcial: false,
      });
      continue;
    }
    prev.cantidad += d.cantidad;
    prev.ids_detalle.push(d.id_detalle);
    const listos = prev.ids_detalle.filter((id) =>
      Boolean(byId.get(id)?.listo_para_recoger),
    ).length;
    const total = prev.ids_detalle.length;
    prev.listo_para_recoger = listos === total && total > 0;
    prev.listo_para_recoger_parcial = listos > 0 && listos < total;
  }

  return orden
    .map((key) => map.get(key))
    .filter((g): g is LineaCocinaGrupo<T> => g != null);
}

export function ordenarDetallesMesero<T extends DetalleCocinaLike>(
  detalles: T[],
): T[] {
  return [...detalles].sort((a, b) => a.id_detalle - b.id_detalle);
}

export function etiquetaEstadoLineaMesero(d: DetalleCocinaLike): string {
  if (d.es_acompanamiento_mazorca) {
    if (d.listo_cocina) return ' · en la mesa';
    if (d.listo_para_recoger) return ' · ¡lista en cocina!';
    if (d.enviado_cocina ?? false) return ' · en cocina';
    return ' · pendiente de enviar';
  }
  if (d.es_bebida) return 'Bebida (se cobra al final)';
  if (d.es_empacable) return 'Empaque';
  if (d.listo_cocina) return 'Recogido · ya en la mesa';
  if (d.listo_para_recoger) return '¡Cocina avisó! Listo para recoger';
  if (d.enviado_cocina ?? false) {
    return 'En cocina · puedes recoger cuando esté';
  }
  return 'Sin enviar a cocina';
}

/** Plato enviado a cocina que el mesero aún puede recoger o reportar. */
export function detallePuedeRecogerMesero(d: DetalleCocinaLike): boolean {
  return (
    d.marcar_cocina &&
    (d.enviado_cocina ?? false) &&
    !d.listo_cocina &&
    !d.es_bebida &&
    !d.es_empacable
  );
}

/** Alias usado en el API (`pedidos-vista-operativa`). */
export const detallePendienteRecogerMesero = detallePuedeRecogerMesero;

export function platosPendientesRecogerPedido(p: PedidoCocinaLike): number {
  return p.detalles
    .filter(detallePuedeRecogerMesero)
    .reduce((acc, d) => acc + d.cantidad, 0);
}

export function pedidoTieneRecogidaPendiente(p: PedidoCocinaLike): boolean {
  return platosPendientesRecogerPedido(p) > 0;
}

export function nombreMeseroPedido(p: PedidoCocinaLike): string {
  const m = p.mesero;
  if (!m) return 'Mesero';
  const nombre = (m.nombre ?? '').trim();
  const apellido = (m.apellido ?? '').trim();
  if (!nombre && !apellido) return 'Mesero';
  if (!apellido) return nombre;
  if (!nombre) return apellido;
  return `${nombre} ${apellido.charAt(0)}.`;
}

export function detalleCocinaAviso(d: DetalleCocinaLike): boolean {
  return detallePuedeRecogerMesero(d) && (d.listo_para_recoger ?? false);
}

export type PlatoPendienteResumen = {
  nombre: string;
  total: number;
  mesas: number[];
  esCerdo: boolean;
};

function detalleEsperandoRecogida(d: DetalleCocinaLike): boolean {
  return (
    d.marcar_cocina &&
    (d.enviado_cocina ?? false) &&
    (d.listo_para_recoger ?? false) &&
    !d.listo_cocina &&
    !d.es_bebida &&
    !d.es_empacable
  );
}

export function platosEsperandoRecogida(pedido: PedidoCocinaLike): number {
  return pedido.detalles
    .filter(detalleEsperandoRecogida)
    .reduce((acc, d) => acc + d.cantidad, 0);
}

export function totalPlatosEsperandoRecogida(
  pedidos: PedidoCocinaLike[],
): number {
  return pedidos.reduce((acc, p) => acc + platosEsperandoRecogida(p), 0);
}

function detalleSinEnviarCocina(d: DetalleCocinaLike): boolean {
  return d.marcar_cocina && !(d.enviado_cocina ?? false);
}

export function platosSinEnviarCocina(pedido: PedidoCocinaLike): number {
  return pedido.detalles
    .filter(detalleSinEnviarCocina)
    .reduce((acc, d) => acc + d.cantidad, 0);
}

export function totalPlatosSinEnviarCocina(pedidos: PedidoCocinaLike[]): number {
  return pedidos.reduce((acc, p) => acc + platosSinEnviarCocina(p), 0);
}

export function etiquetaPlatoPendiente(nombre: string, total: number): string {
  const base = nombre.trim() || 'Plato';
  if (total === 1) return `${base} pendiente: 1`;
  return `${base} pendientes: ${total}`;
}

export function agruparPlatosPendientes(
  items: PedidoCocinaLike[],
): PlatoPendienteResumen[] {
  const porPlato = new Map<
    string,
    { total: number; mesas: Set<number>; esCerdo: boolean }
  >();
  for (const pedido of items) {
    for (const d of pedido.detalles) {
      if (!detalleVisibleEnCocina(d)) continue;
      const nombre = (d.nombre_producto ?? '').trim() || 'Plato';
      const esCerdo = (d.tipo_proteina ?? '').toLowerCase() === 'cerdo';
      const prev = porPlato.get(nombre) ?? {
        total: 0,
        mesas: new Set<number>(),
        esCerdo,
      };
      prev.total += d.cantidad;
      prev.mesas.add(pedido.mesa_numero);
      prev.esCerdo = prev.esCerdo || esCerdo;
      porPlato.set(nombre, prev);
    }
  }
  return Array.from(porPlato.entries())
    .map(([nombre, v]) => ({
      nombre,
      total: v.total,
      mesas: Array.from(v.mesas).sort((a, b) => a - b),
      esCerdo: v.esCerdo,
    }))
    .sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre, 'es'));
}

export function mesasActivasDePedidos(
  pedidos: Pick<PedidoCocinaLike, 'mesa_numero'>[],
): number[] {
  return Array.from(new Set(pedidos.map((p) => p.mesa_numero))).sort(
    (a, b) => a - b,
  );
}

export function resumenItemsMesero(
  pedidos: PedidoCocinaLike[],
  etiquetaMesa: (numero: number) => string = tituloLugarMesa,
) {
  const porItem = new Map<string, { total: number; mesas: Set<number> }>();
  for (const pedido of pedidos) {
    for (const d of pedido.detalles) {
      const nombre = (d.nombre_producto ?? '').trim() || 'Ítem';
      const prev = porItem.get(nombre) ?? { total: 0, mesas: new Set<number>() };
      prev.total += d.cantidad;
      prev.mesas.add(pedido.mesa_numero);
      porItem.set(nombre, prev);
    }
  }
  return Array.from(porItem.entries())
    .map(([nombre, v]) => ({
      nombre,
      total: v.total,
      mesasLabel: Array.from(v.mesas)
        .sort((a, b) => a - b)
        .map((m) => etiquetaMesa(m))
        .join(', '),
    }))
    .sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre, 'es'));
}
