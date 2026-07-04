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
import { ReglaPromocionItemDto } from './regla-promocion-item.dto';

export class UpsertConfigDescuentosDto {  @IsOptional()
  @IsBoolean()
  sopas_activo?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sopas_monto_por_unidad?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  sopas_min_unidades?: number;

  @IsOptional()
  @IsBoolean()
  muleros_activo?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  muleros_monto_por_plato_principal?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  muleros_min_platos_principales?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  umbral_subtotal_otros?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReglaPromocionItemDto)
  reglas_promocion?: ReglaPromocionItemDto[];
}