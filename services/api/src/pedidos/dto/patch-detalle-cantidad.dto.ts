import { IsInt, Min } from 'class-validator';

export class PatchDetalleCantidadDto {
  @IsInt()
  @Min(1)
  cantidad!: number;
}
