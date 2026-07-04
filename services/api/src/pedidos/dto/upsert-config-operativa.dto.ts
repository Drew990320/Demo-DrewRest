import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpsertConfigOperativaDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precio_empaque_para_llevar?: number;

  @IsOptional()
  @IsBoolean()
  mazorca_activa?: boolean;

  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_producto_mazorca?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  numero_mesa_para_llevar?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  numero_mesa_mostrador?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  etiqueta_para_llevar?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  etiqueta_mostrador?: string;

  @IsOptional()
  @IsBoolean()
  mostrador_activo?: boolean;

  @IsOptional()
  @IsBoolean()
  para_llevar_activo?: boolean;

  @IsOptional()
  @IsBoolean()
  beneficio_soda_almuerzo_activo?: boolean;

  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_producto_soda_almuerzo?: number | null;

  @IsOptional()
  @IsBoolean()
  soda_almuerzo_descontar_stock?: boolean;
}
