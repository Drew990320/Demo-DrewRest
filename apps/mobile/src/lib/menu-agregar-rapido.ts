/** Producto del menú con opciones mínimas para personalización. */
export type ProductoMenuAgregarRapido = {
  opciones: { tipo: string }[];
};

export function productoTieneOpcionesPersonalizacion(
  producto: ProductoMenuAgregarRapido,
): boolean {
  return producto.opciones.some(
    (o) => o.tipo === 'omitir_ingrediente' || o.tipo === 'aderezo',
  );
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
