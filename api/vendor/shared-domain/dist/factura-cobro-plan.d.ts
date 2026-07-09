import { type DetalleCobroCantidad, type DetalleSerialCobro } from './cobro-parcial';
export type ModoDividirCuenta = 'platos' | 'personas' | 'combinado';
export type FacturaPlanSlice = {
    persona_plan_indice?: number | null;
    cobro_mixto_grupo?: number | null;
};
/** Facturas del plan actual (desde facturasBasePlan). */
export type ResumenSaldoPlan = {
    cobrado: number;
    saldoRestante: number;
    saldoOmitido: number;
};
/** Saldo del reparto combinado/por personas (cuotas omitidas quedan como pendiente). */
export declare function resumenSaldoPlanCombinado(opts: {
    planBaseTotal: number;
    facturasSlice: {
        total: number;
    }[];
    planMontos: number[];
    personasOmitidas: number[];
}): ResumenSaldoPlan;
export declare function contarCobrosPlanHechos(facturas: FacturaPlanSlice[], base: number): number;
export declare function firmaCantidadesPlan(cantidades: Record<number, number>): string;
export declare function personaPlanYaCobradaEnSlice(facturas: FacturaPlanSlice[], base: number, planIdx: number): boolean;
export type LineaAsignablePlan = {
    id_detalle: number;
    precio_unitario: number;
    cantidad_pendiente: number;
};
export type AsignacionCobro = {
    cantidades: Record<number, number>;
    total: number;
    solicitudes: DetalleCobroCantidad[];
};
export declare function lineasAsignablesCobroPlan(opts: {
    detalles: {
        id_detalle: number;
        id_detalle_padre: number | null;
        cobrado?: boolean;
        es_cuota_pendiente_reparto?: boolean;
        precio_unitario: number;
        cantidad: number;
    }[];
    pendienteDetalle: (id: number) => number;
    modoDividir: ModoDividirCuenta;
    dividirCuenta: boolean;
    cantidadesCobro: Record<number, number>;
}): LineaAsignablePlan[];
export declare function resolverSolicitudesDesdeCantidadesPlan(serial: DetalleSerialCobro[], cantidades: Record<number, number>): DetalleCobroCantidad[];
/**
 * Reparto en modo combinado: ítems marcados con +/− y monto dividido entre N personas.
 * Si hay menos unidades que personas, cada uno paga su cuota y el API divide el precio del ítem.
 * Con más unidades, se asignan ítems hasta la cuota en pesos (no por conteo de unidades).
 */
export declare function asignacionCobroCombinado(montoNeto: number, personaIndice: number, totalPersonas: number, lineasAsignables: LineaAsignablePlan[], serial: DetalleSerialCobro[], totalNeto: (solicitudes: DetalleCobroCantidad[]) => number): AsignacionCobro | null;
export declare function asignacionCobroPorPersonasPendiente(montoNeto: number, personaIndice: number, totalPersonas: number, lineasAsignables: LineaAsignablePlan[], serial: DetalleSerialCobro[], totalNeto: (solicitudes: DetalleCobroCantidad[]) => number, soloCuota?: boolean): AsignacionCobro | null;
export declare function asignacionCobroPersonaPlan(opts: {
    montoNeto: number;
    modoDividir: ModoDividirCuenta;
    totalReferencia: number;
    lineasAsignables: LineaAsignablePlan[];
    serial: DetalleSerialCobro[];
    totalNeto: (solicitudes: DetalleCobroCantidad[]) => number;
    personaIndice?: number;
    totalPersonas?: number;
    soloCuota?: boolean;
}): AsignacionCobro | null;
