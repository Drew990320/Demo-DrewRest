import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class PatchEtiquetasPromocionDto {
  @IsArray()
  @IsString({ each: true })
  etiquetas_promocion!: string[];

  /** Compatibilidad con clientes antiguos. */
  @IsOptional()
  @IsBoolean()
  cliente_mulero?: boolean;
}
