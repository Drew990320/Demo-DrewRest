export type LineaVentaResumen = {
    id_producto: number;
    nombre_producto: string;
    categoria_nombre: string;
    es_plato_principal: boolean;
    es_acompanamiento_mazorca?: boolean;
    es_cuota_pendiente_reparto?: boolean;
    cantidad: number;
    subtotal_linea: number;
};
export type VentaPorCategoria = {
    categoria_nombre: string;
    cantidad: number;
    subtotal: number;
};
export type VentaPorProducto = {
    id_producto: number;
    nombre_producto: string;
    categoria_nombre: string;
    cantidad: number;
    subtotal: number;
};
export type VentasResumenDiario = {
    platos_por_categoria: VentaPorCategoria[];
    items_menu: VentaPorProducto[];
};
/** Agrupa líneas facturadas del día en platos por categoría e ítems del menú. */
export declare function agregarVentasResumenDiario(lineas: LineaVentaResumen[]): VentasResumenDiario;
