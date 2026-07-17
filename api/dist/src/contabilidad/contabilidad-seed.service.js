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
exports.ContabilidadSeedService = void 0;
const common_1 = require("@nestjs/common");
const contabilidad_tipos_1 = require("@drewrest/shared-domain/contabilidad-tipos");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_constants_1 = require("../tenant/tenant.constants");
let ContabilidadSeedService = class ContabilidadSeedService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async asegurarTenant(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const plan = await this.asegurarPlanCo();
        await this.prisma.configContabilidad.upsert({
            where: { idRestaurante: tenantId },
            create: {
                idRestaurante: tenantId,
                idPlanActivo: plan.idPlan,
                posteoAutomatico: false,
                modoUiDefault: 'simplificado',
            },
            update: {},
        });
        await this.asegurarCategoriasYReglas(tenantId, plan.idPlan);
        return plan;
    }
    async asegurarPlanCo() {
        const pais = await this.prisma.paisContable.upsert({
            where: { codigo: 'CO' },
            create: { codigo: 'CO', nombre: 'Colombia', norma: 'PUC' },
            update: {},
        });
        let plan = await this.prisma.planCuentasVersion.findUnique({
            where: {
                idPais_codigoVersion: { idPais: pais.idPais, codigoVersion: 'PUC-POS-v1' },
            },
        });
        if (!plan) {
            plan = await this.prisma.planCuentasVersion.create({
                data: {
                    idPais: pais.idPais,
                    codigoVersion: 'PUC-POS-v1',
                    activa: true,
                },
            });
        }
        await this.seedCuentas(plan.idPlan);
        return plan;
    }
    async seedCuentas(idPlan) {
        const byCodigo = new Map();
        const existentes = await this.prisma.cuentaContable.findMany({
            where: { idPlan },
            select: { idCuenta: true, codigo: true },
        });
        for (const c of existentes)
            byCodigo.set(c.codigo, c.idCuenta);
        for (const seed of contabilidad_tipos_1.SEED_CUENTAS_PUC_CO) {
            if (byCodigo.has(seed.codigo))
                continue;
            const idPadre = seed.codigo_padre != null ? byCodigo.get(seed.codigo_padre) ?? null : null;
            const row = await this.prisma.cuentaContable.create({
                data: {
                    idPlan,
                    codigo: seed.codigo,
                    nombre: seed.nombre,
                    nivel: seed.nivel,
                    naturaleza: seed.naturaleza,
                    tipo: seed.tipo,
                    idPadre,
                    aceptaMovimiento: seed.acepta_movimiento !== false,
                },
            });
            byCodigo.set(seed.codigo, row.idCuenta);
        }
        return byCodigo;
    }
    async asegurarCategoriasYReglas(tenantId, idPlan) {
        const cuentas = await this.prisma.cuentaContable.findMany({
            where: { idPlan },
            select: { idCuenta: true, codigo: true },
        });
        const idPorCodigo = new Map(cuentas.map((c) => [c.codigo, c.idCuenta]));
        for (const cat of contabilidad_tipos_1.SEED_CATEGORIAS_REGLAS_CO) {
            const categoria = await this.prisma.categoriaContableSimple.upsert({
                where: {
                    idRestaurante_codigo: { idRestaurante: tenantId, codigo: cat.codigo },
                },
                create: {
                    idRestaurante: tenantId,
                    codigo: cat.codigo,
                    nombre: cat.nombre,
                    grupo: cat.grupo,
                    orden: cat.orden,
                },
                update: {},
            });
            await this.upsertReglaDosCuentas({
                tenantId,
                codigo: cat.regla_codigo,
                nombre: cat.nombre,
                idCategoria: categoria.idCategoria,
                eventoOrigen: null,
                idDebito: idPorCodigo.get(cat.debito),
                idCredito: idPorCodigo.get(cat.credito),
            });
        }
        for (const ev of contabilidad_tipos_1.SEED_REGLAS_EVENTO_CO) {
            await this.upsertReglaDosCuentas({
                tenantId,
                codigo: ev.codigo,
                nombre: ev.nombre,
                idCategoria: null,
                eventoOrigen: ev.evento,
                idDebito: idPorCodigo.get(ev.debito),
                idCredito: idPorCodigo.get(ev.credito),
            });
        }
    }
    async upsertReglaDosCuentas(input) {
        if (input.idDebito == null || input.idCredito == null)
            return;
        const existente = await this.prisma.reglaContable.findUnique({
            where: {
                idRestaurante_codigo: {
                    idRestaurante: input.tenantId,
                    codigo: input.codigo,
                },
            },
            include: { lineas: true },
        });
        if (existente) {
            if (!existente.lineas.length) {
                await this.prisma.reglaContableLinea.createMany({
                    data: [
                        {
                            idRegla: existente.idRegla,
                            lado: 'debito',
                            idCuenta: input.idDebito,
                            formulaMonto: 'total',
                            orden: 0,
                        },
                        {
                            idRegla: existente.idRegla,
                            lado: 'credito',
                            idCuenta: input.idCredito,
                            formulaMonto: 'total',
                            orden: 1,
                        },
                    ],
                });
            }
            return existente;
        }
        return this.prisma.reglaContable.create({
            data: {
                idRestaurante: input.tenantId,
                codigo: input.codigo,
                nombre: input.nombre,
                idCategoria: input.idCategoria,
                eventoOrigen: input.eventoOrigen,
                lineas: {
                    create: [
                        {
                            lado: 'debito',
                            idCuenta: input.idDebito,
                            formulaMonto: 'total',
                            orden: 0,
                        },
                        {
                            lado: 'credito',
                            idCuenta: input.idCredito,
                            formulaMonto: 'total',
                            orden: 1,
                        },
                    ],
                },
            },
        });
    }
    async seedEnTx(tx, tenantId) {
        void tx;
        await this.asegurarTenant(tenantId);
    }
};
exports.ContabilidadSeedService = ContabilidadSeedService;
exports.ContabilidadSeedService = ContabilidadSeedService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ContabilidadSeedService);
//# sourceMappingURL=contabilidad-seed.service.js.map