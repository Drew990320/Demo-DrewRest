export {
  categoriaEsBebida,
  categoriaCobraEmpaqueParaLlevar,
  categoriaEsLineaEmpaque,
  categoriaVisibleEnMostrador,
  debeMarcarCocina,
  inferirReglasCategoriaDesdeNombre,
  resolverReglasCategoria,
  type CategoriaLike,
  type CategoriaReglas,
  type CategoriaReglasInput,
  type TipoLineaCocinaCategoria,
} from './categoria-reglas';

/** Tipo de línea visible en pantalla de cocina (no bebidas ni empaque). */
export type TipoLineaCocina =
  | 'plato'
  | 'entrada'
  | 'adicional'
  | 'mazorca'
  | 'sopa';

/** Orden en comanda impresa y pantalla cocina: mazorca → entrada → adicional → sopa → plato. */
const ORDEN_TIPO_LINEA_COCINA: Record<TipoLineaCocina, number> = {
  mazorca: 0,
  entrada: 1,
  adicional: 2,
  sopa: 3,
  plato: 4,
};

import {
  resolverReglasCategoria,
  type CategoriaReglasInput,
} from './categoria-reglas';

export type LineaCocinaTipoInput = {
  nombre_producto?: string;
  categoria_nombre?: string;
  categoria?: CategoriaReglasInput;
  es_acompanamiento_mazorca?: boolean;
  es_plato_principal?: boolean;
};

export function tipoLineaCocina(d: LineaCocinaTipoInput): TipoLineaCocina {
  if (d.es_acompanamiento_mazorca) return 'mazorca';

  const nombre = (d.nombre_producto ?? '').trim().toLowerCase();
  const reglas = d.categoria
    ? resolverReglasCategoria(d.categoria)
    : resolverReglasCategoria({ nombre: d.categoria_nombre ?? '' });

  if (reglas.participa_descuento_sopas) return 'sopa';

  if (nombre.startsWith('adicional')) return 'adicional';
  if (nombre.startsWith('entrada')) return 'entrada';

  if (d.es_plato_principal || reglas.es_plato_principal_default) {
    return 'plato';
  }

  const tipoCat = reglas.tipo_linea_cocina_default;
  if (tipoCat === 'entrada' || tipoCat === 'adicional') return tipoCat;
  return 'plato';
}

export function etiquetaTipoLineaCocina(tipo: TipoLineaCocina): string {
  switch (tipo) {
    case 'mazorca':
      return 'Mazorca';
    case 'entrada':
      return 'Entrada';
    case 'adicional':
      return 'Adicional';
    case 'sopa':
      return 'Sopa';
    case 'plato':
      return 'Plato';
  }
}

export function ordenTipoLineaCocina(tipo: TipoLineaCocina): number {
  return ORDEN_TIPO_LINEA_COCINA[tipo];
}
