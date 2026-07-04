import { BadRequestException } from '@nestjs/common';
import { DateTime } from 'luxon';

/** Fecha calendario Bogotá → `Date` UTC medianoche para columnas `@db.Date`. */
export function fechaBogotaDb(fecha?: string): { iso: string; date: Date } {
  let base = DateTime.now().setZone('America/Bogota');
  if (fecha) {
    const parsed = DateTime.fromISO(fecha, { zone: 'America/Bogota' });
    if (!parsed.isValid) {
      throw new BadRequestException('fecha inválida, usa formato YYYY-MM-DD');
    }
    base = parsed;
  }
  const iso = base.toFormat('yyyy-LL-dd');
  return { iso, date: new Date(Date.UTC(base.year, base.month - 1, base.day)) };
}
