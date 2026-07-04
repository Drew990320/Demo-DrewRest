/** Precio de cada empaque automático en para llevar (un empaque por unidad). */
export const PRECIO_EMPAQUE_PARA_LLEVAR_COP = 1000;

import {
  categoriaCobraEmpaqueParaLlevar,
  categoriaEsLineaEmpaque,
  type CategoriaLike,
  type CategoriaReglasInput,
  resolverReglasCategoria,
} from './categoria-reglas';

/** Solo los ítems de categoría marcada como línea empaque son empaque del sistema. */
export function esEmpacablePorCategoria(categoria: CategoriaLike): boolean {
  return categoriaEsLineaEmpaque(categoria);
}

/** Flags sugeridos al crear/editar productos en admin del menú. */
export function flagsProductoMenuPorCategoria(
  categoria: CategoriaLike,
): {
  es_plato_principal: boolean;
  es_empacable: boolean;
} {
  const r = resolverReglasCategoria(
    typeof categoria === 'string'
      ? { nombre: categoria }
      : categoria,
  );
  if (r.es_linea_empaque) {
    return { es_plato_principal: false, es_empacable: true };
  }
  return {
    es_plato_principal: r.es_plato_principal_default,
    es_empacable: false,
  };
}

export type ProductoEmpaqueInput = {
  es_plato_principal?: boolean;
  esPlatoPrincipal?: boolean;
  es_empacable?: boolean;
  esEmpacable?: boolean;
  categoria_nombre?: string;
  categoria?: CategoriaReglasInput;
};

function esEmpacableProducto(p: ProductoEmpaqueInput): boolean {
  return p.es_empacable ?? p.esEmpacable ?? false;
}

function esPlatoPrincipalProducto(p: ProductoEmpaqueInput): boolean {
  return p.es_plato_principal ?? p.esPlatoPrincipal ?? false;
}

function reglasCategoriaProducto(p: ProductoEmpaqueInput) {
  const nombre = p.categoria_nombre ?? p.categoria?.nombre ?? '';
  if (p.categoria) {
    return resolverReglasCategoria({ ...p.categoria, nombre });
  }
  return resolverReglasCategoria({ nombre });
}

/** Para llevar: un empaque por unidad de plato principal (flag o categoría típica). */
export function productoCobraEmpaqueParaLlevarPorPlatoFuerte(
  p: ProductoEmpaqueInput,
): boolean {
  if (esEmpacableProducto(p)) return false;
  const reglas = reglasCategoriaProducto(p);
  return (
    esPlatoPrincipalProducto(p) ||
    categoriaCobraEmpaqueParaLlevar(reglas)
  );
}
