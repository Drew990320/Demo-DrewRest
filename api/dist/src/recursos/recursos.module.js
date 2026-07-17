"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecursosModule = void 0;
const common_1 = require("@nestjs/common");
const tenant_module_1 = require("../tenant/tenant.module");
const recursos_controller_1 = require("./recursos.controller");
const recursos_migracion_service_1 = require("./recursos-migracion.service");
const recursos_service_1 = require("./recursos.service");
let RecursosModule = class RecursosModule {
};
exports.RecursosModule = RecursosModule;
exports.RecursosModule = RecursosModule = __decorate([
    (0, common_1.Module)({
        imports: [tenant_module_1.TenantModule],
        controllers: [recursos_controller_1.RecursosController],
        providers: [recursos_service_1.RecursosService, recursos_migracion_service_1.RecursosMigracionService],
        exports: [recursos_service_1.RecursosService, recursos_migracion_service_1.RecursosMigracionService],
    })
], RecursosModule);
//# sourceMappingURL=recursos.module.js.map