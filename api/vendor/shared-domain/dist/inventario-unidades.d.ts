/**
 * Sistema de unidades y conversiones genérico (masa, volumen, conteo, empaque).
 */
export type DimensionUnidad = 'masa' | 'volumen' | 'conteo' | 'empaque';
export type UnidadCodigo = 'mg' | 'g' | 'kg' | 'ml' | 'l' | 'u' | 'porcion' | 'paquete' | 'caja' | 'bolsa' | 'bulto';
export type ConversionUnidad = Readonly<{
    unidad_origen: string;
    unidad_destino: string;
    /** cantidad_destino = cantidad_origen * factor */
    factor: number;
}>;
type UnidadDef = Readonly<{
    codigo: string;
    dimension: DimensionUnidad;
    /** Factor hacia unidad base de la dimensión (g, ml, u). */
    factor_base: number;
}>;
export declare function normalizarUnidad(unidad: string): string;
export declare function definicionUnidad(unidad: string): UnidadDef | null;
export declare function mismaDimension(unidadA: string, unidadB: string): boolean;
export type ErrorConversionUnidad = Readonly<{
    codigo: 'unidad_desconocida' | 'dimension_incompatible' | 'sin_conversion';
    mensaje: string;
}>;
export type ResultadoConversion = {
    ok: true;
    cantidad: number;
    unidad: string;
} | {
    ok: false;
    error: ErrorConversionUnidad;
};
/**
 * Convierte cantidad entre unidades.
 * 1) Catálogo estándar (g↔kg, ml↔l).
 * 2) Tabla de conversiones del negocio (ej. 1 bulto = 25 kg).
 */
export declare function convertirCantidad(cantidad: number, desde: string, hacia: string, conversiones?: readonly ConversionUnidad[]): ResultadoConversion;
/** Redondeo estable para inventario (3 decimales). */
export declare function redondearInventario(n: number): number;
export {};
