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
const inventario_costo_1 = require("@drewrest/shared-domain/inventario-costo");
const inventario_receta_1 = require("@drewrest/shared-domain/inventario-receta");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_constants_1 = require("../tenant/tenant.constants");
const deduccion_contexto_cache_1 = require("./deduccion-contexto-cache");
let InventarioRecetaService = class InventarioRecetaService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async loadConversiones(client, tenantId) {
        const rows = await client.conversionUnidad.findMany({
            where: { idRestaurante: tenantId },
        });
        return rows.map((c) => ({
            unidad_origen: c.unidadOrigen,
            unidad_destino: c.unidadDestino,
            factor: Number(c.factor),
        }));
    }
    async buildMapArticulos(client, tenantId, lineas) {
        const idsInv = new Set();
        const idsRec = new Set();
        if (lineas) {
            for (const l of lineas) {
                if (l.idInventario != null)
                    idsInv.add(l.idInventario);
                if (l.idRecurso != null)
                    idsRec.add(l.idRecurso);
            }
        }
        const [articulos, recursos] = await Promise.all([
            client.inventario.findMany({
                where: {
                    idRestaurante: tenantId,
                    ...(lineas ? { idInventario: { in: [...idsInv] } } : {}),
                },
            }),
            client.recurso.findMany({
                where: {
                    idRestaurante: tenantId,
                    ...(lineas ? { idRecurso: { in: [...idsRec] } } : {}),
                },
            }),
        ]);
        const mapArt = new Map();
        for (const a of articulos) {
            mapArt.set(a.idInventario, {
                id_articulo: a.idInventario,
                unidad_stock: a.unidad,
                costo_unitario: a.costoUnitario != null ? Number(a.costoUnitario) : undefined,
            });
        }
        for (const r of recursos) {
            mapArt.set(r.idRecurso, {
                id_articulo: r.idRecurso,
                unidad_stock: r.unidad,
                costo_unitario: Number(r.costo),
            });
        }
        return mapArt;
    }
    async loadRecetasActivas(client, tenantId) {
        return client.recetaProducto.findMany({
            where: { idRestaurante: tenantId, activa: true },
            include: {
                lineas: { orderBy: { orden: 'asc' } },
                producto: { select: { idProducto: true, nombre: true, precio: true } },
            },
        });
    }
    dominioDesdeRow(row) {
        return {
            id_receta: String(row.idReceta),
            id_producto: row.idProducto,
            lineas: row.lineas.map((l) => this.mapLinea(l)),
        };
    }
    async recalcularPorRecurso(idRecurso, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const recurso = await this.prisma.recurso.findFirst({
            where: { idRecurso, idRestaurante: tenantId },
            select: { idRecurso: true, idInventarioLegacy: true },
        });
        if (!recurso) {
            return { productos_actualizados: 0, ids_producto: [] };
        }
        const todas = await this.loadRecetasActivas(this.prisma, tenantId);
        if (!todas.length) {
            return { productos_actualizados: 0, ids_producto: [] };
        }
        const porId = new Map(todas.map((r) => [r.idReceta, r]));
        const afectadas = new Set();
        for (const r of todas) {
            for (const l of r.lineas) {
                if (l.idRecurso === idRecurso)
                    afectadas.add(r.idReceta);
                if (recurso.idInventarioLegacy != null &&
                    l.idInventario === recurso.idInventarioLegacy) {
                    afectadas.add(r.idReceta);
                }
            }
        }
        let crecio = true;
        while (crecio) {
            crecio = false;
            for (const r of todas) {
                if (afectadas.has(r.idReceta))
                    continue;
                for (const l of r.lineas) {
                    if (l.idSubreceta != null && afectadas.has(l.idSubreceta)) {
                        afectadas.add(r.idReceta);
                        crecio = true;
                        break;
                    }
                }
            }
        }
        if (!afectadas.size) {
            return { productos_actualizados: 0, ids_producto: [] };
        }
        const mapArt = await this.buildMapArticulos(this.prisma, tenantId, todas.flatMap((r) => r.lineas));
        const conversiones = await this.loadConversiones(this.prisma, tenantId);
        const mapRecetas = new Map();
        for (const r of todas) {
            mapRecetas.set(String(r.idReceta), this.dominioDesdeRow(r));
        }
        const idsProducto = [];
        await this.prisma.$transaction(async (tx) => {
            for (const idReceta of afectadas) {
                const row = porId.get(idReceta);
                if (!row)
                    continue;
                const costo = (0, inventario_receta_1.calcularCostoReceta)(this.dominioDesdeRow(row), mapArt, mapRecetas, conversiones);
                await tx.recetaProducto.update({
                    where: { idReceta },
                    data: { costoCalculado: costo },
                });
                idsProducto.push(row.idProducto);
            }
        });
        (0, deduccion_contexto_cache_1.invalidateDeduccionEstructuraCache)(tenantId);
        return {
            productos_actualizados: idsProducto.length,
            ids_producto: [...new Set(idsProducto)],
        };
    }
    async recalcularPorInventario(idInventario, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const bridge = await this.prisma.recurso.findFirst({
            where: { idInventarioLegacy: idInventario, idRestaurante: tenantId },
            select: { idRecurso: true },
        });
        if (bridge) {
            return this.recalcularPorRecurso(bridge.idRecurso, tenantId);
        }
        const lineas = await this.prisma.recetaLinea.findMany({
            where: {
                idInventario,
                receta: { idRestaurante: tenantId, activa: true },
            },
            select: { idReceta: true },
        });
        const ids = [...new Set(lineas.map((l) => l.idReceta))];
        if (!ids.length) {
            return { productos_actualizados: 0, ids_producto: [] };
        }
        const todas = await this.loadRecetasActivas(this.prisma, tenantId);
        const porId = new Map(todas.map((r) => [r.idReceta, r]));
        const afectadas = new Set(ids);
        let crecio = true;
        while (crecio) {
            crecio = false;
            for (const r of todas) {
                if (afectadas.has(r.idReceta))
                    continue;
                for (const l of r.lineas) {
                    if (l.idSubreceta != null && afectadas.has(l.idSubreceta)) {
                        afectadas.add(r.idReceta);
                        crecio = true;
                        break;
                    }
                }
            }
        }
        const mapArt = await this.buildMapArticulos(this.prisma, tenantId, todas.flatMap((r) => r.lineas));
        const conversiones = await this.loadConversiones(this.prisma, tenantId);
        const mapRecetas = new Map();
        for (const r of todas) {
            mapRecetas.set(String(r.idReceta), this.dominioDesdeRow(r));
        }
        const idsProducto = [];
        await this.prisma.$transaction(async (tx) => {
            for (const idReceta of afectadas) {
                const row = porId.get(idReceta);
                if (!row)
                    continue;
                const costo = (0, inventario_receta_1.calcularCostoReceta)(this.dominioDesdeRow(row), mapArt, mapRecetas, conversiones);
                await tx.recetaProducto.update({
                    where: { idReceta },
                    data: { costoCalculado: costo },
                });
                idsProducto.push(row.idProducto);
            }
        });
        (0, deduccion_contexto_cache_1.invalidateDeduccionEstructuraCache)(tenantId);
        return {
            productos_actualizados: idsProducto.length,
            ids_producto: [...new Set(idsProducto)],
        };
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
            precio_venta: Number(row.producto.precio),
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
    async listarCostosProduccion(tenantId = tenant_constants_1.DEFAULT_TENANT_ID, margenObjetivoPct) {
        const rows = await this.prisma.recetaProducto.findMany({
            where: { idRestaurante: tenantId, activa: true },
            include: {
                lineas: { orderBy: { orden: 'asc' } },
                producto: { select: { idProducto: true, nombre: true, precio: true } },
            },
            orderBy: { idReceta: 'asc' },
        });
        if (!rows.length)
            return [];
        const mapArt = await this.buildMapArticulos(this.prisma, tenantId, rows.flatMap((r) => r.lineas));
        const conversiones = await this.loadConversiones(this.prisma, tenantId);
        const mapRecetas = new Map();
        for (const r of rows) {
            mapRecetas.set(String(r.idReceta), this.dominioDesdeRow(r));
        }
        return rows.map((row) => {
            const costo = row.costoCalculado != null
                ? Number(row.costoCalculado)
                : (0, inventario_receta_1.calcularCostoReceta)(this.dominioDesdeRow(row), mapArt, mapRecetas, conversiones);
            const precio = Number(row.producto.precio);
            const analisis = (0, inventario_costo_1.analizarRentabilidadReceta)(costo, precio, {
                margen_objetivo_pct: margenObjetivoPct,
            });
            const sinCosto = row.lineas.some((l) => {
                if (l.opcional)
                    return false;
                const id = l.idRecurso ?? l.idInventario;
                if (id == null)
                    return false;
                const art = mapArt.get(id);
                return art == null || !(art.costo_unitario != null && art.costo_unitario > 0);
            });
            return {
                id_receta: row.idReceta,
                id_producto: row.idProducto,
                producto: row.producto.nombre,
                ...analisis,
                advertencia_sin_costo: sinCosto,
            };
        });
    }
    async listar(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const rows = await this.prisma.recetaProducto.findMany({
            where: { idRestaurante: tenantId, activa: true },
            include: {
                lineas: { orderBy: { orden: 'asc' } },
                producto: { select: { idProducto: true, nombre: true, precio: true } },
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
                producto: { select: { idProducto: true, nombre: true, precio: true } },
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
                if (!l.opcional && !(Number(rec.costo) > 0)) {
                    throw new common_1.BadRequestException(`El recurso «${rec.nombre}» no tiene precio/costo de compra. Registra una compra o define su costo antes de usarlo en la receta.`);
                }
            }
            if (l.id_inventario != null) {
                const art = await this.prisma.inventario.findFirst({
                    where: { idInventario: l.id_inventario, idRestaurante: tenantId },
                });
                if (!art) {
                    throw new common_1.BadRequestException(`Ingrediente ${l.id_inventario} no encontrado`);
                }
                if (!l.opcional &&
                    !(art.costoUnitario != null && Number(art.costoUnitario) > 0)) {
                    throw new common_1.BadRequestException(`El ingrediente «${art.ingrediente}» no tiene costo de compra definido.`);
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
                    producto: {
                        select: { idProducto: true, nombre: true, precio: true },
                    },
                },
            });
            if (!completa) {
                throw new common_1.BadRequestException('No se pudo guardar la receta');
            }
            const todas = await this.loadRecetasActivas(tx, tenantId);
            const mapArt = await this.buildMapArticulos(tx, tenantId, todas.flatMap((r) => r.lineas));
            const conversiones = await this.loadConversiones(tx, tenantId);
            const mapRecetas = new Map();
            for (const r of todas) {
                mapRecetas.set(String(r.idReceta), this.dominioDesdeRow(r));
            }
            mapRecetas.set(String(completa.idReceta), this.dominioDesdeRow(completa));
            const dominio = this.dominioDesdeRow(completa);
            const costo = (0, inventario_receta_1.calcularCostoReceta)(dominio, mapArt, mapRecetas, conversiones);
            await tx.recetaProducto.update({
                where: { idReceta: receta.idReceta },
                data: { costoCalculado: costo },
            });
            return tx.recetaProducto.findUnique({
                where: { idReceta: receta.idReceta },
                include: {
                    lineas: { orderBy: { orden: 'asc' } },
                    producto: {
                        select: { idProducto: true, nombre: true, precio: true },
                    },
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