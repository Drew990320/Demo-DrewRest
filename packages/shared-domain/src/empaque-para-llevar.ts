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

export type DetalleEmpaqueResumen = {
  id_detalle: number;
  id_detalle_padre: number | null;
  cantidad: number;
  es_empacable?: boolean;
  es_plato_principal?: boolean;
  categoria_nombre?: string;
  categoria?: CategoriaReglasInput;
};

export function cantidadEmpaqueVinculadaPadre(
  idDetallePadre: number,
  detalles: Pick<
    DetalleEmpaqueResumen,
    'id_detalle_padre' | 'cantidad' | 'es_empacable'
  >[],
): number {
  return detalles
    .filter((d) => d.id_detalle_padre === idDetallePadre && d.es_empacable)
    .reduce((sum, d) => sum + d.cantidad, 0);
}

/** Cantidad del hijo empaque tras cambiar la cantidad del plato padre. */
export function nuevaCantidadEmpaqueTrasCambioPadre(
  cantidadEmpaque: number,
  cantidadPadreAnterior: number,
  cantidadPadreNueva: number,
): number {
  if (cantidadPadreNueva > cantidadPadreAnterior) {
    const delta = cantidadPadreNueva - cantidadPadreAnterior;
    return Math.min(cantidadEmpaque + delta, cantidadPadreNueva);
  }
  return Math.min(cantidadEmpaque, cantidadPadreNueva);
}

/** Unidades de empaque que faltan en una línea de plato (0 = ok). */
export function empaqueFaltanteEnDetallePadre(
  detalle: DetalleEmpaqueResumen,
  detalles: DetalleEmpaqueResumen[],
): number {
  if (detalle.id_detalle_padre != null) return 0;
  if (!productoCobraEmpaqueParaLlevarPorPlatoFuerte(detalle)) return 0;
  const vinculado = cantidadEmpaqueVinculadaPadre(detalle.id_detalle, detalles);
  return Math.max(0, detalle.cantidad - vinculado);
}

/** Totales de empaque esperado vs asignado en un pedido para llevar. */
export function resumenEmpaqueParaLlevar(
  modoServicio: string | undefined,
  detalles: DetalleEmpaqueResumen[],
): {
  unidades_plato: number;
  unidades_empaque: number;
  unidades_faltantes: number;
} | null {
  if (modoServicio !== 'para_llevar') return null;
  let unidadesPlato = 0;
  let unidadesEmpaque = 0;
  for (const d of detalles) {
    if (d.id_detalle_padre != null) {
      if (d.es_empacable) unidadesEmpaque += d.cantidad;
      continue;
    }
    if (!productoCobraEmpaqueParaLlevarPorPlatoFuerte(d)) continue;
    unidadesPlato += d.cantidad;
  }
  return {
    unidades_plato: unidadesPlato,
    unidades_empaque: unidadesEmpaque,
    unidades_faltantes: Math.max(0, unidadesPlato - unidadesEmpaque),
  };
}

/** true cuando hay menos empaques que platos pero al menos uno (empaque compartido). */
export function empaqueCompartidoEnPedido(
  resumen: ReturnType<typeof resumenEmpaqueParaLlevar>,
): boolean {
  if (!resumen) return false;
  return (
    resumen.unidades_faltantes > 0 &&
    resumen.unidades_empaque > 0 &&
    resumen.unidades_plato > 0
  );
}
