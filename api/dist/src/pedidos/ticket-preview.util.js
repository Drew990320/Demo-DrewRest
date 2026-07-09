"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ticketPreviewEnabled = ticketPreviewEnabled;
exports.ticketPreviewCharWidth = ticketPreviewCharWidth;
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
    return Number.isFinite(n) && n >= 24 && n <= 48 ? n : DEFAULT_CHARS;
}
//# sourceMappingURL=ticket-preview.util.js.map