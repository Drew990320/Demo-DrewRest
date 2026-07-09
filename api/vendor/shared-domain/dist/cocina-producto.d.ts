export { categoriaEsBebida, categoriaCobraEmpaqueParaLlevar, categoriaEsLineaEmpaque, categoriaVisibleEnMostrador, debeMarcarCocina, inferirReglasCategoriaDesdeNombre, reglasCategoriaPorDefecto, resolverReglasCategoria, type CategoriaLike, type CategoriaReglas, type CategoriaReglasInput, type TipoLineaCocinaCategoria, } from './categoria-reglas';
/** Tipo de línea visible en pantalla de cocina (no bebidas ni empaque). */
export type TipoLineaCocina = 'plato' | 'entrada' | 'adicional' | 'mazorca' | 'sopa';
import { type CategoriaReglasInput } from './categoria-reglas';
export type LineaCocinaTipoInput = {
    nombre_producto?: string;
    categoria_nombre?: string;
    categoria?: CategoriaReglasInput;
    es_acompanamiento_mazorca?: boolean;
    es_plato_principal?: boolean;
};
export declare function tipoLineaCocina(d: LineaCocinaTipoInput): TipoLineaCocina;
export declare function etiquetaTipoLineaCocina(tipo: TipoLineaCocina): string;
export declare function ordenTipoLineaCocina(tipo: TipoLineaCocina): number;
