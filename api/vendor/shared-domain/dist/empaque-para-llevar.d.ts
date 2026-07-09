/** Precio de cada empaque automático en para llevar (un empaque por unidad). */
export declare const PRECIO_EMPAQUE_PARA_LLEVAR_COP = 1000;
import { type CategoriaLike, type CategoriaReglasInput } from './categoria-reglas';
/** Solo los ítems de categoría marcada como línea empaque son empaque del sistema. */
export declare function esEmpacablePorCategoria(categoria: CategoriaLike): boolean;
/** Flags sugeridos al crear/editar productos en admin del menú. */
export declare function flagsProductoMenuPorCategoria(categoria: CategoriaLike): {
    es_plato_principal: boolean;
    es_empacable: boolean;
};
export type ProductoEmpaqueInput = {
    es_plato_principal?: boolean;
    esPlatoPrincipal?: boolean;
    es_empacable?: boolean;
    esEmpacable?: boolean;
    categoria_nombre?: string;
    categoria?: CategoriaReglasInput;
};
/** Para llevar: un empaque por unidad de plato principal (flag o categoría típica). */
export declare function productoCobraEmpaqueParaLlevarPorPlatoFuerte(p: ProductoEmpaqueInput): boolean;
export type DetalleEmpaqueResumen = {
    id_detalle: number;
    id_detalle_padre: number | null;
    cantidad: number;
    es_empacable?: boolean;
    es_plato_principal?: boolean;
    categoria_nombre?: string;
    categoria?: CategoriaReglasInput;
};
export declare function cantidadEmpaqueVinculadaPadre(idDetallePadre: number, detalles: Pick<DetalleEmpaqueResumen, 'id_detalle_padre' | 'cantidad' | 'es_empacable'>[]): number;
/** Cantidad del hijo empaque tras cambiar la cantidad del plato padre. */
export declare function nuevaCantidadEmpaqueTrasCambioPadre(cantidadEmpaque: number, cantidadPadreAnterior: number, cantidadPadreNueva: number): number;
/** Unidades de empaque que faltan en una línea de plato (0 = ok). */
export declare function empaqueFaltanteEnDetallePadre(detalle: DetalleEmpaqueResumen, detalles: DetalleEmpaqueResumen[]): number;
/** Totales de empaque esperado vs asignado en un pedido para llevar. */
export declare function resumenEmpaqueParaLlevar(modoServicio: string | undefined, detalles: DetalleEmpaqueResumen[]): {
    unidades_plato: number;
    unidades_empaque: number;
    unidades_faltantes: number;
} | null;
/** true cuando hay menos empaques que platos pero al menos uno (empaque compartido). */
export declare function empaqueCompartidoEnPedido(resumen: ReturnType<typeof resumenEmpaqueParaLlevar>): boolean;
