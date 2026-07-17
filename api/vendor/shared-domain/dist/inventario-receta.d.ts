import { type ConversionUnidad } from './inventario-unidades';
import type { MovimientoInventarioPlan } from './inventario-movimientos';
export type SustitucionReceta = Readonly<{
    id_articulo: number;
    /** Multiplicador sobre la cantidad de la línea original (1 = misma cantidad). */
    factor?: number;
}>;
export type RecetaLinea = Readonly<{
    id_linea: string;
    id_articulo?: number;
    id_subreceta?: string;
    cantidad: number;
    unidad: string;
    opcional?: boolean;
    sustituciones?: readonly SustitucionReceta[];
}>;
export type Receta = Readonly<{
    id_receta: string;
    id_producto?: number;
    version?: number;
    lineas: readonly RecetaLinea[];
}>;
export type ArticuloInventarioReceta = Readonly<{
    id_articulo: number;
    unidad_stock: string;
    costo_unitario?: number;
    activo?: boolean;
}>;
export type ErrorReceta = Readonly<{
    codigo: 'linea_sin_articulo' | 'articulo_desconocido' | 'subreceta_desconocida' | 'conversion_fallida' | 'receta_vacia';
    mensaje: string;
    id_linea?: string;
}>;
export type ResultadoConsumoReceta = {
    ok: true;
    movimientos: MovimientoInventarioPlan[];
    costo_total: number;
} | {
    ok: false;
    errores: ErrorReceta[];
};
/** Agrupa deltas del mismo artículo en un solo movimiento planificado. */
export declare function consolidarMovimientos(movimientos: readonly MovimientoInventarioPlan[]): MovimientoInventarioPlan[];
export declare function calcularConsumoReceta(receta: Receta, porciones: number, articulos: ReadonlyMap<number, ArticuloInventarioReceta>, recetas?: ReadonlyMap<string, Receta>, conversiones?: readonly ConversionUnidad[], sustitucionesPorLinea?: ReadonlyMap<string, number>): ResultadoConsumoReceta;
export declare function calcularCostoReceta(receta: Receta, articulos: ReadonlyMap<number, ArticuloInventarioReceta>, recetas?: ReadonlyMap<string, Receta>, conversiones?: readonly ConversionUnidad[]): number;
