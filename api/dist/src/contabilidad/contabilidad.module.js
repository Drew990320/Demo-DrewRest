"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContabilidadModule = void 0;
const common_1 = require("@nestjs/common");
const tenant_module_1 = require("../tenant/tenant.module");
const contabilidad_controller_1 = require("./contabilidad.controller");
const contabilidad_posting_service_1 = require("./contabilidad-posting.service");
const contabilidad_seed_service_1 = require("./contabilidad-seed.service");
const contabilidad_service_1 = require("./contabilidad.service");
let ContabilidadModule = class ContabilidadModule {
};
exports.ContabilidadModule = ContabilidadModule;
exports.ContabilidadModule = ContabilidadModule = __decorate([
    (0, common_1.Module)({
        imports: [tenant_module_1.TenantModule],
        controllers: [contabilidad_controller_1.ContabilidadController],
        providers: [
            contabilidad_service_1.ContabilidadService,
            contabilidad_posting_service_1.ContabilidadPostingService,
            contabilidad_seed_service_1.ContabilidadSeedService,
        ],
        exports: [contabilidad_posting_service_1.ContabilidadPostingService, contabilidad_seed_service_1.ContabilidadSeedService],
    })
], ContabilidadModule);
//# sourceMappingURL=contabilidad.module.js.map