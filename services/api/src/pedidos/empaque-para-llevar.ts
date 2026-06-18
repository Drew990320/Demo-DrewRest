import { Prisma } from '@prisma/client';

/** Precio de cada empaque automático en para llevar (un empaque por unidad). */
export const PRECIO_EMPAQUE_PARA_LLEVAR_COP = 1000;

export const precioEmpaqueParaLlevarDecimal = () =>
  new Prisma.Decimal(PRECIO_EMPAQUE_PARA_LLEVAR_COP);

function categoriaCobraEmpaqueParaLlevar(nombreCategoria: string): boolean {
  return (
    nombreCategoria.startsWith('Platos fuertes') ||
    nombreCategoria === 'Menú infantil'
  );
}

/** Para llevar: un empaque por unidad de plato fuerte o ítem de menú infantil. */
export function productoCobraEmpaqueParaLlevarPorPlatoFuerte(p: {
  esPlatoPrincipal: boolean;
  esEmpacable: boolean;
  categoria: { nombre: string };
}): boolean {
  if (p.esEmpacable) return false;
  return categoriaCobraEmpaqueParaLlevar(p.categoria.nombre);
}
