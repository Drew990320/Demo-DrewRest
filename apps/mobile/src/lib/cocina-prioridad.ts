/** Misma lógica que `services/api/src/pedidos/cocina-prioridad.ts` (sin dependencia de Prisma). */

export type TipoProteina = 'ninguno' | 'pollo' | 'res' | 'cerdo' | 'otro';

export type PrioridadCocinaNivel = 'alta' | 'baja';

export function inferirTipoProteina(
  categoriaNombre: string,
  nombreProducto: string,
): TipoProteina {
  const c = categoriaNombre.toLowerCase();
  const n = nombreProducto.toLowerCase();
  if (c.includes('bebida') || c.includes('empaque')) return 'ninguno';
  if (c.includes('cerdo') || n.includes('cerdo') || n.includes('bondiola')) {
    return 'cerdo';
  }
  if (n.includes('chorizo') || n.includes('parrillada')) return 'cerdo';
  if (n.includes('costilla') && c.includes('cerdo')) return 'cerdo';
  if (c.includes('pollo') || n.includes('pollo') || n.includes('pechuga')) {
    return 'pollo';
  }
  if (n.includes('nuggets')) return 'pollo';
  if (c.includes('res') || c.includes('mixto')) {
    if (n.includes('chata')) return 'res';
    return 'otro';
  }
  if (c.includes('infantil')) return 'pollo';
  if (c.includes('entrada') || c.includes('adicional')) {
    if (n.includes('chorizo')) return 'cerdo';
    return 'otro';
  }
  if (c.includes('para compartir') || c.includes('picada')) return 'otro';
  if (c.includes('sopa')) return 'otro';
  return 'otro';
}

export function tipoProteinaResuelto(
  db: TipoProteina | undefined,
  categoriaNombre: string,
  nombreProducto: string,
): TipoProteina {
  if (db && db !== 'ninguno') return db;
  return inferirTipoProteina(categoriaNombre, nombreProducto);
}

export function prioridadAutomaticaDesdeTipos(
  tiposEnPlatosCocina: TipoProteina[],
): PrioridadCocinaNivel {
  if (tiposEnPlatosCocina.length === 0) return 'alta';
  if (tiposEnPlatosCocina.some((t) => t === 'cerdo')) return 'baja';
  return 'alta';
}

export function prioridadCocinaEfectiva(
  auto: PrioridadCocinaNivel,
  override: 'alta' | 'baja' | null | undefined,
): { nivel: PrioridadCocinaNivel; origen: 'auto' | 'manual' } {
  if (override === 'alta' || override === 'baja') {
    return { nivel: override, origen: 'manual' };
  }
  return { nivel: auto, origen: 'auto' };
}

export function ordenarPedidosCocina<
  T extends { prioridad_cocina: PrioridadCocinaNivel; creado_en: string },
>(pedidos: T[]): T[] {
  return [...pedidos].sort((a, b) => {
    const pa = a.prioridad_cocina === 'alta' ? 0 : 1;
    const pb = b.prioridad_cocina === 'alta' ? 0 : 1;
    if (pa !== pb) return pa - pb;
    return a.creado_en.localeCompare(b.creado_en);
  });
}

type LineaCocinaPendiente = {
  marcar_cocina?: boolean;
  enviado_cocina?: boolean;
  listo_para_recoger?: boolean;
  listo_cocina: boolean;
  cantidad: number;
};

export function contarPorcionesPendientesCocina(
  pedidos: { detalles: LineaCocinaPendiente[] }[],
): number {
  let n = 0;
  for (const p of pedidos) {
    for (const d of p.detalles) {
      if (
        d.marcar_cocina &&
        (d.enviado_cocina ?? false) &&
        !d.listo_cocina
      ) {
        n += d.cantidad;
      }
    }
  }
  return n;
}
