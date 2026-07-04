import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DetalleCobroDto } from './detalle-cobro.dto';

export class FacturarMixtoDto {
  /** Cuánto transfirió el cliente (pesos enteros COP). */
  @IsInt()
  @Min(1)
  monto_transferencia!: number;

  /** Efectivo recibido del cliente (validación cuando hay parte en efectivo). */
  @IsOptional()
  @IsInt()
  @Min(0)
  monto_recibido_efectivo?: number;

  @IsOptional()
  @IsBoolean()
  imprimir_factura?: boolean;

  @IsOptional()
  @IsBoolean()
  factura_con_copia?: boolean;

  /** Ítems de esta tanda (dividir cuenta). Si se omite, todos los pendientes. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleCobroDto)
  detalles_cobro?: DetalleCobroDto[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  persona_plan_indice?: number;

  /** Total de personas en plan combinado (reparto de precio cuando hay menos unidades que personas). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  total_personas_plan?: number;

  /** Reparto igual del total pendiente (modo por personas). */
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

  /** Cuota neta esperada de esta persona. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  monto_persona_plan?: number;

  /** Cómo se usa el exceso si transfirió más del total (obligatorio en ese caso). */
  @IsOptional()
  @IsIn(['efectivo', 'transferencia', 'domicilio', 'mesero'])
  devolucion_exceso_metodo?: 'efectivo' | 'transferencia' | 'domicilio' | 'mesero';
}
