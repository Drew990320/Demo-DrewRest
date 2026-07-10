"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertTenantAccessForUser = assertTenantAccessForUser;
const common_1 = require("@nestjs/common");
const roles_1 = require("@drewrest/shared-domain/roles");
async function assertTenantAccessForUser(prisma, user) {
    if (user.rol.nombre === roles_1.ROL_SUPERADMIN)
        return;
    const rest = await prisma.restaurante.findUnique({
        where: { idRestaurante: user.idRestaurante },
        select: { activo: true, accesoHasta: true, nombre: true },
    });
    if (!rest) {
        throw new common_1.UnauthorizedException('Restaurante no encontrado');
    }
    if (!rest.activo) {
        throw new common_1.UnauthorizedException('El acceso a este restaurante está desactivado. Contacta al soporte.');
    }
    if (rest.accesoHasta && rest.accesoHasta.getTime() < Date.now()) {
        throw new common_1.UnauthorizedException('El acceso a este restaurante ha expirado. Contacta al soporte.');
    }
}
//# sourceMappingURL=tenant-access.js.map