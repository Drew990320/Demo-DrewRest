import { IsString, MinLength } from 'class-validator';

export class CancelarReabiertosDto {
  @IsString()
  @MinLength(4)
  confirmar!: string;
}
