import type { LineaAsientoPlan, TipoCuentaContable } from './contabilidad-tipos';
export type MovimientoMayor = Readonly<{
    id_cuenta: number;
    codigo?: string;
    nombre?: string;
    tipo?: TipoCuentaContable;
    debito: number;
    credito: number;
}>;
export declare function agregarMayor(movimientos: readonly MovimientoMayor[]): ReadonlyArray<MovimientoMayor & {
    saldo: number;
    naturaleza_saldo: 'debito' | 'credito' | 'cero';
}>;
export type ResumenSimpleDia = Readonly<{
    ingresos: number;
    gastos: number;
    utilidad: number;
}>;
/** Heurística desde líneas: créditos a tipo ingreso = ingresos; débitos a gasto = gastos. */
export declare function resumenSimpleDesdeLineas(lineas: ReadonlyArray<LineaAsientoPlan & {
    tipo_cuenta?: TipoCuentaContable;
}>): ResumenSimpleDia;
