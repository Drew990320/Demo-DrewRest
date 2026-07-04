import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class ReglaPromocionItemDto {
  @IsString()
  @MinLength(1)
  id!: string;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;

  @IsString()
  @MinLength(1)
  etiqueta!: string;

  @IsIn(['por_categoria'])
  tipo!: 'por_categoria';

  @IsInt()
  @Min(1)
  id_categoria!: number;

  @IsInt()
  @Min(0)
  monto_por_unidad!: number;

  @IsInt()
  @Min(1)
  min_unidades!: number;

  @IsInt()
  @Min(0)
  min_subtotal_otros!: number;
}
