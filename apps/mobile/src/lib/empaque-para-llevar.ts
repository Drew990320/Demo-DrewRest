/** Precio de cada empaque automático en para llevar (un empaque por unidad). */
export const PRECIO_EMPAQUE_PARA_LLEVAR_COP = 1000;

function categoriaCobraEmpaqueParaLlevar(nombreCategoria: string): boolean {
  return (
    nombreCategoria.startsWith('Platos fuertes') ||
    nombreCategoria === 'Menú infantil'
  );
}

/** Para llevar: un empaque por unidad de plato fuerte o ítem de menú infantil. */
export function productoCobraEmpaqueParaLlevarPorPlatoFuerte(p: {
  es_plato_principal?: boolean;
  es_empacable?: boolean;
  categoria_nombre: string;
}): boolean {
  if (p.es_empacable) return false;
  return categoriaCobraEmpaqueParaLlevar(p.categoria_nombre);
}
