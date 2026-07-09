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
exports.LugaresMesaController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const current_tenant_decorator_1 = require("../tenant/current-tenant.decorator");
const guardar_lugar_mesa_dto_1 = require("./dto/guardar-lugar-mesa.dto");
const lugares_mesa_service_1 = require("./lugares-mesa.service");
let LugaresMesaController = class LugaresMesaController {
    lugares;
    constructor(lugares) {
        this.lugares = lugares;
    }
    listar(todos, tenantId) {
        return this.lugares.listar(todos === '1' || todos === 'true', tenantId);
    }
    crear(dto, tenantId) {
        return this.lugares.crear(dto, tenantId);
    }
    actualizar(id, dto, tenantId) {
        return this.lugares.actualizar(id, dto, tenantId);
    }
    eliminar(id, tenantId) {
        return this.lugares.eliminar(id, tenantId);
    }
};
exports.LugaresMesaController = LugaresMesaController;
__decorate([
    (0, common_1.Get)('admin'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Query)('todos')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], LugaresMesaController.prototype, "listar", null);
__decorate([
    (0, common_1.Post)('admin'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [guardar_lugar_mesa_dto_1.CrearLugarMesaDto, Number]),
    __metadata("design:returntype", void 0)
], LugaresMesaController.prototype, "crear", null);
__decorate([
    (0, common_1.Patch)('admin/:id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, guardar_lugar_mesa_dto_1.ActualizarLugarMesaDto, Number]),
    __metadata("design:returntype", void 0)
], LugaresMesaController.prototype, "actualizar", null);
__decorate([
    (0, common_1.Delete)('admin/:id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], LugaresMesaController.prototype, "eliminar", null);
exports.LugaresMesaController = LugaresMesaController = __decorate([
    (0, common_1.Controller)('lugares-mesa'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [lugares_mesa_service_1.LugaresMesaService])
], LugaresMesaController);
//# sourceMappingURL=lugares-mesa.controller.js.map