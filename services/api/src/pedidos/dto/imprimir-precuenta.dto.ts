import { IsBoolean, IsInt, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DetalleCobroDto } from './detalle-cobro.dto';

export class ImprimirPrecuentaDto {
  /** Imprime dos tickets: copia negocio y copia cliente. */
  @IsOptional()
  @IsBoolean()
  factura_con_copia?: boolean;

  /**
   * Ítems a incluir en la pre-cuenta (dividir cuenta).
   * Si se omite, incluye todos los ítems pendientes.
   * @deprecated Preferir detalles_cobro para cantidades parciales.
   */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  id_detalles?: number[];

  /** Cantidades parciales por ítem para la pre-cuenta. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleCobroDto)
  detalles_cobro?: DetalleCobroDto[];
}
