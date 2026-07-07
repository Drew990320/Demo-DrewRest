export type HorarioAccesoDia = {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
};

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

export function horaValidaHHmm(value: string): boolean {
  return HH_MM.test(value.trim());
}

/** 0=domingo … 6=sábado (mismo criterio que Date.getDay en zona local). */
export function diaSemanaValido(dia: number): boolean {
  return Number.isInteger(dia) && dia >= 0 && dia <= 6;
}

function minutosDesdeMedianoche(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Indica si la hora actual cae en algún bloque del día.
 * Sin horarios configurados → acceso libre (compatibilidad demo).
 */
export function dentroDeHorarioAcceso(
  horarios: HorarioAccesoDia[],
  ahora: { diaSemana: number; minutos: number },
): boolean {
  if (!horarios.length) return true;
  const delDia = horarios.filter((h) => h.dia_semana === ahora.diaSemana);
  if (!delDia.length) return false;
  return delDia.some((h) => {
    const ini = minutosDesdeMedianoche(h.hora_inicio);
    const fin = minutosDesdeMedianoche(h.hora_fin);
    if (fin <= ini) return false;
    return ahora.minutos >= ini && ahora.minutos < fin;
  });
}

export const DIAS_SEMANA_ACCESO = [
  { id: 0, label: 'Domingo' },
  { id: 1, label: 'Lunes' },
  { id: 2, label: 'Martes' },
  { id: 3, label: 'Miércoles' },
  { id: 4, label: 'Jueves' },
  { id: 5, label: 'Viernes' },
  { id: 6, label: 'Sábado' },
] as const;
