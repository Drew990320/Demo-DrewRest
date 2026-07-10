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
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_access_1 = require("../tenant/tenant-access");
const auth_user_cache_1 = require("./auth-user-cache");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    prisma;
    constructor(config, prisma) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.getOrThrow('JWT_SECRET'),
        });
        this.prisma = prisma;
    }
    async validate(payload) {
        const id = Number(payload.sub);
        if (!Number.isFinite(id)) {
            throw new common_1.UnauthorizedException('Token inválido');
        }
        const cached = (0, auth_user_cache_1.getCachedAuthUser)(id);
        if (cached?.activo) {
            await (0, tenant_access_1.assertTenantAccessForUser)(this.prisma, cached);
            return cached;
        }
        const user = await this.prisma.usuario.findUnique({
            where: { idUsuario: id },
            include: { rol: true },
        });
        if (!user?.activo) {
            throw new common_1.UnauthorizedException('Usuario inactivo o inexistente');
        }
        if (payload.tid != null &&
            Number(payload.tid) !== user.idRestaurante) {
            throw new common_1.UnauthorizedException('Token de otro restaurante');
        }
        const pwdAtEsperado = (user.passwordCambiadoEn ?? user.creadoEn).getTime();
        if (payload.pwdAt == null || payload.pwdAt < pwdAtEsperado) {
            throw new common_1.UnauthorizedException('Sesión expirada. Inicia sesión de nuevo.');
        }
        await (0, tenant_access_1.assertTenantAccessForUser)(this.prisma, user);
        (0, auth_user_cache_1.setCachedAuthUser)(user);
        return user;
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map