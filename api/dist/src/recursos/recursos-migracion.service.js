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
exports.RecursosMigracionService = void 0;
const common_1 = require("@nestjs/common");
const recurso_comportamiento_1 = require("@drewrest/shared-domain/recurso-comportamiento");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_constants_1 = require("../tenant/tenant.constants");
const UBICACIONES_SEED = [
    { nombre: 'Cocina', codigo: 'cocina' },
    { nombre: 'Barra', codigo: 'barra' },
    { nombre: 'Almacén', codigo: 'almacen' },
    { nombre: 'Oficina', codigo: 'oficina' },
];
let RecursosMigracionService = class RecursosMigracionService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async asegurarCategoriasYUbicaciones(tenantId = tenant_constants_1.DEFAULT_TENANT_ID, tx) {
        const db = tx ?? this.prisma;
        for (const seed of recurso_comportamiento_1.SEED_CATEGORIAS_RECURSO) {
            await db.categoriaRecurso.upsert({
                where: {
                    idRestaurante_codigo: { idRestaurante: tenantId, codigo: seed.codigo },
                },
                create: {
                    idRestaurante: tenantId,
                    codigo: seed.codigo,
                    nombre: seed.nombre,
                    descripcion: seed.descripcion ?? null,
                    orden: seed.orden,
                    controlaStock: seed.flags.controla_stock,
                    seConsumeAuto: seed.flags.se_consume_auto,
                    puedeVenderse: seed.flags.puede_venderse,
                    requiereReceta: seed.flags.requiere_receta,
                    controlaVencimiento: seed.flags.controla_vencimiento,
                    controlaLote: seed.flags.controla_lote,
                    manejaSerie: seed.flags.maneja_serie,
                    requiereMantenimiento: seed.flags.requiere_mantenimiento,
                    esActivoFijo: seed.flags.es_activo_fijo,
                    permiteDepreciacion: seed.flags.permite_depreciacion,
                    tieneResponsable: seed.flags.tiene_responsable,
                    tieneUbicacion: seed.flags.tiene_ubicacion,
                    permitePrestamo: seed.flags.permite_prestamo,
                },
                update: {},
            });
        }
        for (const u of UBICACIONES_SEED) {
            await db.ubicacionRecurso.upsert({
                where: {
                    idRestaurante_nombre: { idRestaurante: tenantId, nombre: u.nombre },
                },
                create: {
                    idRestaurante: tenantId,
                    nombre: u.nombre,
                    codigo: u.codigo,
                },
                update: {},
            });
        }
    }
    async migrarDesdeInventario(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        return this.prisma.$transaction(async (tx) => {
            await this.asegurarCategoriasYUbicaciones(tenantId, tx);
            const categorias = await tx.categoriaRecurso.findMany({
                where: { idRestaurante: tenantId },
            });
            const catPorCodigo = new Map(categorias.map((c) => [c.codigo, c]));
            const ubicaciones = await tx.ubicacionRecurso.findMany({
                where: { idRestaurante: tenantId },
            });
            const ubicPorNombre = new Map(ubicaciones.map((u) => [u.nombre.toLowerCase(), u]));
            const inventarios = await tx.inventario.findMany({
                where: { idRestaurante: tenantId },
            });
            let creados = 0;
            let omitidos = 0;
            const mapLegacy = new Map();
            for (const inv of inventarios) {
                const existing = await tx.recurso.findUnique({
                    where: { idInventarioLegacy: inv.idInventario },
                });
                if (existing) {
                    mapLegacy.set(inv.idInventario, existing.idRecurso);
                    omitidos += 1;
                    continue;
                }
                const codigoCat = (0, recurso_comportamiento_1.categoriaCodigoParaClaseLegacy)(inv.claseInventario);
                const cat = catPorCodigo.get(codigoCat) ?? catPorCodigo.get('otros');
                if (!cat)
                    continue;
                let idUbicacion = null;
                if (inv.ubicacion?.trim()) {
                    const key = inv.ubicacion.trim().toLowerCase();
                    let ubic = ubicPorNombre.get(key);
                    if (!ubic) {
                        ubic = await tx.ubicacionRecurso.create({
                            data: {
                                idRestaurante: tenantId,
                                nombre: inv.ubicacion.trim(),
                            },
                        });
                        ubicPorNombre.set(key, ubic);
                    }
                    idUbicacion = ubic.idUbicacion;
                }
                let estado = 'activo';
                if (inv.estadoActivo && (0, recurso_comportamiento_1.esEstadoRecurso)(inv.estadoActivo)) {
                    estado = inv.estadoActivo;
                }
                else if (Number(inv.cantidadActual) <= 0) {
                    estado = 'agotado';
                }
                const baseCodigo = `INV-${inv.idInventario}`;
                let codigo = baseCodigo;
                let n = 0;
                while (await tx.recurso.findUnique({
                    where: {
                        idRestaurante_codigo: { idRestaurante: tenantId, codigo },
                    },
                })) {
                    n += 1;
                    codigo = `${baseCodigo}-${n}`;
                }
                const rec = await tx.recurso.create({
                    data: {
                        idRestaurante: tenantId,
                        codigo,
                        nombre: inv.ingrediente,
                        idCategoria: cat.idCategoria,
                        unidad: inv.unidad,
                        costo: inv.costoUnitario ?? 0,
                        stock: inv.cantidadActual,
                        stockMin: inv.cantidadMinima,
                        estado,
                        idUbicacion,
                        idProducto: inv.idProducto,
                        idInventarioLegacy: inv.idInventario,
                    },
                });
                mapLegacy.set(inv.idInventario, rec.idRecurso);
                creados += 1;
            }
            const lineas = await tx.recetaLinea.findMany({
                where: {
                    idInventario: { not: null },
                    receta: { idRestaurante: tenantId },
                },
            });
            let lineasActualizadas = 0;
            for (const l of lineas) {
                if (l.idInventario == null)
                    continue;
                const idRecurso = mapLegacy.get(l.idInventario);
                if (idRecurso == null)
                    continue;
                if (l.idRecurso === idRecurso)
                    continue;
                await tx.recetaLinea.update({
                    where: { idLinea: l.idLinea },
                    data: { idRecurso },
                });
                lineasActualizadas += 1;
            }
            return {
                creados,
                omitidos,
                lineas_actualizadas: lineasActualizadas,
                total_inventario: inventarios.length,
            };
        });
    }
    async migrarSiNecesario(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        await this.asegurarCategoriasYUbicaciones(tenantId);
        const [nRec, nInv] = await Promise.all([
            this.prisma.recurso.count({ where: { idRestaurante: tenantId } }),
            this.prisma.inventario.count({ where: { idRestaurante: tenantId } }),
        ]);
        if (nRec === 0 && nInv > 0) {
            return this.migrarDesdeInventario(tenantId);
        }
        return {
            creados: 0,
            omitidos: nRec,
            lineas_actualizadas: 0,
            total_inventario: nInv,
            skipped: true,
        };
    }
};
exports.RecursosMigracionService = RecursosMigracionService;
exports.RecursosMigracionService = RecursosMigracionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RecursosMigracionService);
//# sourceMappingURL=recursos-migracion.service.js.map