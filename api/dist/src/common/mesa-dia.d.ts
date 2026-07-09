import { Prisma } from '@prisma/client';
import { mesaDisponibleEnDiaSemana, type DiasSemanaCamel } from '@la-reserva/shared-domain/dias-semana';
export type MesaDiasSemana = DiasSemanaCamel;
export { mesaDisponibleEnDiaSemana };
export declare function mesaDisponibleHoyBogota(m: MesaDiasSemana): boolean;
export declare function campoDisponibilidadMesaParaWeekday(weekday: number): keyof Prisma.MesaWhereInput | null;
