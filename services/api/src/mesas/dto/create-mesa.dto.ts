import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class CreateMesaDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  numero!: number;

  /** Opcional; por defecto 4 (no se usa en la operación del restaurante). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  capacidad?: number;

  @IsOptional()
  @IsBoolean()
  disponible_lunes?: boolean;

  @IsOptional()
  @IsBoolean()
  disponible_martes?: boolean;

  @IsOptional()
  @IsBoolean()
  disponible_miercoles?: boolean;

  @IsOptional()
  @IsBoolean()
  disponible_jueves?: boolean;

  @IsOptional()
  @IsBoolean()
  disponible_viernes?: boolean;

  @IsOptional()
  @IsBoolean()
  disponible_sabado?: boolean;

  @IsOptional()
  @IsBoolean()
  disponible_domingo?: boolean;
}
