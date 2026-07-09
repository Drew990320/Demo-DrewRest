"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeserosOperativosModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const permisos_module_1 = require("../permisos/permisos.module");
const pedidos_module_1 = require("../pedidos/pedidos.module");
const meseros_operativos_controller_1 = require("./meseros-operativos.controller");
const meseros_operativos_service_1 = require("./meseros-operativos.service");
let MeserosOperativosModule = class MeserosOperativosModule {
};
exports.MeserosOperativosModule = MeserosOperativosModule;
exports.MeserosOperativosModule = MeserosOperativosModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, permisos_module_1.PermisosModule, pedidos_module_1.PedidosModule],
        controllers: [meseros_operativos_controller_1.MeserosOperativosController],
        providers: [meseros_operativos_service_1.MeserosOperativosService],
    })
], MeserosOperativosModule);
//# sourceMappingURL=meseros-operativos.module.js.map