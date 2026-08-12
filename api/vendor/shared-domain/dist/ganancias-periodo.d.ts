/**
 * Cálculo de ganancias operativas por periodo (ventas − costo − gastos).
 */
export type OrigenCostoProducto = 'manual' | 'receta' | 'ninguno';
export declare function costoEfectivoProducto(precioCosto: number | null | undefined, costoReceta: number | null | undefined): {
    costo: number;
    origen: OrigenCostoProducto;
};
export type GastoFijoParaProrrateo = Readonly<{
    id: number;
    nombre: string;
    monto_mensual: number;
}>;
export type GastoFijoProrrateado = Readonly<{
    id: number;
    nombre: string;
    monto_mensual: number;
    monto_periodo: number;
}>;
declare function ymd(y: number, m: number, d: number): string;
/**
 * Prorratea gastos fijos mensuales día a día en el rango [desde, hasta].
 * Cada día aporta monto_mensual / días_del_mes.
 */
export type ModoRegistroFondoGanancia = 'automatico' | 'confirmar';
export type EstadoCuotaFondoGanancia = 'aplicada' | 'omitida';
export type GastoFijoConFondo = Readonly<{
    id: number;
    nombre: string;
    monto_mensual: number;
    usa_fondo_diario: boolean;
    cuota_diaria: number | null;
}>;
export type CuotaFondoAplicadaLike = Readonly<{
    id_gasto_fijo: number;
    monto: number;
    fecha: string;
    estado?: EstadoCuotaFondoGanancia | 'pendiente';
}>;
export type GastoFijoPeriodoDetalle = Readonly<{
    id: number;
    nombre: string;
    monto_mensual: number;
    monto_periodo: number;
    usa_fondo_diario: boolean;
    cuota_diaria: number | null;
    acumulado_mes: number;
}>;
/** Cuota sugerida: monto mensual / 30, en pesos enteros. */
export declare function cuotaDiariaSugerida(montoMensual: number): number;
export declare function topeFondoAlcanzado(acumuladoMes: number, montoMensual: number): boolean;
/** Lo que queda en el sobre: cuotas aplicadas − pagos ya hechos con el fondo. */
export declare function disponibleFondo(acumulado: number, pagado: number): number;
/** Sugiere pagar lo que falta de la meta del mes, sin pasar el disponible. */
export declare function montoPagoFondoSugerido(input: {
    disponible: number;
    monto_mensual: number;
    pagado_mes: number;
}): number;
export declare function rangoMesCalendario(fechaYmd: string): {
    desde: string;
    hasta: string;
} | null;
export declare function sumarCuotasAplicadas(cuotas: readonly CuotaFondoAplicadaLike[], idGastoFijo: number, fechaDesdeYmd: string, fechaHastaYmd: string): number;
/**
 * Auto-aplica solo si el fondo está on, modo automático, no hay decisión
 * del día y el acumulado del mes aún no cubre la meta.
 */
export declare function debeAutoAplicarCuota(input: {
    usa_fondo_diario: boolean;
    activo?: boolean;
    modo_registro_fondo: ModoRegistroFondoGanancia;
    cuota_diaria: number;
    estado_hoy: EstadoCuotaFondoGanancia | 'pendiente' | null;
    acumulado_mes: number;
    monto_mensual: number;
}): boolean;
/**
 * Gastos sin fondo: prorrateo mensual.
 * Gastos con fondo: solo cuotas aplicadas del periodo (sin doble conteo).
 */
export declare function armarGastosFijosPeriodo(gastos: readonly GastoFijoConFondo[], cuotasAplicadas: readonly CuotaFondoAplicadaLike[], fechaDesdeYmd: string, fechaHastaYmd: string): {
    total: number;
    detalle: GastoFijoPeriodoDetalle[];
};
export declare function prorratearGastosFijos(gastos: readonly GastoFijoParaProrrateo[], fechaDesdeYmd: string, fechaHastaYmd: string): {
    total: number;
    detalle: GastoFijoProrrateado[];
};
export type LineaCostoVenta = Readonly<{
    id_producto: number;
    nombre: string;
    cantidad: number;
    precio_venta_unitario: number;
    costo_unitario: number;
    origen_costo: OrigenCostoProducto;
    venta_total: number;
    costo_total: number;
    ganancia: number;
}>;
export type ResumenGananciasPeriodo = Readonly<{
    ventas: number;
    costo_ventas: number;
    ganancia_bruta: number;
    gastos_fijos: number;
    gastos_extras: number;
    gastos_meseros: number;
    gastos_total: number;
    ganancia_neta: number;
    margen_bruto_pct: number | null;
    margen_neto_pct: number | null;
    unidades_vendidas: number;
    unidades_sin_costo: number;
    productos_sin_costo: number;
}>;
export declare function armarResumenGanancias(input: {
    ventas: number;
    lineas: readonly LineaCostoVenta[];
    gastos_fijos: number;
    gastos_extras: number;
    gastos_meseros?: number;
}): ResumenGananciasPeriodo;
/** Agrupa líneas del mismo producto (suma cantidades / totales). */
export declare function consolidarLineasCostoVenta(lineas: readonly LineaCostoVenta[]): LineaCostoVenta[];
export declare function ymdEnRango(fechaYmd: string, desdeYmd: string, hastaYmd: string): boolean;
export { ymd as ymdGanancias };
