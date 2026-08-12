export type PeriodoResumen = 'diario' | 'semanal' | 'quincenal' | 'mensual' | 'anual' | 'personalizado';
export declare const PERIODOS_RESUMEN: PeriodoResumen[];
export declare const PERIODO_RESUMEN_LABEL: Record<PeriodoResumen, string>;
export declare function parsePeriodoResumen(raw: string | null | undefined): PeriodoResumen;
export type RangoPeriodoResumen = {
    periodo: PeriodoResumen;
    /** Día ancla YYYY-MM-DD. */
    fecha_ancla: string;
    /** Inicio inclusivo YYYY-MM-DD. */
    fecha_desde: string;
    /** Fin inclusivo YYYY-MM-DD. */
    fecha_hasta: string;
    etiqueta: string;
};
/** Tope de días inclusivos para rango personalizado. */
export declare const MAX_DIAS_PERIODO_PERSONALIZADO = 366;
/**
 * Rango personalizado (desde/hasta inclusivos).
 * Retorna null si las fechas son inválidas, desde > hasta, o supera el tope.
 */
export declare function rangoPeriodoPersonalizado(fechaDesdeYmd: string, fechaHastaYmd: string): RangoPeriodoResumen | null;
/**
 * Calcula el rango del periodo (fechas calendario, tipicamente Bogotá).
 * Semanal: lunes–domingo (ISO) según día ancla.
 * Quincenal: días 1–15 o 16–fin de mes según el día ancla.
 * Personalizado: usar `rangoPeriodoPersonalizado` (aquí cae a diario).
 */
export declare function rangoPeriodoResumen(periodo: PeriodoResumen, fechaAnclaYmd: string): RangoPeriodoResumen;
/** True si caja / cierre / vaciar aplican (solo día calendario). */
export declare function periodoResumenUsaCaja(periodo: PeriodoResumen): boolean;
