/**
 * Flags de comportamiento de una categoría de recurso.
 * El comportamiento efectivo sale de la categoría (configurable), no de if (clase === ...).
 */
export type FlagsCategoriaRecurso = Readonly<{
    controla_stock: boolean;
    se_consume_auto: boolean;
    puede_venderse: boolean;
    requiere_receta: boolean;
    controla_vencimiento: boolean;
    controla_lote: boolean;
    maneja_serie: boolean;
    requiere_mantenimiento: boolean;
    es_activo_fijo: boolean;
    permite_depreciacion: boolean;
    tiene_responsable: boolean;
    tiene_ubicacion: boolean;
    permite_prestamo: boolean;
}>;
export type SeedCategoriaRecurso = Readonly<{
    codigo: string;
    nombre: string;
    descripcion?: string;
    orden: number;
    flags: FlagsCategoriaRecurso;
    /** Clases legacy de Inventario que mapean a esta categoría en migración. */
    clases_legacy?: readonly string[];
}>;
export declare const FLAGS_CATEGORIA_VACIO: FlagsCategoriaRecurso;
/** Seed inicial de categorías (mapea presets de inventario-comportamiento). */
export declare const SEED_CATEGORIAS_RECURSO: readonly SeedCategoriaRecurso[];
export type EstadoRecurso = 'activo' | 'agotado' | 'mantenimiento' | 'baja' | 'prestado';
export declare const ESTADOS_RECURSO: readonly EstadoRecurso[];
export declare function esEstadoRecurso(v: string): v is EstadoRecurso;
export declare function parseFlagsCategoriaJson(raw: Partial<FlagsCategoriaRecurso> | null | undefined): FlagsCategoriaRecurso;
/** Resuelve flags efectivos desde fila de categoría (API/Prisma snake o camel). */
export declare function flagsDesdeCategoriaRow(row: Record<string, unknown>): FlagsCategoriaRecurso;
export declare function categoriaCodigoParaClaseLegacy(clase: string): string;
/** Estado derivado tras cambiar stock (si controla stock). */
export declare function estadoTrasStock(stock: number, stockMin: number, estadoActual: EstadoRecurso): EstadoRecurso;
