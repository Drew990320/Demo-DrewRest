import { IsString, MaxLength, MinLength } from 'class-validator';

export class CerrarAnulandoPendienteDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  motivo!: string;
}
