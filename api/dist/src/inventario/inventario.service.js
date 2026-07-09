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
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_constants_1 = require("../tenant/tenant.constants");
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
        return {
            id_inventario: row.idInventario,
            ingrediente: row.ingrediente,
            cantidad_actual,
            unidad: row.unidad,
            cantidad_minima,
            bajo_minimo: cantidad_actual <= cantidad_minima,
        };
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
        try {
            const row = await this.prisma.inventario.create({
                data: {
                    idRestaurante: tenantId,
                    ingrediente: nombre,
                    unidad,
                    cantidadActual: dto.cantidad_actual,
                    cantidadMinima: dto.cantidad_minima,
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
        try {
            const row = await this.prisma.inventario.update({
                where: { idInventario },
                data: {
                    ...(nombre != null ? { ingrediente: nombre } : {}),
                    ...(unidad != null ? { unidad } : {}),
                    ...(dto.cantidad_minima != null
                        ? { cantidadMinima: dto.cantidad_minima }
                        : {}),
                },
            });
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
            if (cantidad > actual) {
                throw new common_1.BadRequestException('No hay suficiente stock para ese consumo');
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
            return tx.inventario.update({
                where: { idInventario },
                data: { cantidadActual: nuevo },
            });
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