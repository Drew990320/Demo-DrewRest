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
exports.InventarioController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const modulo_guard_1 = require("../tenant/modulo.guard");
const modulo_decorator_1 = require("../tenant/modulo.decorator");
const current_tenant_decorator_1 = require("../tenant/current-tenant.decorator");
const inventario_service_1 = require("./inventario.service");
const actualizar_inventario_dto_1 = require("./dto/actualizar-inventario.dto");
const crear_inventario_dto_1 = require("./dto/crear-inventario.dto");
const movimiento_inventario_dto_1 = require("./dto/movimiento-inventario.dto");
let InventarioController = class InventarioController {
    inventario;
    constructor(inventario) {
        this.inventario = inventario;
    }
    listar(bajoMinimo, tenantId) {
        const solo = bajoMinimo === '1' || bajoMinimo === 'true' || bajoMinimo === 'si';
        return this.inventario.listar(solo, tenantId);
    }
    crear(dto, tenantId) {
        return this.inventario.crear(dto, tenantId);
    }
    actualizar(id, dto, tenantId) {
        return this.inventario.actualizar(id, dto, tenantId);
    }
    movimiento(id, dto, tenantId) {
        return this.inventario.registrarMovimiento(id, dto, tenantId);
    }
};
exports.InventarioController = InventarioController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Query)('bajo_minimo')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], InventarioController.prototype, "listar", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [crear_inventario_dto_1.CrearInventarioDto, Number]),
    __metadata("design:returntype", void 0)
], InventarioController.prototype, "crear", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, actualizar_inventario_dto_1.ActualizarInventarioDto, Number]),
    __metadata("design:returntype", void 0)
], InventarioController.prototype, "actualizar", null);
__decorate([
    (0, common_1.Post)(':id/movimiento'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, movimiento_inventario_dto_1.MovimientoInventarioDto, Number]),
    __metadata("design:returntype", void 0)
], InventarioController.prototype, "movimiento", null);
exports.InventarioController = InventarioController = __decorate([
    (0, common_1.Controller)('inventario'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, modulo_guard_1.ModuloGuard),
    (0, modulo_decorator_1.RequireModulo)('inventario'),
    __metadata("design:paramtypes", [inventario_service_1.InventarioService])
], InventarioController);
//# sourceMappingURL=inventario.controller.js.map