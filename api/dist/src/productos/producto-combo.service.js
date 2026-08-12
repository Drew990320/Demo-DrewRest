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
exports.ProductoComboService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const pedidos_gateway_1 = require("../pedidos/pedidos.gateway");
const tenant_constants_1 = require("../tenant/tenant.constants");
const menu_hoy_cache_1 = require("../common/menu-hoy-cache");
let ProductoComboService = class ProductoComboService {
    prisma;
    gateway;
    constructor(prisma, gateway) {
        this.prisma = prisma;
        this.gateway = gateway;
    }
    async listarElegibles(idProductoCombo, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        await this.exigirCombo(idProductoCombo, tenantId);
        const rows = await this.prisma.productoComboElegible.findMany({
            where: { idProductoCombo },
            include: {
                componente: {
                    include: { categoria: { select: { nombre: true, esBebida: true } } },
                },
            },
            orderBy: [{ orden: 'asc' }, { idComboElegible: 'asc' }],
        });
        return rows.map((r) => ({
            id_combo_elegible: r.idComboElegible,
            id_producto: r.idProductoComponente,
            nombre: r.componente.nombre,
            precio: Number(r.componente.precio),
            activo: r.componente.activo,
            categoria_nombre: r.componente.categoria.nombre,
            es_bebida: r.componente.categoria.esBebida,
            orden: r.orden,
        }));
    }
    async reemplazarElegibles(idProductoCombo, idProductos, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const combo = await this.exigirCombo(idProductoCombo, tenantId);
        if (!combo.esCombo) {
            throw new common_1.BadRequestException('Activa «Es combo» en el producto antes de definir elegibles');
        }
        const ids = [...new Set(idProductos.map((n) => Math.round(n)).filter((n) => n > 0))];
        if (ids.includes(idProductoCombo)) {
            throw new common_1.BadRequestException('Un combo no puede incluirse a sí mismo');
        }
        if (ids.length > 0) {
            const comps = await this.prisma.producto.findMany({
                where: {
                    idProducto: { in: ids },
                    categoria: { idRestaurante: tenantId },
                },
                include: { categoria: true },
            });
            if (comps.length !== ids.length) {
                throw new common_1.BadRequestException('Algún producto elegible no existe');
            }
            for (const c of comps) {
                if (c.esCombo) {
                    throw new common_1.BadRequestException(`«${c.nombre}» es un combo; no se puede anidar`);
                }
                if (c.esAcompanamientoMazorca || c.esCuotaPendienteReparto) {
                    throw new common_1.BadRequestException(`«${c.nombre}» no puede ser componente de combo`);
                }
                if (c.categoria.esLineaEmpaque || c.esEmpacable) {
                    throw new common_1.BadRequestException(`«${c.nombre}» es línea de empaque; no puede ser componente`);
                }
            }
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.productoComboElegible.deleteMany({
                where: { idProductoCombo },
            });
            if (ids.length > 0) {
                await tx.productoComboElegible.createMany({
                    data: ids.map((idProductoComponente, orden) => ({
                        idProductoCombo,
                        idProductoComponente,
                        orden,
                    })),
                });
            }
            const cantidadFija = Math.max(1, ids.length);
            await tx.producto.update({
                where: { idProducto: idProductoCombo },
                data: { comboMin: cantidadFija, comboMax: cantidadFija },
            });
        });
        (0, menu_hoy_cache_1.invalidateMenuHoyCache)();
        this.gateway.emitConfigActualizada('menu', tenantId);
        return this.listarElegibles(idProductoCombo, tenantId);
    }
    async exigirCombo(idProducto, tenantId) {
        const p = await this.prisma.producto.findFirst({
            where: { idProducto, categoria: { idRestaurante: tenantId } },
        });
        if (!p)
            throw new common_1.NotFoundException('Producto no encontrado');
        return p;
    }
};
exports.ProductoComboService = ProductoComboService;
exports.ProductoComboService = ProductoComboService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        pedidos_gateway_1.PedidosGateway])
], ProductoComboService);
//# sourceMappingURL=producto-combo.service.js.map