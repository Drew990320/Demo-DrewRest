import { IsEmail, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class EnviarFacturaCorreoDto {
  @IsEmail({}, { message: 'Indica un correo válido del cliente' })
  email!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_factura?: number;
}
