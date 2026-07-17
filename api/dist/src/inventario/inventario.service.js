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
exports.InventarioService = void 0;
const common_1 = require("@nestjs/common");
const inventario_comportamiento_1 = require("@drewrest/shared-domain/inventario-comportamiento");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_constants_1 = require("../tenant/tenant.constants");
const inventario_stock_producto_1 = require("./inventario-stock-producto");
const deduccion_contexto_cache_1 = require("./deduccion-contexto-cache");
let InventarioService = class InventarioService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    qty(v) {
        return Math.round(Number(v) * 1000) / 1000;
    }
    mapItem(row) {
        const cantidad_actual = this.qty(row.cantidadActual);
        const cantidad_minima = this.qty(row.cantidadMinima);
        const clase = (0, inventario_comportamiento_1.esClaseInventario)(row.claseInventario)
            ? row.claseInventario
            : 'produccion';
        return {
            id_inventario: row.idInventario,
            ingrediente: row.ingrediente,
            cantidad_actual,
            unidad: row.unidad,
            cantidad_minima,
            bajo_minimo: cantidad_actual <= cantidad_minima,
            clase_inventario: clase,
            comportamiento: (0, inventario_comportamiento_1.parseComportamientoJson)(row.comportamiento, clase),
            ubicacion: row.ubicacion,
            estado_activo: row.estadoActivo,
            costo_unitario: row.costoUnitario != null ? Number(row.costoUnitario) : null,
            id_producto: row.idProducto,
        };
    }
    resolverClase(raw) {
        if (raw == null)
            return 'produccion';
        const c = raw.trim();
        if (!(0, inventario_comportamiento_1.esClaseInventario)(c)) {
            throw new common_1.BadRequestException('Clase de inventario no válida');
        }
        return c;
    }
    async listar(soloBajoMinimo = false, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const rows = await this.prisma.inventario.findMany({
            where: { idRestaurante: tenantId },
            orderBy: [{ ingrediente: 'asc' }],
        });
        const items = rows.map((r) => this.mapItem(r));
        if (soloBajoMinimo) {
            return items.filter((i) => i.bajo_minimo);
        }
        return items;
    }
    async crear(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const nombre = dto.ingrediente.trim();
        if (!nombre) {
            throw new common_1.BadRequestException('Indica el nombre del ítem');
        }
        const unidad = dto.unidad.trim();
        if (!unidad) {
            throw new common_1.BadRequestException('Indica la unidad (ej. kg, u, L)');
        }
        const clase = this.resolverClase(dto.clase_inventario);
        if (dto.id_producto != null) {
            const prod = await this.prisma.producto.findUnique({
                where: { idProducto: dto.id_producto },
            });
            if (!prod?.activo) {
                throw new common_1.BadRequestException('Producto del menú no encontrado');
            }
        }
        try {
            const row = await this.prisma.inventario.create({
                data: {
                    idRestaurante: tenantId,
                    ingrediente: nombre,
                    unidad,
                    cantidadActual: dto.cantidad_actual,
                    cantidadMinima: dto.cantidad_minima,
                    claseInventario: clase,
                    comportamiento: dto.comportamiento ?? {},
                    idProducto: dto.id_producto ?? null,
                },
            });
            if (dto.cantidad_actual > 0) {
                await this.prisma.movInventario.create({
                    data: {
                        idInventario: row.idInventario,
                        tipoMov: 'entrada',
                        cantidad: dto.cantidad_actual,
                        observacion: 'Inventario inicial',
                    },
                });
            }
            if (row.idProducto != null && clase === 'comercial') {
                await this.prisma.$transaction(async (tx) => {
                    await (0, inventario_stock_producto_1.syncStockProductoDesdeInventarioTx)(tx, row.idProducto, tenantId);
                });
            }
            (0, deduccion_contexto_cache_1.invalidateDeduccionEstructuraCache)(tenantId);
            return this.mapItem(row);
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                e.code === 'P2002') {
                throw new common_1.ConflictException('Ya existe un ítem con ese nombre');
            }
            throw e;
        }
    }
    async actualizar(idInventario, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const actual = await this.prisma.inventario.findFirst({
            where: { idInventario, idRestaurante: tenantId },
        });
        if (!actual) {
            throw new common_1.NotFoundException('Ítem de inventario no encontrado');
        }
        const nombre = dto.ingrediente?.trim();
        if (dto.ingrediente != null && !nombre) {
            throw new common_1.BadRequestException('El nombre no puede quedar vacío');
        }
        const unidad = dto.unidad?.trim();
        if (dto.unidad != null && !unidad) {
            throw new common_1.BadRequestException('La unidad no puede quedar vacía');
        }
        const clase = dto.clase_inventario != null
            ? this.resolverClase(dto.clase_inventario)
            : undefined;
        try {
            const row = await this.prisma.inventario.update({
                where: { idInventario },
                data: {
                    ...(nombre != null ? { ingrediente: nombre } : {}),
                    ...(unidad != null ? { unidad } : {}),
                    ...(dto.cantidad_minima != null
                        ? { cantidadMinima: dto.cantidad_minima }
                        : {}),
                    ...(clase != null ? { claseInventario: clase } : {}),
                    ...(dto.comportamiento != null
                        ? { comportamiento: dto.comportamiento }
                        : {}),
                    ...(dto.ubicacion !== undefined ? { ubicacion: dto.ubicacion } : {}),
                    ...(dto.estado_activo !== undefined
                        ? { estadoActivo: dto.estado_activo }
                        : {}),
                    ...(dto.costo_unitario !== undefined
                        ? { costoUnitario: dto.costo_unitario }
                        : {}),
                    ...(dto.id_producto !== undefined
                        ? { idProducto: dto.id_producto }
                        : {}),
                },
            });
            if (row.idProducto != null && row.claseInventario === 'comercial') {
                await this.prisma.$transaction(async (tx) => {
                    await (0, inventario_stock_producto_1.syncStockProductoDesdeInventarioTx)(tx, row.idProducto, tenantId);
                });
            }
            (0, deduccion_contexto_cache_1.invalidateDeduccionEstructuraCache)(tenantId);
            return this.mapItem(row);
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                e.code === 'P2002') {
                throw new common_1.ConflictException('Ya existe un ítem con ese nombre');
            }
            throw e;
        }
    }
    async registrarMovimiento(idInventario, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const item = await this.prisma.inventario.findFirst({
            where: { idInventario, idRestaurante: tenantId },
        });
        if (!item) {
            throw new common_1.NotFoundException('Ítem de inventario no encontrado');
        }
        const cantidad = this.qty(dto.cantidad);
        const actual = this.qty(item.cantidadActual);
        let nuevo = actual;
        if (dto.tipo_mov === 'entrada') {
            if (cantidad <= 0) {
                throw new common_1.BadRequestException('La entrada debe ser mayor que cero');
            }
            nuevo = this.qty(actual + cantidad);
        }
        else if (dto.tipo_mov === 'consumo') {
            if (cantidad <= 0) {
                throw new common_1.BadRequestException('El consumo debe ser mayor que cero');
            }
            nuevo = this.qty(actual - cantidad);
        }
        else {
            nuevo = cantidad;
        }
        const movCantidad = dto.tipo_mov === 'ajuste' ? Math.abs(nuevo - actual) : cantidad;
        const row = await this.prisma.$transaction(async (tx) => {
            await tx.movInventario.create({
                data: {
                    idInventario,
                    tipoMov: dto.tipo_mov,
                    cantidad: movCantidad,
                    observacion: dto.observacion?.trim() || null,
                },
            });
            const updated = await tx.inventario.update({
                where: { idInventario },
                data: { cantidadActual: nuevo },
            });
            if (updated.idProducto != null && updated.claseInventario === 'comercial') {
                await (0, inventario_stock_producto_1.syncStockProductoDesdeInventarioTx)(tx, updated.idProducto, tenantId);
            }
            return updated;
        });
        return this.mapItem(row);
    }
    async vincularProductoComercial(idProducto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const producto = await this.prisma.producto.findUnique({
            where: { idProducto },
            include: { categoria: true },
        });
        if (!producto?.activo) {
            throw new common_1.NotFoundException('Producto no encontrado');
        }
        const existente = await this.prisma.inventario.findFirst({
            where: { idProducto, idRestaurante: tenantId },
        });
        if (existente) {
            return this.mapItem(existente);
        }
        const stock = producto.controlStock
            ? Math.max(0, producto.stockDisponible)
            : 0;
        const row = await this.prisma.$transaction(async (tx) => {
            const created = await tx.inventario.create({
                data: {
                    idRestaurante: tenantId,
                    ingrediente: producto.nombre,
                    unidad: 'u',
                    cantidadActual: stock,
                    cantidadMinima: 0,
                    claseInventario: 'comercial',
                    idProducto,
                    costoUnitario: null,
                },
            });
            if (stock > 0) {
                await tx.movInventario.create({
                    data: {
                        idInventario: created.idInventario,
                        tipoMov: 'entrada',
                        cantidad: stock,
                        observacion: 'Migración desde stock de menú',
                    },
                });
            }
            await tx.producto.update({
                where: { idProducto },
                data: { controlStock: true },
            });
            await (0, inventario_stock_producto_1.syncStockProductoDesdeInventarioTx)(tx, idProducto, tenantId);
            return created;
        });
        return this.mapItem(row);
    }
};
exports.InventarioService = InventarioService;
exports.InventarioService = InventarioService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventarioService);
//# sourceMappingURL=inventario.service.js.map