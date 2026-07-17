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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_constants_1 = require("../tenant/tenant.constants");
const tenant_service_1 = require("../tenant/tenant.service");
const tenant_access_1 = require("../tenant/tenant-access");
const usuario_display_1 = require("../usuarios/usuario-display");
const SETUP_SUPERADMIN_EMAIL_DEFAULT = 'superadmin@drewrest.local';
let AuthService = class AuthService {
    prisma;
    jwt;
    tenant;
    constructor(prisma, jwt, tenant) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.tenant = tenant;
    }
    async setupStatus() {
        const count = await this.prisma.usuario.count({
            where: { rol: { nombre: 'superadmin' } },
        });
        return { necesita_definir_superadmin: count === 0 };
    }
    async setupSuperadmin(dto) {
        const status = await this.setupStatus();
        if (!status.necesita_definir_superadmin) {
            throw new common_1.ConflictException('El superadmin ya está definido. Usa el inicio de sesión normal.');
        }
        const email = (dto.email?.trim().toLowerCase() || SETUP_SUPERADMIN_EMAIL_DEFAULT).trim();
        const nombre = dto.nombre?.trim() || 'Superadmin';
        const rol = await this.prisma.rol.upsert({
            where: { nombre: 'superadmin' },
            create: {
                nombre: 'superadmin',
                descripcion: 'Operación oculta del sistema',
            },
            update: {},
        });
        await this.prisma.restaurante.upsert({
            where: { idRestaurante: tenant_constants_1.DEFAULT_TENANT_ID },
            create: {
                idRestaurante: tenant_constants_1.DEFAULT_TENANT_ID,
                slug: 'principal',
                nombre: 'Restaurante',
            },
            update: {},
        });
        const emailTaken = await this.prisma.usuario.findUnique({
            where: {
                idRestaurante_email: {
                    idRestaurante: tenant_constants_1.DEFAULT_TENANT_ID,
                    email,
                },
            },
        });
        if (emailTaken) {
            throw new common_1.ConflictException('Ya existe un usuario con ese correo');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.usuario.create({
            data: {
                idRestaurante: tenant_constants_1.DEFAULT_TENANT_ID,
                idRol: rol.idRol,
                nombre,
                apellido: '',
                email,
                passwordHash,
                passwordCambiadoEn: new Date(),
                activo: true,
            },
            include: { rol: true },
        });
        return this.issueSession(user);
    }
    async login(dto) {
        const tenantId = dto.tenant_slug?.trim()
            ? await this.tenant.resolveIdBySlug(dto.tenant_slug)
            : tenant_constants_1.DEFAULT_TENANT_ID;
        const email = dto.email.trim().toLowerCase();
        const user = await this.prisma.usuario.findUnique({
            where: { idRestaurante_email: { idRestaurante: tenantId, email } },
            include: { rol: true },
        });
        if (!user?.activo) {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        const ok = await bcrypt.compare(dto.password, user.passwordHash);
        if (!ok) {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        await (0, tenant_access_1.assertTenantAccessForUser)(this.prisma, user);
        return this.issueSession(user);
    }
    async refresh(actor) {
        const user = await this.prisma.usuario.findUnique({
            where: { idUsuario: actor.idUsuario },
            include: { rol: true },
        });
        if (!user?.activo) {
            throw new common_1.UnauthorizedException('Sesión inválida');
        }
        await (0, tenant_access_1.assertTenantAccessForUser)(this.prisma, user);
        const session = await this.issueSession(user);
        return {
            access_token: session.access_token,
            expires_in: session.expires_in,
        };
    }
    async issueSession(user) {
        const pwdAt = (user.passwordCambiadoEn ?? user.creadoEn).getTime();
        const payload = {
            sub: user.idUsuario,
            email: user.email,
            rol: user.rol.nombre,
            pwdAt,
            tid: user.idRestaurante,
        };
        const { nombre, apellido } = (0, usuario_display_1.nombreUsuarioPublico)(user.nombre, user.apellido, user.rol.nombre);
        return {
            access_token: await this.jwt.signAsync(payload),
            expires_in: this.jwtExpiresSeconds(),
            user: {
                id: user.idUsuario,
                nombre,
                apellido,
                email: user.email,
                rol: user.rol.nombre,
                id_restaurante: user.idRestaurante,
            },
        };
    }
    jwtExpiresSeconds() {
        const raw = process.env.JWT_EXPIRES_IN?.trim() ?? '24h';
        const m = /^(\d+)([smhd])$/i.exec(raw);
        if (!m)
            return 86_400;
        const n = Number(m[1]);
        const unit = m[2].toLowerCase();
        const mult = unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86_400;
        return n * mult;
    }
    async verifyPassword(user, password) {
        const row = await this.prisma.usuario.findUnique({
            where: { idUsuario: user.idUsuario },
        });
        if (!row?.activo) {
            throw new common_1.UnauthorizedException('Contraseña incorrecta');
        }
        const ok = await bcrypt.compare(password, row.passwordHash);
        if (!ok) {
            throw new common_1.UnauthorizedException('Contraseña incorrecta');
        }
        return { ok: true };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        tenant_service_1.TenantService])
], AuthService);
//# sourceMappingURL=auth.service.js.map