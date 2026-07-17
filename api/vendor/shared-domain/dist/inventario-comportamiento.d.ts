/**
 * Perfil de comportamiento de un artículo de inventario.
 * Genérico: no asume tipo de negocio; los presets solo sugieren valores iniciales.
 */
export type ComportamientoInventario = Readonly<{
    se_compra: boolean;
    se_vende_directamente: boolean;
    tiene_receta: boolean;
    descuenta_automaticamente: boolean;
    es_activo_fijo: boolean;
    requiere_lote: boolean;
    controla_seriales: boolean;
    permite_prestamo: boolean;
    permite_mantenimiento: boolean;
    permite_perdidas: boolean;
}>;
export type ClaseInventario = 'comercial' | 'produccion' | 'activo_interno' | 'consumible_interno';
export declare const CLASES_INVENTARIO: readonly ClaseInventario[];
export declare const COMPORTAMIENTO_VACIO: ComportamientoInventario;
export declare const PRESET_COMERCIAL: ComportamientoInventario;
export declare const PRESET_PRODUCCION: ComportamientoInventario;
export declare const PRESET_ACTIVO_INTERNO: ComportamientoInventario;
export declare const PRESET_CONSUMIBLE_INTERNO: ComportamientoInventario;
export declare function esClaseInventario(v: string): v is ClaseInventario;
/** Preset por clase con overrides opcionales (desde BD o UI). */
export declare function resolverComportamiento(clase: ClaseInventario, overrides?: Partial<ComportamientoInventario> | null): ComportamientoInventario;
/** Parsea JSON almacenado en BD; ignora claves desconocidas. */
export declare function parseComportamientoJson(raw: unknown, clase?: ClaseInventario): ComportamientoInventario;
export declare function comportamientoPermiteDeduccionAuto(c: ComportamientoInventario): boolean;
export declare function comportamientoPermiteVentaDirecta(c: ComportamientoInventario): boolean;
