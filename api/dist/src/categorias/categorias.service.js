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
exports.CategoriasService = void 0;
const common_1 = require("@nestjs/common");
const categoria_reglas_1 = require("@drewrest/shared-domain/categoria-reglas");
const categoria_menu_icon_1 = require("@drewrest/shared-domain/categoria-menu-icon");
const prisma_service_1 = require("../prisma/prisma.service");
const pedidos_gateway_1 = require("../pedidos/pedidos.gateway");
let CategoriasService = class CategoriasService {
    prisma;
    gateway;
    constructor(prisma, gateway) {
        this.prisma = prisma;
        this.gateway = gateway;
    }
    normalizeIconoMenu(raw, nombreFallback) {
        if (raw == null && !nombreFallback)
            return null;
        return (0, categoria_menu_icon_1.normalizarIconoMenuGuardado)(raw ?? null, nombreFallback);
    }
    mapCategoriaAdmin(c, stats) {
        return {
            id_categoria: c.idCategoria,
            nombre: c.nombre,
            icono_menu: this.normalizeIconoMenu(c.iconoMenu, c.nombre),
            activo: c.activo,
            disponible_lunes: c.disponibleLunes,
            disponible_martes: c.disponibleMartes,
            disponible_miercoles: c.disponibleMiercoles,
            disponible_jueves: c.disponibleJueves,
            disponible_viernes: c.disponibleViernes,
            disponible_sabado: c.disponibleSabado,
            disponible_domingo: c.disponibleDomingo,
            es_bebida: c.esBebida,
            cobra_empaque_para_llevar: c.cobraEmpaqueParaLlevar,
            participa_descuento_sopas: c.participaDescuentoSopas,
            es_linea_empaque: c.esLineaEmpaque,
            visible_en_mostrador: c.visibleEnMostrador,
            tipo_linea_cocina_default: c.tipoLineaCocinaDefault,
            es_plato_principal_default: c.esPlatoPrincipalDefault,
            prioridad_cocina_baja: c.prioridadCocinaBaja,
            total_productos: stats?.total_productos ?? 0,
            total_usos_pedido: stats?.total_usos_pedido ?? 0,
        };
    }
    async contadoresPorCategoria(tenantId) {
        const productos = await this.prisma.producto.findMany({
            where: { categoria: { idRestaurante: tenantId } },
            select: {
                idCategoria: true,
                _count: { select: { detalles: true } },
            },
        });
        const map = new Map();
        for (const p of productos) {
            const cur = map.get(p.idCategoria) ?? {
                total_productos: 0,
                total_usos_pedido: 0,
            };
            cur.total_productos += 1;
            cur.total_usos_pedido += p._count.detalles;
            map.set(p.idCategoria, cur);
        }
        return map;
    }
    async listarTodasAdmin(tenantId) {
        const [rows, stats] = await Promise.all([
            this.prisma.categoria.findMany({
                where: { idRestaurante: tenantId },
                orderBy: { nombre: 'asc' },
            }),
            this.contadoresPorCategoria(tenantId),
        ]);
        return rows.map((c) => this.mapCategoriaAdmin(c, stats.get(c.idCategoria)));
    }
    async crear(dto, tenantId) {
        const nombre = dto.nombre.trim();
        const dup = await this.prisma.categoria.findFirst({
            where: {
                idRestaurante: tenantId,
                nombre: { equals: nombre, mode: 'insensitive' },
            },
        });
        if (dup) {
            throw new common_1.ConflictException('Ya existe una categoría con ese nombre');
        }
        const defaults = (0, categoria_reglas_1.reglasCategoriaPorDefecto)(nombre);
        const created = await this.prisma.categoria.create({
            data: {
                idRestaurante: tenantId,
                nombre,
                disponibleLunes: dto.disponible_lunes ?? true,
                disponibleMartes: dto.disponible_martes ?? true,
                disponibleMiercoles: dto.disponible_miercoles ?? true,
                disponibleJueves: dto.disponible_jueves ?? true,
                disponibleViernes: dto.disponible_viernes ?? true,
                disponibleSabado: dto.disponible_sabado ?? true,
                disponibleDomingo: dto.disponible_domingo ?? true,
                esBebida: dto.es_bebida ?? defaults.es_bebida,
                cobraEmpaqueParaLlevar: dto.cobra_empaque_para_llevar ?? defaults.cobra_empaque_para_llevar,
                participaDescuentoSopas: dto.participa_descuento_sopas ?? defaults.participa_descuento_sopas,
                esLineaEmpaque: dto.es_linea_empaque ?? defaults.es_linea_empaque,
                visibleEnMostrador: dto.visible_en_mostrador ?? defaults.visible_en_mostrador,
                tipoLineaCocinaDefault: (dto.tipo_linea_cocina_default ??
                    defaults.tipo_linea_cocina_default),
                esPlatoPrincipalDefault: dto.es_plato_principal_default ?? defaults.es_plato_principal_default,
                prioridadCocinaBaja: dto.prioridad_cocina_baja ?? defaults.prioridad_cocina_baja,
                iconoMenu: this.normalizeIconoMenu(dto.icono_menu, nombre),
            },
        });
        this.gateway.emitConfigActualizada('categorias', tenantId);
        return this.mapCategoriaAdmin(created);
    }
    async actualizar(idCategoria, dto, tenantId) {
        const existing = await this.prisma.categoria.findFirst({
            where: { idCategoria, idRestaurante: tenantId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Categoría no encontrada');
        }
        if (dto.nombre != null) {
            const nombre = dto.nombre.trim();
            const dup = await this.prisma.categoria.findFirst({
                where: {
                    idRestaurante: tenantId,
                    nombre: { equals: nombre, mode: 'insensitive' },
                    idCategoria: { not: idCategoria },
                },
            });
            if (dup) {
                throw new common_1.ConflictException('Ya existe una categoría con ese nombre');
            }
        }
        const updated = await this.prisma.categoria.update({
            where: { idCategoria },
            data: {
                ...(dto.nombre != null ? { nombre: dto.nombre.trim() } : {}),
                ...(dto.activo != null ? { activo: dto.activo } : {}),
                ...(dto.disponible_lunes != null
                    ? { disponibleLunes: dto.disponible_lunes }
                    : {}),
                ...(dto.disponible_martes != null
                    ? { disponibleMartes: dto.disponible_martes }
                    : {}),
                ...(dto.disponible_miercoles != null
                    ? { disponibleMiercoles: dto.disponible_miercoles }
                    : {}),
                ...(dto.disponible_jueves != null
                    ? { disponibleJueves: dto.disponible_jueves }
                    : {}),
                ...(dto.disponible_viernes != null
                    ? { disponibleViernes: dto.disponible_viernes }
                    : {}),
                ...(dto.disponible_sabado != null
                    ? { disponibleSabado: dto.disponible_sabado }
                    : {}),
                ...(dto.disponible_domingo != null
                    ? { disponibleDomingo: dto.disponible_domingo }
                    : {}),
                ...(dto.es_bebida != null ? { esBebida: dto.es_bebida } : {}),
                ...(dto.cobra_empaque_para_llevar != null
                    ? { cobraEmpaqueParaLlevar: dto.cobra_empaque_para_llevar }
                    : {}),
                ...(dto.participa_descuento_sopas != null
                    ? { participaDescuentoSopas: dto.participa_descuento_sopas }
                    : {}),
                ...(dto.es_linea_empaque != null
                    ? { esLineaEmpaque: dto.es_linea_empaque }
                    : {}),
                ...(dto.visible_en_mostrador != null
                    ? { visibleEnMostrador: dto.visible_en_mostrador }
                    : {}),
                ...(dto.es_plato_principal_default != null
                    ? { esPlatoPrincipalDefault: dto.es_plato_principal_default }
                    : {}),
                ...(dto.prioridad_cocina_baja != null
                    ? { prioridadCocinaBaja: dto.prioridad_cocina_baja }
                    : {}),
                ...(dto.tipo_linea_cocina_default != null
                    ? { tipoLineaCocinaDefault: dto.tipo_linea_cocina_default }
                    : {}),
                ...(dto.icono_menu !== undefined
                    ? {
                        iconoMenu: this.normalizeIconoMenu(dto.icono_menu, existing.nombre),
                    }
                    : {}),
            },
        });
        this.gateway.emitConfigActualizada('categorias', tenantId);
        const stats = await this.contadoresPorCategoria(tenantId);
        return this.mapCategoriaAdmin(updated, stats.get(idCategoria));
    }
    async eliminar(idCategoria, tenantId) {
        const existing = await this.prisma.categoria.findFirst({
            where: { idCategoria, idRestaurante: tenantId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Categoría no encontrada');
        }
        if (existing.esLineaEmpaque) {
            throw new common_1.ConflictException('La categoría de empaque es del sistema y no se puede eliminar');
        }
        const stats = (await this.contadoresPorCategoria(tenantId)).get(idCategoria) ?? {
            total_productos: 0,
            total_usos_pedido: 0,
        };
        if (stats.total_usos_pedido > 0) {
            throw new common_1.ConflictException('Tiene productos con historial de pedidos — no se puede eliminar');
        }
        if (stats.total_productos > 0) {
            const refs = await this.prisma.configOperativa.findFirst({
                where: {
                    idRestaurante: tenantId,
                    OR: [
                        {
                            productoMazorca: { idCategoria },
                        },
                        {
                            productoSodaAlmuerzo: { idCategoria },
                        },
                        {
                            productoCuotaPendiente: { idCategoria },
                        },
                    ],
                },
            });
            if (refs) {
                throw new common_1.ConflictException('Hay productos de esta categoría usados en la configuración del sistema');
            }
        }
        await this.prisma.$transaction([
            this.prisma.producto.deleteMany({ where: { idCategoria } }),
            this.prisma.categoria.delete({ where: { idCategoria } }),
        ]);
        this.gateway.emitConfigActualizada('categorias', tenantId);
        this.gateway.emitConfigActualizada('menu', tenantId);
        return { ok: true, id_categoria: idCategoria };
    }
    mapPlantillaItem(c) {
        return {
            nombre: c.nombre,
            icono_menu: this.normalizeIconoMenu(c.iconoMenu, c.nombre),
            activo: c.activo,
            disponible_lunes: c.disponibleLunes,
            disponible_martes: c.disponibleMartes,
            disponible_miercoles: c.disponibleMiercoles,
            disponible_jueves: c.disponibleJueves,
            disponible_viernes: c.disponibleViernes,
            disponible_sabado: c.disponibleSabado,
            disponible_domingo: c.disponibleDomingo,
            es_bebida: c.esBebida,
            cobra_empaque_para_llevar: c.cobraEmpaqueParaLlevar,
            participa_descuento_sopas: c.participaDescuentoSopas,
            es_linea_empaque: c.esLineaEmpaque,
            visible_en_mostrador: c.visibleEnMostrador,
            tipo_linea_cocina_default: c.tipoLineaCocinaDefault,
            es_plato_principal_default: c.esPlatoPrincipalDefault,
            prioridad_cocina_baja: c.prioridadCocinaBaja,
        };
    }
    async exportarPlantilla(tenantId) {
        const rows = await this.prisma.categoria.findMany({
            where: { idRestaurante: tenantId, esLineaEmpaque: false },
            orderBy: { nombre: 'asc' },
        });
        return {
            version: 1,
            exportado_en: new Date().toISOString(),
            categorias: rows.map((c) => this.mapPlantillaItem(c)),
        };
    }
    async importarPlantilla(tenantId, dto) {
        const modo = dto.modo ?? 'skip_existing';
        let creadas = 0;
        let actualizadas = 0;
        let omitidas = 0;
        for (const item of dto.categorias) {
            const nombre = item.nombre?.trim();
            if (!nombre)
                continue;
            const existing = await this.prisma.categoria.findFirst({
                where: {
                    idRestaurante: tenantId,
                    nombre: { equals: nombre, mode: 'insensitive' },
                },
            });
            if (existing) {
                if (modo === 'merge') {
                    const defaults = (0, categoria_reglas_1.reglasCategoriaPorDefecto)(nombre);
                    await this.prisma.categoria.update({
                        where: { idCategoria: existing.idCategoria },
                        data: {
                            ...(item.activo != null ? { activo: item.activo } : {}),
                            ...(item.disponible_lunes != null
                                ? { disponibleLunes: item.disponible_lunes }
                                : {}),
                            ...(item.disponible_martes != null
                                ? { disponibleMartes: item.disponible_martes }
                                : {}),
                            ...(item.disponible_miercoles != null
                                ? { disponibleMiercoles: item.disponible_miercoles }
                                : {}),
                            ...(item.disponible_jueves != null
                                ? { disponibleJueves: item.disponible_jueves }
                                : {}),
                            ...(item.disponible_viernes != null
                                ? { disponibleViernes: item.disponible_viernes }
                                : {}),
                            ...(item.disponible_sabado != null
                                ? { disponibleSabado: item.disponible_sabado }
                                : {}),
                            ...(item.disponible_domingo != null
                                ? { disponibleDomingo: item.disponible_domingo }
                                : {}),
                            ...(item.es_bebida != null ? { esBebida: item.es_bebida } : {}),
                            ...(item.cobra_empaque_para_llevar != null
                                ? { cobraEmpaqueParaLlevar: item.cobra_empaque_para_llevar }
                                : {}),
                            ...(item.participa_descuento_sopas != null
                                ? { participaDescuentoSopas: item.participa_descuento_sopas }
                                : {}),
                            ...(item.visible_en_mostrador != null
                                ? { visibleEnMostrador: item.visible_en_mostrador }
                                : {}),
                            ...(item.es_plato_principal_default != null
                                ? { esPlatoPrincipalDefault: item.es_plato_principal_default }
                                : {}),
                            ...(item.prioridad_cocina_baja != null
                                ? { prioridadCocinaBaja: item.prioridad_cocina_baja }
                                : {}),
                            ...(item.tipo_linea_cocina_default != null
                                ? {
                                    tipoLineaCocinaDefault: item.tipo_linea_cocina_default,
                                }
                                : {}),
                            ...(item.icono_menu !== undefined
                                ? {
                                    iconoMenu: this.normalizeIconoMenu(item.icono_menu, nombre),
                                }
                                : {}),
                        },
                    });
                    actualizadas += 1;
                }
                else {
                    omitidas += 1;
                }
                continue;
            }
            const defaults = (0, categoria_reglas_1.reglasCategoriaPorDefecto)(nombre);
            await this.prisma.categoria.create({
                data: {
                    idRestaurante: tenantId,
                    nombre,
                    disponibleLunes: item.disponible_lunes ?? true,
                    disponibleMartes: item.disponible_martes ?? true,
                    disponibleMiercoles: item.disponible_miercoles ?? true,
                    disponibleJueves: item.disponible_jueves ?? true,
                    disponibleViernes: item.disponible_viernes ?? true,
                    disponibleSabado: item.disponible_sabado ?? true,
                    disponibleDomingo: item.disponible_domingo ?? true,
                    esBebida: item.es_bebida ?? defaults.es_bebida,
                    cobraEmpaqueParaLlevar: item.cobra_empaque_para_llevar ?? defaults.cobra_empaque_para_llevar,
                    participaDescuentoSopas: item.participa_descuento_sopas ?? defaults.participa_descuento_sopas,
                    esLineaEmpaque: false,
                    visibleEnMostrador: item.visible_en_mostrador ?? defaults.visible_en_mostrador,
                    tipoLineaCocinaDefault: (item.tipo_linea_cocina_default ??
                        defaults.tipo_linea_cocina_default),
                    esPlatoPrincipalDefault: item.es_plato_principal_default ?? defaults.es_plato_principal_default,
                    prioridadCocinaBaja: item.prioridad_cocina_baja ?? defaults.prioridad_cocina_baja,
                    iconoMenu: this.normalizeIconoMenu(item.icono_menu, nombre),
                    activo: item.activo ?? true,
                },
            });
            creadas += 1;
        }
        if (creadas > 0 || actualizadas > 0) {
            this.gateway.emitConfigActualizada('categorias', tenantId);
            this.gateway.emitConfigActualizada('menu', tenantId);
        }
        return { creadas, actualizadas, omitidas, modo };
    }
};
exports.CategoriasService = CategoriasService;
exports.CategoriasService = CategoriasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        pedidos_gateway_1.PedidosGateway])
], CategoriasService);
//# sourceMappingURL=categorias.service.js.map