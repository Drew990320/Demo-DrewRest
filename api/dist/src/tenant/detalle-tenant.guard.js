"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DetalleTenantGuard = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_constants_1 = require("./tenant.constants");
let DetalleTenantGuard = class DetalleTenantGuard {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const raw = req.params?.idDetalle;
        if (raw == null || raw === '')
            return true;
        const idDetalle = Number(raw);
        if (!Number.isFinite(idDetalle))
            return true;
        const tenantId = req.user?.idRestaurante ?? tenant_constants_1.DEFAULT_TENANT_ID;
        const det = await this.prisma.detallePedido.findFirst({
            where: { idDetalle, pedido: { idRestaurante: tenantId } },
            select: { idDetalle: true, idPedido: true },
        });
        if (!det) {
            throw new common_1.NotFoundException('Detalle no encontrado');
        }
        req.detalleTenant = det;
        return true;
    }
};
exports.DetalleTenantGuard = DetalleTenantGuard;
exports.DetalleTenantGuard = DetalleTenantGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DetalleTenantGuard);
//# sourceMappingURL=detalle-tenant.guard.js.map