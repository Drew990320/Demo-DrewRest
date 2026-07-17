"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventarioModule = void 0;
const common_1 = require("@nestjs/common");
const tenant_module_1 = require("../tenant/tenant.module");
const recursos_module_1 = require("../recursos/recursos.module");
const inventario_controller_1 = require("./inventario.controller");
const inventario_deduccion_service_1 = require("./inventario-deduccion.service");
const inventario_receta_service_1 = require("./inventario-receta.service");
const inventario_service_1 = require("./inventario.service");
const producto_inventario_vinculo_service_1 = require("./producto-inventario-vinculo.service");
let InventarioModule = class InventarioModule {
};
exports.InventarioModule = InventarioModule;
exports.InventarioModule = InventarioModule = __decorate([
    (0, common_1.Module)({
        imports: [tenant_module_1.TenantModule, recursos_module_1.RecursosModule],
        controllers: [inventario_controller_1.InventarioController],
        providers: [
            inventario_service_1.InventarioService,
            inventario_receta_service_1.InventarioRecetaService,
            inventario_deduccion_service_1.InventarioDeduccionService,
            producto_inventario_vinculo_service_1.ProductoInventarioVinculoService,
        ],
        exports: [
            inventario_service_1.InventarioService,
            inventario_receta_service_1.InventarioRecetaService,
            inventario_deduccion_service_1.InventarioDeduccionService,
            producto_inventario_vinculo_service_1.ProductoInventarioVinculoService,
        ],
    })
], InventarioModule);
//# sourceMappingURL=inventario.module.js.map