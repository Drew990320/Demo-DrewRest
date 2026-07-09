"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRANSICIONES_ESTADO_PERMITIDAS = void 0;
exports.validarTransicionEstadoPedido = validarTransicionEstadoPedido;
const common_1 = require("@nestjs/common");
exports.TRANSICIONES_ESTADO_PERMITIDAS = {
    abierto: ['en_cocina'],
    en_cocina: ['abierto'],
    facturado: [],
};
function validarTransicionEstadoPedido(actual, nuevo) {
    if (actual === nuevo)
        return;
    if (actual === 'facturado') {
        throw new common_1.ConflictException('Pedido ya cerrado');
    }
    if (nuevo === 'facturado') {
        throw new common_1.BadRequestException('Para cerrar el pedido use facturar, no cambiar estado');
    }
    const permitidas = exports.TRANSICIONES_ESTADO_PERMITIDAS[actual] ?? [];
    if (!permitidas.includes(nuevo)) {
        throw new common_1.BadRequestException(`No se puede cambiar el pedido de "${actual}" a "${nuevo}"`);
    }
}
//# sourceMappingURL=estado-pedido-transiciones.js.map