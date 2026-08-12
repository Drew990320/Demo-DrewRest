"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GananciasModule = void 0;
const common_1 = require("@nestjs/common");
const restaurante_module_1 = require("../restaurante/restaurante.module");
const ganancias_controller_1 = require("./ganancias.controller");
const ganancias_service_1 = require("./ganancias.service");
let GananciasModule = class GananciasModule {
};
exports.GananciasModule = GananciasModule;
exports.GananciasModule = GananciasModule = __decorate([
    (0, common_1.Module)({
        imports: [restaurante_module_1.RestauranteModule],
        controllers: [ganancias_controller_1.GananciasController],
        providers: [ganancias_service_1.GananciasService],
        exports: [ganancias_service_1.GananciasService],
    })
], GananciasModule);
//# sourceMappingURL=ganancias.module.js.map