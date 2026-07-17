"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SistemaController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const fs = __importStar(require("fs"));
const restaurant_branding_1 = require("../common/restaurant-branding");
const logo_upload_util_1 = require("../restaurante/logo-upload.util");
const config_restaurante_service_1 = require("../restaurante/config-restaurante.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const red_local_1 = require("./red-local");
const instalacion_on_prem_1 = require("./instalacion-on-prem");
const cors_origins_1 = require("../common/cors-origins");
const license_status_1 = require("../license/license-status");
let SistemaController = class SistemaController {
    configRestaurante;
    constructor(configRestaurante) {
        this.configRestaurante = configRestaurante;
    }
    licencia() {
        return (0, license_status_1.leerEstadoLicencia)();
    }
    async branding() {
        await this.configRestaurante.obtenerRow();
        const tieneLogo = (0, restaurant_branding_1.restaurantHasLogo)();
        return {
            nombre: (0, restaurant_branding_1.restaurantName)(),
            telefono: (0, restaurant_branding_1.restaurantTicketPhone)() || null,
            direccion: (0, restaurant_branding_1.restaurantTicketAddress)() || null,
            tiene_logo: tieneLogo,
            logo_url: tieneLogo ? '/sistema/logo' : null,
        };
    }
    async logo(res) {
        await this.configRestaurante.obtenerRow();
        const logoPath = (0, restaurant_branding_1.resolveRestaurantLogoPath)();
        if (!logoPath) {
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            res.status(404).json({ message: 'Logo no configurado' });
            return;
        }
        res.setHeader('Content-Type', (0, logo_upload_util_1.mimeFromLogoPath)(logoPath));
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cache-Control', 'public, max-age=300');
        res.send(fs.readFileSync(logoPath));
    }
    instalacion() {
        return (0, instalacion_on_prem_1.leerInstalacionOnPrem)();
    }
    conexionCelulares() {
        const red = (0, red_local_1.detectarRedLocal)();
        const apiPort = Number(process.env.PORT ?? 3000);
        const webPort = (0, red_local_1.leerPuertoWeb)();
        const ip = red?.ip ?? null;
        const demoLoginUrl = (0, cors_origins_1.resolveDemoWebLoginUrl)();
        const modoDemoNube = (0, cors_origins_1.isCloudDemoDeployment)() && Boolean(demoLoginUrl);
        const avisos = modoDemoNube
            ? [
                'Demo en la nube: el QR abre el login de la demo en cualquier celular con internet (no requiere la misma red Wi‑Fi del restaurante).',
            ]
            : [
                'Los celulares deben estar en la misma red Wi-Fi (o Ethernet al mismo router). No uses redes virtuales (192.168.56.x).',
            ];
        if (!modoDemoNube && webPort !== red_local_1.PUERTO_WEB_POR_DEFECTO) {
            avisos.unshift(`El puerto ${red_local_1.PUERTO_WEB_POR_DEFECTO} estaba ocupado; la app web usa el puerto ${webPort}.`);
        }
        const urlWebCelular = modoDemoNube
            ? demoLoginUrl
            : ip
                ? `http://${ip}:${webPort}`
                : null;
        return {
            ip: modoDemoNube ? null : ip,
            adaptador: modoDemoNube ? null : red?.adaptador ?? null,
            tipo_red: modoDemoNube ? null : red?.tipo ?? null,
            puerto_api: apiPort,
            puerto_web: webPort,
            puerto_web_por_defecto: red_local_1.PUERTO_WEB_POR_DEFECTO,
            url_api: modoDemoNube
                ? null
                : ip
                    ? `http://${ip}:${apiPort}`
                    : null,
            url_web_celular: urlWebCelular,
            url_web_local: modoDemoNube
                ? demoLoginUrl.replace(/\/login$/, '')
                : `http://localhost:${webPort}`,
            health_celular: modoDemoNube
                ? null
                : ip
                    ? `http://${ip}:${apiPort}/health`
                    : null,
            modo_demo_nube: modoDemoNube,
            aviso: avisos.join(' '),
        };
    }
};
exports.SistemaController = SistemaController;
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)('licencia'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SistemaController.prototype, "licencia", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)('branding'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SistemaController.prototype, "branding", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)('logo'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SistemaController.prototype, "logo", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)('instalacion'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SistemaController.prototype, "instalacion", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)('conexion-celulares'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SistemaController.prototype, "conexionCelulares", null);
exports.SistemaController = SistemaController = __decorate([
    (0, common_1.Controller)('sistema'),
    __metadata("design:paramtypes", [config_restaurante_service_1.ConfigRestauranteService])
], SistemaController);
//# sourceMappingURL=sistema.controller.js.map