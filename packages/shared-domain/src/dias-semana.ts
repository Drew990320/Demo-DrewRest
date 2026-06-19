export type DiasSemanaCamel = {
  disponibleLunes: boolean;
  disponibleMartes: boolean;
  disponibleMiercoles: boolean;
  disponibleJueves: boolean;
  disponibleViernes: boolean;
  disponibleSabado: boolean;
  disponibleDomingo: boolean;
};

export type DiasSemanaSnake = {
  disponible_lunes: boolean;
  disponible_martes: boolean;
  disponible_miercoles: boolean;
  disponible_jueves: boolean;
  disponible_viernes: boolean;
  disponible_sabado: boolean;
  disponible_domingo: boolean;
};

export function flagsSemanaDesdeCamel(m: DiasSemanaCamel): boolean[] {
  return [
    m.disponibleLunes,
    m.disponibleMartes,
    m.disponibleMiercoles,
    m.disponibleJueves,
    m.disponibleViernes,
    m.disponibleSabado,
    m.disponibleDomingo,
  ];
}

export function flagsSemanaDesdeSnake(m: DiasSemanaSnake): boolean[] {
  return [
    m.disponible_lunes,
    m.disponible_martes,
    m.disponible_miercoles,
    m.disponible_jueves,
    m.disponible_viernes,
    m.disponible_sabado,
    m.disponible_domingo,
  ];
}

/** weekday: 1 = lunes … 7 = domingo */
export function disponibleEnDiaSemana(
  flags: readonly boolean[],
  weekday: number,
): boolean {
  if (weekday < 1 || weekday > 7) return false;
  return Boolean(flags[weekday - 1]);
}

export function categoriaDisponibleEnDia(
  cat: DiasSemanaCamel,
  weekday: number,
): boolean {
  return disponibleEnDiaSemana(flagsSemanaDesdeCamel(cat), weekday);
}

export function categoriaDisponibleEnDiaSnake(
  cat: DiasSemanaSnake,
  weekday: number,
): boolean {
  return disponibleEnDiaSemana(flagsSemanaDesdeSnake(cat), weekday);
}

export function mesaDisponibleEnDiaSemana(
  m: DiasSemanaCamel,
  weekday: number,
): boolean {
  return categoriaDisponibleEnDia(m, weekday);
}

export function mesaDisponibleEnDiaSemanaSnake(
  m: DiasSemanaSnake,
  weekday: number,
): boolean {
  return categoriaDisponibleEnDiaSnake(m, weekday);
}
