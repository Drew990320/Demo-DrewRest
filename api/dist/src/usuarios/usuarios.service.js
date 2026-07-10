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
exports.UsuariosService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const roles_1 = require("@drewrest/shared-domain/roles");
const prisma_service_1 = require("../prisma/prisma.service");
const auth_user_cache_1 = require("../auth/auth-user-cache");
const pedidos_gateway_1 = require("../pedidos/pedidos.gateway");
const email_mesero_1 = require("./email-mesero");
const usuario_display_1 = require("./usuario-display");
const mesa_admin_validacion_1 = require("@drewrest/shared-domain/mesa-admin-validacion");
const restaurant_branding_1 = require("../common/restaurant-branding");
const PEDIDOS_ABIERTOS = ['abierto', 'en_cocina'];
let UsuariosService = class UsuariosService {
    prisma;
    gateway;
    constructor(prisma, gateway) {
        this.prisma = prisma;
        this.gateway = gateway;
    }
    async listar(tenantId, actor) {
        const rows = await this.prisma.usuario.findMany({
            where: { idRestaurante: tenantId },
            include: { rol: true },
            orderBy: { idUsuario: 'asc' },
        });
        return rows
            .filter((u) => {
            if ((0, roles_1.esRolOcultoEnUsuarios)(u.rol.nombre))
                return false;
            if ((0, roles_1.esRolAdmin)(actor?.rol) && u.rol.nombre === roles_1.ROL_ADMIN) {
                return u.idUsuario !== actor?.idUsuario;
            }
            return true;
        })
            .map((u) => {
            const { nombre, apellido } = (0, usuario_display_1.nombreUsuarioPublico)(u.nombre, u.apellido, u.rol.nombre);
            return {
                id: u.idUsuario,
                nombre,
                apellido,
                email: u.email,
                rol: u.rol.nombre,
                activo: u.activo,
                creado_en: u.creadoEn,
            };
        });
    }
    async crearMesero(dto, tenantId) {
        const rolMesero = await this.prisma.rol.findFirst({
            where: { nombre: 'mesero' },
        });
        if (!rolMesero) {
            throw new common_1.NotFoundException('Rol mesero no configurado');
        }
        const email = await this.resolverEmailMesero(dto.email?.trim().toLowerCase(), dto.nombre, tenantId);
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const u = await this.prisma.usuario.create({
            data: {
                idRestaurante: tenantId,
                idRol: rolMesero.idRol,
                nombre: dto.nombre.trim(),
                apellido: dto.apellido.trim(),
                email,
                passwordHash,
                passwordCambiadoEn: new Date(),
                activo: true,
            },
            include: { rol: true },
        });
        return this.mapOne(u);
    }
    async resolverEmailMesero(emailManual, nombre, tenantId) {
        if (emailManual) {
            const exists = await this.prisma.usuario.findUnique({
                where: {
                    idRestaurante_email: { idRestaurante: tenantId, email: emailManual },
                },
            });
            if (exists) {
                throw new common_1.ConflictException('Ya existe un usuario con ese correo');
            }
            return emailManual;
        }
        const base = (0, email_mesero_1.emailMeseroDesdeNombre)(nombre);
        const localBase = base.split('@')[0] ?? 'mesero';
        let candidato = base;
        let n = 2;
        while (await this.prisma.usuario.findUnique({
            where: {
                idRestaurante_email: { idRestaurante: tenantId, email: candidato },
            },
        })) {
            candidato = (0, email_mesero_1.emailMeseroDesdeNombre)(nombre, String(n));
            n += 1;
            if (n > 99) {
                candidato = `${localBase}.${Date.now()}${(0, restaurant_branding_1.restaurantEmailSuffix)()}`;
                break;
            }
        }
        return candidato;
    }
    async actualizar(idUsuario, dto, actorId) {
        const target = await this.prisma.usuario.findUnique({
            where: { idUsuario },
            include: { rol: true },
        });
        if (!target) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        if (target.rol.nombre === 'admin') {
            throw new common_1.ForbiddenException('No se puede modificar cuentas de administrador desde aquí');
        }
        if (dto.activo === false && idUsuario === actorId) {
            throw new common_1.ForbiddenException('No puedes desactivar tu propia sesión');
        }
        if (dto.activo === false) {
            const pedidosActivos = await this.prisma.pedido.count({
                where: {
                    idUsuario,
                    estado: { in: [...PEDIDOS_ABIERTOS] },
                },
            });
            const validacion = (0, mesa_admin_validacion_1.validarDesactivarUsuario)({ pedidosActivos });
            if (!validacion.ok) {
                throw new common_1.ConflictException(validacion.mensaje);
            }
        }
        const data = {};
        if (dto.activo !== undefined) {
            data.activo = dto.activo;
        }
        if (dto.password?.trim()) {
            data.passwordHash = await bcrypt.hash(dto.password.trim(), 10);
            data.passwordCambiadoEn = new Date();
        }
        if (Object.keys(data).length === 0) {
            return this.mapOne(target);
        }
        const u = await this.prisma.usuario.update({
            where: { idUsuario },
            data,
            include: { rol: true },
        });
        (0, auth_user_cache_1.invalidateAuthUser)(idUsuario);
        if (dto.activo === false) {
            this.gateway.emitAuthSesionInvalidada(idUsuario, 'desactivado', 'Un administrador desactivó tu acceso.', target.idRestaurante);
        }
        if (dto.password?.trim()) {
            this.gateway.emitAuthSesionInvalidada(idUsuario, 'credenciales', 'Tu contraseña fue actualizada. Inicia sesión de nuevo.', target.idRestaurante);
        }
        return this.mapOne(u);
    }
    mapOne(u) {
        const { nombre, apellido } = (0, usuario_display_1.nombreUsuarioPublico)(u.nombre, u.apellido, u.rol.nombre);
        return {
            id: u.idUsuario,
            nombre,
            apellido,
            email: u.email,
            rol: u.rol.nombre,
            activo: u.activo,
            creado_en: u.creadoEn,
        };
    }
};
exports.UsuariosService = UsuariosService;
exports.UsuariosService = UsuariosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        pedidos_gateway_1.PedidosGateway])
], UsuariosService);
//# sourceMappingURL=usuarios.service.js.map