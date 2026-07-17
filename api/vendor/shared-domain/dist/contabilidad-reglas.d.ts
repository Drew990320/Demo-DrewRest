import { type ValidacionAsiento } from './contabilidad-asiento';
import type { AsientoPlan, FormulaMontoRegla, LadoAsiento } from './contabilidad-tipos';
export type ReglaLineaPlantilla = Readonly<{
    lado: LadoAsiento;
    id_cuenta: number;
    codigo_cuenta?: string;
    formula_monto: FormulaMontoRegla;
    porcentaje?: number | null;
    monto_fijo?: number | null;
    orden: number;
}>;
export type ReglaPlantilla = Readonly<{
    codigo: string;
    nombre: string;
    lineas: readonly ReglaLineaPlantilla[];
}>;
/** Aplica plantilla de regla a un monto base → plan de asiento. */
export declare function aplicarReglaContable(regla: ReglaPlantilla, montoBase: number, descripcion?: string): {
    plan: AsientoPlan;
    validacion: ValidacionAsiento;
};
/** Atajo: regla Dr/Cr con monto total (casos POS). */
export declare function reglaDosCuentasTotal(input: {
    nombre: string;
    id_debito: number;
    id_credito: number;
    monto: number;
    codigo_debito?: string;
    codigo_credito?: string;
    descripcion?: string;
}): {
    plan: AsientoPlan;
    validacion: ValidacionAsiento;
};
