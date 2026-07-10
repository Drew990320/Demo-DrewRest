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
exports.VisualController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const throttler_1 = require("@nestjs/throttler");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const current_tenant_decorator_1 = require("../tenant/current-tenant.decorator");
const pedidos_gateway_1 = require("../pedidos/pedidos.gateway");
const config_visual_service_1 = require("./config-visual.service");
const upsert_config_visual_dto_1 = require("./dto/upsert-config-visual.dto");
const visual_assets_util_1 = require("./visual-assets.util");
const asset_file_cache_1 = require("./asset-file-cache");
const ASSET_TIPOS = new Set([
    'login',
    'factura',
    'ticket',
    'favicon',
    'navbar-fondo',
]);
function parseAssetTipo(raw) {
    const t = raw;
    if (!ASSET_TIPOS.has(t)) {
        throw new common_1.BadRequestException('Tipo de asset no válido');
    }
    return t;
}
let VisualController = class VisualController {
    visual;
    gateway;
    constructor(visual, gateway) {
        this.visual = visual;
        this.gateway = gateway;
    }
    obtenerConfig(tenantId) {
        return this.visual.obtener(tenantId);
    }
    async actualizarConfig(dto, tenantId) {
        const res = await this.visual.actualizar(dto, tenantId);
        this.gateway.emitConfigActualizada('visual');
        return res;
    }
    async restablecerConfig(tenantId) {
        const res = await this.visual.restablecer(tenantId);
        this.gateway.emitConfigActualizada('visual');
        this.gateway.emitConfigActualizada('categorias');
        return res;
    }
    async obtenerPublica(res, ifNoneMatch) {
        const data = await this.visual.obtenerPublica();
        const etag = `"${data.actualizado_en}"`;
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('ETag', etag);
        if (ifNoneMatch && ifNoneMatch === etag) {
            res.status(common_1.HttpStatus.NOT_MODIFIED);
            return;
        }
        return data;
    }
    async asset(tipoRaw, res) {
        await this.visual.obtenerRow();
        const tipo = parseAssetTipo(tipoRaw);
        const path = this.visual.resolveAssetPath(tipo);
        if (!path) {
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            res.status(404).json({ message: 'Asset no configurado' });
            return;
        }
        res.setHeader('Content-Type', (0, visual_assets_util_1.mimeFromAssetPath)(path));
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cache-Control', 'private, no-cache, must-revalidate');
        res.setHeader('ETag', (0, asset_file_cache_1.assetEtagFromPath)(path));
        res.send((0, asset_file_cache_1.readAssetFileCached)(path));
    }
    async subirAsset(tipoRaw, file, tenantId) {
        const tipo = parseAssetTipo(tipoRaw);
        if (!file?.buffer?.length) {
            throw new common_1.BadRequestException('Adjunta una imagen (campo file)');
        }
        const saved = await this.visual.guardarAsset(tipo, file.buffer, file.mimetype, file.originalname, tenantId);
        this.gateway.emitConfigActualizada('visual');
        const pub = await this.visual.obtener(tenantId);
        return {
            ...saved,
            config: pub,
        };
    }
};
exports.VisualController = VisualController;
__decorate([
    (0, common_1.Get)('config'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], VisualController.prototype, "obtenerConfig", null);
__decorate([
    (0, common_1.Put)('config'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [upsert_config_visual_dto_1.UpsertConfigVisualDto, Number]),
    __metadata("design:returntype", Promise)
], VisualController.prototype, "actualizarConfig", null);
__decorate([
    (0, common_1.Post)('config/restablecer'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], VisualController.prototype, "restablecerConfig", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)('publica'),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __param(1, (0, common_1.Headers)('if-none-match')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VisualController.prototype, "obtenerPublica", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)('asset/:tipo'),
    __param(0, (0, common_1.Param)('tipo')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], VisualController.prototype, "asset", null);
__decorate([
    (0, common_1.Post)('asset/:tipo'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    })),
    __param(0, (0, common_1.Param)('tipo')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Number]),
    __metadata("design:returntype", Promise)
], VisualController.prototype, "subirAsset", null);
exports.VisualController = VisualController = __decorate([
    (0, common_1.Controller)('visual'),
    __metadata("design:paramtypes", [config_visual_service_1.ConfigVisualService,
        pedidos_gateway_1.PedidosGateway])
], VisualController);
//# sourceMappingURL=visual.controller.js.map