import { type LineaAsignableCobro } from './asignar-cobro-por-monto';
import type { DetalleCobroCantidad } from './cobro-parcial';
export type RepartirMixtoOpciones = {
    lineasPadre?: LineaAsignableCobro[];
    /** Convierte cantidades de líneas padre al neto cobrado (descuentos). */
    netoDeCantidades?: (cantidades: Record<number, number>) => number;
    /** Expande padres a solicitudes finales (empaques, etc.). */
    expandirCantidades?: (cantidades: Record<number, number>) => DetalleCobroCantidad[];
};
/** Límite de columna INTEGER en PostgreSQL (INT4). */
export declare const COBRO_MIXTO_GRUPO_MAX = 2147483647;
export type RepartoMixtoTransferencia = {
    transferenciaFactura: number;
    efectivoFactura: number;
    excesoDevolverEfectivo: number;
};
/** Reparto de factura según cuánto transfirió el cliente (puede superar el total). */
export declare function repartoMixtoDesdeTransferencia(total: number, transferenciaReal: number): RepartoMixtoTransferencia;
/**
 * Si el vuelto se devuelve por transferencia, se conserva todo el efectivo en la
 * venta (cuadre de caja) y el exceso total sale por transferencia.
 * En cualquier otro caso se usa el reparto clásico (transferencia primero).
 */
export declare function repartoMixtoConDevolucion(total: number, transferenciaReal: number, efectivoRecibido: number, devolucionMetodo?: 'efectivo' | 'transferencia' | 'domicilio' | 'mesero' | null): RepartoMixtoTransferencia;
/** Resta cantidades ya asignadas a un cobro parcial. */
export declare function restarSolicitudesCobro(total: DetalleCobroCantidad[], parcial: DetalleCobroCantidad[]): DetalleCobroCantidad[];
/**
 * Reparte ítems de un cobro entre factura efectivo y transferencia (mismo turno).
 */
export declare function dividirSolicitudesCobroMixto(solicitudes: DetalleCobroCantidad[], precioUnitarioPorDetalle: Record<number, number>, montoNetoEfectivo: number, totalNetoCompleto: number, opciones?: RepartirMixtoOpciones): {
    efectivo: DetalleCobroCantidad[];
    transferencia: DetalleCobroCantidad[];
};
export type FacturaMixtoRef = {
    id_factura: number;
    metodo_pago: string;
    persona_plan_indice?: number | null;
    cobro_mixto_grupo?: number | null;
    total: number;
    /** Permite emparejar mixtos antiguos sin cobro_mixto_grupo al reimprimir. */
    emitida_en?: string | Date;
};
/**
 * ID de grupo para cobrar efectivo + transferencia en la misma operación.
 * Debe caber en INT4 de PostgreSQL (no usar Date.now() en milisegundos).
 */
export declare function nuevoCobroMixtoGrupo(nowMs?: number): number;
export declare function cobroMixtoGrupoValido(value: number | null | undefined): value is number;
export declare function esGrupoPagoMixto(facturas: FacturaMixtoRef[]): boolean;
/**
 * Facturas que forman una misma tanda de cobro a partir de una factura.
 * - Mixto: ambas patas (cobro_mixto_grupo o persona del plan).
 * - Simple: solo esa factura.
 */
export declare function facturasDeTandaCobro<T extends FacturaMixtoRef>(facturas: T[], idFactura: number): T[];
/** Facturas del mismo cobro mixto (mismo grupo o misma persona del plan). */
export declare function agruparFacturasMixto<T extends FacturaMixtoRef>(facturas: T[], actual: T): T[];
export declare function cobrosResumenMixto(facturas: FacturaMixtoRef[]): {
    metodo_pago: 'efectivo' | 'transferencia';
    total: number;
}[];
/** Suma varios cobros parciales en una línea por método (ticket total del pedido). */
export declare function consolidarCobrosResumenPorMetodo(cobros: {
    metodo_pago: 'efectivo' | 'transferencia';
    total: number;
}[]): {
    metodo_pago: 'efectivo' | 'transferencia';
    total: number;
}[];
export type CobroVista<T extends FacturaMixtoRef> = {
    tipo: 'simple';
    cobro: T;
} | {
    tipo: 'mixto';
    cobros: T[];
    key: string;
};
/** Agrupa cobros mixtos para mostrar una sola fila en UI e impresión. */
export declare function agruparCobrosVista<T extends FacturaMixtoRef>(cobros: T[]): CobroVista<T>[];
/** Una id_factura por cobro lógico (evita imprimir el mismo ticket mixto dos veces). */
export declare function facturasIdsImpresionUnica<T extends FacturaMixtoRef>(facturas: T[]): number[];
export type CobroResumenPedidoTotal = {
    metodo_pago: 'efectivo' | 'transferencia' | 'mixto';
    total: number;
};
/** Resumen de cobros de un pedido para ticket total (agrupa mixtos). */
export declare function resumenCobrosPedidoTotal<T extends FacturaMixtoRef>(facturas: T[]): {
    cobros: CobroResumenPedidoTotal[];
    metodo_pago?: 'efectivo' | 'transferencia' | 'mixto';
    cobros_resumen?: {
        metodo_pago: 'efectivo' | 'transferencia';
        total: number;
    }[];
};
