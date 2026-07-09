export type TipoProteina = 'ninguno' | 'pollo' | 'res' | 'cerdo' | 'pescado' | 'vegetariano' | 'otro';
export type PrioridadCocinaNivel = 'alta' | 'baja';
export type PrioridadCocinaModo = 'fifo' | 'por_reglas' | 'solo_manual';
/**
 * Etiqueta opcional de cocina (agrupación / visual). Ya no define prioridad automática.
 */
export declare function inferirTipoProteina(categoriaNombre: string, nombreProducto: string): TipoProteina;
/** Tipo en catálogo; sin inferencia en runtime. */
export declare function tipoProteinaResuelto(db: TipoProteina | undefined, _categoriaNombre?: string, _nombreProducto?: string): TipoProteina;
export declare function normalizarPrioridadCocinaModo(modo?: PrioridadCocinaModo | string | null, legacyAutomatica?: boolean | null): PrioridadCocinaModo;
export type DetallePrioridadCocinaLike = {
    categoria_nombre?: string;
    nombre_producto?: string;
    marcar_cocina?: boolean;
    es_plato_principal?: boolean;
    categoria_prioridad_cocina_baja?: boolean;
    producto_prioridad_cocina_baja?: boolean | null;
};
/** @deprecated Reglas legacy La Reserva (cerdo / parrillada por nombre). Solo seed/migración. */
export declare function esCategoriaPlatoFuerte(categoriaNombre: string): boolean;
/** @deprecated */
export declare function esParrilladaPicadaOCompartir(categoriaNombre: string, nombreProducto: string): boolean;
/** @deprecated */
export declare function esPlatoFuerteCerdo(categoriaNombre: string): boolean;
export declare function detalleMarcaPrioridadBaja(d: DetallePrioridadCocinaLike): boolean;
/**
 * Prioridad automática según modo operativo.
 * - fifo / solo_manual: todas alta (orden por hora).
 * - por_reglas: baja si categoría o producto tienen flag.
 */
export declare function prioridadAutomaticaResuelta(detalles: DetallePrioridadCocinaLike[], opts?: {
    modo?: PrioridadCocinaModo | string | null;
    /** @deprecated usar `modo` */
    automaticaActiva?: boolean;
}): PrioridadCocinaNivel;
/** @deprecated Reglas legacy por nombre (La Reserva). No usar en runtime. */
export declare function prioridadAutomaticaDesdeDetalles(detalles: DetallePrioridadCocinaLike[]): PrioridadCocinaNivel;
export declare function prioridadCocinaEfectiva(auto: PrioridadCocinaNivel, override: 'alta' | 'baja' | null | undefined): {
    nivel: PrioridadCocinaNivel;
    origen: 'auto' | 'manual';
};
export declare function ordenarPedidosCocina<T extends {
    prioridad_cocina: PrioridadCocinaNivel;
    creado_en: Date | string;
}>(pedidos: T[]): T[];
type LineaCocinaPendiente = {
    marcar_cocina?: boolean;
    enviado_cocina?: boolean;
    listo_para_recoger?: boolean;
    listo_cocina: boolean;
    cantidad: number;
};
/** Porciones de cocina enviadas y aún no marcadas listas. */
export declare function contarPorcionesPendientesCocina(pedidos: {
    detalles: LineaCocinaPendiente[];
}[]): number;
export {};
