/** Línea de pedido con producto repartible y sin reparto completo de subítems. */
export declare function sumaCantidadesSubitems(subitems: {
    cantidad: number;
}[] | null | undefined): number;
/**
 * True si el producto usa subítems repartibles y la suma asignada
 * no coincide con la cantidad de la línea (incluye suma 0 = pendiente).
 */
export declare function detalleSubitemsPendientes(d: {
    usa_subitems_repartibles?: boolean;
    cantidad: number;
    subitems?: {
        cantidad: number;
    }[] | null;
}): boolean;
