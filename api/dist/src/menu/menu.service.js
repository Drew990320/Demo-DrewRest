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
const tenant_constants_1 = require("../tenant/tenant.constants");
const menu_activo_service_1 = require("./menu-activo.service");
const producto_imagen_upload_util_1 = require("./producto-imagen-upload.util");
function categoriaDisponibleHoy(cat, weekday) {
    return (0, categoria_dia_1.categoriaDisponibleEnDia)(cat, weekday);
}
let MenuService = class MenuService {
    prisma;
    menuActivo;
    constructor(prisma, menuActivo) {
        this.prisma = prisma;
        this.menuActivo = menuActivo;
    }
    invalidateCache() {
        (0, menu_hoy_cache_1.invalidateMenuHoyCache)();
    }
    async menuPorImagenesActivo(tenantId) {
        const cfg = await this.prisma.configRestaurante.findUnique({
            where: { idRestaurante: tenantId },
            select: { moduloMenuImagenesActivo: true },
        });
        return Boolean(cfg?.moduloMenuImagenesActivo);
    }
    async menuHoy(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const activo = await this.menuActivo.resolverActivo(tenantId);
        const menuPorImagenes = await this.menuPorImagenesActivo(tenantId);
        const cacheKey = activo
            ? `${tenantId}:${activo.menu.idMenu}:${activo.modo}:img${menuPorImagenes ? 1 : 0}`
            : `${tenantId}:none:img${menuPorImagenes ? 1 : 0}`;
        const cached = (0, menu_hoy_cache_1.getCachedMenuHoy)(cacheKey);
        if (cached) {
            return cached;
        }
        const weekday = (0, timezone_1.weekdayBogota)();
        const menuInfo = activo
            ? {
                id_menu: activo.menu.idMenu,
                nombre: activo.menu.nombre,
                modo: activo.modo,
            }
            : null;
        if (!activo) {
            const empty = {
                menu: null,
                menu_por_imagenes: menuPorImagenes,
                categorias: [],
            };
            (0, menu_hoy_cache_1.setCachedMenuHoy)(empty, cacheKey);
            return empty;
        }
        const membresias = await this.prisma.menuProducto.findMany({
            where: { idMenu: activo.menu.idMenu, activo: true },
            select: { idProducto: true, precio: true },
        });
        const precioPorProducto = new Map(membresias.map((m) => [m.idProducto, Number(m.precio)]));
        const productIds = [...precioPorProducto.keys()];
        if (productIds.length === 0) {
            const empty = {
                menu: menuInfo,
                menu_por_imagenes: menuPorImagenes,
                categorias: [],
            };
            (0, menu_hoy_cache_1.setCachedMenuHoy)(empty, cacheKey);
            return empty;
        }
        const categorias = await this.prisma.categoria.findMany({
            where: { idRestaurante: tenantId, canal: 'restaurante' },
            include: {
                productos: {
                    where: {
                        activo: true,
                        esAcompanamientoMazorca: false,
                        idProducto: { in: productIds },
                    },
                    include: {
                        subitems: {
                            where: { activo: true },
                            orderBy: [{ orden: 'asc' }, { idSubitem: 'asc' }],
                        },
                        comboElegiblesComoCombo: {
                            include: {
                                componente: {
                                    include: {
                                        categoria: {
                                            select: { nombre: true, esBebida: true },
                                        },
                                    },
                                },
                            },
                            orderBy: [{ orden: 'asc' }, { idComboElegible: 'asc' }],
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
            color_icono: c.colorIcono?.trim() || null,
            es_bebida: c.esBebida,
            visible_en_mostrador: c.visibleEnMostrador,
            productos: c.productos
                .filter((p) => precioPorProducto.has(p.idProducto))
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
                precio: precioPorProducto.get(p.idProducto) ?? Number(p.precio),
                activo: p.activo,
                es_plato_principal: p.esPlatoPrincipal,
                es_empacable: p.esEmpacable,
                envia_cocina: p.enviaCocina,
                usa_subitems_repartibles: p.usaSubitemsRepartibles,
                cantidad_reparto_subitems: Math.max(1, p.cantidadRepartoSubitems ?? 1),
                es_combo: p.esCombo,
                combo_min: Math.max(1, p.comboMin ?? 1),
                combo_max: Math.max(1, p.comboMax ?? 1),
                imagen_url: (0, producto_imagen_upload_util_1.productoImagenPublicUrl)(p.idProducto, p.imagenArchivo),
                combo_elegibles: p.esCombo
                    ? p.comboElegiblesComoCombo
                        .map((e) => ({
                        id_producto: e.idProductoComponente,
                        nombre: e.componente.nombre,
                        precio: Number(e.componente.precio),
                        categoria_nombre: e.componente.categoria.nombre,
                        es_bebida: e.componente.categoria.esBebida,
                        envia_cocina: e.componente.enviaCocina,
                        control_stock: e.componente.controlStock,
                        stock_disponible: e.componente.stockDisponible,
                        agotado: !e.componente.activo ||
                            (0, stock_producto_1.productoAgotado)({
                                control_stock: e.componente.controlStock,
                                stock_disponible: e.componente.stockDisponible,
                            }),
                    }))
                    : [],
                control_stock: p.controlStock,
                stock_disponible: p.stockDisponible,
                ocultar_sin_stock: p.ocultarSinStock,
                agotado: (0, stock_producto_1.productoAgotado)({
                    control_stock: p.controlStock,
                    stock_disponible: p.stockDisponible,
                }) ||
                    (p.esCombo &&
                        (p.comboElegiblesComoCombo.length === 0 ||
                            p.comboElegiblesComoCombo.some((e) => !e.componente.activo ||
                                (0, stock_producto_1.productoAgotado)({
                                    control_stock: e.componente.controlStock,
                                    stock_disponible: e.componente.stockDisponible,
                                })))),
                opciones: [],
                subitems: p.subitems.map((s) => ({
                    id_subitem: s.idSubitem,
                    nombre: s.nombre,
                    activo: s.activo,
                    orden: s.orden,
                })),
            })),
        }))
            .filter((c) => c.productos.length > 0);
        const ids = out.flatMap((c) => c.productos.map((p) => p.id_producto));
        if (ids.length === 0) {
            const empty = {
                menu: menuInfo,
                menu_por_imagenes: menuPorImagenes,
                categorias: [],
            };
            (0, menu_hoy_cache_1.setCachedMenuHoy)(empty, cacheKey);
            return empty;
        }
        const opciones = await this.prisma.personalizacionOpcion.findMany({
            where: { idProducto: { in: ids } },
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
        const result = {
            menu: menuInfo,
            menu_por_imagenes: menuPorImagenes,
            categorias: out,
        };
        (0, menu_hoy_cache_1.setCachedMenuHoy)(result, cacheKey);
        return result;
    }
    async guardarImagenProducto(idProducto, buffer, mime, originalName, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        if (!(await this.menuPorImagenesActivo(tenantId))) {
            throw new common_1.BadRequestException('El menú por imágenes no está activo para este restaurante');
        }
        const producto = await this.prisma.producto.findFirst({
            where: {
                idProducto,
                categoria: { idRestaurante: tenantId, canal: 'restaurante' },
            },
            select: { idProducto: true, imagenArchivo: true },
        });
        if (!producto) {
            throw new common_1.NotFoundException('Producto no encontrado');
        }
        const { archivo } = (0, producto_imagen_upload_util_1.guardarArchivoImagenProducto)(idProducto, buffer, mime, originalName);
        const updated = await this.prisma.producto.update({
            where: { idProducto },
            data: { imagenArchivo: archivo },
            select: { idProducto: true, imagenArchivo: true },
        });
        (0, menu_hoy_cache_1.invalidateMenuHoyCache)();
        return {
            id_producto: updated.idProducto,
            imagen_archivo: updated.imagenArchivo,
            imagen_url: (0, producto_imagen_upload_util_1.productoImagenPublicUrl)(updated.idProducto, updated.imagenArchivo),
        };
    }
    async eliminarImagenProducto(idProducto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        if (!(await this.menuPorImagenesActivo(tenantId))) {
            throw new common_1.BadRequestException('El menú por imágenes no está activo para este restaurante');
        }
        const producto = await this.prisma.producto.findFirst({
            where: {
                idProducto,
                categoria: { idRestaurante: tenantId, canal: 'restaurante' },
            },
            select: { idProducto: true, imagenArchivo: true },
        });
        if (!producto) {
            throw new common_1.NotFoundException('Producto no encontrado');
        }
        (0, producto_imagen_upload_util_1.eliminarArchivoImagenProducto)(producto.imagenArchivo);
        await this.prisma.producto.update({
            where: { idProducto },
            data: { imagenArchivo: null },
        });
        (0, menu_hoy_cache_1.invalidateMenuHoyCache)();
        return {
            id_producto: idProducto,
            imagen_archivo: null,
            imagen_url: null,
        };
    }
};
exports.MenuService = MenuService;
exports.MenuService = MenuService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        menu_activo_service_1.MenuActivoService])
], MenuService);
//# sourceMappingURL=menu.service.js.map