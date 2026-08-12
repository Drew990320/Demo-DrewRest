"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_DIAS_PERIODO_PERSONALIZADO = exports.PERIODO_RESUMEN_LABEL = exports.PERIODOS_RESUMEN = void 0;
exports.parsePeriodoResumen = parsePeriodoResumen;
exports.rangoPeriodoPersonalizado = rangoPeriodoPersonalizado;
exports.rangoPeriodoResumen = rangoPeriodoResumen;
exports.periodoResumenUsaCaja = periodoResumenUsaCaja;
exports.PERIODOS_RESUMEN = [
    'diario',
    'semanal',
    'quincenal',
    'mensual',
    'anual',
    'personalizado',
];
exports.PERIODO_RESUMEN_LABEL = {
    diario: 'Diario',
    semanal: 'Semanal',
    quincenal: 'Quincenal',
    mensual: 'Mensual',
    anual: 'Anual',
    personalizado: 'Personalizado',
};
function parsePeriodoResumen(raw) {
    const p = String(raw ?? '')
        .trim()
        .toLowerCase();
    if (p === 'semanal' ||
        p === 'quincenal' ||
        p === 'mensual' ||
        p === 'anual' ||
        p === 'personalizado') {
        return p;
    }
    return 'diario';
}
const MESES_ES_CORTO = [
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sep',
    'oct',
    'nov',
    'dic',
];
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
/** Tope de días inclusivos para rango personalizado. */
exports.MAX_DIAS_PERIODO_PERSONALIZADO = 366;
function parseYmd(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
    if (!m)
        return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (!Number.isFinite(y) || mo < 1 || mo > 12 || d < 1 || d > 31)
        return null;
    const last = daysInMonth(y, mo);
    if (d > last)
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
function utcDayMs(y, m, d) {
    return Date.UTC(y, m - 1, d);
}
function ymdFromUtcMs(ms) {
    const dt = new Date(ms);
    return ymd(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}
function etiquetaRangoCorto(desde, hasta) {
    const m1 = MESES_ES_CORTO[desde.m - 1] ?? String(desde.m);
    const m2 = MESES_ES_CORTO[hasta.m - 1] ?? String(hasta.m);
    if (desde.y === hasta.y && desde.m === hasta.m && desde.d === hasta.d) {
        return `${desde.d} ${m1} ${desde.y}`;
    }
    if (desde.y === hasta.y) {
        return `${desde.d} ${m1} – ${hasta.d} ${m2} ${desde.y}`;
    }
    return `${desde.d} ${m1} ${desde.y} – ${hasta.d} ${m2} ${hasta.y}`;
}
/**
 * Rango personalizado (desde/hasta inclusivos).
 * Retorna null si las fechas son inválidas, desde > hasta, o supera el tope.
 */
function rangoPeriodoPersonalizado(fechaDesdeYmd, fechaHastaYmd) {
    const desde = parseYmd(fechaDesdeYmd);
    const hasta = parseYmd(fechaHastaYmd);
    if (!desde || !hasta)
        return null;
    const msDesde = utcDayMs(desde.y, desde.m, desde.d);
    const msHasta = utcDayMs(hasta.y, hasta.m, hasta.d);
    if (msDesde > msHasta)
        return null;
    const diasInclusivos = Math.floor((msHasta - msDesde) / 86400000) + 1;
    if (diasInclusivos > exports.MAX_DIAS_PERIODO_PERSONALIZADO)
        return null;
    const desdeStr = ymd(desde.y, desde.m, desde.d);
    const hastaStr = ymd(hasta.y, hasta.m, hasta.d);
    return {
        periodo: 'personalizado',
        fecha_ancla: desdeStr,
        fecha_desde: desdeStr,
        fecha_hasta: hastaStr,
        etiqueta: etiquetaRangoCorto(desde, hasta),
    };
}
/**
 * Calcula el rango del periodo (fechas calendario, tipicamente Bogotá).
 * Semanal: lunes–domingo (ISO) según día ancla.
 * Quincenal: días 1–15 o 16–fin de mes según el día ancla.
 * Personalizado: usar `rangoPeriodoPersonalizado` (aquí cae a diario).
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
    if (periodo === 'personalizado') {
        return {
            periodo,
            fecha_ancla: ancla,
            fecha_desde: ancla,
            fecha_hasta: ancla,
            etiqueta: etiquetaRangoCorto(parsed, parsed),
        };
    }
    if (periodo === 'semanal') {
        const ms = utcDayMs(y, m, d);
        const day = new Date(ms).getUTCDay(); // 0=dom … 6=sáb
        const offsetFromMon = day === 0 ? 6 : day - 1;
        const mondayMs = ms - offsetFromMon * 86400000;
        const sundayMs = mondayMs + 6 * 86400000;
        const desdeStr = ymdFromUtcMs(mondayMs);
        const hastaStr = ymdFromUtcMs(sundayMs);
        const desdeP = parseYmd(desdeStr);
        const hastaP = parseYmd(hastaStr);
        return {
            periodo,
            fecha_ancla: ancla,
            fecha_desde: desdeStr,
            fecha_hasta: hastaStr,
            etiqueta: etiquetaRangoCorto(desdeP, hastaP),
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
