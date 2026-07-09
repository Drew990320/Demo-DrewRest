export type ComandaLinea = {
    id_detalle: number;
    cantidad: number;
    nombre_producto: string;
    nota_cocina: string | null;
    personalizaciones: string[];
};
export type ComandaTicket = {
    id_pedido: number;
    mesa_numero: number;
    mesa_etiqueta: string;
    num_comensales: number;
    mesero: string;
    modo_servicio: 'en_mesa' | 'para_llevar';
    lineas: ComandaLinea[];
    emitida_en: string;
    es_reimpresion?: boolean;
    es_adicional?: boolean;
};
export { etiquetaMesaComanda } from '@la-reserva/shared-domain/mesa-label';
