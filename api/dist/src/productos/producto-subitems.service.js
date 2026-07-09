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
exports.ProductoSubitemsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const pedidos_gateway_1 = require("../pedidos/pedidos.gateway");
function mapSubitem(row) {
    return {
        id_subitem: row.idSubitem,
        id_producto: row.idProducto,
        nombre: row.nombre,
        activo: row.activo,
        orden: row.orden,
    };
}
let ProductoSubitemsService = class ProductoSubitemsService {
    prisma;
    gateway;
    constructor(prisma, gateway) {
        this.prisma = prisma;
        this.gateway = gateway;
    }
    async listarPorProducto(idProducto) {
        const producto = await this.prisma.producto.findUnique({
            where: { idProducto },
            select: { idProducto: true },
        });
        if (!producto) {
            throw new common_1.NotFoundException('Producto no encontrado');
        }
        const rows = await this.prisma.productoSubitem.findMany({
            where: { idProducto },
            orderBy: [{ orden: 'asc' }, { idSubitem: 'asc' }],
        });
        return rows.map(mapSubitem);
    }
    async crear(idProducto, dto) {
        const producto = await this.prisma.producto.findUnique({
            where: { idProducto },
            select: {
                idProducto: true,
                esAcompanamientoMazorca: true,
                esEmpacable: true,
            },
        });
        if (!producto) {
            throw new common_1.NotFoundException('Producto no encontrado');
        }
        if (producto.esAcompanamientoMazorca) {
            throw new common_1.BadRequestException('La línea de mazorca no admite subítems repartibles');
        }
        if (producto.esEmpacable) {
            throw new common_1.BadRequestException('Las líneas de empaque no admiten subítems repartibles');
        }
        await this.prisma.producto.update({
            where: { idProducto },
            data: { usaSubitemsRepartibles: true },
        });
        const created = await this.prisma.productoSubitem.create({
            data: {
                idProducto,
                nombre: dto.nombre.trim(),
                orden: dto.orden ?? 0,
                activo: dto.activo ?? true,
            },
        });
        this.gateway.emitConfigActualizada('menu');
        return mapSubitem(created);
    }
    async actualizar(idSubitem, dto) {
        const existing = await this.prisma.productoSubitem.findUnique({
            where: { idSubitem },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Subítem no encontrado');
        }
        const updated = await this.prisma.productoSubitem.update({
            where: { idSubitem },
            data: {
                ...(dto.nombre != null ? { nombre: dto.nombre.trim() } : {}),
                ...(dto.orden != null ? { orden: dto.orden } : {}),
                ...(dto.activo != null ? { activo: dto.activo } : {}),
            },
        });
        this.gateway.emitConfigActualizada('menu');
        return mapSubitem(updated);
    }
    async eliminar(idSubitem) {
        const existing = await this.prisma.productoSubitem.findUnique({
            where: { idSubitem },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Subítem no encontrado');
        }
        const usos = await this.prisma.detSubitemCantidad.count({
            where: { idSubitem },
        });
        if (usos > 0) {
            throw new common_1.BadRequestException('No se puede eliminar: el subítem ya se usó en pedidos anteriores');
        }
        await this.prisma.productoSubitem.delete({ where: { idSubitem } });
        this.gateway.emitConfigActualizada('menu');
        return { ok: true, id_subitem: idSubitem };
    }
};
exports.ProductoSubitemsService = ProductoSubitemsService;
exports.ProductoSubitemsService = ProductoSubitemsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        pedidos_gateway_1.PedidosGateway])
], ProductoSubitemsService);
//# sourceMappingURL=producto-subitems.service.js.map