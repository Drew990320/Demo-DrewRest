import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class PatchDetalleCocinaDto {
  @IsBoolean()
  listo_cocina!: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  cantidad?: number;
}
