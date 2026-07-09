export type ProductoConStock = {
    activo?: boolean;
    control_stock?: boolean;
    stock_disponible?: number;
    ocultar_sin_stock?: boolean;
};
export declare function productoAgotado(p: ProductoConStock): boolean;
/** Si el producto debe listarse en el menú del día. */
export declare function productoVisibleEnMenu(p: ProductoConStock): boolean;
export declare function puedePedirCantidad(p: ProductoConStock, cantidad: number): boolean;
export declare function stockEtiqueta(p: ProductoConStock): string | null;
