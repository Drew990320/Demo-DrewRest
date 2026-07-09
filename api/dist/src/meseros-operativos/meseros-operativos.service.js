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
exports.MeserosOperativosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const permisos_service_1 = require("../permisos/permisos.service");
const pedidos_gateway_1 = require("../pedidos/pedidos.gateway");
const fecha_bogota_db_1 = require("../common/fecha-bogota-db");
const stock_bebida_1 = require("../productos/stock-bebida");
const usuario_display_1 = require("../usuarios/usuario-display");
let MeserosOperativosService = class MeserosOperativosService {
    prisma;
    gateway;
    permisos;
    constructor(prisma, gateway, permisos) {
        this.prisma = prisma;
        this.gateway = gateway;
        this.permisos = permisos;
    }
    parseFechaBogota(fecha) {
        return (0, fecha_bogota_db_1.fechaBogotaDb)(fecha);
    }
    async ctxSodaAlmuerzo(tenantId) {
        const config = await this.prisma.configOperativa.findUnique({
            where: { idRestaurante: tenantId },
            include: {
                productoSodaAlmuerzo: {
                    include: { categoria: { select: { esBebida: true } } },
                },
            },
        });
        if (!config) {
            throw new common_1.NotFoundException('Configuración operativa no encontrada');
        }
        const prod = config.productoSodaAlmuerzo;
        return {
            activo: config.beneficioSodaAlmuerzoActivo,
            descontarStock: config.sodaAlmuerzoDescontarStock,
            idProducto: config.idProductoSodaAlmuerzo,
            producto: prod,
            productoNombre: prod?.nombre ?? null,
            controlStock: prod ? (0, stock_bebida_1.aplicaControlStockBebida)(prod) : false,
            stockDisponible: prod?.stockDisponible ?? null,
        };
    }
    async resumen(fecha, tenantId) {
        const { iso, date } = this.parseFechaBogota(fecha);
        const sodaCfg = await this.ctxSodaAlmuerzo(tenantId);
        const meseros = await this.prisma.usuario.findMany({
            where: { idRestaurante: tenantId, rol: { nombre: 'mesero' }, activo: true },
            include: { rol: true },
            orderBy: [{ nombre: 'asc' }, { apellido: 'asc' }],
        });
        const registros = await this.prisma.registroBeneficioMesero.findMany({
            where: { fecha: date },
            include: { producto: { select: { nombre: true } } },
        });
        const delegacion = await this.prisma.delegacionMeseroTurno.findUnique({
            where: {
                fecha_tipo: { fecha: date, tipo: 'cierre_con_anulacion' },
            },
            include: {
                mesero: { include: { rol: true } },
            },
        });
        const byUser = new Map();
        for (const r of registros) {
            const list = byUser.get(r.idUsuario) ?? [];
            list.push(r);
            byUser.set(r.idUsuario, list);
        }
        let sodasAplicadas = 0;
        let pagosRegistrados = 0;
        let montoPagosTotal = 0;
        const filas = meseros.map((m) => {
            const rs = byUser.get(m.idUsuario) ?? [];
            const soda = rs.find((x) => x.tipo === 'soda_almuerzo') ?? null;
            const pago = rs.find((x) => x.tipo === 'pago_turno') ?? null;
            if (soda)
                sodasAplicadas += 1;
            if (pago) {
                pagosRegistrados += 1;
                montoPagosTotal += Number(pago.monto ?? 0);
            }
            const pub = (0, usuario_display_1.nombreUsuarioPublico)(m.nombre, m.apellido, m.rol.nombre);
            return {
                id_usuario: m.idUsuario,
                nombre: pub.nombre,
                apellido: pub.apellido,
                soda_almuerzo: soda
                    ? {
                        id_registro: soda.idRegistro,
                        cantidad: soda.cantidad,
                        desconto_stock: soda.descontoStock,
                        producto_nombre: soda.producto?.nombre ?? sodaCfg.productoNombre,
                    }
                    : null,
                pago_turno: pago
                    ? {
                        id_registro: pago.idRegistro,
                        monto: Math.round(Number(pago.monto ?? 0)),
                        notas: pago.notas,
                    }
                    : null,
            };
        });
        return {
            fecha: iso,
            delegacion_cierre_anulacion: delegacion
                ? {
                    id_usuario: delegacion.idUsuario,
                    nombre: (0, usuario_display_1.nombreUsuarioPublico)(delegacion.mesero.nombre, delegacion.mesero.apellido, delegacion.mesero.rol.nombre).nombre,
                    apellido: (0, usuario_display_1.nombreUsuarioPublico)(delegacion.mesero.nombre, delegacion.mesero.apellido, delegacion.mesero.rol.nombre).apellido,
                    asignado_en: delegacion.creadoEn,
                }
                : null,
            config: {
                beneficio_soda_almuerzo_activo: sodaCfg.activo,
                id_producto_soda_almuerzo: sodaCfg.idProducto,
                producto_soda_nombre: sodaCfg.productoNombre,
                soda_almuerzo_descontar_stock: sodaCfg.descontarStock,
                producto_control_stock: sodaCfg.controlStock,
                producto_stock_disponible: sodaCfg.stockDisponible,
            },
            meseros: filas,
            totales: {
                sodas_aplicadas: sodasAplicadas,
                pagos_registrados: pagosRegistrados,
                monto_pagos_total: Math.round(montoPagosTotal),
            },
        };
    }
    async upsertPagoTurno(dto, idAdmin, tenantId) {
        const { date } = this.parseFechaBogota(dto.fecha);
        await this.ensureMeseroActivo(dto.id_usuario, tenantId);
        const monto = Math.round(dto.monto);
        const row = await this.prisma.registroBeneficioMesero.upsert({
            where: {
                fecha_idUsuario_tipo: {
                    fecha: date,
                    idUsuario: dto.id_usuario,
                    tipo: 'pago_turno',
                },
            },
            create: {
                fecha: date,
                idUsuario: dto.id_usuario,
                tipo: 'pago_turno',
                monto,
                notas: dto.notas?.trim() || null,
                idUsuarioRegistro: idAdmin,
            },
            update: {
                monto,
                notas: dto.notas?.trim() || null,
                idUsuarioRegistro: idAdmin,
            },
        });
        return {
            id_registro: row.idRegistro,
            monto: Math.round(Number(row.monto ?? 0)),
            notas: row.notas,
        };
    }
    async aplicarSodaAlmuerzoTodos(dto, idAdmin, tenantId) {
        const { iso, date } = this.parseFechaBogota(dto.fecha);
        const sodaCfg = await this.ctxSodaAlmuerzo(tenantId);
        if (!sodaCfg.activo) {
            throw new common_1.BadRequestException('Activa el beneficio de soda almuerzo en Configuración');
        }
        if (!sodaCfg.idProducto || !sodaCfg.producto) {
            throw new common_1.BadRequestException('Indica el producto de soda almuerzo en Configuración');
        }
        const meseros = await this.prisma.usuario.findMany({
            where: { idRestaurante: tenantId, rol: { nombre: 'mesero' }, activo: true },
            select: { idUsuario: true },
        });
        let aplicados = 0;
        let omitidos = 0;
        let stockDescontado = false;
        await this.prisma.$transaction(async (tx) => {
            for (const m of meseros) {
                const existing = await tx.registroBeneficioMesero.findUnique({
                    where: {
                        fecha_idUsuario_tipo: {
                            fecha: date,
                            idUsuario: m.idUsuario,
                            tipo: 'soda_almuerzo',
                        },
                    },
                });
                if (existing) {
                    omitidos += 1;
                    continue;
                }
                let desconto = false;
                if (sodaCfg.descontarStock && sodaCfg.producto) {
                    const prodFresh = await tx.producto.findUnique({
                        where: { idProducto: sodaCfg.producto.idProducto },
                        include: { categoria: { select: { esBebida: true } } },
                    });
                    if (prodFresh && (0, stock_bebida_1.aplicaControlStockBebida)(prodFresh)) {
                        await (0, stock_bebida_1.descontarStockBebidaTx)(tx, prodFresh, 1);
                        desconto = true;
                        stockDescontado = true;
                    }
                }
                await tx.registroBeneficioMesero.create({
                    data: {
                        fecha: date,
                        idUsuario: m.idUsuario,
                        tipo: 'soda_almuerzo',
                        idProducto: sodaCfg.idProducto,
                        cantidad: 1,
                        descontoStock: desconto,
                        idUsuarioRegistro: idAdmin,
                    },
                });
                aplicados += 1;
            }
        });
        if (stockDescontado) {
            this.gateway.emitConfigActualizada('menu', tenantId);
        }
        return {
            fecha: iso,
            aplicados,
            omitidos,
            total_meseros: meseros.length,
        };
    }
    async aplicarSodaAlmuerzoMesero(dto, idAdmin, tenantId) {
        const { iso, date } = this.parseFechaBogota(dto.fecha);
        const sodaCfg = await this.ctxSodaAlmuerzo(tenantId);
        if (!sodaCfg.activo) {
            throw new common_1.BadRequestException('Activa el beneficio de soda almuerzo en Configuración');
        }
        if (!sodaCfg.idProducto || !sodaCfg.producto) {
            throw new common_1.BadRequestException('Indica el producto de soda almuerzo en Configuración');
        }
        await this.ensureMeseroActivo(dto.id_usuario, tenantId);
        const existing = await this.prisma.registroBeneficioMesero.findUnique({
            where: {
                fecha_idUsuario_tipo: {
                    fecha: date,
                    idUsuario: dto.id_usuario,
                    tipo: 'soda_almuerzo',
                },
            },
        });
        if (existing) {
            throw new common_1.ConflictException('Este mesero ya tiene soda de almuerzo hoy');
        }
        let desconto = false;
        await this.prisma.$transaction(async (tx) => {
            if (sodaCfg.descontarStock && sodaCfg.producto) {
                const prodFresh = await tx.producto.findUnique({
                    where: { idProducto: sodaCfg.producto.idProducto },
                    include: { categoria: { select: { esBebida: true } } },
                });
                if (prodFresh && (0, stock_bebida_1.aplicaControlStockBebida)(prodFresh)) {
                    await (0, stock_bebida_1.descontarStockBebidaTx)(tx, prodFresh, 1);
                    desconto = true;
                }
            }
            await tx.registroBeneficioMesero.create({
                data: {
                    fecha: date,
                    idUsuario: dto.id_usuario,
                    tipo: 'soda_almuerzo',
                    idProducto: sodaCfg.idProducto,
                    cantidad: 1,
                    descontoStock: desconto,
                    idUsuarioRegistro: idAdmin,
                },
            });
        });
        if (desconto) {
            this.gateway.emitConfigActualizada('menu', tenantId);
        }
        return { fecha: iso, id_usuario: dto.id_usuario, desconto_stock: desconto };
    }
    async eliminarRegistro(idRegistro, tenantId) {
        const row = await this.prisma.registroBeneficioMesero.findUnique({
            where: { idRegistro },
            include: {
                mesero: { select: { idRestaurante: true } },
                producto: { include: { categoria: { select: { esBebida: true } } } },
            },
        });
        if (!row) {
            throw new common_1.NotFoundException('Registro no encontrado');
        }
        if (row.mesero.idRestaurante !== tenantId) {
            throw new common_1.NotFoundException('Registro no encontrado');
        }
        await this.prisma.$transaction(async (tx) => {
            if (row.descontoStock && row.producto) {
                await (0, stock_bebida_1.reintegrarStockBebidaTx)(tx, row.producto, row.cantidad);
            }
            await tx.registroBeneficioMesero.delete({
                where: { idRegistro },
            });
        });
        if (row.descontoStock) {
            this.gateway.emitConfigActualizada('menu', tenantId);
        }
        return { ok: true };
    }
    async asignarDelegacionCierre(dto, idAdmin, tenantId) {
        const { iso, date } = this.parseFechaBogota(dto.fecha);
        if (dto.id_usuario == null) {
            await this.prisma.delegacionMeseroTurno.deleteMany({
                where: { fecha: date, tipo: 'cierre_con_anulacion' },
            });
            return { fecha: iso, delegacion_cierre_anulacion: null };
        }
        await this.ensureMeseroActivo(dto.id_usuario, tenantId);
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
        return this.permisos.miDelegacionHoy(idUsuario, rol);
    }
    async ensureMeseroActivo(idUsuario, tenantId) {
        const u = await this.prisma.usuario.findFirst({
            where: { idUsuario, idRestaurante: tenantId },
            include: { rol: true },
        });
        if (!u || !u.activo || u.rol.nombre !== 'mesero') {
            throw new common_1.BadRequestException('Mesero no encontrado o inactivo');
        }
    }
};
exports.MeserosOperativosService = MeserosOperativosService;
exports.MeserosOperativosService = MeserosOperativosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        pedidos_gateway_1.PedidosGateway,
        permisos_service_1.PermisosService])
], MeserosOperativosService);
//# sourceMappingURL=meseros-operativos.service.js.map