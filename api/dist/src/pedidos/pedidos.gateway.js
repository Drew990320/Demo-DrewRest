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
exports.PedidosGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const jwt_1 = require("@nestjs/jwt");
const socket_io_1 = require("socket.io");
const auth_user_cache_1 = require("../auth/auth-user-cache");
const menu_hoy_cache_1 = require("../common/menu-hoy-cache");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_constants_1 = require("../tenant/tenant.constants");
const tenant_rooms_1 = require("../tenant/tenant-rooms");
let PedidosGateway = class PedidosGateway {
    jwt;
    prisma;
    server;
    constructor(jwt, prisma) {
        this.jwt = jwt;
        this.prisma = prisma;
    }
    extractToken(client) {
        const auth = client.handshake.auth?.token;
        if (typeof auth === 'string' && auth.trim()) {
            return auth.trim();
        }
        const query = client.handshake.query?.token;
        if (typeof query === 'string' && query.trim()) {
            return query.trim();
        }
        const header = client.handshake.headers?.authorization;
        if (typeof header === 'string' && header.startsWith('Bearer ')) {
            return header.slice(7).trim();
        }
        return null;
    }
    async authenticate(client) {
        const token = this.extractToken(client);
        if (!token)
            return null;
        try {
            const payload = await this.jwt.verifyAsync(token);
            const idUsuario = Number(payload.sub);
            if (!Number.isFinite(idUsuario)) {
                return null;
            }
            const cached = (0, auth_user_cache_1.getCachedAuthUser)(idUsuario);
            if (cached?.activo) {
                const pwdAtEsperado = (cached.passwordCambiadoEn ?? cached.creadoEn).getTime();
                if (payload.pwdAt == null || payload.pwdAt < pwdAtEsperado) {
                    return null;
                }
                if (payload.tid != null &&
                    Number(payload.tid) !== cached.idRestaurante) {
                    return null;
                }
                return {
                    idUsuario: cached.idUsuario,
                    idRestaurante: cached.idRestaurante,
                    rol: cached.rol.nombre,
                };
            }
            const user = await this.prisma.usuario.findUnique({
                where: { idUsuario },
                include: { rol: true },
            });
            if (!user?.activo) {
                return null;
            }
            const pwdAtEsperado = (user.passwordCambiadoEn ?? user.creadoEn).getTime();
            if (payload.pwdAt == null || payload.pwdAt < pwdAtEsperado) {
                return null;
            }
            if (payload.tid != null &&
                Number(payload.tid) !== user.idRestaurante) {
                return null;
            }
            (0, auth_user_cache_1.setCachedAuthUser)(user);
            return {
                idUsuario: user.idUsuario,
                idRestaurante: user.idRestaurante,
                rol: user.rol.nombre,
            };
        }
        catch {
            return null;
        }
    }
    joinRoleRooms(client, user) {
        const tid = user.idRestaurante;
        void client.join((0, tenant_rooms_1.tenantBaseRoom)(tid));
        void client.join((0, tenant_rooms_1.tenantRoom)(`rol:${user.rol}`, tid));
        void client.join((0, tenant_rooms_1.tenantRoom)(`usuario:${user.idUsuario}`, tid));
        if (user.rol === 'mesero' || user.rol === 'admin') {
            void client.join((0, tenant_rooms_1.tenantRoom)(`mesero:${user.idUsuario}`, tid));
        }
    }
    async handleConnection(client) {
        const user = await this.authenticate(client);
        if (!user) {
            client.disconnect(true);
            return;
        }
        client.data.user = user;
        this.joinRoleRooms(client, user);
    }
    async handleJoin(client, data) {
        const user = client.data.user;
        if (!user) {
            return { ok: false, error: 'no_auth' };
        }
        const tid = user.idRestaurante;
        if (data?.cocina && (user.rol === 'chef' || user.rol === 'admin')) {
            void client.join((0, tenant_rooms_1.tenantRoom)('cocina', tid));
        }
        if (data?.resumen && user.rol === 'admin') {
            void client.join((0, tenant_rooms_1.tenantRoom)('resumen', tid));
        }
        if (data?.mesaId != null) {
            const autorizado = await this.puedeUnirseMesa(user, data.mesaId);
            if (!autorizado) {
                return { ok: false, error: 'mesa_no_autorizada' };
            }
            void client.join((0, tenant_rooms_1.tenantRoom)(`mesa:${data.mesaId}`, tid));
        }
        return { ok: true };
    }
    async puedeUnirseMesa(user, mesaId) {
        const mesa = await this.prisma.mesa.findFirst({
            where: { idMesa: mesaId, idRestaurante: user.idRestaurante },
            select: { idMesa: true },
        });
        if (!mesa)
            return false;
        if (user.rol === 'admin' || user.rol === 'chef') {
            return true;
        }
        if (user.rol !== 'mesero') {
            return false;
        }
        const activos = await this.prisma.pedido.count({
            where: {
                idMesa: mesaId,
                idRestaurante: user.idRestaurante,
                idUsuario: user.idUsuario,
                estado: { in: ['abierto', 'en_cocina'] },
            },
        });
        return activos > 0;
    }
    emitPedidoActualizado(pedidoId, mesaId, idUsuario, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const payload = {
            pedidoId,
            mesaId,
            at: new Date().toISOString(),
        };
        const tid = tenantId;
        this.server.to((0, tenant_rooms_1.tenantRoom)(`mesa:${mesaId}`, tid)).emit('pedido:updated', payload);
        this.server.to((0, tenant_rooms_1.tenantRoom)('cocina', tid)).emit('pedido:updated', payload);
        this.server.to((0, tenant_rooms_1.tenantRoom)('resumen', tid)).emit('pedido:updated', payload);
        this.server.to((0, tenant_rooms_1.tenantRoom)(`mesero:${idUsuario}`, tid)).emit('pedido:updated', payload);
        this.server.to((0, tenant_rooms_1.tenantRoom)('rol:mesero', tid)).emit('mesas:updated', payload);
        this.server.to((0, tenant_rooms_1.tenantRoom)('rol:admin', tid)).emit('mesas:updated', payload);
    }
    emitConfigActualizada(scope, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        if (scope === 'menu') {
            (0, menu_hoy_cache_1.invalidateMenuHoyCache)();
        }
        const payload = { scope, at: new Date().toISOString() };
        for (const rol of ['admin', 'mesero', 'chef']) {
            this.server
                .to((0, tenant_rooms_1.tenantRoom)(`rol:${rol}`, tenantId))
                .emit('config:actualizada', payload);
        }
    }
    emitAuthSesionInvalidada(idUsuario, motivo, mensaje, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const payload = {
            motivo,
            mensaje,
            at: new Date().toISOString(),
        };
        this.server
            .to((0, tenant_rooms_1.tenantRoom)(`usuario:${idUsuario}`, tenantId))
            .emit('auth:sesion-invalidada', payload);
    }
    emitCocinaLlamaMesero(payload, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        this.server
            .to((0, tenant_rooms_1.tenantRoom)(`mesero:${payload.idMesero}`, tenantId))
            .emit('cocina:llama-mesero', payload);
    }
    emitCocinaFaltaPlato(payload, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        this.server
            .to((0, tenant_rooms_1.tenantRoom)('cocina', tenantId))
            .emit('cocina:falta-plato', payload);
    }
    emitCompaneroAgregoItems(payload, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const destinos = [
            (0, tenant_rooms_1.tenantRoom)(`mesero:${payload.idMeseroDueno}`, tenantId),
            (0, tenant_rooms_1.tenantRoom)(`usuario:${payload.idMeseroDueno}`, tenantId),
        ];
        for (const room of destinos) {
            this.server.to(room).emit('mesero:companero-agrego', payload);
        }
    }
    emitImpresoraAlerta(payload, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        for (const rol of ['admin', 'mesero', 'chef']) {
            this.server
                .to((0, tenant_rooms_1.tenantRoom)(`rol:${rol}`, tenantId))
                .emit('impresora:alerta', payload);
        }
    }
};
exports.PedidosGateway = PedidosGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], PedidosGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], PedidosGateway.prototype, "handleJoin", null);
exports.PedidosGateway = PedidosGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*' },
        transports: ['websocket', 'polling'],
        maxHttpBufferSize: 256 * 1024,
        pingTimeout: 20_000,
        pingInterval: 25_000,
        connectTimeout: 10_000,
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService])
], PedidosGateway);
//# sourceMappingURL=pedidos.gateway.js.map