/**
 * Secciones fijas para listar / imprimir pedidos y facturas:
 * mazorca (acompañamiento opcional) → platos fuertes → menú infantil → entradas → bebidas → empacables.
 */
export type SeccionLineaPedido = 'mazorca' | 'plato_fuerte' | 'menu_infantil' | 'entrada' | 'bebida' | 'empacable';
export type LineaPedidoOrdenInput = {
    id_detalle?: number;
    nombre_producto?: string;
    categoria_nombre?: string;
    es_acompanamiento_mazorca?: boolean;
    esAcompanamientoMazorca?: boolean;
    es_plato_principal?: boolean;
    esPlatoPrincipal?: boolean;
    es_bebida?: boolean;
    esBebida?: boolean;
    es_empacable?: boolean;
    esEmpacable?: boolean;
};
export declare function seccionLineaPedido(d: LineaPedidoOrdenInput): SeccionLineaPedido;
export declare function ordenSeccionLineaPedido(seccion: SeccionLineaPedido): number;
export declare function compararLineasPedidoPorSeccion(a: LineaPedidoOrdenInput, b: LineaPedidoOrdenInput): number;
export declare function ordenarLineasPedidoPorSeccion<T extends LineaPedidoOrdenInput>(detalles: T[]): T[];
