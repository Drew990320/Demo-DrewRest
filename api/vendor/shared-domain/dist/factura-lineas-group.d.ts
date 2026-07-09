export type LineaFacturaAgrupable = {
    id_detalle: number;
    id_producto?: number;
    id_detalle_padre: number | null;
    nombre_producto: string;
    cantidad: number;
    precio_unitario: number;
    subtotal_linea: number;
    nota_cocina?: string | null;
    cobrado?: boolean;
    personalizaciones?: {
        id_opcion?: number;
        descripcion: string;
    }[];
    categoria_nombre?: string;
    es_plato_principal?: boolean;
    es_bebida?: boolean;
    es_empacable?: boolean;
    es_acompanamiento_mazorca?: boolean;
};
export type LineaFacturaGrupo = LineaFacturaAgrupable & {
    ids_detalle: number[];
};
/**
 * Agrupa líneas para la pantalla de cobro.
 * No separa por precio_unitario: los fragmentos de un mismo plato (mixto/cuota)
 * se muestran como una sola línea con el subtotal real.
 */
export declare function agruparLineasFacturaCobroVista(detalles: LineaFacturaAgrupable[]): LineaFacturaGrupo[];
/** Agrupa ítems idénticos en factura / pre-cuenta (mismo producto, precio y personalización). */
export declare function agruparLineasFactura(detalles: LineaFacturaAgrupable[]): LineaFacturaGrupo[];
export type LineaFacturaTicket = {
    cantidad: number;
    nombre_producto: string;
    precio_unitario: number;
    subtotal_linea: number;
    personalizaciones: string[];
    nota_cocina: string | null;
};
export declare function esDetalleEtiquetaCombinado(nota: string | null | undefined): boolean;
/** Cuota sobre el total (no modo combinar con ítems fijos por persona). */
export declare function esFacturaCuotaSobreTotal(personaPlanIndice: number | null | undefined, notasDetallesFactura: (string | null | undefined)[]): boolean;
/** Etiqueta interna de reparto mixto por precio; no debe verse en ticket. */
export declare function parseMixtoPrecioNota(nota: string | null | undefined): {
    origId: number;
    lado: 'efectivo' | 'transferencia';
} | null;
export declare function limpiarNotaCocinaTicket(nota: string | null | undefined): string | null;
/** Agrupa por producto en ticket total (ignora precios partidos por cobros parciales). */
export declare function agruparLineasFacturaPedidoTotal(detalles: LineaFacturaAgrupable[]): LineaFacturaGrupo[];
export declare function lineasFacturaParaTicketPedidoTotal(detalles: LineaFacturaAgrupable[]): LineaFacturaTicket[];
export type DetalleCantidadReferencia = {
    id_detalle: number;
    cantidad: number;
};
/** Líneas de referencia para ticket de cuota sobre ítems seleccionados (modo combinado). */
export declare function lineasFacturaParaTicketSeleccionReferencia(detalles: LineaFacturaAgrupable[], pool: DetalleCantidadReferencia[]): LineaFacturaTicket[];
/** Une rebanadas del mismo ítem partido por precio (pago mixto). */
export declare function consolidarLineasMixtoPrecio(detalles: LineaFacturaAgrupable[]): LineaFacturaAgrupable[];
export declare function lineasFacturaParaTicket(detalles: LineaFacturaAgrupable[], opts?: {
    consolidarMixtoPrecio?: boolean;
}): LineaFacturaTicket[];
