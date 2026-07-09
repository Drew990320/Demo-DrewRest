import { EtiquetaPedidoDto, ReglaPromocionItemDto } from './regla-promocion-item.dto';
export declare class UpsertConfigDescuentosDto {
    sopas_activo?: boolean;
    sopas_monto_por_unidad?: number;
    sopas_min_unidades?: number;
    muleros_activo?: boolean;
    muleros_monto_por_plato_principal?: number;
    muleros_min_platos_principales?: number;
    umbral_subtotal_otros?: number;
    reglas_promocion?: ReglaPromocionItemDto[];
    etiquetas_pedido?: EtiquetaPedidoDto[];
}
