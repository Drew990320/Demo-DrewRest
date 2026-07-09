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
exports.MesasService = exports.MESA_PARA_LLEVAR_NUMERO = exports.MESA_MOSTRADOR_NUMERO = void 0;
const common_1 = require("@nestjs/common");
const mesa_dia_1 = require("../common/mesa-dia");
const prisma_service_1 = require("../prisma/prisma.service");
const pedidos_gateway_1 = require("../pedidos/pedidos.gateway");
const timezone_1 = require("../common/timezone");
const tenant_constants_1 = require("../tenant/tenant.constants");
const config_operativa_cache_1 = require("../common/config-operativa-cache");
const usuario_display_1 = require("../usuarios/usuario-display");
const mesa_label_1 = require("@drewrest/shared-domain/mesa-label");
const mesa_admin_validacion_1 = require("@drewrest/shared-domain/mesa-admin-validacion");
var mesa_label_2 = require("@drewrest/shared-domain/mesa-label");
Object.defineProperty(exports, "MESA_MOSTRADOR_NUMERO", { enumerable: true, get: function () { return mesa_label_2.MESA_MOSTRADOR_NUMERO; } });
Object.defineProperty(exports, "MESA_PARA_LLEVAR_NUMERO", { enumerable: true, get: function () { return mesa_label_2.MESA_PARA_LLEVAR_NUMERO; } });
const PEDIDOS_ABIERTOS = ['abierto', 'en_cocina'];
const CAPACIDAD_MESA_DEFAULT = 4;
let MesasService = class MesasService {
    prisma;
    gateway;
    constructor(prisma, gateway) {
        this.prisma = prisma;
        this.gateway = gateway;
    }
    async configMesasVirtuales(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const cached = (0, config_operativa_cache_1.getCachedConfigOperativaRow)(tenantId);
        if (cached) {
            return (0, mesa_label_1.resolverMesasVirtuales)(cached);
        }
        const row = await this.prisma.configOperativa.findUnique({
            where: { idRestaurante: tenantId },
        });
        return (0, mesa_label_1.resolverMesasVirtuales)(row ?? undefined);
    }
    async numerosOcultosGrilla(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        return (0, mesa_label_1.numerosMesasVirtuales)(await this.configMesasVirtuales(tenantId));
    }
    mapLugar(lugar) {
        return {
            id_lugar: lugar?.idLugar ?? null,
            nombre_lugar: lugar?.nombre ?? null,
            orden_lugar: lugar?.orden ?? null,
            lugar_activo: lugar?.activo ?? null,
        };
    }
    mapMesaPublic(m) {
        return {
            id_mesa: m.idMesa,
            numero: m.numero,
            capacidad: m.capacidad,
            estado: m.estado,
            ...this.mapLugar(m.lugar),
        };
    }
    mapMesaAdmin(m, pedidosActivos = 0, totalPedidos = 0) {
        return {
            id_mesa: m.idMesa,
            numero: m.numero,
            capacidad: m.capacidad,
            estado: m.estado,
            ...this.mapLugar(m.lugar),
            pedidos_activos: pedidosActivos,
            total_pedidos: totalPedidos,
            disponible_lunes: m.disponibleLunes,
            disponible_martes: m.disponibleMartes,
            disponible_miercoles: m.disponibleMiercoles,
            disponible_jueves: m.disponibleJueves,
            disponible_viernes: m.disponibleViernes,
            disponible_sabado: m.disponibleSabado,
            disponible_domingo: m.disponibleDomingo,
        };
    }
    async ensureLugarMesaActiva(idLugar, tenantId) {
        const lugar = await this.prisma.lugarMesa.findFirst({
            where: { idLugar, idRestaurante: tenantId },
        });
        if (!lugar || !lugar.activo) {
            throw new common_1.BadRequestException('Debes seleccionar un lugar activo para la mesa.');
        }
        return lugar;
    }
    async ensureLugarParaMesaNormal(numeroMesa, tenantId, idLugar) {
        const mv = await this.configMesasVirtuales(tenantId);
        const esVirtual = numeroMesa === mv.numero_mesa_mostrador ||
            numeroMesa === mv.numero_mesa_para_llevar;
        if (esVirtual) {
            return null;
        }
        if (idLugar == null) {
            throw new common_1.BadRequestException('Las mesas normales deben pertenecer a un lugar.');
        }
        return this.ensureLugarMesaActiva(idLugar, tenantId);
    }
    async listarVisiblesHoy(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const weekday = (0, timezone_1.weekdayBogota)();
        const campo = (0, mesa_dia_1.campoDisponibilidadMesaParaWeekday)(weekday);
        if (!campo) {
            return [];
        }
        const ocultas = await this.numerosOcultosGrilla(tenantId);
        const mesas = await this.prisma.mesa.findMany({
            where: {
                idRestaurante: tenantId,
                numero: { notIn: ocultas },
                [campo]: true,
                OR: [{ idLugar: null }, { lugar: { activo: true } }],
            },
            include: { lugar: true },
            orderBy: [{ lugar: { orden: 'asc' } }, { numero: 'asc' }],
        });
        const ocupadasIds = mesas
            .filter((m) => m.estado === 'ocupada')
            .map((m) => m.idMesa);
        const pedidosActivos = ocupadasIds.length > 0
            ? await this.prisma.pedido.findMany({
                where: {
                    idMesa: { in: ocupadasIds },
                    estado: { in: ['abierto', 'en_cocina'] },
                },
                include: { usuario: { include: { rol: true } } },
                orderBy: { idPedido: 'desc' },
            })
            : [];
        const meseroPorMesa = new Map();
        for (const p of pedidosActivos) {
            if (!meseroPorMesa.has(p.idMesa)) {
                meseroPorMesa.set(p.idMesa, {
                    ...(0, usuario_display_1.nombreUsuarioPublico)(p.usuario.nombre, p.usuario.apellido, p.usuario.rol.nombre),
                });
            }
        }
        return mesas.map((m) => ({
            ...this.mapMesaPublic(m),
            mesero: meseroPorMesa.get(m.idMesa) ?? null,
        }));
    }
    async listarTodasAdmin(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const mesas = await this.prisma.mesa.findMany({
            where: { idRestaurante: tenantId },
            include: { lugar: true },
            orderBy: [{ lugar: { orden: 'asc' } }, { numero: 'asc' }],
        });
        const conteosActivos = await this.prisma.pedido.groupBy({
            by: ['idMesa'],
            where: { estado: { in: [...PEDIDOS_ABIERTOS] } },
            _count: { idPedido: true },
        });
        const conteosTotal = await this.prisma.pedido.groupBy({
            by: ['idMesa'],
            _count: { idPedido: true },
        });
        const activosPorMesa = new Map(conteosActivos.map((c) => [c.idMesa, c._count.idPedido]));
        const totalPorMesa = new Map(conteosTotal.map((c) => [c.idMesa, c._count.idPedido]));
        return mesas.map((m) => this.mapMesaAdmin(m, activosPorMesa.get(m.idMesa) ?? 0, totalPorMesa.get(m.idMesa) ?? 0));
    }
    async crearMesa(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const mv = await this.configMesasVirtuales(tenantId);
        const reservado = (0, mesa_admin_validacion_1.validarNumeroMesaReservado)(dto.numero, mv);
        if (!reservado.ok) {
            throw new common_1.BadRequestException(reservado.mensaje);
        }
        const existe = await this.prisma.mesa.findUnique({
            where: {
                idRestaurante_numero: { idRestaurante: tenantId, numero: dto.numero },
            },
        });
        if (existe) {
            throw new common_1.BadRequestException('Ya existe una mesa con ese número.');
        }
        const lugar = await this.ensureLugarParaMesaNormal(dto.numero, tenantId, dto.id_lugar);
        const creada = await this.prisma.mesa.create({
            data: {
                idRestaurante: tenantId,
                idLugar: lugar?.idLugar ?? null,
                numero: dto.numero,
                capacidad: dto.capacidad ?? CAPACIDAD_MESA_DEFAULT,
                disponibleLunes: dto.disponible_lunes ?? true,
                disponibleMartes: dto.disponible_martes ?? true,
                disponibleMiercoles: dto.disponible_miercoles ?? true,
                disponibleJueves: dto.disponible_jueves ?? true,
                disponibleViernes: dto.disponible_viernes ?? true,
                disponibleSabado: dto.disponible_sabado ?? true,
                disponibleDomingo: dto.disponible_domingo ?? true,
            },
            include: { lugar: true },
        });
        this.gateway.emitConfigActualizada('mesas', tenantId);
        return this.mapMesaAdmin(creada, 0, 0);
    }
    flagsSnakeMesa(m) {
        return {
            disponible_lunes: m.disponibleLunes,
            disponible_martes: m.disponibleMartes,
            disponible_miercoles: m.disponibleMiercoles,
            disponible_jueves: m.disponibleJueves,
            disponible_viernes: m.disponibleViernes,
            disponible_sabado: m.disponibleSabado,
            disponible_domingo: m.disponibleDomingo,
        };
    }
    patchDisponibilidadDesdeDto(dto) {
        const patch = {};
        if (dto.disponible_lunes != null) {
            patch.disponible_lunes = dto.disponible_lunes;
        }
        if (dto.disponible_martes != null) {
            patch.disponible_martes = dto.disponible_martes;
        }
        if (dto.disponible_miercoles != null) {
            patch.disponible_miercoles = dto.disponible_miercoles;
        }
        if (dto.disponible_jueves != null) {
            patch.disponible_jueves = dto.disponible_jueves;
        }
        if (dto.disponible_viernes != null) {
            patch.disponible_viernes = dto.disponible_viernes;
        }
        if (dto.disponible_sabado != null) {
            patch.disponible_sabado = dto.disponible_sabado;
        }
        if (dto.disponible_domingo != null) {
            patch.disponible_domingo = dto.disponible_domingo;
        }
        return patch;
    }
    async contarPedidosActivosMesa(idMesa) {
        return this.prisma.pedido.count({
            where: {
                idMesa,
                estado: { in: [...PEDIDOS_ABIERTOS] },
            },
        });
    }
    async contarTotalPedidosMesa(idMesa) {
        return this.prisma.pedido.count({ where: { idMesa } });
    }
    async contadoresPedidosMesa(idMesa) {
        const [activos, total] = await Promise.all([
            this.contarPedidosActivosMesa(idMesa),
            this.contarTotalPedidosMesa(idMesa),
        ]);
        return { activos, total };
    }
    async actualizarMesa(idMesa, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const m = await this.prisma.mesa.findFirst({
            where: { idMesa, idRestaurante: tenantId },
            include: { lugar: true },
        });
        if (!m) {
            throw new common_1.NotFoundException('Mesa no encontrada');
        }
        const mv = await this.configMesasVirtuales(tenantId);
        if (dto.numero != null && dto.numero !== m.numero) {
            const { activos: pedidosActivos } = await this.contadoresPedidosMesa(idMesa);
            const validacionNumero = (0, mesa_admin_validacion_1.validarCambioNumeroMesaAdmin)({
                numeroActual: m.numero,
                numeroNuevo: dto.numero,
                pedidosActivos,
                mesasVirtuales: mv,
            });
            if (!validacionNumero.ok) {
                throw new common_1.ConflictException(validacionNumero.mensaje);
            }
            const existe = await this.prisma.mesa.findUnique({
                where: {
                    idRestaurante_numero: {
                        idRestaurante: tenantId,
                        numero: dto.numero,
                    },
                },
            });
            if (existe) {
                throw new common_1.BadRequestException('Ya existe una mesa con ese número.');
            }
        }
        const patchDisponibilidad = this.patchDisponibilidadDesdeDto(dto);
        if (Object.keys(patchDisponibilidad).length > 0) {
            const pedidosActivos = await this.contarPedidosActivosMesa(idMesa);
            const validacion = (0, mesa_admin_validacion_1.validarPatchMesaAdmin)({
                numeroMesa: m.numero,
                flagsActuales: this.flagsSnakeMesa(m),
                patch: patchDisponibilidad,
                pedidosActivos,
                weekdayHoy: (0, timezone_1.weekdayBogota)(),
                mesasVirtuales: mv,
            });
            if (!validacion.ok) {
                throw new common_1.ConflictException(validacion.mensaje);
            }
        }
        const cambiarLugar = dto.id_lugar !== undefined && (dto.id_lugar ?? null) !== (m.idLugar ?? null);
        if (cambiarLugar) {
            const pedidosActivos = await this.contarPedidosActivosMesa(idMesa);
            if (pedidosActivos > 0) {
                throw new common_1.ConflictException('No puedes mover una mesa de lugar mientras tenga pedidos activos.');
            }
        }
        const numeroFinal = dto.numero ?? m.numero;
        const lugarFinal = await this.ensureLugarParaMesaNormal(numeroFinal, tenantId, dto.id_lugar !== undefined ? dto.id_lugar : m.idLugar);
        const actualizada = await this.prisma.mesa.update({
            where: { idMesa },
            data: {
                idLugar: lugarFinal?.idLugar ?? null,
                ...(dto.numero != null ? { numero: dto.numero } : {}),
                ...(dto.capacidad != null ? { capacidad: dto.capacidad } : {}),
                ...(dto.disponible_lunes != null
                    ? { disponibleLunes: dto.disponible_lunes }
                    : {}),
                ...(dto.disponible_martes != null
                    ? { disponibleMartes: dto.disponible_martes }
                    : {}),
                ...(dto.disponible_miercoles != null
                    ? { disponibleMiercoles: dto.disponible_miercoles }
                    : {}),
                ...(dto.disponible_jueves != null
                    ? { disponibleJueves: dto.disponible_jueves }
                    : {}),
                ...(dto.disponible_viernes != null
                    ? { disponibleViernes: dto.disponible_viernes }
                    : {}),
                ...(dto.disponible_sabado != null
                    ? { disponibleSabado: dto.disponible_sabado }
                    : {}),
                ...(dto.disponible_domingo != null
                    ? { disponibleDomingo: dto.disponible_domingo }
                    : {}),
            },
            include: { lugar: true },
        });
        const { activos, total } = await this.contadoresPedidosMesa(idMesa);
        this.gateway.emitConfigActualizada('mesas', tenantId);
        return this.mapMesaAdmin(actualizada, activos, total);
    }
    async eliminarMesa(idMesa, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const m = await this.prisma.mesa.findFirst({
            where: { idMesa, idRestaurante: tenantId },
        });
        if (!m) {
            throw new common_1.NotFoundException('Mesa no encontrada');
        }
        const { activos, total } = await this.contadoresPedidosMesa(idMesa);
        const mv = await this.configMesasVirtuales(tenantId);
        const validacion = (0, mesa_admin_validacion_1.validarEliminarMesaAdmin)({
            numeroMesa: m.numero,
            pedidosActivos: activos,
            totalPedidos: total,
            mesasVirtuales: mv,
        });
        if (!validacion.ok) {
            throw new common_1.ConflictException(validacion.mensaje);
        }
        await this.prisma.mesa.delete({ where: { idMesa } });
        this.gateway.emitConfigActualizada('mesas', tenantId);
        return { ok: true, id_mesa: idMesa };
    }
    async obtenerPorId(idMesa, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const m = await this.prisma.mesa.findFirst({
            where: { idMesa, idRestaurante: tenantId },
            include: { lugar: true },
        });
        if (!m) {
            throw new common_1.NotFoundException('Mesa no encontrada');
        }
        if (!(0, mesa_dia_1.mesaDisponibleHoyBogota)(m)) {
            throw new common_1.NotFoundException('Mesa no disponible hoy');
        }
        return this.mapMesaPublic(m);
    }
    async getMostrador(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const mv = await this.configMesasVirtuales(tenantId);
        const m = await this.prisma.mesa.findFirst({
            where: {
                idRestaurante: tenantId,
                numero: mv.numero_mesa_mostrador,
            },
            include: { lugar: true },
        });
        if (!m) {
            throw new common_1.NotFoundException(`Mostrador no configurado. Ejecuta el seed o crea la mesa ${mv.numero_mesa_mostrador}.`);
        }
        if (!(0, mesa_dia_1.mesaDisponibleHoyBogota)(m)) {
            throw new common_1.NotFoundException('Mostrador no disponible hoy');
        }
        return this.mapMesaPublic(m);
    }
    async getParaLlevar(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const mv = await this.configMesasVirtuales(tenantId);
        const m = await this.prisma.mesa.findFirst({
            where: {
                idRestaurante: tenantId,
                numero: mv.numero_mesa_para_llevar,
            },
            include: { lugar: true },
        });
        if (!m) {
            throw new common_1.NotFoundException(`Para llevar no configurado. Ejecuta el seed o crea la mesa ${mv.numero_mesa_para_llevar}.`);
        }
        if (!(0, mesa_dia_1.mesaDisponibleHoyBogota)(m)) {
            throw new common_1.NotFoundException('Para llevar no disponible hoy');
        }
        return this.mapMesaPublic(m);
    }
};
exports.MesasService = MesasService;
exports.MesasService = MesasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        pedidos_gateway_1.PedidosGateway])
], MesasService);
//# sourceMappingURL=mesas.service.js.map