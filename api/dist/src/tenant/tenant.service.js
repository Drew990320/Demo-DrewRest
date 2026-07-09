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
exports.TenantService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_constants_1 = require("./tenant.constants");
let TenantService = class TenantService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async ensureDefaultTenant() {
        await this.prisma.restaurante.upsert({
            where: { idRestaurante: tenant_constants_1.DEFAULT_TENANT_ID },
            create: {
                idRestaurante: tenant_constants_1.DEFAULT_TENANT_ID,
                slug: 'principal',
                nombre: 'Restaurante',
            },
            update: {},
        });
    }
    async resolveIdBySlug(slug) {
        const normalized = slug.trim().toLowerCase();
        if (!normalized) {
            throw new common_1.NotFoundException('Restaurante no encontrado');
        }
        const row = await this.prisma.restaurante.findFirst({
            where: { slug: normalized, activo: true },
            select: { idRestaurante: true },
        });
        if (!row) {
            throw new common_1.NotFoundException('Restaurante no encontrado');
        }
        return row.idRestaurante;
    }
};
exports.TenantService = TenantService;
exports.TenantService = TenantService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TenantService);
//# sourceMappingURL=tenant.service.js.map