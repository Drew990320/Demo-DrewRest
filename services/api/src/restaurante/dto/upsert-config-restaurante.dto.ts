import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpsertConfigRestauranteDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nombre_comercial?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  telefono?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccion?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  dominio_email_interno?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  logo_archivo?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  texto_gracias_ticket?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  texto_propina_ticket?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  texto_aviso_no_dian?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  texto_pie_correo?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  prefijo_asunto_correo?: string | null;

  @IsOptional()
  @IsBoolean()
  mostrar_credito_drewtech?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  etiqueta_descuento_sopas?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  etiqueta_descuento_muleros?: string;

  @IsOptional()
  @IsBoolean()
  modulo_inventario_activo?: boolean;

  @IsOptional()
  @IsBoolean()
  modulo_meseros_operativos_activo?: boolean;

  @IsOptional()
  @IsBoolean()
  modulo_envio_correo_activo?: boolean;

  @IsOptional()
  @IsBoolean()
  modulo_resumen_diario_activo?: boolean;
}
