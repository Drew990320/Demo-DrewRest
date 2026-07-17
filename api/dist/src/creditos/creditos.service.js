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
exports.CreditosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_constants_1 = require("../tenant/tenant.constants");
const contabilidad_posting_service_1 = require("../contabilidad/contabilidad-posting.service");
let CreditosService = class CreditosService {
    prisma;
    contabilidadPosting;
    constructor(prisma, contabilidadPosting) {
        this.prisma = prisma;
        this.contabilidadPosting = contabilidadPosting;
    }
    mapCuenta(row) {
        const n = (v) => Math.round(Number(v));
        return {
            id_credito: row.idCredito,
            id_pedido: row.idPedido,
            id_factura: row.idFactura,
            mesa_numero: row.pedido?.mesa?.numero ?? null,
            nombre_cliente: row.nombreCliente,
            telefono: row.telefono,
            monto_total: n(row.montoTotal),
            saldo_pendiente: n(row.saldoPendiente),
            notas: row.notas,
            estado: row.estado,
            creado_en: row.creadoEn.toISOString(),
            pagado_en: row.pagadoEn?.toISOString() ?? null,
            id_usuario: row.idUsuario,
        };
    }
    async listar(soloAbiertos = true, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const rows = await this.prisma.cuentaCredito.findMany({
            where: {
                ...(soloAbiertos ? { estado: 'abierto' } : {}),
                pedido: { idRestaurante: tenantId },
            },
            orderBy: [{ estado: 'asc' }, { creadoEn: 'desc' }],
            include: { pedido: { include: { mesa: { select: { numero: true } } } } },
        });
        return rows.map((r) => this.mapCuenta(r));
    }
    async crear(dto, idUsuario, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const monto = Math.round(dto.monto_total);
        if (monto <= 0) {
            throw new common_1.BadRequestException('El monto debe ser mayor que cero');
        }
        const pedido = await this.prisma.pedido.findFirst({
            where: { idPedido: dto.id_pedido, idRestaurante: tenantId },
        });
        if (!pedido) {
            throw new common_1.NotFoundException('Pedido no encontrado');
        }
        if (dto.id_factura != null) {
            const factura = await this.prisma.factura.findFirst({
                where: { idFactura: dto.id_factura, idPedido: dto.id_pedido },
            });
            if (!factura) {
                throw new common_1.BadRequestException('Factura no pertenece al pedido');
            }
        }
        const row = await this.prisma.cuentaCredito.create({
            data: {
                idPedido: dto.id_pedido,
                idFactura: dto.id_factura ?? null,
                nombreCliente: dto.nombre_cliente.trim(),
                telefono: dto.telefono?.trim() || null,
                montoTotal: monto,
                saldoPendiente: monto,
                notas: dto.notas?.trim() || null,
                idUsuario,
            },
            include: { pedido: { include: { mesa: { select: { numero: true } } } } },
        });
        return this.mapCuenta(row);
    }
    async registrarAbono(idCredito, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const cuenta = await this.prisma.cuentaCredito.findFirst({
            where: { idCredito, pedido: { idRestaurante: tenantId } },
        });
        if (!cuenta) {
            throw new common_1.NotFoundException('Cuenta de crédito no encontrada');
        }
        if (cuenta.estado === 'pagado') {
            throw new common_1.BadRequestException('La cuenta ya está saldada');
        }
        const abono = Math.round(dto.monto);
        if (abono <= 0) {
            throw new common_1.BadRequestException('El abono debe ser mayor que cero');
        }
        const saldoActual = Math.round(Number(cuenta.saldoPendiente));
        if (abono > saldoActual) {
            throw new common_1.BadRequestException('El abono supera el saldo pendiente');
        }
        const nuevoSaldo = saldoActual - abono;
        const notas = dto.notas?.trim() ?
            [cuenta.notas, `Abono ${abono}: ${dto.notas.trim()}`]
                .filter(Boolean)
                .join('\n')
            : cuenta.notas;
        const row = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.cuentaCredito.update({
                where: { idCredito },
                data: {
                    saldoPendiente: nuevoSaldo,
                    notas,
                    ...(nuevoSaldo <= 0
                        ? { estado: 'pagado', pagadoEn: new Date(), saldoPendiente: 0 }
                        : {}),
                },
                include: {
                    pedido: { include: { mesa: { select: { numero: true } } } },
                },
            });
            try {
                await this.contabilidadPosting.postEvento(tx, {
                    tenantId,
                    evento: 'abono_cliente',
                    monto: abono,
                    fecha: new Date(),
                    origen: { modulo: 'creditos', tipo: 'abono', id: idCredito },
                    idDocumento: `credito:${idCredito}:abono:${abono}:${Date.now()}`,
                    idUsuario: cuenta.idUsuario,
                    descripcion: `Abono crédito #${idCredito}`,
                });
            }
            catch {
            }
            return updated;
        });
        return this.mapCuenta(row);
    }
};
exports.CreditosService = CreditosService;
exports.CreditosService = CreditosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        contabilidad_posting_service_1.ContabilidadPostingService])
], CreditosService);
//# sourceMappingURL=creditos.service.js.map