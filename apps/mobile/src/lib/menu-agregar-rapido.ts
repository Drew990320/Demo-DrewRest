/** Producto del menú con opciones mínimas para personalización. */
export type ProductoMenuAgregarRapido = {
  opciones: { tipo: string }[];
  es_plato_principal?: boolean;
};

const OMITIR = ['Sin yuca', 'Sin papa', 'Sin ensalada', 'Sin mazorca'] as const;
const ADEREZOS = ['Chipotle', 'Agridulce', 'Chimichurri'] as const;

export function categoriaPermitePersonalizacion(nombreCategoria: string): boolean {
  const n = nombreCategoria.toLowerCase();
  return (
    n.startsWith('platos fuertes') ||
    n.includes('infantil') ||
    n.includes('compartir') ||
    n.includes('picada')
  );
}

export function productoTieneOpcionesPersonalizacion(
  producto: ProductoMenuAgregarRapido,
  categoriaNombre?: string,
): boolean {
  if (
    producto.opciones.some(
      (o) => o.tipo === 'omitir_ingrediente' || o.tipo === 'aderezo',
    )
  ) {
    return true;
  }
  if (categoriaNombre && categoriaPermitePersonalizacion(categoriaNombre)) {
    return true;
  }
  return producto.es_plato_principal === true;
}

/** Opciones estándar cuando el catálogo aún no tiene filas en BD (modo local / reparación). */
export function opcionesPersonalizacionEstandar(): {
  tipo: 'omitir_ingrediente' | 'aderezo';
  descripcion: string;
}[] {
  return [
    ...OMITIR.map((descripcion) => ({
      tipo: 'omitir_ingrediente' as const,
      descripcion,
    })),
    ...ADEREZOS.map((descripcion) => ({
      tipo: 'aderezo' as const,
      descripcion,
    })),
  ];
}

export function parseColaPersonalizarMenu(
  raw: string | string[] | undefined,
): number[] {
  const s = Array.isArray(raw) ? raw.join(',') : String(raw ?? '').trim();
  if (!s) return [];
  return s
    .split(',')
    .map((x) => parseInt(x.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
}

export function menuProductoQueryParams(opts: {
  bebidas?: boolean;
  paraLlevar?: boolean;
  colaPersonalizar?: number[];
}): string {
  const q: string[] = [];
  if (opts.bebidas) q.push('bebidas=1');
  if (opts.paraLlevar) q.push('paraLlevar=1');
  if (opts.colaPersonalizar?.length) {
    q.push(`colaPersonalizar=${opts.colaPersonalizar.join(',')}`);
  }
  return q.length ? `?${q.join('&')}` : '';
}
