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
exports.ContabilidadController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const modulo_guard_1 = require("../tenant/modulo.guard");
const modulo_decorator_1 = require("../tenant/modulo.decorator");
const current_tenant_decorator_1 = require("../tenant/current-tenant.decorator");
const contabilidad_service_1 = require("./contabilidad.service");
const contabilidad_dto_1 = require("./dto/contabilidad.dto");
let ContabilidadController = class ContabilidadController {
    contabilidad;
    constructor(contabilidad) {
        this.contabilidad = contabilidad;
    }
    config(tenantId) {
        return this.contabilidad.obtenerConfig(tenantId);
    }
    actualizarConfig(dto, tenantId) {
        return this.contabilidad.actualizarConfig(dto, tenantId);
    }
    cuentas(tenantId) {
        return this.contabilidad.listarCuentas(tenantId);
    }
    categorias(tenantId) {
        return this.contabilidad.listarCategorias(tenantId);
    }
    crearCategoria(dto, tenantId) {
        return this.contabilidad.crearCategoria(dto, tenantId);
    }
    movimientoSimple(dto, tenantId, req) {
        return this.contabilidad.movimientoSimple(dto, req.user.idUsuario, tenantId);
    }
    asientos(tenantId, fecha, limite) {
        return this.contabilidad.listarAsientos(tenantId, {
            fecha,
            limite: limite ? Number(limite) : undefined,
        });
    }
    reversar(id, dto, tenantId, req) {
        return this.contabilidad.reversar(id, req.user.idUsuario, dto.motivo, tenantId);
    }
    resumen(tenantId, fecha) {
        const f = fecha?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
        return this.contabilidad.resumenSimple(f, tenantId);
    }
};
exports.ContabilidadController = ContabilidadController;
__decorate([
    (0, common_1.Get)('config'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ContabilidadController.prototype, "config", null);
__decorate([
    (0, common_1.Put)('config'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [contabilidad_dto_1.UpsertConfigContabilidadDto, Number]),
    __metadata("design:returntype", void 0)
], ContabilidadController.prototype, "actualizarConfig", null);
__decorate([
    (0, common_1.Get)('cuentas'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ContabilidadController.prototype, "cuentas", null);
__decorate([
    (0, common_1.Get)('categorias'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ContabilidadController.prototype, "categorias", null);
__decorate([
    (0, common_1.Post)('categorias'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [contabilidad_dto_1.CrearCategoriaContableDto, Number]),
    __metadata("design:returntype", void 0)
], ContabilidadController.prototype, "crearCategoria", null);
__decorate([
    (0, common_1.Post)('movimientos-simples'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [contabilidad_dto_1.MovimientoSimpleDto, Number, Object]),
    __metadata("design:returntype", void 0)
], ContabilidadController.prototype, "movimientoSimple", null);
__decorate([
    (0, common_1.Get)('asientos'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(1, (0, common_1.Query)('fecha')),
    __param(2, (0, common_1.Query)('limite')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String]),
    __metadata("design:returntype", void 0)
], ContabilidadController.prototype, "asientos", null);
__decorate([
    (0, common_1.Post)('asientos/:id/reversar'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, contabilidad_dto_1.ReversarAsientoDto, Number, Object]),
    __metadata("design:returntype", void 0)
], ContabilidadController.prototype, "reversar", null);
__decorate([
    (0, common_1.Get)('resumen-simple'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(1, (0, common_1.Query)('fecha')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", void 0)
], ContabilidadController.prototype, "resumen", null);
exports.ContabilidadController = ContabilidadController = __decorate([
    (0, common_1.Controller)('contabilidad'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, modulo_guard_1.ModuloGuard),
    (0, modulo_decorator_1.RequireModulo)('contabilidad'),
    __metadata("design:paramtypes", [contabilidad_service_1.ContabilidadService])
], ContabilidadController);
//# sourceMappingURL=contabilidad.controller.js.map