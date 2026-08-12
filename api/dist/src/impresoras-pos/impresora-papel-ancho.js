"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHARS_80MM = exports.CHARS_58MM = exports.ANCHOS_PAPEL_MM = void 0;
exports.normalizarAnchoPapelMm = normalizarAnchoPapelMm;
exports.charsPorLineaParaPapelMm = charsPorLineaParaPapelMm;
exports.logoAnchoPxParaPapelMm = logoAnchoPxParaPapelMm;
exports.papelMmDesdeChars = papelMmDesdeChars;
exports.clampCharsPorLinea = clampCharsPorLinea;
exports.normalizarTamanoFuente = normalizarTamanoFuente;
exports.factorColumnasPorTamanoFuente = factorColumnasPorTamanoFuente;
exports.normalizarMargenLineas = normalizarMargenLineas;
exports.ANCHOS_PAPEL_MM = [58, 80];
exports.CHARS_58MM = 32;
exports.CHARS_80MM = 42;
function normalizarAnchoPapelMm(value) {
    const n = Number(value);
    if (n >= 80)
        return 80;
    return 58;
}
function charsPorLineaParaPapelMm(mm) {
    return normalizarAnchoPapelMm(mm) === 80 ? exports.CHARS_80MM : exports.CHARS_58MM;
}
function logoAnchoPxParaPapelMm(mm) {
    return normalizarAnchoPapelMm(mm) === 80 ? 576 : 384;
}
function papelMmDesdeChars(chars) {
    return chars >= 40 ? 80 : 58;
}
function clampCharsPorLinea(chars, fallback = 32) {
    return Number.isFinite(chars) && chars >= 24 && chars <= 48
        ? Math.round(chars)
        : fallback;
}
function normalizarTamanoFuente(value, fallback = 1) {
    const n = Math.round(Number(value));
    if (!Number.isFinite(n))
        return fallback;
    return Math.min(3, Math.max(-1, n));
}
function factorColumnasPorTamanoFuente(tamanoFuente) {
    const t = normalizarTamanoFuente(tamanoFuente);
    if (t <= -1)
        return 1.45;
    if (t === 0)
        return 1.32;
    return 1;
}
function normalizarMargenLineas(value, fallback = 0) {
    const n = Math.round(Number(value));
    if (!Number.isFinite(n))
        return fallback;
    return Math.min(20, Math.max(0, n));
}
//# sourceMappingURL=impresora-papel-ancho.js.map