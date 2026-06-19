import { Prisma } from '@prisma/client';
import {
  mesaDisponibleEnDiaSemana,
  type DiasSemanaCamel,
} from '@la-reserva/shared-domain/dias-semana';
import { weekdayBogota } from './timezone';

export type MesaDiasSemana = DiasSemanaCamel;

export { mesaDisponibleEnDiaSemana };

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
