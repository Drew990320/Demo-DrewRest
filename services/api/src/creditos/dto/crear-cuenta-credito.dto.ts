import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CrearCuentaCreditoDto {
  @IsInt()
  @Min(1)
  id_pedido!: number;

  @IsString()
  @MinLength(1)
  nombre_cliente!: string;

  @IsInt()
  @Min(1)
  monto_total!: number;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  id_factura?: number;
}
