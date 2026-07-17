export type PeriodoResumen = 'diario' | 'quincenal' | 'mensual' | 'anual';
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
/**
 * Calcula el rango del periodo (fechas calendario, tipicamente Bogotá).
 * Quincenal: días 1–15 o 16–fin de mes según el día ancla.
 */
export declare function rangoPeriodoResumen(periodo: PeriodoResumen, fechaAnclaYmd: string): RangoPeriodoResumen;
/** True si caja / cierre / vaciar aplican (solo día calendario). */
export declare function periodoResumenUsaCaja(periodo: PeriodoResumen): boolean;
