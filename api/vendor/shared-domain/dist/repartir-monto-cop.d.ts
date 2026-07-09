/** Billete/moneda mínima habitual en efectivo (COP). */
export declare const PASO_MONEDA_COP = 100;
/**
 * Reparte un total entre N personas en montos enteros de COP,
 * cada uno múltiplo de `paso` (p. ej. $100). La suma coincide exactamente con el total.
 */
export declare function repartirMontoEnCop(total: number, personas: number, paso?: number): number[];
/** Suma de partes === total (invariante de redondeo). */
export declare function sumaPartesIgualTotal(partes: number[], total: number): boolean;
