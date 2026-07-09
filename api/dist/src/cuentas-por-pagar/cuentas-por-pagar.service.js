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
exports.CuentasPorPagarService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_constants_1 = require("../tenant/tenant.constants");
let CuentasPorPagarService = class CuentasPorPagarService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    money(v) {
        return Math.round(Number(v));
    }
    mapCuenta(row) {
        return {
            id_cuenta_por_pagar: row.idCuentaPorPagar,
            id_proveedor: row.idProveedor,
            proveedor_nombre: row.proveedor.nombre,
            proveedor_nit: row.proveedor.nit,
            numero_documento: row.numeroDocumento,
            descripcion: row.descripcion,
            fecha_emision: row.fechaEmision.toISOString(),
            fecha_vencimiento: row.fechaVencimiento?.toISOString().slice(0, 10) ?? null,
            monto_total: this.money(row.montoTotal),
            saldo_pendiente: this.money(row.saldoPendiente),
            estado: row.estado,
            notas: row.notas,
            es_contado: row.esContado,
            creado_en: row.creadoEn.toISOString(),
            pagado_en: row.pagadoEn?.toISOString() ?? null,
            id_usuario: row.idUsuario,
        };
    }
    async listar(soloAbiertas = true, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const rows = await this.prisma.cuentaPorPagar.findMany({
            where: {
                ...(soloAbiertas ? { estado: 'abierta' } : {}),
                proveedor: { idRestaurante: tenantId },
            },
            orderBy: [{ estado: 'asc' }, { fechaEmision: 'desc' }],
            include: { proveedor: { select: { nombre: true, nit: true } } },
        });
        return rows.map((r) => this.mapCuenta(r));
    }
    async crear(dto, idUsuario, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const monto = Math.round(dto.monto_total);
        if (monto <= 0) {
            throw new common_1.BadRequestException('El monto debe ser mayor que cero');
        }
        const proveedor = await this.prisma.proveedor.findFirst({
            where: { idProveedor: dto.id_proveedor, idRestaurante: tenantId },
        });
        if (!proveedor || !proveedor.activo) {
            throw new common_1.NotFoundException('Proveedor no encontrado o inactivo');
        }
        const esContado = Boolean(dto.es_contado);
        if (esContado && !dto.metodo_pago_contado) {
            throw new common_1.BadRequestException('Indica el método de pago para compras de contado');
        }
        const fechaVenc = dto.fecha_vencimiento ?
            new Date(`${dto.fecha_vencimiento.slice(0, 10)}T12:00:00.000Z`)
            : null;
        const row = await this.prisma.$transaction(async (tx) => {
            const cuenta = await tx.cuentaPorPagar.create({
                data: {
                    idProveedor: dto.id_proveedor,
                    numeroDocumento: dto.numero_documento?.trim() || null,
                    descripcion: dto.descripcion?.trim() || null,
                    fechaVencimiento: fechaVenc,
                    montoTotal: monto,
                    saldoPendiente: esContado ? 0 : monto,
                    estado: esContado ? 'pagada' : 'abierta',
                    notas: dto.notas?.trim() || null,
                    esContado,
                    idUsuario,
                    pagadoEn: esContado ? new Date() : null,
                },
                include: { proveedor: { select: { nombre: true, nit: true } } },
            });
            if (esContado) {
                await tx.pagoProveedor.create({
                    data: {
                        idCuentaPorPagar: cuenta.idCuentaPorPagar,
                        monto,
                        metodoPago: dto.metodo_pago_contado,
                        notas: 'Pago de contado al registrar',
                        idUsuario,
                    },
                });
            }
            return cuenta;
        });
        return this.mapCuenta(row);
    }
    async registrarPago(idCuenta, dto, idUsuario, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const cuenta = await this.prisma.cuentaPorPagar.findFirst({
            where: {
                idCuentaPorPagar: idCuenta,
                proveedor: { idRestaurante: tenantId },
            },
            include: { proveedor: { select: { nombre: true, nit: true } } },
        });
        if (!cuenta) {
            throw new common_1.NotFoundException('Cuenta por pagar no encontrada');
        }
        if (cuenta.estado !== 'abierta') {
            throw new common_1.BadRequestException('La cuenta no está abierta');
        }
        const pago = Math.round(dto.monto);
        if (pago <= 0) {
            throw new common_1.BadRequestException('El pago debe ser mayor que cero');
        }
        const saldo = this.money(cuenta.saldoPendiente);
        if (pago > saldo) {
            throw new common_1.BadRequestException('El pago supera el saldo pendiente');
        }
        const nuevoSaldo = saldo - pago;
        const row = await this.prisma.$transaction(async (tx) => {
            await tx.pagoProveedor.create({
                data: {
                    idCuentaPorPagar: idCuenta,
                    monto: pago,
                    metodoPago: dto.metodo_pago,
                    notas: dto.notas?.trim() || null,
                    idUsuario,
                },
            });
            return tx.cuentaPorPagar.update({
                where: { idCuentaPorPagar: idCuenta },
                data: {
                    saldoPendiente: nuevoSaldo,
                    ...(nuevoSaldo <= 0 ?
                        { estado: 'pagada', pagadoEn: new Date(), saldoPendiente: 0 }
                        : {}),
                },
                include: { proveedor: { select: { nombre: true, nit: true } } },
            });
        });
        return this.mapCuenta(row);
    }
};
exports.CuentasPorPagarService = CuentasPorPagarService;
exports.CuentasPorPagarService = CuentasPorPagarService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CuentasPorPagarService);
//# sourceMappingURL=cuentas-por-pagar.service.js.map