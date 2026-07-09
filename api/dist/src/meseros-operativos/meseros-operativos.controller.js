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
exports.MeserosOperativosController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const current_tenant_decorator_1 = require("../tenant/current-tenant.decorator");
const meseros_operativos_dto_1 = require("./dto/meseros-operativos.dto");
const meseros_operativos_service_1 = require("./meseros-operativos.service");
let MeserosOperativosController = class MeserosOperativosController {
    service;
    constructor(service) {
        this.service = service;
    }
    miDelegacion(req) {
        return this.service.miDelegacionHoy(req.user.idUsuario, req.user.rol.nombre);
    }
    resumen(fecha, tenantId) {
        return this.service.resumen(fecha, tenantId);
    }
    upsertPagoTurno(dto, req, tenantId) {
        return this.service.upsertPagoTurno(dto, req.user.idUsuario, tenantId);
    }
    aplicarSodaTodos(dto, req, tenantId) {
        return this.service.aplicarSodaAlmuerzoTodos(dto, req.user.idUsuario, tenantId);
    }
    aplicarSodaMesero(dto, req, tenantId) {
        return this.service.aplicarSodaAlmuerzoMesero(dto, req.user.idUsuario, tenantId);
    }
    eliminarRegistro(id, tenantId) {
        return this.service.eliminarRegistro(id, tenantId);
    }
    asignarDelegacionCierre(dto, req, tenantId) {
        return this.service.asignarDelegacionCierre(dto, req.user.idUsuario, tenantId);
    }
};
exports.MeserosOperativosController = MeserosOperativosController;
__decorate([
    (0, common_1.Get)('mi-delegacion'),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MeserosOperativosController.prototype, "miDelegacion", null);
__decorate([
    (0, common_1.Get)('resumen'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Query)('fecha')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], MeserosOperativosController.prototype, "resumen", null);
__decorate([
    (0, common_1.Post)('pago-turno'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [meseros_operativos_dto_1.UpsertPagoTurnoMeseroDto, Object, Number]),
    __metadata("design:returntype", void 0)
], MeserosOperativosController.prototype, "upsertPagoTurno", null);
__decorate([
    (0, common_1.Post)('soda-almuerzo/aplicar'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [meseros_operativos_dto_1.AplicarSodaAlmuerzoDto, Object, Number]),
    __metadata("design:returntype", void 0)
], MeserosOperativosController.prototype, "aplicarSodaTodos", null);
__decorate([
    (0, common_1.Post)('soda-almuerzo/mesero'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [meseros_operativos_dto_1.AplicarSodaMeseroDto, Object, Number]),
    __metadata("design:returntype", void 0)
], MeserosOperativosController.prototype, "aplicarSodaMesero", null);
__decorate([
    (0, common_1.Delete)('registros/:id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], MeserosOperativosController.prototype, "eliminarRegistro", null);
__decorate([
    (0, common_1.Put)('delegacion/cierre-anulacion'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [meseros_operativos_dto_1.AsignarDelegacionCierreDto, Object, Number]),
    __metadata("design:returntype", void 0)
], MeserosOperativosController.prototype, "asignarDelegacionCierre", null);
exports.MeserosOperativosController = MeserosOperativosController = __decorate([
    (0, common_1.Controller)('meseros-operativos'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [meseros_operativos_service_1.MeserosOperativosService])
], MeserosOperativosController);
//# sourceMappingURL=meseros-operativos.controller.js.map