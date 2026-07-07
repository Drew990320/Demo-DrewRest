import {
  IsObject,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

export class UpsertConfigVisualDto {
  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== '')
  @IsString()
  @Matches(HEX_COLOR, { message: 'color_primary debe ser #RRGGBB' })
  color_primary?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== '')
  @IsString()
  @Matches(HEX_COLOR)
  color_primary_dark?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== '')
  @IsString()
  @Matches(HEX_COLOR)
  color_secondary?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== '')
  @IsString()
  @Matches(HEX_COLOR)
  color_background?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== '')
  @IsString()
  @Matches(HEX_COLOR)
  color_background_alt?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== '')
  @IsString()
  @Matches(HEX_COLOR)
  color_surface?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== '')
  @IsString()
  @Matches(HEX_COLOR)
  color_text?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== '')
  @IsString()
  @Matches(HEX_COLOR)
  color_text_muted?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== '')
  @IsString()
  @Matches(HEX_COLOR)
  color_border?: string | null;

  @IsOptional()
  @IsObject()
  iconos_nav?: Record<string, string>;

  @IsOptional()
  @IsObject()
  iconos_accion?: Record<string, string>;

  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== '')
  @IsString()
  estilo_visual?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== '')
  @IsString()
  mesa_forma?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== '')
  @IsString()
  mesa_vista?: string | null;
}
