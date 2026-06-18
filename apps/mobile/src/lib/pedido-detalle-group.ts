export type LineaPedidoBase = {
  id_detalle: number;
  id_producto?: number;
  id_detalle_padre: number | null;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal_linea: number;
  nota_cocina: string | null;
  es_empacable?: boolean;
  es_bebida?: boolean;
  marcar_cocina?: boolean;
  enviado_cocina?: boolean;
  listo_cocina?: boolean;
  listo_para_recoger?: boolean;
  es_acompanamiento_mazorca?: boolean;
  personalizaciones: { id_opcion?: number; descripcion: string; tipo: string }[];
};

export type LineaPedidoGrupo = LineaPedidoBase & {
  ids_detalle: number[];
  id_detalle_incremento: number;
  id_detalle_decremento: number;
};

export type AgruparLineasOpciones = {
  /**
   * Pantalla mesa: agrupa aunque listo_cocina / listo_para_recoger difieran
   * (p. ej. tras recogida parcial o «llamar mesero»), si el ítem se ve igual.
   */
  soloEstadoVisible?: boolean;
};

function claveAgrupacion(
  d: LineaPedidoBase,
  opts?: AgruparLineasOpciones,
): string {
  const pers = d.personalizaciones
    .map((p) => String(p.id_opcion ?? p.descripcion))
    .sort()
    .join(',');
  const parts = [
    d.id_producto ?? d.nombre_producto,
    (d.nota_cocina ?? '').trim(),
    pers,
    d.id_detalle_padre ?? 'root',
    d.enviado_cocina ? '1' : '0',
  ];
  if (!opts?.soloEstadoVisible) {
    parts.push(d.listo_cocina ? '1' : '0', d.listo_para_recoger ? '1' : '0');
  }
  parts.push(d.es_empacable ? 'emp' : '', d.es_bebida ? 'beb' : '');
  return parts.join('|');
}

function elegirIncremento(
  actualId: number,
  candidatoId: number,
  actual: LineaPedidoBase,
  candidato: LineaPedidoBase,
  opts?: AgruparLineasOpciones,
): number {
  const enviadoActual = Boolean(actual.enviado_cocina);
  const enviadoCandidato = Boolean(candidato.enviado_cocina);
  if (!enviadoCandidato && enviadoActual) return candidatoId;
  if (enviadoCandidato && !enviadoActual) return actualId;
  if (opts?.soloEstadoVisible) {
    const listoActual = Boolean(actual.listo_cocina);
    const listoCandidato = Boolean(candidato.listo_cocina);
    if (!listoCandidato && listoActual) return candidatoId;
    if (listoCandidato && !listoActual) return actualId;
  }
  return enviadoActual ? actualId : Math.min(actualId, candidatoId);
}

function elegirDecremento(
  actualId: number,
  candidatoId: number,
  actual: LineaPedidoBase,
  candidato: LineaPedidoBase,
  opts?: AgruparLineasOpciones,
): number {
  const enviadoActual = Boolean(actual.enviado_cocina);
  const enviadoCandidato = Boolean(candidato.enviado_cocina);
  if (!enviadoCandidato && enviadoActual) return candidatoId;
  if (enviadoCandidato && !enviadoActual) return actualId;
  if (opts?.soloEstadoVisible) {
    const listoActual = Boolean(actual.listo_cocina);
    const listoCandidato = Boolean(candidato.listo_cocina);
    if (!listoCandidato && listoActual) return candidatoId;
    if (listoCandidato && !listoActual) return actualId;
    return Math.max(actualId, candidatoId);
  }
  return Math.max(actualId, candidatoId);
}

/** Agrupa líneas idénticas (mismo producto, nota, personalización y estado en cocina). */
export function agruparLineasPedido(
  detalles: LineaPedidoBase[],
  opts?: AgruparLineasOpciones,
): LineaPedidoGrupo[] {
  const byId = new Map(detalles.map((d) => [d.id_detalle, d]));
  const orden: string[] = [];
  const map = new Map<string, LineaPedidoGrupo>();

  for (const d of detalles) {
    const key = claveAgrupacion(d, opts);
    const prev = map.get(key);
    if (!prev) {
      orden.push(key);
      map.set(key, {
        ...d,
        ids_detalle: [d.id_detalle],
        id_detalle_incremento: d.id_detalle,
        id_detalle_decremento: d.id_detalle,
      });
      continue;
    }
    prev.cantidad += d.cantidad;
    prev.subtotal_linea += d.subtotal_linea;
    prev.ids_detalle.push(d.id_detalle);
    const prevInc = byId.get(prev.id_detalle_incremento)!;
    const prevDec = byId.get(prev.id_detalle_decremento)!;
    prev.id_detalle_incremento = elegirIncremento(
      prev.id_detalle_incremento,
      d.id_detalle,
      prevInc,
      d,
      opts,
    );
    prev.id_detalle_decremento = elegirDecremento(
      prev.id_detalle_decremento,
      d.id_detalle,
      prevDec,
      d,
      opts,
    );
  }

  return orden
    .map((key) => map.get(key))
    .filter((g): g is LineaPedidoGrupo => g != null);
}

export function etiquetaEstadoLineaPedido(d: LineaPedidoBase): string {
  if (d.es_acompanamiento_mazorca) return ' · acompañamiento';
  if (d.es_empacable) return ' · empaque';
  if (d.es_bebida) return ' · bebida';
  if (d.marcar_cocina && !d.enviado_cocina) return ' · pend. cocina';
  if (d.marcar_cocina && d.enviado_cocina) return ' · en cocina';
  return '';
}
