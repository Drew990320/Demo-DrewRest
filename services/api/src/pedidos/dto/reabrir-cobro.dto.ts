import { IsString, MaxLength, MinLength } from 'class-validator';

export class ReabrirCobroDto {
  @IsString()
  @MinLength(6)
  confirmar!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  motivo!: string;
}
