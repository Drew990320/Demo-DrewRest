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
exports.PermisosController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const current_tenant_decorator_1 = require("../tenant/current-tenant.decorator");
const permisos_dto_1 = require("./dto/permisos.dto");
const permisos_service_1 = require("./permisos.service");
let PermisosController = class PermisosController {
    permisos;
    constructor(permisos) {
        this.permisos = permisos;
    }
    efectivos(req, tenantId) {
        return this.permisos.getEfectivos(req.user.idUsuario, req.user.rol.nombre, tenantId);
    }
    resumen(fecha, tenantId) {
        return this.permisos.resumenAdmin(fecha, tenantId);
    }
    actualizarMesero(dto, tenantId) {
        return this.permisos.actualizarConfig(dto, tenantId);
    }
    actualizarChef(dto, tenantId) {
        return this.permisos.actualizarConfigChef(dto, tenantId);
    }
    delegacionCierre(dto, req) {
        return this.permisos.asignarDelegacionCierre(dto, req.user.idUsuario);
    }
};
exports.PermisosController = PermisosController;
__decorate([
    (0, common_1.Get)('efectivos'),
    (0, roles_decorator_1.Roles)('admin', 'mesero', 'chef'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], PermisosController.prototype, "efectivos", null);
__decorate([
    (0, common_1.Get)('resumen'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Query)('fecha')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], PermisosController.prototype, "resumen", null);
__decorate([
    (0, common_1.Patch)('mesero'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [permisos_dto_1.PatchPermisosMeseroDto, Number]),
    __metadata("design:returntype", void 0)
], PermisosController.prototype, "actualizarMesero", null);
__decorate([
    (0, common_1.Patch)('chef'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [permisos_dto_1.PatchPermisosChefDto, Number]),
    __metadata("design:returntype", void 0)
], PermisosController.prototype, "actualizarChef", null);
__decorate([
    (0, common_1.Put)('delegacion/cierre-anulacion'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [permisos_dto_1.AsignarDelegacionCierreDto, Object]),
    __metadata("design:returntype", void 0)
], PermisosController.prototype, "delegacionCierre", null);
exports.PermisosController = PermisosController = __decorate([
    (0, common_1.Controller)('permisos'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [permisos_service_1.PermisosService])
], PermisosController);
//# sourceMappingURL=permisos.controller.js.map