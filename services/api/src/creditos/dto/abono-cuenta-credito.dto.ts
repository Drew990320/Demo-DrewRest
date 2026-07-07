import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AbonoCuentaCreditoDto {
  @IsInt()
  @Min(1)
  monto!: number;

  @IsOptional()
  @IsString()
  notas?: string;
}
