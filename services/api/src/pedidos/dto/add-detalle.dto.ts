import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class AddDetalleDto {
  @IsInt()
  id_producto!: number;

  @IsInt()
  @Min(1)
  cantidad!: number;

  @IsOptional()
  @IsString()
  nota_cocina?: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  opcion_ids?: number[];

  /** Solo para llevar: no agregar empaque automático ($1.000 c/u) con el plato fuerte. */
  @IsOptional()
  @IsBoolean()
  sin_empaque_auto?: boolean;
}
