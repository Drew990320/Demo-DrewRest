import { IsBoolean, IsIn, IsInt, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DetalleCobroDto } from './detalle-cobro.dto';

export class FacturarDto {
  @IsIn(['efectivo', 'transferencia'])
  metodo_pago!: 'efectivo' | 'transferencia';

  /** Si es false, registra el cobro pero no imprime ticket en la POS. */
  @IsOptional()
  @IsBoolean()
  imprimir_factura?: boolean;

  /** Imprime dos tickets: copia negocio y copia cliente. */
  @IsOptional()
  @IsBoolean()
  factura_con_copia?: boolean;

  /**
   * Ítems a cobrar en esta tanda (dividir cuenta).
   * Si se omite, se cobran todos los ítems pendientes.
   * @deprecated Preferir detalles_cobro para cantidades parciales.
   */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  id_detalles?: number[];

  /**
   * Ítems y cantidades a cobrar (permite p. ej. 2 de 5 unidades iguales).
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleCobroDto)
  detalles_cobro?: DetalleCobroDto[];
}
