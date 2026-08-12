"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ticketPreviewEnabled = ticketPreviewEnabled;
exports.ticketPreviewCharWidth = ticketPreviewCharWidth;
exports.ticketPreviewAnchoMm = ticketPreviewAnchoMm;
exports.ticketPreviewCharsForMm = ticketPreviewCharsForMm;
const impresora_papel_ancho_1 = require("../impresoras-pos/impresora-papel-ancho");
const DEFAULT_CHARS = 32;
function ticketPreviewEnabled(config) {
    const flag = config.get('TICKET_PREVIEW_ENABLED');
    if (flag === '1' || flag === 'true' || flag === 'yes')
        return true;
    if (flag === '0' || flag === 'false' || flag === 'no')
        return false;
    const licenseSkip = config.get('LICENSE_SKIP');
    return (licenseSkip === '1' || licenseSkip === 'true' || licenseSkip === 'yes');
}
function ticketPreviewCharWidth(config) {
    const n = Number(config.get('PRINTER_WIDTH') ?? DEFAULT_CHARS);
    return (0, impresora_papel_ancho_1.clampCharsPorLinea)(n, DEFAULT_CHARS);
}
function ticketPreviewAnchoMm(config, override) {
    if (override != null && override !== '') {
        return (0, impresora_papel_ancho_1.normalizarAnchoPapelMm)(override);
    }
    return (0, impresora_papel_ancho_1.papelMmDesdeChars)(ticketPreviewCharWidth(config));
}
function ticketPreviewCharsForMm(mm) {
    return (0, impresora_papel_ancho_1.charsPorLineaParaPapelMm)(mm);
}
//# sourceMappingURL=ticket-preview.util.js.map