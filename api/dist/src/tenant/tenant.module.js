"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../prisma/prisma.module");
const restaurante_module_1 = require("../restaurante/restaurante.module");
const detalle_tenant_guard_1 = require("./detalle-tenant.guard");
const modulo_guard_1 = require("./modulo.guard");
const pedido_tenant_guard_1 = require("./pedido-tenant.guard");
const tenant_service_1 = require("./tenant.service");
let TenantModule = class TenantModule {
};
exports.TenantModule = TenantModule;
exports.TenantModule = TenantModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [restaurante_module_1.RestauranteModule, prisma_module_1.PrismaModule],
        providers: [
            tenant_service_1.TenantService,
            modulo_guard_1.ModuloGuard,
            pedido_tenant_guard_1.PedidoTenantGuard,
            detalle_tenant_guard_1.DetalleTenantGuard,
        ],
        exports: [
            restaurante_module_1.RestauranteModule,
            tenant_service_1.TenantService,
            modulo_guard_1.ModuloGuard,
            pedido_tenant_guard_1.PedidoTenantGuard,
            detalle_tenant_guard_1.DetalleTenantGuard,
        ],
    })
], TenantModule);
//# sourceMappingURL=tenant.module.js.map