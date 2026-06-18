import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateMeseroDto {
  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsString()
  @MinLength(1)
  apellido!: string;

  /** Si se omite, se genera como primernombre@lareserva.local */
  @IsOptional()
  @IsEmail({ require_tld: false })
  email?: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password!: string;
}
