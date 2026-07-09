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
    prioridad_cocina_baja: boolean;
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
    prioridad_cocina_baja?: boolean;
    prioridadCocinaBaja?: boolean;
};
/** Defaults neutros en runtime cuando el admin no configuró flags explícitos. */
export declare function reglasCategoriaPorDefecto(nombre: string): CategoriaReglas;
/**
 * Sugerencias al crear categoría (seed, demo, admin al escribir nombre).
 * No usar en runtime para decidir comportamiento del menú o cocina.
 */
export declare function inferirReglasCategoriaDesdeNombre(nombre: string): CategoriaReglas;
/** Resuelve reglas: flags explícitos de BD; si faltan, defaults neutros (sin inferir nombre). */
export declare function resolverReglasCategoria(input: CategoriaReglasInput): CategoriaReglas;
export type CategoriaLike = string | CategoriaReglasInput;
export declare function categoriaEsBebida(categoria: CategoriaLike): boolean;
export declare function categoriaCobraEmpaqueParaLlevar(categoria: CategoriaLike): boolean;
export declare function categoriaEsLineaEmpaque(categoria: CategoriaLike): boolean;
export declare function categoriaVisibleEnMostrador(categoria: CategoriaLike): boolean;
export declare function debeMarcarCocina(categoria: CategoriaLike, esEmpacable: boolean): boolean;
