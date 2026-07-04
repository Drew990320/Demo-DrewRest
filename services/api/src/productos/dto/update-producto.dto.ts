import { TipoProteina } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateProductoDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_categoria?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precio?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsBoolean()
  es_plato_principal?: boolean;

  @IsOptional()
  @IsBoolean()
  es_empacable?: boolean;

  @IsOptional()
  @IsBoolean()
  es_acompanamiento_mazorca?: boolean;

  @IsOptional()
  @IsEnum(TipoProteina)
  tipo_proteina?: TipoProteina;

  @IsOptional()
  @IsBoolean()
  control_stock?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock_disponible?: number;

  @IsOptional()
  @IsBoolean()
  ocultar_sin_stock?: boolean;
}
