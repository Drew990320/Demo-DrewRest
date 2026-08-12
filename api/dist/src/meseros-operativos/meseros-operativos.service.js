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
const repartir_monto_cop_1 = require("@drewrest/shared-domain/repartir-monto-cop");
const CLAVE_PAGO = 'pago';
function claveDescuento(idBeneficioTurno) {
    return `d:${idBeneficioTurno}`;
}
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
    serializeBeneficio(b) {
        const prod = b.producto ?? null;
        return {
            id_beneficio_turno: b.idBeneficioTurno,
            id_producto: b.idProducto,
            producto_nombre: prod?.nombre ?? null,
            precio_producto: prod != null ? Math.round(Number(prod.precio)) : null,
            monto_descuento: Math.round(Number(b.montoDescuento)),
            descontar_stock: b.descontarStock,
            activo: b.activo,
            orden: b.orden,
            control_stock: Boolean(prod?.controlStock && prod.categoria?.esBebida),
            stock_disponible: prod?.stockDisponible ?? null,
        };
    }
    async listBeneficios(tenantId) {
        const rows = await this.prisma.beneficioTurnoProducto.findMany({
            where: { idRestaurante: tenantId },
            include: {
                producto: {
                    include: { categoria: { select: { esBebida: true } } },
                },
            },
            orderBy: [{ orden: 'asc' }, { idBeneficioTurno: 'asc' }],
        });
        return rows.map((b) => this.serializeBeneficio(b));
    }
    async crearBeneficio(dto, tenantId) {
        const producto = await this.prisma.producto.findFirst({
            where: {
                idProducto: dto.id_producto,
                categoria: { idRestaurante: tenantId },
            },
        });
        if (!producto) {
            throw new common_1.BadRequestException('Producto no encontrado');
        }
        const monto = Math.round(dto.monto_descuento);
        if (monto < 0) {
            throw new common_1.BadRequestException('El descuento no puede ser negativo');
        }
        try {
            const row = await this.prisma.beneficioTurnoProducto.create({
                data: {
                    idRestaurante: tenantId,
                    idProducto: dto.id_producto,
                    montoDescuento: monto,
                    descontarStock: dto.descontar_stock !== false,
                    activo: dto.activo !== false,
                    orden: dto.orden ?? 0,
                },
                include: {
                    producto: {
                        include: { categoria: { select: { esBebida: true } } },
                    },
                },
            });
            return this.serializeBeneficio(row);
        }
        catch {
            throw new common_1.ConflictException('Ya existe un beneficio de turno para ese producto');
        }
    }
    async actualizarBeneficio(idBeneficioTurno, dto, tenantId) {
        const existing = await this.prisma.beneficioTurnoProducto.findFirst({
            where: { idBeneficioTurno, idRestaurante: tenantId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Beneficio no encontrado');
        }
        const row = await this.prisma.beneficioTurnoProducto.update({
            where: { idBeneficioTurno },
            data: {
                ...(dto.monto_descuento != null
                    ? { montoDescuento: Math.round(dto.monto_descuento) }
                    : {}),
                ...(dto.descontar_stock != null
                    ? { descontarStock: dto.descontar_stock }
                    : {}),
                ...(dto.activo != null ? { activo: dto.activo } : {}),
                ...(dto.orden != null ? { orden: dto.orden } : {}),
            },
            include: {
                producto: {
                    include: { categoria: { select: { esBebida: true } } },
                },
            },
        });
        return this.serializeBeneficio(row);
    }
    async eliminarBeneficio(idBeneficioTurno, tenantId) {
        const existing = await this.prisma.beneficioTurnoProducto.findFirst({
            where: { idBeneficioTurno, idRestaurante: tenantId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Beneficio no encontrado');
        }
        await this.prisma.beneficioTurnoProducto.delete({
            where: { idBeneficioTurno },
        });
        return { ok: true };
    }
    async resumen(fecha, tenantId) {
        const { iso, date } = this.parseFechaBogota(fecha);
        const beneficios = await this.listBeneficios(tenantId);
        const beneficiosActivos = beneficios.filter((b) => b.activo);
        const meseros = await this.prisma.usuario.findMany({
            where: { idRestaurante: tenantId, rol: { nombre: 'mesero' }, activo: true },
            include: { rol: true },
            orderBy: [{ nombre: 'asc' }, { apellido: 'asc' }],
        });
        const registros = await this.prisma.registroBeneficioMesero.findMany({
            where: {
                fecha: date,
                mesero: { idRestaurante: tenantId },
            },
            include: {
                producto: { select: { nombre: true } },
                beneficioTurno: { select: { idBeneficioTurno: true } },
            },
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
        let descuentosAplicados = 0;
        let montoDescuentosTotal = 0;
        let pagosRegistrados = 0;
        let montoPagosTotal = 0;
        const filas = meseros.map((m) => {
            const rs = byUser.get(m.idUsuario) ?? [];
            const pago = rs.find((x) => x.tipo === 'pago_turno') ?? null;
            if (pago) {
                pagosRegistrados += 1;
                montoPagosTotal += Number(pago.monto ?? 0);
            }
            const descuentos = rs
                .filter((x) => x.tipo === 'descuento_turno' || x.tipo === 'soda_almuerzo')
                .map((d) => {
                descuentosAplicados += 1;
                montoDescuentosTotal += Number(d.monto ?? 0);
                return {
                    id_registro: d.idRegistro,
                    id_beneficio_turno: d.idBeneficioTurno,
                    id_producto: d.idProducto,
                    producto_nombre: d.producto?.nombre ?? null,
                    monto_descuento: Math.round(Number(d.monto ?? 0)),
                    cantidad: d.cantidad,
                    desconto_stock: d.descontoStock,
                };
            });
            const pub = (0, usuario_display_1.nombreUsuarioPublico)(m.nombre, m.apellido, m.rol.nombre);
            return {
                id_usuario: m.idUsuario,
                nombre: pub.nombre,
                apellido: pub.apellido,
                descuentos,
                pago_turno: pago
                    ? {
                        id_registro: pago.idRegistro,
                        monto: Math.round(Number(pago.monto ?? 0)),
                        notas: pago.notas,
                    }
                    : null,
            };
        });
        const delPub = delegacion
            ? (0, usuario_display_1.nombreUsuarioPublico)(delegacion.mesero.nombre, delegacion.mesero.apellido, delegacion.mesero.rol.nombre)
            : null;
        return {
            fecha: iso,
            delegacion_cierre_anulacion: delegacion
                ? {
                    id_usuario: delegacion.idUsuario,
                    nombre: delPub.nombre,
                    apellido: delPub.apellido,
                    asignado_en: delegacion.creadoEn.toISOString(),
                }
                : null,
            beneficios,
            beneficios_activos: beneficiosActivos,
            meseros: filas,
            totales: {
                descuentos_aplicados: descuentosAplicados,
                monto_descuentos_total: Math.round(montoDescuentosTotal),
                pagos_registrados: pagosRegistrados,
                monto_pagos_total: Math.round(montoPagosTotal),
                beneficios_configurados: beneficios.length,
                beneficios_activos: beneficiosActivos.length,
            },
        };
    }
    async upsertPagoTurno(dto, idAdmin, tenantId) {
        const { date } = this.parseFechaBogota(dto.fecha);
        await this.ensureMeseroActivo(dto.id_usuario, tenantId);
        const monto = Math.round(dto.monto);
        const row = await this.prisma.registroBeneficioMesero.upsert({
            where: {
                fecha_idUsuario_claveUnica: {
                    fecha: date,
                    idUsuario: dto.id_usuario,
                    claveUnica: CLAVE_PAGO,
                },
            },
            create: {
                fecha: date,
                idUsuario: dto.id_usuario,
                tipo: 'pago_turno',
                claveUnica: CLAVE_PAGO,
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
    async repartirPagoTurno(dto, idAdmin, tenantId) {
        const { iso, date } = this.parseFechaBogota(dto.fecha);
        const montoTotal = Math.round(dto.monto_total);
        if (montoTotal < 1) {
            throw new common_1.BadRequestException('El monto a repartir debe ser mayor a 0');
        }
        let meseros = await this.prisma.usuario.findMany({
            where: {
                idRestaurante: tenantId,
                rol: { nombre: 'mesero' },
                activo: true,
                ...(dto.ids_usuarios?.length
                    ? { idUsuario: { in: dto.ids_usuarios } }
                    : {}),
            },
            select: { idUsuario: true, nombre: true, apellido: true },
            orderBy: [{ nombre: 'asc' }, { apellido: 'asc' }],
        });
        if (dto.ids_usuarios?.length) {
            const pedidas = new Set(dto.ids_usuarios);
            if (meseros.length !== pedidas.size) {
                throw new common_1.BadRequestException('Uno o más meseros no están activos o no existen');
            }
        }
        if (meseros.length === 0) {
            throw new common_1.BadRequestException('No hay meseros activos para repartir');
        }
        const partes = (0, repartir_monto_cop_1.repartirMontoEnCop)(montoTotal, meseros.length);
        const notas = dto.notas?.trim() || null;
        const resultados = [];
        await this.prisma.$transaction(async (tx) => {
            for (let i = 0; i < meseros.length; i++) {
                const m = meseros[i];
                const monto = partes[i];
                await tx.registroBeneficioMesero.upsert({
                    where: {
                        fecha_idUsuario_claveUnica: {
                            fecha: date,
                            idUsuario: m.idUsuario,
                            claveUnica: CLAVE_PAGO,
                        },
                    },
                    create: {
                        fecha: date,
                        idUsuario: m.idUsuario,
                        tipo: 'pago_turno',
                        claveUnica: CLAVE_PAGO,
                        monto,
                        notas,
                        idUsuarioRegistro: idAdmin,
                    },
                    update: {
                        monto,
                        notas,
                        idUsuarioRegistro: idAdmin,
                    },
                });
                resultados.push({ id_usuario: m.idUsuario, monto });
            }
        });
        return {
            fecha: iso,
            monto_total: montoTotal,
            meseros: resultados,
            total_asignado: resultados.reduce((s, r) => s + r.monto, 0),
        };
    }
    async loadBeneficioActivo(idBeneficioTurno, tenantId) {
        const b = await this.prisma.beneficioTurnoProducto.findFirst({
            where: { idBeneficioTurno, idRestaurante: tenantId },
            include: {
                producto: {
                    include: { categoria: { select: { esBebida: true } } },
                },
            },
        });
        if (!b) {
            throw new common_1.NotFoundException('Beneficio no encontrado');
        }
        if (!b.activo) {
            throw new common_1.BadRequestException('Ese beneficio está desactivado');
        }
        return b;
    }
    async aplicarBeneficioMesero(dto, idAdmin, tenantId) {
        const { iso, date } = this.parseFechaBogota(dto.fecha);
        const beneficio = await this.loadBeneficioActivo(dto.id_beneficio_turno, tenantId);
        await this.ensureMeseroActivo(dto.id_usuario, tenantId);
        const clave = claveDescuento(beneficio.idBeneficioTurno);
        const existing = await this.prisma.registroBeneficioMesero.findUnique({
            where: {
                fecha_idUsuario_claveUnica: {
                    fecha: date,
                    idUsuario: dto.id_usuario,
                    claveUnica: clave,
                },
            },
        });
        if (existing) {
            throw new common_1.ConflictException('Ese beneficio ya está aplicado al mesero');
        }
        let desconto = false;
        await this.prisma.$transaction(async (tx) => {
            if (beneficio.descontarStock && beneficio.producto) {
                const prodFresh = await tx.producto.findUnique({
                    where: { idProducto: beneficio.idProducto },
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
                    tipo: 'descuento_turno',
                    claveUnica: clave,
                    idBeneficioTurno: beneficio.idBeneficioTurno,
                    idProducto: beneficio.idProducto,
                    monto: Math.round(Number(beneficio.montoDescuento)),
                    cantidad: 1,
                    descontoStock: desconto,
                    idUsuarioRegistro: idAdmin,
                },
            });
        });
        if (desconto) {
            this.gateway.emitConfigActualizada('menu', tenantId);
        }
        return {
            fecha: iso,
            id_usuario: dto.id_usuario,
            id_beneficio_turno: beneficio.idBeneficioTurno,
            desconto_stock: desconto,
        };
    }
    async aplicarBeneficiosTodos(dto, idAdmin, tenantId) {
        const { iso, date } = this.parseFechaBogota(dto.fecha);
        const beneficios = await this.prisma.beneficioTurnoProducto.findMany({
            where: {
                idRestaurante: tenantId,
                activo: true,
                ...(dto.ids_beneficio_turno?.length
                    ? { idBeneficioTurno: { in: dto.ids_beneficio_turno } }
                    : {}),
            },
            include: {
                producto: {
                    include: { categoria: { select: { esBebida: true } } },
                },
            },
            orderBy: [{ orden: 'asc' }, { idBeneficioTurno: 'asc' }],
        });
        if (beneficios.length === 0) {
            throw new common_1.BadRequestException('Configura al menos un beneficio activo (producto + descuento)');
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
                for (const beneficio of beneficios) {
                    const clave = claveDescuento(beneficio.idBeneficioTurno);
                    const existing = await tx.registroBeneficioMesero.findUnique({
                        where: {
                            fecha_idUsuario_claveUnica: {
                                fecha: date,
                                idUsuario: m.idUsuario,
                                claveUnica: clave,
                            },
                        },
                    });
                    if (existing) {
                        omitidos += 1;
                        continue;
                    }
                    let desconto = false;
                    if (beneficio.descontarStock && beneficio.producto) {
                        const prodFresh = await tx.producto.findUnique({
                            where: { idProducto: beneficio.idProducto },
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
                            tipo: 'descuento_turno',
                            claveUnica: clave,
                            idBeneficioTurno: beneficio.idBeneficioTurno,
                            idProducto: beneficio.idProducto,
                            monto: Math.round(Number(beneficio.montoDescuento)),
                            cantidad: 1,
                            descontoStock: desconto,
                            idUsuarioRegistro: idAdmin,
                        },
                    });
                    aplicados += 1;
                }
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
            total_beneficios: beneficios.length,
        };
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
                asignado_en: row.creadoEn.toISOString(),
            },
        };
    }
    async miDelegacionHoy(idUsuario, rol) {
        return this.permisos.miDelegacionHoy(idUsuario, rol);
    }
    async ensureMeseroActivo(idUsuario, tenantId) {
        const u = await this.prisma.usuario.findFirst({
            where: {
                idUsuario,
                idRestaurante: tenantId,
                activo: true,
                rol: { nombre: 'mesero' },
            },
        });
        if (!u) {
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