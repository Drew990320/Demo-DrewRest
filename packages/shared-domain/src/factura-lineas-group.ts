export type LineaFacturaAgrupable = {
  id_detalle: number;
  id_producto?: number;
  id_detalle_padre: number | null;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal_linea: number;
  nota_cocina?: string | null;
  cobrado?: boolean;
  personalizaciones?: { id_opcion?: number; descripcion: string }[];
};

export type LineaFacturaGrupo = LineaFacturaAgrupable & {
  ids_detalle: number[];
};

function claveFactura(d: LineaFacturaAgrupable): string {
  const pers = (d.personalizaciones ?? [])
    .map((p) => String(p.id_opcion ?? p.descripcion))
    .sort()
    .join(',');
  return [
    d.id_producto ?? d.nombre_producto,
    d.precio_unitario,
    (d.nota_cocina ?? '').trim(),
    pers,
    d.id_detalle_padre ?? 'root',
    d.cobrado ? '1' : '0',
  ].join('|');
}

/** Agrupa ítems idénticos en factura / pre-cuenta (mismo producto, precio y personalización). */
export function agruparLineasFactura(
  detalles: LineaFacturaAgrupable[],
): LineaFacturaGrupo[] {
  const orden: string[] = [];
  const map = new Map<string, LineaFacturaGrupo>();

  for (const d of detalles) {
    const key = claveFactura(d);
    const prev = map.get(key);
    if (!prev) {
      orden.push(key);
      map.set(key, { ...d, ids_detalle: [d.id_detalle] });
      continue;
    }
    prev.cantidad += d.cantidad;
    prev.subtotal_linea += d.subtotal_linea;
    prev.ids_detalle.push(d.id_detalle);
  }

  return orden
    .map((key) => map.get(key))
    .filter((g): g is LineaFacturaGrupo => g != null);
}

export type LineaFacturaTicket = {
  cantidad: number;
  nombre_producto: string;
  precio_unitario: number;
  subtotal_linea: number;
  personalizaciones: string[];
  nota_cocina: string | null;
};

export function lineasFacturaParaTicket(
  detalles: LineaFacturaAgrupable[],
): LineaFacturaTicket[] {
  return agruparLineasFactura(detalles).map((g) => ({
    cantidad: g.cantidad,
    nombre_producto: g.nombre_producto,
    precio_unitario: g.cantidad > 0 ? g.subtotal_linea / g.cantidad : 0,
    subtotal_linea: g.subtotal_linea,
    personalizaciones: (g.personalizaciones ?? []).map((p) => p.descripcion),
    nota_cocina: g.nota_cocina ?? null,
  }));
}
