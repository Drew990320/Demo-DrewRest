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
exports.ProductoInventarioVinculoService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_constants_1 = require("../tenant/tenant.constants");
let ProductoInventarioVinculoService = class ProductoInventarioVinculoService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async mapaVinculosMenu(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const [comerciales, recetas] = await Promise.all([
            this.prisma.inventario.findMany({
                where: { idRestaurante: tenantId, idProducto: { not: null } },
                select: {
                    idInventario: true,
                    idProducto: true,
                    claseInventario: true,
                },
            }),
            this.prisma.recetaProducto.findMany({
                where: { idRestaurante: tenantId, activa: true },
                select: {
                    idReceta: true,
                    idProducto: true,
                    _count: { select: { lineas: true } },
                },
            }),
        ]);
        const map = {};
        for (const inv of comerciales) {
            if (inv.idProducto == null)
                continue;
            const key = String(inv.idProducto);
            const prev = map[key] ?? {
                comercial: false,
                id_inventario: null,
                receta_activa: false,
                id_receta: null,
                lineas_receta: 0,
            };
            map[key] = {
                ...prev,
                comercial: inv.claseInventario === 'comercial',
                id_inventario: inv.idInventario,
            };
        }
        for (const r of recetas) {
            const key = String(r.idProducto);
            const prev = map[key] ?? {
                comercial: false,
                id_inventario: null,
                receta_activa: false,
                id_receta: null,
                lineas_receta: 0,
            };
            map[key] = {
                ...prev,
                receta_activa: true,
                id_receta: r.idReceta,
                lineas_receta: r._count.lineas,
            };
        }
        return map;
    }
    async sincronizarNombreDesdeProducto(idProducto, nombre, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const n = nombre.trim();
        if (!n)
            return;
        await this.prisma.inventario.updateMany({
            where: { idProducto, idRestaurante: tenantId },
            data: { ingrediente: n },
        });
    }
    async validarEliminacionPermanenteProducto(idProducto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const receta = await this.prisma.recetaProducto.findUnique({
            where: { idProducto },
            include: {
                _count: { select: { usadaComoSubreceta: true } },
            },
        });
        if (receta) {
            if (receta._count.usadaComoSubreceta > 0) {
                throw new common_1.ConflictException('La receta de este producto es usada por otros platos. Ocúltalo del menú en lugar de eliminarlo.');
            }
            throw new common_1.ConflictException('Tiene receta en Inventario. Ocúltalo del menú; la receta se gestiona desde Inventario.');
        }
        const inv = await this.prisma.inventario.findFirst({
            where: { idProducto, idRestaurante: tenantId },
            include: { _count: { select: { movimientos: true } } },
        });
        if (inv) {
            if (inv._count.movimientos > 0) {
                throw new common_1.ConflictException('Tiene movimientos de inventario asociados. Ocúltalo del menú en lugar de eliminarlo.');
            }
            if (Number(inv.cantidadActual) > 0) {
                throw new common_1.ConflictException('Tiene stock en Inventario. Ajusta o desvincula desde Inventario antes de eliminar.');
            }
        }
    }
};
exports.ProductoInventarioVinculoService = ProductoInventarioVinculoService;
exports.ProductoInventarioVinculoService = ProductoInventarioVinculoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductoInventarioVinculoService);
//# sourceMappingURL=producto-inventario-vinculo.service.js.map