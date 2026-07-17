"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImpresorasPosModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const pedidos_module_1 = require("../pedidos/pedidos.module");
const impresoras_pos_controller_1 = require("./impresoras-pos.controller");
const impresoras_pos_service_1 = require("./impresoras-pos.service");
const localhost_guard_1 = require("./localhost.guard");
let ImpresorasPosModule = class ImpresorasPosModule {
};
exports.ImpresorasPosModule = ImpresorasPosModule;
exports.ImpresorasPosModule = ImpresorasPosModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, (0, common_1.forwardRef)(() => pedidos_module_1.PedidosModule)],
        controllers: [impresoras_pos_controller_1.ImpresorasPosController],
        providers: [impresoras_pos_service_1.ImpresorasPosService, localhost_guard_1.LocalhostGuard],
        exports: [impresoras_pos_service_1.ImpresorasPosService],
    })
], ImpresorasPosModule);
//# sourceMappingURL=impresoras-pos.module.js.map