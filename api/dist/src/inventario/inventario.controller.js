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
const inventario_deduccion_service_1 = require("./inventario-deduccion.service");
const inventario_receta_service_1 = require("./inventario-receta.service");
const inventario_service_1 = require("./inventario.service");
const producto_inventario_vinculo_service_1 = require("./producto-inventario-vinculo.service");
const actualizar_inventario_dto_1 = require("./dto/actualizar-inventario.dto");
const crear_conversion_unidad_dto_1 = require("./dto/crear-conversion-unidad.dto");
const crear_inventario_dto_1 = require("./dto/crear-inventario.dto");
const movimiento_inventario_dto_1 = require("./dto/movimiento-inventario.dto");
const upsert_config_inventario_dto_1 = require("./dto/upsert-config-inventario.dto");
const receta_linea_dto_1 = require("./dto/receta-linea.dto");
let InventarioController = class InventarioController {
    inventario;
    recetas;
    deduccion;
    vinculosMenuSvc;
    constructor(inventario, recetas, deduccion, vinculosMenuSvc) {
        this.inventario = inventario;
        this.recetas = recetas;
        this.deduccion = deduccion;
        this.vinculosMenuSvc = vinculosMenuSvc;
    }
    vinculosMenu(tenantId) {
        return this.vinculosMenuSvc.mapaVinculosMenu(tenantId);
    }
    obtenerConfig(tenantId) {
        return this.deduccion.obtenerConfig(tenantId);
    }
    guardarConfig(dto, tenantId) {
        return this.deduccion.upsertConfig(dto, tenantId);
    }
    listarConversiones(tenantId) {
        return this.deduccion.listarConversiones(tenantId);
    }
    crearConversion(dto, tenantId) {
        return this.deduccion.crearConversion(dto, tenantId);
    }
    eliminarConversion(id, tenantId) {
        return this.deduccion.eliminarConversion(id, tenantId);
    }
    listarRecetas(tenantId) {
        return this.recetas.listar(tenantId);
    }
    recetaPorProducto(idProducto, tenantId) {
        return this.recetas.obtenerPorProducto(idProducto, tenantId);
    }
    guardarReceta(dto, tenantId) {
        return this.recetas.upsert(dto, tenantId);
    }
    eliminarReceta(id, tenantId) {
        return this.recetas.eliminar(id, tenantId);
    }
    vincularProducto(idProducto, tenantId) {
        return this.inventario.vincularProductoComercial(idProducto, tenantId);
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
    (0, common_1.Get)('vinculos-menu'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], InventarioController.prototype, "vinculosMenu", null);
__decorate([
    (0, common_1.Get)('config'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], InventarioController.prototype, "obtenerConfig", null);
__decorate([
    (0, common_1.Put)('config'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [upsert_config_inventario_dto_1.UpsertConfigInventarioDto, Number]),
    __metadata("design:returntype", void 0)
], InventarioController.prototype, "guardarConfig", null);
__decorate([
    (0, common_1.Get)('conversiones'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], InventarioController.prototype, "listarConversiones", null);
__decorate([
    (0, common_1.Post)('conversiones'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [crear_conversion_unidad_dto_1.CrearConversionUnidadDto, Number]),
    __metadata("design:returntype", void 0)
], InventarioController.prototype, "crearConversion", null);
__decorate([
    (0, common_1.Delete)('conversiones/:id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], InventarioController.prototype, "eliminarConversion", null);
__decorate([
    (0, common_1.Get)('recetas'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], InventarioController.prototype, "listarRecetas", null);
__decorate([
    (0, common_1.Get)('recetas/producto/:idProducto'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('idProducto', common_1.ParseIntPipe)),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], InventarioController.prototype, "recetaPorProducto", null);
__decorate([
    (0, common_1.Put)('recetas'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [receta_linea_dto_1.UpsertRecetaDto, Number]),
    __metadata("design:returntype", void 0)
], InventarioController.prototype, "guardarReceta", null);
__decorate([
    (0, common_1.Delete)('recetas/:id'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], InventarioController.prototype, "eliminarReceta", null);
__decorate([
    (0, common_1.Post)('vincular-producto/:idProducto'),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('idProducto', common_1.ParseIntPipe)),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], InventarioController.prototype, "vincularProducto", null);
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
    __metadata("design:paramtypes", [inventario_service_1.InventarioService,
        inventario_receta_service_1.InventarioRecetaService,
        inventario_deduccion_service_1.InventarioDeduccionService,
        producto_inventario_vinculo_service_1.ProductoInventarioVinculoService])
], InventarioController);
//# sourceMappingURL=inventario.controller.js.map