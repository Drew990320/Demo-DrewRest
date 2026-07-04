import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DetalleCobroDto } from './detalle-cobro.dto';

export class OmitirCuotaPlanDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  persona_plan_indice!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  monto_persona_plan!: number;

  @Type(() => Number)
  @IsInt()
  @Min(2)
  total_personas_plan!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  facturas_base_plan!: number;

  /** Id de sesión de UI del reparto (timestamp); aísla omisiones entre repartos. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  plan_sesion_id?: number;

  /** Base del reparto (total o subtotal de la selección). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  plan_base_total?: number;

  @IsOptional()
  @IsBoolean()
  plan_personas_sobre_total?: boolean;

  @IsOptional()
  @IsBoolean()
  plan_combinado_sobre_seleccion?: boolean;

  /** Pool de platos del modo combinado (para nota del saldo pendiente). */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleCobroDto)
  detalles_seleccion_referencia?: DetalleCobroDto[];
}
