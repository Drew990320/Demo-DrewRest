import { type MesasVirtualesConfig } from './mesa-label';
export type DetalleTransferenciaLike = {
    es_bebida?: boolean;
    es_acompanamiento_mazorca?: boolean;
    esAcompanamientoMazorca?: boolean;
    es_empacable?: boolean;
    esEmpacable?: boolean;
    categoria_nombre?: string;
    id_detalle_padre?: number | null;
    idDetallePadre?: number | null;
};
export declare function pedidoDebeTenerLineaMazorca(mesaNumero: number, detalles: DetalleTransferenciaLike[], mazorcaActiva?: boolean): boolean;
export type ResultadoValidacionTransferencia = {
    accion: 'mover';
    mensaje_confirmacion: string;
} | {
    accion: 'rechazar';
    mensaje: string;
};
/** Transferencia entre mesas libres; no hacia/desde 98 (para llevar) ni 99 (mostrador). */
export declare function validarTransferenciaPedido(input: {
    origen_mesa_numero: number;
    destino_mesa_numero: number;
    destino_libre: boolean;
    mesas_virtuales?: MesasVirtualesConfig | null;
}): ResultadoValidacionTransferencia;
export declare const AYUDA_TRANSFERENCIA_PEDIDO = "Elige una mesa libre. Para llevar y mostrador: cancela y abre pedido nuevo.";
