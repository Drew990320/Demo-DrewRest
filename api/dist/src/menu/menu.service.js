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
exports.MenuService = void 0;
const common_1 = require("@nestjs/common");
const categoria_menu_icon_1 = require("@drewrest/shared-domain/categoria-menu-icon");
const prisma_service_1 = require("../prisma/prisma.service");
const categoria_dia_1 = require("../common/categoria-dia");
const menu_hoy_cache_1 = require("../common/menu-hoy-cache");
const timezone_1 = require("../common/timezone");
const stock_producto_1 = require("@drewrest/shared-domain/stock-producto");
function categoriaDisponibleHoy(cat, weekday) {
    return (0, categoria_dia_1.categoriaDisponibleEnDia)(cat, weekday);
}
let MenuService = class MenuService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    invalidateCache() {
        (0, menu_hoy_cache_1.invalidateMenuHoyCache)();
    }
    async menuHoy() {
        const cached = (0, menu_hoy_cache_1.getCachedMenuHoy)();
        if (cached) {
            return cached;
        }
        const weekday = (0, timezone_1.weekdayBogota)();
        const categorias = await this.prisma.categoria.findMany({
            include: {
                productos: {
                    where: { activo: true, esAcompanamientoMazorca: false },
                    include: {
                        subitems: {
                            where: { activo: true },
                            orderBy: [{ orden: 'asc' }, { idSubitem: 'asc' }],
                        },
                    },
                    orderBy: { nombre: 'asc' },
                },
            },
            orderBy: { nombre: 'asc' },
        });
        const out = categorias
            .filter((c) => c.activo)
            .filter((c) => categoriaDisponibleHoy(c, weekday))
            .map((c) => ({
            id_categoria: c.idCategoria,
            nombre: c.nombre,
            icono_menu: (0, categoria_menu_icon_1.normalizarIconoMenuGuardado)(c.iconoMenu, c.nombre),
            es_bebida: c.esBebida,
            visible_en_mostrador: c.visibleEnMostrador,
            productos: c.productos
                .filter((p) => (0, stock_producto_1.productoVisibleEnMenu)({
                activo: true,
                control_stock: p.controlStock,
                stock_disponible: p.stockDisponible,
                ocultar_sin_stock: p.ocultarSinStock,
            }))
                .map((p) => ({
                id_producto: p.idProducto,
                nombre: p.nombre,
                descripcion: p.descripcion,
                precio: Number(p.precio),
                activo: p.activo,
                es_plato_principal: p.esPlatoPrincipal,
                es_empacable: p.esEmpacable,
                envia_cocina: p.enviaCocina,
                usa_subitems_repartibles: p.usaSubitemsRepartibles,
                cantidad_reparto_subitems: Math.max(1, p.cantidadRepartoSubitems ?? 1),
                control_stock: p.controlStock,
                stock_disponible: p.stockDisponible,
                ocultar_sin_stock: p.ocultarSinStock,
                agotado: (0, stock_producto_1.productoAgotado)({
                    control_stock: p.controlStock,
                    stock_disponible: p.stockDisponible,
                }),
                opciones: [],
                subitems: p.subitems.map((s) => ({
                    id_subitem: s.idSubitem,
                    nombre: s.nombre,
                    activo: s.activo,
                    orden: s.orden,
                })),
            })),
        }));
        const productIds = out.flatMap((c) => c.productos.map((p) => p.id_producto));
        if (productIds.length === 0) {
            return { categorias: [] };
        }
        const opciones = await this.prisma.personalizacionOpcion.findMany({
            where: { idProducto: { in: productIds } },
            orderBy: [{ tipo: 'asc' }, { idOpcion: 'asc' }],
        });
        const byProduct = new Map();
        for (const o of opciones) {
            const arr = byProduct.get(o.idProducto) ?? [];
            arr.push(o);
            byProduct.set(o.idProducto, arr);
        }
        for (const cat of out) {
            for (const p of cat.productos) {
                p.opciones = (byProduct.get(p.id_producto) ?? []).map((o) => ({
                    id_opcion: o.idOpcion,
                    tipo: o.tipo,
                    descripcion: o.descripcion,
                }));
            }
        }
        const result = { categorias: out };
        (0, menu_hoy_cache_1.setCachedMenuHoy)(result);
        return result;
    }
};
exports.MenuService = MenuService;
exports.MenuService = MenuService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MenuService);
//# sourceMappingURL=menu.service.js.map