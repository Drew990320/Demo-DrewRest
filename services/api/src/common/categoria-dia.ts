import type { Categoria } from '@prisma/client';

export function categoriaDisponibleEnDia(
  cat: Pick<
    Categoria,
    | 'disponibleLunes'
    | 'disponibleMartes'
    | 'disponibleMiercoles'
    | 'disponibleJueves'
    | 'disponibleViernes'
    | 'disponibleSabado'
    | 'disponibleDomingo'
  >,
  weekday: number,
): boolean {
  const flags = [
    cat.disponibleLunes,
    cat.disponibleMartes,
    cat.disponibleMiercoles,
    cat.disponibleJueves,
    cat.disponibleViernes,
    cat.disponibleSabado,
    cat.disponibleDomingo,
  ];
  return flags[weekday - 1] ?? false;
}
