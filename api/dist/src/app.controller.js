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
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const fs_1 = require("fs");
const path_1 = require("path");
const prisma_service_1 = require("./prisma/prisma.service");
function resolveApiVersion() {
    const fromEnv = process.env.npm_package_version?.trim();
    if (fromEnv)
        return fromEnv;
    try {
        const pkgPath = (0, path_1.join)(__dirname, '..', '..', 'package.json');
        const pkg = JSON.parse((0, fs_1.readFileSync)(pkgPath, 'utf8'));
        if (pkg.version)
            return pkg.version;
    }
    catch {
    }
    return '0.0.0';
}
const API_VERSION = resolveApiVersion();
let AppController = class AppController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    root() {
        return {
            ok: true,
            service: 'drewrest-api',
            health: '/health',
            ping: '/ping',
            ready: '/health/ready',
        };
    }
    health() {
        return {
            ok: true,
            status: 'ok',
            service: 'drewrest-api',
            serverTime: new Date().toISOString(),
            version: API_VERSION,
        };
    }
    async ready() {
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return {
                ok: true,
                status: 'ok',
                service: 'drewrest-api',
                db: true,
                serverTime: new Date().toISOString(),
                version: API_VERSION,
            };
        }
        catch {
            throw new common_1.ServiceUnavailableException({
                ok: false,
                status: 'unavailable',
                service: 'drewrest-api',
                db: false,
                message: 'Base de datos no disponible',
            });
        }
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "root", null);
__decorate([
    (0, common_1.Get)(['health', 'ping']),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "health", null);
__decorate([
    (0, common_1.Get)('health/ready'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "ready", null);
exports.AppController = AppController = __decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AppController);
//# sourceMappingURL=app.controller.js.map