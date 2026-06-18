import { Prisma } from '@prisma/client';
import { weekdayBogota } from './timezone';

/** Campos de disponibilidad por día (misma forma que el modelo `Mesa`). */
export type MesaDiasSemana = {
  disponibleLunes: boolean;
  disponibleMartes: boolean;
  disponibleMiercoles: boolean;
  disponibleJueves: boolean;
  disponibleViernes: boolean;
  disponibleSabado: boolean;
  disponibleDomingo: boolean;
};

/** 1 = lunes … 7 = domingo (Luxon Bogotá). */
const DIA_A_CAMPO: Record<number, keyof MesaDiasSemana> = {
  1: 'disponibleLunes',
  2: 'disponibleMartes',
  3: 'disponibleMiercoles',
  4: 'disponibleJueves',
  5: 'disponibleViernes',
  6: 'disponibleSabado',
  7: 'disponibleDomingo',
};

export function mesaDisponibleEnDiaSemana(
  m: MesaDiasSemana,
  weekday: number,
): boolean {
  const campo = DIA_A_CAMPO[weekday];
  if (!campo) return false;
  return Boolean(m[campo]);
}

export function mesaDisponibleHoyBogota(m: MesaDiasSemana): boolean {
  return mesaDisponibleEnDiaSemana(m, weekdayBogota());
}

/** Campo Prisma para filtrar mesas visibles en un día concreto. */
export function campoDisponibilidadMesaParaWeekday(
  weekday: number,
): keyof Prisma.MesaWhereInput | null {
  const k = DIA_A_CAMPO[weekday];
  if (!k) return null;
  return k as keyof Prisma.MesaWhereInput;
}
