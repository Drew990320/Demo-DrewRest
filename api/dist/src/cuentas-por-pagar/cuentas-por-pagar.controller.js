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
exports.CuentasPorPagarController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const current_tenant_decorator_1 = require("../tenant/current-tenant.decorator");
const modulo_guard_1 = require("../tenant/modulo.guard");
const modulo_decorator_1 = require("../tenant/modulo.decorator");
const cuentas_por_pagar_service_1 = require("./cuentas-por-pagar.service");
const crear_cuenta_por_pagar_dto_1 = require("./dto/crear-cuenta-por-pagar.dto");
let CuentasPorPagarController = class CuentasPorPagarController {
    cuentas;
    constructor(cuentas) {
        this.cuentas = cuentas;
    }
    listar(todos, tenantId) {
        return this.cuentas.listar(todos !== '1' && todos !== 'true', tenantId);
    }
    crear(dto, req, tenantId) {
        return this.cuentas.crear(dto, req.user.id, tenantId);
    }
    pago(id, dto, req, tenantId) {
        return this.cuentas.registrarPago(id, dto, req.user.id, tenantId);
    }
};
exports.CuentasPorPagarController = CuentasPorPagarController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Query)('todos')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], CuentasPorPagarController.prototype, "listar", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [crear_cuenta_por_pagar_dto_1.CrearCuentaPorPagarDto, Object, Number]),
    __metadata("design:returntype", void 0)
], CuentasPorPagarController.prototype, "crear", null);
__decorate([
    (0, common_1.Patch)(':id/pago'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, crear_cuenta_por_pagar_dto_1.PagoCuentaPorPagarDto, Object, Number]),
    __metadata("design:returntype", void 0)
], CuentasPorPagarController.prototype, "pago", null);
exports.CuentasPorPagarController = CuentasPorPagarController = __decorate([
    (0, common_1.Controller)('cuentas-por-pagar'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, modulo_guard_1.ModuloGuard),
    (0, modulo_decorator_1.RequireModulo)('contabilidad'),
    __metadata("design:paramtypes", [cuentas_por_pagar_service_1.CuentasPorPagarService])
], CuentasPorPagarController);
//# sourceMappingURL=cuentas-por-pagar.controller.js.map