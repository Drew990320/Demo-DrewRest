import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  EtiquetaPedidoDto,
  ReglaPromocionItemDto,
} from './regla-promocion-item.dto';

export class UpsertConfigDescuentosDto {
  /** @deprecated Usar reglas_promocion unificadas. */
  @IsOptional()
  @IsBoolean()
  sopas_activo?: boolean;

  /** @deprecated */
  @IsOptional()
  @IsNumber()
  @Min(0)
  sopas_monto_por_unidad?: number;

  /** @deprecated */
  @IsOptional()
  @IsInt()
  @Min(1)
  sopas_min_unidades?: number;

  /** @deprecated */
  @IsOptional()
  @IsBoolean()
  muleros_activo?: boolean;

  /** @deprecated */
  @IsOptional()
  @IsNumber()
  @Min(0)
  muleros_monto_por_plato_principal?: number;

  /** @deprecated */
  @IsOptional()
  @IsInt()
  @Min(1)
  muleros_min_platos_principales?: number;

  /** @deprecated */
  @IsOptional()
  @IsNumber()
  @Min(0)
  umbral_subtotal_otros?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReglaPromocionItemDto)
  reglas_promocion?: ReglaPromocionItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EtiquetaPedidoDto)
  etiquetas_pedido?: EtiquetaPedidoDto[];
}
