/** Expande ítems seleccionados incluyendo empaques hijos aún pendientes de cobro. */
export declare function expandirDetallesParaCobro(detalles: {
    id_detalle: number;
    id_detalle_padre: number | null;
    cobrado: boolean;
}[], idsSolicitados: number[]): number[];
export declare function idsDetallesPendientes(detalles: {
    id_detalle: number;
    cobrado: boolean;
}[]): number[];
export declare function pedidoCobroCompleto(detalles: {
    cobrado: boolean;
}[]): boolean;
export type DetalleSerialCobro = {
    id_detalle: number;
    id_detalle_padre: number | null;
    cobrado: boolean;
    cantidad: number;
};
export type DetalleCobroCantidad = {
    id_detalle: number;
    cantidad: number;
};
export declare function resolverSolicitudesCobro(opts: {
    id_detalles?: number[];
    detalles_cobro?: DetalleCobroCantidad[];
}, detalles: DetalleSerialCobro[], pendientes: number[]): DetalleCobroCantidad[];
/** Incluye empaques hijos pendientes; cobra hasta la cantidad disponible (empaque compartido). */
export declare function expandirSolicitudesConEmpaques(detalles: DetalleSerialCobro[], solicitudes: DetalleCobroCantidad[]): DetalleCobroCantidad[];
export declare function ordenarSolicitudesCobro(detalles: DetalleSerialCobro[], solicitudes: DetalleCobroCantidad[]): DetalleCobroCantidad[];
export declare function subtotalDesdeSolicitudes(detalles: {
    id_detalle: number;
    precio_unitario: number;
    cantidad: number;
}[], solicitudes: DetalleCobroCantidad[]): number;
export declare function lineasDescuentoDesdeSolicitudes<T extends {
    id_detalle: number;
    cantidad: number;
    precio_unitario: number;
    nombre_producto: string;
    categoria_nombre?: string;
    id_categoria?: number;
    id_producto?: number;
    es_plato_principal?: boolean;
    participa_descuento_sopas?: boolean;
}>(detalles: T[], solicitudes: DetalleCobroCantidad[]): {
    id_detalle: number;
    cantidad: number;
    subtotal_linea: number;
    nombre_producto: string;
    categoria_nombre: string;
    id_categoria: number | undefined;
    id_producto: number | undefined;
    precio_unitario: number;
    es_plato_principal: boolean | undefined;
    participa_descuento_sopas: boolean | undefined;
}[];
export declare function unidadesEnSolicitudes(solicitudes: DetalleCobroCantidad[]): number;
/** Tras aplicar estas cantidades, ¿queda algo pendiente en el pedido? */
export declare function quedaPendienteTrasCobro(detalles: DetalleSerialCobro[], solicitudes: DetalleCobroCantidad[]): boolean;
export declare function solicitudesDesdeCantidades(cantidades: Record<number, number>): DetalleCobroCantidad[];
