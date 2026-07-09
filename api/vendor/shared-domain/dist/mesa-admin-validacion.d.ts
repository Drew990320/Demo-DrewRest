import type { DiasSemanaSnake } from './dias-semana';
import { type MesasVirtualesConfig } from './mesa-label';
export declare const CAMPOS_DISPONIBILIDAD_MESA: readonly ["disponible_lunes", "disponible_martes", "disponible_miercoles", "disponible_jueves", "disponible_viernes", "disponible_sabado", "disponible_domingo"];
export type CampoDisponibilidadMesa = (typeof CAMPOS_DISPONIBILIDAD_MESA)[number];
export type PatchDisponibilidadMesa = Partial<Record<CampoDisponibilidadMesa, boolean>>;
export type ValidacionAdminResult = {
    ok: true;
} | {
    ok: false;
    mensaje: string;
};
export declare function weekdayDesdeCampoMesa(campo: CampoDisponibilidadMesa): number;
export declare function campoMesaDesdeWeekday(weekday: number): CampoDisponibilidadMesa | null;
export declare function aplicarPatchDisponibilidadMesa(actual: DiasSemanaSnake, patch: PatchDisponibilidadMesa): DiasSemanaSnake;
export declare function validarPatchMesaAdmin(opts: {
    numeroMesa: number;
    flagsActuales: DiasSemanaSnake;
    patch: PatchDisponibilidadMesa;
    pedidosActivos: number;
    weekdayHoy: number;
    mesasVirtuales?: MesasVirtualesConfig;
}): ValidacionAdminResult;
export declare function validarDesactivarUsuario(opts: {
    pedidosActivos: number;
}): ValidacionAdminResult;
export declare function validarNumeroMesaReservado(numero: number, mesasVirtuales?: MesasVirtualesConfig): ValidacionAdminResult;
export declare function validarCambioNumeroMesaAdmin(opts: {
    numeroActual: number;
    numeroNuevo: number;
    pedidosActivos: number;
    mesasVirtuales?: MesasVirtualesConfig;
}): ValidacionAdminResult;
export declare function validarEliminarMesaAdmin(opts: {
    numeroMesa: number;
    pedidosActivos: number;
    totalPedidos: number;
    mesasVirtuales?: MesasVirtualesConfig;
}): ValidacionAdminResult;
