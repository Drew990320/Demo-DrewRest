/** Vínculo lógico Menú (catálogo) ↔ Inventario (stock/recetas). Sin duplicar datos. */
export type VinculoInventarioProducto = Readonly<{
    id_producto: number;
    comercial: boolean;
    id_inventario: number | null;
    receta_activa: boolean;
    id_receta: number | null;
    lineas_receta: number;
}>;
export type MapaVinculosInventarioMenu = Record<string, Omit<VinculoInventarioProducto, 'id_producto'>>;
export declare function etiquetaVinculoInventario(v: Omit<VinculoInventarioProducto, 'id_producto'>): string | null;
export declare function productoTieneVinculoInventario(v: Omit<VinculoInventarioProducto, 'id_producto'> | undefined): boolean;
