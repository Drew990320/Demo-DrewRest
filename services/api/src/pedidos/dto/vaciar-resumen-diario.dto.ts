import { IsString, MinLength } from 'class-validator';

export class VaciarResumenDiarioDto {
  @IsString()
  @MinLength(4)
  confirmar!: string;
}
