"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformApiKeyGuard = void 0;
const common_1 = require("@nestjs/common");
let PlatformApiKeyGuard = class PlatformApiKeyGuard {
    canActivate(context) {
        const expected = process.env.PLATFORM_PROVISION_KEY?.trim();
        if (!expected) {
            throw new common_1.ForbiddenException('Provisión de restaurantes no habilitada en este servidor');
        }
        const req = context.switchToHttp().getRequest();
        const header = req.header('x-platform-key')?.trim() ??
            bearerToken(req.header('authorization'));
        if (!header) {
            throw new common_1.UnauthorizedException('Falta clave de plataforma');
        }
        if (header !== expected) {
            throw new common_1.UnauthorizedException('Clave de plataforma inválida');
        }
        return true;
    }
};
exports.PlatformApiKeyGuard = PlatformApiKeyGuard;
exports.PlatformApiKeyGuard = PlatformApiKeyGuard = __decorate([
    (0, common_1.Injectable)()
], PlatformApiKeyGuard);
function bearerToken(auth) {
    if (!auth)
        return undefined;
    const m = /^Bearer\s+(.+)$/i.exec(auth);
    return m?.[1]?.trim();
}
//# sourceMappingURL=platform-api-key.guard.js.map