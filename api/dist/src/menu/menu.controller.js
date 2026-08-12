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
exports.MenuController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const current_tenant_decorator_1 = require("../tenant/current-tenant.decorator");
const menu_service_1 = require("./menu.service");
const menu_admin_service_1 = require("./menu-admin.service");
const create_menu_dto_1 = require("./dto/create-menu.dto");
const update_menu_dto_1 = require("./dto/update-menu.dto");
const upsert_menu_producto_dto_1 = require("./dto/upsert-menu-producto.dto");
const asignar_productos_menus_dto_1 = require("./dto/asignar-productos-menus.dto");
const set_menu_activo_dto_1 = require("./dto/set-menu-activo.dto");
const clonar_menu_dto_1 = require("./dto/clonar-menu.dto");
const menu_precios_foto_service_1 = require("./menu-precios-foto.service");
let MenuController = class MenuController {
    menu;
    menuAdmin;
    preciosFoto;
    constructor(menu, menuAdmin, preciosFoto) {
        this.menu = menu;
        this.menuAdmin = menuAdmin;
        this.preciosFoto = preciosFoto;
    }
    today(tenantId) {
        return this.menu.menuHoy(tenantId);
    }
    opciones(tenantId) {
        return this.menuAdmin.listarOpciones(tenantId);
    }
    setActivo(dto, tenantId) {
        return this.menuAdmin.setOverride(dto, tenantId);
    }
    listarAdmin(tenantId) {
        return this.menuAdmin.listar(tenantId);
    }
    crear(dto, tenantId) {
        return this.menuAdmin.crear(dto, tenantId);
    }
    preciosDesdeFoto(file, idMenuRaw, tenantId, req, res) {
        req.setTimeout(70_000);
        res.setTimeout(70_000);
        const idMenu = idMenuRaw == null || idMenuRaw === '' ? undefined : Number(idMenuRaw);
        if (idMenu != null && (!Number.isInteger(idMenu) || idMenu <= 0)) {
            throw new common_1.BadRequestException('id_menu inválido');
        }
        return this.preciosFoto.analizar(file, idMenu, tenantId);
    }
    asignarProductos(dto, tenantId) {
        return this.menuAdmin.asignarProductos(dto, tenantId);
    }
    actualizar(id, dto, tenantId) {
        return this.menuAdmin.actualizar(id, dto, tenantId);
    }
    eliminar(id, tenantId) {
        return this.menuAdmin.eliminar(id, tenantId);
    }
    clonar(id, dto, tenantId) {
        return this.menuAdmin.clonar(id, dto, tenantId);
    }
    listarProductos(id, tenantId) {
        return this.menuAdmin.listarProductos(id, tenantId);
    }
    upsertProducto(id, dto, tenantId) {
        return this.menuAdmin.upsertProducto(id, dto, tenantId);
    }
    quitarProducto(id, idProducto, tenantId) {
        return this.menuAdmin.quitarProducto(id, idProducto, tenantId);
    }
    subirImagenProducto(id, file, tenantId) {
        if (!file?.buffer?.length) {
            throw new common_1.BadRequestException('Adjunta una imagen (campo imagen)');
        }
        return this.menu.guardarImagenProducto(id, file.buffer, file.mimetype, file.originalname, tenantId);
    }
    eliminarImagenProducto(id, tenantId) {
        return this.menu.eliminarImagenProducto(id, tenantId);
    }
};
exports.MenuController = MenuController;
__decorate([
    (0, common_1.Get)('today'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], MenuController.prototype, "today", null);
__decorate([
    (0, common_1.Get)('opciones'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], MenuController.prototype, "opciones", null);
__decorate([
    (0, common_1.Put)('activo'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'superadmin', 'mesero'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [set_menu_activo_dto_1.SetMenuActivoDto, Number]),
    __metadata("design:returntype", void 0)
], MenuController.prototype, "setActivo", null);
__decorate([
    (0, common_1.Get)('admin'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'superadmin'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], MenuController.prototype, "listarAdmin", null);
__decorate([
    (0, common_1.Post)('admin'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'superadmin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_menu_dto_1.CreateMenuDto, Number]),
    __metadata("design:returntype", void 0)
], MenuController.prototype, "crear", null);
__decorate([
    (0, common_1.Post)('admin/precios-desde-foto'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'superadmin'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 8 * 1024 * 1024, files: 1 },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Query)('id_menu')),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __param(3, (0, common_1.Req)()),
    __param(4, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Number, Object, Object]),
    __metadata("design:returntype", void 0)
], MenuController.prototype, "preciosDesdeFoto", null);
__decorate([
    (0, common_1.Post)('admin/asignar-productos'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'superadmin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [asignar_productos_menus_dto_1.AsignarProductosMenusDto, Number]),
    __metadata("design:returntype", void 0)
], MenuController.prototype, "asignarProductos", null);
__decorate([
    (0, common_1.Patch)('admin/:id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'superadmin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_menu_dto_1.UpdateMenuDto, Number]),
    __metadata("design:returntype", void 0)
], MenuController.prototype, "actualizar", null);
__decorate([
    (0, common_1.Delete)('admin/:id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'superadmin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], MenuController.prototype, "eliminar", null);
__decorate([
    (0, common_1.Post)('admin/:id/clonar'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'superadmin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, clonar_menu_dto_1.ClonarMenuDto, Number]),
    __metadata("design:returntype", void 0)
], MenuController.prototype, "clonar", null);
__decorate([
    (0, common_1.Get)('admin/:id/productos'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'superadmin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], MenuController.prototype, "listarProductos", null);
__decorate([
    (0, common_1.Put)('admin/:id/productos'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'superadmin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, upsert_menu_producto_dto_1.UpsertMenuProductoDto, Number]),
    __metadata("design:returntype", void 0)
], MenuController.prototype, "upsertProducto", null);
__decorate([
    (0, common_1.Delete)('admin/:id/productos/:idProducto'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'superadmin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('idProducto', common_1.ParseIntPipe)),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", void 0)
], MenuController.prototype, "quitarProducto", null);
__decorate([
    (0, common_1.Post)('productos/:id/imagen'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'superadmin'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('imagen', {
        limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    })),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Number]),
    __metadata("design:returntype", void 0)
], MenuController.prototype, "subirImagenProducto", null);
__decorate([
    (0, common_1.Delete)('productos/:id/imagen'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'superadmin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], MenuController.prototype, "eliminarImagenProducto", null);
exports.MenuController = MenuController = __decorate([
    (0, common_1.Controller)('menu'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [menu_service_1.MenuService,
        menu_admin_service_1.MenuAdminService,
        menu_precios_foto_service_1.MenuPreciosFotoService])
], MenuController);
//# sourceMappingURL=menu.controller.js.map