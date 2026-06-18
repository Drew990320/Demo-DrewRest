import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateCategoriaDto {
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
