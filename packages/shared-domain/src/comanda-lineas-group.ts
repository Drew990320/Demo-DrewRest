export type LineaComandaAgrupable = {
  id_detalle: number;
  id_producto?: number;
  id_detalle_padre: number | null;
  nombre_producto: string;
  cantidad: number;
  nota_cocina?: string | null;
  personalizaciones?: { id_opcion?: number; descripcion: string }[];
};

export type LineaComandaTicket = {
  id_detalle: number;
  cantidad: number;
  nombre_producto: string;
  nota_cocina: string | null;
  personalizaciones: string[];
};

function claveComanda(d: LineaComandaAgrupable): string {
  const pers = (d.personalizaciones ?? [])
    .map((p) => String(p.id_opcion ?? p.descripcion))
    .sort()
    .join(',');
  return [
    d.id_producto ?? d.nombre_producto,
    (d.nota_cocina ?? '').trim(),
    pers,
    d.id_detalle_padre ?? 'root',
  ].join('|');
}

export function lineasComandaParaTicket(
  detalles: LineaComandaAgrupable[],
): LineaComandaTicket[] {
  const orden: string[] = [];
  const map = new Map<
    string,
    LineaComandaTicket & { _ids: number[] }
  >();

  for (const d of detalles) {
    const key = claveComanda(d);
    const prev = map.get(key);
    if (!prev) {
      orden.push(key);
      map.set(key, {
        id_detalle: d.id_detalle,
        cantidad: d.cantidad,
        nombre_producto: d.nombre_producto,
        nota_cocina: d.nota_cocina ?? null,
        personalizaciones: (d.personalizaciones ?? []).map((p) => p.descripcion),
        _ids: [d.id_detalle],
      });
      continue;
    }
    prev.cantidad += d.cantidad;
    prev._ids.push(d.id_detalle);
  }

  return orden.map((key) => {
    const row = map.get(key)!;
    return {
      id_detalle: row.id_detalle,
      cantidad: row.cantidad,
      nombre_producto: row.nombre_producto,
      nota_cocina: row.nota_cocina,
      personalizaciones: row.personalizaciones,
    };
  });
}
