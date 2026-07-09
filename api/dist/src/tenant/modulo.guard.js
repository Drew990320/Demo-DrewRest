"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuloGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_restaurante_service_1 = require("../restaurante/config-restaurante.service");
const tenant_constants_1 = require("./tenant.constants");
const modulo_decorator_1 = require("./modulo.decorator");
function moduloActivo(cfg, key) {
    switch (key) {
        case 'inventario':
            return cfg.moduloInventarioActivo;
        case 'meseros_operativos':
            return cfg.moduloMeserosOperativosActivo;
        case 'envio_correo':
            return cfg.moduloEnvioCorreoActivo;
        case 'resumen_diario':
            return cfg.moduloResumenDiarioActivo;
        case 'contabilidad':
            return cfg.moduloContabilidadActivo;
        case 'creditos':
            return cfg.moduloCreditosActivo;
        case 'odoo':
            return cfg.moduloOdooActivo;
        default:
            return false;
    }
}
let ModuloGuard = class ModuloGuard {
    reflector;
    configRestaurante;
    constructor(reflector, configRestaurante) {
        this.reflector = reflector;
        this.configRestaurante = configRestaurante;
    }
    async canActivate(context) {
        const required = this.reflector.getAllAndOverride(modulo_decorator_1.MODULOS_RESTAURANTE_KEY, [context.getHandler(), context.getClass()]) ?? [];
        if (!required.length)
            return true;
        const req = context.switchToHttp().getRequest();
        const tenantId = req.user?.idRestaurante ?? tenant_constants_1.DEFAULT_TENANT_ID;
        const cfg = await this.configRestaurante.obtenerRow(tenantId);
        for (const mod of required) {
            if (!moduloActivo(cfg, mod)) {
                throw new common_1.ForbiddenException('Módulo no habilitado para este restaurante');
            }
        }
        return true;
    }
};
exports.ModuloGuard = ModuloGuard;
exports.ModuloGuard = ModuloGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        config_restaurante_service_1.ConfigRestauranteService])
], ModuloGuard);
//# sourceMappingURL=modulo.guard.js.map