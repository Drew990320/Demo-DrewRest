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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestauranteController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const throttler_1 = require("@nestjs/throttler");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const current_tenant_decorator_1 = require("../tenant/current-tenant.decorator");
const tenant_constants_1 = require("../tenant/tenant.constants");
const tenant_service_1 = require("../tenant/tenant.service");
const config_restaurante_service_1 = require("./config-restaurante.service");
const upsert_config_restaurante_dto_1 = require("./dto/upsert-config-restaurante.dto");
let RestauranteController = class RestauranteController {
    config;
    tenant;
    constructor(config, tenant) {
        this.config = config;
        this.tenant = tenant;
    }
    obtenerConfig(tenantId) {
        return this.config.obtener(tenantId);
    }
    actualizarConfig(dto, tenantId) {
        return this.config.actualizar(dto, tenantId);
    }
    async subirLogo(file, tenantId) {
        if (!file?.buffer?.length) {
            throw new common_1.BadRequestException('Adjunta una imagen (campo logo)');
        }
        return this.config.guardarLogo(file.buffer, file.mimetype, file.originalname, tenantId);
    }
    async configPublica(tenantSlug) {
        const tenantId = tenantSlug?.trim()
            ? await this.tenant.resolveIdBySlug(tenantSlug)
            : tenant_constants_1.DEFAULT_TENANT_ID;
        const c = await this.config.obtener(tenantId);
        return {
            nombre: c.nombre_comercial,
            telefono: c.telefono,
            direccion: c.direccion,
            tiene_logo: c.tiene_logo,
            logo_url: c.tiene_logo ? '/sistema/logo' : null,
        };
    }
};
exports.RestauranteController = RestauranteController;
__decorate([
    (0, common_1.Get)('config'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "obtenerConfig", null);
__decorate([
    (0, common_1.Put)('config'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [upsert_config_restaurante_dto_1.UpsertConfigRestauranteDto, Number]),
    __metadata("design:returntype", void 0)
], RestauranteController.prototype, "actualizarConfig", null);
__decorate([
    (0, common_1.Post)('logo'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('logo', {
        limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], RestauranteController.prototype, "subirLogo", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)('config/publica'),
    __param(0, (0, common_1.Query)('tenant')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RestauranteController.prototype, "configPublica", null);
exports.RestauranteController = RestauranteController = __decorate([
    (0, common_1.Controller)('restaurante'),
    __metadata("design:paramtypes", [config_restaurante_service_1.ConfigRestauranteService,
        tenant_service_1.TenantService])
], RestauranteController);
//# sourceMappingURL=restaurante.controller.js.map