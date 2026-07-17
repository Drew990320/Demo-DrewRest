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
var PermisosService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermisosService = void 0;
const common_1 = require("@nestjs/common");
const permisos_chef_1 = require("@drewrest/shared-domain/permisos-chef");
const permisos_mesero_1 = require("@drewrest/shared-domain/permisos-mesero");
const fecha_bogota_db_1 = require("../common/fecha-bogota-db");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_constants_1 = require("../tenant/tenant.constants");
const usuario_display_1 = require("../usuarios/usuario-display");
const CAMPO_PRISMA = {
    agregar_items: 'agregarItems',
    editar_cantidades: 'editarCantidades',
    quitar_lineas: 'quitarLineas',
    enviar_cocina: 'enviarCocina',
    reimprimir_comanda: 'reimprimirComanda',
    cobrar: 'cobrar',
    precuenta: 'precuenta',
    reimprimir_factura: 'reimprimirFactura',
    cancelar_pedido: 'cancelarPedido',
    transferir_mesa: 'transferirMesa',
    agrupar_mesas: 'agruparMesas',
    ayuda_companeros: 'ayudaCompaneros',
};
const CAMPO_CHEF_PRISMA = {
    ver_cola_cocina: 'verColaCocina',
    marcar_listo: 'marcarListo',
    reimprimir_comanda: 'reimprimirComanda',
    anular_linea_cocina: 'anularLineaCocina',
};
let PermisosService = class PermisosService {
    static { PermisosService_1 = this; }
    prisma;
    cache = new Map();
    chefCache = new Map();
    static CACHE_TTL_MS = 30_000;
    constructor(prisma) {
        this.prisma = prisma;
    }
    invalidateCache(tenantId) {
        if (tenantId == null) {
            this.cache.clear();
            this.chefCache.clear();
            return;
        }
        this.cache.delete(tenantId);
        this.chefCache.delete(tenantId);
    }
    mapRow(row) {
        return {
            agregar_items: row.agregarItems,
            editar_cantidades: row.editarCantidades,
            quitar_lineas: row.quitarLineas,
            enviar_cocina: row.enviarCocina,
            reimprimir_comanda: row.reimprimirComanda,
            cobrar: row.cobrar,
            precuenta: row.precuenta,
            reimprimir_factura: row.reimprimirFactura,
            cancelar_pedido: row.cancelarPedido,
            transferir_mesa: row.transferirMesa,
            agrupar_mesas: row.agruparMesas,
            ayuda_companeros: row.ayudaCompaneros,
        };
    }
    async obtenerConfigRow(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const now = Date.now();
        const cached = this.cache.get(tenantId);
        if (cached && cached.expiresAt > now) {
            return cached.row;
        }
        let row = await this.prisma.permisosMeseroConfig.findUnique({
            where: { idRestaurante: tenantId },
        });
        if (!row) {
            row = await this.prisma.permisosMeseroConfig.create({
                data: { idRestaurante: tenantId },
            });
        }
        this.cache.set(tenantId, { row, expiresAt: now + PermisosService_1.CACHE_TTL_MS });
        return row;
    }
    async obtenerConfigChefRow(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const now = Date.now();
        const cached = this.chefCache.get(tenantId);
        if (cached && cached.expiresAt > now) {
            return cached.row;
        }
        let row = await this.prisma.permisosChefConfig.findUnique({
            where: { idRestaurante: tenantId },
        });
        if (!row) {
            row = await this.prisma.permisosChefConfig.create({
                data: { idRestaurante: tenantId },
            });
        }
        this.chefCache.set(tenantId, {
            row,
            expiresAt: now + PermisosService_1.CACHE_TTL_MS,
        });
        return row;
    }
    mapChefRow(row) {
        return {
            ver_cola_cocina: row.verColaCocina,
            marcar_listo: row.marcarListo,
            reimprimir_comanda: row.reimprimirComanda,
            anular_linea_cocina: row.anularLineaCocina,
        };
    }
    async obtenerConfigChef(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        return this.mapChefRow(await this.obtenerConfigChefRow(tenantId));
    }
    async actualizarConfigChef(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const data = {};
        for (const key of permisos_chef_1.PERMISOS_CHEF_KEYS) {
            if (dto[key] !== undefined) {
                data[CAMPO_CHEF_PRISMA[key]] = dto[key];
            }
        }
        const row = await this.prisma.permisosChefConfig.upsert({
            where: { idRestaurante: tenantId },
            create: {
                idRestaurante: tenantId,
                ...Object.fromEntries(permisos_chef_1.PERMISOS_CHEF_KEYS.map((k) => [
                    CAMPO_CHEF_PRISMA[k],
                    dto[k] ?? permisos_chef_1.PERMISOS_CHEF_DEFAULTS[k],
                ])),
            },
            update: data,
        });
        this.chefCache.delete(tenantId);
        return this.mapChefRow(row);
    }
    async obtenerConfig(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        return this.mapRow(await this.obtenerConfigRow(tenantId));
    }
    async actualizarConfig(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const data = {};
        for (const key of permisos_mesero_1.PERMISOS_MESERO_KEYS) {
            if (dto[key] !== undefined) {
                data[CAMPO_PRISMA[key]] = dto[key];
            }
        }
        const row = await this.prisma.permisosMeseroConfig.upsert({
            where: { idRestaurante: tenantId },
            create: {
                idRestaurante: tenantId,
                ...Object.fromEntries(permisos_mesero_1.PERMISOS_MESERO_KEYS.map((k) => [
                    CAMPO_PRISMA[k],
                    dto[k] ?? permisos_mesero_1.PERMISOS_MESERO_DEFAULTS[k],
                ])),
            },
            update: data,
        });
        this.invalidateCache(tenantId);
        return this.mapRow(row);
    }
    async puedeCerrarAnulando(idUsuario, rol) {
        if (rol === 'admin')
            return true;
        if (rol !== 'mesero')
            return false;
        const { date } = (0, fecha_bogota_db_1.fechaBogotaDb)();
        const row = await this.prisma.delegacionMeseroTurno.findUnique({
            where: {
                fecha_tipo: { fecha: date, tipo: 'cierre_con_anulacion' },
            },
        });
        return row?.idUsuario === idUsuario;
    }
    async getEfectivos(idUsuario, rol, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        if (rol === 'admin' || rol === 'superadmin') {
            return (0, permisos_mesero_1.permisosMeseroTodos)();
        }
        if (rol === 'chef') {
            const chef = await this.obtenerConfigChef(tenantId);
            return {
                agregar_items: false,
                editar_cantidades: false,
                quitar_lineas: false,
                enviar_cocina: false,
                reimprimir_comanda: chef.reimprimir_comanda,
                cobrar: false,
                precuenta: false,
                reimprimir_factura: false,
                cancelar_pedido: false,
                transferir_mesa: false,
                agrupar_mesas: false,
                ayuda_companeros: false,
                puede_cerrar_anulando: false,
                es_admin: false,
                permisos_chef: chef,
            };
        }
        if (rol !== 'mesero') {
            return {
                ...Object.fromEntries(permisos_mesero_1.PERMISOS_MESERO_KEYS.map((k) => [k, false])),
                puede_cerrar_anulando: false,
                es_admin: false,
            };
        }
        const config = await this.obtenerConfig(tenantId);
        return {
            ...config,
            puede_cerrar_anulando: await this.puedeCerrarAnulando(idUsuario, rol),
            es_admin: false,
        };
    }
    async assertPermiso(actor, permiso, opts) {
        const rol = actor.rol.nombre;
        if (rol === 'admin' || rol === 'superadmin')
            return;
        if (opts?.permitirChef && rol === 'chef')
            return;
        if (rol !== 'mesero') {
            throw new common_1.ForbiddenException('No tienes permiso para esta acción');
        }
        const tenantId = actor.idRestaurante ?? tenant_constants_1.DEFAULT_TENANT_ID;
        const efectivos = await this.getEfectivos(actor.idUsuario, rol, tenantId);
        if (!efectivos[permiso]) {
            throw new common_1.ForbiddenException('No tienes permiso para esta acción');
        }
    }
    async resumenAdmin(fecha, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const { iso, date } = (0, fecha_bogota_db_1.fechaBogotaDb)(fecha);
        const [config, chef, meseros, delegacion] = await Promise.all([
            this.obtenerConfig(tenantId),
            this.obtenerConfigChef(tenantId),
            this.prisma.usuario.findMany({
                where: {
                    idRestaurante: tenantId,
                    rol: { nombre: 'mesero' },
                    activo: true,
                },
                include: { rol: true },
                orderBy: [{ nombre: 'asc' }, { apellido: 'asc' }],
            }),
            this.prisma.delegacionMeseroTurno.findUnique({
                where: {
                    fecha_tipo: { fecha: date, tipo: 'cierre_con_anulacion' },
                },
                include: { mesero: { include: { rol: true } } },
            }),
        ]);
        return {
            fecha: iso,
            permisos_mesero: config,
            permisos_chef: chef,
            delegacion_cierre_anulacion: delegacion
                ? {
                    id_usuario: delegacion.idUsuario,
                    nombre: (0, usuario_display_1.nombreUsuarioPublico)(delegacion.mesero.nombre, delegacion.mesero.apellido, delegacion.mesero.rol.nombre).nombre,
                    apellido: (0, usuario_display_1.nombreUsuarioPublico)(delegacion.mesero.nombre, delegacion.mesero.apellido, delegacion.mesero.rol.nombre).apellido,
                    asignado_en: delegacion.creadoEn,
                }
                : null,
            meseros: meseros.map((m) => {
                const pub = (0, usuario_display_1.nombreUsuarioPublico)(m.nombre, m.apellido, m.rol.nombre);
                return {
                    id_usuario: m.idUsuario,
                    nombre: pub.nombre,
                    apellido: pub.apellido,
                };
            }),
        };
    }
    async asignarDelegacionCierre(dto, idAdmin) {
        const { iso, date } = (0, fecha_bogota_db_1.fechaBogotaDb)(dto.fecha);
        if (dto.id_usuario == null) {
            await this.prisma.delegacionMeseroTurno.deleteMany({
                where: { fecha: date, tipo: 'cierre_con_anulacion' },
            });
            return { fecha: iso, delegacion_cierre_anulacion: null };
        }
        await this.ensureMeseroActivo(dto.id_usuario);
        const row = await this.prisma.delegacionMeseroTurno.upsert({
            where: {
                fecha_tipo: { fecha: date, tipo: 'cierre_con_anulacion' },
            },
            create: {
                fecha: date,
                tipo: 'cierre_con_anulacion',
                idUsuario: dto.id_usuario,
                idUsuarioRegistro: idAdmin,
            },
            update: {
                idUsuario: dto.id_usuario,
                idUsuarioRegistro: idAdmin,
            },
            include: { mesero: { include: { rol: true } } },
        });
        const pub = (0, usuario_display_1.nombreUsuarioPublico)(row.mesero.nombre, row.mesero.apellido, row.mesero.rol.nombre);
        return {
            fecha: iso,
            delegacion_cierre_anulacion: {
                id_usuario: row.idUsuario,
                nombre: pub.nombre,
                apellido: pub.apellido,
                asignado_en: row.creadoEn,
            },
        };
    }
    async miDelegacionHoy(idUsuario, rol) {
        const efectivos = await this.getEfectivos(idUsuario, rol);
        return {
            puede_cerrar_anulando: efectivos.puede_cerrar_anulando,
            es_admin: efectivos.es_admin,
        };
    }
    async ensureMeseroActivo(idUsuario) {
        const u = await this.prisma.usuario.findUnique({
            where: { idUsuario },
            include: { rol: true },
        });
        if (!u || !u.activo || u.rol.nombre !== 'mesero') {
            throw new common_1.BadRequestException('Mesero no encontrado o inactivo');
        }
    }
};
exports.PermisosService = PermisosService;
exports.PermisosService = PermisosService = PermisosService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PermisosService);
//# sourceMappingURL=permisos.service.js.map