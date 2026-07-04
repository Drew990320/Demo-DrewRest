/** Reglas operativas por categoría (Fase 2 — reemplazan heurísticas por nombre). */
export type TipoLineaCocinaCategoria = 'plato' | 'entrada' | 'adicional';

export type CategoriaReglas = {
  nombre: string;
  es_bebida: boolean;
  cobra_empaque_para_llevar: boolean;
  participa_descuento_sopas: boolean;
  es_linea_empaque: boolean;
  visible_en_mostrador: boolean;
  tipo_linea_cocina_default: TipoLineaCocinaCategoria;
  es_plato_principal_default: boolean;
};

/** Entrada parcial: flags de BD (snake o camel) + nombre para fallback. */
export type CategoriaReglasInput = {
  nombre: string;
  es_bebida?: boolean;
  esBebida?: boolean;
  cobra_empaque_para_llevar?: boolean;
  cobraEmpaqueParaLlevar?: boolean;
  participa_descuento_sopas?: boolean;
  participaDescuentoSopas?: boolean;
  es_linea_empaque?: boolean;
  esLineaEmpaque?: boolean;
  visible_en_mostrador?: boolean;
  visibleEnMostrador?: boolean;
  tipo_linea_cocina_default?: TipoLineaCocinaCategoria;
  tipoLineaCocinaDefault?: TipoLineaCocinaCategoria;
  es_plato_principal_default?: boolean;
  esPlatoPrincipalDefault?: boolean;
};

function pickBool(snake?: boolean, camel?: boolean): boolean | undefined {
  return snake ?? camel;
}

function pickTipo(
  snake?: TipoLineaCocinaCategoria,
  camel?: TipoLineaCocinaCategoria,
): TipoLineaCocinaCategoria | undefined {
  return snake ?? camel;
}

/** Defaults inferidos del nombre (seed, migración, compatibilidad offline). */
export function inferirReglasCategoriaDesdeNombre(
  nombre: string,
): CategoriaReglas {
  const n = nombre.trim();
  const lower = n.toLowerCase();
  const esBebida = lower.includes('bebida');
  const esLineaEmpaque = lower.includes('empaque');
  const participaSopas = lower.includes('sopa');
  const esPlatoPrincipal =
    n.startsWith('Platos fuertes') || n === 'Menú infantil';
  const cobraEmpaque = esPlatoPrincipal;
  let tipo: TipoLineaCocinaCategoria = 'plato';
  if (lower.includes('entrada') || lower.includes('adicional')) {
    tipo = 'entrada';
  }
  return {
    nombre: n,
    es_bebida: esBebida,
    cobra_empaque_para_llevar: cobraEmpaque,
    participa_descuento_sopas: participaSopas,
    es_linea_empaque: esLineaEmpaque,
    visible_en_mostrador: esBebida,
    tipo_linea_cocina_default: tipo,
    es_plato_principal_default: esPlatoPrincipal,
  };
}

/** Resuelve reglas: flags explícitos de BD tienen prioridad sobre el nombre. */
export function resolverReglasCategoria(
  input: CategoriaReglasInput,
): CategoriaReglas {
  const inferred = inferirReglasCategoriaDesdeNombre(input.nombre);
  return {
    nombre: input.nombre,
    es_bebida:
      pickBool(input.es_bebida, input.esBebida) ?? inferred.es_bebida,
    cobra_empaque_para_llevar:
      pickBool(
        input.cobra_empaque_para_llevar,
        input.cobraEmpaqueParaLlevar,
      ) ?? inferred.cobra_empaque_para_llevar,
    participa_descuento_sopas:
      pickBool(
        input.participa_descuento_sopas,
        input.participaDescuentoSopas,
      ) ?? inferred.participa_descuento_sopas,
    es_linea_empaque:
      pickBool(input.es_linea_empaque, input.esLineaEmpaque) ??
      inferred.es_linea_empaque,
    visible_en_mostrador:
      pickBool(input.visible_en_mostrador, input.visibleEnMostrador) ??
      inferred.visible_en_mostrador,
    tipo_linea_cocina_default:
      pickTipo(
        input.tipo_linea_cocina_default,
        input.tipoLineaCocinaDefault,
      ) ?? inferred.tipo_linea_cocina_default,
    es_plato_principal_default:
      pickBool(
        input.es_plato_principal_default,
        input.esPlatoPrincipalDefault,
      ) ?? inferred.es_plato_principal_default,
  };
}

export type CategoriaLike = string | CategoriaReglasInput;

function normalizarCategoria(categoria: CategoriaLike): CategoriaReglas {
  if (typeof categoria === 'string') {
    return resolverReglasCategoria({ nombre: categoria });
  }
  return resolverReglasCategoria(categoria);
}

export function categoriaEsBebida(categoria: CategoriaLike): boolean {
  return normalizarCategoria(categoria).es_bebida;
}

export function categoriaCobraEmpaqueParaLlevar(
  categoria: CategoriaLike,
): boolean {
  return normalizarCategoria(categoria).cobra_empaque_para_llevar;
}

export function categoriaEsLineaEmpaque(categoria: CategoriaLike): boolean {
  return normalizarCategoria(categoria).es_linea_empaque;
}

export function categoriaVisibleEnMostrador(categoria: CategoriaLike): boolean {
  return normalizarCategoria(categoria).visible_en_mostrador;
}

export function debeMarcarCocina(
  categoria: CategoriaLike,
  esEmpacable: boolean,
): boolean {
  const r = normalizarCategoria(categoria);
  return !r.es_bebida && !esEmpacable && !r.es_linea_empaque;
}
