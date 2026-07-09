"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestauranteModule = void 0;
const common_1 = require("@nestjs/common");
const config_restaurante_service_1 = require("./config-restaurante.service");
const restaurante_controller_1 = require("./restaurante.controller");
let RestauranteModule = class RestauranteModule {
};
exports.RestauranteModule = RestauranteModule;
exports.RestauranteModule = RestauranteModule = __decorate([
    (0, common_1.Module)({
        controllers: [restaurante_controller_1.RestauranteController],
        providers: [config_restaurante_service_1.ConfigRestauranteService],
        exports: [config_restaurante_service_1.ConfigRestauranteService],
    })
], RestauranteModule);
//# sourceMappingURL=restaurante.module.js.map