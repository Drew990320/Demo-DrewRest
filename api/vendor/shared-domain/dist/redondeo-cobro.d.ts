/** Configuración de redondeo hacia arriba en cobro (COP enteros). */
export type RedondeoCobroConfig = {
    /** Paso en COP (p. ej. 100, 500, 1000). Debe ser > 1 para aplicar.
   * Ej.: 1900 con paso 1000 → 2000; 1950 con paso 100 → 2000.
   * Si ya es múltiplo exacto del paso, no cambia.
   */
    paso: number;
    /** Solo aplica si el monto de la tanda es >= umbral (0 = siempre). */
    umbral: number;
};
/** Redondea hacia arriba al múltiplo de `paso`. Si ya es múltiplo, no cambia. */
export declare function redondearHaciaArriba(monto: number, paso: number): number;
/** Diferencial a sumar al total del cobro (precios de líneas intactos). */
export declare function montoRedondeo(monto: number, paso: number): number;
/** ¿Se puede ofrecer / aplicar redondeo a este monto con la config? */
export declare function aplicaRedondeo(monto: number, cfg: RedondeoCobroConfig | null | undefined): boolean;
/**
 * Resuelve el total cobrado y el diferencial de redondeo (interno).
 * Si no aplica, total = monto base y monto_redondeo = 0.
 * El diferencial no debe mostrarse al cliente en ticket/correo.
 */
export declare function resolverRedondeoCobro(montoBase: number, cfg: RedondeoCobroConfig | null | undefined, aplicar: boolean): {
    total: number;
    monto_redondeo: number;
};
