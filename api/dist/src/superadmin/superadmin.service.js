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
exports.SuperadminService = void 0;
const common_1 = require("@nestjs/common");
const roles_1 = require("@drewrest/shared-domain/roles");
const mesa_label_1 = require("@drewrest/shared-domain/mesa-label");
const mesa_admin_validacion_1 = require("@drewrest/shared-domain/mesa-admin-validacion");
const prisma_service_1 = require("../prisma/prisma.service");
const pedidos_gateway_1 = require("../pedidos/pedidos.gateway");
const auth_user_cache_1 = require("../auth/auth-user-cache");
const PEDIDOS_ABIERTOS = ['abierto', 'en_cocina'];
let SuperadminService = class SuperadminService {
    prisma;
    gateway;
    constructor(prisma, gateway) {
        this.prisma = prisma;
        this.gateway = gateway;
    }
    async estado(tenantId) {
        const restaurante = await this.prisma.restaurante.findUnique({
            where: { idRestaurante: tenantId },
        });
        if (!restaurante) {
            throw new common_1.NotFoundException('Restaurante no encontrado');
        }
        const [adminCount, productos, categorias, mesas, lugares] = await Promise.all([
            this.prisma.usuario.count({
                where: {
                    idRestaurante: tenantId,
                    rol: { nombre: roles_1.ROL_ADMIN },
                },
            }),
            this.prisma.producto.count({
                where: { categoria: { idRestaurante: tenantId } },
            }),
            this.prisma.categoria.count({
                where: { idRestaurante: tenantId },
            }),
            this.prisma.mesa.count({
                where: { idRestaurante: tenantId },
            }),
            this.prisma.lugarMesa.count({
                where: { idRestaurante: tenantId, activo: true },
            }),
        ]);
        return {
            restaurante: {
                id: restaurante.idRestaurante,
                slug: restaurante.slug,
                nombre: restaurante.nombre,
                activo: restaurante.activo,
                acceso_hasta: restaurante.accesoHasta?.toISOString() ?? null,
                plan: restaurante.plan,
            },
            admin_registrado: adminCount > 0,
            totales: {
                productos,
                categorias,
                mesas,
                lugares_activos: lugares,
            },
        };
    }
    async patchAcceso(tenantId, dto) {
        const data = {};
        if (dto.activo !== undefined)
            data.activo = dto.activo;
        if (dto.acceso_hasta !== undefined) {
            data.accesoHasta =
                dto.acceso_hasta == null || dto.acceso_hasta === ''
                    ? null
                    : new Date(dto.acceso_hasta);
        }
        if (Object.keys(data).length === 0) {
            throw new common_1.BadRequestException('Nada que actualizar');
        }
        const updated = await this.prisma.restaurante.update({
            where: { idRestaurante: tenantId },
            data,
        });
        if (dto.activo === false) {
            const usuarios = await this.prisma.usuario.findMany({
                where: {
                    idRestaurante: tenantId,
                    rol: { nombre: { not: roles_1.ROL_SUPERADMIN } },
                    activo: true,
                },
                select: { idUsuario: true },
            });
            for (const u of usuarios) {
                this.gateway.emitAuthSesionInvalidada(u.idUsuario, 'desactivado', 'El acceso al restaurante fue desactivado.', tenantId);
            }
        }
        return {
            ok: true,
            activo: updated.activo,
            acceso_hasta: updated.accesoHasta?.toISOString() ?? null,
        };
    }
    async eliminarAdmin(tenantId) {
        const admins = await this.prisma.usuario.findMany({
            where: {
                idRestaurante: tenantId,
                rol: { nombre: roles_1.ROL_ADMIN },
            },
            include: { rol: true },
        });
        if (admins.length === 0) {
            return { ok: true, eliminados: 0 };
        }
        let eliminados = 0;
        for (const admin of admins) {
            const pedidos = await this.prisma.pedido.count({
                where: { idUsuario: admin.idUsuario },
            });
            if (pedidos > 0) {
                throw new common_1.ConflictException('El administrador tiene pedidos en el historial. No se puede eliminar; desactiva el acceso del restaurante o vacía datos de prueba primero.');
            }
            await this.prisma.usuario.delete({
                where: { idUsuario: admin.idUsuario },
            });
            (0, auth_user_cache_1.invalidateAuthUser)(admin.idUsuario);
            this.gateway.emitAuthSesionInvalidada(admin.idUsuario, 'credenciales', 'La cuenta de administrador fue eliminada.', tenantId);
            eliminados += 1;
        }
        return { ok: true, eliminados };
    }
    async purgarMenu(tenantId, confirmar) {
        if (confirmar.trim().toUpperCase() !== 'PURGAR_MENU') {
            throw new common_1.BadRequestException('Escribe confirmar: "PURGAR_MENU"');
        }
        const productos = await this.prisma.producto.findMany({
            where: { categoria: { idRestaurante: tenantId } },
            include: { _count: { select: { detalles: true } } },
        });
        let productosEliminados = 0;
        let productosOcultos = 0;
        for (const p of productos) {
            if (p._count.detalles > 0) {
                if (p.activo) {
                    await this.prisma.producto.update({
                        where: { idProducto: p.idProducto },
                        data: { activo: false },
                    });
                    productosOcultos += 1;
                }
                continue;
            }
            await this.prisma.personalizacionOpcion.deleteMany({
                where: { idProducto: p.idProducto },
            });
            await this.prisma.productoSubitem.deleteMany({
                where: { idProducto: p.idProducto },
            });
            await this.prisma.configOperativa.updateMany({
                where: { idRestaurante: tenantId, idProductoMazorca: p.idProducto },
                data: { idProductoMazorca: null },
            });
            await this.prisma.configOperativa.updateMany({
                where: { idRestaurante: tenantId, idProductoSodaAlmuerzo: p.idProducto },
                data: { idProductoSodaAlmuerzo: null },
            });
            await this.prisma.configOperativa.updateMany({
                where: {
                    idRestaurante: tenantId,
                    idProductoCuotaPendiente: p.idProducto,
                },
                data: { idProductoCuotaPendiente: null },
            });
            await this.prisma.producto.delete({ where: { idProducto: p.idProducto } });
            productosEliminados += 1;
        }
        const categorias = await this.prisma.categoria.findMany({
            where: { idRestaurante: tenantId },
            include: {
                productos: { include: { _count: { select: { detalles: true } } } },
            },
        });
        let categoriasEliminadas = 0;
        let categoriasOcultas = 0;
        for (const c of categorias) {
            if (c.esLineaEmpaque)
                continue;
            const tieneHistorial = c.productos.some((p) => p._count.detalles > 0);
            if (c.productos.length === 0 && !tieneHistorial) {
                await this.prisma.categoria.delete({ where: { idCategoria: c.idCategoria } });
                categoriasEliminadas += 1;
                continue;
            }
            if (c.activo) {
                await this.prisma.categoria.update({
                    where: { idCategoria: c.idCategoria },
                    data: { activo: false },
                });
                categoriasOcultas += 1;
            }
        }
        this.gateway.emitConfigActualizada('menu', tenantId);
        this.gateway.emitConfigActualizada('categorias', tenantId);
        return {
            ok: true,
            productos_eliminados: productosEliminados,
            productos_ocultos: productosOcultos,
            categorias_eliminadas: categoriasEliminadas,
            categorias_ocultas: categoriasOcultas,
        };
    }
    async purgarMesas(tenantId, confirmar) {
        if (confirmar.trim().toUpperCase() !== 'PURGAR_MESAS') {
            throw new common_1.BadRequestException('Escribe confirmar: "PURGAR_MESAS"');
        }
        const cfgRow = await this.prisma.configOperativa.findUnique({
            where: { idRestaurante: tenantId },
        });
        const mv = (0, mesa_label_1.resolverMesasVirtuales)(cfgRow ?? undefined);
        const virtuales = new Set((0, mesa_label_1.numerosMesasVirtuales)(mv));
        const mesas = await this.prisma.mesa.findMany({
            where: { idRestaurante: tenantId },
        });
        let eliminadas = 0;
        let omitidas = 0;
        for (const m of mesas) {
            if (virtuales.has(m.numero)) {
                omitidas += 1;
                continue;
            }
            const activos = await this.prisma.pedido.count({
                where: {
                    idMesa: m.idMesa,
                    estado: { in: [...PEDIDOS_ABIERTOS] },
                },
            });
            const total = await this.prisma.pedido.count({
                where: { idMesa: m.idMesa },
            });
            const validacion = (0, mesa_admin_validacion_1.validarEliminarMesaAdmin)({
                numeroMesa: m.numero,
                pedidosActivos: activos,
                totalPedidos: total,
                mesasVirtuales: mv,
            });
            if (!validacion.ok) {
                omitidas += 1;
                continue;
            }
            await this.prisma.mesa.delete({ where: { idMesa: m.idMesa } });
            eliminadas += 1;
        }
        this.gateway.emitConfigActualizada('mesas', tenantId);
        return { ok: true, mesas_eliminadas: eliminadas, mesas_omitidas: omitidas };
    }
    async purgarLugares(tenantId, confirmar) {
        if (confirmar.trim().toUpperCase() !== 'PURGAR_LUGARES') {
            throw new common_1.BadRequestException('Escribe confirmar: "PURGAR_LUGARES"');
        }
        const result = await this.prisma.lugarMesa.updateMany({
            where: { idRestaurante: tenantId, activo: true },
            data: { activo: false },
        });
        this.gateway.emitConfigActualizada('mesas', tenantId);
        return { ok: true, lugares_desactivados: result.count };
    }
};
exports.SuperadminService = SuperadminService;
exports.SuperadminService = SuperadminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        pedidos_gateway_1.PedidosGateway])
], SuperadminService);
//# sourceMappingURL=superadmin.service.js.map