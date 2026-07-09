"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.labelMetodoPago = labelMetodoPago;
function labelMetodoPago(mp) {
    if (!mp)
        return 'Pendiente de pago';
    if (mp === 'efectivo')
        return 'Efectivo';
    if (mp === 'transferencia')
        return 'Transferencia';
    if (mp === 'tarjeta')
        return 'Tarjeta';
    if (mp === 'fiado')
        return 'Fiado / crédito';
    if (mp === 'mixto')
        return 'Pago mixto';
    return mp;
}
//# sourceMappingURL=factura-ticket.js.map