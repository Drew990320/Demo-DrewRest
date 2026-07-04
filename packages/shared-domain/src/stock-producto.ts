export type ProductoConStock = {
  activo?: boolean;
  control_stock?: boolean;
  stock_disponible?: number;
  ocultar_sin_stock?: boolean;
};

export function productoAgotado(p: ProductoConStock): boolean {
  return Boolean(p.control_stock) && Math.max(0, p.stock_disponible ?? 0) <= 0;
}

/** Si el producto debe listarse en el menú del día. */
export function productoVisibleEnMenu(p: ProductoConStock): boolean {
  if (p.activo === false) return false;
  if (!productoAgotado(p)) return true;
  return p.ocultar_sin_stock === false;
}

export function puedePedirCantidad(
  p: ProductoConStock,
  cantidad: number,
): boolean {
  if (cantidad < 1) return false;
  if (!p.control_stock) return true;
  return (p.stock_disponible ?? 0) >= cantidad;
}

export function stockEtiqueta(p: ProductoConStock): string | null {
  if (!p.control_stock) return null;
  const n = Math.max(0, p.stock_disponible ?? 0);
  return n <= 0 ? 'Agotado' : `Quedan ${n}`;
}
