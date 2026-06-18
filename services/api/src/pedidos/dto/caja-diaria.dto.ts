import { IsDateString, IsNumber, Min } from 'class-validator';

export class UpsertCajaDiariaDto {
  @IsDateString()
  fecha!: string;

  @IsNumber()
  @Min(0)
  monto_base_efectivo!: number;
}
