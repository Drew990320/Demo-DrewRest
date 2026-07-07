import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class EtiquetaPedidoDto {
  @IsString()
  @MinLength(1)
  id!: string;

  @IsString()
  @MinLength(1)
  etiqueta!: string;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;

  @IsOptional()
  @IsString()
  descripcion?: string;
}

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

  @IsString()
  @MinLength(1)
  tipo!:
    | 'por_categoria'
    | 'por_categoria_marcada'
    | 'por_plato_principal'
    | 'precio_fijo_categoria'
    | 'compra_paga'
    | 'umbral_subtotal_pedido';

  @IsOptional()
  @IsInt()
  @Min(1)
  id_categoria?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  id_producto?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  monto_por_unidad?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  precio_fijo_unidad?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  min_unidades?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  min_subtotal_otros?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  min_subtotal_pedido?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  monto_descuento?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  porcentaje_descuento?: number;

  @IsOptional()
  @IsInt()
  @Min(2)
  compra_unidades?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  paga_unidades?: number;

  @IsOptional()
  @IsString()
  alcance?: 'categoria' | 'producto';

  @IsOptional()
  @IsString()
  requiere_etiqueta_pedido?: string;
}
