"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductosModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const inventario_module_1 = require("../inventario/inventario.module");
const pedidos_module_1 = require("../pedidos/pedidos.module");
const productos_controller_1 = require("./productos.controller");
const productos_service_1 = require("./productos.service");
const personalizaciones_controller_1 = require("./personalizaciones.controller");
const personalizaciones_service_1 = require("./personalizaciones.service");
const producto_subitems_controller_1 = require("./producto-subitems.controller");
const producto_subitems_service_1 = require("./producto-subitems.service");
let ProductosModule = class ProductosModule {
};
exports.ProductosModule = ProductosModule;
exports.ProductosModule = ProductosModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, pedidos_module_1.PedidosModule, inventario_module_1.InventarioModule],
        controllers: [
            productos_controller_1.ProductosController,
            personalizaciones_controller_1.PersonalizacionesController,
            producto_subitems_controller_1.ProductoSubitemsController,
        ],
        providers: [
            productos_service_1.ProductosService,
            personalizaciones_service_1.PersonalizacionesService,
            producto_subitems_service_1.ProductoSubitemsService,
        ],
    })
], ProductosModule);
//# sourceMappingURL=productos.module.js.map