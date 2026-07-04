import { Type } from 'class-transformer';
import {
  IsInt,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class RevertirTandaCobroDto {
  /** Cualquier factura de la tanda (si es mixto, se revierten ambas patas). */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_factura!: number;

  @IsString()
  @MinLength(8)
  confirmar!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  motivo!: string;
}
