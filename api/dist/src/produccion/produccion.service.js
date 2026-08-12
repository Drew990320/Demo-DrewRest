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
exports.ProduccionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_constants_1 = require("../tenant/tenant.constants");
const fecha_bogota_db_1 = require("../common/fecha-bogota-db");
const inventario_deduccion_service_1 = require("../inventario/inventario-deduccion.service");
let ProduccionService = class ProduccionService {
    prisma;
    deduccion;
    constructor(prisma, deduccion) {
        this.prisma = prisma;
        this.deduccion = deduccion;
    }
    async assertModulo(tenantId) {
        const cfg = await this.prisma.configRestaurante.findUnique({
            where: { idRestaurante: tenantId },
            select: { moduloProduccionPorcionesActivo: true },
        });
        if (!cfg?.moduloProduccionPorcionesActivo) {
            throw new common_1.BadRequestException('El módulo de producción por porciones no está activo');
        }
    }
    async registrar(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID, idUsuario) {
        await this.assertModulo(tenantId);
        const enteras = Math.max(1, Math.round(dto.enteras));
        const producto = await this.prisma.producto.findFirst({
            where: {
                idProducto: dto.id_producto,
                categoria: { idRestaurante: tenantId, canal: 'restaurante' },
            },
            include: {
                receta: { include: { lineas: true } },
            },
        });
        if (!producto) {
            throw new common_1.NotFoundException('Producto no encontrado');
        }
        if (!producto.usaProduccionPorciones) {
            throw new common_1.BadRequestException('Este producto no está configurado para producción por porciones');
        }
        const porcionesPorEntera = Math.max(1, producto.porcionesPorEntera ?? 8);
        if (!producto.receta?.activa || !(producto.receta.lineas?.length > 0)) {
            throw new common_1.BadRequestException('Define la receta de 1 entera (ingredientes) antes de registrar producción');
        }
        if (!producto.controlStock) {
            throw new common_1.BadRequestException('Activa el control de stock en el producto para llevar el conteo de porciones');
        }
        const { date: fecha, iso } = (0, fecha_bogota_db_1.fechaBogotaDb)();
        const porcionesGeneradas = enteras * porcionesPorEntera;
        const idDocumento = `prod-porcion:${tenantId}:${producto.idProducto}:${iso}:${Date.now()}`;
        const row = await this.prisma.$transaction(async (tx) => {
            await this.deduccion.consumirRecetaProduccionEnTx(tx, {
                tenantId,
                idProducto: producto.idProducto,
                cantidadEnteras: enteras,
                idUsuario,
                idDocumento,
                nombreProducto: producto.nombre,
            });
            await tx.producto.update({
                where: { idProducto: producto.idProducto },
                data: { stockDisponible: { increment: porcionesGeneradas } },
            });
            return tx.produccionPorcion.create({
                data: {
                    idRestaurante: tenantId,
                    idProducto: producto.idProducto,
                    fecha,
                    enteras,
                    porcionesPorEntera,
                    porcionesGeneradas,
                    idUsuario: idUsuario ?? null,
                },
            });
        });
        const actualizado = await this.prisma.producto.findUnique({
            where: { idProducto: producto.idProducto },
            select: { stockDisponible: true, nombre: true },
        });
        return {
            id_produccion: row.idProduccion,
            id_producto: row.idProducto,
            nombre: actualizado?.nombre ?? producto.nombre,
            fecha: iso,
            enteras: row.enteras,
            porciones_por_entera: row.porcionesPorEntera,
            porciones_generadas: row.porcionesGeneradas,
            stock_disponible: actualizado?.stockDisponible ?? 0,
        };
    }
    async resumenDia(fecha, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        await this.assertModulo(tenantId);
        const { date, iso } = (0, fecha_bogota_db_1.fechaBogotaDb)(fecha);
        const hornadas = await this.prisma.produccionPorcion.findMany({
            where: { idRestaurante: tenantId, fecha: date },
            include: {
                producto: {
                    select: {
                        idProducto: true,
                        nombre: true,
                        stockDisponible: true,
                        controlStock: true,
                        usaProduccionPorciones: true,
                        porcionesPorEntera: true,
                    },
                },
            },
            orderBy: [{ creadoEn: 'asc' }],
        });
        const byProd = new Map();
        for (const h of hornadas) {
            const cur = byProd.get(h.idProducto) ?? {
                id_producto: h.idProducto,
                nombre: h.producto.nombre,
                porciones_por_entera: h.porcionesPorEntera,
                enteras: 0,
                porciones_generadas: 0,
                stock_disponible: h.producto.stockDisponible,
                hornadas: 0,
            };
            cur.enteras += h.enteras;
            cur.porciones_generadas += h.porcionesGeneradas;
            cur.stock_disponible = h.producto.stockDisponible;
            cur.hornadas += 1;
            byProd.set(h.idProducto, cur);
        }
        const configurados = await this.prisma.producto.findMany({
            where: {
                usaProduccionPorciones: true,
                activo: true,
                categoria: { idRestaurante: tenantId, canal: 'restaurante' },
            },
            select: {
                idProducto: true,
                nombre: true,
                stockDisponible: true,
                porcionesPorEntera: true,
            },
        });
        for (const p of configurados) {
            if (byProd.has(p.idProducto))
                continue;
            byProd.set(p.idProducto, {
                id_producto: p.idProducto,
                nombre: p.nombre,
                porciones_por_entera: Math.max(1, p.porcionesPorEntera ?? 8),
                enteras: 0,
                porciones_generadas: 0,
                stock_disponible: p.stockDisponible,
                hornadas: 0,
            });
        }
        const productos = [...byProd.values()].map((p) => {
            const quedan = Math.max(0, p.stock_disponible);
            const vendidas = Math.max(0, p.porciones_generadas - quedan);
            return {
                ...p,
                porciones_vendidas_aprox: vendidas,
                porciones_quedan: quedan,
            };
        });
        return {
            fecha: iso,
            productos: productos.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
            hornadas: hornadas.map((h) => ({
                id_produccion: h.idProduccion,
                id_producto: h.idProducto,
                nombre: h.producto.nombre,
                enteras: h.enteras,
                porciones_por_entera: h.porcionesPorEntera,
                porciones_generadas: h.porcionesGeneradas,
                creado_en: h.creadoEn.toISOString(),
            })),
        };
    }
};
exports.ProduccionService = ProduccionService;
exports.ProduccionService = ProduccionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        inventario_deduccion_service_1.InventarioDeduccionService])
], ProduccionService);
//# sourceMappingURL=produccion.service.js.map