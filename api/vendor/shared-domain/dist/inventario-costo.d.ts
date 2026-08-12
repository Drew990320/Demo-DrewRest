/**
 * Valoración de inventario y análisis de rentabilidad de recetas/productos.
 */
import { type ConversionUnidad } from './inventario-unidades';
export type EntradaCostoPromedio = Readonly<{
    stockAnterior: number;
    costoAnterior: number;
    qtyEntrada: number;
    costoEntrada: number;
}>;
/**
 * Promedio ponderado tras una compra.
 * Si stock anterior ≤ 0 o qty inválida, usa el costo de la entrada.
 */
export declare function calcularCostoPromedioPonderado(input: EntradaCostoPromedio): number;
export type EntradaCostoDesdeCompra = Readonly<{
    /** Precio total pagado por el empaque/lote (ej. $20.000 la bolsa). */
    precio_compra: number;
    /** Cantidad comprada en unidad de compra (ej. 10 panes, 5 kg). */
    cantidad_compra: number;
    unidad_compra: string;
    /** Unidad en la que se valora el stock (ej. u, g, ml). */
    unidad_stock: string;
    conversiones?: readonly ConversionUnidad[];
}>;
/**
 * Costo por unidad de stock a partir del precio del empaque.
 * Ej.: bolsa $20.000 / 10 panes → $2.000/u
 * Ej.: 5 kg a $80.000, stock en g → $16/g
 */
export declare function calcularCostoUnitarioDesdeCompra(input: EntradaCostoDesdeCompra): number | null;
/** Semáforo de margen de ganancia sobre precio de venta. */
export type SemaforoMargen = 'alto' | 'medio' | 'bajo' | 'sin_precio';
export type AnalisisRentabilidadReceta = Readonly<{
    costo_produccion: number;
    precio_venta: number;
    ganancia: number;
    margen_pct: number | null;
    semaforo: SemaforoMargen;
    /** Precio sugerido para alcanzar margen_objetivo_pct (si se indicó). */
    precio_sugerido: number | null;
}>;
export type UmbralesMargen = Readonly<{
    /** Margen % ≥ este valor → alto (default 50). */
    alto_min_pct?: number;
    /** Margen % ≥ este valor → medio; debajo → bajo (default 30). */
    medio_min_pct?: number;
}>;
/**
 * Rentabilidad de un producto a partir de costo de receta y precio de venta.
 * Margen % = (ganancia / precio_venta) × 100.
 */
export declare function analizarRentabilidadReceta(costoProduccion: number, precioVenta: number, opts?: {
    margen_objetivo_pct?: number;
    umbrales?: UmbralesMargen;
}): AnalisisRentabilidadReceta;
