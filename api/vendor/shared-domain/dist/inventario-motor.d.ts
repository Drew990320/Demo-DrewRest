import type { ClaseInventario, ComportamientoInventario } from './inventario-comportamiento';
import { type EventoDeduccionInventario, type PoliticaDeduccionInventario } from './inventario-deduccion';
import type { MovimientoInventarioPlan } from './inventario-movimientos';
import { type ArticuloInventarioReceta, type Receta } from './inventario-receta';
import type { ConversionUnidad } from './inventario-unidades';
export type ArticuloInventarioEstado = ArticuloInventarioReceta & Readonly<{
    nombre: string;
    clase: ClaseInventario;
    comportamiento: ComportamientoInventario;
    cantidad_actual: number;
    cantidad_minima: number;
    id_producto?: number;
}>;
export type LineaPedidoInventario = Readonly<{
    id_detalle_pedido: number;
    id_producto: number;
    cantidad: number;
    nombre_producto?: string;
}>;
export type PlanDeduccionInventario = Readonly<{
    evento: EventoDeduccionInventario;
    movimientos: MovimientoInventarioPlan[];
    advertencias: string[];
}>;
export declare function aplicarMovimientos(articulos: ReadonlyMap<number, ArticuloInventarioEstado>, movimientos: readonly MovimientoInventarioPlan[]): {
    articulos: Map<number, ArticuloInventarioEstado>;
    rechazados: ReadonlyArray<{
        id_articulo: number;
        motivo: string;
    }>;
};
export declare function planificarDeduccionVentaComercial(input: Readonly<{
    linea: LineaPedidoInventario;
    articulo: ArticuloInventarioEstado;
    evento: EventoDeduccionInventario;
    politica?: PoliticaDeduccionInventario;
    id_pedido?: number;
}>): MovimientoInventarioPlan[];
export declare function planificarDeduccionReceta(input: Readonly<{
    linea: LineaPedidoInventario;
    receta: Receta;
    articulos: ReadonlyMap<number, ArticuloInventarioEstado>;
    recetas?: ReadonlyMap<string, Receta>;
    conversiones?: readonly ConversionUnidad[];
    evento: EventoDeduccionInventario;
    politica?: PoliticaDeduccionInventario;
    id_pedido?: number;
}>): PlanDeduccionInventario;
export declare function articuloBajoMinimo(a: ArticuloInventarioEstado): boolean;
