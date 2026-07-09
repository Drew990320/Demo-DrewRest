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
exports.MesasController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const current_tenant_decorator_1 = require("../tenant/current-tenant.decorator");
const create_mesa_dto_1 = require("./dto/create-mesa.dto");
const update_mesa_dto_1 = require("./dto/update-mesa.dto");
const mesas_service_1 = require("./mesas.service");
let MesasController = class MesasController {
    mesas;
    constructor(mesas) {
        this.mesas = mesas;
    }
    listar(tenantId) {
        return this.mesas.listarVisiblesHoy(tenantId);
    }
    listarAdmin(tenantId) {
        return this.mesas.listarTodasAdmin(tenantId);
    }
    crear(dto, tenantId) {
        return this.mesas.crearMesa(dto, tenantId);
    }
    actualizar(id, dto, tenantId) {
        return this.mesas.actualizarMesa(id, dto, tenantId);
    }
    eliminar(id, tenantId) {
        return this.mesas.eliminarMesa(id, tenantId);
    }
    mostrador(tenantId) {
        return this.mesas.getMostrador(tenantId);
    }
    paraLlevar(tenantId) {
        return this.mesas.getParaLlevar(tenantId);
    }
    obtener(id, req) {
        return this.mesas.obtenerPorId(id, req.user.idRestaurante);
    }
};
exports.MesasController = MesasController;
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)(),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], MesasController.prototype, "listar", null);
__decorate([
    (0, common_1.Get)('admin'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], MesasController.prototype, "listarAdmin", null);
__decorate([
    (0, common_1.Post)('admin'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_mesa_dto_1.CreateMesaDto, Number]),
    __metadata("design:returntype", void 0)
], MesasController.prototype, "crear", null);
__decorate([
    (0, common_1.Patch)('admin/:id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_mesa_dto_1.UpdateMesaDto, Number]),
    __metadata("design:returntype", void 0)
], MesasController.prototype, "actualizar", null);
__decorate([
    (0, common_1.Delete)('admin/:id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], MesasController.prototype, "eliminar", null);
__decorate([
    (0, common_1.Get)('mostrador'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], MesasController.prototype, "mostrador", null);
__decorate([
    (0, common_1.Get)('para-llevar'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], MesasController.prototype, "paraLlevar", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], MesasController.prototype, "obtener", null);
exports.MesasController = MesasController = __decorate([
    (0, common_1.Controller)('mesas'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [mesas_service_1.MesasService])
], MesasController);
//# sourceMappingURL=mesas.controller.js.map