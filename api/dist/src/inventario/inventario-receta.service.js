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
exports.InventarioRecetaService = void 0;
const common_1 = require("@nestjs/common");
const inventario_receta_1 = require("@drewrest/shared-domain/inventario-receta");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_constants_1 = require("../tenant/tenant.constants");
const deduccion_contexto_cache_1 = require("./deduccion-contexto-cache");
let InventarioRecetaService = class InventarioRecetaService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    mapLinea(l) {
        const sust = Array.isArray(l.sustituciones)
            ? l.sustituciones
                .filter((s) => typeof s.id_articulo === 'number')
                .map((s) => ({
                id_articulo: s.id_articulo,
                factor: s.factor,
            }))
            : undefined;
        return {
            id_linea: String(l.idLinea),
            id_articulo: l.idRecurso ?? l.idInventario ?? undefined,
            id_subreceta: l.idSubreceta != null ? String(l.idSubreceta) : undefined,
            cantidad: Number(l.cantidad),
            unidad: l.unidad,
            opcional: l.opcional,
            sustituciones: sust,
        };
    }
    mapReceta(row) {
        return {
            id_receta: row.idReceta,
            id_producto: row.idProducto,
            nombre_producto: row.producto.nombre,
            version: row.version,
            activa: row.activa,
            costo_calculado: row.costoCalculado != null ? Number(row.costoCalculado) : null,
            lineas: row.lineas
                .sort((a, b) => a.orden - b.orden)
                .map((l, i) => ({
                id_linea: l.idLinea,
                id_inventario: l.idInventario,
                id_recurso: l.idRecurso,
                id_subreceta: l.idSubreceta,
                cantidad: Number(l.cantidad),
                unidad: l.unidad,
                opcional: l.opcional,
                orden: i,
                sustituciones: this.mapLinea(l).sustituciones ?? [],
            })),
        };
    }
    async listar(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const rows = await this.prisma.recetaProducto.findMany({
            where: { idRestaurante: tenantId, activa: true },
            include: {
                lineas: { orderBy: { orden: 'asc' } },
                producto: { select: { idProducto: true, nombre: true } },
            },
            orderBy: { idReceta: 'asc' },
        });
        return rows.map((r) => this.mapReceta(r));
    }
    async obtenerPorProducto(idProducto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const row = await this.prisma.recetaProducto.findFirst({
            where: { idProducto, idRestaurante: tenantId, activa: true },
            include: {
                lineas: { orderBy: { orden: 'asc' } },
                producto: { select: { idProducto: true, nombre: true } },
            },
        });
        if (!row) {
            throw new common_1.NotFoundException('Receta no encontrada para ese producto');
        }
        return this.mapReceta(row);
    }
    async upsert(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        if (!dto.lineas.length) {
            throw new common_1.BadRequestException('La receta debe tener al menos una línea');
        }
        const producto = await this.prisma.producto.findUnique({
            where: { idProducto: dto.id_producto },
            include: { categoria: true },
        });
        if (!producto?.activo) {
            throw new common_1.BadRequestException('Producto no disponible');
        }
        for (const l of dto.lineas) {
            if (l.id_recurso == null &&
                l.id_inventario == null &&
                l.id_subreceta == null &&
                !l.opcional) {
                throw new common_1.BadRequestException('Cada línea debe tener recurso/ingrediente o subreceta (o marcarse opcional)');
            }
            if (l.id_recurso != null) {
                const rec = await this.prisma.recurso.findFirst({
                    where: { idRecurso: l.id_recurso, idRestaurante: tenantId },
                });
                if (!rec) {
                    throw new common_1.BadRequestException(`Recurso ${l.id_recurso} no encontrado`);
                }
            }
            if (l.id_inventario != null) {
                const art = await this.prisma.inventario.findFirst({
                    where: { idInventario: l.id_inventario, idRestaurante: tenantId },
                });
                if (!art) {
                    throw new common_1.BadRequestException(`Ingrediente ${l.id_inventario} no encontrado`);
                }
            }
            if (l.id_subreceta != null) {
                const sub = await this.prisma.recetaProducto.findFirst({
                    where: { idReceta: l.id_subreceta, idRestaurante: tenantId },
                });
                if (!sub) {
                    throw new common_1.BadRequestException(`Subreceta ${l.id_subreceta} no encontrada`);
                }
            }
        }
        const row = await this.prisma.$transaction(async (tx) => {
            const existente = await tx.recetaProducto.findUnique({
                where: { idProducto: dto.id_producto },
            });
            const receta = existente
                ? await tx.recetaProducto.update({
                    where: { idReceta: existente.idReceta },
                    data: { version: { increment: 1 }, activa: true },
                })
                : await tx.recetaProducto.create({
                    data: {
                        idRestaurante: tenantId,
                        idProducto: dto.id_producto,
                    },
                });
            await tx.recetaLinea.deleteMany({ where: { idReceta: receta.idReceta } });
            await tx.recetaLinea.createMany({
                data: await Promise.all(dto.lineas.map(async (l, orden) => {
                    let idRecurso = l.id_recurso ?? null;
                    let idInventario = l.id_inventario ?? null;
                    if (idRecurso == null && idInventario != null) {
                        const bridge = await tx.recurso.findUnique({
                            where: { idInventarioLegacy: idInventario },
                        });
                        idRecurso = bridge?.idRecurso ?? null;
                    }
                    if (idInventario == null && idRecurso != null) {
                        const bridge = await tx.recurso.findUnique({
                            where: { idRecurso },
                        });
                        idInventario = bridge?.idInventarioLegacy ?? null;
                    }
                    return {
                        idReceta: receta.idReceta,
                        idInventario,
                        idRecurso,
                        idSubreceta: l.id_subreceta ?? null,
                        cantidad: l.cantidad,
                        unidad: l.unidad.trim(),
                        opcional: l.opcional ?? false,
                        orden: l.orden ?? orden,
                        sustituciones: l.sustituciones?.length
                            ? l.sustituciones
                            : undefined,
                    };
                })),
            });
            const completa = await tx.recetaProducto.findUnique({
                where: { idReceta: receta.idReceta },
                include: {
                    lineas: { orderBy: { orden: 'asc' } },
                    producto: { select: { idProducto: true, nombre: true } },
                },
            });
            if (!completa) {
                throw new common_1.BadRequestException('No se pudo guardar la receta');
            }
            const [articulos, recursos] = await Promise.all([
                tx.inventario.findMany({ where: { idRestaurante: tenantId } }),
                tx.recurso.findMany({ where: { idRestaurante: tenantId } }),
            ]);
            const mapArt = new Map(articulos.map((a) => [
                a.idInventario,
                {
                    id_articulo: a.idInventario,
                    unidad_stock: a.unidad,
                    costo_unitario: a.costoUnitario != null ? Number(a.costoUnitario) : undefined,
                },
            ]));
            for (const r of recursos) {
                mapArt.set(r.idRecurso, {
                    id_articulo: r.idRecurso,
                    unidad_stock: r.unidad,
                    costo_unitario: Number(r.costo),
                });
            }
            const dominio = {
                id_receta: String(completa.idReceta),
                id_producto: completa.idProducto,
                lineas: completa.lineas.map((l) => this.mapLinea(l)),
            };
            const costo = (0, inventario_receta_1.calcularCostoReceta)(dominio, mapArt);
            await tx.recetaProducto.update({
                where: { idReceta: receta.idReceta },
                data: { costoCalculado: costo },
            });
            return tx.recetaProducto.findUnique({
                where: { idReceta: receta.idReceta },
                include: {
                    lineas: { orderBy: { orden: 'asc' } },
                    producto: { select: { idProducto: true, nombre: true } },
                },
            });
        });
        if (!row) {
            throw new common_1.BadRequestException('No se pudo guardar la receta');
        }
        (0, deduccion_contexto_cache_1.invalidateDeduccionEstructuraCache)(tenantId);
        return this.mapReceta(row);
    }
    async eliminar(idReceta, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const row = await this.prisma.recetaProducto.findFirst({
            where: { idReceta, idRestaurante: tenantId },
        });
        if (!row) {
            throw new common_1.NotFoundException('Receta no encontrada');
        }
        await this.prisma.recetaProducto.update({
            where: { idReceta },
            data: { activa: false },
        });
        (0, deduccion_contexto_cache_1.invalidateDeduccionEstructuraCache)(tenantId);
        return { ok: true };
    }
};
exports.InventarioRecetaService = InventarioRecetaService;
exports.InventarioRecetaService = InventarioRecetaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventarioRecetaService);
//# sourceMappingURL=inventario-receta.service.js.map