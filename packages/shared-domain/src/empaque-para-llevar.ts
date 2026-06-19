/** Precio de cada empaque automático en para llevar (un empaque por unidad). */
export const PRECIO_EMPAQUE_PARA_LLEVAR_COP = 1000;

function categoriaCobraEmpaqueParaLlevar(nombreCategoria: string): boolean {
  return (
    nombreCategoria.startsWith('Platos fuertes') ||
    nombreCategoria === 'Menú infantil'
  );
}

export type ProductoEmpaqueInput = {
  es_empacable?: boolean;
  esEmpacable?: boolean;
  categoria_nombre?: string;
  categoria?: { nombre: string };
};

function esEmpacableProducto(p: ProductoEmpaqueInput): boolean {
  return p.es_empacable ?? p.esEmpacable ?? false;
}

function nombreCategoriaProducto(p: ProductoEmpaqueInput): string {
  return p.categoria_nombre ?? p.categoria?.nombre ?? '';
}

/** Para llevar: un empaque por unidad de plato fuerte o ítem de menú infantil. */
export function productoCobraEmpaqueParaLlevarPorPlatoFuerte(
  p: ProductoEmpaqueInput,
): boolean {
  if (esEmpacableProducto(p)) return false;
  return categoriaCobraEmpaqueParaLlevar(nombreCategoriaProducto(p));
}
