/**
 * Tipos de movimiento del ledger de recursos + validaciones por flags de categoría.
 */
import type { FlagsCategoriaRecurso } from './recurso-comportamiento';
export type TipoMovimientoRecurso = 'compra' | 'consumo' | 'venta' | 'produccion' | 'transferencia' | 'ajuste' | 'devolucion' | 'perdida' | 'dano' | 'robo' | 'mantenimiento' | 'baja' | 'consumo_receta';
export declare const TIPOS_MOVIMIENTO_RECURSO: readonly TipoMovimientoRecurso[];
export declare function esTipoMovimientoRecurso(v: string): v is TipoMovimientoRecurso;
export declare function esMovimientoEntradaRecurso(tipo: TipoMovimientoRecurso): boolean;
export declare function esMovimientoSalidaRecurso(tipo: TipoMovimientoRecurso): boolean;
/**
 * Delta de stock: positivo = entrada, negativo = salida.
 * Para `ajuste`, `cantidad` puede venir firmada o con signo en el campo cantidad.
 */
export declare function deltaStockMovimientoRecurso(tipo: TipoMovimientoRecurso, cantidad: number): number;
export type ValidacionMovimientoRecurso = Readonly<{
    ok: boolean;
    motivo?: string;
}>;
export declare function validarMovimientoContraFlags(tipo: TipoMovimientoRecurso, flags: FlagsCategoriaRecurso): ValidacionMovimientoRecurso;
/** Mapea tipo de movimiento legacy de inventario al ledger de recursos. */
export declare function tipoMovimientoDesdeInventarioLegacy(tipo: string): TipoMovimientoRecurso;
export type MovimientoRecursoPlan = Readonly<{
    id_recurso: number;
    tipo: TipoMovimientoRecurso;
    /** Positivo = entrada; negativo = salida. */
    delta: number;
    costo_unitario?: number;
    modulo_origen?: string;
    id_documento?: string;
    id_pedido?: number;
    id_detalle_pedido?: number;
    observacion?: string;
}>;
