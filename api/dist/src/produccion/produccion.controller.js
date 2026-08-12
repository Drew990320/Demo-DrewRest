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
exports.ProduccionController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const current_tenant_decorator_1 = require("../tenant/current-tenant.decorator");
const produccion_service_1 = require("./produccion.service");
const produccion_porciones_dto_1 = require("./dto/produccion-porciones.dto");
let ProduccionController = class ProduccionController {
    produccion;
    constructor(produccion) {
        this.produccion = produccion;
    }
    listar(query, tenantId) {
        return this.produccion.resumenDia(query.fecha, tenantId);
    }
    registrar(dto, tenantId, req) {
        const idUsuario = req.user?.id ?? req.user?.sub;
        return this.produccion.registrar(dto, tenantId, typeof idUsuario === 'number' ? idUsuario : undefined);
    }
};
exports.ProduccionController = ProduccionController;
__decorate([
    (0, common_1.Get)('porciones'),
    (0, roles_decorator_1.Roles)('admin', 'superadmin'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [produccion_porciones_dto_1.ListarProduccionPorcionesQueryDto, Number]),
    __metadata("design:returntype", void 0)
], ProduccionController.prototype, "listar", null);
__decorate([
    (0, common_1.Post)('porciones'),
    (0, roles_decorator_1.Roles)('admin', 'superadmin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [produccion_porciones_dto_1.RegistrarProduccionPorcionesDto, Number, Object]),
    __metadata("design:returntype", void 0)
], ProduccionController.prototype, "registrar", null);
exports.ProduccionController = ProduccionController = __decorate([
    (0, common_1.Controller)('produccion'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [produccion_service_1.ProduccionService])
], ProduccionController);
//# sourceMappingURL=produccion.controller.js.map