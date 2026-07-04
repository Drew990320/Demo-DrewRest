import { tituloLugarMesa } from './mesa-label';
import {
  ordenTipoLineaCocina,
  tipoLineaCocina,
  type TipoLineaCocina,
} from './cocina-producto';

export type { TipoLineaCocina };
export {
  etiquetaTipoLineaCocina,
  ordenTipoLineaCocina,
  tipoLineaCocina,
} from './cocina-producto';

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
  es_plato_principal?: boolean;
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
  return [...visibles].sort((a, b) => {
    const ta = ordenTipoLineaCocina(tipoLineaCocina(a));
    const tb = ordenTipoLineaCocina(tipoLineaCocina(b));
    if (ta !== tb) return ta - tb;
    return a.id_detalle - b.id_detalle;
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
  tipo: TipoLineaCocina;
};

export function conteoPorTipoEnCocina(
  pedidos: PedidoCocinaLike[],
): Record<TipoLineaCocina, number> {
  const out: Record<TipoLineaCocina, number> = {
    plato: 0,
    entrada: 0,
    adicional: 0,
    mazorca: 0,
    sopa: 0,
  };
  for (const pedido of pedidos) {
    for (const d of pedido.detalles) {
      if (!detalleVisibleEnCocina(d)) continue;
      out[tipoLineaCocina(d)] += d.cantidad;
    }
  }
  return out;
}

export function textoResumenTiposCocina(
  conteo: Record<TipoLineaCocina, number>,
): string {
  const parts: string[] = [];
  if (conteo.plato > 0) {
    parts.push(`${conteo.plato} ${conteo.plato === 1 ? 'plato' : 'platos'}`);
  }
  if (conteo.entrada > 0) {
    parts.push(
      `${conteo.entrada} ${conteo.entrada === 1 ? 'entrada' : 'entradas'}`,
    );
  }
  if (conteo.adicional > 0) {
    parts.push(
      `${conteo.adicional} ${conteo.adicional === 1 ? 'adicional' : 'adicionales'}`,
    );
  }
  if (conteo.mazorca > 0) {
    parts.push(
      `${conteo.mazorca} ${conteo.mazorca === 1 ? 'mazorca' : 'mazorcas'}`,
    );
  }
  if (conteo.sopa > 0) {
    parts.push(`${conteo.sopa} ${conteo.sopa === 1 ? 'sopa' : 'sopas'}`);
  }
  return parts.join(' · ');
}

/** Cola FIFO por hora de creación del pedido (sin prioridad alta/baja). */
export function ordenarPedidosCocinaPorLlegada<
  T extends { creado_en: Date | string },
>(pedidos: T[]): T[] {
  return [...pedidos].sort((a, b) => {
    const ta =
      typeof a.creado_en === 'string'
        ? new Date(a.creado_en).getTime()
        : a.creado_en.getTime();
    const tb =
      typeof b.creado_en === 'string'
        ? new Date(b.creado_en).getTime()
        : b.creado_en.getTime();
    return ta - tb;
  });
}

export function mesasEnOrdenDeLlegada(
  pedidos: { mesa_numero: number; creado_en: Date | string }[],
): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const p of ordenarPedidosCocinaPorLlegada(pedidos)) {
    if (!seen.has(p.mesa_numero)) {
      seen.add(p.mesa_numero);
      out.push(p.mesa_numero);
    }
  }
  return out;
}

export function ordenarMesasPorCola(
  mesas: number[],
  colaMesas: number[],
): number[] {
  const rank = new Map(colaMesas.map((m, i) => [m, i]));
  return [...mesas].sort(
    (a, b) => (rank.get(a) ?? 999) - (rank.get(b) ?? 999) || a - b,
  );
}

export function porcionesVisiblesEnCocina(pedido: PedidoCocinaLike): number {
  return pedido.detalles
    .filter(detalleVisibleEnCocina)
    .reduce((acc, d) => acc + d.cantidad, 0);
}

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

/** Separa platos de cocina y mazorcas (entradas) en conteos de recogida. */
export function conteoRecogidaPorTipo(
  detalles: DetalleCocinaLike[],
  incluir: (d: DetalleCocinaLike) => boolean,
): { platos: number; entradas: number } {
  let platos = 0;
  let entradas = 0;
  for (const d of detalles) {
    if (!incluir(d)) continue;
    if (d.es_acompanamiento_mazorca) entradas += d.cantidad;
    else platos += d.cantidad;
  }
  return { platos, entradas };
}

export function conteoEsperandoRecogidaPorTipo(
  pedido: PedidoCocinaLike,
): { platos: number; entradas: number } {
  return conteoRecogidaPorTipo(pedido.detalles, detalleEsperandoRecogida);
}

export function totalEsperandoRecogidaPorTipo(
  pedidos: PedidoCocinaLike[],
): { platos: number; entradas: number } {
  return pedidos.reduce(
    (acc, p) => {
      const c = conteoEsperandoRecogidaPorTipo(p);
      return { platos: acc.platos + c.platos, entradas: acc.entradas + c.entradas };
    },
    { platos: 0, entradas: 0 },
  );
}

/** Texto para avisos al mesero (notificación / banner). */
export function mensajeListosParaRecoger(
  platos: number,
  entradas: number,
  sufijo = '',
): string {
  const parts: string[] = [];
  if (platos > 0) {
    parts.push(`${platos} ${platos === 1 ? 'plato' : 'platos'}`);
  }
  if (entradas > 0) {
    parts.push(`${entradas} ${entradas === 1 ? 'mazorca' : 'mazorcas'}`);
  }
  if (parts.length === 0) return `Listo para recoger${sufijo}`;
  const cuerpo =
    parts.length === 2 ? `${parts[0]} y ${parts[1]}` : parts[0]!;
  const verbo =
    platos > 0 && entradas > 0
      ? 'listos'
      : entradas > 0
        ? entradas === 1
          ? 'lista'
          : 'listas'
        : platos === 1
          ? 'listo'
          : 'listos';
  return `${cuerpo} ${verbo} para recoger${sufijo}`;
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
  colaMesas?: number[],
): PlatoPendienteResumen[] {
  const porPlato = new Map<
    string,
    { total: number; mesas: Set<number>; esCerdo: boolean; tipo: TipoLineaCocina }
  >();
  for (const pedido of items) {
    for (const d of pedido.detalles) {
      if (!detalleVisibleEnCocina(d)) continue;
      const nombre = (d.nombre_producto ?? '').trim() || 'Plato';
      const esCerdo = (d.tipo_proteina ?? '').toLowerCase() === 'cerdo';
      const tipo = tipoLineaCocina(d);
      const prev = porPlato.get(nombre) ?? {
        total: 0,
        mesas: new Set<number>(),
        esCerdo,
        tipo,
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
      mesas: colaMesas?.length
        ? ordenarMesasPorCola(Array.from(v.mesas), colaMesas)
        : Array.from(v.mesas).sort((a, b) => a - b),
      esCerdo: v.esCerdo,
      tipo: v.tipo,
    }))
    .sort((a, b) => {
      const ta = ordenTipoLineaCocina(a.tipo);
      const tb = ordenTipoLineaCocina(b.tipo);
      if (ta !== tb) return ta - tb;
      return b.total - a.total || a.nombre.localeCompare(b.nombre, 'es');
    });
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
