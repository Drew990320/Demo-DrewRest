"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CuentasPorPagarModule = void 0;
const common_1 = require("@nestjs/common");
const tenant_module_1 = require("../tenant/tenant.module");
const contabilidad_module_1 = require("../contabilidad/contabilidad.module");
const cuentas_por_pagar_controller_1 = require("./cuentas-por-pagar.controller");
const cuentas_por_pagar_service_1 = require("./cuentas-por-pagar.service");
let CuentasPorPagarModule = class CuentasPorPagarModule {
};
exports.CuentasPorPagarModule = CuentasPorPagarModule;
exports.CuentasPorPagarModule = CuentasPorPagarModule = __decorate([
    (0, common_1.Module)({
        imports: [tenant_module_1.TenantModule, contabilidad_module_1.ContabilidadModule],
        controllers: [cuentas_por_pagar_controller_1.CuentasPorPagarController],
        providers: [cuentas_por_pagar_service_1.CuentasPorPagarService],
        exports: [cuentas_por_pagar_service_1.CuentasPorPagarService],
    })
], CuentasPorPagarModule);
//# sourceMappingURL=cuentas-por-pagar.module.js.map