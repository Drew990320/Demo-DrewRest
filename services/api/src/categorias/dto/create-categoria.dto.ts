import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import type { TipoLineaCocinaCategoria } from '@la-reserva/shared-domain/categoria-reglas';

export class CreateCategoriaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre!: string;

  @IsOptional()
  @IsBoolean()
  disponible_lunes?: boolean;

  @IsOptional()
  @IsBoolean()
  disponible_martes?: boolean;

  @IsOptional()
  @IsBoolean()
  disponible_miercoles?: boolean;

  @IsOptional()
  @IsBoolean()
  disponible_jueves?: boolean;

  @IsOptional()
  @IsBoolean()
  disponible_viernes?: boolean;

  @IsOptional()
  @IsBoolean()
  disponible_sabado?: boolean;

  @IsOptional()
  @IsBoolean()
  disponible_domingo?: boolean;

  @IsOptional()
  @IsBoolean()
  es_bebida?: boolean;

  @IsOptional()
  @IsBoolean()
  cobra_empaque_para_llevar?: boolean;

  @IsOptional()
  @IsBoolean()
  participa_descuento_sopas?: boolean;

  @IsOptional()
  @IsBoolean()
  es_linea_empaque?: boolean;

  @IsOptional()
  @IsBoolean()
  visible_en_mostrador?: boolean;

  @IsOptional()
  @IsBoolean()
  es_plato_principal_default?: boolean;

  @IsOptional()
  @IsIn(['plato', 'entrada', 'adicional'])
  tipo_linea_cocina_default?: TipoLineaCocinaCategoria;
}
