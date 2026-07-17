import type { AsientoPlan, LineaAsientoPlan } from './contabilidad-tipos';
/** Redondeo monetario COP (pesos enteros). */
export declare function redondearDineroContable(n: number): number;
export declare function totalDebitos(lineas: readonly LineaAsientoPlan[]): number;
export declare function totalCreditos(lineas: readonly LineaAsientoPlan[]): number;
export declare function asientoEstaBalanceado(lineas: readonly LineaAsientoPlan[]): boolean;
export type ValidacionAsiento = Readonly<{
    ok: boolean;
    motivo?: string;
}>;
export declare function validarAsientoPlan(plan: AsientoPlan): ValidacionAsiento;
/** Construye asiento espejo para reversión. */
export declare function planReversoAsiento(original: AsientoPlan, descripcion?: string): AsientoPlan;
export declare function asientoSimpleDosCuentas(input: {
    descripcion: string;
    id_cuenta_debito: number;
    id_cuenta_credito: number;
    monto: number;
    codigo_debito?: string;
    codigo_credito?: string;
}): AsientoPlan;
