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
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const mail_service_1 = require("../mail/mail.service");
const pedidos_service_1 = require("../pedidos/pedidos.service");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_constants_1 = require("../tenant/tenant.constants");
const tenant_access_1 = require("../tenant/tenant-access");
const tenant_service_1 = require("../tenant/tenant.service");
const usuario_display_1 = require("../usuarios/usuario-display");
const OTP_TTL_MS = 10 * 60_000;
const OTP_MAX_ATTEMPTS = 5;
let AuthService = class AuthService {
    prisma;
    jwt;
    tenant;
    mail;
    moduleRef;
    passwordResetOtps = new Map();
    constructor(prisma, jwt, tenant, mail, moduleRef) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.tenant = tenant;
        this.mail = mail;
        this.moduleRef = moduleRef;
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
        const email = this.assertEmailRecuperable(dto.email);
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
    async requestPasswordReset(dto) {
        const email = this.assertEmailRecuperable(dto.email);
        const tenantId = dto.tenant_slug?.trim()
            ? await this.tenant.resolveIdBySlug(dto.tenant_slug)
            : tenant_constants_1.DEFAULT_TENANT_ID;
        const user = await this.prisma.usuario.findUnique({
            where: { idRestaurante_email: { idRestaurante: tenantId, email } },
            include: { rol: true },
        });
        const rolOk = user?.activo &&
            (user.rol.nombre === 'superadmin' || user.rol.nombre === 'admin');
        if (!rolOk) {
            return {
                ok: true,
                message: 'Si el correo está registrado, recibirás un código de 6 dígitos en unos segundos.',
            };
        }
        if (!this.mail.estaConfigurado()) {
            throw new common_1.BadRequestException('El servidor no tiene SMTP configurado (SMTP_HOST / SMTP_FROM). ' +
                'Configúralo en api/.env para poder restablecer la contraseña por correo.');
        }
        const code = String((0, crypto_1.randomInt)(100000, 999999));
        const key = this.otpKey(tenantId, email);
        this.passwordResetOtps.set(key, {
            codeHash: this.hashOtp(code),
            expiresAt: Date.now() + OTP_TTL_MS,
            attempts: 0,
            userId: user.idUsuario,
        });
        const subject = 'Código para restablecer contraseña — DrewRest';
        const text = [
            'Tu código de verificación DrewRest es:',
            '',
            `  ${code}`,
            '',
            'Válido por 10 minutos. Si no pediste restablecer la contraseña, ignora este mensaje.',
        ].join('\n');
        const html = `
      <p>Tu código de verificación DrewRest es:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:4px;">${code}</p>
      <p>Válido por 10 minutos. Si no pediste restablecer la contraseña, ignora este mensaje.</p>
    `;
        const sent = await this.mail.enviar({ to: email, subject, text, html });
        if (!sent.enviado) {
            this.passwordResetOtps.delete(key);
            throw new common_1.BadRequestException(sent.error ?? 'No se pudo enviar el código por correo.');
        }
        return {
            ok: true,
            message: 'Te enviamos un código de 6 dígitos a tu correo. Introdúcelo en la app.',
        };
    }
    async confirmPasswordReset(dto) {
        const email = this.assertEmailRecuperable(dto.email);
        const tenantId = dto.tenant_slug?.trim()
            ? await this.tenant.resolveIdBySlug(dto.tenant_slug)
            : tenant_constants_1.DEFAULT_TENANT_ID;
        const key = this.otpKey(tenantId, email);
        const entry = this.passwordResetOtps.get(key);
        if (!entry || entry.expiresAt < Date.now()) {
            this.passwordResetOtps.delete(key);
            throw new common_1.UnauthorizedException('Código inválido o vencido. Solicita uno nuevo.');
        }
        entry.attempts += 1;
        if (entry.attempts > OTP_MAX_ATTEMPTS) {
            this.passwordResetOtps.delete(key);
            throw new common_1.UnauthorizedException('Demasiados intentos. Solicita un código nuevo.');
        }
        if (!this.otpMatches(entry.codeHash, dto.code.trim())) {
            throw new common_1.UnauthorizedException('Código incorrecto.');
        }
        const user = await this.prisma.usuario.findUnique({
            where: { idUsuario: entry.userId },
            include: { rol: true },
        });
        if (!user?.activo ||
            user.email !== email ||
            (user.rol.nombre !== 'superadmin' && user.rol.nombre !== 'admin')) {
            this.passwordResetOtps.delete(key);
            throw new common_1.UnauthorizedException('No se pudo restablecer la contraseña.');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        await this.prisma.usuario.update({
            where: { idUsuario: user.idUsuario },
            data: {
                passwordHash,
                passwordCambiadoEn: new Date(),
            },
        });
        this.passwordResetOtps.delete(key);
        return {
            ok: true,
            message: 'Contraseña actualizada. Ya puedes iniciar sesión.',
        };
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
        if (user.rol.nombre === 'autoservicio') {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        const ok = await bcrypt.compare(dto.password, user.passwordHash);
        if (!ok) {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        await (0, tenant_access_1.assertTenantAccessForUser)(this.prisma, user);
        return this.issueSession(user);
    }
    async assertPinLoginHabilitado(tenantId, pin) {
        const cfg = await this.prisma.configRestaurante.findUnique({
            where: { idRestaurante: tenantId },
        });
        const hash = cfg?.loginPinHash?.trim();
        if (!cfg?.moduloLoginPinActivo ||
            !cfg.loginPinCompartidoActivo ||
            !hash) {
            throw new common_1.UnauthorizedException('PIN o usuario inválido');
        }
        const ok = await bcrypt.compare(pin, hash);
        if (!ok) {
            throw new common_1.UnauthorizedException('PIN o usuario inválido');
        }
    }
    async listarMeserosPorPin(dto) {
        const tenantId = dto.tenant_slug?.trim()
            ? await this.tenant.resolveIdBySlug(dto.tenant_slug)
            : tenant_constants_1.DEFAULT_TENANT_ID;
        await this.assertPinLoginHabilitado(tenantId, dto.pin);
        const rows = await this.prisma.usuario.findMany({
            where: {
                idRestaurante: tenantId,
                activo: true,
                rol: { nombre: 'mesero' },
            },
            include: { rol: true },
            orderBy: [{ nombre: 'asc' }, { apellido: 'asc' }],
        });
        return rows.map((u) => {
            const { nombre, apellido } = (0, usuario_display_1.nombreUsuarioPublico)(u.nombre, u.apellido, u.rol.nombre);
            return { id: u.idUsuario, nombre, apellido };
        });
    }
    async loginConPin(dto) {
        const tenantId = dto.tenant_slug?.trim()
            ? await this.tenant.resolveIdBySlug(dto.tenant_slug)
            : tenant_constants_1.DEFAULT_TENANT_ID;
        await this.assertPinLoginHabilitado(tenantId, dto.pin);
        const user = await this.prisma.usuario.findFirst({
            where: {
                idUsuario: dto.user_id,
                idRestaurante: tenantId,
                activo: true,
                rol: { nombre: 'mesero' },
            },
            include: { rol: true },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('PIN o usuario inválido');
        }
        await (0, tenant_access_1.assertTenantAccessForUser)(this.prisma, user);
        return this.issueSession(user);
    }
    async iniciarSesionAutoservicio(dto) {
        const tenantId = dto?.tenant_slug?.trim()
            ? await this.tenant.resolveIdBySlug(dto.tenant_slug)
            : tenant_constants_1.DEFAULT_TENANT_ID;
        const cfg = await this.prisma.configRestaurante.findUnique({
            where: { idRestaurante: tenantId },
            select: { moduloAutoservicioActivo: true },
        });
        if (!cfg?.moduloAutoservicioActivo) {
            throw new common_1.UnauthorizedException('Autoservicio no está habilitado');
        }
        const user = await this.ensureUsuarioAutoservicio(tenantId);
        await (0, tenant_access_1.assertTenantAccessForUser)(this.prisma, user);
        const pedidos = this.moduleRef.get(pedidos_service_1.PedidosService, { strict: false });
        await pedidos.limpiarPedidosAutoservicioAbandonados(user.idUsuario, tenantId);
        return this.issueSession(user, { expiresIn: '45m' });
    }
    async ensureUsuarioAutoservicio(tenantId) {
        const rol = await this.prisma.rol.upsert({
            where: { nombre: 'autoservicio' },
            create: {
                nombre: 'autoservicio',
                descripcion: 'Cliente en login: solo arma su pedido',
            },
            update: {},
        });
        const email = 'autoservicio@drewrest.local';
        const existing = await this.prisma.usuario.findUnique({
            where: {
                idRestaurante_email: { idRestaurante: tenantId, email },
            },
            include: { rol: true },
        });
        if (existing) {
            if (!existing.activo || existing.idRol !== rol.idRol) {
                return this.prisma.usuario.update({
                    where: { idUsuario: existing.idUsuario },
                    data: { activo: true, idRol: rol.idRol },
                    include: { rol: true },
                });
            }
            return existing;
        }
        await this.prisma.restaurante.upsert({
            where: { idRestaurante: tenantId },
            create: {
                idRestaurante: tenantId,
                slug: tenantId === tenant_constants_1.DEFAULT_TENANT_ID ? 'principal' : `tenant-${tenantId}`,
                nombre: 'Restaurante',
            },
            update: {},
        });
        const passwordHash = await bcrypt.hash(`autoservicio-no-login-${tenantId}-${Date.now()}`, 10);
        return this.prisma.usuario.create({
            data: {
                idRestaurante: tenantId,
                idRol: rol.idRol,
                nombre: 'Autoservicio',
                apellido: '',
                email,
                passwordHash,
                passwordCambiadoEn: new Date(),
                activo: true,
            },
            include: { rol: true },
        });
    }
    async refresh(actor) {
        const user = await this.prisma.usuario.findUnique({
            where: { idUsuario: actor.idUsuario },
            include: { rol: true },
        });
        if (!user?.activo) {
            throw new common_1.UnauthorizedException('Sesión inválida');
        }
        if (user.rol.nombre === 'autoservicio') {
            throw new common_1.UnauthorizedException('Sesión de autoservicio no renovable');
        }
        await (0, tenant_access_1.assertTenantAccessForUser)(this.prisma, user);
        const session = await this.issueSession(user);
        return {
            access_token: session.access_token,
            expires_in: session.expires_in,
        };
    }
    async issueSession(user, opts) {
        const pwdAt = (user.passwordCambiadoEn ?? user.creadoEn).getTime();
        const payload = {
            sub: user.idUsuario,
            email: user.email,
            rol: user.rol.nombre,
            pwdAt,
            tid: user.idRestaurante,
        };
        const { nombre, apellido } = (0, usuario_display_1.nombreUsuarioPublico)(user.nombre, user.apellido, user.rol.nombre);
        const expiresIn = opts?.expiresIn;
        const expiresSec = expiresIn
            ? this.parseExpiresToSeconds(expiresIn)
            : undefined;
        const access_token = expiresSec
            ? await this.jwt.signAsync(payload, { expiresIn: expiresSec })
            : await this.jwt.signAsync(payload);
        return {
            access_token,
            expires_in: expiresSec ?? this.jwtExpiresSeconds(),
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
    parseExpiresToSeconds(raw) {
        const m = /^(\d+)([smhd])$/i.exec(raw.trim());
        if (!m)
            return 2700;
        const n = Number(m[1]);
        const unit = m[2].toLowerCase();
        const mult = unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86_400;
        return n * mult;
    }
    jwtExpiresSeconds() {
        const raw = process.env.JWT_EXPIRES_IN?.trim() ?? '24h';
        return this.parseExpiresToSeconds(raw);
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
    assertEmailRecuperable(raw) {
        const email = (raw ?? '').trim().toLowerCase();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new common_1.BadRequestException('Indica un correo válido (ej. tu@gmail.com).');
        }
        if (email.endsWith('.local')) {
            throw new common_1.BadRequestException('Usa un correo real (Gmail, Outlook, etc.). Los correos .local no reciben el código de recuperación.');
        }
        return email;
    }
    otpKey(tenantId, email) {
        return `${tenantId}:${email}`;
    }
    hashOtp(code) {
        return (0, crypto_1.createHash)('sha256').update(code).digest('hex');
    }
    otpMatches(storedHash, code) {
        const a = Buffer.from(storedHash, 'hex');
        const b = Buffer.from(this.hashOtp(code), 'hex');
        if (a.length !== b.length)
            return false;
        return (0, crypto_1.timingSafeEqual)(a, b);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        tenant_service_1.TenantService,
        mail_service_1.MailService,
        core_1.ModuleRef])
], AuthService);
//# sourceMappingURL=auth.service.js.map