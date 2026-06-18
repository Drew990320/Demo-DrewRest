import { IsInt, Min } from 'class-validator';

export class DetalleCobroDto {
  @IsInt()
  id_detalle!: number;

  @IsInt()
  @Min(1)
  cantidad!: number;
}
