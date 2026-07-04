import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CrearMovimientoCajaDto {
  @IsIn(['entrada_manual', 'salida_manual'])
  tipo!: 'entrada_manual' | 'salida_manual';

  @IsInt()
  @Min(1)
  monto!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string;

  /** YYYY-MM-DD (Bogotá). Por defecto hoy. */
  @IsOptional()
  @IsString()
  fecha?: string;
}
