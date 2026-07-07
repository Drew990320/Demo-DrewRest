/** Expande ítems seleccionados incluyendo empaques hijos aún pendientes de cobro. */
export function expandirDetallesParaCobro(
  detalles: {
    id_detalle: number;
    id_detalle_padre: number | null;
    cobrado: boolean;
  }[],
  idsSolicitados: number[],
): number[] {
  const byId = new Map(detalles.map((d) => [d.id_detalle, d]));
  const out = new Set<number>();

  for (const id of idsSolicitados) {
    const d = byId.get(id);
    if (!d || d.cobrado) continue;
    out.add(id);
    for (const hijo of detalles) {
      if (hijo.id_detalle_padre === id && !hijo.cobrado) {
        out.add(hijo.id_detalle);
      }
    }
  }
  return [...out];
}

export function idsDetallesPendientes(
  detalles: { id_detalle: number; cobrado: boolean }[],
): number[] {
  return detalles.filter((d) => !d.cobrado).map((d) => d.id_detalle);
}

export function pedidoCobroCompleto(
  detalles: { cobrado: boolean }[],
): boolean {
  return detalles.length > 0 && detalles.every((d) => d.cobrado);
}

export type DetalleSerialCobro = {
  id_detalle: number;
  id_detalle_padre: number | null;
  cobrado: boolean;
  cantidad: number;
};

export type DetalleCobroCantidad = {
  id_detalle: number;
  cantidad: number;
};

export function resolverSolicitudesCobro(
  opts: {
    id_detalles?: number[];
    detalles_cobro?: DetalleCobroCantidad[];
  },
  detalles: DetalleSerialCobro[],
  pendientes: number[],
): DetalleCobroCantidad[] {
  const byId = new Map(detalles.map((d) => [d.id_detalle, d]));

  if (opts.detalles_cobro?.length) {
    return opts.detalles_cobro
      .map((s) => ({
        id_detalle: s.id_detalle,
        cantidad: Math.floor(s.cantidad),
      }))
      .filter((s) => s.cantidad > 0);
  }

  const idsBase =
    opts.id_detalles?.length && opts.id_detalles.length > 0
      ? opts.id_detalles
      : pendientes;
  const ids = expandirDetallesParaCobro(detalles, idsBase);
  return ids.map((id) => {
    const d = byId.get(id);
    return { id_detalle: id, cantidad: d?.cantidad ?? 1 };
  });
}

/** Incluye empaques hijos pendientes; cobra hasta la cantidad disponible (empaque compartido). */
export function expandirSolicitudesConEmpaques(
  detalles: DetalleSerialCobro[],
  solicitudes: DetalleCobroCantidad[],
): DetalleCobroCantidad[] {
  const map = new Map<number, number>();

  for (const s of solicitudes) {
    const d = detalles.find((x) => x.id_detalle === s.id_detalle);
    if (!d || d.cobrado) continue;
    if (s.cantidad < 1 || s.cantidad > d.cantidad) {
      throw new Error(`Cantidad inválida para el ítem #${s.id_detalle}`);
    }
    map.set(s.id_detalle, s.cantidad);

    if (d.id_detalle_padre == null) {
      for (const h of detalles) {
        if (h.id_detalle_padre === s.id_detalle && !h.cobrado) {
          const cantidadEmpaque = Math.min(s.cantidad, h.cantidad);
          if (cantidadEmpaque > 0) {
            map.set(h.id_detalle, cantidadEmpaque);
          }
        }
      }
    }
  }

  return [...map.entries()].map(([id_detalle, cantidad]) => ({
    id_detalle,
    cantidad,
  }));
}

export function ordenarSolicitudesCobro(
  detalles: DetalleSerialCobro[],
  solicitudes: DetalleCobroCantidad[],
): DetalleCobroCantidad[] {
  const byId = new Map(detalles.map((d) => [d.id_detalle, d]));
  return [...solicitudes].sort((a, b) => {
    const da = byId.get(a.id_detalle);
    const db = byId.get(b.id_detalle);
    const pa = da?.id_detalle_padre == null ? 0 : 1;
    const pb = db?.id_detalle_padre == null ? 0 : 1;
    return pa - pb || a.id_detalle - b.id_detalle;
  });
}

export function subtotalDesdeSolicitudes(
  detalles: {
    id_detalle: number;
    precio_unitario: number;
    cantidad: number;
  }[],
  solicitudes: DetalleCobroCantidad[],
): number {
  const byId = new Map(detalles.map((d) => [d.id_detalle, d]));
  let subtotal = 0;
  for (const s of solicitudes) {
    const d = byId.get(s.id_detalle);
    if (!d) continue;
    subtotal += d.precio_unitario * s.cantidad;
  }
  return subtotal;
}

export function lineasDescuentoDesdeSolicitudes<
  T extends {
    id_detalle: number;
    cantidad: number;
    precio_unitario: number;
    nombre_producto: string;
    categoria_nombre?: string;
    id_categoria?: number;
    id_producto?: number;
    es_plato_principal?: boolean;
    participa_descuento_sopas?: boolean;
  },
>(detalles: T[], solicitudes: DetalleCobroCantidad[]) {
  const qty = new Map(solicitudes.map((s) => [s.id_detalle, s.cantidad]));
  return detalles
    .filter((d) => qty.has(d.id_detalle))
    .map((d) => {
      const q = qty.get(d.id_detalle)!;
      const pu = d.precio_unitario;
      return {
        id_detalle: d.id_detalle,
        cantidad: q,
        subtotal_linea: pu * q,
        nombre_producto: d.nombre_producto,
        categoria_nombre: d.categoria_nombre ?? '',
        id_categoria: d.id_categoria,
        id_producto: d.id_producto,
        precio_unitario: pu,
        es_plato_principal: d.es_plato_principal,
        participa_descuento_sopas: d.participa_descuento_sopas,
      };
    });
}

export function unidadesEnSolicitudes(
  solicitudes: DetalleCobroCantidad[],
): number {
  return solicitudes.reduce((s, x) => s + x.cantidad, 0);
}

/** Tras aplicar estas cantidades, ¿queda algo pendiente en el pedido? */
export function quedaPendienteTrasCobro(
  detalles: DetalleSerialCobro[],
  solicitudes: DetalleCobroCantidad[],
): boolean {
  const qty = new Map(solicitudes.map((s) => [s.id_detalle, s.cantidad]));
  return detalles.some((d) => {
    if (d.cobrado) return false;
    const cobrar = qty.get(d.id_detalle) ?? 0;
    return d.cantidad - cobrar > 0;
  });
}

export function solicitudesDesdeCantidades(
  cantidades: Record<number, number>,
): DetalleCobroCantidad[] {
  return Object.entries(cantidades)
    .map(([id, cantidad]) => ({
      id_detalle: Number(id),
      cantidad: Math.floor(cantidad),
    }))
    .filter((s) => s.cantidad > 0 && Number.isFinite(s.id_detalle));
}
