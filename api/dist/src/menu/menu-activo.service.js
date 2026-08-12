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
exports.MenuActivoService = void 0;
const common_1 = require("@nestjs/common");
const menu_franja_1 = require("@drewrest/shared-domain/menu-franja");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const timezone_1 = require("../common/timezone");
const tenant_constants_1 = require("../tenant/tenant.constants");
function toFlags(m) {
    return {
        idMenu: m.idMenu,
        nombre: m.nombre,
        activo: m.activo,
        prioridad: m.prioridad,
        esDefault: m.esDefault,
        horaInicio: m.horaInicio,
        horaFin: m.horaFin,
        disponibleLunes: m.disponibleLunes,
        disponibleMartes: m.disponibleMartes,
        disponibleMiercoles: m.disponibleMiercoles,
        disponibleJueves: m.disponibleJueves,
        disponibleViernes: m.disponibleViernes,
        disponibleSabado: m.disponibleSabado,
        disponibleDomingo: m.disponibleDomingo,
    };
}
let MenuActivoService = class MenuActivoService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listarMenus(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        return this.prisma.menu.findMany({
            where: { idRestaurante: tenantId },
            orderBy: [{ prioridad: 'desc' }, { idMenu: 'asc' }],
        });
    }
    async resolverActivo(tenantId = tenant_constants_1.DEFAULT_TENANT_ID, ahora = new Date()) {
        const [menus, config] = await Promise.all([
            this.listarMenus(tenantId),
            this.prisma.configOperativa.findUnique({
                where: { idRestaurante: tenantId },
                select: { idMenuOverride: true, menuOverrideHasta: true },
            }),
        ]);
        if (menus.length === 0)
            return null;
        const resolved = (0, menu_franja_1.resolverMenuActivo)(menus.map(toFlags), {
            weekday: (0, timezone_1.weekdayBogota)(ahora),
            minutosAhora: (0, timezone_1.minutosAhoraBogota)(ahora),
            override: config
                ? {
                    idMenuOverride: config.idMenuOverride,
                    menuOverrideHasta: config.menuOverrideHasta,
                }
                : null,
            ahora,
        });
        if (!resolved)
            return null;
        const menu = menus.find((m) => m.idMenu === resolved.menu.idMenu);
        if (!menu)
            return null;
        return { menu, modo: resolved.modo };
    }
    async infoActivo(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const r = await this.resolverActivo(tenantId);
        if (!r)
            return null;
        return {
            id_menu: r.menu.idMenu,
            nombre: r.menu.nombre,
            modo: r.modo,
        };
    }
    async precioVentaProducto(idProducto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID, precioCatalogo) {
        const menusCount = await this.prisma.menu.count({
            where: { idRestaurante: tenantId },
        });
        if (menusCount === 0) {
            if (precioCatalogo != null) {
                return new client_1.Prisma.Decimal(precioCatalogo);
            }
            const p = await this.prisma.producto.findUnique({
                where: { idProducto },
                select: { precio: true },
            });
            if (!p)
                throw new common_1.NotFoundException('Producto no encontrado');
            return p.precio;
        }
        const activo = await this.resolverActivo(tenantId);
        if (!activo) {
            throw new common_1.BadRequestException('No hay un menú activo configurado');
        }
        const mp = await this.prisma.menuProducto.findFirst({
            where: {
                idMenu: activo.menu.idMenu,
                idProducto,
                activo: true,
            },
        });
        if (!mp) {
            throw new common_1.BadRequestException(`Este producto no está en el menú activo (${activo.menu.nombre})`);
        }
        return mp.precio;
    }
    async asegurarProductoEnMenu(idMenu, idProducto, precio) {
        await this.prisma.menuProducto.upsert({
            where: {
                idMenu_idProducto: { idMenu, idProducto },
            },
            create: {
                idMenu,
                idProducto,
                precio,
                activo: true,
            },
            update: {
                precio,
                activo: true,
            },
        });
    }
    async asegurarProductoEnMenuDefault(idProducto, precio, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const def = await this.prisma.menu.findFirst({
            where: { idRestaurante: tenantId, esDefault: true },
        });
        if (!def)
            return;
        await this.asegurarProductoEnMenu(def.idMenu, idProducto, precio);
    }
    async sincronizarPrecioMenuDefault(idProducto, precio, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const def = await this.prisma.menu.findFirst({
            where: { idRestaurante: tenantId, esDefault: true },
            select: { idMenu: true },
        });
        if (!def)
            return;
        await this.prisma.menuProducto.updateMany({
            where: { idMenu: def.idMenu, idProducto },
            data: { precio },
        });
    }
    parseHora(label, value, fallback) {
        const raw = value?.trim() || fallback;
        const n = (0, menu_franja_1.normalizarHhMm)(raw);
        if (!n) {
            throw new common_1.BadRequestException(`${label} inválida (use HH:mm)`);
        }
        return n;
    }
};
exports.MenuActivoService = MenuActivoService;
exports.MenuActivoService = MenuActivoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MenuActivoService);
//# sourceMappingURL=menu-activo.service.js.map