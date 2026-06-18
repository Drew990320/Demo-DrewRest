import { DateTime } from 'luxon';

/** 1 = lunes … 7 = domingo (Luxon, zona Bogotá). */
export function weekdayBogota(): number {
  return DateTime.now().setZone('America/Bogota').weekday;
}

export function isDomingoBogota(): boolean {
  return weekdayBogota() === 7;
}
