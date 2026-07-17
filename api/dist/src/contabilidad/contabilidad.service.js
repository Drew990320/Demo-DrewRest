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
exports.ContabilidadService = void 0;
const common_1 = require("@nestjs/common");
const contabilidad_asiento_1 = require("@drewrest/shared-domain/contabilidad-asiento");
const contabilidad_reportes_1 = require("@drewrest/shared-domain/contabilidad-reportes");
const contabilidad_tipos_1 = require("@drewrest/shared-domain/contabilidad-tipos");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_constants_1 = require("../tenant/tenant.constants");
const contabilidad_posting_service_1 = require("./contabilidad-posting.service");
const contabilidad_seed_service_1 = require("./contabilidad-seed.service");
let ContabilidadService = class ContabilidadService {
    prisma;
    seed;
    posting;
    constructor(prisma, seed, posting) {
        this.prisma = prisma;
        this.seed = seed;
        this.posting = posting;
    }
    async obtenerConfig(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        await this.seed.asegurarTenant(tenantId);
        const cfg = await this.prisma.configContabilidad.findUnique({
            where: { idRestaurante: tenantId },
            include: {
                planActivo: { include: { pais: true } },
            },
        });
        if (!cfg)
            throw new common_1.NotFoundException('Config contable no encontrada');
        return {
            id_plan_activo: cfg.idPlanActivo,
            modo_ui_default: cfg.modoUiDefault,
            posteo_automatico: cfg.posteoAutomatico,
            periodo_abierto_desde: cfg.periodoAbiertoDesde
                ?.toISOString()
                .slice(0, 10) ?? null,
            plan: {
                id_plan: cfg.planActivo.idPlan,
                codigo_version: cfg.planActivo.codigoVersion,
                pais: cfg.planActivo.pais.codigo,
                norma: cfg.planActivo.pais.norma,
            },
        };
    }
    async actualizarConfig(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        await this.seed.asegurarTenant(tenantId);
        const cfg = await this.prisma.configContabilidad.update({
            where: { idRestaurante: tenantId },
            data: {
                posteoAutomatico: dto.posteo_automatico,
                modoUiDefault: dto.modo_ui_default,
                idPlanActivo: dto.id_plan_activo,
            },
        });
        return this.obtenerConfig(tenantId);
    }
    async listarCuentas(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        await this.seed.asegurarTenant(tenantId);
        const cfg = await this.prisma.configContabilidad.findUniqueOrThrow({
            where: { idRestaurante: tenantId },
        });
        const rows = await this.prisma.cuentaContable.findMany({
            where: { idPlan: cfg.idPlanActivo, activa: true },
            orderBy: { codigo: 'asc' },
        });
        return rows.map((c) => ({
            id_cuenta: c.idCuenta,
            codigo: c.codigo,
            nombre: c.nombre,
            nivel: c.nivel,
            naturaleza: c.naturaleza,
            tipo: c.tipo,
            acepta_movimiento: c.aceptaMovimiento,
            es_auxiliar: c.esAuxiliar,
            id_padre: c.idPadre,
        }));
    }
    async listarCategorias(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        await this.seed.asegurarTenant(tenantId);
        const rows = await this.prisma.categoriaContableSimple.findMany({
            where: { idRestaurante: tenantId, activa: true },
            orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
            include: {
                reglas: {
                    where: { activa: true },
                    take: 1,
                    include: {
                        lineas: {
                            include: { cuenta: { select: { codigo: true, nombre: true } } },
                        },
                    },
                },
            },
        });
        return rows.map((c) => ({
            id_categoria: c.idCategoria,
            codigo: c.codigo,
            nombre: c.nombre,
            grupo: c.grupo,
            orden: c.orden,
            regla: c.reglas[0]
                ? {
                    codigo: c.reglas[0].codigo,
                    lineas: c.reglas[0].lineas.map((l) => ({
                        lado: l.lado,
                        cuenta: `${l.cuenta.codigo} ${l.cuenta.nombre}`,
                    })),
                }
                : null,
        }));
    }
    async crearCategoria(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        await this.seed.asegurarTenant(tenantId);
        if (!contabilidad_tipos_1.GRUPOS_CATEGORIA_CONTABLE.includes(dto.grupo)) {
            throw new common_1.BadRequestException('Grupo de categoría no válido');
        }
        const codigo = dto.codigo.trim().toLowerCase().replace(/\s+/g, '_');
        try {
            const cat = await this.prisma.categoriaContableSimple.create({
                data: {
                    idRestaurante: tenantId,
                    codigo,
                    nombre: dto.nombre.trim(),
                    grupo: dto.grupo,
                    orden: dto.orden ?? 300,
                },
            });
            await this.prisma.reglaContable.create({
                data: {
                    idRestaurante: tenantId,
                    codigo: `cat_${codigo}`,
                    nombre: dto.nombre.trim(),
                    idCategoria: cat.idCategoria,
                    lineas: {
                        create: [
                            {
                                lado: 'debito',
                                idCuenta: dto.id_cuenta_debito,
                                formulaMonto: 'total',
                                orden: 0,
                            },
                            {
                                lado: 'credito',
                                idCuenta: dto.id_cuenta_credito,
                                formulaMonto: 'total',
                                orden: 1,
                            },
                        ],
                    },
                },
            });
            return this.listarCategorias(tenantId);
        }
        catch {
            throw new common_1.BadRequestException('No se pudo crear la categoría (¿código duplicado?)');
        }
    }
    async movimientoSimple(dto, idUsuario, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const fecha = dto.fecha?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
        const cat = await this.prisma.categoriaContableSimple.findFirst({
            where: {
                idCategoria: dto.id_categoria,
                idRestaurante: tenantId,
                activa: true,
            },
        });
        if (!cat)
            throw new common_1.NotFoundException('Categoría no encontrada');
        const idDoc = `simple:${tenantId}:${cat.codigo}:${fecha}:${Date.now()}`;
        const result = await this.posting.postEvento(null, {
            tenantId,
            evento: 'movimiento_simple',
            monto: dto.monto,
            fecha,
            origen: { modulo: 'contabilidad', tipo: 'movimiento_simple', id: cat.idCategoria },
            idDocumento: idDoc,
            idUsuario,
            idCategoriaSimple: cat.idCategoria,
            descripcion: dto.descripcion?.trim() || cat.nombre,
            motivo: dto.motivo?.trim(),
            forzar: true,
        });
        return result;
    }
    async listarAsientos(tenantId = tenant_constants_1.DEFAULT_TENANT_ID, filtros) {
        await this.seed.asegurarTenant(tenantId);
        const rows = await this.prisma.asientoContable.findMany({
            where: {
                idRestaurante: tenantId,
                ...(filtros?.fecha
                    ? {
                        fecha: new Date(`${filtros.fecha.slice(0, 10)}T12:00:00.000Z`),
                    }
                    : {}),
            },
            include: {
                lineas: {
                    include: { cuenta: { select: { codigo: true, nombre: true, tipo: true } } },
                    orderBy: { orden: 'asc' },
                },
                usuario: { select: { nombre: true, apellido: true } },
            },
            orderBy: [{ fecha: 'desc' }, { numero: 'desc' }],
            take: filtros?.limite ?? 50,
        });
        return rows.map((a) => ({
            id_asiento: a.idAsiento,
            numero: a.numero,
            fecha: a.fecha.toISOString().slice(0, 10),
            descripcion: a.descripcion,
            estado: a.estado,
            origen_modulo: a.origenModulo,
            origen_tipo: a.origenTipo,
            id_documento: a.idDocumento,
            motivo: a.motivo,
            usuario: `${a.usuario.nombre} ${a.usuario.apellido}`.trim(),
            total: (0, contabilidad_asiento_1.redondearDineroContable)(a.lineas.reduce((s, l) => s + Number(l.debito), 0)),
            lineas: a.lineas.map((l) => ({
                id_cuenta: l.idCuenta,
                codigo: l.cuenta.codigo,
                nombre: l.cuenta.nombre,
                tipo: l.cuenta.tipo,
                debito: Number(l.debito),
                credito: Number(l.credito),
            })),
        }));
    }
    async resumenSimple(fecha, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        await this.seed.asegurarTenant(tenantId);
        const dia = fecha.slice(0, 10);
        const asientos = await this.listarAsientos(tenantId, {
            fecha: dia,
            limite: 500,
        });
        const publicados = asientos.filter((a) => a.estado === 'publicado');
        const lineas = publicados.flatMap((a) => a.lineas.map((l) => ({
            id_cuenta: l.id_cuenta,
            debito: l.debito,
            credito: l.credito,
            orden: 0,
            tipo_cuenta: l.tipo,
        })));
        const fin = (0, contabilidad_reportes_1.resumenSimpleDesdeLineas)(lineas);
        const [cxc, cxp, caja] = await Promise.all([
            this.prisma.cuentaCredito.aggregate({
                where: {
                    estado: 'abierto',
                    pedido: { idRestaurante: tenantId },
                },
                _sum: { saldoPendiente: true },
            }),
            this.prisma.cuentaPorPagar.aggregate({
                where: {
                    estado: 'abierta',
                    proveedor: { idRestaurante: tenantId },
                },
                _sum: { saldoPendiente: true },
            }),
            this.prisma.cajaDiaria.findUnique({
                where: {
                    idRestaurante_fecha: {
                        idRestaurante: tenantId,
                        fecha: new Date(`${dia}T12:00:00.000Z`),
                    },
                },
            }),
        ]);
        return {
            fecha: dia,
            ingresos: fin.ingresos,
            gastos: fin.gastos,
            utilidad: fin.utilidad,
            por_cobrar: (0, contabilidad_asiento_1.redondearDineroContable)(Number(cxc._sum.saldoPendiente ?? 0)),
            por_pagar: (0, contabilidad_asiento_1.redondearDineroContable)(Number(cxp._sum.saldoPendiente ?? 0)),
            base_caja: caja ? Number(caja.montoBaseEfectivo) : null,
            asientos_dia: publicados.length,
        };
    }
    reversar(idAsiento, idUsuario, motivo, tenantId) {
        return this.posting.reversar(idAsiento, idUsuario, tenantId, motivo);
    }
};
exports.ContabilidadService = ContabilidadService;
exports.ContabilidadService = ContabilidadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        contabilidad_seed_service_1.ContabilidadSeedService,
        contabilidad_posting_service_1.ContabilidadPostingService])
], ContabilidadService);
//# sourceMappingURL=contabilidad.service.js.map