export declare class EtiquetaPedidoDto {
    id: string;
    etiqueta: string;
    activa?: boolean;
    descripcion?: string;
}
export declare class ReglaPromocionItemDto {
    id: string;
    activa?: boolean;
    etiqueta: string;
    tipo: 'por_categoria' | 'por_categoria_marcada' | 'por_plato_principal' | 'precio_fijo_categoria' | 'compra_paga' | 'umbral_subtotal_pedido';
    id_categoria?: number;
    id_producto?: number;
    monto_por_unidad?: number;
    precio_fijo_unidad?: number;
    min_unidades?: number;
    min_subtotal_otros?: number;
    min_subtotal_pedido?: number;
    monto_descuento?: number;
    porcentaje_descuento?: number;
    compra_unidades?: number;
    paga_unidades?: number;
    alcance?: 'categoria' | 'producto';
    requiere_etiqueta_pedido?: string;
}
