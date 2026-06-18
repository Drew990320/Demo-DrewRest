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
  const orden: string[] = [];
  const map = new Map<
    string,
    LineaFacturaTicket & { _ids: number[] }
  >();

  for (const d of detalles) {
    const key = claveFactura(d);
    const prev = map.get(key);
    if (!prev) {
      orden.push(key);
      map.set(key, {
        cantidad: d.cantidad,
        nombre_producto: d.nombre_producto,
        precio_unitario: d.precio_unitario,
        subtotal_linea: d.subtotal_linea,
        personalizaciones: (d.personalizaciones ?? []).map((p) => p.descripcion),
        nota_cocina: d.nota_cocina ?? null,
        _ids: [d.id_detalle],
      });
      continue;
    }
    prev.cantidad += d.cantidad;
    prev.subtotal_linea += d.subtotal_linea;
    prev._ids.push(d.id_detalle);
  }

  return orden.map((key) => {
    const row = map.get(key)!;
    return {
      cantidad: row.cantidad,
      nombre_producto: row.nombre_producto,
      precio_unitario:
        row.cantidad > 0 ? row.subtotal_linea / row.cantidad : 0,
      subtotal_linea: row.subtotal_linea,
      personalizaciones: row.personalizaciones,
      nota_cocina: row.nota_cocina,
    };
  });
}
