import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class DetalleCobroDto {
  @Type(() => Number)
  @IsInt()
  id_detalle!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  cantidad!: number;
}
