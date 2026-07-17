"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LICENSE_WARN_WITHIN_DAYS = exports.DREWTECH_HORARIO_ATENCION = exports.DREWTECH_TELEFONO_LABEL = exports.DREWTECH_TELEFONO = void 0;
exports.diasHastaVencimientoLicencia = diasHastaVencimientoLicencia;
exports.debeAvisarLicenciaProxima = debeAvisarLicenciaProxima;
exports.tituloAvisoLicencia = tituloAvisoLicencia;
exports.mensajeAvisoLicenciaDrewTech = mensajeAvisoLicenciaDrewTech;
/** Contacto y horario de soporte DrewTech (POS on-prem). */
exports.DREWTECH_TELEFONO = '3207964367';
exports.DREWTECH_TELEFONO_LABEL = 'Tel: 320 796 4367';
/** Lun–vie: mañana 8–12 y tarde 14–17 (hora Colombia). */
exports.DREWTECH_HORARIO_ATENCION = 'Lunes a viernes: 8:00 a.m. – 12:00 m. y 2:00 p.m. – 5:00 p.m.';
/** Aviso en app/launcher cuando faltan este número de días o menos. */
exports.LICENSE_WARN_WITHIN_DAYS = 3;
/** Días enteros hasta el vencimiento (null = sin fecha / inválida). Negativo = ya venció. */
function diasHastaVencimientoLicencia(expiresAt) {
    if (!expiresAt)
        return null;
    const end = Date.parse(expiresAt);
    if (Number.isNaN(end))
        return null;
    return Math.ceil((end - Date.now()) / 86400000);
}
function debeAvisarLicenciaProxima(expiresAt, withinDays = exports.LICENSE_WARN_WITHIN_DAYS) {
    const d = diasHastaVencimientoLicencia(expiresAt);
    return d != null && d >= 0 && d <= withinDays;
}
function tituloAvisoLicencia(dias) {
    if (dias <= 0)
        return 'Licencia vence hoy';
    if (dias === 1)
        return 'Licencia: queda 1 día';
    return `Licencia: quedan ${dias} días`;
}
function mensajeAvisoLicenciaDrewTech(dias) {
    const venc = dias <= 0
        ? 'Tu licencia DrewRest vence hoy.'
        : dias === 1
            ? 'Tu licencia DrewRest vence mañana.'
            : `Tu licencia DrewRest vence en ${dias} días.`;
    return `${venc} Contacta a DrewTech (${exports.DREWTECH_TELEFONO_LABEL}). Atención: ${exports.DREWTECH_HORARIO_ATENCION}`;
}
