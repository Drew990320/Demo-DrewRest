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
exports.ProveedoresController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const current_tenant_decorator_1 = require("../tenant/current-tenant.decorator");
const modulo_guard_1 = require("../tenant/modulo.guard");
const modulo_decorator_1 = require("../tenant/modulo.decorator");
const crear_proveedor_dto_1 = require("./dto/crear-proveedor.dto");
const proveedores_service_1 = require("./proveedores.service");
let ProveedoresController = class ProveedoresController {
    proveedores;
    constructor(proveedores) {
        this.proveedores = proveedores;
    }
    listar(todos, tenantId) {
        return this.proveedores.listar(todos !== '1' && todos !== 'true', tenantId);
    }
    crear(dto, tenantId) {
        return this.proveedores.crear(dto, tenantId);
    }
    actualizar(id, dto, tenantId) {
        return this.proveedores.actualizar(id, dto, tenantId);
    }
};
exports.ProveedoresController = ProveedoresController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Query)('todos')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], ProveedoresController.prototype, "listar", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [crear_proveedor_dto_1.CrearProveedorDto, Number]),
    __metadata("design:returntype", void 0)
], ProveedoresController.prototype, "crear", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, crear_proveedor_dto_1.ActualizarProveedorDto, Number]),
    __metadata("design:returntype", void 0)
], ProveedoresController.prototype, "actualizar", null);
exports.ProveedoresController = ProveedoresController = __decorate([
    (0, common_1.Controller)('proveedores'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, modulo_guard_1.ModuloGuard),
    (0, modulo_decorator_1.RequireModulo)('contabilidad'),
    __metadata("design:paramtypes", [proveedores_service_1.ProveedoresService])
], ProveedoresController);
//# sourceMappingURL=proveedores.controller.js.map