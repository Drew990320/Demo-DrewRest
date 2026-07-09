"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisualModule = void 0;
const common_1 = require("@nestjs/common");
const pedidos_module_1 = require("../pedidos/pedidos.module");
const config_visual_service_1 = require("./config-visual.service");
const visual_controller_1 = require("./visual.controller");
let VisualModule = class VisualModule {
};
exports.VisualModule = VisualModule;
exports.VisualModule = VisualModule = __decorate([
    (0, common_1.Module)({
        imports: [pedidos_module_1.PedidosModule],
        controllers: [visual_controller_1.VisualController],
        providers: [config_visual_service_1.ConfigVisualService],
        exports: [config_visual_service_1.ConfigVisualService],
    })
], VisualModule);
//# sourceMappingURL=visual.module.js.map