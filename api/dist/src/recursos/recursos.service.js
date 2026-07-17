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
exports.RecursosService = void 0;
const common_1 = require("@nestjs/common");
const recurso_comportamiento_1 = require("@drewrest/shared-domain/recurso-comportamiento");
const recurso_movimientos_1 = require("@drewrest/shared-domain/recurso-movimientos");
const inventario_unidades_1 = require("@drewrest/shared-domain/inventario-unidades");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_constants_1 = require("../tenant/tenant.constants");
const recurso_stock_producto_1 = require("./recurso-stock-producto");
const recursos_migracion_service_1 = require("./recursos-migracion.service");
const deduccion_contexto_cache_1 = require("../inventario/deduccion-contexto-cache");
let RecursosService = class RecursosService {
    prisma;
    migracion;
    constructor(prisma, migracion) {
        this.prisma = prisma;
        this.migracion = migracion;
    }
    qty(v) {
        return (0, inventario_unidades_1.redondearInventario)(Number(v));
    }
    mapCategoria(c) {
        return {
            id_categoria: c.idCategoria,
            codigo: c.codigo,
            nombre: c.nombre,
            descripcion: c.descripcion,
            activa: c.activa,
            orden: c.orden,
            controla_stock: c.controlaStock,
            se_consume_auto: c.seConsumeAuto,
            puede_venderse: c.puedeVenderse,
            requiere_receta: c.requiereReceta,
            controla_vencimiento: c.controlaVencimiento,
            controla_lote: c.controlaLote,
            maneja_serie: c.manejaSerie,
            requiere_mantenimiento: c.requiereMantenimiento,
            es_activo_fijo: c.esActivoFijo,
            permite_depreciacion: c.permiteDepreciacion,
            tiene_responsable: c.tieneResponsable,
            tiene_ubicacion: c.tieneUbicacion,
            permite_prestamo: c.permitePrestamo,
        };
    }
    mapRecurso(r) {
        const stock = this.qty(r.stock);
        const stockMin = this.qty(r.stockMin);
        return {
            id_recurso: r.idRecurso,
            codigo: r.codigo,
            nombre: r.nombre,
            descripcion: r.descripcion,
            id_categoria: r.idCategoria,
            unidad: r.unidad,
            costo: Number(r.costo),
            precio: r.precio != null ? Number(r.precio) : null,
            stock,
            stock_min: stockMin,
            stock_max: r.stockMax != null ? this.qty(r.stockMax) : null,
            estado: r.estado,
            critico: stock > 0 && stock <= stockMin,
            id_proveedor: r.idProveedor,
            id_ubicacion: r.idUbicacion,
            id_responsable: r.idResponsable,
            codigo_barras: r.codigoBarras,
            codigo_qr: r.codigoQr,
            numero_serie: r.numeroSerie,
            fecha_compra: r.fechaCompra?.toISOString().slice(0, 10) ?? null,
            fecha_vencimiento: r.fechaVencimiento?.toISOString().slice(0, 10) ?? null,
            observaciones: r.observaciones,
            id_producto: r.idProducto,
            id_inventario_legacy: r.idInventarioLegacy,
            categoria: r.categoria ? this.mapCategoria(r.categoria) : undefined,
            ubicacion: r.ubicacion
                ? { id_ubicacion: r.ubicacion.idUbicacion, nombre: r.ubicacion.nombre }
                : null,
            responsable: r.responsable
                ? {
                    id_usuario: r.responsable.idUsuario,
                    nombre: `${r.responsable.nombre} ${r.responsable.apellido}`.trim(),
                }
                : null,
        };
    }
    validarCamposContraCategoria(flags, data) {
        if (flags.maneja_serie && !data.numeroSerie?.trim()) {
            throw new common_1.BadRequestException('Esta categoría exige número de serie');
        }
        if (flags.tiene_responsable && data.idResponsable == null) {
            throw new common_1.BadRequestException('Esta categoría exige responsable');
        }
        if (flags.tiene_ubicacion && data.idUbicacion == null) {
            throw new common_1.BadRequestException('Esta categoría exige ubicación');
        }
    }
    async listarCategorias(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        await this.migracion.migrarSiNecesario(tenantId);
        const rows = await this.prisma.categoriaRecurso.findMany({
            where: { idRestaurante: tenantId },
            orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
        });
        return rows.map((c) => this.mapCategoria(c));
    }
    async crearCategoria(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        await this.migracion.asegurarCategoriasYUbicaciones(tenantId);
        const codigo = dto.codigo.trim().toLowerCase().replace(/\s+/g, '_');
        try {
            const c = await this.prisma.categoriaRecurso.create({
                data: {
                    idRestaurante: tenantId,
                    codigo,
                    nombre: dto.nombre.trim(),
                    descripcion: dto.descripcion?.trim() || null,
                    orden: dto.orden ?? 200,
                    controlaStock: dto.controla_stock ?? true,
                    seConsumeAuto: dto.se_consume_auto ?? false,
                    puedeVenderse: dto.puede_venderse ?? false,
                    requiereReceta: dto.requiere_receta ?? false,
                    controlaVencimiento: dto.controla_vencimiento ?? false,
                    controlaLote: dto.controla_lote ?? false,
                    manejaSerie: dto.maneja_serie ?? false,
                    requiereMantenimiento: dto.requiere_mantenimiento ?? false,
                    esActivoFijo: dto.es_activo_fijo ?? false,
                    permiteDepreciacion: dto.permite_depreciacion ?? false,
                    tieneResponsable: dto.tiene_responsable ?? false,
                    tieneUbicacion: dto.tiene_ubicacion ?? false,
                    permitePrestamo: dto.permite_prestamo ?? false,
                },
            });
            return this.mapCategoria(c);
        }
        catch {
            throw new common_1.BadRequestException('Código de categoría ya existe');
        }
    }
    async actualizarCategoria(id, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const existing = await this.prisma.categoriaRecurso.findFirst({
            where: { idCategoria: id, idRestaurante: tenantId },
        });
        if (!existing)
            throw new common_1.NotFoundException('Categoría no encontrada');
        const c = await this.prisma.categoriaRecurso.update({
            where: { idCategoria: id },
            data: {
                nombre: dto.nombre?.trim(),
                descripcion: dto.descripcion === undefined ? undefined : dto.descripcion?.trim() || null,
                activa: dto.activa,
                orden: dto.orden,
                controlaStock: dto.controla_stock,
                seConsumeAuto: dto.se_consume_auto,
                puedeVenderse: dto.puede_venderse,
                requiereReceta: dto.requiere_receta,
                controlaVencimiento: dto.controla_vencimiento,
                controlaLote: dto.controla_lote,
                manejaSerie: dto.maneja_serie,
                requiereMantenimiento: dto.requiere_mantenimiento,
                esActivoFijo: dto.es_activo_fijo,
                permiteDepreciacion: dto.permite_depreciacion,
                tieneResponsable: dto.tiene_responsable,
                tieneUbicacion: dto.tiene_ubicacion,
                permitePrestamo: dto.permite_prestamo,
            },
        });
        return this.mapCategoria(c);
    }
    async listarUbicaciones(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        await this.migracion.migrarSiNecesario(tenantId);
        const rows = await this.prisma.ubicacionRecurso.findMany({
            where: { idRestaurante: tenantId },
            orderBy: { nombre: 'asc' },
        });
        return rows.map((u) => ({
            id_ubicacion: u.idUbicacion,
            nombre: u.nombre,
            codigo: u.codigo,
            activa: u.activa,
        }));
    }
    async crearUbicacion(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        try {
            const u = await this.prisma.ubicacionRecurso.create({
                data: {
                    idRestaurante: tenantId,
                    nombre: dto.nombre.trim(),
                    codigo: dto.codigo?.trim() || null,
                },
            });
            return {
                id_ubicacion: u.idUbicacion,
                nombre: u.nombre,
                codigo: u.codigo,
                activa: u.activa,
            };
        }
        catch {
            throw new common_1.BadRequestException('Ya existe una ubicación con ese nombre');
        }
    }
    async actualizarUbicacion(id, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const existing = await this.prisma.ubicacionRecurso.findFirst({
            where: { idUbicacion: id, idRestaurante: tenantId },
        });
        if (!existing)
            throw new common_1.NotFoundException('Ubicación no encontrada');
        const u = await this.prisma.ubicacionRecurso.update({
            where: { idUbicacion: id },
            data: {
                nombre: dto.nombre?.trim(),
                codigo: dto.codigo === undefined ? undefined : dto.codigo?.trim() || null,
                activa: dto.activa,
            },
        });
        return {
            id_ubicacion: u.idUbicacion,
            nombre: u.nombre,
            codigo: u.codigo,
            activa: u.activa,
        };
    }
    async listarRecursos(tenantId = tenant_constants_1.DEFAULT_TENANT_ID, filtros) {
        await this.migracion.migrarSiNecesario(tenantId);
        const rows = await this.prisma.recurso.findMany({
            where: {
                idRestaurante: tenantId,
                ...(filtros?.id_categoria != null
                    ? { idCategoria: filtros.id_categoria }
                    : {}),
                ...(filtros?.id_ubicacion != null
                    ? { idUbicacion: filtros.id_ubicacion }
                    : {}),
                ...(filtros?.estado && (0, recurso_comportamiento_1.esEstadoRecurso)(filtros.estado)
                    ? { estado: filtros.estado }
                    : {}),
            },
            include: {
                categoria: true,
                ubicacion: true,
                responsable: { select: { idUsuario: true, nombre: true, apellido: true } },
            },
            orderBy: { nombre: 'asc' },
        });
        let mapped = rows.map((r) => this.mapRecurso(r));
        if (filtros?.bajo_minimo) {
            mapped = mapped.filter((r) => r.critico || r.estado === 'agotado');
        }
        return mapped;
    }
    async obtenerRecurso(id, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const r = await this.prisma.recurso.findFirst({
            where: { idRecurso: id, idRestaurante: tenantId },
            include: {
                categoria: true,
                ubicacion: true,
                responsable: { select: { idUsuario: true, nombre: true, apellido: true } },
            },
        });
        if (!r)
            throw new common_1.NotFoundException('Recurso no encontrado');
        return this.mapRecurso(r);
    }
    async crearRecurso(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID, idUsuario) {
        await this.migracion.asegurarCategoriasYUbicaciones(tenantId);
        const cat = await this.prisma.categoriaRecurso.findFirst({
            where: { idCategoria: dto.id_categoria, idRestaurante: tenantId },
        });
        if (!cat)
            throw new common_1.BadRequestException('Categoría no válida');
        const flags = (0, recurso_comportamiento_1.flagsDesdeCategoriaRow)(cat);
        this.validarCamposContraCategoria(flags, {
            numeroSerie: dto.numero_serie,
            idResponsable: dto.id_responsable,
            idUbicacion: dto.id_ubicacion,
        });
        const estado = dto.estado && (0, recurso_comportamiento_1.esEstadoRecurso)(dto.estado) ? dto.estado : 'activo';
        const stockInicial = dto.stock_inicial ?? 0;
        return this.prisma.$transaction(async (tx) => {
            let rec;
            try {
                rec = await tx.recurso.create({
                    data: {
                        idRestaurante: tenantId,
                        codigo: dto.codigo.trim(),
                        nombre: dto.nombre.trim(),
                        descripcion: dto.descripcion?.trim() || null,
                        idCategoria: dto.id_categoria,
                        unidad: dto.unidad.trim(),
                        costo: dto.costo ?? 0,
                        precio: dto.precio ?? null,
                        stock: 0,
                        stockMin: dto.stock_min ?? 0,
                        stockMax: dto.stock_max ?? null,
                        estado: stockInicial <= 0 && flags.controla_stock ? 'agotado' : estado,
                        idProveedor: dto.id_proveedor ?? null,
                        idUbicacion: dto.id_ubicacion ?? null,
                        idResponsable: dto.id_responsable ?? null,
                        codigoBarras: dto.codigo_barras?.trim() || null,
                        codigoQr: dto.codigo_qr?.trim() || null,
                        numeroSerie: dto.numero_serie?.trim() || null,
                        fechaCompra: dto.fecha_compra ? new Date(dto.fecha_compra) : null,
                        fechaVencimiento: dto.fecha_vencimiento
                            ? new Date(dto.fecha_vencimiento)
                            : null,
                        observaciones: dto.observaciones?.trim() || null,
                        idProducto: dto.id_producto ?? null,
                    },
                    include: {
                        categoria: true,
                        ubicacion: true,
                        responsable: {
                            select: { idUsuario: true, nombre: true, apellido: true },
                        },
                    },
                });
            }
            catch {
                throw new common_1.BadRequestException('Código de recurso ya existe');
            }
            if (stockInicial > 0 && flags.controla_stock) {
                await this.aplicarMovimientoTx(tx, rec.idRecurso, tenantId, {
                    tipo: 'compra',
                    cantidad: stockInicial,
                    costo_unitario: dto.costo,
                    observacion: 'Stock inicial',
                    modulo_origen: 'recursos',
                    id_documento: `stock-inicial:${rec.idRecurso}`,
                    id_usuario: idUsuario,
                });
                rec = await tx.recurso.findUniqueOrThrow({
                    where: { idRecurso: rec.idRecurso },
                    include: {
                        categoria: true,
                        ubicacion: true,
                        responsable: {
                            select: { idUsuario: true, nombre: true, apellido: true },
                        },
                    },
                });
            }
            if (rec.idProducto != null) {
                await (0, recurso_stock_producto_1.syncStockProductoDesdeRecursoTx)(tx, rec.idProducto, tenantId);
            }
            (0, deduccion_contexto_cache_1.invalidateDeduccionEstructuraCache)(tenantId);
            return this.mapRecurso(rec);
        });
    }
    async actualizarRecurso(id, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const existing = await this.prisma.recurso.findFirst({
            where: { idRecurso: id, idRestaurante: tenantId },
            include: { categoria: true },
        });
        if (!existing)
            throw new common_1.NotFoundException('Recurso no encontrado');
        const idCategoria = dto.id_categoria ?? existing.idCategoria;
        const cat = await this.prisma.categoriaRecurso.findFirst({
            where: { idCategoria, idRestaurante: tenantId },
        });
        if (!cat)
            throw new common_1.BadRequestException('Categoría no válida');
        const flags = (0, recurso_comportamiento_1.flagsDesdeCategoriaRow)(cat);
        this.validarCamposContraCategoria(flags, {
            numeroSerie: dto.numero_serie !== undefined
                ? dto.numero_serie
                : existing.numeroSerie,
            idResponsable: dto.id_responsable !== undefined
                ? dto.id_responsable
                : existing.idResponsable,
            idUbicacion: dto.id_ubicacion !== undefined
                ? dto.id_ubicacion
                : existing.idUbicacion,
        });
        if (dto.estado != null && !(0, recurso_comportamiento_1.esEstadoRecurso)(dto.estado)) {
            throw new common_1.BadRequestException('Estado no válido');
        }
        try {
            const r = await this.prisma.recurso.update({
                where: { idRecurso: id },
                data: {
                    codigo: dto.codigo?.trim(),
                    nombre: dto.nombre?.trim(),
                    descripcion: dto.descripcion === undefined
                        ? undefined
                        : dto.descripcion?.trim() || null,
                    idCategoria: dto.id_categoria,
                    unidad: dto.unidad?.trim(),
                    costo: dto.costo,
                    precio: dto.precio === undefined ? undefined : dto.precio,
                    stockMin: dto.stock_min,
                    stockMax: dto.stock_max === undefined ? undefined : dto.stock_max,
                    estado: dto.estado,
                    idProveedor: dto.id_proveedor === undefined ? undefined : dto.id_proveedor,
                    idUbicacion: dto.id_ubicacion === undefined ? undefined : dto.id_ubicacion,
                    idResponsable: dto.id_responsable === undefined ? undefined : dto.id_responsable,
                    codigoBarras: dto.codigo_barras === undefined
                        ? undefined
                        : dto.codigo_barras?.trim() || null,
                    codigoQr: dto.codigo_qr === undefined
                        ? undefined
                        : dto.codigo_qr?.trim() || null,
                    numeroSerie: dto.numero_serie === undefined
                        ? undefined
                        : dto.numero_serie?.trim() || null,
                    fechaCompra: dto.fecha_compra === undefined
                        ? undefined
                        : dto.fecha_compra
                            ? new Date(dto.fecha_compra)
                            : null,
                    fechaVencimiento: dto.fecha_vencimiento === undefined
                        ? undefined
                        : dto.fecha_vencimiento
                            ? new Date(dto.fecha_vencimiento)
                            : null,
                    observaciones: dto.observaciones === undefined
                        ? undefined
                        : dto.observaciones?.trim() || null,
                    idProducto: dto.id_producto === undefined ? undefined : dto.id_producto,
                },
                include: {
                    categoria: true,
                    ubicacion: true,
                    responsable: {
                        select: { idUsuario: true, nombre: true, apellido: true },
                    },
                },
            });
            if (r.idProducto != null) {
                await this.prisma.$transaction((tx) => (0, recurso_stock_producto_1.syncStockProductoDesdeRecursoTx)(tx, r.idProducto, tenantId));
            }
            (0, deduccion_contexto_cache_1.invalidateDeduccionEstructuraCache)(tenantId);
            return this.mapRecurso(r);
        }
        catch (e) {
            if (e instanceof common_1.BadRequestException)
                throw e;
            throw new common_1.BadRequestException('No se pudo actualizar el recurso');
        }
    }
    async aplicarMovimientoTx(tx, idRecurso, tenantId, input) {
        const rec = await tx.recurso.findFirst({
            where: { idRecurso, idRestaurante: tenantId },
            include: { categoria: true },
        });
        if (!rec)
            throw new common_1.NotFoundException('Recurso no encontrado');
        const flags = (0, recurso_comportamiento_1.flagsDesdeCategoriaRow)(rec.categoria);
        const valid = (0, recurso_movimientos_1.validarMovimientoContraFlags)(input.tipo, flags);
        if (!valid.ok)
            throw new common_1.BadRequestException(valid.motivo);
        if (input.id_documento && !input.omitir_idempotencia) {
            const n = await tx.movimientoRecurso.count({
                where: { idDocumento: input.id_documento },
            });
            if (n > 0)
                return { skipped: true };
        }
        const delta = (0, recurso_movimientos_1.deltaStockMovimientoRecurso)(input.tipo, input.cantidad);
        const actual = this.qty(rec.stock);
        let nuevo = actual;
        if (flags.controla_stock && input.tipo !== 'transferencia') {
            nuevo = (0, inventario_unidades_1.redondearInventario)(actual + delta);
        }
        const abs = Math.abs(input.cantidad);
        const costoUnit = input.costo_unitario ?? (rec.costo != null ? Number(rec.costo) : null);
        await tx.movimientoRecurso.create({
            data: {
                idRecurso,
                tipo: input.tipo,
                cantidad: abs,
                costoUnitario: costoUnit,
                costoTotal: costoUnit != null ? abs * costoUnit : null,
                observacion: input.observacion ?? null,
                moduloOrigen: input.modulo_origen ?? 'recursos',
                idDocumento: input.id_documento ?? null,
                idPedido: input.id_pedido ?? null,
                idDetallePedido: input.id_detalle_pedido ?? null,
                idUsuario: input.id_usuario ?? null,
                idUbicacionOrigen: input.id_ubicacion_origen ?? null,
                idUbicacionDestino: input.id_ubicacion_destino ?? null,
            },
        });
        if (flags.controla_stock && input.tipo !== 'transferencia') {
            const estado = (0, recurso_comportamiento_1.estadoTrasStock)(nuevo, this.qty(rec.stockMin), input.tipo === 'baja'
                ? 'baja'
                : input.tipo === 'mantenimiento'
                    ? 'mantenimiento'
                    : rec.estado);
            await tx.recurso.update({
                where: { idRecurso },
                data: {
                    stock: nuevo,
                    estado: input.tipo === 'baja' ? 'baja' : estado,
                    ...(input.tipo === 'compra' && costoUnit != null
                        ? { costo: costoUnit }
                        : {}),
                },
            });
            if (rec.idProducto != null) {
                await (0, recurso_stock_producto_1.syncStockProductoDesdeRecursoTx)(tx, rec.idProducto, tenantId);
            }
        }
        else if (input.tipo === 'baja' || input.tipo === 'mantenimiento') {
            await tx.recurso.update({
                where: { idRecurso },
                data: {
                    estado: input.tipo === 'baja' ? 'baja' : 'mantenimiento',
                },
            });
        }
        return { skipped: false, stock: nuevo };
    }
    async registrarMovimiento(id, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID, idUsuario) {
        let tipo;
        if ((0, recurso_movimientos_1.esTipoMovimientoRecurso)(dto.tipo)) {
            tipo = dto.tipo;
        }
        else {
            tipo = (0, recurso_movimientos_1.tipoMovimientoDesdeInventarioLegacy)(dto.tipo);
        }
        if (!Number.isFinite(dto.cantidad) || dto.cantidad === 0) {
            throw new common_1.BadRequestException('Cantidad no válida');
        }
        await this.prisma.$transaction(async (tx) => {
            await this.aplicarMovimientoTx(tx, id, tenantId, {
                tipo,
                cantidad: dto.cantidad,
                costo_unitario: dto.costo_unitario,
                observacion: dto.observacion,
                id_ubicacion_origen: dto.id_ubicacion_origen,
                id_ubicacion_destino: dto.id_ubicacion_destino,
                id_usuario: idUsuario,
                modulo_origen: 'recursos',
            });
        });
        return this.obtenerRecurso(id, tenantId);
    }
    async aplicarMovimientoDeduccionTx(tx, input) {
        return this.aplicarMovimientoTx(tx, input.id_recurso, input.tenant_id, {
            tipo: input.tipo,
            cantidad: input.cantidad,
            costo_unitario: input.costo_unitario,
            observacion: input.observacion,
            modulo_origen: input.modulo_origen,
            id_documento: input.id_documento,
            omitir_idempotencia: true,
            id_usuario: input.id_usuario,
            id_pedido: input.id_pedido,
            id_detalle_pedido: input.id_detalle_pedido,
        });
    }
    async listarMovimientos(tenantId = tenant_constants_1.DEFAULT_TENANT_ID, filtros) {
        await this.migracion.migrarSiNecesario(tenantId);
        const rows = await this.prisma.movimientoRecurso.findMany({
            where: {
                recurso: { idRestaurante: tenantId },
                ...(filtros?.id_recurso != null
                    ? { idRecurso: filtros.id_recurso }
                    : {}),
            },
            include: {
                recurso: { select: { idRecurso: true, nombre: true, codigo: true } },
                usuario: { select: { idUsuario: true, nombre: true, apellido: true } },
            },
            orderBy: { fecha: 'desc' },
            take: filtros?.limite ?? 100,
        });
        return rows.map((m) => ({
            id_movimiento: m.idMovimiento,
            id_recurso: m.idRecurso,
            recurso_nombre: m.recurso.nombre,
            recurso_codigo: m.recurso.codigo,
            tipo: m.tipo,
            cantidad: this.qty(m.cantidad),
            costo_unitario: m.costoUnitario != null ? Number(m.costoUnitario) : null,
            costo_total: m.costoTotal != null ? Number(m.costoTotal) : null,
            observacion: m.observacion,
            modulo_origen: m.moduloOrigen,
            id_documento: m.idDocumento,
            id_pedido: m.idPedido,
            fecha: m.fecha.toISOString(),
            usuario: m.usuario
                ? {
                    id_usuario: m.usuario.idUsuario,
                    nombre: `${m.usuario.nombre} ${m.usuario.apellido}`.trim(),
                }
                : null,
        }));
    }
    async registrarMantenimiento(id, dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID, idUsuario) {
        const rec = await this.prisma.recurso.findFirst({
            where: { idRecurso: id, idRestaurante: tenantId },
            include: { categoria: true },
        });
        if (!rec)
            throw new common_1.NotFoundException('Recurso no encontrado');
        if (!rec.categoria.requiereMantenimiento && !rec.categoria.esActivoFijo) {
            throw new common_1.BadRequestException('Esta categoría no registra mantenimiento');
        }
        const m = await this.prisma.$transaction(async (tx) => {
            const row = await tx.mantenimientoRecurso.create({
                data: {
                    idRecurso: id,
                    descripcion: dto.descripcion.trim(),
                    costo: dto.costo ?? null,
                    fecha: dto.fecha ? new Date(dto.fecha) : undefined,
                    idUsuario: idUsuario ?? null,
                },
            });
            await tx.recurso.update({
                where: { idRecurso: id },
                data: { estado: 'mantenimiento' },
            });
            await this.aplicarMovimientoTx(tx, id, tenantId, {
                tipo: 'mantenimiento',
                cantidad: 0,
                observacion: dto.descripcion.trim(),
                costo_unitario: dto.costo,
                id_usuario: idUsuario,
                modulo_origen: 'recursos',
                id_documento: `mant:${row.idMantenimiento}`,
            });
            return row;
        });
        return {
            id_mantenimiento: m.idMantenimiento,
            id_recurso: m.idRecurso,
            fecha: m.fecha.toISOString(),
            descripcion: m.descripcion,
            costo: m.costo != null ? Number(m.costo) : null,
        };
    }
    async listarMantenimientos(id, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const rec = await this.prisma.recurso.findFirst({
            where: { idRecurso: id, idRestaurante: tenantId },
        });
        if (!rec)
            throw new common_1.NotFoundException('Recurso no encontrado');
        const rows = await this.prisma.mantenimientoRecurso.findMany({
            where: { idRecurso: id },
            orderBy: { fecha: 'desc' },
            include: {
                usuario: { select: { idUsuario: true, nombre: true, apellido: true } },
            },
        });
        return rows.map((m) => ({
            id_mantenimiento: m.idMantenimiento,
            fecha: m.fecha.toISOString(),
            descripcion: m.descripcion,
            costo: m.costo != null ? Number(m.costo) : null,
            usuario: m.usuario
                ? {
                    id_usuario: m.usuario.idUsuario,
                    nombre: `${m.usuario.nombre} ${m.usuario.apellido}`.trim(),
                }
                : null,
        }));
    }
    async dashboard(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        await this.migracion.migrarSiNecesario(tenantId);
        const recursos = await this.prisma.recurso.findMany({
            where: { idRestaurante: tenantId },
            include: { categoria: true },
        });
        const mapped = recursos.map((r) => this.mapRecurso(r));
        const ahora = new Date();
        const en30 = new Date(ahora);
        en30.setDate(en30.getDate() + 30);
        const criticos = mapped.filter((r) => r.critico);
        const agotados = mapped.filter((r) => r.estado === 'agotado');
        const mantenimiento = mapped.filter((r) => r.estado === 'mantenimiento');
        const baja = mapped.filter((r) => r.estado === 'baja');
        const porVencer = mapped.filter((r) => {
            if (!r.fecha_vencimiento)
                return false;
            const d = new Date(r.fecha_vencimiento);
            return d >= ahora && d <= en30;
        });
        let valorStock = 0;
        let valorActivos = 0;
        for (const r of mapped) {
            const val = r.stock * r.costo;
            if (r.categoria?.es_activo_fijo)
                valorActivos += val;
            else if (r.categoria?.controla_stock)
                valorStock += val;
        }
        const recientes = await this.listarMovimientos(tenantId, { limite: 15 });
        return {
            totales: {
                recursos: mapped.length,
                criticos: criticos.length,
                agotados: agotados.length,
                mantenimiento: mantenimiento.length,
                baja: baja.length,
                por_vencer: porVencer.length,
                valor_stock: Math.round(valorStock * 100) / 100,
                valor_activos: Math.round(valorActivos * 100) / 100,
            },
            criticos: criticos.slice(0, 20),
            agotados: agotados.slice(0, 20),
            mantenimiento: mantenimiento.slice(0, 20),
            por_vencer: porVencer.slice(0, 20),
            movimientos_recientes: recientes,
        };
    }
    migrarDesdeInventario(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        return this.migracion.migrarDesdeInventario(tenantId);
    }
};
exports.RecursosService = RecursosService;
exports.RecursosService = RecursosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        recursos_migracion_service_1.RecursosMigracionService])
], RecursosService);
//# sourceMappingURL=recursos.service.js.map