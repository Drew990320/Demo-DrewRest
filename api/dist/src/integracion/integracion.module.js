"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegracionModule = void 0;
const common_1 = require("@nestjs/common");
const tenant_module_1 = require("../tenant/tenant.module");
const integracion_controller_1 = require("./integracion.controller");
const integracion_service_1 = require("./integracion.service");
let IntegracionModule = class IntegracionModule {
};
exports.IntegracionModule = IntegracionModule;
exports.IntegracionModule = IntegracionModule = __decorate([
    (0, common_1.Module)({
        imports: [tenant_module_1.TenantModule],
        controllers: [integracion_controller_1.IntegracionController],
        providers: [integracion_service_1.IntegracionService],
    })
], IntegracionModule);
//# sourceMappingURL=integracion.module.js.map