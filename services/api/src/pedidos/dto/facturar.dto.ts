import { IsBoolean, IsIn, IsInt, IsOptional, IsArray, Max, Min, ValidateNested } from 'class-validator';
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

  /** Persona del plan de cobro (1-based); agrupa facturas del mismo turno. */
  @IsOptional()
  @IsInt()
  persona_plan_indice?: number;

  /** Total de personas en plan combinado (reparto de precio cuando hay menos unidades que personas). */
  @IsOptional()
  @IsInt()
  @Min(2)
  total_personas_plan?: number;

  /** Reparto igual del total pendiente (modo por personas); no asigna ítems en el cliente. */
  @IsOptional()
  @IsBoolean()
  plan_personas_sobre_total?: boolean;

  /** Cuota sobre ítems marcados (+/−) en modo combinado. */
  @IsOptional()
  @IsBoolean()
  plan_combinado_sobre_seleccion?: boolean;

  /** Selección congelada para referencia en ticket (modo combinado). */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleCobroDto)
  detalles_seleccion_referencia?: DetalleCobroDto[];

  /** Cuota neta esperada de esta persona (validación en plan sobre total). */
  @IsOptional()
  @IsInt()
  @Min(1)
  monto_persona_plan?: number;

  /** Agrupa facturas del mismo pago mixto (efectivo + transferencia). */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2_147_483_647)
  cobro_mixto_grupo?: number;

  /** Cuánto transfirió el cliente (solo transferencia; puede superar el total). */
  @IsOptional()
  @IsInt()
  @Min(1)
  monto_transferencia?: number;

  /** Uso del exceso si transfirió más del total (solo transferencia). */
  @IsOptional()
  @IsIn(['efectivo', 'transferencia', 'domicilio', 'mesero'])
  devolucion_exceso_metodo?: 'efectivo' | 'transferencia' | 'domicilio' | 'mesero';
}
