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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuAdminService = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const menu_hoy_cache_1 = require("../common/menu-hoy-cache");
const config_operativa_cache_1 = require("../common/config-operativa-cache");
const prisma_service_1 = require("../prisma/prisma.service");
const pedidos_gateway_1 = require("../pedidos/pedidos.gateway");
const tenant_constants_1 = require("../tenant/tenant.constants");
const menu_activo_service_1 = require("./menu-activo.service");
function mapMenu(m) {
    return {
        id_menu: m.idMenu,
        id_restaurante: m.idRestaurante,
        nombre: m.nombre,
        activo: m.activo,
        prioridad: m.prioridad,
        es_default: m.esDefault,
        hora_inicio: m.horaInicio,
        hora_fin: m.horaFin,
        disponible_lunes: m.disponibleLunes,
        disponible_martes: m.disponibleMartes,
        disponible_miercoles: m.disponibleMiercoles,
        disponible_jueves: m.disponibleJueves,
        disponible_viernes: m.disponibleViernes,
        disponible_sabado: m.disponibleSabado,
        disponible_domingo: m.disponibleDomingo,
        total_productos: m._count?.productos ?? undefined,
    };
}
let MenuAdminService = class MenuAdminService {
    prisma;
    menuActivo;
    gateway;
    constructor(prisma, menuActivo, gateway) {
        this.prisma = prisma;
        this.menuActivo = menuActivo;
        this.gateway = gateway;
    }
    emitMenu(tenantId) {
        (0, menu_hoy_cache_1.invalidateMenuHoyCache)();
        this.gateway.emitConfigActualizada('menu', tenantId);
    }
    async listar(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const rows = await this.prisma.menu.findMany({
            where: { idRestaurante: tenantId },
            include: { _count: { select: { productos: true } } },
            orderBy: [{ prioridad: 'desc' }, { nombre: 'asc' }],
        });
        const activo = await this.menuActivo.infoActivo(tenantId);
        return {
            menus: rows.map(mapMenu),
            menu_activo: activo,
        };
    }
    async listarOpciones(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const rows = await this.prisma.menu.findMany({
            where: { idRestaurante: tenantId, activo: true },
            select: { idMenu: true, nombre: true, prioridad: true },
            orderBy: [{ prioridad: 'desc' }, { nombre: 'asc' }],
        });
        const activo = await this.menuActivo.infoActivo(tenantId);
        return {
            menus: rows.map((m) => ({
                id_menu: m.idMenu,
                nombre: m.nombre,
                prioridad: m.prioridad,
            })),
            menu_activo: activo,
        };
    }
    async crear(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const nombre = dto.nombre.trim();
        if (!nombre)
            throw new common_2.BadRequestException('Nombre requerido');
        const horaInicio = this.menuActivo.parseHora('hora_inicio', dto.hora_inicio, '00:00');
        const horaFin = this.menuActivo.parseHora('hora_fin', dto.hora_fin, '23:59');
        if (dto.es_default) {
            await this.prisma.menu.updateMany({
                where: { idRestaurante: tenantId, esDefault: true },
                data: { esDefault: false },
            });
        }
        try {
            const created = await this.prisma.menu.create({
                data: {
                    idRestaurante: tenantId,
                    nombre,
                    activo: dto.activo !== false,
                    prioridad: dto.prioridad ?? 0,
                    esDefault: Boolean(dto.es_default),
                    horaInicio,
                    horaFin,
                    disponibleLunes: dto.disponible_lunes ?? true,
                    disponibleMartes: dto.disponible_martes ?? true,
                    disponibleMiercoles: dto.disponible_miercoles ?? true,
                    disponibleJueves: dto.disponible_jueves ?? true,
                    disponibleViernes: dto.disponible_viernes ?? true,
                    disponibleSabado: dto.disponible_sabado ?? true,
                    disponibleDomingo: dto.disponible_domingo ?? true,
                },
                include: { _count: { select: { productos: true } } },
            });
            this.emitMenu(tenantId);
            return mapMenu(created);
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                e.code === 'P2002') {
                throw new common_2.BadRequestException('Ya existe un menú con ese nombre');
            }
            throw e;
        }
    }
    async actualizar(idMenu, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const existing = await this.prisma.menu.findFirst({
            where: { idMenu, idRestaurante: tenantId },
        });
        if (!existing)
            throw new common_2.NotFoundException('Menú no encontrado');
        if (dto.es_default === true) {
            await this.prisma.menu.updateMany({
                where: {
                    idRestaurante: tenantId,
                    esDefault: true,
                    NOT: { idMenu },
                },
                data: { esDefault: false },
            });
        }
        if (dto.es_default === false && existing.esDefault) {
            throw new common_2.BadRequestException('Debe haber un menú por defecto; marca otro como default primero');
        }
        const horaInicio = dto.hora_inicio != null
            ? this.menuActivo.parseHora('hora_inicio', dto.hora_inicio, existing.horaInicio)
            : undefined;
        const horaFin = dto.hora_fin != null
            ? this.menuActivo.parseHora('hora_fin', dto.hora_fin, existing.horaFin)
            : undefined;
        try {
            const updated = await this.prisma.menu.update({
                where: { idMenu },
                data: {
                    ...(dto.nombre != null ? { nombre: dto.nombre.trim() } : {}),
                    ...(dto.activo != null ? { activo: dto.activo } : {}),
                    ...(dto.prioridad != null ? { prioridad: dto.prioridad } : {}),
                    ...(dto.es_default != null ? { esDefault: dto.es_default } : {}),
                    ...(horaInicio != null ? { horaInicio } : {}),
                    ...(horaFin != null ? { horaFin } : {}),
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
                },
                include: { _count: { select: { productos: true } } },
            });
            this.emitMenu(tenantId);
            return mapMenu(updated);
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                e.code === 'P2002') {
                throw new common_2.BadRequestException('Ya existe un menú con ese nombre');
            }
            throw e;
        }
    }
    async eliminar(idMenu, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const existing = await this.prisma.menu.findFirst({
            where: { idMenu, idRestaurante: tenantId },
        });
        if (!existing)
            throw new common_2.NotFoundException('Menú no encontrado');
        if (existing.esDefault) {
            throw new common_2.BadRequestException('No se puede eliminar el menú por defecto');
        }
        await this.prisma.menu.delete({ where: { idMenu } });
        this.emitMenu(tenantId);
        return { ok: true };
    }
    async clonar(idOrigen, dto = {}, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const origen = await this.prisma.menu.findFirst({
            where: { idMenu: idOrigen, idRestaurante: tenantId },
            include: { productos: true },
        });
        if (!origen)
            throw new common_2.NotFoundException('Menú no encontrado');
        const nombrePedido = dto.nombre?.trim();
        const nombre = nombrePedido
            ? nombrePedido
            : await this.nombreCopiaUnico(origen.nombre, tenantId);
        if (!nombre)
            throw new common_2.BadRequestException('Nombre requerido');
        try {
            const created = await this.prisma.$transaction(async (tx) => {
                const menu = await tx.menu.create({
                    data: {
                        idRestaurante: tenantId,
                        nombre,
                        activo: origen.activo,
                        prioridad: origen.prioridad,
                        esDefault: false,
                        horaInicio: origen.horaInicio,
                        horaFin: origen.horaFin,
                        disponibleLunes: origen.disponibleLunes,
                        disponibleMartes: origen.disponibleMartes,
                        disponibleMiercoles: origen.disponibleMiercoles,
                        disponibleJueves: origen.disponibleJueves,
                        disponibleViernes: origen.disponibleViernes,
                        disponibleSabado: origen.disponibleSabado,
                        disponibleDomingo: origen.disponibleDomingo,
                    },
                });
                if (origen.productos.length > 0) {
                    await tx.menuProducto.createMany({
                        data: origen.productos.map((p) => ({
                            idMenu: menu.idMenu,
                            idProducto: p.idProducto,
                            precio: p.precio,
                            activo: p.activo,
                        })),
                    });
                }
                return tx.menu.findUniqueOrThrow({
                    where: { idMenu: menu.idMenu },
                    include: { _count: { select: { productos: true } } },
                });
            });
            this.emitMenu(tenantId);
            return mapMenu(created);
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                e.code === 'P2002') {
                throw new common_2.BadRequestException('Ya existe un menú con ese nombre');
            }
            throw e;
        }
    }
    async nombreCopiaUnico(origenNombre, tenantId) {
        const existentes = await this.prisma.menu.findMany({
            where: { idRestaurante: tenantId },
            select: { nombre: true },
        });
        const usados = new Set(existentes.map((m) => m.nombre));
        const base = `${origenNombre} (copia)`;
        if (!usados.has(base))
            return base;
        let n = 2;
        while (usados.has(`${origenNombre} (copia ${n})`))
            n += 1;
        return `${origenNombre} (copia ${n})`;
    }
    async listarProductos(idMenu, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const menu = await this.prisma.menu.findFirst({
            where: { idMenu, idRestaurante: tenantId },
        });
        if (!menu)
            throw new common_2.NotFoundException('Menú no encontrado');
        const rows = await this.prisma.menuProducto.findMany({
            where: { idMenu },
            include: {
                producto: {
                    include: {
                        categoria: { select: { nombre: true, idRestaurante: true } },
                    },
                },
            },
            orderBy: { idMenuProducto: 'asc' },
        });
        return rows
            .filter((r) => r.producto.categoria.idRestaurante === tenantId)
            .map((r) => ({
            id_menu_producto: r.idMenuProducto,
            id_menu: r.idMenu,
            id_producto: r.idProducto,
            precio: Number(r.precio),
            activo: r.activo,
            nombre: r.producto.nombre,
            categoria_nombre: r.producto.categoria.nombre,
            precio_catalogo: Number(r.producto.precio),
            producto_activo: r.producto.activo,
        }));
    }
    async upsertProducto(idMenu, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const menu = await this.prisma.menu.findFirst({
            where: { idMenu, idRestaurante: tenantId },
        });
        if (!menu)
            throw new common_2.NotFoundException('Menú no encontrado');
        const producto = await this.prisma.producto.findFirst({
            where: {
                idProducto: dto.id_producto,
                categoria: { idRestaurante: tenantId, canal: 'restaurante' },
            },
        });
        if (!producto)
            throw new common_2.NotFoundException('Producto no encontrado');
        const row = await this.prisma.menuProducto.upsert({
            where: {
                idMenu_idProducto: { idMenu, idProducto: dto.id_producto },
            },
            create: {
                idMenu,
                idProducto: dto.id_producto,
                precio: dto.precio,
                activo: dto.activo !== false,
            },
            update: {
                precio: dto.precio,
                ...(dto.activo != null ? { activo: dto.activo } : {}),
            },
            include: {
                producto: {
                    include: { categoria: { select: { nombre: true } } },
                },
            },
        });
        this.emitMenu(tenantId);
        return {
            id_menu_producto: row.idMenuProducto,
            id_menu: row.idMenu,
            id_producto: row.idProducto,
            precio: Number(row.precio),
            activo: row.activo,
            nombre: row.producto.nombre,
            categoria_nombre: row.producto.categoria.nombre,
            precio_catalogo: Number(row.producto.precio),
            producto_activo: row.producto.activo,
        };
    }
    async asignarProductos(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const idMenus = [...new Set(dto.id_menus.map((n) => Number(n)))].filter((n) => Number.isFinite(n) && n >= 1);
        if (idMenus.length === 0) {
            throw new common_2.BadRequestException('Indica al menos un menú');
        }
        const idProductosDirectos = [
            ...new Set((dto.id_productos ?? []).map((n) => Number(n))),
        ].filter((n) => Number.isFinite(n) && n >= 1);
        const idCategorias = [
            ...new Set((dto.id_categorias ?? []).map((n) => Number(n))),
        ].filter((n) => Number.isFinite(n) && n >= 1);
        if (idProductosDirectos.length === 0 && idCategorias.length === 0) {
            throw new common_2.BadRequestException('Indica al menos un producto o una categoría');
        }
        const menus = await this.prisma.menu.findMany({
            where: { idRestaurante: tenantId, idMenu: { in: idMenus } },
            select: { idMenu: true, nombre: true },
        });
        if (menus.length !== idMenus.length) {
            throw new common_2.NotFoundException('Uno o más menús no existen');
        }
        if (idCategorias.length > 0) {
            const cats = await this.prisma.categoria.findMany({
                where: {
                    idCategoria: { in: idCategorias },
                    idRestaurante: tenantId,
                    canal: 'restaurante',
                },
                select: { idCategoria: true },
            });
            if (cats.length !== idCategorias.length) {
                throw new common_2.NotFoundException('Una o más categorías no existen');
            }
        }
        const productos = await this.prisma.producto.findMany({
            where: {
                categoria: { idRestaurante: tenantId, canal: 'restaurante' },
                OR: [
                    ...(idProductosDirectos.length > 0
                        ? [{ idProducto: { in: idProductosDirectos } }]
                        : []),
                    ...(idCategorias.length > 0
                        ? [{ idCategoria: { in: idCategorias }, activo: true }]
                        : []),
                ],
            },
            select: { idProducto: true, nombre: true, precio: true, activo: true },
        });
        if (idProductosDirectos.length > 0) {
            const found = new Set(productos.map((p) => p.idProducto));
            const missing = idProductosDirectos.filter((id) => !found.has(id));
            if (missing.length > 0) {
                throw new common_2.NotFoundException('Uno o más productos no existen');
            }
        }
        if (productos.length === 0) {
            throw new common_2.BadRequestException('No hay productos activos en las categorías indicadas');
        }
        const precioFijo = dto.precio != null && Number.isFinite(Number(dto.precio))
            ? Math.max(0, Number(dto.precio))
            : null;
        let creados = 0;
        let yaEstaban = 0;
        await this.prisma.$transaction(async (tx) => {
            for (const menu of menus) {
                for (const prod of productos) {
                    const precio = precioFijo ?? Number(prod.precio);
                    const existente = await tx.menuProducto.findUnique({
                        where: {
                            idMenu_idProducto: {
                                idMenu: menu.idMenu,
                                idProducto: prod.idProducto,
                            },
                        },
                    });
                    if (existente) {
                        if (!existente.activo) {
                            await tx.menuProducto.update({
                                where: { idMenuProducto: existente.idMenuProducto },
                                data: { activo: true },
                            });
                        }
                        yaEstaban += 1;
                        continue;
                    }
                    await tx.menuProducto.create({
                        data: {
                            idMenu: menu.idMenu,
                            idProducto: prod.idProducto,
                            precio,
                            activo: true,
                        },
                    });
                    creados += 1;
                }
            }
        });
        this.emitMenu(tenantId);
        return {
            ok: true,
            creados,
            ya_estaban: yaEstaban,
            menus: menus.map((m) => m.nombre),
            productos: productos.map((p) => p.nombre),
        };
    }
    async quitarProducto(idMenu, idProducto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const menu = await this.prisma.menu.findFirst({
            where: { idMenu, idRestaurante: tenantId },
        });
        if (!menu)
            throw new common_2.NotFoundException('Menú no encontrado');
        await this.prisma.menuProducto.deleteMany({
            where: { idMenu, idProducto },
        });
        this.emitMenu(tenantId);
        return { ok: true };
    }
    async setOverride(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        if (dto.id_menu != null) {
            const menu = await this.prisma.menu.findFirst({
                where: { idMenu: dto.id_menu, idRestaurante: tenantId, activo: true },
            });
            if (!menu)
                throw new common_2.NotFoundException('Menú no encontrado o inactivo');
        }
        let hasta = null;
        if (dto.id_menu != null && dto.hasta) {
            const d = new Date(dto.hasta);
            if (!Number.isFinite(d.getTime())) {
                throw new common_2.BadRequestException('hasta inválido');
            }
            hasta = d;
        }
        await this.prisma.configOperativa.upsert({
            where: { idRestaurante: tenantId },
            create: {
                idRestaurante: tenantId,
                idMenuOverride: dto.id_menu ?? null,
                menuOverrideHasta: hasta,
            },
            update: {
                idMenuOverride: dto.id_menu ?? null,
                menuOverrideHasta: hasta,
            },
        });
        (0, config_operativa_cache_1.invalidateConfigOperativaCache)(tenantId);
        this.emitMenu(tenantId);
        return this.menuActivo.infoActivo(tenantId);
    }
};
exports.MenuAdminService = MenuAdminService;
exports.MenuAdminService = MenuAdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => pedidos_gateway_1.PedidosGateway))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        menu_activo_service_1.MenuActivoService,
        pedidos_gateway_1.PedidosGateway])
], MenuAdminService);
//# sourceMappingURL=menu-admin.service.js.map