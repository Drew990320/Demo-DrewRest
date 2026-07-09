export type CompaneroModificaPedidoAccion = 'agregado' | 'quitado' | 'reducido';
export type LineaResumenPedido = {
    nombre_producto: string;
    cantidad: number;
};
export declare function resumenLineasPedido(lineas: LineaResumenPedido[]): string;
export declare function tituloCompaneroModificoPedido(accion?: CompaneroModificaPedidoAccion): string;
export declare function verboCompaneroModificoPedido(accion?: CompaneroModificaPedidoAccion): string;
export declare function mensajeCompaneroModificoPedido(accion: CompaneroModificaPedidoAccion, meseroNombre: string, lineas: LineaResumenPedido[], lugarMesa: string, pedidoId: number): string;
