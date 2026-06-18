import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class PatchUsuarioDto {
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  /** Nueva contraseña (opcional). */
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password?: string;
}
