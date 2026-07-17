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
exports.ProductosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const pedidos_gateway_1 = require("../pedidos/pedidos.gateway");
const tenant_constants_1 = require("../tenant/tenant.constants");
const empaque_para_llevar_1 = require("@drewrest/shared-domain/empaque-para-llevar");
const cocina_producto_1 = require("@drewrest/shared-domain/cocina-producto");
const mazorca_linea_pedido_1 = require("../pedidos/mazorca-linea-pedido");
const producto_inventario_vinculo_service_1 = require("../inventario/producto-inventario-vinculo.service");
function resolverFlagsProducto(cat, explicit, existing) {
    const auto = (0, empaque_para_llevar_1.flagsProductoMenuPorCategoria)(cat);
    let esEmpacable;
    if (explicit.es_empacable != null) {
        esEmpacable = explicit.es_empacable;
    }
    else if (existing != null) {
        esEmpacable = existing.esEmpacable;
    }
    else {
        esEmpacable = auto.es_empacable;
    }
    let esPlatoPrincipal;
    if (esEmpacable) {
        esPlatoPrincipal = false;
    }
    else if (explicit.es_plato_principal != null) {
        esPlatoPrincipal = explicit.es_plato_principal;
    }
    else if (existing != null) {
        esPlatoPrincipal = existing.esPlatoPrincipal;
    }
    else {
        esPlatoPrincipal = auto.es_plato_principal;
    }
    return { esPlatoPrincipal, esEmpacable };
}
function resolverEnviaCocinaProducto(cat, explicit, existing, fallback) {
    if (explicit.envia_cocina != null) {
        return explicit.envia_cocina;
    }
    if (existing != null) {
        return existing;
    }
    return !fallback?.esAcompanamientoMazorca &&
        !fallback?.esEmpacable &&
        (0, cocina_producto_1.debeMarcarCocina)(cat, Boolean(fallback?.esEmpacable));
}
function mapProducto(p) {
    return {
        id_producto: p.idProducto,
        id_categoria: p.idCategoria,
        categoria_nombre: p.categoria.nombre,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio: Number(p.precio),
        activo: p.activo,
        es_plato_principal: p.esPlatoPrincipal,
        es_empacable: p.esEmpacable,
        envia_cocina: p.enviaCocina,
        usa_subitems_repartibles: p.usaSubitemsRepartibles,
        cantidad_reparto_subitems: Math.max(1, p.cantidadRepartoSubitems ?? 1),
        es_acompanamiento_mazorca: p.esAcompanamientoMazorca,
        tipo_proteina: p.tipoProteina,
        prioridad_cocina_baja: p.prioridadCocinaBaja,
        control_stock: p.controlStock,
        stock_disponible: p.stockDisponible,
        ocultar_sin_stock: p.ocultarSinStock,
        es_bebida: p.categoria.esBebida ?? false,
        total_usos_pedido: p._count?.detalles ?? 0,
    };
}
let ProductosService = class ProductosService {
    prisma;
    gateway;
    vinculoInventario;
    constructor(prisma, gateway, vinculoInventario) {
        this.prisma = prisma;
        this.gateway = gateway;
        this.vinculoInventario = vinculoInventario;
    }
    async asegurarUnicoMazorca(idProducto, esMazorca, tenantId) {
        if (!esMazorca)
            return;
        await this.prisma.producto.updateMany({
            where: {
                esAcompanamientoMazorca: true,
                idProducto: { not: idProducto },
                categoria: { idRestaurante: tenantId },
            },
            data: { esAcompanamientoMazorca: false },
        });
        await this.prisma.configOperativa.upsert({
            where: { idRestaurante: tenantId },
            create: { idRestaurante: tenantId, idProductoMazorca: idProducto },
            update: { idProductoMazorca: idProducto },
        });
        (0, mazorca_linea_pedido_1.invalidateMazorcaProductIdCache)(tenantId);
    }
    async listarCategorias(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const rows = await this.prisma.categoria.findMany({
            where: { idRestaurante: tenantId },
            select: { idCategoria: true, nombre: true },
            orderBy: { nombre: 'asc' },
        });
        return rows.map((c) => ({
            id_categoria: c.idCategoria,
            nombre: c.nombre,
        }));
    }
    async listarProductos(incluirInactivos, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const rows = await this.prisma.producto.findMany({
            where: {
                categoria: { idRestaurante: tenantId },
                ...(incluirInactivos ? {} : { activo: true }),
            },
            include: {
                categoria: { select: { nombre: true, esBebida: true } },
                ...(incluirInactivos
                    ? { _count: { select: { detalles: true } } }
                    : {}),
            },
            orderBy: [{ categoria: { nombre: 'asc' } }, { nombre: 'asc' }],
        });
        return rows.map(mapProducto);
    }
    async crear(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const cat = await this.prisma.categoria.findFirst({
            where: { idCategoria: dto.id_categoria, idRestaurante: tenantId },
        });
        if (!cat) {
            throw new common_1.BadRequestException('Categoría no encontrada');
        }
        const flags = resolverFlagsProducto(cat, {
            es_plato_principal: dto.es_plato_principal,
            es_empacable: dto.es_empacable,
        });
        const esMazorca = Boolean(dto.es_acompanamiento_mazorca);
        if (dto.usa_subitems_repartibles && (flags.esEmpacable || esMazorca)) {
            throw new common_1.BadRequestException('Este producto no admite subítems repartibles');
        }
        const enviaCocina = resolverEnviaCocinaProducto(cat, { envia_cocina: dto.envia_cocina }, undefined, {
            esEmpacable: flags.esEmpacable,
            esAcompanamientoMazorca: esMazorca,
        });
        const created = await this.prisma.producto.create({
            data: {
                idCategoria: dto.id_categoria,
                nombre: dto.nombre.trim(),
                descripcion: dto.descripcion?.trim() || null,
                precio: dto.precio,
                esPlatoPrincipal: flags.esPlatoPrincipal,
                esEmpacable: flags.esEmpacable,
                enviaCocina,
                usaSubitemsRepartibles: dto.usa_subitems_repartibles ?? false,
                cantidadRepartoSubitems: dto.usa_subitems_repartibles && dto.cantidad_reparto_subitems != null
                    ? Math.max(1, Math.min(99, Math.round(dto.cantidad_reparto_subitems)))
                    : 1,
                esAcompanamientoMazorca: esMazorca,
                tipoProteina: dto.tipo_proteina ?? 'ninguno',
                prioridadCocinaBaja: dto.prioridad_cocina_baja ?? null,
                activo: true,
                ...(dto.control_stock != null ? { controlStock: dto.control_stock } : {}),
                ...(dto.stock_disponible != null
                    ? { stockDisponible: Math.round(dto.stock_disponible) }
                    : {}),
                ...(dto.ocultar_sin_stock != null
                    ? { ocultarSinStock: dto.ocultar_sin_stock }
                    : {}),
            },
            include: { categoria: { select: { nombre: true, esBebida: true } } },
        });
        if (esMazorca) {
            await this.asegurarUnicoMazorca(created.idProducto, true, tenantId);
        }
        this.gateway.emitConfigActualizada('menu', tenantId);
        return mapProducto(created);
    }
    async actualizar(idProducto, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const existing = await this.prisma.producto.findFirst({
            where: { idProducto, categoria: { idRestaurante: tenantId } },
            include: { categoria: true },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Producto no encontrado');
        }
        let cat = existing.categoria;
        if (dto.id_categoria != null) {
            const nueva = await this.prisma.categoria.findUnique({
                where: { idCategoria: dto.id_categoria },
            });
            if (!nueva) {
                throw new common_1.BadRequestException('Categoría no encontrada');
            }
            cat = nueva;
        }
        const flags = resolverFlagsProducto(cat, {
            es_plato_principal: dto.es_plato_principal,
            es_empacable: dto.es_empacable,
        }, {
            esPlatoPrincipal: existing.esPlatoPrincipal,
            esEmpacable: existing.esEmpacable,
        });
        const esMazorca = dto.es_acompanamiento_mazorca != null
            ? dto.es_acompanamiento_mazorca
            : existing.esAcompanamientoMazorca;
        if (dto.usa_subitems_repartibles &&
            (flags.esEmpacable || esMazorca)) {
            throw new common_1.BadRequestException('Este producto no admite subítems repartibles');
        }
        const enviaCocina = resolverEnviaCocinaProducto(cat, { envia_cocina: dto.envia_cocina }, existing.enviaCocina, {
            esEmpacable: flags.esEmpacable,
            esAcompanamientoMazorca: esMazorca,
        });
        const updated = await this.prisma.producto.update({
            where: { idProducto },
            data: {
                ...(dto.id_categoria != null ? { idCategoria: dto.id_categoria } : {}),
                ...(dto.nombre != null ? { nombre: dto.nombre.trim() } : {}),
                ...(dto.descripcion !== undefined
                    ? { descripcion: dto.descripcion?.trim() || null }
                    : {}),
                ...(dto.precio != null ? { precio: dto.precio } : {}),
                ...(dto.activo != null ? { activo: dto.activo } : {}),
                esPlatoPrincipal: flags.esPlatoPrincipal,
                esEmpacable: flags.esEmpacable,
                enviaCocina,
                ...(dto.usa_subitems_repartibles != null
                    ? { usaSubitemsRepartibles: dto.usa_subitems_repartibles }
                    : {}),
                ...(dto.cantidad_reparto_subitems != null
                    ? {
                        cantidadRepartoSubitems: Math.max(1, Math.min(99, Math.round(dto.cantidad_reparto_subitems))),
                    }
                    : {}),
                esAcompanamientoMazorca: esMazorca,
                ...(dto.tipo_proteina != null ? { tipoProteina: dto.tipo_proteina } : {}),
                ...(dto.prioridad_cocina_baja !== undefined
                    ? { prioridadCocinaBaja: dto.prioridad_cocina_baja }
                    : {}),
                ...(dto.control_stock != null ? { controlStock: dto.control_stock } : {}),
                ...(dto.stock_disponible != null
                    ? { stockDisponible: Math.round(dto.stock_disponible) }
                    : {}),
                ...(dto.ocultar_sin_stock != null
                    ? { ocultarSinStock: dto.ocultar_sin_stock }
                    : {}),
            },
            include: { categoria: { select: { nombre: true, esBebida: true } } },
        });
        if (dto.es_acompanamiento_mazorca != null) {
            await this.asegurarUnicoMazorca(idProducto, esMazorca, tenantId);
        }
        if (dto.nombre != null) {
            await this.vinculoInventario.sincronizarNombreDesdeProducto(idProducto, dto.nombre, tenantId);
        }
        this.gateway.emitConfigActualizada('menu', tenantId);
        return mapProducto(updated);
    }
    async desactivar(idProducto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const result = await this.actualizar(idProducto, { activo: false }, tenantId);
        return result;
    }
    async eliminarPermanente(idProducto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const existing = await this.prisma.producto.findFirst({
            where: { idProducto, categoria: { idRestaurante: tenantId } },
            include: { _count: { select: { detalles: true } } },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Producto no encontrado');
        }
        if (existing._count.detalles > 0) {
            throw new common_1.ConflictException('Tiene historial de pedidos — no se puede eliminar; solo ocultar del menú');
        }
        await this.vinculoInventario.validarEliminacionPermanenteProducto(idProducto, tenantId);
        const cfg = await this.prisma.configOperativa.findFirst({
            where: {
                idRestaurante: tenantId,
                OR: [
                    { idProductoMazorca: idProducto },
                    { idProductoSodaAlmuerzo: idProducto },
                    { idProductoCuotaPendiente: idProducto },
                ],
            },
        });
        if (cfg) {
            throw new common_1.ConflictException('El producto está referenciado en la configuración del sistema');
        }
        if (existing.esAcompanamientoMazorca) {
            await this.prisma.configOperativa.updateMany({
                where: { idRestaurante: tenantId, idProductoMazorca: idProducto },
                data: { idProductoMazorca: null },
            });
            (0, mazorca_linea_pedido_1.invalidateMazorcaProductIdCache)(tenantId);
        }
        await this.prisma.producto.delete({ where: { idProducto } });
        this.gateway.emitConfigActualizada('menu', tenantId);
        return { ok: true, id_producto: idProducto };
    }
};
exports.ProductosService = ProductosService;
exports.ProductosService = ProductosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        pedidos_gateway_1.PedidosGateway,
        producto_inventario_vinculo_service_1.ProductoInventarioVinculoService])
], ProductosService);
//# sourceMappingURL=productos.service.js.map