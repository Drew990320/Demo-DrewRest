/**
 * Repara líneas partidas por cobro mixto/cuota (precios distintos del mismo plato)
 * cuando vuelven a quedar pendientes (salida de factura, reversa de tanda, etc.).
 */
export type DetalleParaConsolidarFragmentos = {
    id_detalle: number;
    id_producto: number;
    id_detalle_padre: number | null;
    id_factura: number | null;
    cantidad: number;
    precio_unitario: number;
    nota_cocina: string | null;
    enviado_cocina: boolean;
    listo_cocina: boolean;
    listo_para_recoger: boolean;
    /** ids de personalización ordenados; vacío si no hay. */
    personalizacion_key: string;
    /** Precio de catálogo del producto (referencia). */
    precio_catalogo?: number;
    es_cuota_pendiente_reparto?: boolean;
};
export type PlanMergeFragmentos = {
    keepId: number;
    cantidad: number;
    precio_unitario: number;
    nota_cocina: string | null;
    deleteIds: number[];
};
/** Precio unitario canónico que explica el subtotal (enteros COP). */
export declare function inferirPrecioUnitarioCanonico(total: number, preciosObservados: number[], precioCatalogo?: number): number;
/**
 * Plan de merge: deja una fila por grupo con cantidad/precio enteros
 * y lista ids a eliminar.
 */
export declare function planConsolidarFragmentosPrecioPendientes(detalles: DetalleParaConsolidarFragmentos[]): PlanMergeFragmentos[];
