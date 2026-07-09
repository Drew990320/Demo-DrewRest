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
export declare function flagsSemanaDesdeCamel(m: DiasSemanaCamel): boolean[];
export declare function flagsSemanaDesdeSnake(m: DiasSemanaSnake): boolean[];
/** weekday: 1 = lunes … 7 = domingo */
export declare function disponibleEnDiaSemana(flags: readonly boolean[], weekday: number): boolean;
export declare function categoriaDisponibleEnDia(cat: DiasSemanaCamel, weekday: number): boolean;
export declare function categoriaDisponibleEnDiaSnake(cat: DiasSemanaSnake, weekday: number): boolean;
export declare function mesaDisponibleEnDiaSemana(m: DiasSemanaCamel, weekday: number): boolean;
export declare function mesaDisponibleEnDiaSemanaSnake(m: DiasSemanaSnake, weekday: number): boolean;
