export type LineaAsignableCobro = {
    id_detalle: number;
    precio_unitario: number;
    cantidad_pendiente: number;
};
/**
 * Asigna cantidades por línea (padres) para aproximar un subtotal bruto objetivo.
 * Los empaques hijos se expanden al facturar vía expandirSolicitudesConEmpaques.
 */
export declare function asignarCantidadesParaSubtotal(lineas: LineaAsignableCobro[], subtotalObjetivo: number): Record<number, number>;
