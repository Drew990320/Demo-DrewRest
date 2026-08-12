"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SuperadminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperadminService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const roles_1 = require("@drewrest/shared-domain/roles");
const email_mesero_1 = require("@drewrest/shared-domain/email-mesero");
const mesa_label_1 = require("@drewrest/shared-domain/mesa-label");
const mesa_admin_validacion_1 = require("@drewrest/shared-domain/mesa-admin-validacion");
const prisma_service_1 = require("../prisma/prisma.service");
const pedidos_gateway_1 = require("../pedidos/pedidos.gateway");
const auth_user_cache_1 = require("../auth/auth-user-cache");
const deduccion_contexto_cache_1 = require("../inventario/deduccion-contexto-cache");
const config_inventario_cache_1 = require("../inventario/config-inventario-cache");
const restaurant_branding_1 = require("../common/restaurant-branding");
const distribucion_enlaces_1 = require("../sistema/distribucion-enlaces");
const instalacion_on_prem_1 = require("../sistema/instalacion-on-prem");
const config_restaurante_cache_1 = require("../restaurante/config-restaurante-cache");
const menu_hoy_cache_1 = require("../common/menu-hoy-cache");
const PEDIDOS_ABIERTOS = ['abierto', 'en_cocina'];
function assertHttpUrlOrEmpty(label, raw) {
    if (raw == null)
        return;
    const v = raw.trim();
    if (!v)
        return;
    if (!/^https?:\/\/.+/i.test(v)) {
        throw new common_1.BadRequestException(`${label} debe ser una URL http(s) válida o quedar vacío`);
    }
}
let SuperadminService = class SuperadminService {
    static { SuperadminService_1 = this; }
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
        const [adminCount, chefCount, meseroCount, productos, categorias, mesas, lugares, inventario, recursos, recetas, cfg,] = await Promise.all([
            this.prisma.usuario.count({
                where: {
                    idRestaurante: tenantId,
                    rol: { nombre: roles_1.ROL_ADMIN },
                    activo: true,
                },
            }),
            this.prisma.usuario.count({
                where: {
                    idRestaurante: tenantId,
                    rol: { nombre: roles_1.ROL_CHEF },
                    activo: true,
                },
            }),
            this.prisma.usuario.count({
                where: {
                    idRestaurante: tenantId,
                    rol: { nombre: roles_1.ROL_MESERO },
                    activo: true,
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
            this.prisma.inventario.count({
                where: { idRestaurante: tenantId },
            }),
            this.prisma.recurso.count({
                where: { idRestaurante: tenantId },
            }),
            this.prisma.recetaProducto.count({
                where: { idRestaurante: tenantId },
            }),
            this.prisma.configRestaurante.findUnique({
                where: { idRestaurante: tenantId },
                select: {
                    moduloRetailActivo: true,
                    moduloRedondeoCobroActivo: true,
                    moduloLoginPinActivo: true,
                    moduloAutoservicioActivo: true,
                    moduloMenuImagenesActivo: true,
                    moduloProduccionPorcionesActivo: true,
                },
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
            modulos: {
                modulo_retail_activo: cfg?.moduloRetailActivo ?? false,
                modulo_redondeo_cobro_activo: cfg?.moduloRedondeoCobroActivo ?? false,
                modulo_login_pin_activo: cfg?.moduloLoginPinActivo ?? false,
                modulo_autoservicio_activo: cfg?.moduloAutoservicioActivo ?? false,
                modulo_menu_imagenes_activo: cfg?.moduloMenuImagenesActivo ?? false,
                modulo_produccion_porciones_activo: cfg?.moduloProduccionPorcionesActivo ?? false,
            },
            admin_registrado: adminCount > 0,
            totales: {
                productos,
                categorias,
                mesas,
                lugares_activos: lugares,
                inventario,
                recursos,
                recetas,
                admins: adminCount,
                chefs: chefCount,
                meseros: meseroCount,
            },
        };
    }
    obtenerDistribucionEnlaces() {
        const inst = (0, instalacion_on_prem_1.leerInstalacionOnPrem)();
        const guardados = (0, distribucion_enlaces_1.leerDistribucionEnlaces)();
        return {
            url_actualizacion_general: inst.url_actualizacion_general,
            url_personalizacion: inst.url_personalizacion,
            url_actualizacion_general_override: guardados.url_actualizacion_general,
            url_personalizacion_override: guardados.url_personalizacion,
            url_version_general: inst.url_version_general,
            url_paquete_general: inst.url_paquete_general,
            url_version_canal: inst.url_version_canal,
            url_paquete_canal: inst.url_paquete_canal,
            url_personalizacion_visual: inst.url_personalizacion_visual,
            canal: inst.canal,
            canal_label: inst.canal_label,
            client_slug: inst.client_slug,
            version: inst.version,
            enlaces_personalizados: inst.enlaces_personalizados,
        };
    }
    guardarDistribucionEnlaces(dto) {
        assertHttpUrlOrEmpty('Actualización general', dto.url_actualizacion_general);
        assertHttpUrlOrEmpty('Personalización', dto.url_personalizacion);
        (0, distribucion_enlaces_1.guardarDistribucionEnlaces)({
            url_actualizacion_general: dto.url_actualizacion_general,
            url_personalizacion: dto.url_personalizacion,
        });
        return this.obtenerDistribucionEnlaces();
    }
    static ROLES_EQUIPO = [roles_1.ROL_ADMIN, roles_1.ROL_CHEF, roles_1.ROL_MESERO];
    async listarUsuarios(tenantId) {
        const rows = await this.prisma.usuario.findMany({
            where: {
                idRestaurante: tenantId,
                activo: true,
                rol: { nombre: { in: [...SuperadminService_1.ROLES_EQUIPO] } },
            },
            include: { rol: true },
            orderBy: [{ rol: { nombre: 'asc' } }, { nombre: 'asc' }],
        });
        return rows.map((u) => ({
            id: u.idUsuario,
            nombre: u.nombre,
            apellido: u.apellido,
            email: u.email,
            rol: u.rol.nombre,
            activo: u.activo,
        }));
    }
    async eliminarUsuario(tenantId, idUsuario) {
        const u = await this.prisma.usuario.findFirst({
            where: { idUsuario, idRestaurante: tenantId },
            include: { rol: true },
        });
        if (!u || !u.activo) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        if (u.rol.nombre === roles_1.ROL_SUPERADMIN) {
            throw new common_1.BadRequestException('No se puede eliminar la cuenta superadmin');
        }
        if (!SuperadminService_1.ROLES_EQUIPO.includes(u.rol.nombre)) {
            throw new common_1.BadRequestException('Rol no gestionable desde superadmin');
        }
        if (u.rol.nombre === roles_1.ROL_ADMIN) {
            const adminCount = await this.prisma.usuario.count({
                where: {
                    idRestaurante: tenantId,
                    rol: { nombre: roles_1.ROL_ADMIN },
                    activo: true,
                },
            });
            if (adminCount <= 1) {
                throw new common_1.BadRequestException('Debe quedar al menos un administrador activo');
            }
        }
        const modo = await this.quitarCuentaEquipo(u.idUsuario, tenantId);
        return {
            ok: true,
            id: idUsuario,
            modo,
            eliminados: modo === 'deleted' ? 1 : 0,
            desactivados: modo === 'deactivated' ? 1 : 0,
        };
    }
    async crearUsuario(tenantId, dto) {
        const rolNombre = dto.rol;
        const rol = await this.prisma.rol.findFirst({ where: { nombre: rolNombre } });
        if (!rol) {
            throw new common_1.NotFoundException(`Rol ${rolNombre} no configurado`);
        }
        const nombre = dto.nombre.trim();
        const apellido = (dto.apellido ?? '').trim();
        const email = await this.resolverEmailStaff(dto.email?.trim().toLowerCase(), nombre, rolNombre, tenantId);
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const u = await this.prisma.usuario.create({
            data: {
                idRestaurante: tenantId,
                idRol: rol.idRol,
                nombre,
                apellido,
                email,
                passwordHash,
                passwordCambiadoEn: new Date(),
                activo: true,
            },
            include: { rol: true },
        });
        return {
            ok: true,
            id: u.idUsuario,
            nombre: u.nombre,
            apellido: u.apellido,
            email: u.email,
            rol: u.rol.nombre,
        };
    }
    async resolverEmailStaff(emailManual, nombre, rol, tenantId) {
        if (emailManual) {
            const exists = await this.prisma.usuario.findUnique({
                where: {
                    idRestaurante_email: { idRestaurante: tenantId, email: emailManual },
                },
            });
            if (exists?.activo) {
                throw new common_1.ConflictException('Ya existe un usuario con ese correo');
            }
            if (exists && !exists.activo) {
                const suffix = (0, restaurant_branding_1.restaurantEmailSuffix)();
                await this.prisma.usuario.update({
                    where: { idUsuario: exists.idUsuario },
                    data: {
                        email: `eliminado.${exists.idUsuario}.${Date.now()}${suffix}`,
                    },
                });
            }
            return emailManual;
        }
        const suffix = (0, restaurant_branding_1.restaurantEmailSuffix)();
        const preferido = rol === roles_1.ROL_ADMIN
            ? `admin${suffix}`
            : rol === roles_1.ROL_CHEF
                ? `cocina${suffix}`
                : (0, email_mesero_1.emailMeseroDesdeNombre)(nombre);
        let candidato = preferido;
        let n = 2;
        while (true) {
            const ocupado = await this.prisma.usuario.findUnique({
                where: {
                    idRestaurante_email: { idRestaurante: tenantId, email: candidato },
                },
            });
            if (!ocupado)
                break;
            if (!ocupado.activo) {
                await this.prisma.usuario.update({
                    where: { idUsuario: ocupado.idUsuario },
                    data: {
                        email: `eliminado.${ocupado.idUsuario}.${Date.now()}${suffix}`,
                    },
                });
                break;
            }
            if (rol === roles_1.ROL_ADMIN) {
                candidato = `admin${n}${suffix}`;
            }
            else if (rol === roles_1.ROL_CHEF) {
                candidato = `cocina${n}${suffix}`;
            }
            else {
                candidato = (0, email_mesero_1.emailMeseroDesdeNombre)(nombre, String(n));
            }
            n += 1;
            if (n > 99) {
                candidato = `${rol}.${Date.now()}${suffix}`;
                break;
            }
        }
        return candidato;
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
    async patchModulos(tenantId, dto) {
        if (dto.modulo_retail_activo === undefined &&
            dto.modulo_redondeo_cobro_activo === undefined &&
            dto.modulo_login_pin_activo === undefined &&
            dto.modulo_autoservicio_activo === undefined &&
            dto.modulo_menu_imagenes_activo === undefined &&
            dto.modulo_produccion_porciones_activo === undefined) {
            throw new common_1.BadRequestException('Nada que actualizar');
        }
        await this.prisma.restaurante.upsert({
            where: { idRestaurante: tenantId },
            create: {
                idRestaurante: tenantId,
                slug: `r${tenantId}`,
                nombre: 'Restaurante',
            },
            update: {},
        });
        const row = await this.prisma.configRestaurante.upsert({
            where: { idRestaurante: tenantId },
            create: {
                idRestaurante: tenantId,
                ...(dto.modulo_retail_activo !== undefined
                    ? { moduloRetailActivo: dto.modulo_retail_activo }
                    : {}),
                ...(dto.modulo_redondeo_cobro_activo !== undefined
                    ? { moduloRedondeoCobroActivo: dto.modulo_redondeo_cobro_activo }
                    : {}),
                ...(dto.modulo_login_pin_activo !== undefined
                    ? { moduloLoginPinActivo: dto.modulo_login_pin_activo }
                    : {}),
                ...(dto.modulo_autoservicio_activo !== undefined
                    ? { moduloAutoservicioActivo: dto.modulo_autoservicio_activo }
                    : {}),
                ...(dto.modulo_menu_imagenes_activo !== undefined
                    ? { moduloMenuImagenesActivo: dto.modulo_menu_imagenes_activo }
                    : {}),
                ...(dto.modulo_produccion_porciones_activo !== undefined
                    ? {
                        moduloProduccionPorcionesActivo: dto.modulo_produccion_porciones_activo,
                    }
                    : {}),
            },
            update: {
                ...(dto.modulo_retail_activo !== undefined
                    ? { moduloRetailActivo: dto.modulo_retail_activo }
                    : {}),
                ...(dto.modulo_redondeo_cobro_activo !== undefined
                    ? { moduloRedondeoCobroActivo: dto.modulo_redondeo_cobro_activo }
                    : {}),
                ...(dto.modulo_login_pin_activo !== undefined
                    ? { moduloLoginPinActivo: dto.modulo_login_pin_activo }
                    : {}),
                ...(dto.modulo_autoservicio_activo !== undefined
                    ? { moduloAutoservicioActivo: dto.modulo_autoservicio_activo }
                    : {}),
                ...(dto.modulo_menu_imagenes_activo !== undefined
                    ? { moduloMenuImagenesActivo: dto.modulo_menu_imagenes_activo }
                    : {}),
                ...(dto.modulo_produccion_porciones_activo !== undefined
                    ? {
                        moduloProduccionPorcionesActivo: dto.modulo_produccion_porciones_activo,
                    }
                    : {}),
            },
        });
        (0, config_restaurante_cache_1.invalidateConfigRestauranteCache)(tenantId);
        (0, menu_hoy_cache_1.invalidateMenuHoyCache)();
        if (dto.modulo_retail_activo) {
            await this.asegurarMesaBoutique(tenantId);
        }
        return {
            ok: true,
            modulo_retail_activo: row.moduloRetailActivo,
            modulo_redondeo_cobro_activo: row.moduloRedondeoCobroActivo,
            modulo_login_pin_activo: row.moduloLoginPinActivo,
            modulo_autoservicio_activo: row.moduloAutoservicioActivo,
            modulo_menu_imagenes_activo: row.moduloMenuImagenesActivo,
            modulo_produccion_porciones_activo: row.moduloProduccionPorcionesActivo,
        };
    }
    async asegurarMesaBoutique(tenantId) {
        const op = await this.prisma.configOperativa.findUnique({
            where: { idRestaurante: tenantId },
        });
        const numero = op?.numeroMesaBoutique ??
            (0, mesa_label_1.resolverMesasVirtuales)(op).numero_mesa_boutique;
        const existing = await this.prisma.mesa.findFirst({
            where: { idRestaurante: tenantId, numero },
        });
        if (existing)
            return;
        await this.prisma.mesa.create({
            data: {
                idRestaurante: tenantId,
                numero,
                capacidad: 1,
                estado: 'libre',
                disponibleLunes: true,
                disponibleMartes: true,
                disponibleMiercoles: true,
                disponibleJueves: true,
                disponibleViernes: true,
                disponibleSabado: true,
                disponibleDomingo: true,
            },
        });
    }
    async eliminarAdmin(tenantId) {
        const admins = await this.prisma.usuario.findMany({
            where: {
                idRestaurante: tenantId,
                rol: { nombre: roles_1.ROL_ADMIN },
                activo: true,
            },
            include: { rol: true },
        });
        if (admins.length === 0) {
            return { ok: true, eliminados: 0, desactivados: 0 };
        }
        let eliminados = 0;
        let desactivados = 0;
        for (const admin of admins) {
            const liberado = await this.quitarCuentaEquipo(admin.idUsuario, tenantId);
            if (liberado === 'deleted')
                eliminados += 1;
            else
                desactivados += 1;
        }
        return { ok: true, eliminados, desactivados };
    }
    async quitarCuentaEquipo(idUsuario, tenantId) {
        const tieneHistorial = await this.usuarioTieneHistorial(idUsuario);
        if (!tieneHistorial) {
            try {
                await this.prisma.usuario.delete({ where: { idUsuario } });
                (0, auth_user_cache_1.invalidateAuthUser)(idUsuario);
                this.gateway.emitAuthSesionInvalidada(idUsuario, 'credenciales', 'La cuenta fue eliminada.', tenantId);
                return 'deleted';
            }
            catch {
            }
        }
        const suffix = (0, restaurant_branding_1.restaurantEmailSuffix)();
        await this.prisma.usuario.update({
            where: { idUsuario },
            data: {
                activo: false,
                email: `eliminado.${idUsuario}.${Date.now()}${suffix}`,
                passwordCambiadoEn: new Date(),
            },
        });
        (0, auth_user_cache_1.invalidateAuthUser)(idUsuario);
        this.gateway.emitAuthSesionInvalidada(idUsuario, 'credenciales', 'La cuenta fue desactivada.', tenantId);
        return 'deactivated';
    }
    async usuarioTieneHistorial(idUsuario) {
        const [pedidos, facturas, historial, caja, creditos, asientos,] = await Promise.all([
            this.prisma.pedido.count({ where: { idUsuario } }),
            this.prisma.factura.count({ where: { idUsuario } }),
            this.prisma.pedidoHistorial.count({ where: { idUsuario } }),
            this.prisma.movimientoCaja.count({ where: { idUsuario } }),
            this.prisma.cuentaCredito.count({ where: { idUsuario } }),
            this.prisma.asientoContable.count({ where: { idUsuario } }),
        ]);
        return (pedidos > 0 ||
            facturas > 0 ||
            historial > 0 ||
            caja > 0 ||
            creditos > 0 ||
            asientos > 0);
    }
    async purgarHistorialPedidosTenant(tenantId) {
        const pedidos = await this.prisma.pedido.findMany({
            where: { idRestaurante: tenantId },
            select: { idPedido: true },
        });
        if (pedidos.length === 0)
            return 0;
        const ids = pedidos.map((p) => p.idPedido);
        const facturas = await this.prisma.factura.findMany({
            where: { idPedido: { in: ids } },
            select: { idFactura: true },
        });
        const idsFacturas = facturas.map((f) => f.idFactura);
        await this.prisma.$transaction(async (tx) => {
            await tx.movInventario.updateMany({
                where: { idPedido: { in: ids } },
                data: { idPedido: null, idDetallePedido: null },
            });
            await tx.movimientoRecurso.updateMany({
                where: { idPedido: { in: ids } },
                data: { idPedido: null },
            });
            await tx.movimientoCaja.deleteMany({
                where: {
                    OR: [
                        { idPedido: { in: ids } },
                        ...(idsFacturas.length
                            ? [{ idFactura: { in: idsFacturas } }]
                            : []),
                    ],
                },
            });
            await tx.detallePedido.updateMany({
                where: { idPedido: { in: ids } },
                data: { idFactura: null },
            });
            await tx.cuentaCredito.deleteMany({
                where: { idPedido: { in: ids } },
            });
            if (idsFacturas.length) {
                await tx.factura.deleteMany({
                    where: { idFactura: { in: idsFacturas } },
                });
            }
            await tx.pedido.deleteMany({ where: { idPedido: { in: ids } } });
            await tx.mesa.updateMany({
                where: { idRestaurante: tenantId },
                data: { estado: 'libre' },
            });
        });
        return ids.length;
    }
    async purgarMenu(tenantId, confirmar) {
        const token = confirmar.trim().toUpperCase();
        const forzar = token === 'PURGAR_MENU_FORZAR';
        if (token !== 'PURGAR_MENU' && !forzar) {
            throw new common_1.BadRequestException('Escribe confirmar: "PURGAR_MENU" o "PURGAR_MENU_FORZAR" (este último también borra pedidos/facturas)');
        }
        let pedidosEliminados = 0;
        if (forzar) {
            pedidosEliminados = await this.purgarHistorialPedidosTenant(tenantId);
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
        this.gateway.emitConfigActualizada('mesas', tenantId);
        return {
            ok: true,
            forzar,
            pedidos_eliminados: pedidosEliminados,
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
    async purgarInventario(tenantId, confirmar) {
        if (confirmar.trim().toUpperCase() !== 'PURGAR_INVENTARIO') {
            throw new common_1.BadRequestException('Escribe confirmar: "PURGAR_INVENTARIO"');
        }
        const inventarios = await this.prisma.inventario.findMany({
            where: { idRestaurante: tenantId },
            select: { idInventario: true },
        });
        const invIds = inventarios.map((i) => i.idInventario);
        const recursos = await this.prisma.recurso.findMany({
            where: { idRestaurante: tenantId },
            select: { idRecurso: true },
        });
        const recursoIds = recursos.map((r) => r.idRecurso);
        const recetas = await this.prisma.recetaProducto.findMany({
            where: { idRestaurante: tenantId },
            select: { idReceta: true },
        });
        const recetaIds = recetas.map((r) => r.idReceta);
        if (recetaIds.length > 0) {
            await this.prisma.recetaLinea.updateMany({
                where: { idSubreceta: { in: recetaIds } },
                data: { idSubreceta: null },
            });
            await this.prisma.recetaLinea.deleteMany({
                where: { idReceta: { in: recetaIds } },
            });
            await this.prisma.recetaProducto.deleteMany({
                where: { idRestaurante: tenantId },
            });
        }
        let movimientosInventario = 0;
        if (invIds.length > 0) {
            const mov = await this.prisma.movInventario.deleteMany({
                where: { idInventario: { in: invIds } },
            });
            movimientosInventario = mov.count;
        }
        let recursosEliminados = 0;
        if (recursoIds.length > 0) {
            const del = await this.prisma.recurso.deleteMany({
                where: { idRestaurante: tenantId },
            });
            recursosEliminados = del.count;
        }
        const invDel = await this.prisma.inventario.deleteMany({
            where: { idRestaurante: tenantId },
        });
        const conv = await this.prisma.conversionUnidad.deleteMany({
            where: { idRestaurante: tenantId },
        });
        const ubic = await this.prisma.ubicacionRecurso.deleteMany({
            where: { idRestaurante: tenantId },
        });
        const catRec = await this.prisma.categoriaRecurso.deleteMany({
            where: { idRestaurante: tenantId },
        });
        (0, deduccion_contexto_cache_1.invalidateDeduccionEstructuraCache)(tenantId);
        (0, config_inventario_cache_1.invalidateConfigInventarioCache)(tenantId);
        this.gateway.emitConfigActualizada('inventario', tenantId);
        return {
            ok: true,
            inventarios_eliminados: invDel.count,
            movimientos_inventario: movimientosInventario,
            recursos_eliminados: recursosEliminados,
            recetas_eliminadas: recetaIds.length,
            conversiones_eliminadas: conv.count,
            ubicaciones_eliminadas: ubic.count,
            categorias_recurso_eliminadas: catRec.count,
        };
    }
};
exports.SuperadminService = SuperadminService;
exports.SuperadminService = SuperadminService = SuperadminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        pedidos_gateway_1.PedidosGateway])
], SuperadminService);
//# sourceMappingURL=superadmin.service.js.map