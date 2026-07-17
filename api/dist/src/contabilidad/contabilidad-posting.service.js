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
exports.ContabilidadPostingService = void 0;
const common_1 = require("@nestjs/common");
const contabilidad_asiento_1 = require("@drewrest/shared-domain/contabilidad-asiento");
const contabilidad_reglas_1 = require("@drewrest/shared-domain/contabilidad-reglas");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_constants_1 = require("../tenant/tenant.constants");
const contabilidad_seed_service_1 = require("./contabilidad-seed.service");
let ContabilidadPostingService = class ContabilidadPostingService {
    prisma;
    seed;
    constructor(prisma, seed) {
        this.prisma = prisma;
        this.seed = seed;
    }
    async postEvento(tx, input) {
        const db = tx ?? this.prisma;
        const tenantId = input.tenantId || tenant_constants_1.DEFAULT_TENANT_ID;
        await this.seed.asegurarTenant(tenantId);
        const cfg = await db.configContabilidad.findUnique({
            where: { idRestaurante: tenantId },
        });
        if (!cfg)
            return { skipped: true, reason: 'sin_config' };
        if (!cfg.posteoAutomatico && !input.forzar) {
            return { skipped: true, reason: 'posteo_desactivado' };
        }
        const existente = await db.asientoContable.findUnique({
            where: {
                idRestaurante_idDocumento: {
                    idRestaurante: tenantId,
                    idDocumento: input.idDocumento,
                },
            },
        });
        if (existente) {
            return { skipped: true, reason: 'idempotente', id_asiento: existente.idAsiento };
        }
        const monto = (0, contabilidad_asiento_1.redondearDineroContable)(input.monto);
        if (monto <= 0) {
            return { skipped: true, reason: 'monto_cero' };
        }
        let regla = await db.reglaContable.findFirst({
            where: {
                idRestaurante: tenantId,
                activa: true,
                ...(input.idCategoriaSimple != null
                    ? { idCategoria: input.idCategoriaSimple }
                    : { eventoOrigen: input.evento }),
            },
            include: { lineas: { orderBy: { orden: 'asc' } } },
            orderBy: { prioridad: 'asc' },
        });
        if (!regla && input.idCategoriaSimple == null) {
            regla = await db.reglaContable.findFirst({
                where: {
                    idRestaurante: tenantId,
                    activa: true,
                    eventoOrigen: input.evento,
                },
                include: { lineas: { orderBy: { orden: 'asc' } } },
                orderBy: { prioridad: 'asc' },
            });
        }
        if (!regla?.lineas.length) {
            throw new common_1.BadRequestException(`No hay regla contable para «${input.evento}»`);
        }
        const { plan, validacion } = (0, contabilidad_reglas_1.aplicarReglaContable)({
            codigo: regla.codigo,
            nombre: regla.nombre,
            lineas: regla.lineas.map((l) => ({
                lado: l.lado,
                id_cuenta: l.idCuenta,
                formula_monto: l.formulaMonto,
                porcentaje: l.porcentaje != null ? Number(l.porcentaje) : null,
                monto_fijo: l.montoFijo != null ? Number(l.montoFijo) : null,
                orden: l.orden,
            })),
        }, monto, input.descripcion ?? regla.nombre);
        if (!validacion.ok) {
            throw new common_1.BadRequestException(validacion.motivo ?? 'Asiento inválido');
        }
        return this.persistirAsiento(db, {
            tenantId,
            plan,
            fecha: input.fecha,
            origen: input.origen,
            idDocumento: input.idDocumento,
            idUsuario: input.idUsuario,
            idCategoriaSimple: input.idCategoriaSimple,
            equipo: input.equipo,
            motivo: input.motivo,
        });
    }
    async persistirAsiento(db, input) {
        const v = (0, contabilidad_asiento_1.validarAsientoPlan)(input.plan);
        if (!v.ok)
            throw new common_1.BadRequestException(v.motivo);
        const fecha = typeof input.fecha === 'string'
            ? new Date(`${input.fecha.slice(0, 10)}T12:00:00.000Z`)
            : input.fecha;
        const agg = await db.asientoContable.aggregate({
            where: { idRestaurante: input.tenantId },
            _max: { numero: true },
        });
        const numero = (agg._max.numero ?? 0) + 1;
        const asiento = await db.asientoContable.create({
            data: {
                idRestaurante: input.tenantId,
                numero,
                fecha,
                descripcion: input.plan.descripcion.slice(0, 255),
                origenModulo: input.origen.modulo.slice(0, 40),
                origenTipo: input.origen.tipo.slice(0, 40),
                origenId: input.origen.id ?? null,
                idDocumento: input.idDocumento.slice(0, 80),
                idUsuario: input.idUsuario,
                idCategoriaSimple: input.idCategoriaSimple ?? null,
                equipo: input.equipo?.slice(0, 80) ?? null,
                motivo: input.motivo?.slice(0, 255) ?? null,
                lineas: {
                    create: input.plan.lineas.map((l) => ({
                        idCuenta: l.id_cuenta,
                        debito: l.debito,
                        credito: l.credito,
                        detalle: l.detalle?.slice(0, 255) ?? null,
                        orden: l.orden,
                    })),
                },
            },
            include: { lineas: true },
        });
        return { skipped: false, id_asiento: asiento.idAsiento, numero };
    }
    async reversar(idAsiento, idUsuario, tenantId = tenant_constants_1.DEFAULT_TENANT_ID, motivo) {
        const original = await this.prisma.asientoContable.findFirst({
            where: { idAsiento, idRestaurante: tenantId },
            include: { lineas: { orderBy: { orden: 'asc' } } },
        });
        if (!original)
            throw new common_1.BadRequestException('Asiento no encontrado');
        if (original.estado === 'reversado') {
            throw new common_1.BadRequestException('El asiento ya está reversado');
        }
        const plan = (0, contabilidad_asiento_1.planReversoAsiento)({
            descripcion: original.descripcion,
            lineas: original.lineas.map((l) => ({
                id_cuenta: l.idCuenta,
                debito: Number(l.debito),
                credito: Number(l.credito),
                orden: l.orden,
            })),
        });
        return this.prisma.$transaction(async (tx) => {
            const rev = await this.persistirAsiento(tx, {
                tenantId,
                plan: {
                    ...plan,
                    descripcion: motivo
                        ? `Reversión #${original.numero}: ${motivo}`
                        : plan.descripcion,
                },
                fecha: new Date(),
                origen: {
                    modulo: 'contabilidad',
                    tipo: 'reverso',
                    id: original.idAsiento,
                },
                idDocumento: `reverso:${original.idDocumento}`,
                idUsuario,
                motivo: motivo ?? `Reversión asiento ${original.numero}`,
            });
            await tx.asientoContable.update({
                where: { idAsiento: original.idAsiento },
                data: {
                    estado: 'reversado',
                    idAsientoReverso: rev.id_asiento,
                },
            });
            return rev;
        });
    }
};
exports.ContabilidadPostingService = ContabilidadPostingService;
exports.ContabilidadPostingService = ContabilidadPostingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        contabilidad_seed_service_1.ContabilidadSeedService])
], ContabilidadPostingService);
//# sourceMappingURL=contabilidad-posting.service.js.map