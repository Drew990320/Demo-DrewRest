import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';
import type { TipoLineaCocinaCategoria } from '@la-reserva/shared-domain/categoria-reglas';
import { CATEGORIA_MENU_ICON_IDS } from '@la-reserva/shared-domain/categoria-menu-icon';

export class UpdateCategoriaDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nombre?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

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

  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== '')
  @IsString()
  @IsIn(CATEGORIA_MENU_ICON_IDS)
  icono_menu?: string | null;
}
