import { IsInt, IsOptional, Min } from 'class-validator';

export class FaltaEnCocinaDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  cantidad?: number;
}
