export const WEEKDAYS = [
  { key: 'disponible_lunes', short: 'Lu', full: 'Lunes' },
  { key: 'disponible_martes', short: 'Ma', full: 'Martes' },
  { key: 'disponible_miercoles', short: 'Mi', full: 'Miércoles' },
  { key: 'disponible_jueves', short: 'Ju', full: 'Jueves' },
  { key: 'disponible_viernes', short: 'Vi', full: 'Viernes' },
  { key: 'disponible_sabado', short: 'Sa', full: 'Sábado' },
  { key: 'disponible_domingo', short: 'Do', full: 'Domingo' },
] as const;

export type WeekdayFieldKey = (typeof WEEKDAYS)[number]['key'];

export type WeekdayFlags = Record<WeekdayFieldKey, boolean>;

export function allWeekdayFlags(value: boolean): WeekdayFlags {
  return Object.fromEntries(
    WEEKDAYS.map((d) => [d.key, value]),
  ) as WeekdayFlags;
}

export function pickWeekdayFlags(row: Record<WeekdayFieldKey, boolean>): WeekdayFlags {
  return Object.fromEntries(
    WEEKDAYS.map((d) => [d.key, Boolean(row[d.key])]),
  ) as WeekdayFlags;
}

export function countActiveWeekdays(flags: WeekdayFlags): number {
  return WEEKDAYS.filter((d) => flags[d.key]).length;
}

export function weekdaySummary(flags: WeekdayFlags): string {
  const n = countActiveWeekdays(flags);
  if (n === 0) return 'Sin días activos';
  if (n === 7) return 'Todos los días';
  const active = WEEKDAYS.filter((d) => flags[d.key]).map((d) => d.short);
  return active.join(' · ');
}
