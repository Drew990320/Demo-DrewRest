"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERIODO_RESUMEN_LABEL = exports.PERIODOS_RESUMEN = void 0;
exports.parsePeriodoResumen = parsePeriodoResumen;
exports.rangoPeriodoResumen = rangoPeriodoResumen;
exports.periodoResumenUsaCaja = periodoResumenUsaCaja;
exports.PERIODOS_RESUMEN = [
    'diario',
    'quincenal',
    'mensual',
    'anual',
];
exports.PERIODO_RESUMEN_LABEL = {
    diario: 'Diario',
    quincenal: 'Quincenal',
    mensual: 'Mensual',
    anual: 'Anual',
};
function parsePeriodoResumen(raw) {
    const p = String(raw ?? '')
        .trim()
        .toLowerCase();
    if (p === 'quincenal' || p === 'mensual' || p === 'anual')
        return p;
    return 'diario';
}
const MESES_ES = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
];
function parseYmd(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
    if (!m)
        return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (!Number.isFinite(y) || mo < 1 || mo > 12 || d < 1 || d > 31)
        return null;
    return { y, m: mo, d };
}
function pad2(n) {
    return n < 10 ? `0${n}` : String(n);
}
function ymd(y, m, d) {
    return `${y}-${pad2(m)}-${pad2(d)}`;
}
function daysInMonth(y, m) {
    return new Date(Date.UTC(y, m, 0)).getUTCDate();
}
/**
 * Calcula el rango del periodo (fechas calendario, tipicamente Bogotá).
 * Quincenal: días 1–15 o 16–fin de mes según el día ancla.
 */
function rangoPeriodoResumen(periodo, fechaAnclaYmd) {
    const parsed = parseYmd(fechaAnclaYmd);
    if (!parsed) {
        return {
            periodo: 'diario',
            fecha_ancla: fechaAnclaYmd,
            fecha_desde: fechaAnclaYmd,
            fecha_hasta: fechaAnclaYmd,
            etiqueta: fechaAnclaYmd,
        };
    }
    const { y, m, d } = parsed;
    const ancla = ymd(y, m, d);
    const mesNombre = MESES_ES[m - 1] ?? String(m);
    if (periodo === 'diario') {
        return {
            periodo,
            fecha_ancla: ancla,
            fecha_desde: ancla,
            fecha_hasta: ancla,
            etiqueta: `${d} de ${mesNombre} ${y}`,
        };
    }
    if (periodo === 'quincenal') {
        if (d <= 15) {
            return {
                periodo,
                fecha_ancla: ancla,
                fecha_desde: ymd(y, m, 1),
                fecha_hasta: ymd(y, m, 15),
                etiqueta: `1–15 ${mesNombre} ${y}`,
            };
        }
        const last = daysInMonth(y, m);
        return {
            periodo,
            fecha_ancla: ancla,
            fecha_desde: ymd(y, m, 16),
            fecha_hasta: ymd(y, m, last),
            etiqueta: `16–${last} ${mesNombre} ${y}`,
        };
    }
    if (periodo === 'mensual') {
        const last = daysInMonth(y, m);
        return {
            periodo,
            fecha_ancla: ancla,
            fecha_desde: ymd(y, m, 1),
            fecha_hasta: ymd(y, m, last),
            etiqueta: `${mesNombre} ${y}`,
        };
    }
    return {
        periodo: 'anual',
        fecha_ancla: ancla,
        fecha_desde: ymd(y, 1, 1),
        fecha_hasta: ymd(y, 12, 31),
        etiqueta: String(y),
    };
}
/** True si caja / cierre / vaciar aplican (solo día calendario). */
function periodoResumenUsaCaja(periodo) {
    return periodo === 'diario';
}
