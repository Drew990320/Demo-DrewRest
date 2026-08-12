"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuModule = void 0;
const common_1 = require("@nestjs/common");
const pedidos_module_1 = require("../pedidos/pedidos.module");
const menu_controller_1 = require("./menu.controller");
const producto_imagen_public_controller_1 = require("./producto-imagen-public.controller");
const menu_service_1 = require("./menu.service");
const menu_activo_service_1 = require("./menu-activo.service");
const menu_admin_service_1 = require("./menu-admin.service");
const menu_precios_foto_service_1 = require("./menu-precios-foto.service");
let MenuModule = class MenuModule {
};
exports.MenuModule = MenuModule;
exports.MenuModule = MenuModule = __decorate([
    (0, common_1.Module)({
        imports: [(0, common_1.forwardRef)(() => pedidos_module_1.PedidosModule)],
        controllers: [menu_controller_1.MenuController, producto_imagen_public_controller_1.ProductoImagenPublicController],
        providers: [
            menu_service_1.MenuService,
            menu_activo_service_1.MenuActivoService,
            menu_admin_service_1.MenuAdminService,
            menu_precios_foto_service_1.MenuPreciosFotoService,
        ],
        exports: [menu_service_1.MenuService, menu_activo_service_1.MenuActivoService],
    })
], MenuModule);
//# sourceMappingURL=menu.module.js.map