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
exports.InventarioDeduccionService = void 0;
const common_1 = require("@nestjs/common");
const inventario_deduccion_1 = require("@drewrest/shared-domain/inventario-deduccion");
const inventario_comportamiento_1 = require("@drewrest/shared-domain/inventario-comportamiento");
const inventario_motor_1 = require("@drewrest/shared-domain/inventario-motor");
const inventario_unidades_1 = require("@drewrest/shared-domain/inventario-unidades");
const recurso_comportamiento_1 = require("@drewrest/shared-domain/recurso-comportamiento");
const recurso_movimientos_1 = require("@drewrest/shared-domain/recurso-movimientos");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_constants_1 = require("../tenant/tenant.constants");
const inventario_stock_producto_1 = require("./inventario-stock-producto");
const recurso_stock_producto_1 = require("../recursos/recurso-stock-producto");
const recursos_migracion_service_1 = require("../recursos/recursos-migracion.service");
const recursos_service_1 = require("../recursos/recursos.service");
const config_inventario_cache_1 = require("./config-inventario-cache");
const deduccion_contexto_cache_1 = require("./deduccion-contexto-cache");
const config_restaurante_cache_1 = require("../restaurante/config-restaurante-cache");
let InventarioDeduccionService = class InventarioDeduccionService {
    prisma;
    recursosMigracion;
    recursosSvc;
    constructor(prisma, recursosMigracion, recursosSvc) {
        this.prisma = prisma;
        this.recursosMigracion = recursosMigracion;
        this.recursosSvc = recursosSvc;
    }
    qty(v) {
        return (0, inventario_unidades_1.redondearInventario)(Number(v));
    }
    esEventoDeduccion(v) {
        return inventario_deduccion_1.EVENTOS_DEDUCCION.includes(v);
    }
    async moduloActivo(tenantId) {
        const cached = (0, config_restaurante_cache_1.getCachedConfigRestaurante)(tenantId);
        if (cached)
            return Boolean(cached.moduloInventarioActivo);
        const cfg = await this.prisma.configRestaurante.findUnique({
            where: { idRestaurante: tenantId },
        });
        if (cfg)
            (0, config_restaurante_cache_1.setCachedConfigRestaurante)(tenantId, cfg);
        return Boolean(cfg?.moduloInventarioActivo);
    }
    invalidateContextoCache(tenantId) {
        (0, deduccion_contexto_cache_1.invalidateDeduccionEstructuraCache)(tenantId);
    }
    async obtenerConfig(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const row = await this.obtenerConfigRow(tenantId);
        return {
            evento_deduccion_receta: row.eventoDeduccionReceta,
            evento_deduccion_comercial: row.eventoDeduccionComercial,
            evento_deduccion_consumible: row.eventoDeduccionConsumible,
        };
    }
    async upsertConfig(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        if (dto.evento_deduccion_receta != null &&
            !this.esEventoDeduccion(dto.evento_deduccion_receta)) {
            throw new common_1.BadRequestException('Evento de deducción de receta no válido');
        }
        if (dto.evento_deduccion_comercial != null &&
            !this.esEventoDeduccion(dto.evento_deduccion_comercial)) {
            throw new common_1.BadRequestException('Evento de deducción comercial no válido');
        }
        if (dto.evento_deduccion_consumible != null &&
            dto.evento_deduccion_consumible !== '' &&
            !this.esEventoDeduccion(dto.evento_deduccion_consumible)) {
            throw new common_1.BadRequestException('Evento de deducción de consumible no válido');
        }
        const row = await this.prisma.configInventario.upsert({
            where: { idRestaurante: tenantId },
            create: {
                idRestaurante: tenantId,
                eventoDeduccionReceta: dto.evento_deduccion_receta ??
                    inventario_deduccion_1.POLITICA_DEDUCCION_DEFAULT.evento_receta,
                eventoDeduccionComercial: dto.evento_deduccion_comercial ??
                    inventario_deduccion_1.POLITICA_DEDUCCION_DEFAULT.evento_comercial,
                eventoDeduccionConsumible: dto.evento_deduccion_consumible === ''
                    ? null
                    : (dto.evento_deduccion_consumible ??
                        inventario_deduccion_1.POLITICA_DEDUCCION_DEFAULT.evento_consumible),
            },
            update: {
                ...(dto.evento_deduccion_receta != null
                    ? {
                        eventoDeduccionReceta: dto.evento_deduccion_receta,
                    }
                    : {}),
                ...(dto.evento_deduccion_comercial != null
                    ? {
                        eventoDeduccionComercial: dto.evento_deduccion_comercial,
                    }
                    : {}),
                ...(dto.evento_deduccion_consumible !== undefined
                    ? {
                        eventoDeduccionConsumible: dto.evento_deduccion_consumible === ''
                            ? null
                            : dto.evento_deduccion_consumible,
                    }
                    : {}),
            },
        });
        (0, config_inventario_cache_1.invalidateConfigInventarioCache)(tenantId);
        (0, config_inventario_cache_1.setCachedConfigInventario)(tenantId, row);
        return this.obtenerConfig(tenantId);
    }
    async obtenerConfigRow(tenantId) {
        const cached = (0, config_inventario_cache_1.getCachedConfigInventario)(tenantId);
        if (cached)
            return cached;
        let row = await this.prisma.configInventario.findUnique({
            where: { idRestaurante: tenantId },
        });
        if (!row) {
            row = await this.prisma.configInventario.create({
                data: { idRestaurante: tenantId },
            });
        }
        (0, config_inventario_cache_1.setCachedConfigInventario)(tenantId, row);
        return row;
    }
    politicaDesdeRow(row) {
        return {
            evento_receta: row.eventoDeduccionReceta,
            evento_comercial: row.eventoDeduccionComercial,
            evento_consumible: row.eventoDeduccionConsumible ?? undefined,
        };
    }
    async listarConversiones(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const rows = await this.prisma.conversionUnidad.findMany({
            where: { idRestaurante: tenantId },
            orderBy: [{ unidadOrigen: 'asc' }],
        });
        return rows.map((r) => ({
            id_conversion: r.idConversion,
            unidad_origen: r.unidadOrigen,
            unidad_destino: r.unidadDestino,
            factor: Number(r.factor),
        }));
    }
    async crearConversion(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const origen = dto.unidad_origen.trim();
        const destino = dto.unidad_destino.trim();
        if (!origen || !destino) {
            throw new common_1.BadRequestException('Indica unidades de origen y destino');
        }
        const row = await this.prisma.conversionUnidad.create({
            data: {
                idRestaurante: tenantId,
                unidadOrigen: origen,
                unidadDestino: destino,
                factor: dto.factor,
            },
        });
        (0, deduccion_contexto_cache_1.invalidateDeduccionEstructuraCache)(tenantId);
        return {
            id_conversion: row.idConversion,
            unidad_origen: row.unidadOrigen,
            unidad_destino: row.unidadDestino,
            factor: Number(row.factor),
        };
    }
    async eliminarConversion(idConversion, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const row = await this.prisma.conversionUnidad.findFirst({
            where: { idConversion, idRestaurante: tenantId },
        });
        if (!row) {
            throw new common_1.BadRequestException('Conversión no encontrada');
        }
        await this.prisma.conversionUnidad.delete({
            where: { idConversion },
        });
        (0, deduccion_contexto_cache_1.invalidateDeduccionEstructuraCache)(tenantId);
        return { ok: true };
    }
    docId(evento, idDetalle) {
        return `ded:${evento}:${idDetalle}`;
    }
    revDocId(evento, idDetalle) {
        return `rev:${evento}:${idDetalle}`;
    }
    mapArticulo(row) {
        const clase = (0, inventario_comportamiento_1.esClaseInventario)(row.claseInventario)
            ? row.claseInventario
            : 'produccion';
        return {
            id_articulo: row.idInventario,
            nombre: row.ingrediente,
            clase,
            comportamiento: (0, inventario_comportamiento_1.parseComportamientoJson)(row.comportamiento, clase),
            unidad_stock: row.unidad,
            cantidad_actual: this.qty(row.cantidadActual),
            cantidad_minima: this.qty(row.cantidadMinima),
            costo_unitario: row.costoUnitario != null ? Number(row.costoUnitario) : undefined,
            id_producto: row.idProducto ?? undefined,
        };
    }
    mapRecursoArticulo(row) {
        const flags = (0, recurso_comportamiento_1.flagsDesdeCategoriaRow)(row.categoria);
        const clase = flags.puede_venderse
            ? 'comercial'
            : flags.es_activo_fijo
                ? 'activo_interno'
                : flags.se_consume_auto
                    ? 'produccion'
                    : 'consumible_interno';
        const comportamiento = {
            se_compra: true,
            se_vende_directamente: flags.puede_venderse,
            tiene_receta: flags.requiere_receta,
            descuenta_automaticamente: flags.se_consume_auto,
            es_activo_fijo: flags.es_activo_fijo,
            requiere_lote: flags.controla_lote,
            controla_seriales: flags.maneja_serie,
            permite_prestamo: flags.permite_prestamo,
            permite_mantenimiento: flags.requiere_mantenimiento,
            permite_perdidas: true,
        };
        return {
            id_articulo: row.idRecurso,
            nombre: row.nombre,
            clase,
            comportamiento,
            unidad_stock: row.unidad,
            cantidad_actual: this.qty(row.stock),
            cantidad_minima: this.qty(row.stockMin),
            costo_unitario: Number(row.costo),
            id_producto: row.idProducto ?? undefined,
        };
    }
    async cargarContextoDeduccion(tx, tenantId, productIds) {
        await this.recursosMigracion.migrarSiNecesario(tenantId);
        const cached = (0, deduccion_contexto_cache_1.getDeduccionEstructuraCache)(tenantId);
        if (cached) {
            return this.hidratarContextoDesdeCache(tx, tenantId, cached, productIds);
        }
        const [recursosRows, inventariosRows, conversionesRows, recetasRows] = await Promise.all([
            tx.recurso.findMany({
                where: { idRestaurante: tenantId, estado: { not: 'baja' } },
                include: { categoria: true },
            }),
            tx.inventario.findMany({ where: { idRestaurante: tenantId } }),
            tx.conversionUnidad.findMany({ where: { idRestaurante: tenantId } }),
            tx.recetaProducto.findMany({
                where: { idRestaurante: tenantId, activa: true },
                include: { lineas: { orderBy: { orden: 'asc' } } },
            }),
        ]);
        const usaRecursos = recursosRows.length > 0;
        const articulos = new Map();
        const legacyARecurso = new Map();
        if (usaRecursos) {
            for (const r of recursosRows) {
                articulos.set(r.idRecurso, this.mapRecursoArticulo({
                    ...r,
                    categoria: r.categoria,
                }));
                if (r.idInventarioLegacy != null) {
                    legacyARecurso.set(r.idInventarioLegacy, r.idRecurso);
                }
            }
        }
        else {
            for (const a of inventariosRows) {
                articulos.set(a.idInventario, this.mapArticulo(a));
            }
        }
        const comercialPorProducto = new Map();
        for (const a of articulos.values()) {
            if (a.id_producto != null && a.clase === 'comercial') {
                comercialPorProducto.set(a.id_producto, a);
            }
        }
        const conversiones = conversionesRows.map((c) => ({
            unidad_origen: c.unidadOrigen,
            unidad_destino: c.unidadDestino,
            factor: Number(c.factor),
        }));
        const recetas = new Map();
        const recetaPorProducto = new Map();
        for (const r of recetasRows) {
            const dom = {
                id_receta: String(r.idReceta),
                id_producto: r.idProducto,
                version: r.version,
                lineas: r.lineas.map((l) => {
                    const idArticulo = usaRecursos
                        ? (l.idRecurso ??
                            (l.idInventario != null
                                ? legacyARecurso.get(l.idInventario)
                                : undefined))
                        : (l.idInventario ?? undefined);
                    return {
                        id_linea: String(l.idLinea),
                        id_articulo: idArticulo,
                        id_subreceta: l.idSubreceta != null ? String(l.idSubreceta) : undefined,
                        cantidad: Number(l.cantidad),
                        unidad: l.unidad,
                        opcional: l.opcional,
                    };
                }),
            };
            recetas.set(dom.id_receta, dom);
            recetaPorProducto.set(r.idProducto, dom);
        }
        const articulosMeta = new Map();
        for (const a of articulos.values()) {
            articulosMeta.set(a.id_articulo, {
                id_articulo: a.id_articulo,
                nombre: a.nombre,
                clase: a.clase,
                comportamiento: a.comportamiento,
                unidad_stock: a.unidad_stock,
                costo_unitario: a.costo_unitario ?? 0,
                id_producto: a.id_producto,
                cantidad_minima: a.cantidad_minima,
            });
        }
        const comercialPorProductoIds = new Map();
        for (const [pid, art] of comercialPorProducto) {
            comercialPorProductoIds.set(pid, art.id_articulo);
        }
        (0, deduccion_contexto_cache_1.setDeduccionEstructuraCache)(tenantId, {
            usaRecursos,
            conversiones,
            recetasPorProducto: new Map([...recetaPorProducto.entries()].map(([pid, r]) => [
                pid,
                {
                    id_receta: r.id_receta,
                    id_producto: r.id_producto ?? pid,
                    version: r.version ?? 1,
                    lineas: r.lineas.map((l) => ({
                        id_linea: l.id_linea,
                        id_articulo: l.id_articulo,
                        id_subreceta: l.id_subreceta,
                        cantidad: l.cantidad,
                        unidad: l.unidad,
                        opcional: Boolean(l.opcional),
                    })),
                },
            ])),
            articulosMeta,
            comercialPorProductoIds,
        });
        if (productIds?.length) {
            return this.hidratarContextoDesdeCache(tx, tenantId, (0, deduccion_contexto_cache_1.getDeduccionEstructuraCache)(tenantId), productIds);
        }
        return {
            articulos,
            comercialPorProducto,
            conversiones,
            recetas,
            recetaPorProducto,
            usaRecursos,
        };
    }
    async hidratarContextoDesdeCache(tx, tenantId, cached, productIds) {
        const articuloIds = new Set();
        const recetaPorProducto = new Map();
        const recetas = new Map();
        const productos = productIds?.length ? new Set(productIds) : null;
        for (const [pid, rec] of cached.recetasPorProducto) {
            if (productos && !productos.has(pid))
                continue;
            const clone = {
                id_receta: rec.id_receta,
                id_producto: rec.id_producto,
                version: rec.version,
                lineas: rec.lineas.map((l) => ({ ...l })),
            };
            recetaPorProducto.set(pid, clone);
            recetas.set(clone.id_receta, clone);
            for (const l of clone.lineas) {
                if (l.id_articulo != null)
                    articuloIds.add(l.id_articulo);
            }
        }
        for (const [pid, idArt] of cached.comercialPorProductoIds) {
            if (productos && !productos.has(pid))
                continue;
            articuloIds.add(idArt);
        }
        if (!productos) {
            for (const id of cached.articulosMeta.keys())
                articuloIds.add(id);
        }
        const ids = [...articuloIds];
        const articulos = new Map();
        if (cached.usaRecursos) {
            const rows = ids.length > 0
                ? await tx.recurso.findMany({
                    where: { idRestaurante: tenantId, idRecurso: { in: ids } },
                    include: { categoria: true },
                })
                : [];
            for (const r of rows) {
                articulos.set(r.idRecurso, this.mapRecursoArticulo({
                    ...r,
                    categoria: r.categoria,
                }));
            }
        }
        else {
            const rows = ids.length > 0
                ? await tx.inventario.findMany({
                    where: { idRestaurante: tenantId, idInventario: { in: ids } },
                })
                : [];
            for (const a of rows) {
                articulos.set(a.idInventario, this.mapArticulo(a));
            }
        }
        for (const [id, meta] of cached.articulosMeta) {
            if (articulos.has(id))
                continue;
            if (productos && !ids.includes(id))
                continue;
            articulos.set(id, {
                id_articulo: meta.id_articulo,
                nombre: meta.nombre,
                clase: meta.clase,
                comportamiento: meta.comportamiento,
                unidad_stock: meta.unidad_stock,
                cantidad_actual: 0,
                cantidad_minima: meta.cantidad_minima,
                costo_unitario: meta.costo_unitario,
                id_producto: meta.id_producto,
            });
        }
        const comercialPorProducto = new Map();
        for (const [pid, idArt] of cached.comercialPorProductoIds) {
            if (productos && !productos.has(pid))
                continue;
            const art = articulos.get(idArt);
            if (art)
                comercialPorProducto.set(pid, art);
        }
        return {
            articulos,
            comercialPorProducto,
            conversiones: [...cached.conversiones],
            recetas,
            recetaPorProducto,
            usaRecursos: cached.usaRecursos,
        };
    }
    planificarParaLinea(linea, evento, politica, ctx, idPedido) {
        const receta = ctx.recetaPorProducto.get(linea.id_producto);
        if (receta) {
            const plan = (0, inventario_motor_1.planificarDeduccionReceta)({
                linea: {
                    id_detalle_pedido: linea.id_detalle_pedido,
                    id_producto: linea.id_producto,
                    cantidad: linea.cantidad,
                    nombre_producto: linea.nombre_producto,
                },
                receta,
                articulos: ctx.articulos,
                recetas: ctx.recetas,
                conversiones: ctx.conversiones,
                evento,
                politica,
                id_pedido: idPedido,
            });
            return plan.movimientos;
        }
        const comercial = ctx.comercialPorProducto.get(linea.id_producto);
        if (comercial) {
            return (0, inventario_motor_1.planificarDeduccionVentaComercial)({
                linea: {
                    id_detalle_pedido: linea.id_detalle_pedido,
                    id_producto: linea.id_producto,
                    cantidad: linea.cantidad,
                    nombre_producto: linea.nombre_producto,
                },
                articulo: comercial,
                evento,
                politica,
                id_pedido: idPedido,
            });
        }
        return [];
    }
    tipoMovPrisma(tipo) {
        if (tipo === 'consumo_manual')
            return 'consumo';
        if (tipo === 'ajuste_manual')
            return 'ajuste';
        if (tipo === 'compra')
            return 'entrada';
        return tipo;
    }
    async yaAplicado(tx, idDocumento, usaRecursos) {
        if (usaRecursos) {
            const n = await tx.movimientoRecurso.count({
                where: { idDocumento },
            });
            return n > 0;
        }
        const n = await tx.movInventario.count({ where: { idDocumento } });
        return n > 0;
    }
    async persistirMovimientos(tx, movimientos, input) {
        const doc = input.id_documento ??
            (input.reverso
                ? this.revDocId(input.evento, input.idDetallePedido)
                : this.docId(input.evento, input.idDetallePedido));
        const usaRecursos = Boolean(input.usaRecursos);
        if (await this.yaAplicado(tx, doc, usaRecursos))
            return;
        for (const mov of movimientos) {
            const delta = input.reverso ? -mov.delta : mov.delta;
            if (delta === 0)
                continue;
            if (usaRecursos) {
                const tipo = input.reverso
                    ? 'devolucion'
                    : (0, recurso_movimientos_1.tipoMovimientoDesdeInventarioLegacy)(mov.tipo_mov);
                await this.recursosSvc.aplicarMovimientoDeduccionTx(tx, {
                    id_recurso: mov.id_articulo,
                    tenant_id: input.tenantId ?? tenant_constants_1.DEFAULT_TENANT_ID,
                    tipo,
                    cantidad: delta,
                    costo_unitario: mov.costo_unitario,
                    observacion: mov.observacion ??
                        (input.reverso ? `Reversión ${input.evento}` : input.evento),
                    modulo_origen: mov.modulo_origen ?? 'pedido',
                    id_documento: doc,
                    id_usuario: input.idUsuario,
                    id_pedido: input.idPedido ?? mov.id_pedido,
                    id_detalle_pedido: input.idDetallePedido,
                });
                continue;
            }
            const item = await tx.inventario.findUnique({
                where: { idInventario: mov.id_articulo },
            });
            if (!item)
                continue;
            const actual = this.qty(item.cantidadActual);
            const nuevo = (0, inventario_unidades_1.redondearInventario)(actual + delta);
            const abs = Math.abs(delta);
            const costoUnit = mov.costo_unitario ??
                (item.costoUnitario != null ? Number(item.costoUnitario) : null);
            await tx.movInventario.create({
                data: {
                    idInventario: mov.id_articulo,
                    idPedido: input.idPedido ?? mov.id_pedido ?? null,
                    idDetallePedido: input.idDetallePedido,
                    idUsuario: input.idUsuario ?? null,
                    tipoMov: input.reverso
                        ? 'devolucion'
                        : this.tipoMovPrisma(mov.tipo_mov),
                    cantidad: abs,
                    moduloOrigen: mov.modulo_origen ?? 'pedido',
                    idDocumento: doc,
                    costoUnitario: costoUnit,
                    costoTotal: costoUnit != null ? abs * costoUnit : null,
                    observacion: mov.observacion ??
                        (input.reverso ? `Reversión ${input.evento}` : input.evento),
                },
            });
            await tx.inventario.update({
                where: { idInventario: mov.id_articulo },
                data: { cantidadActual: nuevo },
            });
        }
    }
    async aplicarEventoLineasEnTx(tx, input) {
        if (!(await this.moduloActivo(input.tenantId)))
            return;
        if (!input.lineas.length)
            return;
        const configRow = await this.obtenerConfigRow(input.tenantId);
        const politica = this.politicaDesdeRow(configRow);
        const productIds = input.lineas.map((l) => l.id_producto);
        const ctx = await this.cargarContextoDeduccion(tx, input.tenantId, productIds);
        for (const linea of input.lineas) {
            const movs = this.planificarParaLinea(linea, input.evento, politica, ctx, input.idPedido);
            if (!movs.length)
                continue;
            await this.persistirMovimientos(tx, movs, {
                evento: input.evento,
                idDetallePedido: linea.id_detalle_pedido,
                idPedido: input.idPedido,
                idUsuario: input.idUsuario,
                usaRecursos: ctx.usaRecursos,
                tenantId: input.tenantId,
            });
        }
        const productosSync = new Set();
        for (const linea of input.lineas) {
            const comercial = ctx.comercialPorProducto.get(linea.id_producto);
            if (comercial?.id_producto != null) {
                productosSync.add(comercial.id_producto);
            }
        }
        for (const idProducto of productosSync) {
            if (ctx.usaRecursos) {
                await (0, recurso_stock_producto_1.syncStockProductoDesdeRecursoTx)(tx, idProducto, input.tenantId);
            }
            else {
                await (0, inventario_stock_producto_1.syncStockProductoDesdeInventarioTx)(tx, idProducto, input.tenantId);
            }
        }
    }
    async ajustarCantidadLineaEnTx(tx, input) {
        if (!(await this.moduloActivo(input.tenantId)))
            return;
        if (input.deltaCantidad === 0)
            return;
        const configRow = await this.obtenerConfigRow(input.tenantId);
        const politica = this.politicaDesdeRow(configRow);
        const ctx = await this.cargarContextoDeduccion(tx, input.tenantId, [
            input.linea.id_producto,
        ]);
        const eventoComercial = politica.evento_comercial;
        const lineaDelta = {
            ...input.linea,
            cantidad: Math.abs(input.deltaCantidad),
        };
        const docAdj = `${this.docId(eventoComercial, input.linea.id_detalle_pedido)}:adj:${input.deltaCantidad}`;
        if (input.deltaCantidad > 0) {
            const movs = this.planificarParaLinea(lineaDelta, eventoComercial, politica, ctx, input.idPedido);
            if (movs.length) {
                await this.persistirMovimientos(tx, movs, {
                    evento: eventoComercial,
                    idDetallePedido: input.linea.id_detalle_pedido,
                    idPedido: input.idPedido,
                    idUsuario: input.idUsuario,
                    id_documento: docAdj,
                    usaRecursos: ctx.usaRecursos,
                    tenantId: input.tenantId,
                });
            }
            if (input.linea.id_producto) {
                if (ctx.usaRecursos) {
                    await (0, recurso_stock_producto_1.syncStockProductoDesdeRecursoTx)(tx, input.linea.id_producto, input.tenantId);
                }
                else {
                    await (0, inventario_stock_producto_1.syncStockProductoDesdeInventarioTx)(tx, input.linea.id_producto, input.tenantId);
                }
            }
            return;
        }
        const movs = this.planificarParaLinea(lineaDelta, eventoComercial, politica, ctx, input.idPedido);
        if (movs.length) {
            await this.persistirMovimientos(tx, movs, {
                evento: eventoComercial,
                idDetallePedido: input.linea.id_detalle_pedido,
                idPedido: input.idPedido,
                idUsuario: input.idUsuario,
                reverso: true,
                id_documento: docAdj,
                usaRecursos: ctx.usaRecursos,
                tenantId: input.tenantId,
            });
        }
        if (input.linea.id_producto) {
            if (ctx.usaRecursos) {
                await (0, recurso_stock_producto_1.syncStockProductoDesdeRecursoTx)(tx, input.linea.id_producto, input.tenantId);
            }
            else {
                await (0, inventario_stock_producto_1.syncStockProductoDesdeInventarioTx)(tx, input.linea.id_producto, input.tenantId);
            }
        }
    }
    async revertirLineaEnTx(tx, input) {
        if (!(await this.moduloActivo(input.tenantId)))
            return;
        const configRow = await this.obtenerConfigRow(input.tenantId);
        const politica = this.politicaDesdeRow(configRow);
        const ctx = await this.cargarContextoDeduccion(tx, input.tenantId, [
            input.linea.id_producto,
        ]);
        const eventos = [
            politica.evento_comercial,
            politica.evento_receta,
            politica.evento_consumible ?? politica.evento_comercial,
        ];
        for (const evento of [...new Set(eventos)]) {
            const movs = this.planificarParaLinea(input.linea, evento, politica, ctx, input.idPedido);
            if (!movs.length)
                continue;
            await this.persistirMovimientos(tx, movs, {
                evento,
                idDetallePedido: input.linea.id_detalle_pedido,
                idPedido: input.idPedido,
                idUsuario: input.idUsuario,
                reverso: true,
                usaRecursos: ctx.usaRecursos,
                tenantId: input.tenantId,
            });
        }
    }
};
exports.InventarioDeduccionService = InventarioDeduccionService;
exports.InventarioDeduccionService = InventarioDeduccionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        recursos_migracion_service_1.RecursosMigracionService,
        recursos_service_1.RecursosService])
], InventarioDeduccionService);
//# sourceMappingURL=inventario-deduccion.service.js.map