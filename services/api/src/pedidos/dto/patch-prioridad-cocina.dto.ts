import { IsIn } from 'class-validator';

/** `auto` quita el override y vuelve a la prioridad calculada por proteínas. */
export class PatchPrioridadCocinaDto {
  @IsIn(['alta', 'baja', 'auto'])
  modo!: 'alta' | 'baja' | 'auto';
}
