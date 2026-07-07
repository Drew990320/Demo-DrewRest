import { IsDateString, IsNumber, Min } from 'class-validator';

export class UpsertCajaDiariaCierreDto {
  @IsDateString()
  fecha!: string;

  @IsNumber()
  @Min(0)
  monto_base_cierre_efectivo!: number;
}
