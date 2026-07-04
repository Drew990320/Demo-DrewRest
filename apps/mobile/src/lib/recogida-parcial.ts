import {
  agruparLineasPedido,
  type LineaPedidoBase,
  type LineaPedidoGrupo,
} from './pedido-detalle-group';
import {
  detalleCocinaAviso,
  detallePuedeRecogerMesero,
  type DetalleCocinaLike,
  type DetalleCocinaView,
} from './cocina-pedido-view';

export type SolicitudRecogidaCocina = {
  id_detalle: number;
  cantidad: number;
};

export function detalleALineaPedido(d: DetalleCocinaView): LineaPedidoBase {
  return {
    id_detalle: d.id_detalle,
    id_detalle_padre: null,
    nombre_producto: d.nombre_producto,
    categoria_nombre: d.categoria_nombre,
    es_plato_principal: d.es_plato_principal,
    cantidad: d.cantidad,
    precio_unitario: 0,
    subtotal_linea: 0,
    nota_cocina: d.nota_cocina,
    es_empacable: d.es_empacable,
    es_bebida: d.es_bebida,
    marcar_cocina: d.marcar_cocina,
    enviado_cocina: d.enviado_cocina,
    listo_cocina: d.listo_cocina,
    listo_para_recoger: d.listo_para_recoger,
    es_acompanamiento_mazorca: d.es_acompanamiento_mazorca,
    personalizaciones: d.personalizaciones,
  };
}

export function agruparDetallesMesero(
  detalles: DetalleCocinaView[],
): LineaPedidoGrupo[] {
  return agruparLineasPedido(detalles.map(detalleALineaPedido));
}

export function maxRecogibleDetalle(d: DetalleCocinaLike): number {
  return detallePuedeRecogerMesero(d) ? d.cantidad : 0;
}

export function maxRecogibleGrupo<T extends DetalleCocinaLike>(
  g: LineaPedidoGrupo,
  byId: Map<number, T>,
): number {
  return g.ids_detalle.reduce((s, id) => {
    const d = byId.get(id);
    return s + (d ? maxRecogibleDetalle(d) : 0);
  }, 0);
}

function selEfectivaGrupo<T extends DetalleCocinaLike>(
  g: LineaPedidoGrupo,
  cantidades: Record<number, number>,
  byId: Map<number, T>,
): number {
  const hasExplicit = g.ids_detalle.some((id) => (cantidades[id] ?? 0) > 0);
  if (!hasExplicit) return maxRecogibleGrupo(g, byId);
  return g.ids_detalle.reduce((s, id) => s + (cantidades[id] ?? 0), 0);
}

function escribirSelEnIds<T extends DetalleCocinaLike>(
  g: LineaPedidoGrupo,
  byId: Map<number, T>,
  total: number,
): SolicitudRecogidaCocina[] {
  let rest = total;
  const out: SolicitudRecogidaCocina[] = [];
  for (const id of g.ids_detalle) {
    if (rest <= 0) break;
    const d = byId.get(id);
    if (!d) continue;
    const max = maxRecogibleDetalle(d);
    const take = Math.min(rest, max);
    if (take > 0) {
      out.push({ id_detalle: id, cantidad: take });
      rest -= take;
    }
  }
  return out;
}

export function cantidadSeleccionadaGrupoRecogida<T extends DetalleCocinaLike>(
  g: LineaPedidoGrupo,
  cantidades: Record<number, number>,
  byId: Map<number, T>,
): number {
  return selEfectivaGrupo(g, cantidades, byId);
}

export function cambiarCantidadGrupoRecogida<T extends DetalleCocinaLike>(
  g: LineaPedidoGrupo,
  delta: number,
  byId: Map<number, T>,
  prev: Record<number, number>,
): Record<number, number> {
  const max = maxRecogibleGrupo(g, byId);
  const sel = selEfectivaGrupo(g, prev, byId);
  const nextSel = Math.max(0, Math.min(max, sel + delta));
  if (nextSel <= 0) return {};
  const solicitudes = escribirSelEnIds(g, byId, nextSel);
  const next: Record<number, number> = {};
  for (const s of solicitudes) next[s.id_detalle] = s.cantidad;
  return next;
}

export function distribuirRecogidaEnGrupo<T extends DetalleCocinaLike>(
  g: LineaPedidoGrupo,
  cantidades: Record<number, number>,
  byId: Map<number, T>,
): SolicitudRecogidaCocina[] {
  const total = selEfectivaGrupo(g, cantidades, byId);
  if (total <= 0) return [];
  return escribirSelEnIds(g, byId, total);
}

export function grupoCocinaAviso<T extends DetalleCocinaLike>(
  g: LineaPedidoGrupo,
  byId: Map<number, T>,
): boolean {
  return g.ids_detalle.some((id) => {
    const d = byId.get(id);
    return d ? detalleCocinaAviso(d) : false;
  });
}

export function etiquetaEstadoLineaGrupoMesero<T extends DetalleCocinaLike>(
  g: LineaPedidoGrupo,
  byId: Map<number, T>,
): string {
  const d = byId.get(g.id_detalle);
  if (!d) return '';
  const max = maxRecogibleGrupo(g, byId);
  if (max <= 0) {
    if (g.listo_cocina) return 'Recogido · ya en la mesa';
    if (d.es_bebida) return 'Bebida (se cobra al final)';
    if (d.es_empacable) return 'Empaque';
    if (!(d.enviado_cocina ?? false)) return 'Sin enviar a cocina';
    return 'En cocina';
  }
  const base =
    grupoCocinaAviso(g, byId)
      ? '¡Cocina avisó! Listo para recoger'
      : 'En cocina · puedes recoger cuando esté';
  if (g.cantidad > 1) {
    return `${base} · ${max} pendiente${max === 1 ? '' : 's'}`;
  }
  return base;
}
