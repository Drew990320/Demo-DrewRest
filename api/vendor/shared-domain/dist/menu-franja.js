"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.minutosDesdeHhMm = minutosDesdeHhMm;
exports.normalizarHhMm = normalizarHhMm;
exports.franjaContieneAhora = franjaContieneAhora;
exports.menuDisponibleEnDia = menuDisponibleEnDia;
exports.overrideMenuVigente = overrideMenuVigente;
exports.resolverMenuActivo = resolverMenuActivo;
const dias_semana_1 = require("./dias-semana");
/** Parsea "HH:mm" o "H:mm" a minutos desde medianoche; inválido → null. */
function minutosDesdeHhMm(hhmm) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm ?? '').trim());
    if (!m)
        return null;
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (!Number.isFinite(h) || !Number.isFinite(min))
        return null;
    if (h < 0 || h > 23 || min < 0 || min > 59)
        return null;
    return h * 60 + min;
}
/** Normaliza a "HH:mm"; null si inválido. */
function normalizarHhMm(hhmm) {
    const mins = minutosDesdeHhMm(hhmm);
    if (mins == null)
        return null;
    const h = Math.floor(mins / 60);
    const min = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}
/**
 * Incluye el instante en la franja.
 * Misma hora inicio/fin = todo el día.
 * Si fin < inicio, cruza medianoche (ej. 22:00–06:00).
 * Fin 23:59 se trata como inclusive hasta el final del día.
 */
function franjaContieneAhora(horaInicio, horaFin, minutosAhora) {
    const ini = minutosDesdeHhMm(horaInicio);
    const fin = minutosDesdeHhMm(horaFin);
    if (ini == null || fin == null)
        return false;
    if (minutosAhora < 0 || minutosAhora > 24 * 60 - 1)
        return false;
    if (ini === fin)
        return true;
    // 23:59 como cierre del día: incluir el último minuto.
    const finEfectivo = fin === 23 * 60 + 59 ? 24 * 60 : fin;
    if (finEfectivo > ini) {
        return minutosAhora >= ini && minutosAhora < finEfectivo;
    }
    // Cruza medianoche: [ini, 24h) U [0, fin)
    return minutosAhora >= ini || minutosAhora < finEfectivo;
}
function menuDisponibleEnDia(menu, weekday) {
    return (0, dias_semana_1.categoriaDisponibleEnDia)(menu, weekday);
}
function overrideMenuVigente(override, ahora = new Date()) {
    const id = override.idMenuOverride;
    if (id == null || !Number.isFinite(id) || id <= 0)
        return null;
    const hasta = override.menuOverrideHasta;
    if (hasta == null)
        return id;
    const ts = hasta instanceof Date ? hasta.getTime() : new Date(hasta).getTime();
    if (!Number.isFinite(ts))
        return id;
    if (ts <= ahora.getTime())
        return null;
    return id;
}
/**
 * Elige el menú activo.
 * 1) Override vigente (si el menú existe y está activo)
 * 2) Menús activos que calzan día + franja, mayor prioridad
 * 3) Menú esDefault (activo o no, preferir activo)
 */
function resolverMenuActivo(menus, opts) {
    if (!menus.length)
        return null;
    const overrideId = opts.override
        ? overrideMenuVigente(opts.override, opts.ahora ?? new Date())
        : null;
    if (overrideId != null) {
        const forced = menus.find((m) => m.idMenu === overrideId && m.activo);
        if (forced)
            return { menu: forced, modo: 'override' };
    }
    const candidatos = menus
        .filter((m) => m.activo)
        .filter((m) => menuDisponibleEnDia(m, opts.weekday))
        .filter((m) => franjaContieneAhora(m.horaInicio, m.horaFin, opts.minutosAhora))
        .sort((a, b) => b.prioridad - a.prioridad || a.idMenu - b.idMenu);
    if (candidatos.length > 0) {
        return { menu: candidatos[0], modo: 'auto' };
    }
    const defActivo = menus.find((m) => m.esDefault && m.activo);
    if (defActivo)
        return { menu: defActivo, modo: 'auto' };
    const defCualquiera = menus.find((m) => m.esDefault);
    if (defCualquiera)
        return { menu: defCualquiera, modo: 'auto' };
    const primero = menus
        .filter((m) => m.activo)
        .sort((a, b) => b.prioridad - a.prioridad || a.idMenu - b.idMenu)[0];
    return primero ? { menu: primero, modo: 'auto' } : null;
}
