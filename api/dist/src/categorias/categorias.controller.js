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
exports.CategoriasController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const current_tenant_decorator_1 = require("../tenant/current-tenant.decorator");
const categorias_service_1 = require("./categorias.service");
const create_categoria_dto_1 = require("./dto/create-categoria.dto");
const import_categoria_plantilla_dto_1 = require("./dto/import-categoria-plantilla.dto");
const update_categoria_dto_1 = require("./dto/update-categoria.dto");
let CategoriasController = class CategoriasController {
    categorias;
    constructor(categorias) {
        this.categorias = categorias;
    }
    listarAdmin(tenantId) {
        return this.categorias.listarTodasAdmin(tenantId);
    }
    exportarPlantilla(tenantId) {
        return this.categorias.exportarPlantilla(tenantId);
    }
    importarPlantilla(dto, tenantId) {
        return this.categorias.importarPlantilla(tenantId, dto);
    }
    crear(dto, tenantId) {
        return this.categorias.crear(dto, tenantId);
    }
    actualizar(id, dto, tenantId) {
        return this.categorias.actualizar(id, dto, tenantId);
    }
    eliminar(id, tenantId) {
        return this.categorias.eliminar(id, tenantId);
    }
};
exports.CategoriasController = CategoriasController;
__decorate([
    (0, common_1.Get)('admin'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CategoriasController.prototype, "listarAdmin", null);
__decorate([
    (0, common_1.Get)('admin/plantilla/export'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CategoriasController.prototype, "exportarPlantilla", null);
__decorate([
    (0, common_1.Post)('admin/plantilla/import'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [import_categoria_plantilla_dto_1.ImportCategoriaPlantillaDto, Number]),
    __metadata("design:returntype", void 0)
], CategoriasController.prototype, "importarPlantilla", null);
__decorate([
    (0, common_1.Post)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_categoria_dto_1.CreateCategoriaDto, Number]),
    __metadata("design:returntype", void 0)
], CategoriasController.prototype, "crear", null);
__decorate([
    (0, common_1.Patch)('admin/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_categoria_dto_1.UpdateCategoriaDto, Number]),
    __metadata("design:returntype", void 0)
], CategoriasController.prototype, "actualizar", null);
__decorate([
    (0, common_1.Delete)('admin/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], CategoriasController.prototype, "eliminar", null);
exports.CategoriasController = CategoriasController = __decorate([
    (0, common_1.Controller)('categorias'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:paramtypes", [categorias_service_1.CategoriasService])
], CategoriasController);
//# sourceMappingURL=categorias.controller.js.map