import { type DiasSemanaCamel } from './dias-semana';
export type MenuFranjaFlags = DiasSemanaCamel & {
    idMenu: number;
    nombre: string;
    activo: boolean;
    prioridad: number;
    esDefault: boolean;
    horaInicio: string;
    horaFin: string;
};
export type MenuOverrideEstado = {
    idMenuOverride: number | null;
    menuOverrideHasta: Date | string | null;
};
export type MenuActivoModo = 'auto' | 'override';
export type MenuActivoResultado<T extends MenuFranjaFlags> = {
    menu: T;
    modo: MenuActivoModo;
};
/** Parsea "HH:mm" o "H:mm" a minutos desde medianoche; inválido → null. */
export declare function minutosDesdeHhMm(hhmm: string): number | null;
/** Normaliza a "HH:mm"; null si inválido. */
export declare function normalizarHhMm(hhmm: string): string | null;
/**
 * Incluye el instante en la franja.
 * Misma hora inicio/fin = todo el día.
 * Si fin < inicio, cruza medianoche (ej. 22:00–06:00).
 * Fin 23:59 se trata como inclusive hasta el final del día.
 */
export declare function franjaContieneAhora(horaInicio: string, horaFin: string, minutosAhora: number): boolean;
export declare function menuDisponibleEnDia(menu: DiasSemanaCamel, weekday: number): boolean;
export declare function overrideMenuVigente(override: MenuOverrideEstado, ahora?: Date): number | null;
/**
 * Elige el menú activo.
 * 1) Override vigente (si el menú existe y está activo)
 * 2) Menús activos que calzan día + franja, mayor prioridad
 * 3) Menú esDefault (activo o no, preferir activo)
 */
export declare function resolverMenuActivo<T extends MenuFranjaFlags>(menus: readonly T[], opts: {
    weekday: number;
    minutosAhora: number;
    override?: MenuOverrideEstado | null;
    ahora?: Date;
}): MenuActivoResultado<T> | null;
