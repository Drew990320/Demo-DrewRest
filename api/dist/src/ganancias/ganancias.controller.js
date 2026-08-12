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
exports.GananciasController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const current_tenant_decorator_1 = require("../tenant/current-tenant.decorator");
const modulo_decorator_1 = require("../tenant/modulo.decorator");
const modulo_guard_1 = require("../tenant/modulo.guard");
const ganancias_dto_1 = require("./dto/ganancias.dto");
const ganancias_service_1 = require("./ganancias.service");
let GananciasController = class GananciasController {
    ganancias;
    constructor(ganancias) {
        this.ganancias = ganancias;
    }
    listarCostos(tenantId) {
        return this.ganancias.listarProductosCostos(tenantId);
    }
    patchCosto(id, dto, tenantId) {
        return this.ganancias.actualizarProductoCosto(id, dto, tenantId);
    }
    listarFijos(tenantId) {
        return this.ganancias.listarGastosFijos(tenantId);
    }
    crearFijo(dto, tenantId) {
        return this.ganancias.crearGastoFijo(dto, tenantId);
    }
    patchFijo(id, dto, tenantId) {
        return this.ganancias.actualizarGastoFijo(id, dto, tenantId);
    }
    deleteFijo(id, tenantId) {
        return this.ganancias.eliminarGastoFijo(id, tenantId);
    }
    listarCuotasDia(fecha, tenantId) {
        return this.ganancias.listarCuotasDia(fecha, tenantId);
    }
    asegurarAutomaticas(dto, tenantId, req) {
        return this.ganancias.asegurarCuotasAutomaticas(dto.fecha, tenantId, req.user.idUsuario);
    }
    aplicarCuota(dto, tenantId, req) {
        return this.ganancias.aplicarCuotaDia(dto.id_gasto_fijo, dto.fecha, tenantId, req.user.idUsuario);
    }
    omitirCuota(dto, tenantId, req) {
        return this.ganancias.omitirCuotaDia(dto.id_gasto_fijo, dto.fecha, tenantId, req.user.idUsuario);
    }
    registrarPagoFondo(dto, tenantId) {
        return this.ganancias.registrarPagoFondo(dto, tenantId);
    }
    deletePagoFondo(id, tenantId) {
        return this.ganancias.eliminarPagoFondo(id, tenantId);
    }
    listarExtras(fecha_desde, fecha_hasta, tenantId) {
        return this.ganancias.listarGastosExtras({ fecha_desde, fecha_hasta }, tenantId);
    }
    crearExtra(dto, tenantId) {
        return this.ganancias.crearGastoExtra(dto, tenantId);
    }
    patchExtra(id, dto, tenantId) {
        return this.ganancias.actualizarGastoExtra(id, dto, tenantId);
    }
    deleteExtra(id, tenantId) {
        return this.ganancias.eliminarGastoExtra(id, tenantId);
    }
    reporte(periodo, fecha, fecha_desde, fecha_hasta, tenantId) {
        return this.ganancias.reporte({ periodo, fecha, fecha_desde, fecha_hasta }, tenantId);
    }
    async reportePdf(periodo, fecha, fecha_desde, fecha_hasta, tenantId, res) {
        const pdf = await this.ganancias.reportePdf({ periodo, fecha, fecha_desde, fecha_hasta }, tenantId);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="ganancias.pdf"');
        res.setHeader('Content-Length', String(pdf.length));
        res.send(pdf);
    }
};
exports.GananciasController = GananciasController;
__decorate([
    (0, common_1.Get)('productos-costos'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], GananciasController.prototype, "listarCostos", null);
__decorate([
    (0, common_1.Patch)('productos/:id/costo'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, ganancias_dto_1.PatchProductoCostoDto, Number]),
    __metadata("design:returntype", void 0)
], GananciasController.prototype, "patchCosto", null);
__decorate([
    (0, common_1.Get)('gastos-fijos'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], GananciasController.prototype, "listarFijos", null);
__decorate([
    (0, common_1.Post)('gastos-fijos'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ganancias_dto_1.UpsertGastoFijoDto, Number]),
    __metadata("design:returntype", void 0)
], GananciasController.prototype, "crearFijo", null);
__decorate([
    (0, common_1.Patch)('gastos-fijos/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, ganancias_dto_1.PatchGastoFijoDto, Number]),
    __metadata("design:returntype", void 0)
], GananciasController.prototype, "patchFijo", null);
__decorate([
    (0, common_1.Delete)('gastos-fijos/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], GananciasController.prototype, "deleteFijo", null);
__decorate([
    (0, common_1.Get)('cuotas-dia'),
    __param(0, (0, common_1.Query)('fecha')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], GananciasController.prototype, "listarCuotasDia", null);
__decorate([
    (0, common_1.Post)('cuotas-dia/asegurar-automaticas'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ganancias_dto_1.CuotaDiaFechaDto, Number, Object]),
    __metadata("design:returntype", void 0)
], GananciasController.prototype, "asegurarAutomaticas", null);
__decorate([
    (0, common_1.Post)('cuotas-dia/aplicar'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ganancias_dto_1.CuotaDiaGastoDto, Number, Object]),
    __metadata("design:returntype", void 0)
], GananciasController.prototype, "aplicarCuota", null);
__decorate([
    (0, common_1.Post)('cuotas-dia/omitir'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ganancias_dto_1.CuotaDiaGastoDto, Number, Object]),
    __metadata("design:returntype", void 0)
], GananciasController.prototype, "omitirCuota", null);
__decorate([
    (0, common_1.Post)('pagos-fondo'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ganancias_dto_1.RegistrarPagoFondoDto, Number]),
    __metadata("design:returntype", void 0)
], GananciasController.prototype, "registrarPagoFondo", null);
__decorate([
    (0, common_1.Delete)('pagos-fondo/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], GananciasController.prototype, "deletePagoFondo", null);
__decorate([
    (0, common_1.Get)('gastos-extras'),
    __param(0, (0, common_1.Query)('fecha_desde')),
    __param(1, (0, common_1.Query)('fecha_hasta')),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Number]),
    __metadata("design:returntype", void 0)
], GananciasController.prototype, "listarExtras", null);
__decorate([
    (0, common_1.Post)('gastos-extras'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ganancias_dto_1.UpsertGastoExtraDto, Number]),
    __metadata("design:returntype", void 0)
], GananciasController.prototype, "crearExtra", null);
__decorate([
    (0, common_1.Patch)('gastos-extras/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, ganancias_dto_1.PatchGastoExtraDto, Number]),
    __metadata("design:returntype", void 0)
], GananciasController.prototype, "patchExtra", null);
__decorate([
    (0, common_1.Delete)('gastos-extras/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], GananciasController.prototype, "deleteExtra", null);
__decorate([
    (0, common_1.Get)('reporte'),
    __param(0, (0, common_1.Query)('periodo')),
    __param(1, (0, common_1.Query)('fecha')),
    __param(2, (0, common_1.Query)('fecha_desde')),
    __param(3, (0, common_1.Query)('fecha_hasta')),
    __param(4, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Number]),
    __metadata("design:returntype", void 0)
], GananciasController.prototype, "reporte", null);
__decorate([
    (0, common_1.Get)('reporte.pdf'),
    __param(0, (0, common_1.Query)('periodo')),
    __param(1, (0, common_1.Query)('fecha')),
    __param(2, (0, common_1.Query)('fecha_desde')),
    __param(3, (0, common_1.Query)('fecha_hasta')),
    __param(4, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(5, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Number, Object]),
    __metadata("design:returntype", Promise)
], GananciasController.prototype, "reportePdf", null);
exports.GananciasController = GananciasController = __decorate([
    (0, common_1.Controller)('ganancias'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, modulo_guard_1.ModuloGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, modulo_decorator_1.RequireModulo)('ganancias'),
    __metadata("design:paramtypes", [ganancias_service_1.GananciasService])
], GananciasController);
//# sourceMappingURL=ganancias.controller.js.map