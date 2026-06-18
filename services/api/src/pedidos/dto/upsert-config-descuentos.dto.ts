import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

export class UpsertConfigDescuentosDto {
  @IsOptional()
  @IsBoolean()
  sopas_activo?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sopas_monto_por_unidad?: number;

  @IsOptional()
  @IsBoolean()
  muleros_activo?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  muleros_monto_por_plato_principal?: number;
}
