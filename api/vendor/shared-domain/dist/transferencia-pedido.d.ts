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
/**
 * Transferencia entre mesas físicas (no 98/99).
 * - Libre: mueve la cuenta y libera el origen.
 * - Ocupada: deja una segunda cuenta en el destino (como bebidas / para llevar), sin agrupar mesas.
 */
export declare function validarTransferenciaPedido(input: {
    origen_mesa_numero: number;
    destino_mesa_numero: number;
    destino_libre: boolean;
    destino_es_anexa?: boolean;
    mesas_virtuales?: MesasVirtualesConfig | null;
}): ResultadoValidacionTransferencia;
export declare const AYUDA_TRANSFERENCIA_PEDIDO = "Elige mesa libre u ocupada. En ocupada queda como segunda cuenta (sin agrupar). Para llevar y mostrador: cancela y abre pedido nuevo.";
