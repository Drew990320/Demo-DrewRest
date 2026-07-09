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
exports.PersonalizacionesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const pedidos_gateway_1 = require("../pedidos/pedidos.gateway");
function mapOpcion(o) {
    return {
        id_opcion: o.idOpcion,
        id_producto: o.idProducto,
        tipo: o.tipo,
        descripcion: o.descripcion,
    };
}
let PersonalizacionesService = class PersonalizacionesService {
    prisma;
    gateway;
    constructor(prisma, gateway) {
        this.prisma = prisma;
        this.gateway = gateway;
    }
    async listarPorProducto(idProducto) {
        const prod = await this.prisma.producto.findUnique({
            where: { idProducto },
        });
        if (!prod) {
            throw new common_1.NotFoundException('Producto no encontrado');
        }
        const rows = await this.prisma.personalizacionOpcion.findMany({
            where: { idProducto },
            orderBy: [{ tipo: 'asc' }, { idOpcion: 'asc' }],
        });
        return rows.map(mapOpcion);
    }
    async crear(idProducto, dto) {
        const prod = await this.prisma.producto.findUnique({
            where: { idProducto },
        });
        if (!prod) {
            throw new common_1.NotFoundException('Producto no encontrado');
        }
        if (prod.esAcompanamientoMazorca) {
            throw new common_1.BadRequestException('La línea de mazorca no admite personalizaciones');
        }
        const descripcion = dto.descripcion.trim();
        const created = await this.prisma.personalizacionOpcion.create({
            data: {
                idProducto,
                tipo: dto.tipo,
                descripcion,
            },
        });
        this.gateway.emitConfigActualizada('menu');
        return mapOpcion(created);
    }
    async actualizar(idOpcion, dto) {
        const existing = await this.prisma.personalizacionOpcion.findUnique({
            where: { idOpcion },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Opción no encontrada');
        }
        const updated = await this.prisma.personalizacionOpcion.update({
            where: { idOpcion },
            data: {
                ...(dto.tipo != null ? { tipo: dto.tipo } : {}),
                ...(dto.descripcion != null
                    ? { descripcion: dto.descripcion.trim() }
                    : {}),
            },
        });
        this.gateway.emitConfigActualizada('menu');
        return mapOpcion(updated);
    }
    async eliminar(idOpcion) {
        const existing = await this.prisma.personalizacionOpcion.findUnique({
            where: { idOpcion },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Opción no encontrada');
        }
        const usos = await this.prisma.detPersonalizacion.count({
            where: { idOpcion },
        });
        if (usos > 0) {
            throw new common_1.BadRequestException('No se puede eliminar: la opción ya se usó en pedidos anteriores');
        }
        await this.prisma.personalizacionOpcion.delete({
            where: { idOpcion },
        });
        this.gateway.emitConfigActualizada('menu');
        return { ok: true, id_opcion: idOpcion };
    }
};
exports.PersonalizacionesService = PersonalizacionesService;
exports.PersonalizacionesService = PersonalizacionesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        pedidos_gateway_1.PedidosGateway])
], PersonalizacionesService);
//# sourceMappingURL=personalizaciones.service.js.map