"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertMesaDelTenant = assertMesaDelTenant;
exports.assertPedidoDelTenant = assertPedidoDelTenant;
const common_1 = require("@nestjs/common");
const tenant_constants_1 = require("./tenant.constants");
async function assertMesaDelTenant(prisma, idMesa, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
    const mesa = await prisma.mesa.findFirst({
        where: { idMesa, idRestaurante: tenantId },
    });
    if (!mesa) {
        throw new common_1.NotFoundException('Mesa no encontrada');
    }
    return mesa;
}
async function assertPedidoDelTenant(prisma, idPedido, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
    const pedido = await prisma.pedido.findFirst({
        where: { idPedido, idRestaurante: tenantId },
        select: {
            idPedido: true,
            idMesa: true,
            idUsuario: true,
            idRestaurante: true,
            estado: true,
        },
    });
    if (!pedido) {
        throw new common_1.NotFoundException('Pedido no encontrado');
    }
    return pedido;
}
//# sourceMappingURL=tenant-scope.js.map