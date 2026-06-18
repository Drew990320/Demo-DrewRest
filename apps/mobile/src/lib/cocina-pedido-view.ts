import { tituloLugarMesa } from './mesa-label';

export type DetalleCocinaView = {
  id_detalle: number;
  nombre_producto: string;
  cantidad: number;
  nota_cocina: string | null;
  categoria_nombre: string;
  tipo_proteina?: string;
  enviado_cocina?: boolean;
  listo_para_recoger?: boolean;
  es_bebida: boolean;
  es_empacable?: boolean;
  es_acompanamiento_mazorca?: boolean;
  marcar_cocina: boolean;
  listo_cocina: boolean;
  personalizaciones: { descripcion: string; tipo: string }[];
};

export type PedidoCocinaView = {
  id_pedido: number;
  id_mesa: number;
  mesa_numero: number;
  estado: string;
  num_comensales: number;
  creado_en: string;
  mesero?: {
    id: number;
    nombre: string;
    apellido: string;
    rol: string;
  };
  prioridad_cocina: 'alta' | 'baja';
  prioridad_cocina_origen: 'auto' | 'manual';
  prioridad_cocina_auto: 'alta' | 'baja';
  prioridad_cocina_override: 'alta' | 'baja' | null;
  detalles: DetalleCocinaView[];
};

export function normalizarPedidoCocinaView(p: PedidoCocinaView): PedidoCocinaView {
  return {
    ...p,
    prioridad_cocina: p.prioridad_cocina ?? 'alta',
    prioridad_cocina_origen: p.prioridad_cocina_origen ?? 'auto',
    prioridad_cocina_auto: p.prioridad_cocina_auto ?? 'alta',
    prioridad_cocina_override: p.prioridad_cocina_override ?? null,
  };
}

export function detalleVisibleEnCocina(d: DetalleCocinaView): boolean {
  return (
    d.marcar_cocina &&
    (d.enviado_cocina ?? false) &&
    !d.listo_cocina &&
    !d.es_bebida &&
    !d.es_empacable
  );
}

export function pedidoActivoEnCocina(pedido: PedidoCocinaView): boolean {
  return pedido.detalles.some(detalleVisibleEnCocina);
}

export function ordenarDetallesCocina(detalles: DetalleCocinaView[]) {
  const visibles = detalles.filter(detalleVisibleEnCocina);
  const skip = (d: DetalleCocinaView) => d.es_bebida || d.es_empacable;
  return [...visibles].sort((a, b) => {
    if (a.es_acompanamiento_mazorca !== b.es_acompanamiento_mazorca) {
      return a.es_acompanamiento_mazorca ? -1 : 1;
    }
    if (skip(a) === skip(b)) return a.id_detalle - b.id_detalle;
    return skip(a) ? 1 : -1;
  });
}

export function ordenarDetallesMesero(detalles: DetalleCocinaView[]) {
  return [...detalles].sort((a, b) => a.id_detalle - b.id_detalle);
}

export function etiquetaEstadoLineaMesero(d: DetalleCocinaView): string {
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
  if (d.enviado_cocina ?? false) return 'En cocina · puedes recoger cuando esté';
  return 'Sin enviar a cocina';
}

/** Plato enviado a cocina que el mesero aún puede recoger o reportar. */
export function detallePuedeRecogerMesero(d: DetalleCocinaView): boolean {
  return (
    d.marcar_cocina &&
    (d.enviado_cocina ?? false) &&
    !d.listo_cocina &&
    !d.es_bebida &&
    !d.es_empacable
  );
}

export function platosPendientesRecogerPedido(p: PedidoCocinaView): number {
  return p.detalles
    .filter(detallePuedeRecogerMesero)
    .reduce((acc, d) => acc + d.cantidad, 0);
}

export function pedidoTieneRecogidaPendiente(p: PedidoCocinaView): boolean {
  return platosPendientesRecogerPedido(p) > 0;
}

export function nombreMeseroPedido(p: PedidoCocinaView): string {
  const m = p.mesero;
  if (!m) return 'Mesero';
  const nombre = (m.nombre ?? '').trim();
  const apellido = (m.apellido ?? '').trim();
  if (!nombre && !apellido) return 'Mesero';
  if (!apellido) return nombre;
  if (!nombre) return apellido;
  return `${nombre} ${apellido.charAt(0)}.`;
}

export function detalleCocinaAviso(d: DetalleCocinaView): boolean {
  return detallePuedeRecogerMesero(d) && (d.listo_para_recoger ?? false);
}

export type PlatoPendienteResumen = {
  nombre: string;
  total: number;
  mesas: number[];
  esCerdo: boolean;
};

function detalleAplicaCocinaPendiente(d: DetalleCocinaView): boolean {
  return detalleVisibleEnCocina(d);
}

function detalleEsperandoRecogida(d: DetalleCocinaView): boolean {
  return (
    d.marcar_cocina &&
    (d.enviado_cocina ?? false) &&
    (d.listo_para_recoger ?? false) &&
    !d.listo_cocina &&
    !d.es_bebida &&
    !d.es_empacable
  );
}

export function platosEsperandoRecogida(pedido: PedidoCocinaView): number {
  return pedido.detalles
    .filter(detalleEsperandoRecogida)
    .reduce((acc, d) => acc + d.cantidad, 0);
}

export function totalPlatosEsperandoRecogida(pedidos: PedidoCocinaView[]): number {
  return pedidos.reduce((acc, p) => acc + platosEsperandoRecogida(p), 0);
}

function detalleSinEnviarCocina(d: DetalleCocinaView): boolean {
  return d.marcar_cocina && !(d.enviado_cocina ?? false);
}

/** Platos (cantidad) que aún no se han pasado a cocina en un pedido. */
export function platosSinEnviarCocina(pedido: PedidoCocinaView): number {
  return pedido.detalles
    .filter(detalleSinEnviarCocina)
    .reduce((acc, d) => acc + d.cantidad, 0);
}

export function totalPlatosSinEnviarCocina(pedidos: PedidoCocinaView[]): number {
  return pedidos.reduce((acc, p) => acc + platosSinEnviarCocina(p), 0);
}

export function etiquetaPlatoPendiente(nombre: string, total: number): string {
  const base = nombre.trim() || 'Plato';
  if (total === 1) return `${base} pendiente: 1`;
  return `${base} pendientes: ${total}`;
}

export function agruparPlatosPendientes(
  items: PedidoCocinaView[],
): PlatoPendienteResumen[] {
  const porPlato = new Map<
    string,
    { total: number; mesas: Set<number>; esCerdo: boolean }
  >();
  for (const pedido of items) {
    for (const d of pedido.detalles) {
      if (!detalleAplicaCocinaPendiente(d)) continue;
      const nombre = d.nombre_producto.trim() || 'Plato';
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

export function mesasActivasDePedidos(pedidos: PedidoCocinaView[]): number[] {
  return Array.from(new Set(pedidos.map((p) => p.mesa_numero))).sort(
    (a, b) => a - b,
  );
}

export function resumenItemsMesero(pedidos: PedidoCocinaView[]) {
  const porItem = new Map<string, { total: number; mesas: Set<number> }>();
  for (const pedido of pedidos) {
    for (const d of pedido.detalles) {
      const nombre = d.nombre_producto.trim() || 'Ítem';
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
        .map((m) => tituloLugarMesa(m))
        .join(', '),
    }))
    .sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre, 'es'));
}
