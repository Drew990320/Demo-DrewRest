import { IsArray, IsInt, IsOptional } from 'class-validator';

export class ImprimirResumenSeleccionDto {
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  id_facturas?: number[];

  /** Comanda de cocina por pedido (una por pedido del día). */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  id_pedidos_comanda?: number[];
}
