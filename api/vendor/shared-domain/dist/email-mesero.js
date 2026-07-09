"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOMINIO_MESERO = void 0;
exports.usuarioLocalDesdeNombre = usuarioLocalDesdeNombre;
exports.emailMeseroDesdeNombre = emailMeseroDesdeNombre;
const DOMINIO_MESERO_DEFAULT = 'drewrest.local';
function dominioMeseroLocal() {
    try {
        const g = globalThis;
        const raw = g.process?.env?.RESTAURANT_EMAIL_DOMAIN?.trim();
        const domain = raw?.replace(/^@/, '') || DOMINIO_MESERO_DEFAULT;
        return `@${domain}`;
    }
    catch {
        return `@${DOMINIO_MESERO_DEFAULT}`;
    }
}
/** Primera palabra del nombre → usuario local (sin acentos, minúsculas). */
function usuarioLocalDesdeNombre(nombre) {
    const primera = nombre.trim().split(/\s+/)[0] ?? '';
    const sinAcentos = primera
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .toLowerCase();
    const limpio = sinAcentos.replace(/[^a-z0-9]/g, '');
    return limpio || 'mesero';
}
function emailMeseroDesdeNombre(nombre, sufijo = '') {
    const local = usuarioLocalDesdeNombre(nombre) + sufijo;
    return `${local}${dominioMeseroLocal()}`;
}
exports.DOMINIO_MESERO = dominioMeseroLocal();
