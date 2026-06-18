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

export class CreateProductoDto {
  @Type(() => Number)
  @IsInt()
  id_categoria!: number;

  @IsString()
  @MinLength(1)
  @MaxLength(150)
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precio!: number;

  @IsOptional()
  @IsBoolean()
  es_plato_principal?: boolean;

  @IsOptional()
  @IsBoolean()
  es_empacable?: boolean;

  @IsOptional()
  @IsEnum(TipoProteina)
  tipo_proteina?: TipoProteina;
}
