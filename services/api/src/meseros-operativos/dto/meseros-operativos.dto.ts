import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpsertPagoTurnoMeseroDto {
  @IsString()
  fecha!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_usuario!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monto!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notas?: string;
}

export class AplicarSodaAlmuerzoDto {
  @IsOptional()
  @IsString()
  fecha?: string;
}

export class AplicarSodaMeseroDto extends AplicarSodaAlmuerzoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_usuario!: number;
}

export class AsignarDelegacionCierreDto {
  @IsOptional()
  @IsString()
  fecha?: string;

  /** Mesero designado; omitir o null para revocar la delegación del día. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_usuario?: number | null;
}
