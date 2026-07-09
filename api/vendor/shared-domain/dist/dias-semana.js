"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flagsSemanaDesdeCamel = flagsSemanaDesdeCamel;
exports.flagsSemanaDesdeSnake = flagsSemanaDesdeSnake;
exports.disponibleEnDiaSemana = disponibleEnDiaSemana;
exports.categoriaDisponibleEnDia = categoriaDisponibleEnDia;
exports.categoriaDisponibleEnDiaSnake = categoriaDisponibleEnDiaSnake;
exports.mesaDisponibleEnDiaSemana = mesaDisponibleEnDiaSemana;
exports.mesaDisponibleEnDiaSemanaSnake = mesaDisponibleEnDiaSemanaSnake;
function flagsSemanaDesdeCamel(m) {
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
function flagsSemanaDesdeSnake(m) {
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
function disponibleEnDiaSemana(flags, weekday) {
    if (weekday < 1 || weekday > 7)
        return false;
    return Boolean(flags[weekday - 1]);
}
function categoriaDisponibleEnDia(cat, weekday) {
    return disponibleEnDiaSemana(flagsSemanaDesdeCamel(cat), weekday);
}
function categoriaDisponibleEnDiaSnake(cat, weekday) {
    return disponibleEnDiaSemana(flagsSemanaDesdeSnake(cat), weekday);
}
function mesaDisponibleEnDiaSemana(m, weekday) {
    return categoriaDisponibleEnDia(m, weekday);
}
function mesaDisponibleEnDiaSemanaSnake(m, weekday) {
    return categoriaDisponibleEnDiaSnake(m, weekday);
}
