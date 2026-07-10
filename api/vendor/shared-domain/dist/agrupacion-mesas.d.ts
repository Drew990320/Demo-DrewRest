import { type MesasVirtualesConfig } from './mesa-label';
type DetalleAgrupacionLike = {
    enviado_cocina?: boolean;
    enviadoCocina?: boolean;
};
export type ResultadoValidacionAgrupacion = {
    accion: 'agrupar';
    mensaje_confirmacion: string;
} | {
    accion: 'rechazar';
    mensaje: string;
};
export type ResultadoValidacionDesagrupacion = {
    accion: 'desagrupar';
    mensaje_confirmacion: string;
} | {
    accion: 'rechazar';
    mensaje: string;
};
export declare function pedidoTieneLineasEnviadasCocina(detalles: DetalleAgrupacionLike[]): boolean;
/** Agrupa una mesa libre al pedido de la mesa principal (ocupada). */
export declare function validarAgruparMesaAlPedido(input: {
    mesa_principal_numero: number;
    mesa_anexa_numero: number;
    mesa_anexa_libre: boolean;
    mesas_virtuales?: MesasVirtualesConfig | null;
}): ResultadoValidacionAgrupacion;
/** Separa mesas anexas antes de enviar a cocina. */
export declare function validarDesagruparMesa(input: {
    mesa_principal_numero: number;
    mesa_anexa_numero: number;
    detalles: DetalleAgrupacionLike[];
    mesas_virtuales?: MesasVirtualesConfig | null;
}): ResultadoValidacionDesagrupacion;
export declare function etiquetaMesasAgrupadas(mesaPrincipal: number, mesasAnexas: number[]): string;
export declare const AYUDA_AGRUPACION_MESAS = "Une mesas libres al mismo pedido (una sola cuenta). Separa antes de enviar a cocina.";
export {};
