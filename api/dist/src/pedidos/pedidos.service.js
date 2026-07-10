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
var PedidosService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PedidosService = void 0;
const common_1 = require("@nestjs/common");
const luxon_1 = require("luxon");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const pedidos_gateway_1 = require("./pedidos.gateway");
const permisos_service_1 = require("../permisos/permisos.service");
const factura_lineas_group_1 = require("./factura-lineas-group");
const comanda_lineas_group_1 = require("./comanda-lineas-group");
const mesa_label_1 = require("@drewrest/shared-domain/mesa-label");
const mesa_dia_1 = require("../common/mesa-dia");
const config_operativa_cache_1 = require("../common/config-operativa-cache");
const prisma_lock_1 = require("../common/prisma-lock");
const operative_limits_1 = require("../common/operative-limits");
const tenant_constants_1 = require("../tenant/tenant.constants");
const tenant_scope_1 = require("../tenant/tenant-scope");
const estado_pedido_transiciones_1 = require("./estado-pedido-transiciones");
const timezone_1 = require("../common/timezone");
const categoria_dia_1 = require("../common/categoria-dia");
const cocina_producto_1 = require("@drewrest/shared-domain/cocina-producto");
const resumen_diario_ventas_1 = require("@drewrest/shared-domain/resumen-diario-ventas");
const movimiento_caja_1 = require("@drewrest/shared-domain/movimiento-caja");
const transferencia_pedido_1 = require("@drewrest/shared-domain/transferencia-pedido");
const mazorca_pedido_1 = require("@drewrest/shared-domain/mazorca-pedido");
const cocina_vista_1 = require("@drewrest/shared-domain/cocina-vista");
const cocina_prioridad_1 = require("./cocina-prioridad");
const empaque_para_llevar_1 = require("./empaque-para-llevar");
const empaque_para_llevar_2 = require("@drewrest/shared-domain/empaque-para-llevar");
const comanda_printer_service_1 = require("./comanda-printer.service");
const factura_email_service_1 = require("./factura-email.service");
const stock_bebida_1 = require("../productos/stock-bebida");
const comanda_ticket_1 = require("./comanda-ticket");
const factura_mixto_1 = require("./factura-mixto");
const factura_vuelto_1 = require("@drewrest/shared-domain/factura-vuelto");
const descuentos_pedido_1 = require("./descuentos-pedido");
const promociones_pedido_1 = require("@drewrest/shared-domain/promociones-pedido");
const asignar_cobro_por_monto_1 = require("@drewrest/shared-domain/asignar-cobro-por-monto");
const cobro_invariantes_1 = require("@drewrest/shared-domain/cobro-invariantes");
const repartir_monto_cop_1 = require("@drewrest/shared-domain/repartir-monto-cop");
const consolidar_fragmentos_precio_1 = require("@drewrest/shared-domain/consolidar-fragmentos-precio");
const saldo_restante_1 = require("@drewrest/shared-domain/saldo-restante");
const cobro_parcial_1 = require("./cobro-parcial");
const pedidos_vista_operativa_1 = require("./pedidos-vista-operativa");
const mazorca_linea_pedido_1 = require("./mazorca-linea-pedido");
const cuota_pendiente_linea_pedido_1 = require("./cuota-pendiente-linea-pedido");
const cuota_pendiente_reparto_1 = require("@drewrest/shared-domain/cuota-pendiente-reparto");
const ABIERTOS = ['abierto', 'en_cocina'];
const detalleInclude = {
    producto: { include: { categoria: true } },
    personalizaciones: { include: { opcion: true } },
    subitems: { include: { subitem: true } },
};
const facturasInclude = {
    orderBy: { emitidaEn: 'asc' },
};
function detalleAplicaLlamadaMesero(d) {
    if (!d.enviadoCocina || d.listoCocina)
        return false;
    if ((0, cocina_producto_1.categoriaEsBebida)(d.producto.categoria))
        return false;
    return productoDebePasarCocina(d.producto);
}
function productoDebePasarCocina(p) {
    if (p.enviaCocina != null)
        return p.enviaCocina;
    return (0, cocina_producto_1.debeMarcarCocina)(p.categoria, p.esEmpacable);
}
function formatSubitemsDetalle(subitems) {
    return subitems.map((item) => `${item.subitem.nombre} x${item.cantidad}`);
}
function conteoLlamaMesero(detalles) {
    let platos = 0;
    let entradas = 0;
    for (const d of detalles) {
        if (!detalleAplicaLlamadaMesero(d))
            continue;
        if (d.producto.esAcompanamientoMazorca)
            entradas += d.cantidad;
        else
            platos += d.cantidad;
    }
    return { platos, entradas };
}
function tipoListoCocinaLlama(platos, entradas) {
    if (platos > 0 && entradas > 0)
        return 'mixto';
    if (entradas > 0)
        return 'entrada';
    return 'plato';
}
let PedidosService = class PedidosService {
    static { PedidosService_1 = this; }
    prisma;
    gateway;
    comandaPrinter;
    facturaEmail;
    permisos;
    logger = new common_1.Logger(PedidosService_1.name);
    configDescuentosCache = new Map();
    static CONFIG_CACHE_TTL_MS = 60_000;
    constructor(prisma, gateway, comandaPrinter, facturaEmail, permisos) {
        this.prisma = prisma;
        this.gateway = gateway;
        this.comandaPrinter = comandaPrinter;
        this.facturaEmail = facturaEmail;
        this.permisos = permisos;
    }
    async exigirPermisoMesero(actor, permiso, opts) {
        if (!actor)
            return;
        await this.permisos.assertPermiso(actor, permiso, opts);
    }
    emit(pedidoId, mesaId, idUsuario, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        this.gateway.emitPedidoActualizado(pedidoId, mesaId, idUsuario, tenantId);
    }
    async notificarCompaneroModificoPedido(pedido, idUsuarioActor, lineas, accion = 'agregado') {
        if (idUsuarioActor === pedido.idUsuario || lineas.length === 0) {
            return;
        }
        const tenantId = pedido.idRestaurante ?? tenant_constants_1.DEFAULT_TENANT_ID;
        const [actor, mesa] = await Promise.all([
            this.prisma.usuario.findUnique({ where: { idUsuario: idUsuarioActor } }),
            this.prisma.mesa.findFirst({
                where: { idMesa: pedido.idMesa, idRestaurante: tenantId },
            }),
        ]);
        if (!actor || !mesa)
            return;
        this.gateway.emitCompaneroAgregoItems({
            pedidoId: pedido.idPedido,
            mesaId: pedido.idMesa,
            mesaNumero: mesa.numero,
            idMeseroDueno: pedido.idUsuario,
            idMeseroQuienAgrego: idUsuarioActor,
            meseroQuienAgregoNombre: `${actor.nombre} ${actor.apellido}`.trim(),
            lineas,
            accion,
            at: new Date().toISOString(),
        }, tenantId);
    }
    emitirAlertaImpresora(impresion, contexto, pedidoId) {
        if (impresion.codigo_error !== 'sin_papel' &&
            impresion.codigo_error !== 'papel_bajo') {
            return;
        }
        this.gateway.emitImpresoraAlerta({
            codigo: impresion.codigo_error,
            mensaje: impresion.error ??
                (impresion.codigo_error === 'sin_papel'
                    ? 'Sin papel en la impresora POS'
                    : 'Papel bajo en la impresora POS'),
            destino: impresion.destino,
            contexto,
            pedidoId,
            at: new Date().toISOString(),
        });
    }
    encolarImpresion(job, contexto, pedidoId) {
        void job()
            .then((impresion) => {
            this.emitirAlertaImpresora(impresion, contexto, pedidoId);
        })
            .catch((err) => {
            const msg = err instanceof Error ? err.message : String(err);
            this.logger.error(`Error en cola de impresión (${contexto}${pedidoId != null ? ` pedido ${pedidoId}` : ''}): ${msg}`);
        });
        return { impreso: false, en_cola: true };
    }
    encolarImpresionComanda(comanda, idPedido) {
        return this.encolarImpresion(() => this.comandaPrinter.imprimirComanda(comanda), 'comanda', idPedido);
    }
    encolarImpresionFactura(ticket, idPedido, conCopia = false) {
        return this.encolarImpresion(async () => {
            const negocio = await this.comandaPrinter.imprimirFactura({
                ...ticket,
                copia_destinatario: conCopia ? 'negocio' : undefined,
            });
            if (!negocio.impreso) {
                return negocio;
            }
            if (!conCopia) {
                return negocio;
            }
            const cliente = await this.comandaPrinter.imprimirFactura({
                ...ticket,
                copia_destinatario: 'cliente',
            });
            if (!cliente.impreso) {
                return {
                    ...cliente,
                    error: cliente.error ??
                        'Copia cliente no impresa (la copia negocio sí salió)',
                };
            }
            return cliente;
        }, 'factura', idPedido);
    }
    estadoImpresora() {
        return this.comandaPrinter.consultarEstadoPapel();
    }
    async esMesaVirtualNumero(numero, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const row = await this.obtenerConfigOperativaRow(tenantId);
        const mv = (0, mesa_label_1.resolverMesasVirtuales)(row);
        return (numero === mv.numero_mesa_para_llevar ||
            numero === mv.numero_mesa_mostrador);
    }
    async sincronizarNumeroMesaVirtual(numeroAnterior, numeroNuevo) {
        if (numeroAnterior === numeroNuevo)
            return;
        const conflicto = await this.prisma.mesa.findFirst({
            where: { numero: numeroNuevo },
        });
        if (conflicto && conflicto.numero !== numeroAnterior) {
            throw new common_1.BadRequestException(`Ya existe una mesa con el número ${numeroNuevo}`);
        }
        const mesa = await this.prisma.mesa.findFirst({
            where: { numero: numeroAnterior },
        });
        if (mesa) {
            await this.prisma.mesa.update({
                where: { idMesa: mesa.idMesa },
                data: { numero: numeroNuevo },
            });
            return;
        }
        await this.prisma.mesa.create({
            data: {
                numero: numeroNuevo,
                capacidad: 1,
                estado: 'libre',
            },
        });
    }
    fechaCalendarioBogota(dt) {
        return new Date(Date.UTC(dt.year, dt.month - 1, dt.day));
    }
    parseFechaResumenBogota(fecha) {
        let base = luxon_1.DateTime.now().setZone('America/Bogota');
        if (fecha) {
            const parsed = luxon_1.DateTime.fromISO(fecha, { zone: 'America/Bogota' });
            if (!parsed.isValid) {
                throw new common_1.BadRequestException('fecha inválida, usa formato YYYY-MM-DD');
            }
            base = parsed;
        }
        return { base, fechaOnly: this.fechaCalendarioBogota(base) };
    }
    mapMovimientoCajaRow(r) {
        return {
            id_movimiento: r.idMovimientoCaja,
            tipo: r.tipo,
            monto: Math.round(Number(r.monto)),
            motivo: r.motivo,
            metodo_devolucion: r.metodoDevolucion,
            id_pedido: r.idPedido,
            id_factura: r.idFactura,
            mesa_numero: r.pedido?.mesa?.numero ?? null,
            registrado_por: `${r.usuario.nombre} ${r.usuario.apellido}`.trim(),
            creado_en: r.creadoEn.toISOString(),
        };
    }
    validarExcesoTransferenciaFactura(totalNeto, montoTransferencia, destino) {
        if (montoTransferencia == null)
            return 0;
        const total = Math.round(totalNeto);
        const tr = Math.round(montoTransferencia);
        if (tr < total) {
            throw new common_1.BadRequestException(`La transferencia debe cubrir al menos el total (${total} COP)`);
        }
        const exceso = tr - total;
        if (exceso > 0) {
            if (destino !== 'efectivo' &&
                destino !== 'transferencia' &&
                destino !== 'domicilio' &&
                destino !== 'mesero') {
                throw new common_1.BadRequestException('Indica si el exceso es devolución al cliente, pago domiciliario o propina al mesero');
            }
        }
        return exceso;
    }
    async crearMovimientoExcesoTransferenciaEnTx(tx, opts) {
        const fechaMov = this.fechaCalendarioBogota(luxon_1.DateTime.now().setZone('America/Bogota'));
        const esDomicilio = opts.destino === 'domicilio';
        const esMesero = opts.destino === 'mesero';
        const metodoDevolucion = opts.destino === 'efectivo'
            ? 'efectivo'
            : opts.destino === 'transferencia'
                ? 'transferencia'
                : null;
        let motivo = null;
        if (esDomicilio) {
            motivo = `Domicilio · pedido #${opts.idPedido}`;
        }
        else if (esMesero) {
            const ped = await tx.pedido.findUnique({
                where: { idPedido: opts.idPedido },
                include: {
                    usuario: { select: { nombre: true, apellido: true } },
                },
            });
            const nombreMesero = ped
                ? `${ped.usuario.nombre} ${ped.usuario.apellido}`.trim()
                : 'Mesero';
            motivo = `${nombreMesero} · pedido #${opts.idPedido}`;
        }
        await tx.movimientoCaja.create({
            data: {
                fecha: fechaMov,
                tipo: esMesero
                    ? 'pago_mesero'
                    : esDomicilio
                        ? 'pago_domicilio'
                        : 'devolucion_exceso_transferencia',
                monto: opts.montoExceso,
                motivo,
                metodoDevolucion,
                idPedido: opts.idPedido,
                idFactura: opts.idFactura,
                idUsuario: opts.idUsuario,
            },
        });
    }
    async getCajaDiaria(fecha, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        let base = luxon_1.DateTime.now().setZone('America/Bogota');
        if (fecha) {
            const parsed = luxon_1.DateTime.fromISO(fecha, { zone: 'America/Bogota' });
            if (!parsed.isValid) {
                throw new common_1.BadRequestException('fecha inválida, usa formato YYYY-MM-DD');
            }
            base = parsed;
        }
        const fechaOnly = this.fechaCalendarioBogota(base);
        const row = await this.prisma.cajaDiaria.findUnique({
            where: {
                idRestaurante_fecha: { idRestaurante: tenantId, fecha: fechaOnly },
            },
        });
        return {
            fecha: base.toFormat('yyyy-LL-dd'),
            monto_base_efectivo: row ? Number(row.montoBaseEfectivo) : 0,
            monto_base_cierre_efectivo: row?.montoBaseCierreEfectivo != null
                ? Number(row.montoBaseCierreEfectivo)
                : null,
        };
    }
    async upsertCajaDiaria(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const base = luxon_1.DateTime.fromISO(dto.fecha, { zone: 'America/Bogota' });
        if (!base.isValid) {
            throw new common_1.BadRequestException('fecha inválida, usa formato YYYY-MM-DD');
        }
        const fechaOnly = this.fechaCalendarioBogota(base);
        const row = await this.prisma.cajaDiaria.upsert({
            where: {
                idRestaurante_fecha: { idRestaurante: tenantId, fecha: fechaOnly },
            },
            create: {
                idRestaurante: tenantId,
                fecha: fechaOnly,
                montoBaseEfectivo: dto.monto_base_efectivo,
            },
            update: {
                montoBaseEfectivo: dto.monto_base_efectivo,
            },
        });
        const fechaStr = base.toFormat('yyyy-LL-dd');
        const monto = Number(row.montoBaseEfectivo);
        const impresion = await this.comandaPrinter.imprimirBaseCaja({
            fecha: fechaStr,
            monto_base_efectivo: monto,
            emitida_en: new Date().toISOString(),
        });
        this.emitirAlertaImpresora(impresion, 'cierre');
        return {
            fecha: fechaStr,
            monto_base_efectivo: monto,
            impresion_base: impresion,
        };
    }
    async upsertCajaDiariaCierre(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const base = luxon_1.DateTime.fromISO(dto.fecha, { zone: 'America/Bogota' });
        if (!base.isValid) {
            throw new common_1.BadRequestException('fecha inválida, usa formato YYYY-MM-DD');
        }
        const fechaOnly = this.fechaCalendarioBogota(base);
        const resumen = await this.resumenDiario(dto.fecha, undefined, tenantId);
        const row = await this.prisma.cajaDiaria.upsert({
            where: {
                idRestaurante_fecha: { idRestaurante: tenantId, fecha: fechaOnly },
            },
            create: {
                idRestaurante: tenantId,
                fecha: fechaOnly,
                montoBaseEfectivo: resumen.monto_base_efectivo,
                montoBaseCierreEfectivo: dto.monto_base_cierre_efectivo,
            },
            update: {
                montoBaseCierreEfectivo: dto.monto_base_cierre_efectivo,
            },
        });
        const fechaStr = base.toFormat('yyyy-LL-dd');
        const montoCierre = Number(row.montoBaseCierreEfectivo ?? 0);
        const impresion = await this.comandaPrinter.imprimirBaseCajaCierre({
            fecha: fechaStr,
            monto_base_cierre_efectivo: montoCierre,
            efectivo_esperado_en_caja: resumen.efectivo_esperado_en_caja,
            emitida_en: new Date().toISOString(),
        });
        this.emitirAlertaImpresora(impresion, 'cierre');
        return {
            fecha: fechaStr,
            monto_base_cierre_efectivo: montoCierre,
            efectivo_esperado_en_caja: resumen.efectivo_esperado_en_caja,
            impresion_cierre: impresion,
        };
    }
    async registrarMovimientoCajaManual(actor, dto) {
        if (actor.rol.nombre !== 'admin') {
            throw new common_1.ForbiddenException('Solo admin');
        }
        const { base, fechaOnly } = this.parseFechaResumenBogota(dto.fecha);
        const motivo = dto.motivo?.trim() || null;
        if (!motivo) {
            throw new common_1.BadRequestException('Indica el motivo del movimiento');
        }
        const row = await this.prisma.movimientoCaja.create({
            data: {
                fecha: fechaOnly,
                tipo: dto.tipo,
                monto: dto.monto,
                motivo,
                idUsuario: actor.idUsuario,
            },
            include: {
                usuario: { select: { nombre: true, apellido: true } },
            },
        });
        const fechaStr = base.toFormat('yyyy-LL-dd');
        const impresion = await this.comandaPrinter.imprimirMovimientoCaja(this.ticketMovimientoCajaDesdeRow(row, fechaStr));
        this.emitirAlertaImpresora(impresion, 'cierre');
        return {
            fecha: fechaStr,
            movimiento: this.mapMovimientoCajaRow({ ...row, pedido: null }),
            impresion_movimiento: impresion,
        };
    }
    async imprimirMovimientoCajaManual(actor, idMovimiento) {
        if (actor.rol.nombre !== 'admin') {
            throw new common_1.ForbiddenException('Solo admin');
        }
        const row = await this.prisma.movimientoCaja.findUnique({
            where: { idMovimientoCaja: idMovimiento },
            include: {
                usuario: { select: { nombre: true, apellido: true } },
            },
        });
        if (!row) {
            throw new common_1.NotFoundException('Movimiento no encontrado');
        }
        if (row.tipo !== 'entrada_manual' && row.tipo !== 'salida_manual') {
            throw new common_1.BadRequestException('Solo se pueden imprimir entradas o salidas manuales');
        }
        const fechaStr = luxon_1.DateTime.fromJSDate(row.fecha, {
            zone: 'America/Bogota',
        }).toFormat('yyyy-LL-dd');
        const impresion = await this.comandaPrinter.imprimirMovimientoCaja(this.ticketMovimientoCajaDesdeRow(row, fechaStr));
        this.emitirAlertaImpresora(impresion, 'cierre');
        return { ok: true, impresion_movimiento: impresion };
    }
    ticketMovimientoCajaDesdeRow(row, fecha) {
        return {
            id_movimiento: row.idMovimientoCaja,
            tipo: row.tipo,
            fecha,
            monto: Math.round(Number(row.monto)),
            motivo: row.motivo?.trim() || '-',
            registrado_por: `${row.usuario.nombre} ${row.usuario.apellido}`.trim(),
            creado_en: row.creadoEn.toISOString(),
            emitida_en: new Date().toISOString(),
        };
    }
    async eliminarMovimientoCaja(actor, idMovimiento) {
        if (actor.rol.nombre !== 'admin') {
            throw new common_1.ForbiddenException('Solo admin');
        }
        const row = await this.prisma.movimientoCaja.findUnique({
            where: { idMovimientoCaja: idMovimiento },
        });
        if (!row) {
            throw new common_1.NotFoundException('Movimiento no encontrado');
        }
        if (row.tipo !== 'entrada_manual' &&
            row.tipo !== 'salida_manual') {
            throw new common_1.ConflictException('Solo se pueden eliminar entradas o salidas manuales');
        }
        await this.prisma.movimientoCaja.delete({
            where: { idMovimientoCaja: idMovimiento },
        });
        return { ok: true, id_movimiento: idMovimiento };
    }
    mapConfigDescuentos(row) {
        const resolved = (0, descuentos_pedido_1.resolverConfigPromociones)({
            sopas_activo: row.sopasActivo,
            sopas_monto_por_unidad: Math.round(Number(row.sopasMontoPorUnidad)),
            sopas_min_unidades: Math.max(1, Math.round(row.sopasMinUnidades)),
            muleros_activo: row.mulerosActivo,
            muleros_monto_por_plato_principal: Math.round(Number(row.mulerosMontoPorUnidad)),
            muleros_min_platos_principales: Math.max(1, Math.round(row.mulerosMinPlatosPrincipales)),
            umbral_subtotal_otros: Math.round(Number(row.umbralSubtotalOtros)),
            reglas_promocion: (0, promociones_pedido_1.parseReglasPromocion)(row.reglasPromocion ?? []),
            etiquetas_pedido: (0, promociones_pedido_1.parseEtiquetasPedido)(row.etiquetasPedido ?? []),
        });
        return {
            reglas_promocion: resolved.reglas_promocion,
            etiquetas_pedido: resolved.etiquetas_pedido,
        };
    }
    async obtenerConfigDescuentosRow(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const now = Date.now();
        const cached = this.configDescuentosCache.get(tenantId);
        if (cached && cached.expiresAt > now) {
            return cached.row;
        }
        let row = await this.prisma.configDescuento.findUnique({
            where: { idRestaurante: tenantId },
        });
        if (!row) {
            row = await this.prisma.configDescuento.create({
                data: { idRestaurante: tenantId },
            });
        }
        this.configDescuentosCache.set(tenantId, {
            row,
            expiresAt: now + PedidosService_1.CONFIG_CACHE_TTL_MS,
        });
        return row;
    }
    invalidateConfigDescuentosCache(tenantId) {
        if (tenantId == null) {
            this.configDescuentosCache.clear();
            return;
        }
        this.configDescuentosCache.delete(tenantId);
    }
    async ensureConfigDescuentos(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        return this.obtenerConfigDescuentosRow(tenantId);
    }
    async getConfigDescuentos(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const row = await this.obtenerConfigDescuentosRow(tenantId);
        return this.mapConfigDescuentos(row);
    }
    async upsertConfigDescuentos(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const row = await this.prisma.configDescuento.update({
            where: { idRestaurante: tenantId },
            data: {
                ...(dto.reglas_promocion != null
                    ? {
                        reglasPromocion: (0, promociones_pedido_1.parseReglasPromocion)(dto.reglas_promocion),
                        sopasActivo: false,
                        mulerosActivo: false,
                    }
                    : {}),
                ...(dto.etiquetas_pedido != null
                    ? { etiquetasPedido: (0, promociones_pedido_1.parseEtiquetasPedido)(dto.etiquetas_pedido) }
                    : {}),
            },
        });
        this.invalidateConfigDescuentosCache(tenantId);
        return this.mapConfigDescuentos(row);
    }
    mapConfigOperativa(row) {
        return {
            precio_empaque_para_llevar: Math.round(Number(row.precioEmpaqueParaLlevar)),
            mazorca_activa: row.mazorcaActiva,
            prioridad_cocina_automatica: row.prioridadCocinaAutomatica,
            prioridad_cocina_modo: row.prioridadCocinaModo,
            id_producto_mazorca: row.idProductoMazorca,
            producto_mazorca_nombre: row.productoMazorca?.nombre ?? null,
            numero_mesa_para_llevar: row.numeroMesaParaLlevar,
            numero_mesa_mostrador: row.numeroMesaMostrador,
            etiqueta_para_llevar: row.etiquetaParaLlevar,
            etiqueta_mostrador: row.etiquetaMostrador,
            mostrador_activo: row.mostradorActivo,
            para_llevar_activo: row.paraLlevarActivo,
            beneficio_soda_almuerzo_activo: row.beneficioSodaAlmuerzoActivo,
            id_producto_soda_almuerzo: row.idProductoSodaAlmuerzo,
            producto_soda_nombre: row.productoSodaAlmuerzo?.nombre ?? null,
            soda_almuerzo_descontar_stock: row.sodaAlmuerzoDescontarStock,
        };
    }
    async obtenerConfigOperativaRow(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const cached = (0, config_operativa_cache_1.getCachedConfigOperativaRow)(tenantId);
        if (cached) {
            return cached;
        }
        const include = {
            productoMazorca: { select: { idProducto: true, nombre: true } },
            productoSodaAlmuerzo: { select: { idProducto: true, nombre: true } },
            productoCuotaPendiente: { select: { idProducto: true, nombre: true } },
        };
        let row = await this.prisma.configOperativa.findUnique({
            where: { idRestaurante: tenantId },
            include,
        });
        if (!row) {
            row = await this.prisma.configOperativa.create({
                data: { idRestaurante: tenantId },
                include,
            });
        }
        (0, config_operativa_cache_1.setCachedConfigOperativaRow)(tenantId, row);
        return row;
    }
    invalidateConfigOperativaCache(tenantId) {
        (0, config_operativa_cache_1.invalidateConfigOperativaCache)(tenantId);
    }
    async ctxOperativa(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const row = await this.obtenerConfigOperativaRow(tenantId);
        return {
            mazorcaActiva: row.mazorcaActiva,
            idProductoMazorca: row.idProductoMazorca,
            precioEmpaque: Math.round(Number(row.precioEmpaqueParaLlevar)),
            prioridadCocinaAutomatica: row.prioridadCocinaAutomatica,
            prioridadCocinaModo: row.prioridadCocinaModo,
        };
    }
    prioridadOptsFromOperativa(op) {
        return {
            prioridad_cocina_modo: op.prioridadCocinaModo,
            prioridad_cocina_automatica: op.prioridadCocinaAutomatica,
        };
    }
    prioridadPatchFromDto(dto) {
        if (dto.prioridad_cocina_modo != null) {
            return {
                prioridadCocinaModo: dto.prioridad_cocina_modo,
                prioridadCocinaAutomatica: dto.prioridad_cocina_modo === 'por_reglas',
            };
        }
        if (dto.prioridad_cocina_automatica != null) {
            return {
                prioridadCocinaAutomatica: dto.prioridad_cocina_automatica,
                prioridadCocinaModo: dto.prioridad_cocina_automatica
                    ? 'por_reglas'
                    : 'fifo',
            };
        }
        return {};
    }
    async getConfigOperativa(tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const row = await this.obtenerConfigOperativaRow(tenantId);
        return this.mapConfigOperativa(row);
    }
    async upsertConfigOperativa(dto, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        if (dto.id_producto_mazorca != null) {
            const prod = await this.prisma.producto.findUnique({
                where: { idProducto: dto.id_producto_mazorca },
            });
            if (!prod) {
                throw new common_1.BadRequestException('Producto de acompañamiento por comensal no encontrado');
            }
            await this.prisma.producto.updateMany({
                where: {
                    esAcompanamientoMazorca: true,
                    idProducto: { not: dto.id_producto_mazorca },
                },
                data: { esAcompanamientoMazorca: false },
            });
            await this.prisma.producto.update({
                where: { idProducto: dto.id_producto_mazorca },
                data: { esAcompanamientoMazorca: true },
            });
        }
        if (dto.id_producto_soda_almuerzo != null) {
            const prod = await this.prisma.producto.findUnique({
                where: { idProducto: dto.id_producto_soda_almuerzo },
            });
            if (!prod) {
                throw new common_1.BadRequestException('Producto de soda almuerzo no encontrado');
            }
        }
        const actual = await this.obtenerConfigOperativaRow(tenantId);
        const nuevoParaLlevar = dto.numero_mesa_para_llevar ?? actual.numeroMesaParaLlevar;
        const nuevoMostrador = dto.numero_mesa_mostrador ?? actual.numeroMesaMostrador;
        if (nuevoParaLlevar === nuevoMostrador) {
            throw new common_1.BadRequestException('Para llevar y mostrador deben usar números de mesa distintos');
        }
        if (dto.numero_mesa_para_llevar != null &&
            dto.numero_mesa_para_llevar !== actual.numeroMesaParaLlevar) {
            await this.sincronizarNumeroMesaVirtual(actual.numeroMesaParaLlevar, dto.numero_mesa_para_llevar);
        }
        if (dto.numero_mesa_mostrador != null &&
            dto.numero_mesa_mostrador !== actual.numeroMesaMostrador) {
            await this.sincronizarNumeroMesaVirtual(actual.numeroMesaMostrador, dto.numero_mesa_mostrador);
        }
        const row = await this.prisma.configOperativa.upsert({
            where: { idRestaurante: tenantId },
            create: {
                idRestaurante: tenantId,
                ...(dto.precio_empaque_para_llevar != null
                    ? {
                        precioEmpaqueParaLlevar: Math.round(dto.precio_empaque_para_llevar),
                    }
                    : {}),
                ...(dto.mazorca_activa != null
                    ? { mazorcaActiva: dto.mazorca_activa }
                    : {}),
                ...(dto.id_producto_mazorca !== undefined
                    ? { idProductoMazorca: dto.id_producto_mazorca }
                    : {}),
                ...(dto.numero_mesa_para_llevar != null
                    ? { numeroMesaParaLlevar: dto.numero_mesa_para_llevar }
                    : {}),
                ...(dto.numero_mesa_mostrador != null
                    ? { numeroMesaMostrador: dto.numero_mesa_mostrador }
                    : {}),
                ...(dto.etiqueta_para_llevar != null
                    ? { etiquetaParaLlevar: dto.etiqueta_para_llevar.trim() }
                    : {}),
                ...(dto.etiqueta_mostrador != null
                    ? { etiquetaMostrador: dto.etiqueta_mostrador.trim() }
                    : {}),
                ...(dto.mostrador_activo != null
                    ? { mostradorActivo: dto.mostrador_activo }
                    : {}),
                ...(dto.para_llevar_activo != null
                    ? { paraLlevarActivo: dto.para_llevar_activo }
                    : {}),
                ...(dto.beneficio_soda_almuerzo_activo != null
                    ? { beneficioSodaAlmuerzoActivo: dto.beneficio_soda_almuerzo_activo }
                    : {}),
                ...(dto.id_producto_soda_almuerzo !== undefined
                    ? { idProductoSodaAlmuerzo: dto.id_producto_soda_almuerzo }
                    : {}),
                ...(dto.soda_almuerzo_descontar_stock != null
                    ? {
                        sodaAlmuerzoDescontarStock: dto.soda_almuerzo_descontar_stock,
                    }
                    : {}),
                ...this.prioridadPatchFromDto(dto),
            },
            update: {
                ...(dto.precio_empaque_para_llevar != null
                    ? {
                        precioEmpaqueParaLlevar: Math.round(dto.precio_empaque_para_llevar),
                    }
                    : {}),
                ...(dto.mazorca_activa != null
                    ? { mazorcaActiva: dto.mazorca_activa }
                    : {}),
                ...(dto.id_producto_mazorca !== undefined
                    ? { idProductoMazorca: dto.id_producto_mazorca }
                    : {}),
                ...(dto.numero_mesa_para_llevar != null
                    ? { numeroMesaParaLlevar: dto.numero_mesa_para_llevar }
                    : {}),
                ...(dto.numero_mesa_mostrador != null
                    ? { numeroMesaMostrador: dto.numero_mesa_mostrador }
                    : {}),
                ...(dto.etiqueta_para_llevar != null
                    ? { etiquetaParaLlevar: dto.etiqueta_para_llevar.trim() }
                    : {}),
                ...(dto.etiqueta_mostrador != null
                    ? { etiquetaMostrador: dto.etiqueta_mostrador.trim() }
                    : {}),
                ...(dto.mostrador_activo != null
                    ? { mostradorActivo: dto.mostrador_activo }
                    : {}),
                ...(dto.para_llevar_activo != null
                    ? { paraLlevarActivo: dto.para_llevar_activo }
                    : {}),
                ...(dto.beneficio_soda_almuerzo_activo != null
                    ? { beneficioSodaAlmuerzoActivo: dto.beneficio_soda_almuerzo_activo }
                    : {}),
                ...(dto.id_producto_soda_almuerzo !== undefined
                    ? { idProductoSodaAlmuerzo: dto.id_producto_soda_almuerzo }
                    : {}),
                ...(dto.soda_almuerzo_descontar_stock != null
                    ? {
                        sodaAlmuerzoDescontarStock: dto.soda_almuerzo_descontar_stock,
                    }
                    : {}),
                ...this.prioridadPatchFromDto(dto),
            },
            include: {
                productoMazorca: { select: { idProducto: true, nombre: true } },
                productoSodaAlmuerzo: { select: { idProducto: true, nombre: true } },
                productoCuotaPendiente: { select: { idProducto: true, nombre: true } },
            },
        });
        (0, mazorca_linea_pedido_1.invalidateMazorcaProductIdCache)(tenantId);
        this.invalidateConfigOperativaCache(tenantId);
        this.gateway.emitConfigActualizada('menu');
        if (dto.numero_mesa_para_llevar != null ||
            dto.numero_mesa_mostrador != null ||
            dto.etiqueta_para_llevar != null ||
            dto.etiqueta_mostrador != null ||
            dto.mostrador_activo != null ||
            dto.para_llevar_activo != null) {
            this.gateway.emitConfigActualizada('mesas');
        }
        return this.mapConfigOperativa(row);
    }
    lineasParaDescuento(detalles) {
        return detalles.map((d) => ({
            cantidad: d.cantidad,
            subtotal_linea: Number(d.precioUnitario) * d.cantidad,
            nombre_producto: d.producto.nombre,
            categoria_nombre: d.producto.categoria.nombre,
            id_categoria: d.producto.categoria.idCategoria,
            es_plato_principal: d.producto.esPlatoPrincipal,
            participa_descuento_sopas: d.producto.categoria.participaDescuentoSopas,
        }));
    }
    etiquetasPromocionPedido(p) {
        const raw = Array.isArray(p.etiquetasPromocion) ? p.etiquetasPromocion : [];
        return raw.filter((x) => typeof x === 'string');
    }
    descuentosDesdeConfig(lineas, config, pedido) {
        return (0, descuentos_pedido_1.calcularDescuentosPedido)(lineas, config, {
            etiquetas_promocion: this.etiquetasPromocionPedido(pedido),
            cliente_mulero: pedido.clienteMulero,
        });
    }
    mapFacturaSerial(f) {
        return {
            id_factura: f.idFactura,
            subtotal: Number(f.subtotal),
            descuento_sopas: Number(f.descuentoSopas),
            descuento_muleros: Number(f.descuentoMuleros),
            descuento_promociones: Number(f.descuentoPromociones),
            total: Number(f.total),
            metodo_pago: f.metodoPago === 'tarjeta' ? 'transferencia' : f.metodoPago,
            emitida_en: f.emitidaEn,
            es_parcial: f.esParcial,
            persona_plan_indice: f.personaPlanIndice ?? null,
            plan_personas_sobre_total: f.planPersonasSobreTotal ?? false,
            plan_combinado_sobre_seleccion: f.planCombinadoSobreSeleccion ?? false,
            plan_seleccion_referencia: f.planSeleccionReferencia ?? null,
            cobro_mixto_grupo: f.cobroMixtoGrupo ?? null,
            detalle_exceso_cobro: (0, factura_vuelto_1.parseDetalleExcesoCobro)(f.detalleExcesoCobro) ?? null,
        };
    }
    seleccionReferenciaJsonFromDto(dto) {
        const ref = dto.detalles_seleccion_referencia;
        if (!ref?.length)
            return undefined;
        return ref.map((s) => ({
            id_detalle: s.id_detalle,
            cantidad: s.cantidad,
        }));
    }
    parseSeleccionReferenciaFactura(raw) {
        if (!Array.isArray(raw))
            return [];
        return raw
            .map((x) => {
            if (!x || typeof x !== 'object')
                return null;
            const row = x;
            const id = Number(row.id_detalle);
            const cantidad = Number(row.cantidad);
            if (!Number.isFinite(id) || !Number.isFinite(cantidad) || cantidad <= 0) {
                return null;
            }
            return { id_detalle: id, cantidad };
        })
            .filter((x) => x != null);
    }
    planFacturaDataFromDto(dto) {
        return {
            planPersonasSobreTotal: dto.plan_personas_sobre_total === true,
            planCombinadoSobreSeleccion: dto.plan_combinado_sobre_seleccion === true,
            planSeleccionReferencia: this.seleccionReferenciaJsonFromDto(dto),
        };
    }
    solicitudesPendientesEnPool(pedido, pool) {
        const serial = this.serialDetallesCobro(pedido.detalles);
        const poolOrigIds = new Set(pool.map((s) => s.id_detalle));
        const raw = [];
        for (const det of pedido.detalles) {
            if (det.idFactura != null || det.cantidad <= 0)
                continue;
            let enPool = poolOrigIds.has(det.idDetalle);
            if (!enPool) {
                const comb = this.parseCombinadoNota(det.notaCocina);
                enPool = comb != null && poolOrigIds.has(comb.origId);
            }
            if (!enPool)
                continue;
            raw.push({ id_detalle: det.idDetalle, cantidad: det.cantidad });
        }
        if (raw.length === 0)
            return [];
        return (0, cobro_parcial_1.ordenarSolicitudesCobro)(serial, (0, cobro_parcial_1.expandirSolicitudesConEmpaques)(serial, raw));
    }
    async aplicarCuotaPlanEnFacturacion(idPedido, dto, pedidoParaCobro, solicitudes, config) {
        const enPlanCuota = dto.persona_plan_indice != null &&
            dto.total_personas_plan != null &&
            dto.total_personas_plan >= 2 &&
            (dto.plan_personas_sobre_total === true ||
                dto.plan_combinado_sobre_seleccion === true);
        if (!enPlanCuota) {
            return { solicitudes, pedido: pedidoParaCobro };
        }
        const poolSeleccion = dto.plan_combinado_sobre_seleccion === true
            ? (dto.detalles_seleccion_referencia ?? solicitudes).map((s) => ({
                id_detalle: s.id_detalle,
                cantidad: s.cantidad,
            }))
            : undefined;
        let sol = [];
        await this.prisma.$transaction(async (tx) => {
            sol = await this.resolverCobroSobreSaldoRestanteEnTx(tx, idPedido, pedidoParaCobro, dto.persona_plan_indice, dto.total_personas_plan, dto.monto_persona_plan, config, pedidoParaCobro.idRestaurante, poolSeleccion);
        });
        const reloaded = await this.prisma.pedido.findUnique({
            where: { idPedido },
            include: {
                detalles: { include: detalleInclude, orderBy: { idDetalle: 'asc' } },
                facturas: facturasInclude,
            },
        });
        if (reloaded) {
            return { solicitudes: sol, pedido: reloaded };
        }
        return { solicitudes: sol, pedido: pedidoParaCobro };
    }
    findSaldoRestantePendiente(detalles) {
        return detalles.find((d) => d.idFactura == null &&
            (0, saldo_restante_1.esNotaSaldoRestantePendiente)(d.notaCocina) &&
            d.producto.esCuotaPendienteReparto);
    }
    async countSaldoRestantePendienteEnTx(tx, idPedido) {
        const rows = await tx.detallePedido.findMany({
            where: { idPedido, idFactura: null },
            select: { notaCocina: true },
        });
        return rows.filter((d) => (0, saldo_restante_1.esNotaSaldoRestantePendiente)(d.notaCocina)).length;
    }
    async liquidarYEvaluarPendienteEnTx(tx, idPedido, idFacturaCierre) {
        const sigueSaldo = await this.countSaldoRestantePendienteEnTx(tx, idPedido);
        const pendientes = await tx.detallePedido.findMany({
            where: { idPedido, idFactura: null },
            include: {
                producto: {
                    select: {
                        esCuotaPendienteReparto: true,
                        esAcompanamientoMazorca: true,
                    },
                },
            },
        });
        let hayCobroPendiente = sigueSaldo > 0;
        const idsGratuitos = [];
        for (const d of pendientes) {
            if ((0, saldo_restante_1.esNotaSaldoRestantePendiente)(d.notaCocina)) {
                hayCobroPendiente = true;
                continue;
            }
            if ((d.notaCocina ?? '').trim().startsWith(saldo_restante_1.SALDO_ABONO_NOTA)) {
                idsGratuitos.push(d.idDetalle);
                continue;
            }
            if (d.producto.esCuotaPendienteReparto) {
                idsGratuitos.push(d.idDetalle);
                continue;
            }
            if (d.producto.esAcompanamientoMazorca) {
                idsGratuitos.push(d.idDetalle);
                continue;
            }
            const monto = Math.round(Number(d.precioUnitario)) * d.cantidad;
            if (monto <= 0) {
                idsGratuitos.push(d.idDetalle);
                continue;
            }
            hayCobroPendiente = true;
        }
        if (!hayCobroPendiente && idsGratuitos.length > 0) {
            await tx.detallePedido.updateMany({
                where: { idDetalle: { in: idsGratuitos } },
                data: { idFactura: idFacturaCierre },
            });
        }
        return hayCobroPendiente;
    }
    mismoPoolSaldo(nota, pool) {
        const actual = (0, saldo_restante_1.parseSaldoRestantePool)(nota);
        if (pool == null || pool.length === 0) {
            return actual == null && !(0, saldo_restante_1.esNotaSaldoFragmentoHuerfano)(nota);
        }
        if (actual == null || actual.length !== pool.length)
            return false;
        const key = (p) => `${p.id_detalle}:${p.cantidad}`;
        const a = new Set(actual.map(key));
        return pool.every((p) => a.has(key(p)));
    }
    async asegurarSaldoRestanteEnTx(tx, idPedido, pedido, montoBase, tenantId, poolSeleccion, opts) {
        const monto = Math.round(montoBase);
        if (monto <= 0) {
            throw new common_1.BadRequestException('No hay saldo pendiente para este reparto');
        }
        const nota = (0, saldo_restante_1.formatSaldoRestanteNota)(poolSeleccion);
        const saldoExistente = this.findSaldoRestantePendiente(pedido.detalles);
        const opRow = await this.obtenerConfigOperativaRow(tenantId);
        const idProductoSaldo = await (0, cuota_pendiente_linea_pedido_1.idProductoCuotaPendienteReparto)(tx, opRow.idProductoCuotaPendiente, tenantId);
        if (saldoExistente) {
            const actual = Math.round(Number(saldoExistente.precioUnitario)) *
                saldoExistente.cantidad;
            const notaActual = saldoExistente.notaCocina ?? saldo_restante_1.SALDO_RESTANTE_NOTA;
            if (opts?.reemplazar) {
                await tx.detallePedido.update({
                    where: { idDetalle: saldoExistente.idDetalle },
                    data: { precioUnitario: monto, cantidad: 1, notaCocina: nota },
                });
                return { idDetalle: saldoExistente.idDetalle, monto, nota };
            }
            const necesitaNota = (0, saldo_restante_1.parseSaldoRestantePool)(notaActual) == null &&
                poolSeleccion != null &&
                poolSeleccion.length > 0;
            if (necesitaNota || actual !== monto) {
                await tx.detallePedido.update({
                    where: { idDetalle: saldoExistente.idDetalle },
                    data: {
                        precioUnitario: actual > 0 ? actual : monto,
                        cantidad: 1,
                        ...(necesitaNota ? { notaCocina: nota } : {}),
                    },
                });
            }
            return {
                idDetalle: saldoExistente.idDetalle,
                monto: actual > 0 ? actual : monto,
                nota: necesitaNota ? nota : notaActual,
            };
        }
        const creado = await tx.detallePedido.create({
            data: {
                idPedido,
                idProducto: idProductoSaldo,
                cantidad: 1,
                precioUnitario: monto,
                notaCocina: nota,
                enviadoCocina: false,
                listoCocina: false,
                listoParaRecoger: false,
            },
        });
        return { idDetalle: creado.idDetalle, monto, nota };
    }
    async resolverCobroSobreSaldoRestanteEnTx(tx, idPedido, pedido, personaPlanIndice, totalPersonasPlan, montoObjetivoNeto, config, tenantId, poolSeleccion) {
        const realesPendientes = pedido.detalles.filter((d) => d.idFactura == null &&
            d.idDetallePadre == null &&
            !d.producto.esCuotaPendienteReparto &&
            !(0, saldo_restante_1.esNotaSaldoRestantePendiente)(d.notaCocina));
        let baseSolicitudes;
        if (poolSeleccion != null && poolSeleccion.length > 0) {
            baseSolicitudes = this.solicitudesPendientesEnPool(pedido, poolSeleccion);
        }
        else {
            baseSolicitudes = realesPendientes.map((d) => ({
                id_detalle: d.idDetalle,
                cantidad: d.cantidad,
            }));
        }
        const totalBase = baseSolicitudes.length > 0
            ? Number(this.calcularImportesFactura(pedido, baseSolicitudes, config).total)
            : 0;
        const saldoExistente = this.findSaldoRestantePendiente(pedido.detalles);
        const saldoActual = saldoExistente
            ? Math.round(Number(saldoExistente.precioUnitario)) * saldoExistente.cantidad
            : 0;
        const poolRef = poolSeleccion != null && poolSeleccion.length > 0
            ? poolSeleccion.map((s) => ({
                id_detalle: s.id_detalle,
                cantidad: s.cantidad,
            }))
            : null;
        const poolSoloSaldoExistente = saldoExistente != null &&
            poolRef != null &&
            poolRef.length > 0 &&
            poolRef.every((p) => p.id_detalle === saldoExistente.idDetalle);
        const saldoDelMismoReparto = saldoExistente != null &&
            poolRef != null &&
            !poolSoloSaldoExistente &&
            this.mismoPoolSaldo(saldoExistente.notaCocina, poolRef);
        let disponible;
        let baseApertura;
        let reemplazarSaldo = false;
        if (poolRef != null && poolRef.length > 0 && !poolSoloSaldoExistente) {
            if (saldoDelMismoReparto && saldoActual > 0) {
                disponible = saldoActual;
                baseApertura = saldoActual;
            }
            else {
                disponible = totalBase;
                baseApertura = totalBase;
                reemplazarSaldo = saldoExistente != null;
            }
        }
        else if (saldoActual > 0) {
            disponible = saldoActual;
            baseApertura = saldoActual;
        }
        else {
            disponible = totalBase;
            baseApertura = totalBase;
        }
        if (disponible <= 0 || baseApertura <= 0) {
            throw new common_1.BadRequestException('No hay saldo pendiente para este reparto');
        }
        const personasRestantes = Math.max(1, totalPersonasPlan - personaPlanIndice + 1);
        const cuotaCongelada = montoObjetivoNeto != null && montoObjetivoNeto > 0
            ? Math.round(montoObjetivoNeto)
            : (0, repartir_monto_cop_1.repartirMontoEnCop)(disponible, personasRestantes)[0] ?? 0;
        const objetivo = Math.min(disponible, cuotaCongelada);
        if (objetivo <= 0) {
            throw new common_1.BadRequestException('Cuota de persona inválida');
        }
        const poolParaNota = poolRef ??
            (saldoExistente
                ? (0, saldo_restante_1.parseSaldoRestantePool)(saldoExistente.notaCocina)
                : null);
        const saldo = await this.asegurarSaldoRestanteEnTx(tx, idPedido, pedido, baseApertura, tenantId, poolParaNota, { reemplazar: reemplazarSaldo });
        const opRow = await this.obtenerConfigOperativaRow(tenantId);
        const idProductoSaldo = await (0, cuota_pendiente_linea_pedido_1.idProductoCuotaPendienteReparto)(tx, opRow.idProductoCuotaPendiente, tenantId);
        const queda = saldo.monto - objetivo;
        const abono = await tx.detallePedido.create({
            data: {
                idPedido,
                idProducto: idProductoSaldo,
                cantidad: 1,
                precioUnitario: objetivo,
                notaCocina: saldo_restante_1.SALDO_ABONO_NOTA,
                enviadoCocina: false,
                listoCocina: false,
                listoParaRecoger: false,
            },
        });
        if (queda <= 0) {
            await tx.detallePedido.delete({ where: { idDetalle: saldo.idDetalle } });
        }
        else {
            await tx.detallePedido.update({
                where: { idDetalle: saldo.idDetalle },
                data: { precioUnitario: queda, cantidad: 1, notaCocina: saldo.nota },
            });
        }
        return [{ id_detalle: abono.idDetalle, cantidad: 1 }];
    }
    async marcarPlatosRealesCobradosSiSaldoLiquidadoEnTx(tx, idPedido, idFactura, opts) {
        const sigueSaldo = await this.countSaldoRestantePendienteEnTx(tx, idPedido);
        if (sigueSaldo > 0)
            return;
        const pedido = await tx.pedido.findUnique({
            where: { idPedido },
            include: {
                detalles: { include: detalleInclude, orderBy: { idDetalle: 'asc' } },
            },
        });
        if (!pedido)
            return;
        const cargoSaldoEnFactura = pedido.detalles.some((d) => d.idFactura === idFactura &&
            ((0, saldo_restante_1.esNotaSaldoRestantePendiente)(d.notaCocina) ||
                (d.notaCocina ?? '').trim().startsWith(saldo_restante_1.SALDO_ABONO_NOTA)));
        const planSaldo = opts?.sobreTotal === true ||
            (opts?.pool != null && opts.pool.length > 0) ||
            opts?.notaSaldo != null;
        if (!cargoSaldoEnFactura && !planSaldo) {
            return;
        }
        const saldoEnFactura = pedido.detalles.find((d) => d.idFactura === idFactura &&
            (0, saldo_restante_1.esNotaSaldoRestantePendiente)(d.notaCocina));
        if (saldoEnFactura &&
            (0, saldo_restante_1.esNotaSaldoFragmentoHuerfano)(saldoEnFactura.notaCocina)) {
            return;
        }
        let pool = opts?.pool ??
            (opts?.notaSaldo ? (0, saldo_restante_1.parseSaldoRestantePool)(opts.notaSaldo) : null);
        let sobreTotal = opts?.sobreTotal === true;
        if (pool == null && !sobreTotal && saldoEnFactura) {
            pool = (0, saldo_restante_1.parseSaldoRestantePool)(saldoEnFactura.notaCocina);
            if (pool == null)
                sobreTotal = true;
        }
        if (pool == null && !sobreTotal) {
            const factura = await tx.factura.findUnique({
                where: { idFactura },
                select: {
                    planCombinadoSobreSeleccion: true,
                    planPersonasSobreTotal: true,
                    planSeleccionReferencia: true,
                },
            });
            if (factura?.planCombinadoSobreSeleccion) {
                pool = this.parseSeleccionReferenciaFactura(factura.planSeleccionReferencia);
            }
            else if (factura?.planPersonasSobreTotal) {
                sobreTotal = true;
                pool = null;
            }
        }
        if (!sobreTotal && (pool == null || pool.length === 0) && !cargoSaldoEnFactura) {
            return;
        }
        if (pool != null && pool.length > 0) {
            const solicitudes = this.solicitudesPendientesEnPool(pedido, pool);
            const porId = new Map(pedido.detalles.map((d) => [d.idDetalle, d]));
            for (const s of solicitudes) {
                const det = porId.get(s.id_detalle);
                if (!det || det.idFactura != null)
                    continue;
                await this.aplicarCobroDetalleEnTx(tx, det, s.cantidad, idFactura);
            }
            return;
        }
        if (!sobreTotal && !cargoSaldoEnFactura) {
            return;
        }
        for (const det of pedido.detalles) {
            if (det.idFactura != null)
                continue;
            if (det.producto.esCuotaPendienteReparto)
                continue;
            if ((0, saldo_restante_1.esNotaSaldoRestantePendiente)(det.notaCocina))
                continue;
            await tx.detallePedido.update({
                where: { idDetalle: det.idDetalle },
                data: { idFactura },
            });
        }
    }
    async resumenDiario(fecha, opts, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const incluirLineas = opts?.incluirLineas === true;
        let base = luxon_1.DateTime.now().setZone('America/Bogota');
        if (fecha) {
            const parsed = luxon_1.DateTime.fromISO(fecha, { zone: 'America/Bogota' });
            if (!parsed.isValid) {
                throw new common_1.BadRequestException('fecha inválida, usa formato YYYY-MM-DD');
            }
            base = parsed;
        }
        const start = base.startOf('day').toJSDate();
        const end = base.endOf('day').plus({ millisecond: 1 }).toJSDate();
        const facturas = await this.prisma.factura.findMany({
            where: {
                emitidaEn: { gte: start, lt: end },
                pedido: { idRestaurante: tenantId },
            },
            include: incluirLineas
                ? {
                    usuario: { select: { nombre: true, apellido: true } },
                    pedido: {
                        include: {
                            mesa: { select: { numero: true } },
                            detalles: {
                                select: {
                                    idDetalle: true,
                                    idProducto: true,
                                    idDetallePadre: true,
                                    idFactura: true,
                                    cantidad: true,
                                    precioUnitario: true,
                                    notaCocina: true,
                                    producto: {
                                        select: {
                                            nombre: true,
                                            esPlatoPrincipal: true,
                                            esEmpacable: true,
                                            enviaCocina: true,
                                            esAcompanamientoMazorca: true,
                                            categoria: {
                                                select: {
                                                    nombre: true,
                                                    esBebida: true,
                                                    esLineaEmpaque: true,
                                                },
                                            },
                                        },
                                    },
                                    personalizaciones: {
                                        include: {
                                            opcion: {
                                                select: { idOpcion: true, descripcion: true },
                                            },
                                        },
                                    },
                                },
                                orderBy: { idDetalle: 'asc' },
                            },
                        },
                    },
                }
                : {
                    usuario: { select: { nombre: true, apellido: true } },
                    pedido: {
                        include: {
                            mesa: { select: { numero: true } },
                        },
                    },
                },
            orderBy: { emitidaEn: 'asc' },
        });
        const fechaOnly = this.fechaCalendarioBogota(base);
        const cajaRow = await this.prisma.cajaDiaria.findUnique({
            where: {
                idRestaurante_fecha: { idRestaurante: tenantId, fecha: fechaOnly },
            },
        });
        const montoBaseEfectivo = cajaRow ? Number(cajaRow.montoBaseEfectivo) : 0;
        const montoBaseCierreEfectivo = cajaRow?.montoBaseCierreEfectivo != null
            ? Number(cajaRow.montoBaseCierreEfectivo)
            : null;
        const totalesPorMetodo = {
            efectivo: 0,
            transferencia: 0,
            fiado: 0,
        };
        const byMesa = new Map();
        let totalFacturado = 0;
        for (const f of facturas) {
            const t = Number(f.total);
            totalFacturado += t;
            if (f.metodoPago === 'efectivo')
                totalesPorMetodo.efectivo += t;
            else if (f.metodoPago === 'transferencia' ||
                f.metodoPago === 'tarjeta') {
                totalesPorMetodo.transferencia += t;
            }
            else if (f.metodoPago === 'fiado') {
                totalesPorMetodo.fiado += t;
            }
            const numero = f.pedido.mesa.numero;
            const prev = byMesa.get(numero) ?? { pedidos: 0, total: 0 };
            prev.pedidos += 1;
            prev.total += t;
            byMesa.set(numero, prev);
        }
        const mesas = Array.from(byMesa.entries())
            .map(([mesa_numero, val]) => ({
            mesa_numero,
            pedidos_atendidos: val.pedidos,
            cobros_atendidos: val.pedidos,
            total_facturado: val.total,
        }))
            .sort((a, b) => a.mesa_numero - b.mesa_numero);
        const pedidosDetalle = facturas.map((f) => {
            const header = {
                id_factura: f.idFactura,
                id_pedido: f.pedido.idPedido,
                mesa_numero: f.pedido.mesa.numero,
                pedido_estado: f.pedido.estado,
                mesero: `${f.usuario.nombre} ${f.usuario.apellido}`.trim(),
                subtotal: Number(f.subtotal),
                descuento_sopas: Number(f.descuentoSopas),
                descuento_muleros: Number(f.descuentoMuleros),
                descuento_promociones: Number(f.descuentoPromociones),
                total: Number(f.total),
                metodo_pago: f.metodoPago,
                emitida_en: f.emitidaEn.toISOString(),
                es_parcial: f.esParcial,
                cobro_mixto_grupo: f.cobroMixtoGrupo ?? null,
                persona_plan_indice: f.personaPlanIndice ?? null,
            };
            if (!incluirLineas) {
                return { ...header, detalles: [] };
            }
            const pedidoConLineas = f.pedido;
            return {
                ...header,
                detalles: (0, factura_lineas_group_1.lineasFacturaParaTicket)(pedidoConLineas.detalles
                    .filter((d) => d.idFactura === f.idFactura)
                    .map((d) => this.lineaFacturaDesdePrismaResumen(d))),
            };
        });
        const detallesFacturados = await this.prisma.detallePedido.findMany({
            where: {
                idFactura: { not: null },
                factura: { emitidaEn: { gte: start, lt: end } },
                producto: { esAcompanamientoMazorca: false, esCuotaPendienteReparto: false },
            },
            select: {
                cantidad: true,
                precioUnitario: true,
                producto: {
                    select: {
                        idProducto: true,
                        nombre: true,
                        esPlatoPrincipal: true,
                        categoria: { select: { nombre: true } },
                    },
                },
            },
        });
        const ventas = (0, resumen_diario_ventas_1.agregarVentasResumenDiario)(detallesFacturados.map((d) => {
            const pu = Number(d.precioUnitario);
            return {
                id_producto: d.producto.idProducto,
                nombre_producto: d.producto.nombre,
                categoria_nombre: d.producto.categoria.nombre,
                es_plato_principal: d.producto.esPlatoPrincipal,
                cantidad: d.cantidad,
                subtotal_linea: pu * d.cantidad,
            };
        }));
        const subtotal_ventas_bruto = ventas.items_menu.reduce((s, i) => s + i.subtotal, 0);
        const total_descuentos_dia = facturas.reduce((s, f) => s +
            Number(f.descuentoSopas) +
            Number(f.descuentoMuleros) +
            Number(f.descuentoPromociones), 0);
        const pagosMeseroRows = await this.prisma.registroBeneficioMesero.findMany({
            where: {
                fecha: fechaOnly,
                tipo: 'pago_turno',
                monto: { not: null },
            },
            include: {
                mesero: { select: { nombre: true, apellido: true } },
            },
            orderBy: { idRegistro: 'asc' },
        });
        const pagos_meseros = pagosMeseroRows.map((r) => ({
            id_registro: r.idRegistro,
            id_usuario: r.idUsuario,
            mesero: `${r.mesero.nombre} ${r.mesero.apellido}`.trim(),
            monto: Math.round(Number(r.monto ?? 0)),
        }));
        const total_pagos_meseros = pagos_meseros.reduce((s, p) => s + p.monto, 0);
        const devolucionesRows = await this.prisma.movimientoCaja.findMany({
            where: { fecha: fechaOnly },
            include: {
                usuario: { select: { nombre: true, apellido: true } },
                pedido: { include: { mesa: { select: { numero: true } } } },
            },
            orderBy: { creadoEn: 'asc' },
        });
        const movimientos_caja = devolucionesRows.map((r) => this.mapMovimientoCajaRow(r));
        const cuadre = (0, movimiento_caja_1.calcularEfectivoEsperadoEnCaja)({
            monto_base_efectivo: montoBaseEfectivo,
            ventas_efectivo: totalesPorMetodo.efectivo,
            total_pagos_meseros,
            movimientos: movimientos_caja.map((m) => ({
                tipo: m.tipo,
                monto: m.monto,
                metodo_devolucion: m.metodo_devolucion,
            })),
        });
        const devoluciones_exceso_transferencia = movimientos_caja.filter((m) => m.tipo === 'devolucion_exceso_transferencia');
        const fiadosRows = await this.prisma.cuentaCredito.findMany({
            where: {
                factura: { emitidaEn: { gte: start, lt: end } },
            },
            include: {
                pedido: { include: { mesa: { select: { numero: true } } } },
                factura: { select: { emitidaEn: true, total: true, idFactura: true } },
            },
            orderBy: [{ creadoEn: 'asc' }],
        });
        const fiados_dia = fiadosRows.map((c) => ({
            id_credito: c.idCredito,
            nombre_cliente: c.nombreCliente,
            telefono: c.telefono,
            monto_total: Math.round(Number(c.montoTotal)),
            saldo_pendiente: Math.round(Number(c.saldoPendiente)),
            estado: c.estado,
            id_pedido: c.idPedido,
            id_factura: c.idFactura,
            mesa_numero: c.pedido?.mesa?.numero ?? null,
            emitida_en: c.factura?.emitidaEn.toISOString() ?? c.creadoEn.toISOString(),
        }));
        return {
            fecha: base.toFormat('yyyy-LL-dd'),
            total_facturado: totalFacturado,
            total_facturas: facturas.length,
            total_mesas_atendidas: mesas.length,
            mesas,
            pedidos_detalle: pedidosDetalle,
            monto_base_efectivo: montoBaseEfectivo,
            monto_base_cierre_efectivo: montoBaseCierreEfectivo,
            totales_por_metodo: totalesPorMetodo,
            fiados_dia,
            total_fiados_dia: totalesPorMetodo.fiado,
            total_pagos_meseros,
            pagos_meseros,
            movimientos_caja,
            devoluciones_exceso_transferencia,
            total_entradas_manual: cuadre.total_entradas_manual,
            total_salidas_manual: cuadre.total_salidas_manual,
            total_devoluciones_efectivo: cuadre.total_devoluciones_efectivo,
            total_pagos_domicilio: cuadre.total_pagos_domicilio,
            total_pagos_mesero_exceso: cuadre.total_pagos_mesero_exceso,
            subtotal_entradas_caja: cuadre.subtotal_entradas_caja,
            subtotal_salidas_caja: cuadre.subtotal_salidas_caja,
            efectivo_esperado_en_caja: cuadre.efectivo_esperado_en_caja,
            platos_por_categoria: ventas.platos_por_categoria,
            items_menu: ventas.items_menu,
            subtotal_ventas_bruto,
            total_descuentos_dia,
            pedidos_reabiertos_pendientes: await this.contarPedidosReabiertosPendientes(fecha),
        };
    }
    async idsPedidosReabiertosPendientes(_fecha) {
        const rows = await this.prisma.pedido.findMany({
            where: {
                estado: { in: ['abierto', 'en_cocina'] },
                facturas: { none: {} },
                detalles: { some: {} },
                historial: {
                    some: {
                        tipo: 'cobro_reabierto',
                    },
                },
            },
            select: { idPedido: true },
            orderBy: { idPedido: 'asc' },
            take: operative_limits_1.OPERATIVE_PEDIDOS_MAX,
        });
        return rows.map((r) => r.idPedido);
    }
    async contarPedidosReabiertosPendientes(fecha) {
        const ids = await this.idsPedidosReabiertosPendientes(fecha);
        return ids.length;
    }
    async cancelarPedidosReabiertos(actor, dto, fecha) {
        if (actor.rol.nombre !== 'admin') {
            throw new common_1.ForbiddenException('Solo admin');
        }
        if (dto.confirmar.trim().toUpperCase() !== 'CANCELAR') {
            throw new common_1.BadRequestException('Escribe confirmar: "CANCELAR" para eliminar pedidos reabiertos');
        }
        const ids = await this.idsPedidosReabiertosPendientes(fecha);
        if (ids.length === 0) {
            return {
                fecha: fecha ?? luxon_1.DateTime.now().setZone('America/Bogota').toFormat('yyyy-LL-dd'),
                pedidos_cancelados: 0,
                mesas_liberadas: 0,
            };
        }
        const mesasLiberadas = new Set();
        let cancelados = 0;
        for (const idPedido of ids) {
            const pedido = await this.prisma.pedido.findUnique({
                where: { idPedido },
                include: {
                    facturas: { select: { idFactura: true } },
                    detalles: {
                        include: { producto: { include: { categoria: true } } },
                    },
                },
            });
            if (!pedido ||
                pedido.facturas.length > 0 ||
                !['abierto', 'en_cocina'].includes(pedido.estado)) {
                continue;
            }
            const idMesaPedido = pedido.idMesa;
            await this.prisma.$transaction(async (tx) => {
                for (const d of pedido.detalles) {
                    await (0, stock_bebida_1.reintegrarStockBebidaTx)(tx, d.producto, d.cantidad);
                }
                await tx.pedidoHistorial.deleteMany({ where: { idPedido } });
                await tx.pedido.delete({ where: { idPedido } });
                const abiertosRest = await tx.pedido.count({
                    where: { idMesa: idMesaPedido, estado: { in: ABIERTOS } },
                });
                if (abiertosRest === 0) {
                    await tx.mesa.update({
                        where: { idMesa: idMesaPedido },
                        data: { estado: 'libre' },
                    });
                    mesasLiberadas.add(idMesaPedido);
                }
            });
            this.emit(idPedido, idMesaPedido, pedido.idUsuario, pedido.idRestaurante);
            cancelados += 1;
        }
        if (cancelados > 0) {
            this.gateway.emitConfigActualizada('mesas');
        }
        let fechaLabel = luxon_1.DateTime.now().setZone('America/Bogota').toFormat('yyyy-LL-dd');
        if (fecha) {
            const parsed = luxon_1.DateTime.fromISO(fecha, { zone: 'America/Bogota' });
            if (parsed.isValid)
                fechaLabel = parsed.toFormat('yyyy-LL-dd');
        }
        return {
            fecha: fechaLabel,
            pedidos_cancelados: cancelados,
            mesas_liberadas: mesasLiberadas.size,
        };
    }
    async vaciarResumenDiario(actor, dto, fecha) {
        if (actor.rol.nombre !== 'admin') {
            throw new common_1.ForbiddenException('Solo admin');
        }
        if (dto.confirmar.trim().toUpperCase() !== 'VACIAR') {
            throw new common_1.BadRequestException('Escribe confirmar: "VACIAR" para vaciar el resumen del día');
        }
        let base = luxon_1.DateTime.now().setZone('America/Bogota');
        if (fecha) {
            const parsed = luxon_1.DateTime.fromISO(fecha, { zone: 'America/Bogota' });
            if (!parsed.isValid) {
                throw new common_1.BadRequestException('fecha inválida, usa formato YYYY-MM-DD');
            }
            base = parsed;
        }
        const start = base.startOf('day').toJSDate();
        const end = base.endOf('day').plus({ millisecond: 1 }).toJSDate();
        const fechaOnly = this.fechaCalendarioBogota(base);
        const tenantId = actor.idRestaurante ?? tenant_constants_1.DEFAULT_TENANT_ID;
        const facturas = await this.prisma.factura.findMany({
            where: {
                emitidaEn: { gte: start, lt: end },
                pedido: { idRestaurante: tenantId },
            },
            select: { idFactura: true, idPedido: true },
        });
        if (facturas.length === 0) {
            await this.prisma.cajaDiaria.deleteMany({
                where: { idRestaurante: tenantId, fecha: fechaOnly },
            });
            await this.prisma.registroBeneficioMesero.deleteMany({
                where: { fecha: fechaOnly },
            });
            await this.prisma.movimientoCaja.deleteMany({
                where: {
                    fecha: fechaOnly,
                    OR: [
                        { pedido: { idRestaurante: tenantId } },
                        { factura: { pedido: { idRestaurante: tenantId } } },
                    ],
                },
            });
            return {
                fecha: base.toFormat('yyyy-LL-dd'),
                facturas_eliminadas: 0,
                pedidos_reabiertos: 0,
            };
        }
        const idsFacturas = facturas.map((f) => f.idFactura);
        const pedidoIds = [...new Set(facturas.map((f) => f.idPedido))];
        let pedidosReabiertos = 0;
        await this.prisma.$transaction(async (tx) => {
            await tx.detallePedido.updateMany({
                where: { idFactura: { in: idsFacturas } },
                data: { idFactura: null },
            });
            await tx.cuentaCredito.deleteMany({
                where: { idFactura: { in: idsFacturas } },
            });
            await tx.factura.deleteMany({
                where: { idFactura: { in: idsFacturas } },
            });
            for (const idPedido of pedidoIds) {
                const restantes = await tx.factura.count({ where: { idPedido } });
                if (restantes > 0)
                    continue;
                const pedido = await tx.pedido.findUnique({
                    where: { idPedido },
                    include: {
                        detalles: { select: { enviadoCocina: true } },
                        historial: {
                            where: { tipo: 'cobro_reabierto' },
                            select: { idHistorial: true },
                            take: 1,
                        },
                    },
                });
                if (!pedido || pedido.detalles.length === 0)
                    continue;
                const enCocina = pedido.detalles.some((d) => d.enviadoCocina);
                if (pedido.estado === 'facturado') {
                    await tx.pedido.update({
                        where: { idPedido },
                        data: {
                            estado: enCocina ? 'en_cocina' : 'abierto',
                            cerradoEn: null,
                        },
                    });
                    await tx.mesa.update({
                        where: { idMesa: pedido.idMesa },
                        data: { estado: 'ocupada' },
                    });
                }
                if (pedido.historial.length === 0) {
                    await tx.pedidoHistorial.create({
                        data: {
                            idPedido,
                            idUsuario: actor.idUsuario,
                            tipo: 'cobro_reabierto',
                            detalleJson: {
                                motivo: 'Vaciado resumen diario (pruebas)',
                                origen: 'vaciar_resumen_diario',
                            },
                        },
                    });
                }
                pedidosReabiertos += 1;
            }
            await tx.cajaDiaria.deleteMany({
                where: { idRestaurante: tenantId, fecha: fechaOnly },
            });
            await tx.registroBeneficioMesero.deleteMany({
                where: { fecha: fechaOnly },
            });
            await tx.movimientoCaja.deleteMany({
                where: {
                    fecha: fechaOnly,
                    OR: [
                        { pedido: { idRestaurante: tenantId } },
                        { factura: { pedido: { idRestaurante: tenantId } } },
                    ],
                },
            });
        });
        for (const idPedido of pedidoIds) {
            const p = await this.prisma.pedido.findUnique({
                where: { idPedido },
                select: { idMesa: true, idUsuario: true, idRestaurante: true },
            });
            if (p) {
                this.emit(idPedido, p.idMesa, p.idUsuario, p.idRestaurante);
            }
        }
        this.gateway.emitConfigActualizada('mesas');
        return {
            fecha: base.toFormat('yyyy-LL-dd'),
            facturas_eliminadas: idsFacturas.length,
            pedidos_reabiertos: pedidosReabiertos,
        };
    }
    async reabrirCobro(idPedido, dto, actor) {
        if (actor.rol.nombre !== 'admin') {
            throw new common_1.ForbiddenException('Solo admin');
        }
        if (dto.confirmar.trim().toUpperCase() !== 'REABRIR') {
            throw new common_1.BadRequestException('Escribe confirmar: "REABRIR" para anular los cobros del pedido');
        }
        const pedido = await this.prisma.pedido.findUnique({
            where: { idPedido },
            include: {
                facturas: { orderBy: { emitidaEn: 'asc' } },
                detalles: { select: { enviadoCocina: true } },
            },
        });
        if (!pedido) {
            throw new common_1.NotFoundException('Pedido no encontrado');
        }
        if (pedido.facturas.length === 0) {
            throw new common_1.ConflictException('Este pedido no tiene cobros registrados');
        }
        const idsFacturas = pedido.facturas.map((f) => f.idFactura);
        const motivo = dto.motivo.trim();
        const detalleHistorial = {
            motivo,
            facturas_eliminadas: idsFacturas,
            cobro_mixto_grupos: [
                ...new Set(pedido.facturas
                    .map((f) => f.cobroMixtoGrupo)
                    .filter((g) => g != null)),
            ],
            totales: {
                efectivo: pedido.facturas
                    .filter((f) => f.metodoPago === 'efectivo')
                    .reduce((s, f) => s + Math.round(Number(f.total)), 0),
                transferencia: pedido.facturas
                    .filter((f) => f.metodoPago === 'transferencia')
                    .reduce((s, f) => s + Math.round(Number(f.total)), 0),
            },
            personas_plan: [
                ...new Set(pedido.facturas
                    .map((f) => f.personaPlanIndice)
                    .filter((i) => i != null)),
            ],
            era_parcial: pedido.facturas.some((f) => f.esParcial),
        };
        let movimientosEliminados = 0;
        const enCocina = pedido.detalles.some((d) => d.enviadoCocina);
        const nuevoEstado = enCocina ? 'en_cocina' : 'abierto';
        await this.prisma.$transaction(async (tx) => {
            await (0, prisma_lock_1.lockPedidoEnTx)(tx, idPedido);
            const movDel = await tx.movimientoCaja.deleteMany({
                where: {
                    OR: [{ idPedido }, { idFactura: { in: idsFacturas } }],
                },
            });
            movimientosEliminados = movDel.count;
            await tx.detallePedido.updateMany({
                where: { idPedido, idFactura: { in: idsFacturas } },
                data: { idFactura: null },
            });
            await tx.cuentaCredito.deleteMany({
                where: { idFactura: { in: idsFacturas } },
            });
            await tx.factura.deleteMany({ where: { idPedido } });
            const cuotaDetalles = await tx.detallePedido.findMany({
                where: {
                    idPedido,
                    idFactura: null,
                    producto: { esCuotaPendienteReparto: true },
                },
                select: { idDetalle: true },
            });
            if (cuotaDetalles.length > 0) {
                const idsCuota = cuotaDetalles.map((d) => d.idDetalle);
                await tx.detallePedido.deleteMany({
                    where: {
                        OR: [
                            { idDetalle: { in: idsCuota } },
                            { idDetallePadre: { in: idsCuota } },
                        ],
                    },
                });
            }
            await tx.pedido.update({
                where: { idPedido },
                data: {
                    estado: nuevoEstado,
                    cerradoEn: null,
                },
            });
            await tx.mesa.update({
                where: { idMesa: pedido.idMesa },
                data: { estado: 'ocupada' },
            });
            await tx.pedidoHistorial.create({
                data: {
                    idPedido,
                    idUsuario: actor.idUsuario,
                    tipo: 'cobro_reabierto',
                    detalleJson: detalleHistorial,
                },
            });
        });
        await this.consolidarFragmentosPrecioPendientesPedido(idPedido);
        this.emit(idPedido, pedido.idMesa, pedido.idUsuario, pedido.idRestaurante);
        this.gateway.emitConfigActualizada('mesas');
        return {
            ok: true,
            id_pedido: idPedido,
            facturas_eliminadas: idsFacturas.length,
            movimientos_caja_eliminados: movimientosEliminados,
            pedido_reabierto: true,
            estado: nuevoEstado,
        };
    }
    async revertirTandaCobro(idPedido, dto, actor) {
        if (actor.rol.nombre !== 'admin') {
            throw new common_1.ForbiddenException('Solo admin');
        }
        if (dto.confirmar.trim().toUpperCase() !== 'REVERTIR') {
            throw new common_1.BadRequestException('Escribe confirmar: "REVERTIR" para anular esta tanda de cobro');
        }
        const motivo = dto.motivo.trim();
        if (motivo.length < 3) {
            throw new common_1.BadRequestException('Indica un motivo de al menos 3 caracteres');
        }
        const pedido = await this.prisma.pedido.findUnique({
            where: { idPedido },
            include: {
                facturas: { orderBy: { emitidaEn: 'asc' } },
                detalles: { select: { enviadoCocina: true, idFactura: true } },
            },
        });
        if (!pedido) {
            throw new common_1.NotFoundException('Pedido no encontrado');
        }
        if (pedido.facturas.length === 0) {
            throw new common_1.ConflictException('Este pedido no tiene cobros registrados');
        }
        const facturasRefs = pedido.facturas.map((f) => ({
            id_factura: f.idFactura,
            metodo_pago: f.metodoPago,
            persona_plan_indice: f.personaPlanIndice,
            cobro_mixto_grupo: f.cobroMixtoGrupo,
            total: Math.round(Number(f.total)),
            emitida_en: f.emitidaEn,
        }));
        const tanda = (0, factura_mixto_1.facturasDeTandaCobro)(facturasRefs, dto.id_factura);
        if (tanda.length === 0) {
            throw new common_1.NotFoundException('La factura indicada no pertenece a este pedido');
        }
        const idsFacturas = tanda.map((f) => f.id_factura);
        const quedanOtrasFacturas = pedido.facturas.some((f) => !idsFacturas.includes(f.idFactura));
        const enCocina = pedido.detalles.some((d) => d.enviadoCocina);
        const nuevoEstado = enCocina ? 'en_cocina' : 'abierto';
        const detalleHistorial = {
            motivo,
            alcance: 'tanda',
            id_factura_solicitada: dto.id_factura,
            facturas_eliminadas: idsFacturas,
            cobro_mixto_grupo: tanda.find((f) => f.cobro_mixto_grupo != null)?.cobro_mixto_grupo ??
                null,
            persona_plan_indice: tanda.find((f) => f.persona_plan_indice != null)?.persona_plan_indice ??
                null,
            totales: {
                efectivo: tanda
                    .filter((f) => f.metodo_pago === 'efectivo')
                    .reduce((s, f) => s + f.total, 0),
                transferencia: tanda
                    .filter((f) => f.metodo_pago === 'transferencia')
                    .reduce((s, f) => s + f.total, 0),
            },
            quedan_otras_facturas: quedanOtrasFacturas,
        };
        let movimientosEliminados = 0;
        await this.prisma.$transaction(async (tx) => {
            await (0, prisma_lock_1.lockPedidoEnTx)(tx, idPedido);
            const movDel = await tx.movimientoCaja.deleteMany({
                where: { idFactura: { in: idsFacturas } },
            });
            movimientosEliminados = movDel.count;
            await tx.detallePedido.updateMany({
                where: { idPedido, idFactura: { in: idsFacturas } },
                data: { idFactura: null },
            });
            await tx.cuentaCredito.deleteMany({
                where: { idFactura: { in: idsFacturas } },
            });
            await tx.factura.deleteMany({
                where: { idPedido, idFactura: { in: idsFacturas } },
            });
            await tx.pedido.update({
                where: { idPedido },
                data: {
                    estado: nuevoEstado,
                    cerradoEn: null,
                },
            });
            await tx.mesa.update({
                where: { idMesa: pedido.idMesa },
                data: { estado: 'ocupada' },
            });
            await tx.pedidoHistorial.create({
                data: {
                    idPedido,
                    idUsuario: actor.idUsuario,
                    tipo: 'cobro_reabierto',
                    detalleJson: detalleHistorial,
                },
            });
        });
        await this.consolidarFragmentosPrecioPendientesPedido(idPedido);
        await this.reconstruirSaldoPendienteTrasRevertirTanda(idPedido);
        await this.reconciliarSaldoAPlatos(idPedido, actor);
        this.emit(idPedido, pedido.idMesa, pedido.idUsuario, pedido.idRestaurante);
        this.gateway.emitConfigActualizada('mesas');
        const completo = await this.obtenerPorId(idPedido);
        return {
            ok: true,
            id_pedido: idPedido,
            facturas_eliminadas: idsFacturas,
            movimientos_caja_eliminados: movimientosEliminados,
            quedan_cobros: quedanOtrasFacturas,
            pedido_reabierto: true,
            estado: completo.estado ?? nuevoEstado,
            pedido: completo,
        };
    }
    async reconstruirSaldoPendienteTrasRevertirTanda(idPedido) {
        const pedidoHead = await this.prisma.pedido.findUnique({
            where: { idPedido },
            select: { idRestaurante: true },
        });
        if (!pedidoHead)
            return;
        const configRow = await this.obtenerConfigDescuentosRow(pedidoHead.idRestaurante);
        const config = this.mapConfigDescuentos(configRow);
        await this.prisma.$transaction(async (tx) => {
            await (0, prisma_lock_1.lockPedidoEnTx)(tx, idPedido);
            const pedido = await tx.pedido.findUnique({
                where: { idPedido },
                include: {
                    detalles: { include: detalleInclude, orderBy: { idDetalle: 'asc' } },
                    facturas: { orderBy: { idFactura: 'asc' } },
                },
            });
            if (!pedido)
                return;
            const esInternoSaldo = (d) => d.producto.esCuotaPendienteReparto ||
                (0, saldo_restante_1.esNotaSaldoRestantePendiente)(d.notaCocina) ||
                (d.notaCocina ?? '').trim().startsWith(saldo_restante_1.SALDO_ABONO_NOTA);
            if (pedido.facturas.length === 0) {
                const ids = pedido.detalles
                    .filter((d) => d.idFactura == null && esInternoSaldo(d))
                    .map((d) => d.idDetalle);
                if (ids.length > 0) {
                    await tx.detallePedido.deleteMany({
                        where: { idDetalle: { in: ids } },
                    });
                }
                return;
            }
            const idsFacturasPlan = new Set();
            for (const f of pedido.facturas) {
                if (f.planPersonasSobreTotal || f.planCombinadoSobreSeleccion) {
                    idsFacturasPlan.add(f.idFactura);
                }
            }
            for (const d of pedido.detalles) {
                if (d.idFactura != null && esInternoSaldo(d)) {
                    idsFacturasPlan.add(d.idFactura);
                }
            }
            const idsInternosPendientes = pedido.detalles
                .filter((d) => d.idFactura == null && esInternoSaldo(d))
                .map((d) => d.idDetalle);
            if (idsInternosPendientes.length > 0) {
                await tx.detallePedido.deleteMany({
                    where: { idDetalle: { in: idsInternosPendientes } },
                });
            }
            if (idsFacturasPlan.size > 0) {
                for (const d of pedido.detalles) {
                    if (d.idFactura == null)
                        continue;
                    if (!idsFacturasPlan.has(d.idFactura))
                        continue;
                    if (esInternoSaldo(d))
                        continue;
                    await tx.detallePedido.update({
                        where: { idDetalle: d.idDetalle },
                        data: { idFactura: null },
                    });
                }
            }
            if (idsFacturasPlan.size === 0)
                return;
            const pedido2 = await tx.pedido.findUnique({
                where: { idPedido },
                include: {
                    detalles: { include: detalleInclude, orderBy: { idDetalle: 'asc' } },
                    facturas: { orderBy: { idFactura: 'asc' } },
                },
            });
            if (!pedido2)
                return;
            const cobradoPlan = pedido2.facturas
                .filter((f) => idsFacturasPlan.has(f.idFactura))
                .reduce((s, f) => s + Math.round(Number(f.total)), 0);
            if (cobradoPlan <= 0)
                return;
            const realesPendientes = pedido2.detalles.filter((d) => d.idFactura == null &&
                d.idDetallePadre == null &&
                !esInternoSaldo(d));
            if (realesPendientes.length === 0)
                return;
            const solicitudes = realesPendientes.map((d) => ({
                id_detalle: d.idDetalle,
                cantidad: d.cantidad,
            }));
            const totalPendiente = Number(this.calcularImportesFactura(pedido2, solicitudes, config).total);
            const montoSaldo = Math.max(0, totalPendiente - cobradoPlan);
            if (montoSaldo <= 0)
                return;
            await this.asegurarSaldoRestanteEnTx(tx, idPedido, pedido2, montoSaldo, pedido2.idRestaurante, null);
        });
    }
    async resumenDiarioLineasFactura(idFactura) {
        const f = await this.prisma.factura.findUnique({
            where: { idFactura },
            include: {
                pedido: {
                    include: {
                        detalles: {
                            where: { idFactura },
                            include: {
                                producto: {
                                    select: {
                                        nombre: true,
                                        esPlatoPrincipal: true,
                                        esEmpacable: true,
                                        enviaCocina: true,
                                        esAcompanamientoMazorca: true,
                                        categoria: {
                                            select: {
                                                nombre: true,
                                                esBebida: true,
                                                esLineaEmpaque: true,
                                            },
                                        },
                                    },
                                },
                                personalizaciones: {
                                    include: {
                                        opcion: { select: { idOpcion: true, descripcion: true } },
                                    },
                                },
                            },
                            orderBy: { idDetalle: 'asc' },
                        },
                    },
                },
            },
        });
        if (!f) {
            throw new common_1.NotFoundException('Factura no encontrada');
        }
        return {
            id_factura: f.idFactura,
            detalles: (0, factura_lineas_group_1.lineasFacturaParaTicket)(f.pedido.detalles.map((d) => this.lineaFacturaDesdePrismaResumen(d))),
        };
    }
    async imprimirResumenDiarioCompleto(fecha) {
        const resumen = await this.resumenDiario(fecha, { incluirLineas: true });
        if (resumen.total_facturas === 0) {
            throw new common_1.BadRequestException('No hay ventas facturadas en esta fecha');
        }
        return this.comandaPrinter.runWithImpresionRapida(async () => {
            let comandasImpresas = 0;
            let comandasOmitidas = 0;
            let facturasImpresas = 0;
            const errores = [];
            let detenidoSinPapel = false;
            const comandasImpresasPedidos = new Set();
            for (const ped of resumen.pedidos_detalle) {
                if (detenidoSinPapel)
                    break;
                if (!comandasImpresasPedidos.has(ped.id_pedido)) {
                    const comanda = await this.imprimirComandaPedidoSiAplica(ped.id_pedido);
                    comandasImpresasPedidos.add(ped.id_pedido);
                    if (comanda === null) {
                        comandasOmitidas += 1;
                    }
                    else if (comanda.impreso) {
                        comandasImpresas += 1;
                    }
                    else {
                        errores.push(`Pedido #${ped.id_pedido} comanda: ${comanda.error ?? 'sin imprimir'}`);
                        if (comanda.codigo_error === 'sin_papel') {
                            detenidoSinPapel = true;
                            this.emitirAlertaImpresora(comanda, 'comanda', ped.id_pedido);
                            break;
                        }
                    }
                }
            }
            const idsFacturasUnicas = (0, factura_mixto_1.facturasIdsImpresionUnica)(resumen.pedidos_detalle);
            for (const idFactura of idsFacturasUnicas) {
                if (detenidoSinPapel)
                    break;
                const ped = resumen.pedidos_detalle.find((p) => p.id_factura === idFactura);
                const factura = await this.imprimirFacturaPorId(idFactura);
                if (factura.impreso) {
                    facturasImpresas += 1;
                }
                else {
                    errores.push(`Pedido #${ped?.id_pedido ?? '?'} factura: ${factura.error ?? 'sin imprimir'}`);
                    if (factura.codigo_error === 'sin_papel') {
                        detenidoSinPapel = true;
                        this.emitirAlertaImpresora(factura, 'factura', ped?.id_pedido);
                        break;
                    }
                }
            }
            return {
                fecha: resumen.fecha,
                total_pedidos: resumen.total_facturas,
                comandas_impresas: comandasImpresas,
                comandas_omitidas: comandasOmitidas,
                facturas_impresas: facturasImpresas,
                errores,
                detenido_sin_papel: detenidoSinPapel,
            };
        });
    }
    async imprimirResumenDiarioSeleccion(dto, fecha) {
        const idFacturas = [...new Set(dto.id_facturas ?? [])].filter((id) => id > 0);
        const idPedidosComanda = [...new Set(dto.id_pedidos_comanda ?? [])].filter((id) => id > 0);
        if (idFacturas.length === 0 && idPedidosComanda.length === 0) {
            throw new common_1.BadRequestException('Selecciona al menos una factura o comanda');
        }
        const resumen = await this.resumenDiario(fecha, { incluirLineas: false });
        const facturasValidas = new Set(resumen.pedidos_detalle.map((p) => p.id_factura));
        const pedidosValidos = new Set(resumen.pedidos_detalle.map((p) => p.id_pedido));
        const facturasInvalidas = idFacturas.filter((id) => !facturasValidas.has(id));
        const pedidosInvalidos = idPedidosComanda.filter((id) => !pedidosValidos.has(id));
        if (facturasInvalidas.length > 0 || pedidosInvalidos.length > 0) {
            throw new common_1.BadRequestException('Hay ítems seleccionados que no pertenecen a esta fecha');
        }
        const ordenFacturas = resumen.pedidos_detalle
            .filter((p) => idFacturas.includes(p.id_factura))
            .sort((a, b) => new Date(a.emitida_en).getTime() - new Date(b.emitida_en).getTime());
        const idsFacturasDedup = (0, factura_mixto_1.facturasIdsImpresionUnica)(ordenFacturas);
        const ordenPedidos = [...idPedidosComanda].sort((a, b) => a - b);
        return this.comandaPrinter.runWithImpresionRapida(async () => {
            let comandasImpresas = 0;
            let comandasOmitidas = 0;
            let facturasImpresas = 0;
            const errores = [];
            let detenidoSinPapel = false;
            for (const idPedido of ordenPedidos) {
                if (detenidoSinPapel)
                    break;
                const comanda = await this.imprimirComandaPedidoSiAplica(idPedido);
                if (comanda === null) {
                    comandasOmitidas += 1;
                }
                else if (comanda.impreso) {
                    comandasImpresas += 1;
                }
                else {
                    errores.push(`Pedido #${idPedido} comanda: ${comanda.error ?? 'sin imprimir'}`);
                    if (comanda.codigo_error === 'sin_papel') {
                        detenidoSinPapel = true;
                        this.emitirAlertaImpresora(comanda, 'comanda', idPedido);
                        break;
                    }
                }
            }
            for (const idFactura of idsFacturasDedup) {
                if (detenidoSinPapel)
                    break;
                const pedidoDetalle = resumen.pedidos_detalle.find((p) => p.id_factura === idFactura);
                const factura = await this.imprimirFacturaPorId(idFactura);
                if (factura.impreso) {
                    facturasImpresas += 1;
                }
                else {
                    errores.push(`Factura #${idFactura}${pedidoDetalle ? ` (pedido #${pedidoDetalle.id_pedido})` : ''}: ${factura.error ?? 'sin imprimir'}`);
                    if (factura.codigo_error === 'sin_papel') {
                        detenidoSinPapel = true;
                        this.emitirAlertaImpresora(factura, 'factura', pedidoDetalle?.id_pedido);
                        break;
                    }
                }
            }
            return {
                fecha: resumen.fecha,
                comandas_impresas: comandasImpresas,
                comandas_omitidas: comandasOmitidas,
                facturas_impresas: facturasImpresas,
                errores,
                detenido_sin_papel: detenidoSinPapel,
            };
        });
    }
    async imprimirResumenDiarioTotal(fecha) {
        const resumen = await this.resumenDiario(fecha);
        const ticket = {
            fecha: resumen.fecha,
            total_facturado: resumen.total_facturado,
            total_facturas: resumen.total_facturas,
            monto_base_efectivo: resumen.monto_base_efectivo,
            totales_por_metodo: resumen.totales_por_metodo,
            fiados_dia: resumen.fiados_dia,
            total_fiados_dia: resumen.total_fiados_dia,
            total_pagos_meseros: resumen.total_pagos_meseros,
            total_entradas_manual: resumen.total_entradas_manual,
            total_salidas_manual: resumen.total_salidas_manual,
            total_devoluciones_efectivo: resumen.total_devoluciones_efectivo,
            total_pagos_domicilio: resumen.total_pagos_domicilio,
            total_pagos_mesero_exceso: resumen.total_pagos_mesero_exceso,
            subtotal_entradas_caja: resumen.subtotal_entradas_caja,
            subtotal_salidas_caja: resumen.subtotal_salidas_caja,
            efectivo_esperado_en_caja: resumen.efectivo_esperado_en_caja,
            emitida_en: new Date().toISOString(),
        };
        const impresion = await this.comandaPrinter.runWithImpresionRapida(() => this.comandaPrinter.imprimirCierreCaja(ticket));
        this.emitirAlertaImpresora(impresion, 'cierre');
        return {
            ok: impresion.impreso,
            fecha: resumen.fecha,
            impresion_cierre: impresion,
            resumen: {
                total_facturado: resumen.total_facturado,
                efectivo_esperado_en_caja: resumen.efectivo_esperado_en_caja,
            },
        };
    }
    async imprimirComandaPedidoSiAplica(idPedido) {
        const pedido = await this.prisma.pedido.findUnique({
            where: { idPedido },
            include: {
                mesa: true,
                usuario: true,
                detalles: {
                    include: detalleInclude,
                    orderBy: { idDetalle: 'asc' },
                },
            },
        });
        if (!pedido) {
            return { impreso: false, error: 'Pedido no encontrado' };
        }
        const enviados = pedido.detalles.filter((d) => productoDebePasarCocina(d.producto) && d.enviadoCocina);
        if (enviados.length === 0) {
            return null;
        }
        const comanda = this.construirTicketComanda(pedido, enviados, {
            esReimpresion: true,
        });
        return this.comandaPrinter.imprimirComanda(comanda);
    }
    async imprimirFacturaPorId(idFactura) {
        const f = await this.prisma.factura.findUnique({
            where: { idFactura },
            include: {
                pedido: {
                    include: {
                        mesa: true,
                        usuario: { include: { rol: true } },
                        detalles: { include: detalleInclude, orderBy: { idDetalle: 'asc' } },
                        facturas: facturasInclude,
                    },
                },
            },
        });
        if (!f) {
            return { impreso: false, error: 'Factura no encontrada' };
        }
        const completo = this.serializarPedido(f.pedido);
        const ticket = this.construirTicketFactura(completo, f.idFactura, true);
        return this.comandaPrinter.imprimirFactura(ticket);
    }
    async imprimirFacturaPedido(idPedido) {
        const pedido = await this.prisma.pedido.findUnique({
            where: { idPedido },
            include: { facturas: facturasInclude },
        });
        const ultima = pedido?.facturas.at(-1);
        if (!ultima) {
            return { impreso: false, error: 'Pedido sin factura' };
        }
        return this.imprimirFacturaPorId(ultima.idFactura);
    }
    async crear(dto, idUsuario, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const mesa = await (0, tenant_scope_1.assertMesaDelTenant)(this.prisma, dto.id_mesa, tenantId);
        if (!(0, mesa_dia_1.mesaDisponibleHoyBogota)(mesa)) {
            throw new common_1.ConflictException('Esta mesa no está disponible hoy');
        }
        const virtual = await this.esMesaVirtualNumero(mesa.numero, tenantId);
        const opRow = await this.obtenerConfigOperativaRow(tenantId);
        const modoServicio = (0, mesa_label_1.esMesaParaLlevarNumero)(mesa.numero, opRow)
            ? 'para_llevar'
            : 'en_mesa';
        const op = await this.ctxOperativa(tenantId);
        const pedido = await this.prisma.$transaction(async (tx) => {
            if (!virtual) {
                await (0, prisma_lock_1.lockMesaEnTx)(tx, dto.id_mesa);
                const mesaTx = await tx.mesa.findUnique({
                    where: { idMesa: dto.id_mesa },
                });
                if (!mesaTx || mesaTx.estado !== 'libre') {
                    throw new common_1.ConflictException('La mesa no está libre');
                }
                const otro = await tx.pedido.findFirst({
                    where: {
                        idMesa: dto.id_mesa,
                        estado: { in: ABIERTOS },
                    },
                });
                if (otro) {
                    throw new common_1.ConflictException('Ya existe un pedido abierto en esta mesa');
                }
            }
            const p = await tx.pedido.create({
                data: {
                    idRestaurante: tenantId,
                    idMesa: dto.id_mesa,
                    idUsuario,
                    numComensales: dto.num_comensales,
                    estado: 'abierto',
                    modoServicio,
                },
            });
            if (!virtual) {
                await tx.mesa.update({
                    where: { idMesa: dto.id_mesa },
                    data: { estado: 'ocupada' },
                });
            }
            await (0, mazorca_linea_pedido_1.crearLineaMazorcaInicial)(tx, {
                idPedido: p.idPedido,
                numComensales: dto.num_comensales,
                mesaNumero: mesa.numero,
                mazorcaActiva: op.mazorcaActiva,
                idProductoMazorca: op.idProductoMazorca,
                idRestaurante: tenantId,
            });
            return p;
        });
        this.emit(pedido.idPedido, pedido.idMesa, pedido.idUsuario, tenantId);
        return this.obtenerPorIdTrasEscritura(pedido.idPedido, tenantId);
    }
    async listar(estadosCsv, orden = 'desc', pagination, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const estados = estadosCsv
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        if (estados.length === 0) {
            throw new common_1.BadRequestException('Indica al menos un estado en el parámetro "estados"');
        }
        const orderByPrisma = orden === 'prioridad_cocina'
            ? { creadoEn: 'asc' }
            : { creadoEn: orden };
        const rows = await this.prisma.pedido.findMany({
            where: { idRestaurante: tenantId, estado: { in: estados } },
            include: pedidos_vista_operativa_1.pedidoVistaOperativaInclude,
            orderBy: orderByPrisma,
            take: pagination?.limit,
            skip: pagination?.offset,
        });
        const op = await this.ctxOperativa(tenantId);
        const serializados = rows.map((p) => (0, pedidos_vista_operativa_1.serializarPedidoVistaOperativa)(p, this.prioridadOptsFromOperativa(op)));
        if (orden === 'prioridad_cocina') {
            return {
                pedidos: (0, cocina_prioridad_1.ordenarPedidosCocina)(serializados),
                limit: pagination?.limit ?? null,
                offset: pagination?.offset ?? 0,
                count: serializados.length,
            };
        }
        return {
            pedidos: serializados,
            limit: pagination?.limit ?? null,
            offset: pagination?.offset ?? 0,
            count: serializados.length,
        };
    }
    async listarCocina(actor) {
        const tenantId = actor?.idRestaurante ?? tenant_constants_1.DEFAULT_TENANT_ID;
        const rows = await this.prisma.pedido.findMany({
            where: { idRestaurante: tenantId, estado: 'en_cocina' },
            include: pedidos_vista_operativa_1.pedidoVistaOperativaInclude,
            orderBy: { creadoEn: 'asc' },
            take: operative_limits_1.OPERATIVE_PEDIDOS_MAX,
        });
        const op = await this.ctxOperativa(tenantId);
        const serializados = rows.map((p) => (0, pedidos_vista_operativa_1.serializarPedidoVistaOperativa)(p, this.prioridadOptsFromOperativa(op)));
        const todos = (0, cocina_vista_1.ordenarPedidosCocinaPorLlegada)(serializados);
        return { pedidos: todos };
    }
    async listarMisActivos(actor) {
        const tenantId = actor.idRestaurante ?? tenant_constants_1.DEFAULT_TENANT_ID;
        const rows = await this.prisma.pedido.findMany({
            where: {
                idRestaurante: tenantId,
                estado: { in: ABIERTOS },
                idUsuario: actor.idUsuario,
            },
            include: pedidos_vista_operativa_1.pedidoVistaOperativaInclude,
            orderBy: { creadoEn: 'asc' },
            take: operative_limits_1.OPERATIVE_PEDIDOS_MAX,
        });
        const op = await this.ctxOperativa(tenantId);
        const pedidos = rows.map((p) => (0, pedidos_vista_operativa_1.serializarPedidoVistaOperativa)(p, this.prioridadOptsFromOperativa(op)));
        const mesas = new Set(pedidos.map((p) => p.mesa_numero));
        return {
            pedidos,
            mesas_activas: mesas.size,
        };
    }
    async listarMisActivosResumen(actor) {
        const tenantId = actor.idRestaurante ?? tenant_constants_1.DEFAULT_TENANT_ID;
        const rows = await this.prisma.pedido.findMany({
            where: {
                idRestaurante: tenantId,
                estado: { in: ABIERTOS },
                idUsuario: actor.idUsuario,
            },
            take: operative_limits_1.OPERATIVE_PEDIDOS_MAX,
            select: {
                idPedido: true,
                idMesa: true,
                mesa: { select: { numero: true } },
                detalles: {
                    select: {
                        cantidad: true,
                        enviadoCocina: true,
                        listoParaRecoger: true,
                        listoCocina: true,
                        producto: {
                            select: {
                                esEmpacable: true,
                                enviaCocina: true,
                                esAcompanamientoMazorca: true,
                                categoria: { select: { nombre: true } },
                            },
                        },
                    },
                },
            },
        });
        let pedidosMostrador = 0;
        let pedidosParaLlevar = 0;
        let platosSinPasarCocina = 0;
        let platosParaRecoger = 0;
        let mazorcasParaRecoger = 0;
        const mesaIds = [];
        const pedidoIds = [];
        const mv = (0, mesa_label_1.resolverMesasVirtuales)(await this.obtenerConfigOperativaRow(tenantId));
        for (const p of rows) {
            pedidoIds.push(p.idPedido);
            mesaIds.push(p.idMesa);
            const numero = p.mesa.numero;
            if (numero === mv.numero_mesa_mostrador)
                pedidosMostrador += 1;
            if (numero === mv.numero_mesa_para_llevar)
                pedidosParaLlevar += 1;
            for (const d of p.detalles) {
                const cat = d.producto.categoria;
                const esBebida = (0, cocina_producto_1.categoriaEsBebida)(cat);
                const esEmpacable = d.producto.esEmpacable;
                const marcarCocina = productoDebePasarCocina(d.producto);
                if (marcarCocina && !d.enviadoCocina) {
                    platosSinPasarCocina += d.cantidad;
                }
                if (marcarCocina &&
                    d.enviadoCocina &&
                    d.listoParaRecoger &&
                    !d.listoCocina &&
                    !esBebida) {
                    if (d.producto.esAcompanamientoMazorca) {
                        mazorcasParaRecoger += d.cantidad;
                    }
                    else {
                        platosParaRecoger += d.cantidad;
                    }
                }
            }
        }
        return {
            pedidos_mostrador: pedidosMostrador,
            pedidos_para_llevar: pedidosParaLlevar,
            platos_sin_pasar_cocina: platosSinPasarCocina,
            platos_para_recoger: platosParaRecoger,
            mazorcas_para_recoger: mazorcasParaRecoger,
            mesa_ids: mesaIds,
            pedido_ids: pedidoIds,
        };
    }
    async listarPendientesCobroResumen(actor) {
        if (actor.rol.nombre !== 'admin') {
            throw new common_1.ForbiddenException('Solo admin');
        }
        const tenantId = actor.idRestaurante ?? tenant_constants_1.DEFAULT_TENANT_ID;
        const rows = await this.prisma.pedido.findMany({
            where: { idRestaurante: tenantId, estado: { in: ABIERTOS } },
            select: {
                idPedido: true,
                idMesa: true,
                mesa: { select: { numero: true } },
                usuario: { select: { nombre: true, apellido: true } },
            },
            orderBy: { creadoEn: 'asc' },
            take: operative_limits_1.OPERATIVE_PEDIDOS_MAX,
        });
        const mv = (0, mesa_label_1.resolverMesasVirtuales)(await this.obtenerConfigOperativaRow(tenantId));
        let pedidosMostrador = 0;
        let pedidosParaLlevar = 0;
        let pedidosEnMesas = 0;
        const pedidos = rows.map((p) => {
            const numero = p.mesa.numero;
            let canal = 'mesa';
            if (numero === mv.numero_mesa_mostrador) {
                pedidosMostrador += 1;
                canal = 'mostrador';
            }
            else if (numero === mv.numero_mesa_para_llevar) {
                pedidosParaLlevar += 1;
                canal = 'para_llevar';
            }
            else {
                pedidosEnMesas += 1;
            }
            return {
                id_pedido: p.idPedido,
                id_mesa: p.idMesa,
                mesa_numero: numero,
                canal,
                mesero: `${p.usuario.nombre} ${p.usuario.apellido}`.trim(),
            };
        });
        return {
            total_pedidos: rows.length,
            pedidos_mostrador: pedidosMostrador,
            pedidos_para_llevar: pedidosParaLlevar,
            pedidos_en_mesas: pedidosEnMesas,
            pedidos,
        };
    }
    async listarAyudaCompaneros(actor) {
        await this.exigirPermisoMesero(actor, 'ayuda_companeros');
        if (actor.rol.nombre !== 'mesero' && actor.rol.nombre !== 'admin') {
            return { pedidos: [], total_platos_para_recoger: 0 };
        }
        const tenantId = actor.idRestaurante ?? tenant_constants_1.DEFAULT_TENANT_ID;
        const rows = await this.prisma.pedido.findMany({
            where: {
                idRestaurante: tenantId,
                estado: { in: ABIERTOS },
                idUsuario: { not: actor.idUsuario },
            },
            include: pedidos_vista_operativa_1.pedidoVistaOperativaInclude,
            orderBy: { creadoEn: 'asc' },
            take: operative_limits_1.OPERATIVE_PEDIDOS_MAX,
        });
        const pedidos = rows
            .map((p) => (0, pedidos_vista_operativa_1.serializarPedidoVistaOperativa)(p))
            .filter(pedidos_vista_operativa_1.pedidoTieneRecogidaPendiente);
        const total = pedidos.reduce((acc, p) => acc + (0, pedidos_vista_operativa_1.platosPendientesRecogerPedido)(p), 0);
        return {
            pedidos,
            total_platos_para_recoger: total,
        };
    }
    async listarAyudaCompanerosResumen(actor) {
        await this.exigirPermisoMesero(actor, 'ayuda_companeros');
        if (actor.rol.nombre !== 'mesero' && actor.rol.nombre !== 'admin') {
            return {
                platos_para_recoger: 0,
                pedidos: 0,
                pedido_ids: [],
                mesa_ids: [],
            };
        }
        const tenantId = actor.idRestaurante ?? tenant_constants_1.DEFAULT_TENANT_ID;
        const rows = await this.prisma.pedido.findMany({
            where: {
                idRestaurante: tenantId,
                estado: { in: ABIERTOS },
                idUsuario: { not: actor.idUsuario },
            },
            take: operative_limits_1.OPERATIVE_PEDIDOS_MAX,
            select: {
                idPedido: true,
                idMesa: true,
                detalles: {
                    select: {
                        cantidad: true,
                        enviadoCocina: true,
                        listoParaRecoger: true,
                        listoCocina: true,
                        producto: {
                            select: {
                                esEmpacable: true,
                                enviaCocina: true,
                                categoria: { select: { nombre: true, esBebida: true } },
                            },
                        },
                    },
                },
            },
        });
        let platosParaRecoger = 0;
        const pedidoIds = [];
        const mesaIds = [];
        for (const p of rows) {
            let platosPedido = 0;
            for (const d of p.detalles) {
                const cat = d.producto.categoria;
                const esBebida = (0, cocina_producto_1.categoriaEsBebida)(cat);
                const esEmpacable = d.producto.esEmpacable;
                const marcarCocina = productoDebePasarCocina(d.producto);
                if (marcarCocina &&
                    d.enviadoCocina &&
                    !d.listoCocina &&
                    !esBebida) {
                    platosPedido += d.cantidad;
                }
            }
            if (platosPedido > 0) {
                platosParaRecoger += platosPedido;
                pedidoIds.push(p.idPedido);
                mesaIds.push(p.idMesa);
            }
        }
        return {
            platos_para_recoger: platosParaRecoger,
            pedidos: pedidoIds.length,
            pedido_ids: pedidoIds,
            mesa_ids: mesaIds,
        };
    }
    async marcarListoParaRecoger(idDetalle, dto) {
        const det = await this.prisma.detallePedido.findUnique({
            where: { idDetalle },
            include: {
                producto: { include: { categoria: true } },
                pedido: { include: { mesa: true, usuario: true } },
            },
        });
        if (!det) {
            throw new common_1.NotFoundException('Línea no encontrada');
        }
        if (!ABIERTOS.includes(det.pedido.estado)) {
            throw new common_1.ConflictException('El pedido ya no está en cocina');
        }
        if (!det.enviadoCocina) {
            throw new common_1.BadRequestException('La línea aún no se envió a cocina');
        }
        if ((0, cocina_producto_1.categoriaEsBebida)(det.producto.categoria)) {
            throw new common_1.BadRequestException('Las bebidas no aplican en cocina');
        }
        if (det.listoCocina) {
            throw new common_1.ConflictException('El mesero ya marcó este plato como recogido');
        }
        if (!productoDebePasarCocina(det.producto)) {
            throw new common_1.BadRequestException('Esta línea no pasa por cocina');
        }
        const listo = Boolean(dto.listo_para_recoger);
        await this.prisma.detallePedido.update({
            where: { idDetalle },
            data: { listoParaRecoger: listo },
        });
        this.emit(det.pedido.idPedido, det.pedido.idMesa, det.pedido.idUsuario, det.pedido.idRestaurante);
        if (listo) {
            const mesero = det.pedido.usuario;
            const esMz = det.producto.esAcompanamientoMazorca;
            this.gateway.emitCocinaLlamaMesero({
                pedidoId: det.pedido.idPedido,
                mesaId: det.pedido.idMesa,
                mesaNumero: det.pedido.mesa.numero,
                idMesero: mesero.idUsuario,
                meseroNombre: `${mesero.nombre} ${mesero.apellido}`.trim(),
                platosListos: esMz ? 0 : det.cantidad,
                entradasListos: esMz ? det.cantidad : 0,
                tipo_listo: esMz ? 'entrada' : 'plato',
                at: new Date().toISOString(),
            }, det.pedido.idRestaurante);
        }
        return {
            id_detalle: idDetalle,
            id_pedido: det.pedido.idPedido,
            listo_para_recoger: listo,
        };
    }
    async marcarDetalleRecogido(idDetalle, dto) {
        const det = await this.prisma.detallePedido.findUnique({
            where: { idDetalle },
            include: {
                producto: { include: { categoria: true } },
                pedido: true,
            },
        });
        if (!det) {
            throw new common_1.NotFoundException('Línea no encontrada');
        }
        if (!ABIERTOS.includes(det.pedido.estado)) {
            throw new common_1.ConflictException('El pedido ya no está en cocina');
        }
        if ((0, cocina_producto_1.categoriaEsBebida)(det.producto.categoria)) {
            throw new common_1.BadRequestException('Las bebidas no se marcan en cocina; solo platos y adicionales');
        }
        if (!productoDebePasarCocina(det.producto)) {
            throw new common_1.BadRequestException('Esta línea no se marca en cocina; revisa la configuración del producto');
        }
        if (dto.listo_cocina) {
            if (!det.enviadoCocina) {
                throw new common_1.BadRequestException('La línea aún no se envió a cocina');
            }
            if (det.listoCocina) {
                throw new common_1.ConflictException('Este plato ya está marcado en la mesa');
            }
            const qty = dto.cantidad ?? det.cantidad;
            await this.aplicarRecogidaParcial(det, qty);
        }
        else {
            await this.prisma.detallePedido.update({
                where: { idDetalle },
                data: {
                    listoCocina: false,
                    listoParaRecoger: det.listoParaRecoger,
                },
            });
        }
        this.emit(det.pedido.idPedido, det.pedido.idMesa, det.pedido.idUsuario, det.pedido.idRestaurante);
        return {
            id_detalle: idDetalle,
            id_pedido: det.pedido.idPedido,
            listo_cocina: dto.listo_cocina,
        };
    }
    async avisarFaltaEnCocina(idDetalle, actorId, actorRol, cantidad) {
        const det = await this.prisma.detallePedido.findUnique({
            where: { idDetalle },
            include: {
                producto: { include: { categoria: true } },
                pedido: { include: { mesa: true, usuario: true } },
            },
        });
        if (!det) {
            throw new common_1.NotFoundException('Línea no encontrada');
        }
        if (!ABIERTOS.includes(det.pedido.estado)) {
            throw new common_1.ConflictException('El pedido ya no está activo');
        }
        if (actorRol !== 'admin' &&
            actorRol !== 'mesero' &&
            det.pedido.idUsuario !== actorId) {
            throw new common_1.ForbiddenException('No tienes permiso para avisar en este pedido');
        }
        if (!det.enviadoCocina) {
            throw new common_1.BadRequestException('La línea aún no se envió a cocina');
        }
        if (det.listoCocina) {
            throw new common_1.ConflictException('Este plato ya está marcado en la mesa');
        }
        if ((0, cocina_producto_1.categoriaEsBebida)(det.producto.categoria)) {
            throw new common_1.BadRequestException('Las bebidas no aplican en cocina');
        }
        if (!productoDebePasarCocina(det.producto)) {
            throw new common_1.BadRequestException('Esta línea no pasa por cocina');
        }
        const qty = cantidad ?? det.cantidad;
        const cantidadAvisada = await this.aplicarFaltaParcial(det, qty);
        const mesero = det.pedido.usuario;
        this.emit(det.pedido.idPedido, det.pedido.idMesa, det.pedido.idUsuario, det.pedido.idRestaurante);
        this.gateway.emitCocinaFaltaPlato({
            pedidoId: det.pedido.idPedido,
            mesaId: det.pedido.idMesa,
            mesaNumero: det.pedido.mesa.numero,
            idDetalle,
            productoNombre: det.producto.nombre,
            cantidad: cantidadAvisada,
            meseroNombre: `${mesero.nombre} ${mesero.apellido}`.trim(),
            at: new Date().toISOString(),
        }, det.pedido.idRestaurante);
        return {
            id_detalle: idDetalle,
            id_pedido: det.pedido.idPedido,
            listo_para_recoger: false,
            cantidad: cantidadAvisada,
        };
    }
    async copiarPersonalizacionesDetalle(tx, desdeId, haciaId) {
        const pers = await tx.detPersonalizacion.findMany({
            where: { idDetalle: desdeId },
        });
        if (pers.length) {
            await tx.detPersonalizacion.createMany({
                data: pers.map((p) => ({
                    idDetalle: haciaId,
                    idOpcion: p.idOpcion,
                })),
            });
        }
    }
    async aplicarRecogidaParcial(det, cantidadRecoger) {
        if (cantidadRecoger < 1 || cantidadRecoger > det.cantidad) {
            throw new common_1.BadRequestException('Cantidad inválida');
        }
        if (cantidadRecoger === det.cantidad) {
            await this.prisma.detallePedido.update({
                where: { idDetalle: det.idDetalle },
                data: { listoCocina: true, listoParaRecoger: true },
            });
            return;
        }
        await this.prisma.$transaction(async (tx) => {
            const queda = det.cantidad - cantidadRecoger;
            await tx.detallePedido.update({
                where: { idDetalle: det.idDetalle },
                data: { cantidad: queda },
            });
            const nuevo = await tx.detallePedido.create({
                data: {
                    idPedido: det.idPedido,
                    idProducto: det.idProducto,
                    cantidad: cantidadRecoger,
                    precioUnitario: det.precioUnitario,
                    notaCocina: det.notaCocina,
                    enviadoCocina: det.enviadoCocina,
                    listoParaRecoger: true,
                    listoCocina: true,
                    idDetallePadre: det.idDetallePadre,
                    idFactura: det.idFactura,
                },
            });
            await this.copiarPersonalizacionesDetalle(tx, det.idDetalle, nuevo.idDetalle);
        });
    }
    async aplicarFaltaParcial(det, cantidadFalta) {
        if (cantidadFalta < 1 || cantidadFalta > det.cantidad) {
            throw new common_1.BadRequestException('Cantidad inválida');
        }
        if (cantidadFalta === det.cantidad) {
            await this.prisma.detallePedido.update({
                where: { idDetalle: det.idDetalle },
                data: { listoParaRecoger: false },
            });
            return cantidadFalta;
        }
        await this.prisma.$transaction(async (tx) => {
            const queda = det.cantidad - cantidadFalta;
            await tx.detallePedido.update({
                where: { idDetalle: det.idDetalle },
                data: { cantidad: queda },
            });
            const nuevo = await tx.detallePedido.create({
                data: {
                    idPedido: det.idPedido,
                    idProducto: det.idProducto,
                    cantidad: cantidadFalta,
                    precioUnitario: det.precioUnitario,
                    notaCocina: det.notaCocina,
                    enviadoCocina: det.enviadoCocina,
                    listoParaRecoger: false,
                    listoCocina: false,
                    idDetallePadre: det.idDetallePadre,
                    idFactura: det.idFactura,
                },
            });
            await this.copiarPersonalizacionesDetalle(tx, det.idDetalle, nuevo.idDetalle);
        });
        return cantidadFalta;
    }
    async llamarMesero(idPedido) {
        const pedido = await this.prisma.pedido.findUnique({
            where: { idPedido },
            include: {
                mesa: true,
                usuario: true,
                detalles: {
                    include: {
                        producto: { include: { categoria: true } },
                    },
                },
            },
        });
        if (!pedido) {
            throw new common_1.NotFoundException('Pedido no encontrado');
        }
        if (!ABIERTOS.includes(pedido.estado)) {
            throw new common_1.ConflictException('El pedido ya no está activo');
        }
        const aplicaLlamada = detalleAplicaLlamadaMesero;
        const pendientesMarcar = pedido.detalles.filter((d) => aplicaLlamada(d) && !d.listoParaRecoger);
        if (pendientesMarcar.length > 0) {
            await this.prisma.detallePedido.updateMany({
                where: {
                    idDetalle: { in: pendientesMarcar.map((d) => d.idDetalle) },
                },
                data: { listoParaRecoger: true },
            });
        }
        const lineasListas = pedido.detalles.filter((d) => aplicaLlamada(d));
        const { platos: platosListos, entradas: entradasListos } = conteoLlamaMesero(lineasListas);
        if (platosListos + entradasListos === 0) {
            throw new common_1.BadRequestException('No hay platos de cocina pendientes de recoger en este pedido');
        }
        const mesero = pedido.usuario;
        this.emit(idPedido, pedido.idMesa, pedido.idUsuario, pedido.idRestaurante);
        this.gateway.emitCocinaLlamaMesero({
            pedidoId: pedido.idPedido,
            mesaId: pedido.idMesa,
            mesaNumero: pedido.mesa.numero,
            idMesero: mesero.idUsuario,
            meseroNombre: `${mesero.nombre} ${mesero.apellido}`.trim(),
            platosListos,
            entradasListos,
            tipo_listo: tipoListoCocinaLlama(platosListos, entradasListos),
            at: new Date().toISOString(),
        }, pedido.idRestaurante);
        return {
            id_pedido: idPedido,
            platos_listos: platosListos,
            entradas_listos: entradasListos,
            marcados_ahora: pendientesMarcar.reduce((a, d) => a + d.cantidad, 0),
            mesero: {
                id: mesero.idUsuario,
                nombre: mesero.nombre,
                apellido: mesero.apellido,
            },
        };
    }
    async marcarDetalleCocina(idDetalle, dto) {
        return this.marcarDetalleRecogido(idDetalle, dto);
    }
    async pedidoActivoPorMesa(idMesa, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        await (0, tenant_scope_1.assertMesaDelTenant)(this.prisma, idMesa, tenantId);
        const previo = await this.prisma.pedido.findFirst({
            where: {
                idMesa,
                idRestaurante: tenantId,
                estado: { in: ABIERTOS },
            },
            orderBy: { idPedido: 'desc' },
            select: { idPedido: true },
        });
        if (!previo) {
            return null;
        }
        const p = await this.prisma.pedido.findFirst({
            where: {
                idMesa,
                idRestaurante: tenantId,
                estado: { in: ABIERTOS },
            },
            orderBy: { idPedido: 'desc' },
            include: {
                mesa: true,
                usuario: { include: { rol: true } },
                detalles: {
                    include: detalleInclude,
                    orderBy: { idDetalle: 'asc' },
                },
                facturas: facturasInclude,
            },
        });
        if (!p) {
            return null;
        }
        return this.serializarPedido(p);
    }
    async pedidosActivosPorMesa(idMesa, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        await (0, tenant_scope_1.assertMesaDelTenant)(this.prisma, idMesa, tenantId);
        const rows = await this.prisma.pedido.findMany({
            where: {
                idMesa,
                idRestaurante: tenantId,
                estado: { in: ABIERTOS },
            },
            orderBy: { creadoEn: 'asc' },
            take: operative_limits_1.OPERATIVE_PEDIDOS_MAX,
            include: {
                mesa: true,
                usuario: { include: { rol: true } },
                detalles: {
                    include: detalleInclude,
                    orderBy: { idDetalle: 'asc' },
                },
                facturas: facturasInclude,
            },
        });
        return rows.map((row) => this.serializarPedido(row));
    }
    async consolidarFragmentosPrecioPendientesPedido(idPedido) {
        const detalles = await this.prisma.detallePedido.findMany({
            where: { idPedido },
            include: {
                producto: {
                    select: {
                        precio: true,
                        esCuotaPendienteReparto: true,
                    },
                },
                personalizaciones: { select: { idOpcion: true } },
            },
            orderBy: { idDetalle: 'asc' },
        });
        if (detalles.length === 0)
            return false;
        const plan = (0, consolidar_fragmentos_precio_1.planConsolidarFragmentosPrecioPendientes)(detalles.map((d) => ({
            id_detalle: d.idDetalle,
            id_producto: d.idProducto,
            id_detalle_padre: d.idDetallePadre,
            id_factura: d.idFactura,
            cantidad: d.cantidad,
            precio_unitario: Number(d.precioUnitario),
            nota_cocina: d.notaCocina,
            enviado_cocina: d.enviadoCocina,
            listo_cocina: d.listoCocina,
            listo_para_recoger: d.listoParaRecoger,
            personalizacion_key: d.personalizaciones
                .map((p) => p.idOpcion)
                .sort((a, b) => a - b)
                .join(','),
            precio_catalogo: Number(d.producto.precio),
            es_cuota_pendiente_reparto: d.producto.esCuotaPendienteReparto,
        })));
        if (plan.length === 0)
            return false;
        await this.prisma.$transaction(async (tx) => {
            for (const m of plan) {
                if (m.deleteIds.length > 0) {
                    await tx.detallePedido.updateMany({
                        where: { idDetallePadre: { in: m.deleteIds } },
                        data: { idDetallePadre: m.keepId },
                    });
                    await tx.detPersonalizacion.deleteMany({
                        where: { idDetalle: { in: m.deleteIds } },
                    });
                    await tx.detallePedido.deleteMany({
                        where: { idDetalle: { in: m.deleteIds } },
                    });
                }
                await tx.detallePedido.update({
                    where: { idDetalle: m.keepId },
                    data: {
                        cantidad: m.cantidad,
                        precioUnitario: m.precio_unitario,
                        notaCocina: m.nota_cocina,
                    },
                });
            }
        });
        return true;
    }
    async obtenerPorId(idPedido, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        return this.obtenerPorIdCore(idPedido, false, tenantId);
    }
    async obtenerPorIdVistaOperativa(idPedido, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const p = await this.prisma.pedido.findFirst({
            where: { idPedido, idRestaurante: tenantId },
            include: {
                ...pedidos_vista_operativa_1.pedidoVistaOperativaInclude,
                facturas: { select: { idFactura: true } },
            },
        });
        if (!p) {
            throw new common_1.NotFoundException('Pedido no encontrado');
        }
        const op = await this.ctxOperativa(tenantId);
        return {
            ...(0, pedidos_vista_operativa_1.serializarPedidoVistaOperativa)(p, this.prioridadOptsFromOperativa(op)),
            facturas: p.facturas.map((f) => ({ id_factura: f.idFactura })),
        };
    }
    async obtenerPorIdTrasEscritura(idPedido, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const reparo = await this.consolidarFragmentosPrecioPendientesPedido(idPedido);
        return this.obtenerPorIdCore(idPedido, reparo, tenantId);
    }
    async obtenerPorIdCore(idPedido, reparo, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        let p = await this.prisma.pedido.findFirst({
            where: { idPedido, idRestaurante: tenantId },
            include: {
                mesa: true,
                usuario: { include: { rol: true } },
                detalles: {
                    include: detalleInclude,
                    orderBy: { idDetalle: 'asc' },
                },
                facturas: facturasInclude,
            },
        });
        if (!p) {
            throw new common_1.NotFoundException('Pedido no encontrado');
        }
        if (reparo) {
            this.emit(idPedido, p.idMesa, p.idUsuario, p.idRestaurante);
        }
        const op = await this.ctxOperativa(tenantId);
        const ctxMazorca = p.detalles.map((d) => ({
            es_bebida: (0, cocina_producto_1.categoriaEsBebida)(d.producto.categoria),
            es_acompanamiento_mazorca: d.producto.esAcompanamientoMazorca,
            es_empacable: d.producto.esEmpacable,
            categoria_nombre: d.producto.categoria.nombre,
            listo_para_recoger: d.listoParaRecoger,
            id_detalle_padre: d.idDetallePadre,
        }));
        const debeMz = (0, transferencia_pedido_1.pedidoDebeTenerLineaMazorca)(p.mesa.numero, ctxMazorca, op.mazorcaActiva);
        const tieneMz = p.detalles.some((d) => (0, mazorca_linea_pedido_1.esDetalleMazorcaAcompanamiento)(d.producto));
        if (tieneMz && !debeMz) {
            await this.prisma.$transaction(async (tx) => {
                await (0, mazorca_linea_pedido_1.sincronizarLineaMazorcaAcompanamiento)(tx, {
                    idPedido,
                    numComensales: p.numComensales,
                    mesaNumero: p.mesa.numero,
                    estadoPedido: p.estado,
                    usaLineaMazorca: false,
                    idProductoMazorca: op.idProductoMazorca,
                    idRestaurante: p.idRestaurante,
                });
            });
            p = await this.prisma.pedido.findUnique({
                where: { idPedido },
                include: {
                    mesa: true,
                    usuario: { include: { rol: true } },
                    detalles: {
                        include: detalleInclude,
                        orderBy: { idDetalle: 'asc' },
                    },
                    facturas: facturasInclude,
                },
            });
            if (!p) {
                throw new common_1.NotFoundException('Pedido no encontrado');
            }
        }
        const serialized = this.serializarPedido(p, this.prioridadOptsFromOperativa(op));
        const historialCuotas = await this.prisma.pedidoHistorial.findMany({
            where: { idPedido },
            select: { tipo: true, detalleJson: true },
        });
        const cuotas_plan_omitidas = (0, cuota_pendiente_reparto_1.listarCuotasPlanOmitidas)(serialized.detalles, historialCuotas.map((h) => ({
            tipo: h.tipo,
            detalle: h.detalleJson,
        })));
        const configRow = await this.obtenerConfigDescuentosRow(p.idRestaurante);
        const config = this.mapConfigDescuentos(configRow);
        const saldoPendienteRow = p.detalles.find((d) => d.idFactura == null && (0, saldo_restante_1.esNotaSaldoRestantePendiente)(d.notaCocina));
        const poolSaldo = saldoPendienteRow
            ? (0, saldo_restante_1.parseSaldoRestantePool)(saldoPendienteRow.notaCocina)
            : null;
        const idsPoolSaldo = poolSaldo != null ? new Set(poolSaldo.map((x) => x.id_detalle)) : null;
        const pendientesComida = p.detalles.filter((d) => {
            if (d.idFactura != null)
                return false;
            if ((0, saldo_restante_1.esNotaSaldoRestantePendiente)(d.notaCocina))
                return true;
            if ((d.notaCocina ?? '').trim().startsWith(saldo_restante_1.SALDO_ABONO_NOTA))
                return false;
            if (d.producto.esCuotaPendienteReparto)
                return false;
            if ((0, cuota_pendiente_reparto_1.parseCuotaPendienteNota)(d.notaCocina) != null)
                return false;
            if (d.producto.esAcompanamientoMazorca)
                return false;
            if (Math.round(Number(d.precioUnitario)) * d.cantidad <= 0)
                return false;
            if (saldoPendienteRow) {
                if (idsPoolSaldo == null)
                    return false;
                if (idsPoolSaldo.has(d.idDetalle))
                    return false;
            }
            return true;
        });
        const base = {
            ...serialized,
            cuotas_plan_omitidas,
            cobro_pendiente: {
                items: pendientesComida.length,
                subtotal: pendientesComida.reduce((s, d) => s + Number(d.precioUnitario) * d.cantidad, 0),
            },
        };
        if (pendientesComida.length > 0) {
            const lineas = this.lineasParaDescuento(pendientesComida.filter((d) => !(0, saldo_restante_1.esNotaSaldoRestantePendiente)(d.notaCocina)));
            const descPlatos = lineas.length > 0
                ? this.descuentosDesdeConfig(lineas, config, p)
                : {
                    descuento_sopas: 0,
                    descuento_muleros: 0,
                    descuento_promociones: 0,
                };
            return {
                ...base,
                descuentos_estimados: descPlatos,
            };
        }
        return base;
    }
    async setClienteMulero(idPedido, clienteMulero) {
        const pedido = await this.prisma.pedido.findUnique({
            where: { idPedido },
            include: { facturas: facturasInclude },
        });
        if (!pedido) {
            throw new common_1.NotFoundException('Pedido no encontrado');
        }
        if (pedido.estado === 'facturado') {
            throw new common_1.ConflictException('El pedido ya fue facturado');
        }
        if (!ABIERTOS.includes(pedido.estado)) {
            throw new common_1.ConflictException('El pedido no admite cambios');
        }
        await this.prisma.pedido.update({
            where: { idPedido },
            data: {
                clienteMulero,
                etiquetasPromocion: clienteMulero
                    ? [promociones_pedido_1.ETIQUETA_LEGACY_MULERO]
                    : [],
            },
        });
        this.emit(idPedido, pedido.idMesa, pedido.idUsuario, pedido.idRestaurante);
        return this.obtenerPorIdTrasEscritura(idPedido);
    }
    async setEtiquetasPromocion(idPedido, dto) {
        const pedido = await this.prisma.pedido.findUnique({
            where: { idPedido },
            include: { facturas: facturasInclude },
        });
        if (!pedido) {
            throw new common_1.NotFoundException('Pedido no encontrado');
        }
        if (pedido.estado === 'facturado') {
            throw new common_1.ConflictException('El pedido ya fue facturado');
        }
        if (!ABIERTOS.includes(pedido.estado)) {
            throw new common_1.ConflictException('El pedido no admite cambios');
        }
        const etiquetas = [...new Set(dto.etiquetas_promocion.map((x) => x.trim()).filter(Boolean))];
        const clienteMulero = dto.cliente_mulero ??
            etiquetas.includes(promociones_pedido_1.ETIQUETA_LEGACY_MULERO);
        await this.prisma.pedido.update({
            where: { idPedido },
            data: { etiquetasPromocion: etiquetas, clienteMulero },
        });
        this.emit(idPedido, pedido.idMesa, pedido.idUsuario, pedido.idRestaurante);
        return this.obtenerPorIdTrasEscritura(idPedido);
    }
    async actualizarComensalesPedido(idPedido, dto) {
        if (dto.num_comensales == null) {
            throw new common_1.BadRequestException('Indica num_comensales');
        }
        const pedido = await this.prisma.pedido.findUnique({
            where: { idPedido },
            include: { mesa: { select: { numero: true } } },
        });
        if (!pedido) {
            throw new common_1.NotFoundException('Pedido no encontrado');
        }
        if (!ABIERTOS.includes(pedido.estado)) {
            throw new common_1.ConflictException('El pedido no admite cambios');
        }
        const op = await this.ctxOperativa(pedido.idRestaurante);
        await this.prisma.$transaction(async (tx) => {
            await tx.pedido.update({
                where: { idPedido },
                data: { numComensales: dto.num_comensales },
            });
            await (0, mazorca_linea_pedido_1.sincronizarLineaMazorcaAcompanamiento)(tx, {
                idPedido,
                numComensales: dto.num_comensales,
                mesaNumero: pedido.mesa.numero,
                estadoPedido: pedido.estado,
                idProductoMazorca: op.idProductoMazorca,
                usaLineaMazorca: (0, mazorca_pedido_1.pedidoUsaLineaMazorca)(pedido.mesa.numero, op.mazorcaActiva),
                idRestaurante: pedido.idRestaurante,
            });
        });
        this.emit(idPedido, pedido.idMesa, pedido.idUsuario, pedido.idRestaurante);
        return this.obtenerPorIdTrasEscritura(idPedido);
    }
    async agregarDetalle(idPedido, dto, actor) {
        await this.exigirPermisoMesero(actor, 'agregar_items');
        const idUsuario = actor.idUsuario;
        const pedido = await this.prisma.pedido.findUnique({
            where: { idPedido },
        });
        if (!pedido) {
            throw new common_1.NotFoundException('Pedido no encontrado');
        }
        if (!ABIERTOS.includes(pedido.estado)) {
            throw new common_1.ConflictException('El pedido no admite más ítems');
        }
        const producto = await this.prisma.producto.findUnique({
            where: { idProducto: dto.id_producto },
            include: { categoria: true, subitems: { where: { activo: true } } },
        });
        if (!producto?.activo) {
            throw new common_1.BadRequestException('Producto no disponible');
        }
        if (producto.esAcompanamientoMazorca) {
            throw new common_1.BadRequestException('Las mazorcas de acompañamiento se ajustan con el número de comensales');
        }
        const dia = (0, timezone_1.weekdayBogota)();
        if (!(0, categoria_dia_1.categoriaDisponibleEnDia)(producto.categoria, dia)) {
            throw new common_1.BadRequestException('Este producto no está disponible en el menú de hoy');
        }
        const opcionIds = Array.isArray(dto.opcion_ids) ? dto.opcion_ids : [];
        const subitemsDto = Array.isArray(dto.subitems) ? dto.subitems : [];
        if (opcionIds.length) {
            const opts = await this.prisma.personalizacionOpcion.findMany({
                where: {
                    idProducto: dto.id_producto,
                    idOpcion: { in: opcionIds },
                },
            });
            if (opts.length !== opcionIds.length) {
                throw new common_1.BadRequestException('Alguna opción de personalización no pertenece al producto');
            }
        }
        let subitemsNormalizados = [];
        if (subitemsDto.length > 0 || producto.usaSubitemsRepartibles) {
            if (!producto.usaSubitemsRepartibles) {
                throw new common_1.BadRequestException('Este producto no acepta reparto por subítems');
            }
            if (subitemsDto.length === 0) {
                throw new common_1.BadRequestException('Debes asignar la cantidad entre los subítems del producto');
            }
            const sumaSubitems = subitemsDto.reduce((acc, item) => acc + item.cantidad, 0);
            if (sumaSubitems !== dto.cantidad) {
                throw new common_1.BadRequestException('La suma de subítems debe coincidir con la cantidad del producto');
            }
            const activos = new Map(producto.subitems.map((s) => [s.idSubitem, s]));
            const merged = new Map();
            for (const item of subitemsDto) {
                if (!activos.has(item.id_subitem)) {
                    throw new common_1.BadRequestException('Algún subítem no pertenece al producto');
                }
                merged.set(item.id_subitem, (merged.get(item.id_subitem) ?? 0) + item.cantidad);
            }
            subitemsNormalizados = [...merged.entries()].map(([idSubitem, cantidad]) => ({
                idSubitem,
                cantidad,
            }));
        }
        const opcionIdsOrdenados = [...opcionIds].sort((a, b) => a - b);
        const candidatosFusion = producto.usaSubitemsRepartibles
            ? []
            : await this.prisma.detallePedido.findMany({
                where: {
                    idPedido,
                    idProducto: dto.id_producto,
                    idDetallePadre: null,
                    enviadoCocina: false,
                    listoCocina: false,
                    listoParaRecoger: false,
                    idFactura: null,
                    notaCocina: dto.nota_cocina?.trim() ? dto.nota_cocina.trim() : null,
                },
                include: { personalizaciones: true },
            });
        const fusion = candidatosFusion.find((c) => {
            const ids = c.personalizaciones
                .map((p) => p.idOpcion)
                .sort((a, b) => a - b);
            return (ids.length === opcionIdsOrdenados.length &&
                ids.every((id, i) => id === opcionIdsOrdenados[i]));
        });
        if (fusion) {
            const sinEmpaqueFusion = dto.sin_empaque_auto === true;
            const debeAutoEmpaqueFusion = pedido.modoServicio === 'para_llevar' &&
                (0, empaque_para_llevar_1.productoCobraEmpaqueParaLlevarPorPlatoFuerte)({
                    esPlatoPrincipal: producto.esPlatoPrincipal,
                    esEmpacable: producto.esEmpacable,
                    categoria: producto.categoria,
                }) &&
                !sinEmpaqueFusion;
            if (debeAutoEmpaqueFusion) {
                const opFusion = await this.ctxOperativa(pedido.idRestaurante);
                await this.prisma.$transaction(async (tx) => {
                    await this.asegurarEmpaqueAutoParaDetallePadreTx(tx, fusion.idDetalle, opFusion.precioEmpaque, idUsuario);
                });
            }
            return this.actualizarCantidadDetalle(fusion.idDetalle, { cantidad: fusion.cantidad + dto.cantidad }, actor);
        }
        const sinEmpaque = dto.sin_empaque_auto === true;
        const debeAutoEmpaque = pedido.modoServicio === 'para_llevar' &&
            (0, empaque_para_llevar_1.productoCobraEmpaqueParaLlevarPorPlatoFuerte)({
                esPlatoPrincipal: producto.esPlatoPrincipal,
                esEmpacable: producto.esEmpacable,
                categoria: producto.categoria,
            }) &&
            !sinEmpaque;
        const lineasAgregadas = [];
        const op = await this.ctxOperativa(pedido.idRestaurante);
        await this.prisma.$transaction(async (tx) => {
            await (0, stock_bebida_1.descontarStockBebidaTx)(tx, producto, dto.cantidad);
            const d = await tx.detallePedido.create({
                data: {
                    idPedido,
                    idProducto: dto.id_producto,
                    cantidad: dto.cantidad,
                    precioUnitario: producto.precio,
                    notaCocina: dto.nota_cocina ?? null,
                },
            });
            if (opcionIds.length) {
                await tx.detPersonalizacion.createMany({
                    data: opcionIds.map((idOpcion) => ({
                        idDetalle: d.idDetalle,
                        idOpcion,
                    })),
                });
            }
            if (subitemsNormalizados.length > 0) {
                await tx.detSubitemCantidad.createMany({
                    data: subitemsNormalizados.map((item) => ({
                        idDetalle: d.idDetalle,
                        idSubitem: item.idSubitem,
                        cantidad: item.cantidad,
                    })),
                });
            }
            lineasAgregadas.push({
                id_detalle: d.idDetalle,
                nombre_producto: producto.nombre,
                cantidad: dto.cantidad,
            });
            if (debeAutoEmpaque) {
                const emp = await tx.producto.findFirst({
                    where: { esEmpacable: true, activo: true },
                    orderBy: { idProducto: 'asc' },
                });
                if (!emp) {
                    throw new common_1.BadRequestException('No hay producto empacable configurado en el catálogo');
                }
                const e = await tx.detallePedido.create({
                    data: {
                        idPedido,
                        idProducto: emp.idProducto,
                        cantidad: dto.cantidad,
                        precioUnitario: (0, empaque_para_llevar_1.precioEmpaqueParaLlevarDecimal)(op.precioEmpaque),
                        idDetallePadre: d.idDetalle,
                    },
                });
                lineasAgregadas.push({
                    id_detalle: e.idDetalle,
                    nombre_producto: emp.nombre,
                    cantidad: dto.cantidad,
                });
            }
            await tx.pedidoHistorial.create({
                data: {
                    idPedido,
                    idUsuario,
                    tipo: 'detalle_agregado',
                    detalleJson: { lineas: lineasAgregadas },
                },
            });
            if (productoDebePasarCocina(producto)) {
                const mesa = await tx.mesa.findUnique({
                    where: { idMesa: pedido.idMesa },
                    select: { numero: true },
                });
                if (mesa) {
                    const todos = await tx.detallePedido.findMany({
                        where: { idPedido },
                        include: { producto: { include: { categoria: true } } },
                    });
                    const ctx = todos.map((d) => ({
                        es_bebida: (0, cocina_producto_1.categoriaEsBebida)(d.producto.categoria),
                        es_acompanamiento_mazorca: d.producto.esAcompanamientoMazorca,
                        es_empacable: d.producto.esEmpacable,
                        categoria_nombre: d.producto.categoria.nombre,
                        listo_para_recoger: d.listoParaRecoger,
                        id_detalle_padre: d.idDetallePadre,
                    }));
                    await (0, mazorca_linea_pedido_1.sincronizarLineaMazorcaAcompanamiento)(tx, {
                        idPedido,
                        numComensales: pedido.numComensales,
                        mesaNumero: mesa.numero,
                        estadoPedido: pedido.estado,
                        idProductoMazorca: op.idProductoMazorca,
                        usaLineaMazorca: (0, transferencia_pedido_1.pedidoDebeTenerLineaMazorca)(mesa.numero, ctx, op.mazorcaActiva),
                        idRestaurante: pedido.idRestaurante,
                    });
                }
            }
        });
        await this.notificarCompaneroModificoPedido(pedido, idUsuario, lineasAgregadas, 'agregado');
        this.emit(idPedido, pedido.idMesa, pedido.idUsuario, pedido.idRestaurante);
        return this.obtenerPorIdTrasEscritura(idPedido);
    }
    async eliminarDetalle(idDetalle, actor) {
        const idUsuario = actor.idUsuario;
        const det = await this.prisma.detallePedido.findUnique({
            where: { idDetalle },
            include: { pedido: true, producto: { include: { categoria: true } } },
        });
        if (!det) {
            throw new common_1.NotFoundException('Línea no encontrada');
        }
        const permisoQuitar = det.producto.esEmpacable && det.idDetallePadre != null
            ? 'editar_cantidades'
            : 'quitar_lineas';
        await this.exigirPermisoMesero(actor, permisoQuitar);
        if (!ABIERTOS.includes(det.pedido.estado)) {
            throw new common_1.ConflictException('El pedido no admite cambios en las líneas');
        }
        if ((0, mazorca_linea_pedido_1.esDetalleMazorcaAcompanamiento)(det.producto)) {
            throw new common_1.BadRequestException('La línea de mazorca se ajusta con el número de comensales');
        }
        const mesaId = det.pedido.idMesa;
        const pedidoId = det.pedido.idPedido;
        const hijos = det.idDetallePadre == null
            ? await this.prisma.detallePedido.findMany({
                where: { idDetallePadre: idDetalle },
                include: { producto: true },
            })
            : [];
        const lineas = [
            {
                id_detalle: det.idDetalle,
                nombre_producto: det.producto.nombre,
                cantidad: det.cantidad,
            },
            ...hijos.map((h) => ({
                id_detalle: h.idDetalle,
                nombre_producto: h.producto.nombre,
                cantidad: h.cantidad,
            })),
        ];
        await this.prisma.$transaction(async (tx) => {
            await (0, stock_bebida_1.reintegrarStockBebidaTx)(tx, det.producto, det.cantidad);
            await tx.pedidoHistorial.create({
                data: {
                    idPedido: pedidoId,
                    idUsuario,
                    tipo: 'detalle_eliminado',
                    detalleJson: { lineas },
                },
            });
            await tx.detallePedido.delete({ where: { idDetalle } });
        });
        await this.notificarCompaneroModificoPedido(det.pedido, idUsuario, [{ nombre_producto: det.producto.nombre, cantidad: det.cantidad }], 'quitado');
        this.emit(pedidoId, mesaId, det.pedido.idUsuario, det.pedido.idRestaurante);
        return this.obtenerPorIdTrasEscritura(pedidoId);
    }
    async actualizarCantidadDetalle(idDetalle, dto, actor) {
        await this.exigirPermisoMesero(actor, 'editar_cantidades');
        const idUsuario = actor.idUsuario;
        const det = await this.prisma.detallePedido.findUnique({
            where: { idDetalle },
            include: {
                pedido: true,
                producto: { include: { categoria: true } },
            },
        });
        if (!det) {
            throw new common_1.NotFoundException('Línea no encontrada');
        }
        if (!ABIERTOS.includes(det.pedido.estado)) {
            throw new common_1.ConflictException('El pedido no admite cambios en las líneas');
        }
        if ((0, mazorca_linea_pedido_1.esDetalleMazorcaAcompanamiento)(det.producto)) {
            throw new common_1.BadRequestException('La cantidad de mazorcas se ajusta con el número de comensales');
        }
        const cantidad = dto.cantidad;
        if (det.cantidad === cantidad) {
            return this.obtenerPorIdTrasEscritura(det.pedido.idPedido);
        }
        if (det.producto.esEmpacable && det.idDetallePadre != null) {
            const padre = await this.prisma.detallePedido.findUnique({
                where: { idDetalle: det.idDetallePadre },
            });
            if (!padre) {
                throw new common_1.BadRequestException('Línea de plato padre no encontrada');
            }
            if (cantidad > padre.cantidad) {
                throw new common_1.BadRequestException(`El empaque no puede superar la cantidad del plato (${padre.cantidad})`);
            }
            if (cantidad < 1) {
                throw new common_1.BadRequestException('Usa quitar línea para eliminar el empaque por completo');
            }
            await this.prisma.$transaction(async (tx) => {
                await tx.detallePedido.update({
                    where: { idDetalle },
                    data: { cantidad },
                });
                await tx.pedidoHistorial.create({
                    data: {
                        idPedido: det.pedido.idPedido,
                        idUsuario,
                        tipo: 'cantidad_actualizada',
                        detalleJson: {
                            id_detalle: idDetalle,
                            nombre_producto: det.producto.nombre,
                            cantidad_anterior: det.cantidad,
                            cantidad_nueva: cantidad,
                            empaque_manual: true,
                        },
                    },
                });
            });
            this.emit(det.pedido.idPedido, det.pedido.idMesa, det.pedido.idUsuario, det.pedido.idRestaurante);
            return this.obtenerPorIdTrasEscritura(det.pedido.idPedido);
        }
        const marcarCocina = productoDebePasarCocina(det.producto);
        if (cantidad > det.cantidad && det.enviadoCocina && marcarCocina) {
            const delta = cantidad - det.cantidad;
            const hijosEmpaque = await this.prisma.detallePedido.findMany({
                where: { idDetallePadre: idDetalle },
            });
            const personalizaciones = await this.prisma.detPersonalizacion.findMany({
                where: { idDetalle },
            });
            await this.prisma.$transaction(async (tx) => {
                await (0, stock_bebida_1.descontarStockBebidaTx)(tx, det.producto, delta);
                const nuevo = await tx.detallePedido.create({
                    data: {
                        idPedido: det.pedido.idPedido,
                        idProducto: det.idProducto,
                        cantidad: delta,
                        precioUnitario: det.precioUnitario,
                        notaCocina: det.notaCocina,
                        enviadoCocina: false,
                        listoCocina: false,
                        listoParaRecoger: false,
                    },
                });
                if (personalizaciones.length) {
                    await tx.detPersonalizacion.createMany({
                        data: personalizaciones.map((p) => ({
                            idDetalle: nuevo.idDetalle,
                            idOpcion: p.idOpcion,
                        })),
                    });
                }
                for (const h of hijosEmpaque) {
                    await tx.detallePedido.create({
                        data: {
                            idPedido: det.pedido.idPedido,
                            idProducto: h.idProducto,
                            cantidad: delta,
                            precioUnitario: h.precioUnitario,
                            idDetallePadre: nuevo.idDetalle,
                            enviadoCocina: false,
                            listoCocina: false,
                            listoParaRecoger: false,
                        },
                    });
                }
                await tx.pedidoHistorial.create({
                    data: {
                        idPedido: det.pedido.idPedido,
                        idUsuario,
                        tipo: 'detalle_agregado',
                        detalleJson: {
                            lineas: [
                                {
                                    id_detalle: nuevo.idDetalle,
                                    nombre_producto: det.producto.nombre,
                                    cantidad: delta,
                                    motivo: 'unidades_adicionales_pendientes_cocina',
                                },
                            ],
                        },
                    },
                });
            });
            await this.notificarCompaneroModificoPedido(det.pedido, idUsuario, [
                { nombre_producto: det.producto.nombre, cantidad: delta },
            ], 'agregado');
            this.emit(det.pedido.idPedido, det.pedido.idMesa, det.pedido.idUsuario, det.pedido.idRestaurante);
            return this.obtenerPorIdTrasEscritura(det.pedido.idPedido);
        }
        if (cantidad > det.cantidad) {
            await this.notificarCompaneroModificoPedido(det.pedido, idUsuario, [
                {
                    nombre_producto: det.producto.nombre,
                    cantidad: cantidad - det.cantidad,
                },
            ], 'agregado');
        }
        else if (cantidad < det.cantidad) {
            await this.notificarCompaneroModificoPedido(det.pedido, idUsuario, [
                {
                    nombre_producto: det.producto.nombre,
                    cantidad: det.cantidad - cantidad,
                },
            ], 'reducido');
        }
        const hijosPre = det.idDetallePadre == null
            ? await this.prisma.detallePedido.findMany({
                where: { idDetallePadre: idDetalle },
            })
            : [];
        await this.prisma.$transaction(async (tx) => {
            await (0, stock_bebida_1.ajustarStockBebidaTx)(tx, det.producto, cantidad - det.cantidad);
            await tx.detallePedido.update({
                where: { idDetalle },
                data: { cantidad },
            });
            if (det.idDetallePadre == null) {
                const hijos = await tx.detallePedido.findMany({
                    where: { idDetallePadre: idDetalle },
                    include: { producto: true },
                });
                for (const h of hijos) {
                    const nuevaCant = h.producto.esEmpacable
                        ? (0, empaque_para_llevar_2.nuevaCantidadEmpaqueTrasCambioPadre)(h.cantidad, det.cantidad, cantidad)
                        : cantidad;
                    if (nuevaCant !== h.cantidad) {
                        await tx.detallePedido.update({
                            where: { idDetalle: h.idDetalle },
                            data: { cantidad: nuevaCant },
                        });
                    }
                }
            }
            await tx.pedidoHistorial.create({
                data: {
                    idPedido: det.pedido.idPedido,
                    idUsuario,
                    tipo: 'cantidad_actualizada',
                    detalleJson: {
                        id_detalle: idDetalle,
                        nombre_producto: det.producto.nombre,
                        cantidad_anterior: det.cantidad,
                        cantidad_nueva: cantidad,
                        empaques_vinculados_sincronizados: det.idDetallePadre == null && hijosPre.length > 0,
                    },
                },
            });
        });
        this.emit(det.pedido.idPedido, det.pedido.idMesa, det.pedido.idUsuario, det.pedido.idRestaurante);
        return this.obtenerPorIdTrasEscritura(det.pedido.idPedido);
    }
    async asegurarEmpaqueAutoParaDetallePadreTx(tx, idDetallePadre, precioEmpaque, idUsuario) {
        const padre = await tx.detallePedido.findUnique({
            where: { idDetalle: idDetallePadre },
            include: {
                pedido: true,
                producto: { include: { categoria: true } },
            },
        });
        if (!padre || padre.pedido.modoServicio !== 'para_llevar') {
            return { creado: false };
        }
        if (padre.idDetallePadre != null) {
            throw new common_1.BadRequestException('Solo aplica a líneas de plato');
        }
        if (!(0, empaque_para_llevar_1.productoCobraEmpaqueParaLlevarPorPlatoFuerte)({
            esPlatoPrincipal: padre.producto.esPlatoPrincipal,
            esEmpacable: padre.producto.esEmpacable,
            categoria: padre.producto.categoria,
        })) {
            throw new common_1.BadRequestException('Este ítem no lleva empaque automático');
        }
        const hijos = await tx.detallePedido.findMany({
            where: { idDetallePadre },
            include: { producto: true },
        });
        const empHijo = hijos.find((h) => h.producto.esEmpacable);
        if (empHijo) {
            return { creado: false, id_detalle_empaque: empHijo.idDetalle };
        }
        const emp = await tx.producto.findFirst({
            where: { esEmpacable: true, activo: true },
            orderBy: { idProducto: 'asc' },
        });
        if (!emp) {
            throw new common_1.BadRequestException('No hay producto empacable configurado en el catálogo');
        }
        const e = await tx.detallePedido.create({
            data: {
                idPedido: padre.idPedido,
                idProducto: emp.idProducto,
                cantidad: padre.cantidad,
                precioUnitario: (0, empaque_para_llevar_1.precioEmpaqueParaLlevarDecimal)(precioEmpaque),
                idDetallePadre: padre.idDetalle,
            },
        });
        await tx.pedidoHistorial.create({
            data: {
                idPedido: padre.idPedido,
                idUsuario,
                tipo: 'detalle_agregado',
                detalleJson: {
                    empaque_auto: true,
                    id_detalle_padre: padre.idDetalle,
                    id_detalle_empaque: e.idDetalle,
                    nombre_producto: padre.producto.nombre,
                    cantidad: padre.cantidad,
                },
            },
        });
        return { creado: true, id_detalle_empaque: e.idDetalle };
    }
    async agregarEmpaqueAutoDetalle(idDetalle, actor) {
        await this.exigirPermisoMesero(actor, 'editar_cantidades');
        const idUsuario = actor?.idUsuario ?? 0;
        const det = await this.prisma.detallePedido.findUnique({
            where: { idDetalle },
            include: { pedido: true },
        });
        if (!det) {
            throw new common_1.NotFoundException('Detalle no encontrado');
        }
        const op = await this.ctxOperativa(det.pedido.idRestaurante);
        let creado = false;
        await this.prisma.$transaction(async (tx) => {
            const r = await this.asegurarEmpaqueAutoParaDetallePadreTx(tx, idDetalle, op.precioEmpaque, idUsuario);
            creado = r.creado;
        });
        this.emit(det.pedido.idPedido, det.pedido.idMesa, det.pedido.idUsuario, det.pedido.idRestaurante);
        return {
            ok: true,
            creado,
            pedido: await this.obtenerPorIdTrasEscritura(det.pedido.idPedido, det.pedido.idRestaurante),
        };
    }
    async sincronizarEmpaquesParaLlevar(idPedido, actor) {
        await this.exigirPermisoMesero(actor, 'editar_cantidades');
        const idUsuario = actor?.idUsuario ?? 0;
        const pedido = await this.prisma.pedido.findUnique({
            where: { idPedido },
            include: {
                detalles: {
                    include: { producto: { include: { categoria: true } } },
                    orderBy: { idDetalle: 'asc' },
                },
            },
        });
        if (!pedido) {
            throw new common_1.NotFoundException('Pedido no encontrado');
        }
        if (pedido.modoServicio !== 'para_llevar') {
            throw new common_1.BadRequestException('Solo aplica a pedidos para llevar');
        }
        const op = await this.ctxOperativa(pedido.idRestaurante);
        let empaquesCreados = 0;
        let unidadesAgregadas = 0;
        const detallesResumen = pedido.detalles.map((d) => ({
            id_detalle: d.idDetalle,
            id_detalle_padre: d.idDetallePadre,
            cantidad: d.cantidad,
            es_empacable: d.producto.esEmpacable,
            es_plato_principal: d.producto.esPlatoPrincipal,
            categoria: d.producto.categoria,
        }));
        await this.prisma.$transaction(async (tx) => {
            for (const p of pedido.detalles) {
                if (p.idDetallePadre != null)
                    continue;
                if (!(0, empaque_para_llevar_1.productoCobraEmpaqueParaLlevarPorPlatoFuerte)({
                    esPlatoPrincipal: p.producto.esPlatoPrincipal,
                    esEmpacable: p.producto.esEmpacable,
                    categoria: p.producto.categoria,
                })) {
                    continue;
                }
                const faltante = (0, empaque_para_llevar_2.empaqueFaltanteEnDetallePadre)({
                    id_detalle: p.idDetalle,
                    id_detalle_padre: p.idDetallePadre,
                    cantidad: p.cantidad,
                    es_plato_principal: p.producto.esPlatoPrincipal,
                    categoria: p.producto.categoria,
                }, detallesResumen);
                if (faltante <= 0)
                    continue;
                const hijos = await tx.detallePedido.findMany({
                    where: { idDetallePadre: p.idDetalle },
                    include: { producto: true },
                });
                const empHijo = hijos.find((h) => h.producto.esEmpacable);
                if (empHijo) {
                    await tx.detallePedido.update({
                        where: { idDetalle: empHijo.idDetalle },
                        data: { cantidad: empHijo.cantidad + faltante },
                    });
                    const idx = detallesResumen.findIndex((d) => d.id_detalle === empHijo.idDetalle);
                    if (idx >= 0) {
                        detallesResumen[idx].cantidad += faltante;
                    }
                    unidadesAgregadas += faltante;
                    continue;
                }
                const emp = await tx.producto.findFirst({
                    where: { esEmpacable: true, activo: true },
                    include: { categoria: true },
                    orderBy: { idProducto: 'asc' },
                });
                if (!emp) {
                    throw new common_1.BadRequestException('No hay producto empacable configurado en el catálogo');
                }
                const e = await tx.detallePedido.create({
                    data: {
                        idPedido: pedido.idPedido,
                        idProducto: emp.idProducto,
                        cantidad: faltante,
                        precioUnitario: (0, empaque_para_llevar_1.precioEmpaqueParaLlevarDecimal)(op.precioEmpaque),
                        idDetallePadre: p.idDetalle,
                    },
                });
                await tx.pedidoHistorial.create({
                    data: {
                        idPedido: pedido.idPedido,
                        idUsuario,
                        tipo: 'detalle_agregado',
                        detalleJson: {
                            empaque_auto: true,
                            id_detalle_padre: p.idDetalle,
                            id_detalle_empaque: e.idDetalle,
                            nombre_producto: p.producto.nombre,
                            cantidad: faltante,
                        },
                    },
                });
                empaquesCreados++;
                unidadesAgregadas += faltante;
                detallesResumen.push({
                    id_detalle: e.idDetalle,
                    id_detalle_padre: p.idDetalle,
                    cantidad: faltante,
                    es_empacable: true,
                    es_plato_principal: false,
                    categoria: emp.categoria,
                });
            }
        });
        this.emit(pedido.idPedido, pedido.idMesa, pedido.idUsuario, pedido.idRestaurante);
        return {
            ok: true,
            empaques_creados: empaquesCreados,
            unidades_agregadas: unidadesAgregadas,
            pedido: await this.obtenerPorIdTrasEscritura(idPedido),
        };
    }
    async historialPedido(idPedido) {
        const existe = await this.prisma.pedido.findUnique({
            where: { idPedido },
            select: { idPedido: true },
        });
        if (!existe) {
            throw new common_1.NotFoundException('Pedido no encontrado');
        }
        const rows = await this.prisma.pedidoHistorial.findMany({
            where: { idPedido },
            include: { usuario: true },
            orderBy: { creadoEn: 'desc' },
        });
        return rows.map((h) => ({
            id_historial: h.idHistorial,
            tipo: h.tipo,
            detalle: h.detalleJson,
            creado_en: h.creadoEn,
            usuario: {
                id: h.usuario.idUsuario,
                nombre: h.usuario.nombre,
                apellido: h.usuario.apellido,
            },
        }));
    }
    async pasarCocina(idPedido, actor) {
        await this.exigirPermisoMesero(actor, 'enviar_cocina');
        const pedido = await this.prisma.pedido.findUnique({
            where: { idPedido },
            include: {
                mesa: true,
                usuario: { include: { rol: true } },
                detalles: {
                    include: detalleInclude,
                    orderBy: { idDetalle: 'asc' },
                },
                facturas: facturasInclude,
            },
        });
        if (!pedido) {
            throw new common_1.NotFoundException('Pedido no encontrado');
        }
        if (pedido.estado === 'facturado') {
            throw new common_1.ConflictException('El pedido ya fue facturado');
        }
        if (!ABIERTOS.includes(pedido.estado)) {
            throw new common_1.ConflictException('El pedido no admite envío a cocina');
        }
        if (pedido.detalles.length === 0) {
            throw new common_1.BadRequestException('Agrega ítems al pedido antes de enviar a cocina');
        }
        const pendientes = pedido.detalles.filter((d) => productoDebePasarCocina(d.producto) && !d.enviadoCocina);
        if (pendientes.length === 0) {
            throw new common_1.BadRequestException('No hay platos nuevos para cocina (las bebidas solo se cobran al final)');
        }
        const esAdicional = pedido.detalles.some((d) => productoDebePasarCocina(d.producto) && d.enviadoCocina);
        const idsPendientes = pendientes.map((d) => d.idDetalle);
        const emitidaEn = new Date();
        await this.prisma.$transaction(async (tx) => {
            await tx.detallePedido.updateMany({
                where: { idDetalle: { in: idsPendientes } },
                data: { enviadoCocina: true, enviadoCocinaEn: emitidaEn },
            });
            if (pedido.estado === 'abierto') {
                await tx.pedido.update({
                    where: { idPedido },
                    data: { estado: 'en_cocina' },
                });
            }
        });
        const lineas = pendientes.map((d) => ({
            id_detalle: d.idDetalle,
            cantidad: d.cantidad,
            nombre_producto: d.producto.nombre,
            nota_cocina: d.notaCocina,
            personalizaciones: [
                ...formatSubitemsDetalle(d.subitems),
                ...d.personalizaciones.map((dp) => dp.opcion.descripcion),
            ],
        }));
        const comanda = this.construirTicketComanda(pedido, pendientes, {
            esAdicional,
            emitidaEn,
        });
        if (pedido.estado === 'abierto') {
            pedido.estado = 'en_cocina';
        }
        for (const d of pendientes) {
            d.enviadoCocina = true;
        }
        const pedidoSerializado = this.serializarPedido(pedido);
        this.emit(idPedido, pedido.idMesa, pedido.idUsuario, pedido.idRestaurante);
        const impresion = this.encolarImpresionComanda(comanda, idPedido);
        return {
            ok: true,
            es_adicional: esAdicional,
            comanda,
            impreso: impresion.impreso,
            impresion_en_cola: impresion.en_cola ?? false,
            impresora_destino: impresion.destino ?? null,
            error_impresion: impresion.error ?? null,
            codigo_error_impresion: impresion.codigo_error ?? null,
            pedido: pedidoSerializado,
        };
    }
    pruebaImpresora() {
        return this.comandaPrinter.imprimirPrueba().then((res) => {
            this.emitirAlertaImpresora(res, 'prueba');
            return res;
        });
    }
    async reimprimirComanda(idPedido, actor) {
        await this.exigirPermisoMesero(actor, 'reimprimir_comanda', {
            permitirChef: true,
        });
        const pedido = await this.prisma.pedido.findUnique({
            where: { idPedido },
            include: {
                mesa: true,
                usuario: true,
                detalles: {
                    include: detalleInclude,
                    orderBy: { idDetalle: 'asc' },
                },
            },
        });
        if (!pedido) {
            throw new common_1.NotFoundException('Pedido no encontrado');
        }
        const enviados = pedido.detalles.filter((d) => productoDebePasarCocina(d.producto) && d.enviadoCocina);
        if (enviados.length === 0) {
            throw new common_1.BadRequestException('No hay platos enviados a cocina para reimprimir');
        }
        const comanda = this.construirTicketComanda(pedido, enviados, {
            esReimpresion: true,
        });
        const impresion = await this.comandaPrinter.imprimirComanda(comanda);
        this.emitirAlertaImpresora(impresion, 'comanda', idPedido);
        return {
            ok: true,
            id_pedido: idPedido,
            lineas: comanda.lineas.length,
            es_adicional: false,
            impresion_comanda: impresion,
        };
    }
    async enviarFacturaCorreo(idPedido, idFactura, email, actor) {
        await this.exigirPermisoMesero(actor, 'cobrar');
        const completo = await this.obtenerPorIdTrasEscritura(idPedido);
        const facturas = completo.facturas ?? [];
        if (facturas.length === 0) {
            throw new common_1.ConflictException('Este pedido no tiene facturas; no se puede enviar por correo');
        }
        const target = idFactura != null
            ? facturas.find((f) => f.id_factura === idFactura)
            : facturas[facturas.length - 1];
        if (!target) {
            throw new common_1.NotFoundException('Factura no encontrada en este pedido');
        }
        const ticket = this.construirTicketFactura(completo, target.id_factura, false);
        const envio = await this.facturaEmail.enviarFactura(ticket, email);
        if (!envio.enviado) {
            throw new common_1.BadRequestException(envio.error ?? 'No se pudo enviar el correo');
        }
        return {
            ok: true,
            id_pedido: idPedido,
            id_factura: target.id_factura,
            email: envio.email,
            mensaje: `Factura enviada a ${envio.email}`,
        };
    }
    async reimprimirFactura(idPedido, idFactura, actor) {
        await this.exigirPermisoMesero(actor, 'reimprimir_factura');
        const completo = await this.obtenerPorIdTrasEscritura(idPedido);
        const facturas = completo.facturas ?? [];
        if (facturas.length === 0) {
            throw new common_1.ConflictException('Este pedido no tiene facturas; no se puede reimprimir');
        }
        const target = idFactura != null
            ? facturas.find((f) => f.id_factura === idFactura)
            : facturas[facturas.length - 1];
        if (!target) {
            throw new common_1.NotFoundException('Factura no encontrada en este pedido');
        }
        const ticket = this.construirTicketFactura(completo, target.id_factura, true);
        const impresion = await this.comandaPrinter.imprimirFactura(ticket);
        this.emitirAlertaImpresora(impresion, 'factura', idPedido);
        return {
            ok: true,
            id_pedido: idPedido,
            id_factura: target.id_factura,
            impresion_factura: impresion,
        };
    }
    async reimprimirPedidoTotal(idPedido) {
        const completo = await this.obtenerPorIdTrasEscritura(idPedido);
        if (completo.estado !== 'facturado') {
            throw new common_1.BadRequestException('El pedido aún no está pagado por completo');
        }
        const facturas = completo.facturas ?? [];
        if (facturas.length === 0) {
            throw new common_1.ConflictException('Este pedido no tiene facturas');
        }
        const ticket = this.construirTicketPedidoTotal(completo, true);
        const impresion = await this.comandaPrinter.imprimirFactura(ticket);
        this.emitirAlertaImpresora(impresion, 'factura', idPedido);
        return {
            ok: true,
            id_pedido: idPedido,
            num_cobros: facturas.length,
            impresion_factura: impresion,
        };
    }
    async ticketComandaParaVistaPrevia(idPedido, opts = {}) {
        const pedido = await this.prisma.pedido.findUnique({
            where: { idPedido },
            include: {
                mesa: true,
                usuario: true,
                detalles: {
                    include: detalleInclude,
                    orderBy: { idDetalle: 'asc' },
                },
            },
        });
        if (!pedido) {
            throw new common_1.NotFoundException('Pedido no encontrado');
        }
        const cocinaEnviados = pedido.detalles.filter((d) => productoDebePasarCocina(d.producto) && d.enviadoCocina);
        if (cocinaEnviados.length === 0) {
            throw new common_1.BadRequestException('No hay platos enviados a cocina para previsualizar');
        }
        if (opts.idDetalles?.length) {
            const ids = new Set(opts.idDetalles);
            const detalles = pedido.detalles.filter((d) => ids.has(d.idDetalle));
            if (detalles.length === 0) {
                throw new common_1.BadRequestException('Detalles no encontrados en el pedido');
            }
            const esAdicional = pedido.detalles.some((d) => productoDebePasarCocina(d.producto) &&
                d.enviadoCocina &&
                !ids.has(d.idDetalle));
            return this.construirTicketComanda(pedido, detalles, { esAdicional });
        }
        const modo = opts.modo ?? 'ultimo_envio';
        if (modo === 'reimpresion') {
            return this.construirTicketComanda(pedido, cocinaEnviados, {
                esReimpresion: true,
            });
        }
        if (modo === 'completa') {
            return this.construirTicketComanda(pedido, cocinaEnviados);
        }
        const conMarca = cocinaEnviados.filter((d) => d.enviadoCocinaEn);
        if (conMarca.length === 0) {
            return this.construirTicketComanda(pedido, cocinaEnviados);
        }
        const maxTs = Math.max(...conMarca.map((d) => d.enviadoCocinaEn.getTime()));
        const ultimoLote = conMarca.filter((d) => d.enviadoCocinaEn.getTime() === maxTs);
        const esAdicional = conMarca.some((d) => d.enviadoCocinaEn.getTime() < maxTs);
        return this.construirTicketComanda(pedido, ultimoLote, { esAdicional });
    }
    async ticketFacturaParaVistaPrevia(idFactura, esReimpresion = false) {
        const factura = await this.prisma.factura.findUnique({
            where: { idFactura },
            select: { idPedido: true },
        });
        if (!factura) {
            throw new common_1.NotFoundException('Factura no encontrada');
        }
        const completo = await this.obtenerPorIdTrasEscritura(factura.idPedido);
        return this.construirTicketFactura(completo, idFactura, esReimpresion);
    }
    async ticketPrecuentaParaVistaPrevia(idPedido, dto) {
        return this.construirTicketPrecuentaDesdeDto(idPedido, dto);
    }
    async ticketPedidoTotalParaVistaPrevia(idPedido) {
        const completo = await this.obtenerPorIdTrasEscritura(idPedido);
        if ((completo.facturas ?? []).length === 0) {
            throw new common_1.BadRequestException('Este pedido no tiene facturas');
        }
        return this.construirTicketPedidoTotal(completo, true);
    }
    async ticketMovimientoCajaParaVistaPrevia(idMovimiento) {
        const row = await this.prisma.movimientoCaja.findUnique({
            where: { idMovimientoCaja: idMovimiento },
            include: {
                usuario: { select: { nombre: true, apellido: true } },
            },
        });
        if (!row) {
            throw new common_1.NotFoundException('Movimiento no encontrado');
        }
        if (row.tipo !== 'entrada_manual' && row.tipo !== 'salida_manual') {
            throw new common_1.BadRequestException('Solo se pueden previsualizar entradas o salidas manuales');
        }
        const fechaStr = luxon_1.DateTime.fromJSDate(row.fecha, {
            zone: 'America/Bogota',
        }).toFormat('yyyy-LL-dd');
        return this.ticketMovimientoCajaDesdeRow(row, fechaStr);
    }
    async ticketCierreCajaParaVistaPrevia(fecha, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const resumen = await this.resumenDiario(fecha, undefined, tenantId);
        return {
            fecha: resumen.fecha,
            total_facturado: resumen.total_facturado,
            total_facturas: resumen.total_facturas,
            monto_base_efectivo: resumen.monto_base_efectivo,
            totales_por_metodo: resumen.totales_por_metodo,
            fiados_dia: resumen.fiados_dia,
            total_fiados_dia: resumen.total_fiados_dia,
            total_pagos_meseros: resumen.total_pagos_meseros,
            total_entradas_manual: resumen.total_entradas_manual,
            total_salidas_manual: resumen.total_salidas_manual,
            total_devoluciones_efectivo: resumen.total_devoluciones_efectivo,
            total_pagos_domicilio: resumen.total_pagos_domicilio,
            total_pagos_mesero_exceso: resumen.total_pagos_mesero_exceso,
            subtotal_entradas_caja: resumen.subtotal_entradas_caja,
            subtotal_salidas_caja: resumen.subtotal_salidas_caja,
            efectivo_esperado_en_caja: resumen.efectivo_esperado_en_caja,
            emitida_en: new Date().toISOString(),
        };
    }
    async ticketBaseCajaParaVistaPrevia(fecha, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const caja = await this.getCajaDiaria(fecha, tenantId);
        return {
            fecha: caja.fecha,
            monto_base_efectivo: caja.monto_base_efectivo,
            emitida_en: new Date().toISOString(),
        };
    }
    async ticketBaseCajaCierreParaVistaPrevia(fecha, tenantId = tenant_constants_1.DEFAULT_TENANT_ID) {
        const resumen = await this.resumenDiario(fecha, undefined, tenantId);
        const caja = await this.getCajaDiaria(fecha, tenantId);
        return {
            fecha: resumen.fecha,
            monto_base_cierre_efectivo: caja.monto_base_cierre_efectivo ?? resumen.monto_base_cierre_efectivo ?? 0,
            efectivo_esperado_en_caja: resumen.efectivo_esperado_en_caja,
            emitida_en: new Date().toISOString(),
        };
    }
    async imprimirPrecuenta(idPedido, dto, actor) {
        await this.exigirPermisoMesero(actor, 'precuenta');
        const ticket = await this.construirTicketPrecuentaDesdeDto(idPedido, dto);
        const conCopia = dto.factura_con_copia === true;
        const impresion = this.encolarImpresionFactura(ticket, idPedido, conCopia);
        return {
            ok: true,
            id_pedido: idPedido,
            impresion_precuenta: impresion,
            factura_con_copia: conCopia,
        };
    }
    async construirTicketPrecuentaDesdeDto(idPedido, dto) {
        const pedido = await this.prisma.pedido.findUnique({
            where: { idPedido },
            include: {
                detalles: { include: detalleInclude, orderBy: { idDetalle: 'asc' } },
            },
        });
        if (!pedido) {
            throw new common_1.NotFoundException('Pedido no encontrado');
        }
        if (pedido.estado === 'facturado') {
            throw new common_1.ConflictException('Este pedido ya fue facturado');
        }
        if (!ABIERTOS.includes(pedido.estado)) {
            throw new common_1.ConflictException('El pedido no admite pre-cuenta');
        }
        if (pedido.detalles.length === 0) {
            throw new common_1.BadRequestException('No hay ítems en el pedido');
        }
        const detallesSerial = this.serialDetallesCobro(pedido.detalles);
        const solicitudes = this.prepararSolicitudesCobro(pedido, dto);
        const detallesCobro = pedido.detalles.filter((d) => solicitudes.some((s) => s.id_detalle === d.idDetalle));
        const subtotalNum = (0, cobro_parcial_1.subtotalDesdeSolicitudes)(pedido.detalles.map((d) => ({
            id_detalle: d.idDetalle,
            precio_unitario: Number(d.precioUnitario),
            cantidad: d.cantidad,
        })), solicitudes);
        const subtotal = new client_1.Prisma.Decimal(subtotalNum);
        const configRow = await this.obtenerConfigDescuentosRow(pedido.idRestaurante);
        const config = this.mapConfigDescuentos(configRow);
        const lineas = (0, cobro_parcial_1.lineasDescuentoDesdeSolicitudes)(detallesCobro.map((d) => ({
            id_detalle: d.idDetalle,
            cantidad: d.cantidad,
            precio_unitario: Number(d.precioUnitario),
            nombre_producto: d.producto.nombre,
            categoria_nombre: d.producto.categoria.nombre,
            id_categoria: d.producto.categoria.idCategoria,
            es_plato_principal: d.producto.esPlatoPrincipal,
            participa_descuento_sopas: d.producto.categoria.participaDescuentoSopas,
        })), solicitudes);
        const descuentos = this.descuentosDesdeConfig(lineas, config, pedido);
        const descTotal = new client_1.Prisma.Decimal(descuentos.descuento_sopas)
            .add(descuentos.descuento_muleros)
            .add(descuentos.descuento_promociones);
        if (descTotal.gt(subtotal)) {
            throw new common_1.BadRequestException('La suma de descuentos no puede superar el subtotal de esta cuenta');
        }
        const total = subtotal.sub(descTotal);
        const completo = await this.obtenerPorIdTrasEscritura(idPedido);
        const esTandaParcial = (0, cobro_parcial_1.quedaPendienteTrasCobro)(detallesSerial, solicitudes);
        return this.construirTicketPrecuenta(completo, solicitudes, {
            subtotal: Number(subtotal),
            descuento_sopas: descuentos.descuento_sopas,
            descuento_muleros: descuentos.descuento_muleros,
            descuento_promociones: descuentos.descuento_promociones,
            promociones_desglose: descuentos.promociones_desglose,
            total: Number(total),
        }, esTandaParcial);
    }
    construirTicketComanda(pedido, detalles, opts = {}) {
        const emitidaEn = opts.emitidaEn ?? new Date();
        const esReimpresion = opts.esReimpresion ?? false;
        const esAdicional = opts.esAdicional ?? false;
        const lineas = (0, comanda_lineas_group_1.lineasComandaParaTicket)(detalles.map((d) => ({
            id_detalle: d.idDetalle,
            id_producto: d.idProducto,
            id_detalle_padre: d.idDetallePadre,
            nombre_producto: d.producto.nombre,
            categoria_nombre: d.producto.categoria.nombre,
            es_acompanamiento_mazorca: d.producto.esAcompanamientoMazorca,
            es_plato_principal: d.producto.esPlatoPrincipal,
            cantidad: d.cantidad,
            nota_cocina: d.notaCocina,
            personalizaciones: [
                ...formatSubitemsDetalle(d.subitems).map((descripcion) => ({
                    descripcion,
                })),
                ...d.personalizaciones.map((dp) => ({
                    id_opcion: dp.opcion.idOpcion,
                    descripcion: dp.opcion.descripcion,
                })),
            ],
        })));
        const mesero = `${pedido.usuario.nombre} ${pedido.usuario.apellido}`.trim();
        return {
            id_pedido: pedido.idPedido,
            mesa_numero: pedido.mesa.numero,
            mesa_etiqueta: (0, comanda_ticket_1.etiquetaMesaComanda)(pedido.mesa.numero),
            num_comensales: pedido.numComensales,
            mesero,
            modo_servicio: pedido.modoServicio,
            lineas,
            emitida_en: emitidaEn.toISOString(),
            es_reimpresion: esReimpresion || undefined,
            es_adicional: esAdicional || undefined,
        };
    }
    esDetalleInternoSaldo(d) {
        return (Boolean(d.es_cuota_pendiente_reparto) ||
            (0, saldo_restante_1.esNotaSaldoRestantePendiente)(d.nota_cocina) ||
            (d.nota_cocina ?? '').trim().startsWith(saldo_restante_1.SALDO_ABONO_NOTA));
    }
    lineasTicketSegunModoCobro(completo, factura, idsGrupo, esMixto) {
        const detalles = completo.detalles ?? [];
        const facturas = completo.facturas ?? [];
        const lineasCobradas = detalles.filter((d) => idsGrupo.has(d.id_factura ?? -1));
        const reales = detalles.filter((d) => d.id_detalle_padre == null && !this.esDetalleInternoSaldo(d));
        const esCuotaPersonas = factura.plan_personas_sobre_total === true;
        const esCuotaCombinado = factura.plan_combinado_sobre_seleccion === true;
        if (esCuotaPersonas) {
            const idsPreviasNoPlan = new Set(facturas
                .filter((f) => f.id_factura < factura.id_factura &&
                f.plan_personas_sobre_total !== true &&
                f.plan_combinado_sobre_seleccion !== true)
                .map((f) => f.id_factura));
            const itemsAlcance = idsPreviasNoPlan.size > 0
                ? reales.filter((d) => d.id_factura == null ||
                    !idsPreviasNoPlan.has(d.id_factura) ||
                    idsGrupo.has(d.id_factura))
                : reales;
            return (0, factura_lineas_group_1.lineasFacturaParaTicketPedidoTotal)(itemsAlcance.map((d) => this.lineaFacturaDesdePedidoSerial(d)));
        }
        if (esCuotaCombinado) {
            const huboPagosCombinadoPrevios = facturas.some((f) => f.id_factura < factura.id_factura &&
                f.plan_combinado_sobre_seleccion === true);
            const abonosEnFactura = lineasCobradas.filter((d) => this.esDetalleInternoSaldo(d));
            if (huboPagosCombinadoPrevios && abonosEnFactura.length > 0) {
                const montoAbono = abonosEnFactura.reduce((s, d) => s + d.precio_unitario * d.cantidad, 0);
                if (montoAbono > 0) {
                    return [
                        {
                            cantidad: 1,
                            nombre_producto: saldo_restante_1.NOMBRE_DISPLAY_SALDO_PENDIENTE,
                            precio_unitario: montoAbono,
                            subtotal_linea: montoAbono,
                            personalizaciones: [],
                            nota_cocina: null,
                        },
                    ];
                }
            }
            const seleccionRef = this.parseSeleccionReferenciaFactura(factura.plan_seleccion_referencia);
            return (0, factura_lineas_group_1.lineasFacturaParaTicketSeleccionReferencia)(reales.map((d) => this.lineaFacturaDesdePedidoSerial(d)), seleccionRef);
        }
        const ticket = (0, factura_lineas_group_1.lineasFacturaParaTicket)(lineasCobradas
            .filter((d) => !this.esDetalleInternoSaldo(d))
            .map((d) => this.lineaFacturaDesdePedidoSerial(d)), { consolidarMixtoPrecio: esMixto });
        const abonosEnTanda = lineasCobradas.filter((d) => this.esDetalleInternoSaldo(d));
        if (abonosEnTanda.length > 0) {
            const monto = abonosEnTanda.reduce((s, d) => s + d.precio_unitario * d.cantidad, 0);
            ticket.push({
                cantidad: 1,
                nombre_producto: saldo_restante_1.NOMBRE_DISPLAY_SALDO_PENDIENTE,
                precio_unitario: monto,
                subtotal_linea: monto,
                personalizaciones: [],
                nota_cocina: null,
            });
        }
        const saldoPendiente = detalles.find((d) => !d.cobrado &&
            d.id_factura == null &&
            (0, saldo_restante_1.esNotaSaldoRestantePendiente)(d.nota_cocina));
        if (saldoPendiente) {
            const monto = Math.round(saldoPendiente.precio_unitario) * saldoPendiente.cantidad;
            ticket.push({
                cantidad: 1,
                nombre_producto: saldo_restante_1.NOMBRE_DISPLAY_SALDO_PENDIENTE,
                precio_unitario: monto,
                subtotal_linea: monto,
                personalizaciones: [],
                nota_cocina: saldoPendiente.nota_cocina ?? null,
            });
        }
        const platosEnTanda = lineasCobradas.filter((d) => !this.esDetalleInternoSaldo(d));
        if (abonosEnTanda.length > 0 && platosEnTanda.length > 0) {
            return ticket;
        }
        return ticket;
    }
    construirTicketFactura(completo, idFactura, esReimpresion = false, detalleExcesoOverride) {
        const facturas = completo.facturas ?? [];
        const factura = facturas.find((f) => f.id_factura === idFactura);
        if (!factura) {
            throw new common_1.BadRequestException('Factura no encontrada en el pedido');
        }
        const grupoMixto = (0, factura_mixto_1.agruparFacturasMixto)(facturas, factura);
        const esMixto = (0, factura_mixto_1.esGrupoPagoMixto)(grupoMixto);
        const facturasTicket = esMixto ? grupoMixto : [factura];
        const idsGrupo = new Set(facturasTicket.map((f) => f.id_factura));
        const meseroStr = completo.mesero
            ? `${completo.mesero.nombre} ${completo.mesero.apellido}`.trim()
            : '';
        const esCuotaPersonas = factura.plan_personas_sobre_total === true;
        const esCuotaCombinado = factura.plan_combinado_sobre_seleccion === true;
        const subtotal = facturasTicket.reduce((s, f) => s + f.subtotal, 0);
        const descuento_sopas = facturasTicket.reduce((s, f) => s + f.descuento_sopas, 0);
        const descuento_muleros = facturasTicket.reduce((s, f) => s + f.descuento_muleros, 0);
        const descuento_promociones = facturasTicket.reduce((s, f) => s + (f.descuento_promociones ?? 0), 0);
        const total = facturasTicket.reduce((s, f) => s + f.total, 0);
        const detalleExceso = detalleExcesoOverride ??
            facturasTicket
                .map((f) => f.detalle_exceso_cobro)
                .find((d) => d != null) ??
            undefined;
        return {
            id_pedido: completo.id_pedido,
            id_factura: factura.id_factura,
            mesa_numero: completo.mesa_numero,
            mesa_etiqueta: (0, comanda_ticket_1.etiquetaMesaComanda)(completo.mesa_numero),
            num_comensales: completo.num_comensales,
            mesero: meseroStr,
            modo_servicio: completo.modo_servicio,
            lineas: this.lineasTicketSegunModoCobro(completo, factura, idsGrupo, esMixto),
            subtotal,
            descuento_sopas,
            descuento_muleros,
            descuento_promociones,
            total,
            metodo_pago: esMixto
                ? 'mixto'
                : factura.metodo_pago,
            cobros_resumen: esMixto ? (0, factura_mixto_1.cobrosResumenMixto)(grupoMixto) : undefined,
            emitida_en: String(factura.emitida_en),
            es_reimpresion: esReimpresion || undefined,
            es_cobro_parcial: factura.es_parcial || undefined,
            es_cuota_personas: esCuotaPersonas || undefined,
            es_cuota_combinado: esCuotaCombinado || undefined,
            es_cobro_combinado: !esCuotaPersonas && !esCuotaCombinado && factura.persona_plan_indice != null
                ? true
                : undefined,
            detalle_exceso_cobro: detalleExceso ?? undefined,
        };
    }
    construirTicketPedidoTotal(completo, esReimpresion = false) {
        const facturas = completo.facturas ?? [];
        const meseroStr = completo.mesero
            ? `${completo.mesero.nombre} ${completo.mesero.apellido}`.trim()
            : '';
        const lineasPedido = completo.detalles.map((d) => this.lineaFacturaDesdePedidoSerial(d));
        const resumenCobros = (0, factura_mixto_1.resumenCobrosPedidoTotal)(facturas);
        const ultima = facturas[facturas.length - 1];
        return {
            id_pedido: completo.id_pedido,
            mesa_numero: completo.mesa_numero,
            mesa_etiqueta: (0, comanda_ticket_1.etiquetaMesaComanda)(completo.mesa_numero),
            num_comensales: completo.num_comensales,
            mesero: meseroStr,
            modo_servicio: completo.modo_servicio,
            lineas: (0, factura_lineas_group_1.lineasFacturaParaTicketPedidoTotal)(lineasPedido),
            subtotal: facturas.reduce((s, f) => s + f.subtotal, 0),
            descuento_sopas: facturas.reduce((s, f) => s + f.descuento_sopas, 0),
            descuento_muleros: facturas.reduce((s, f) => s + f.descuento_muleros, 0),
            descuento_promociones: facturas.reduce((s, f) => s + (f.descuento_promociones ?? 0), 0),
            total: facturas.reduce((s, f) => s + f.total, 0),
            metodo_pago: resumenCobros.metodo_pago,
            emitida_en: String(ultima.emitida_en),
            es_reimpresion: esReimpresion || undefined,
            es_total_pedido: true,
            cobros_resumen: resumenCobros.cobros_resumen && resumenCobros.cobros_resumen.length > 0
                ? resumenCobros.cobros_resumen
                : undefined,
        };
    }
    construirTicketPrecuenta(completo, solicitudes, totals, esTandaParcial) {
        const meseroStr = completo.mesero
            ? `${completo.mesero.nombre} ${completo.mesero.apellido}`.trim()
            : '';
        const qty = new Map(solicitudes.map((s) => [s.id_detalle, s.cantidad]));
        const lineas = completo.detalles
            .filter((d) => qty.has(d.id_detalle))
            .map((d) => this.lineaFacturaDesdePedidoSerial(d, qty.get(d.id_detalle)));
        return {
            id_pedido: completo.id_pedido,
            mesa_numero: completo.mesa_numero,
            mesa_etiqueta: (0, comanda_ticket_1.etiquetaMesaComanda)(completo.mesa_numero),
            num_comensales: completo.num_comensales,
            mesero: meseroStr,
            modo_servicio: completo.modo_servicio,
            lineas: (0, factura_lineas_group_1.lineasFacturaParaTicket)(lineas),
            subtotal: totals.subtotal,
            descuento_sopas: totals.descuento_sopas,
            descuento_muleros: totals.descuento_muleros,
            descuento_promociones: totals.descuento_promociones,
            promociones_desglose: totals.promociones_desglose,
            total: totals.total,
            emitida_en: new Date().toISOString(),
            es_precuenta: true,
            es_cobro_parcial: esTandaParcial || undefined,
        };
    }
    serialDetallesCobro(detalles) {
        return detalles
            .filter((d) => !d.producto?.esAcompanamientoMazorca)
            .map((d) => ({
            id_detalle: d.idDetalle,
            id_detalle_padre: d.idDetallePadre,
            cobrado: d.idFactura != null,
            cantidad: d.cantidad,
        }));
    }
    static COMBINADO_NOTA_PREFIX = 'combinado:';
    static MIXTO_NOTA_PREFIX = 'mixto:';
    combinadoNota(origId, personaIdx) {
        return `${PedidosService_1.COMBINADO_NOTA_PREFIX}${origId}:${personaIdx}`;
    }
    parseCombinadoNota(nota) {
        if (!nota?.startsWith(PedidosService_1.COMBINADO_NOTA_PREFIX))
            return null;
        const rest = nota.slice(PedidosService_1.COMBINADO_NOTA_PREFIX.length);
        const [orig, idx] = rest.split(':');
        const origId = Number(orig);
        const personaIdx = Number(idx);
        if (!Number.isFinite(origId) || !Number.isFinite(personaIdx))
            return null;
        return { origId, personaIdx };
    }
    findCombinadoSlices(detalles, origId) {
        return detalles
            .map((d) => {
            const p = this.parseCombinadoNota(d.notaCocina);
            if (!p || p.origId !== origId)
                return null;
            return { personaIdx: p.personaIdx, idDetalle: d.idDetalle };
        })
            .filter((x) => x != null)
            .sort((a, b) => a.personaIdx - b.personaIdx);
    }
    async ensureCombinadoSlicesEnTx(tx, det, totalPersonasPlan) {
        const origId = this.parseCombinadoNota(det.notaCocina)?.origId ?? det.idDetalle;
        const allDet = await tx.detallePedido.findMany({
            where: { idPedido: det.idPedido },
            include: detalleInclude,
        });
        const slices = this.findCombinadoSlices(allDet, origId);
        if (slices.length >= totalPersonasPlan) {
            return slices;
        }
        const baseDet = allDet.find((d) => d.idDetalle === origId && d.idFactura == null) ??
            allDet.find((d) => d.idDetalle === origId);
        if (!baseDet || baseDet.idFactura != null) {
            throw new common_1.BadRequestException('El ítem compartido ya fue cobrado o no está disponible');
        }
        if (baseDet.cantidad !== 1) {
            throw new common_1.BadRequestException('El reparto combinado por monto solo aplica a ítems de 1 unidad');
        }
        const precios = (0, repartir_monto_cop_1.repartirMontoEnCop)(Number(baseDet.precioUnitario), totalPersonasPlan);
        const notaBase = (baseDet.notaCocina ?? '').trim();
        const notaSlice = (idx) => {
            const tag = this.combinadoNota(origId, idx);
            return notaBase ? `${notaBase} · ${tag}` : tag;
        };
        await tx.detallePedido.update({
            where: { idDetalle: baseDet.idDetalle },
            data: {
                precioUnitario: precios[0] ?? baseDet.precioUnitario,
                notaCocina: notaSlice(1),
            },
        });
        const out = [
            { personaIdx: 1, idDetalle: baseDet.idDetalle },
        ];
        for (let i = 2; i <= totalPersonasPlan; i++) {
            const created = await tx.detallePedido.create({
                data: {
                    idPedido: baseDet.idPedido,
                    idProducto: baseDet.idProducto,
                    cantidad: 1,
                    precioUnitario: precios[i - 1] ?? baseDet.precioUnitario,
                    notaCocina: notaSlice(i),
                    enviadoCocina: baseDet.enviadoCocina,
                    listoCocina: baseDet.listoCocina,
                    listoParaRecoger: baseDet.listoParaRecoger,
                    idDetallePadre: baseDet.idDetallePadre,
                },
            });
            const pers = await tx.detPersonalizacion.findMany({
                where: { idDetalle: baseDet.idDetalle },
            });
            if (pers.length) {
                await tx.detPersonalizacion.createMany({
                    data: pers.map((p) => ({
                        idDetalle: created.idDetalle,
                        idOpcion: p.idOpcion,
                    })),
                });
            }
            out.push({ personaIdx: i, idDetalle: created.idDetalle });
        }
        return out;
    }
    async resolverSolicitudesCombinadoEnTx(tx, pedido, solicitudes, personaPlanIndice, totalPersonasPlan) {
        const totalUnidades = solicitudes.reduce((s, x) => s + x.cantidad, 0);
        if (totalUnidades >= totalPersonasPlan) {
            return solicitudes;
        }
        const out = [];
        for (const sol of solicitudes) {
            const det = pedido.detalles.find((d) => d.idDetalle === sol.id_detalle);
            if (!det || det.cantidad !== 1 || sol.cantidad !== 1) {
                out.push(sol);
                continue;
            }
            const slices = await this.ensureCombinadoSlicesEnTx(tx, det, totalPersonasPlan);
            const slice = slices.find((s) => s.personaIdx === personaPlanIndice);
            if (!slice) {
                throw new common_1.BadRequestException(`No se encontró la porción combinada para la persona ${personaPlanIndice}`);
            }
            out.push({ id_detalle: slice.idDetalle, cantidad: 1 });
        }
        return out;
    }
    solicitudesDesdeCantidadesEnPedido(serial, cantidades) {
        const base = Object.entries(cantidades)
            .filter(([, q]) => q > 0)
            .map(([id, cantidad]) => ({
            id_detalle: Number(id),
            cantidad,
        }));
        if (base.length === 0)
            return [];
        return (0, cobro_parcial_1.ordenarSolicitudesCobro)(serial, (0, cobro_parcial_1.expandirSolicitudesConEmpaques)(serial, base));
    }
    asignarCantidadesParaCuotaNeta(pedido, solicitudes, montoObjetivoNeto, config) {
        const cantSolicitud = new Map(solicitudes.map((s) => [s.id_detalle, s.cantidad]));
        const lineas = pedido.detalles
            .filter((d) => d.idDetallePadre == null)
            .map((d) => {
            const q = cantSolicitud.get(d.idDetalle) ?? 0;
            return {
                id_detalle: d.idDetalle,
                precio_unitario: Math.round(Number(d.precioUnitario)),
                cantidad_pendiente: q,
            };
        })
            .filter((l) => l.cantidad_pendiente > 0 && l.precio_unitario > 0);
        if (lineas.length === 0 || montoObjetivoNeto <= 0)
            return {};
        const serial = this.serialDetallesCobro(pedido.detalles);
        const netoDeCantidades = (cantidades) => {
            const sol = this.solicitudesDesdeCantidadesEnPedido(serial, cantidades);
            if (sol.length === 0)
                return 0;
            return Number(this.calcularImportesFactura(pedido, sol, config).total);
        };
        const brutoPendiente = lineas.reduce((s, l) => s + l.precio_unitario * l.cantidad_pendiente, 0);
        const totalPendienteNeto = Number(this.calcularImportesFactura(pedido, solicitudes, config).total);
        if (totalPendienteNeto > 0 && totalPendienteNeto <= montoObjetivoNeto) {
            const todas = {};
            for (const s of solicitudes) {
                todas[s.id_detalle] = s.cantidad;
            }
            return todas;
        }
        let lo = 0;
        let hi = brutoPendiente;
        let best = {};
        for (let i = 0; i < 24; i++) {
            const mid = Math.round((lo + hi) / 2);
            if (mid <= 0)
                break;
            const cantidades = (0, asignar_cobro_por_monto_1.asignarCantidadesParaSubtotal)(lineas, mid);
            if (Object.keys(cantidades).length === 0) {
                hi = mid - 1;
                continue;
            }
            const neto = netoDeCantidades(cantidades);
            if (neto <= montoObjetivoNeto) {
                best = cantidades;
                lo = mid + 1;
            }
            else {
                hi = mid - 1;
            }
        }
        return best;
    }
    async peelAndSplitBrutoCuotaEnTx(tx, idDetalle, brutoCobro) {
        const unitDet = await this.peelOneUnitDetalleEnTx(tx, idDetalle);
        const brutoUnit = Math.round(Number(unitDet.precioUnitario));
        const brutoParaCobro = Math.min(brutoUnit, Math.max(1, Math.round(brutoCobro)));
        if (brutoParaCobro >= brutoUnit) {
            return unitDet.idDetalle;
        }
        const brutoRest = brutoUnit - brutoParaCobro;
        await tx.detallePedido.update({
            where: { idDetalle: unitDet.idDetalle },
            data: { precioUnitario: brutoParaCobro },
        });
        await tx.detallePedido.create({
            data: {
                idPedido: unitDet.idPedido,
                idProducto: unitDet.idProducto,
                cantidad: 1,
                precioUnitario: brutoRest,
                notaCocina: unitDet.notaCocina,
                enviadoCocina: unitDet.enviadoCocina,
                listoCocina: unitDet.listoCocina,
                listoParaRecoger: unitDet.listoParaRecoger,
                idDetallePadre: unitDet.idDetallePadre,
            },
        });
        return unitDet.idDetalle;
    }
    async resolverSolicitudesPersonasTotalEnTx(tx, idPedido, pedido, solicitudes, personaPlanIndice, totalPersonasPlan, montoObjetivoNeto, config, poolSeleccion) {
        if (personaPlanIndice >= totalPersonasPlan) {
            return solicitudes;
        }
        const objetivo = montoObjetivoNeto ??
            (0, repartir_monto_cop_1.repartirMontoEnCop)(Number(this.calcularImportesFactura(pedido, solicitudes, config).total), totalPersonasPlan)[personaPlanIndice - 1] ??
            0;
        if (objetivo <= 0) {
            throw new common_1.BadRequestException('Cuota de persona inválida');
        }
        let pedidoActivo = pedido;
        const solicitudesCuota = poolSeleccion != null && poolSeleccion.length > 0
            ? this.solicitudesPendientesEnPool(pedidoActivo, poolSeleccion)
            : solicitudes;
        const baseSolicitudes = solicitudesCuota.length > 0 ? solicitudesCuota : solicitudes;
        const cantidades = this.asignarCantidadesParaCuotaNeta(pedidoActivo, baseSolicitudes, objetivo, config);
        const serial = this.serialDetallesCobro(pedidoActivo.detalles);
        let sol = this.solicitudesDesdeCantidadesEnPedido(serial, cantidades);
        if (sol.length === 0) {
            const candidato = [...baseSolicitudes]
                .map((s) => {
                const det = pedidoActivo.detalles.find((d) => d.idDetalle === s.id_detalle);
                return det && det.idFactura == null
                    ? {
                        id_detalle: s.id_detalle,
                        precio: Math.round(Number(det.precioUnitario)),
                        cantidad: s.cantidad,
                    }
                    : null;
            })
                .filter((x) => x != null && x.precio > 0 && x.cantidad > 0)
                .sort((a, b) => a.precio - b.precio)[0];
            if (!candidato) {
                throw new common_1.BadRequestException('No se pudo calcular la cuota de esta persona sobre el total');
            }
            sol = [{ id_detalle: candidato.id_detalle, cantidad: 1 }];
        }
        return sol;
    }
    mixtoPrecioNota(origId, lado) {
        return `${PedidosService_1.MIXTO_NOTA_PREFIX}${origId}:${lado}`;
    }
    parseMixtoPrecioNota(nota) {
        if (!nota?.includes(PedidosService_1.MIXTO_NOTA_PREFIX))
            return null;
        const idx = nota.indexOf(PedidosService_1.MIXTO_NOTA_PREFIX);
        const tag = nota.slice(idx + PedidosService_1.MIXTO_NOTA_PREFIX.length);
        const [orig, lado] = tag.split(':');
        if (lado !== 'efectivo' && lado !== 'transferencia')
            return null;
        const origId = Number(orig);
        if (!Number.isFinite(origId))
            return null;
        return { origId, lado };
    }
    findMixtoPrecioSlices(detalles, origId) {
        return detalles
            .map((d) => {
            const p = this.parseMixtoPrecioNota(d.notaCocina);
            if (!p || p.origId !== origId)
                return null;
            return { lado: p.lado, idDetalle: d.idDetalle };
        })
            .filter((x) => x != null);
    }
    repartirBrutoMixtoEnCop(brutoLinea, netoEfectivo, totalNeto) {
        const bruto = Math.round(brutoLinea);
        if (bruto <= 0 || totalNeto <= 0 || netoEfectivo <= 0) {
            return [0, bruto];
        }
        if (netoEfectivo >= totalNeto) {
            return [bruto, 0];
        }
        let brutoE = Math.round((bruto * netoEfectivo) / totalNeto);
        let brutoT = bruto - brutoE;
        if (bruto >= 2 &&
            netoEfectivo > 0 &&
            netoEfectivo < totalNeto &&
            (brutoE <= 0 || brutoT <= 0)) {
            brutoE = Math.max(1, brutoE);
            brutoT = bruto - brutoE;
            if (brutoT <= 0) {
                brutoT = 1;
                brutoE = bruto - 1;
            }
        }
        return [brutoE, brutoT];
    }
    mergeSolicitudesCobro(arr) {
        const m = new Map();
        for (const s of arr) {
            m.set(s.id_detalle, (m.get(s.id_detalle) ?? 0) + s.cantidad);
        }
        return [...m.entries()].map(([id_detalle, cantidad]) => ({
            id_detalle,
            cantidad,
        }));
    }
    async peelOneUnitDetalleEnTx(tx, idDetalle) {
        const det = await tx.detallePedido.findUnique({
            where: { idDetalle },
            include: detalleInclude,
        });
        if (!det || det.idFactura != null) {
            throw new common_1.BadRequestException('Ítem de cobro no disponible');
        }
        if (det.cantidad <= 1) {
            return det;
        }
        await tx.detallePedido.update({
            where: { idDetalle },
            data: { cantidad: det.cantidad - 1 },
        });
        const created = await tx.detallePedido.create({
            data: {
                idPedido: det.idPedido,
                idProducto: det.idProducto,
                cantidad: 1,
                precioUnitario: det.precioUnitario,
                notaCocina: det.notaCocina,
                enviadoCocina: det.enviadoCocina,
                listoCocina: det.listoCocina,
                listoParaRecoger: det.listoParaRecoger,
                idDetallePadre: det.idDetallePadre,
            },
        });
        const pers = await tx.detPersonalizacion.findMany({
            where: { idDetalle },
        });
        if (pers.length) {
            await tx.detPersonalizacion.createMany({
                data: pers.map((p) => ({
                    idDetalle: created.idDetalle,
                    idOpcion: p.idOpcion,
                })),
            });
        }
        return tx.detallePedido.findUniqueOrThrow({
            where: { idDetalle: created.idDetalle },
            include: detalleInclude,
        });
    }
    async ensureMixtoPrecioSlicesEnTx(tx, det, brutoEfectivo, brutoTransferencia) {
        const origId = this.parseMixtoPrecioNota(det.notaCocina)?.origId ??
            this.parseCombinadoNota(det.notaCocina)?.origId ??
            det.idDetalle;
        const allDet = await tx.detallePedido.findMany({
            where: { idPedido: det.idPedido },
            include: detalleInclude,
        });
        const slices = this.findMixtoPrecioSlices(allDet, origId);
        const idE = slices.find((s) => s.lado === 'efectivo')?.idDetalle ??
            (this.parseMixtoPrecioNota(det.notaCocina)?.lado === 'efectivo'
                ? det.idDetalle
                : undefined);
        const idT = slices.find((s) => s.lado === 'transferencia')?.idDetalle ??
            (this.parseMixtoPrecioNota(det.notaCocina)?.lado === 'transferencia'
                ? det.idDetalle
                : undefined);
        if (idE != null && idT != null) {
            return { idEfectivo: idE, idTransferencia: idT };
        }
        const baseDet = allDet.find((d) => d.idDetalle === origId && d.idFactura == null) ??
            allDet.find((d) => d.idDetalle === det.idDetalle && d.idFactura == null) ??
            det;
        if (!baseDet || baseDet.idFactura != null) {
            throw new common_1.BadRequestException('El ítem ya fue cobrado o no está disponible para pago mixto');
        }
        if (baseDet.cantidad !== 1) {
            throw new common_1.BadRequestException('El pago mixto por monto solo aplica a ítems de 1 unidad indivisible');
        }
        if (brutoEfectivo <= 0 || brutoTransferencia <= 0) {
            throw new common_1.BadRequestException('No se pudo repartir el precio del ítem entre efectivo y transferencia');
        }
        const notaBase = (baseDet.notaCocina ?? '').trim();
        const notaConTag = (lado) => {
            const tag = this.mixtoPrecioNota(origId, lado);
            return notaBase ? `${notaBase} · ${tag}` : tag;
        };
        await tx.detallePedido.update({
            where: { idDetalle: baseDet.idDetalle },
            data: {
                precioUnitario: brutoEfectivo,
                notaCocina: notaConTag('efectivo'),
            },
        });
        const created = await tx.detallePedido.create({
            data: {
                idPedido: baseDet.idPedido,
                idProducto: baseDet.idProducto,
                cantidad: 1,
                precioUnitario: brutoTransferencia,
                notaCocina: notaConTag('transferencia'),
                enviadoCocina: baseDet.enviadoCocina,
                listoCocina: baseDet.listoCocina,
                listoParaRecoger: baseDet.listoParaRecoger,
                idDetallePadre: baseDet.idDetallePadre,
            },
        });
        const pers = await tx.detPersonalizacion.findMany({
            where: { idDetalle: baseDet.idDetalle },
        });
        if (pers.length) {
            await tx.detPersonalizacion.createMany({
                data: pers.map((p) => ({
                    idDetalle: created.idDetalle,
                    idOpcion: p.idOpcion,
                })),
            });
        }
        return { idEfectivo: baseDet.idDetalle, idTransferencia: created.idDetalle };
    }
    async resolverSplitMixtoPrecioEnTx(tx, pedido, solicitudes, reparto, totalNeto) {
        const solEfectivo = [];
        const solTransferencia = [];
        const pendientesPrecioCero = [];
        for (const sol of solicitudes) {
            for (let u = 0; u < sol.cantidad; u++) {
                const unitDet = await this.peelOneUnitDetalleEnTx(tx, sol.id_detalle);
                const mixtoLado = this.parseMixtoPrecioNota(unitDet.notaCocina)?.lado;
                if (mixtoLado === 'efectivo') {
                    solEfectivo.push({ id_detalle: unitDet.idDetalle, cantidad: 1 });
                    continue;
                }
                if (mixtoLado === 'transferencia') {
                    solTransferencia.push({ id_detalle: unitDet.idDetalle, cantidad: 1 });
                    continue;
                }
                const brutoLinea = Math.round(Number(unitDet.precioUnitario));
                if (brutoLinea <= 0) {
                    pendientesPrecioCero.push({
                        id_detalle: unitDet.idDetalle,
                        cantidad: 1,
                    });
                    continue;
                }
                if (brutoLinea === 1 &&
                    reparto.efectivoFactura > 0 &&
                    reparto.transferenciaFactura > 0) {
                    if (reparto.efectivoFactura <= reparto.transferenciaFactura) {
                        solTransferencia.push({ id_detalle: unitDet.idDetalle, cantidad: 1 });
                    }
                    else {
                        solEfectivo.push({ id_detalle: unitDet.idDetalle, cantidad: 1 });
                    }
                    continue;
                }
                const [brutoE, brutoT] = this.repartirBrutoMixtoEnCop(brutoLinea, reparto.efectivoFactura, totalNeto);
                if (brutoE <= 0 || brutoT <= 0) {
                    throw new common_1.BadRequestException('No se pudo dividir el cobro mixto entre efectivo y transferencia. Ajusta los montos o divide la cuenta manualmente.');
                }
                const { idEfectivo, idTransferencia } = await this.ensureMixtoPrecioSlicesEnTx(tx, unitDet, brutoE, brutoT);
                solEfectivo.push({ id_detalle: idEfectivo, cantidad: 1 });
                solTransferencia.push({ id_detalle: idTransferencia, cantidad: 1 });
            }
        }
        const repartirPrecioCero = (z) => {
            if (solEfectivo.length <= solTransferencia.length) {
                solEfectivo.push(z);
            }
            else {
                solTransferencia.push(z);
            }
        };
        for (const z of pendientesPrecioCero) {
            if (solEfectivo.length === 0) {
                solEfectivo.push(z);
            }
            else if (solTransferencia.length === 0) {
                solTransferencia.push(z);
            }
            else {
                repartirPrecioCero(z);
            }
        }
        const efectivo = this.mergeSolicitudesCobro(solEfectivo);
        const transferencia = this.mergeSolicitudesCobro(solTransferencia);
        if (efectivo.length === 0 || transferencia.length === 0) {
            throw new common_1.BadRequestException('No se pudo dividir el cobro mixto entre efectivo y transferencia');
        }
        return { efectivo, transferencia };
    }
    prepararSolicitudesCobro(pedido, opts) {
        const serial = this.serialDetallesCobro(pedido.detalles);
        const pendientes = (0, cobro_parcial_1.idsDetallesPendientes)(serial);
        if (pendientes.length === 0) {
            throw new common_1.ConflictException('No quedan ítems pendientes de cobro');
        }
        const base = (0, cobro_parcial_1.resolverSolicitudesCobro)(opts, serial, pendientes);
        if (base.length === 0) {
            throw new common_1.BadRequestException('Selecciona al menos un ítem pendiente de cobro');
        }
        try {
            return (0, cobro_parcial_1.ordenarSolicitudesCobro)(serial, (0, cobro_parcial_1.expandirSolicitudesConEmpaques)(serial, base));
        }
        catch (e) {
            throw new common_1.BadRequestException(e instanceof Error ? e.message : 'Cantidades de cobro inválidas');
        }
    }
    async aplicarCobroDetalleEnTx(tx, det, cantidadCobrar, idFactura) {
        if (cantidadCobrar < 1 || cantidadCobrar > det.cantidad) {
            throw new common_1.BadRequestException('Cantidad de cobro inválida');
        }
        if (det.idFactura != null) {
            throw new common_1.ConflictException('Algún ítem ya fue cobrado');
        }
        if (cantidadCobrar === det.cantidad) {
            await tx.detallePedido.update({
                where: { idDetalle: det.idDetalle },
                data: { idFactura },
            });
            return;
        }
        const queda = det.cantidad - cantidadCobrar;
        await tx.detallePedido.update({
            where: { idDetalle: det.idDetalle },
            data: { cantidad: queda },
        });
        const nuevo = await tx.detallePedido.create({
            data: {
                idPedido: det.idPedido,
                idProducto: det.idProducto,
                cantidad: cantidadCobrar,
                precioUnitario: det.precioUnitario,
                notaCocina: det.notaCocina,
                enviadoCocina: det.enviadoCocina,
                listoCocina: det.listoCocina,
                listoParaRecoger: det.listoParaRecoger,
                idDetallePadre: det.idDetallePadre,
                idFactura,
            },
        });
        const pers = await tx.detPersonalizacion.findMany({
            where: { idDetalle: det.idDetalle },
        });
        if (pers.length) {
            await tx.detPersonalizacion.createMany({
                data: pers.map((p) => ({
                    idDetalle: nuevo.idDetalle,
                    idOpcion: p.idOpcion,
                })),
            });
        }
    }
    async facturar(idPedido, dto, actor) {
        await this.exigirPermisoMesero(actor, 'cobrar');
        const idUsuario = actor.idUsuario;
        const pedido = await this.prisma.pedido.findUnique({
            where: { idPedido },
            include: {
                detalles: { include: detalleInclude, orderBy: { idDetalle: 'asc' } },
                facturas: facturasInclude,
            },
        });
        if (!pedido) {
            throw new common_1.NotFoundException('Pedido no encontrado');
        }
        if (pedido.estado === 'facturado') {
            throw new common_1.ConflictException('Este pedido ya fue facturado');
        }
        if (!ABIERTOS.includes(pedido.estado)) {
            throw new common_1.ConflictException('El pedido no se puede facturar');
        }
        if (pedido.detalles.length === 0) {
            throw new common_1.BadRequestException('No hay ítems en el pedido');
        }
        let solicitudes = this.prepararSolicitudesCobro(pedido, dto);
        let pedidoParaCobro = pedido;
        const configRow = await this.obtenerConfigDescuentosRow(pedido.idRestaurante);
        const config = this.mapConfigDescuentos(configRow);
        const cuotaPlan = await this.aplicarCuotaPlanEnFacturacion(idPedido, dto, pedidoParaCobro, solicitudes, config);
        solicitudes = cuotaPlan.solicitudes;
        pedidoParaCobro = cuotaPlan.pedido;
        if (dto.plan_combinado_sobre_seleccion !== true &&
            dto.plan_personas_sobre_total !== true &&
            dto.persona_plan_indice != null &&
            dto.total_personas_plan != null &&
            dto.total_personas_plan >= 2) {
            const unidadesSol = solicitudes.reduce((s, x) => s + x.cantidad, 0);
            if (unidadesSol < dto.total_personas_plan) {
                await this.prisma.$transaction(async (tx) => {
                    solicitudes = await this.resolverSolicitudesCombinadoEnTx(tx, pedidoParaCobro, solicitudes, dto.persona_plan_indice, dto.total_personas_plan);
                });
                const reloaded = await this.prisma.pedido.findUnique({
                    where: { idPedido },
                    include: {
                        detalles: { include: detalleInclude, orderBy: { idDetalle: 'asc' } },
                        facturas: facturasInclude,
                    },
                });
                if (reloaded) {
                    pedidoParaCobro = reloaded;
                }
            }
        }
        const detallesSerial = this.serialDetallesCobro(pedidoParaCobro.detalles);
        const detallesCobro = pedidoParaCobro.detalles.filter((d) => solicitudes.some((s) => s.id_detalle === d.idDetalle));
        const subtotalNum = (0, cobro_parcial_1.subtotalDesdeSolicitudes)(pedidoParaCobro.detalles.map((d) => ({
            id_detalle: d.idDetalle,
            precio_unitario: Number(d.precioUnitario),
            cantidad: d.cantidad,
        })), solicitudes);
        const subtotal = new client_1.Prisma.Decimal(subtotalNum);
        const lineas = (0, cobro_parcial_1.lineasDescuentoDesdeSolicitudes)(detallesCobro.map((d) => ({
            id_detalle: d.idDetalle,
            cantidad: d.cantidad,
            precio_unitario: Number(d.precioUnitario),
            nombre_producto: d.producto.nombre,
            categoria_nombre: d.producto.categoria.nombre,
            id_categoria: d.producto.categoria.idCategoria,
            es_plato_principal: d.producto.esPlatoPrincipal,
            participa_descuento_sopas: d.producto.categoria.participaDescuentoSopas,
        })), solicitudes);
        const descuentos = this.descuentosDesdeConfig(lineas, config, pedido);
        const dS = new client_1.Prisma.Decimal(descuentos.descuento_sopas);
        const dM = new client_1.Prisma.Decimal(descuentos.descuento_muleros);
        const dP = new client_1.Prisma.Decimal(descuentos.descuento_promociones);
        const descTotal = dS.add(dM).add(dP);
        if (descTotal.gt(subtotal)) {
            throw new common_1.BadRequestException('La suma de descuentos no puede superar el subtotal de esta cuenta');
        }
        const total = subtotal.sub(descTotal);
        const subtotalFactura = subtotal;
        const esFiado = dto.metodo_pago === 'fiado';
        if (esFiado) {
            const nombreFiado = dto.nombre_cliente_fiado?.trim();
            if (!nombreFiado) {
                throw new common_1.BadRequestException('Indica el nombre del cliente para registrar el fiado');
            }
        }
        const excesoTransferencia = dto.metodo_pago === 'transferencia'
            ? this.validarExcesoTransferenciaFactura(Number(total), dto.monto_transferencia, dto.devolucion_exceso_metodo)
            : 0;
        const detalleExcesoCobro = esFiado
            ? null
            : (0, factura_vuelto_1.calcularDetalleExcesoCobro)({
                total: Number(total),
                metodo: dto.metodo_pago,
                monto_recibido_efectivo: dto.monto_recibido_efectivo,
                monto_transferencia: dto.monto_transferencia,
                devolucion_exceso_metodo: dto.devolucion_exceso_metodo,
            });
        const detalleExcesoJson = detalleExcesoCobro
            ? detalleExcesoCobro
            : undefined;
        const enPlanSaldo = dto.plan_personas_sobre_total === true ||
            dto.plan_combinado_sobre_seleccion === true;
        let esParcial = enPlanSaldo
            ? pedidoParaCobro.detalles.some((d) => d.idFactura == null && (0, saldo_restante_1.esNotaSaldoRestantePendiente)(d.notaCocina))
            : (0, cobro_parcial_1.quedaPendienteTrasCobro)(detallesSerial, solicitudes);
        let idFacturaCreada = 0;
        if (dto.cobro_mixto_grupo != null &&
            (dto.cobro_mixto_grupo < 1 || dto.cobro_mixto_grupo > 2_147_483_647)) {
            throw new common_1.BadRequestException('cobro_mixto_grupo inválido. Recarga la app (F5 en el navegador) e intenta de nuevo.');
        }
        if (dto.cobro_mixto_grupo != null && !dto.detalles_cobro?.length) {
            throw new common_1.BadRequestException('El pago mixto requiere detalles_cobro en cada parte (efectivo y transferencia). Recarga la app.');
        }
        try {
            await this.prisma.$transaction(async (tx) => {
                await (0, prisma_lock_1.lockPedidoEnTx)(tx, idPedido);
                const pedidoTx = await tx.pedido.findUnique({
                    where: { idPedido },
                    select: { estado: true, idMesa: true },
                });
                if (!pedidoTx) {
                    throw new common_1.NotFoundException('Pedido no encontrado');
                }
                if (pedidoTx.estado === 'facturado') {
                    throw new common_1.ConflictException('Este pedido ya fue facturado');
                }
                if (!ABIERTOS.includes(pedidoTx.estado)) {
                    throw new common_1.ConflictException('El pedido no se puede facturar');
                }
                const pedidoDetalles = await tx.pedido.findUnique({
                    where: { idPedido },
                    include: {
                        detalles: { include: detalleInclude, orderBy: { idDetalle: 'asc' } },
                    },
                });
                const detallesPorId = new Map((pedidoDetalles?.detalles ?? []).map((d) => [d.idDetalle, d]));
                for (const s of solicitudes) {
                    const det = detallesPorId.get(s.id_detalle);
                    if (!det || det.idFactura != null) {
                        throw new common_1.ConflictException('Algún ítem ya fue cobrado. Actualiza el pedido e intenta de nuevo.');
                    }
                }
                const factura = await tx.factura.create({
                    data: {
                        idPedido,
                        idUsuario,
                        subtotal: subtotalFactura,
                        descuentoSopas: dS,
                        descuentoMuleros: dM,
                        descuentoPromociones: dP,
                        total,
                        metodoPago: dto.metodo_pago,
                        esParcial,
                        personaPlanIndice: dto.persona_plan_indice ?? null,
                        ...this.planFacturaDataFromDto(dto),
                        cobroMixtoGrupo: dto.cobro_mixto_grupo ?? null,
                        detalleExcesoCobro: detalleExcesoJson,
                    },
                });
                idFacturaCreada = factura.idFactura;
                if (esFiado) {
                    await tx.cuentaCredito.create({
                        data: {
                            idPedido,
                            idFactura: factura.idFactura,
                            nombreCliente: dto.nombre_cliente_fiado.trim(),
                            telefono: dto.telefono_cliente_fiado?.trim() || null,
                            montoTotal: total,
                            saldoPendiente: total,
                            notas: dto.notas_fiado?.trim() || null,
                            idUsuario,
                        },
                    });
                }
                for (const s of solicitudes) {
                    const det = detallesPorId.get(s.id_detalle);
                    if (!det || det.idPedido !== idPedido) {
                        throw new common_1.BadRequestException('Ítem de cobro no encontrado');
                    }
                    await this.aplicarCobroDetalleEnTx(tx, det, s.cantidad, factura.idFactura);
                }
                await this.marcarPlatosRealesCobradosSiSaldoLiquidadoEnTx(tx, idPedido, factura.idFactura, {
                    sobreTotal: dto.plan_personas_sobre_total === true,
                    pool: dto.plan_combinado_sobre_seleccion === true
                        ? (dto.detalles_seleccion_referencia ?? []).map((s) => ({
                            id_detalle: s.id_detalle,
                            cantidad: s.cantidad,
                        }))
                        : null,
                });
                if (excesoTransferencia > 0) {
                    await this.crearMovimientoExcesoTransferenciaEnTx(tx, {
                        idPedido,
                        idFactura: factura.idFactura,
                        idUsuario,
                        montoExceso: excesoTransferencia,
                        destino: dto.devolucion_exceso_metodo,
                    });
                }
                esParcial = await this.liquidarYEvaluarPendienteEnTx(tx, idPedido, factura.idFactura);
                await tx.factura.update({
                    where: { idFactura: factura.idFactura },
                    data: { esParcial },
                });
                if (!esParcial) {
                    await tx.pedido.update({
                        where: { idPedido },
                        data: {
                            estado: 'facturado',
                            cerradoEn: new Date(),
                        },
                    });
                    const abiertosRest = await tx.pedido.count({
                        where: { idMesa: pedidoTx.idMesa, estado: { in: ABIERTOS } },
                    });
                    if (abiertosRest === 0) {
                        await tx.mesa.update({
                            where: { idMesa: pedidoTx.idMesa },
                            data: { estado: 'libre' },
                        });
                    }
                }
            });
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                e.code === 'P2002' &&
                /id_pedido/i.test(String(e.meta?.target ?? ''))) {
                throw new common_1.BadRequestException('La base de datos aún no permite cobros parciales (varias facturas por pedido). ' +
                    'En el PC servidor ejecuta inicio.bat o, en desarrollo: cd services/api && npx prisma migrate deploy');
            }
            throw e;
        }
        this.emit(idPedido, pedido.idMesa, pedido.idUsuario, pedido.idRestaurante);
        const completo = await this.obtenerPorIdTrasEscritura(idPedido);
        const ticketFactura = this.construirTicketFactura(completo, idFacturaCreada, false, detalleExcesoCobro);
        if (esFiado) {
            ticketFactura.fiado_cliente = dto.nombre_cliente_fiado.trim();
            const tel = dto.telefono_cliente_fiado?.trim();
            if (tel)
                ticketFactura.fiado_telefono = tel;
        }
        const conCopia = dto.imprimir_factura !== false && dto.factura_con_copia === true;
        const impresionFactura = dto.imprimir_factura === false
            ? { impreso: false, omitido: true }
            : this.encolarImpresionFactura(ticketFactura, idPedido, conCopia);
        return {
            ...completo,
            id_factura_emitida: idFacturaCreada,
            cobro_completo: !esParcial,
            impresion_factura: impresionFactura,
            factura_con_copia: conCopia,
        };
    }
    async facturarMixto(idPedido, dto, actor) {
        await this.exigirPermisoMesero(actor, 'cobrar');
        const idUsuario = actor.idUsuario;
        const pedido = await this.prisma.pedido.findUnique({
            where: { idPedido },
            include: {
                detalles: { include: detalleInclude, orderBy: { idDetalle: 'asc' } },
                facturas: facturasInclude,
            },
        });
        if (!pedido) {
            throw new common_1.NotFoundException('Pedido no encontrado');
        }
        if (pedido.estado === 'facturado') {
            throw new common_1.ConflictException('Este pedido ya fue facturado');
        }
        if (!ABIERTOS.includes(pedido.estado)) {
            throw new common_1.ConflictException('El pedido no se puede facturar');
        }
        if (pedido.detalles.length === 0) {
            throw new common_1.BadRequestException('No hay ítems en el pedido');
        }
        let solicitudes = this.prepararSolicitudesCobro(pedido, dto);
        if (solicitudes.length === 0) {
            throw new common_1.BadRequestException('No hay ítems pendientes de cobro');
        }
        let pedidoParaCobro = pedido;
        const configRow = await this.obtenerConfigDescuentosRow(pedido.idRestaurante);
        const config = this.mapConfigDescuentos(configRow);
        const cuotaPlan = await this.aplicarCuotaPlanEnFacturacion(idPedido, dto, pedidoParaCobro, solicitudes, config);
        solicitudes = cuotaPlan.solicitudes;
        pedidoParaCobro = cuotaPlan.pedido;
        if (dto.plan_combinado_sobre_seleccion !== true &&
            dto.plan_personas_sobre_total !== true &&
            dto.persona_plan_indice != null &&
            dto.total_personas_plan != null &&
            dto.total_personas_plan >= 2) {
            const unidadesSol = solicitudes.reduce((s, x) => s + x.cantidad, 0);
            if (unidadesSol < dto.total_personas_plan) {
                await this.prisma.$transaction(async (tx) => {
                    solicitudes = await this.resolverSolicitudesCombinadoEnTx(tx, pedidoParaCobro, solicitudes, dto.persona_plan_indice, dto.total_personas_plan);
                });
                const reloaded = await this.prisma.pedido.findUnique({
                    where: { idPedido },
                    include: {
                        detalles: { include: detalleInclude, orderBy: { idDetalle: 'asc' } },
                        facturas: facturasInclude,
                    },
                });
                if (reloaded) {
                    pedidoParaCobro = reloaded;
                }
            }
        }
        const detallesSerial = this.serialDetallesCobro(pedidoParaCobro.detalles);
        const importesTotales = this.calcularImportesFactura(pedidoParaCobro, solicitudes, config);
        const totalNeto = Number(importesTotales.total);
        const montoRecibidoEfectivo = dto.monto_recibido_efectivo ?? 0;
        const reparto = (0, factura_mixto_1.repartoMixtoConDevolucion)(totalNeto, dto.monto_transferencia, montoRecibidoEfectivo, dto.devolucion_exceso_metodo);
        if (reparto.excesoDevolverEfectivo === 0) {
            if (reparto.efectivoFactura + reparto.transferenciaFactura !== totalNeto) {
                throw new common_1.BadRequestException('Efectivo y transferencia deben sumar el total de esta cuenta');
            }
        }
        else if (dto.devolucion_exceso_metodo !== 'efectivo' &&
            dto.devolucion_exceso_metodo !== 'transferencia' &&
            dto.devolucion_exceso_metodo !== 'domicilio' &&
            dto.devolucion_exceso_metodo !== 'mesero') {
            throw new common_1.BadRequestException('Indica si el exceso es devolución al cliente (efectivo o transferencia) o pago domiciliario');
        }
        if (reparto.efectivoFactura > 0 && montoRecibidoEfectivo < reparto.efectivoFactura) {
            throw new common_1.BadRequestException(`El efectivo recibido debe cubrir la parte en efectivo (${reparto.efectivoFactura} de ${totalNeto} COP; recibido: ${montoRecibidoEfectivo})`);
        }
        const detalleExcesoCobro = (0, factura_vuelto_1.calcularDetalleExcesoCobro)({
            total: totalNeto,
            metodo: 'mixto',
            monto_recibido_efectivo: montoRecibidoEfectivo,
            monto_transferencia: dto.monto_transferencia,
            devolucion_exceso_metodo: dto.devolucion_exceso_metodo,
        });
        const detalleExcesoJson = detalleExcesoCobro
            ? detalleExcesoCobro
            : undefined;
        const precios = {};
        const lineasPadre = [];
        const cantSolicitud = new Map(solicitudes.map((s) => [s.id_detalle, s.cantidad]));
        for (const d of pedidoParaCobro.detalles) {
            precios[d.idDetalle] = Number(d.precioUnitario);
            if (d.idDetallePadre != null)
                continue;
            const q = cantSolicitud.get(d.idDetalle);
            if (q == null || q <= 0)
                continue;
            lineasPadre.push({
                id_detalle: d.idDetalle,
                precio_unitario: Number(d.precioUnitario),
                cantidad_pendiente: q,
            });
        }
        const netoDeCantidades = (cantidades) => {
            const base = Object.entries(cantidades)
                .filter(([, q]) => q > 0)
                .map(([id, cantidad]) => ({
                id_detalle: Number(id),
                cantidad,
            }));
            if (base.length === 0)
                return 0;
            const expandidas = (0, cobro_parcial_1.ordenarSolicitudesCobro)(detallesSerial, (0, cobro_parcial_1.expandirSolicitudesConEmpaques)(detallesSerial, base));
            return Number(this.calcularImportesFactura(pedidoParaCobro, expandidas, config).total);
        };
        const expandirCantidades = (cantidades) => {
            const base = Object.entries(cantidades)
                .filter(([, q]) => q > 0)
                .map(([id, cantidad]) => ({
                id_detalle: Number(id),
                cantidad,
            }));
            if (base.length === 0)
                return [];
            return (0, cobro_parcial_1.ordenarSolicitudesCobro)(detallesSerial, (0, cobro_parcial_1.expandirSolicitudesConEmpaques)(detallesSerial, base));
        };
        let { efectivo: solEfectivo, transferencia: solTransferencia } = (0, factura_mixto_1.dividirSolicitudesCobroMixto)(solicitudes, precios, reparto.efectivoFactura, totalNeto, {
            lineasPadre,
            netoDeCantidades,
            expandirCantidades,
        });
        if (reparto.efectivoFactura > 0 &&
            reparto.transferenciaFactura > 0 &&
            (solEfectivo.length === 0 || solTransferencia.length === 0)) {
            if (solEfectivo.length === 0 && solTransferencia.length === 0) {
                solTransferencia = [...solicitudes];
            }
            else if (solEfectivo.length === 0) {
                solEfectivo = [];
                solTransferencia = [...solicitudes];
            }
            else {
                solTransferencia = [];
                solEfectivo = [...solicitudes];
            }
        }
        if (solEfectivo.length === 0 &&
            solTransferencia.length === 0 &&
            solicitudes.length > 0) {
            solEfectivo = [...solicitudes];
        }
        const cobroMixtoGrupo = reparto.efectivoFactura > 0 && reparto.transferenciaFactura > 0
            ? (0, factura_mixto_1.nuevoCobroMixtoGrupo)()
            : null;
        const descFull = Number(importesTotales.dS) +
            Number(importesTotales.dM) +
            Number(importesTotales.dP);
        const fullImportes = {
            subtotal: totalNeto === Number(importesTotales.total)
                ? Number(importesTotales.subtotal)
                : totalNeto + descFull,
            descuento_sopas: Number(importesTotales.dS),
            descuento_muleros: Number(importesTotales.dM),
            descuento_promociones: Number(importesTotales.dP),
            total: totalNeto,
        };
        const proporcionales = cobroMixtoGrupo != null
            ? (0, cobro_invariantes_1.importesProporcionalesMixto)(fullImportes, reparto.efectivoFactura)
            : null;
        const enPlanSaldoMixto = dto.plan_personas_sobre_total === true ||
            dto.plan_combinado_sobre_seleccion === true;
        let esParcial = enPlanSaldoMixto
            ? pedidoParaCobro.detalles.some((d) => d.idFactura == null && (0, saldo_restante_1.esNotaSaldoRestantePendiente)(d.notaCocina))
            : (0, cobro_parcial_1.quedaPendienteTrasCobro)(detallesSerial, solicitudes);
        const idsFacturas = [];
        const crearEnTx = async (tx, sol, metodo, grupo, importesForzados) => {
            const factura = await tx.factura.create({
                data: {
                    idPedido,
                    idUsuario,
                    subtotal: new client_1.Prisma.Decimal(importesForzados.subtotal),
                    descuentoSopas: new client_1.Prisma.Decimal(importesForzados.descuento_sopas),
                    descuentoMuleros: new client_1.Prisma.Decimal(importesForzados.descuento_muleros),
                    descuentoPromociones: new client_1.Prisma.Decimal(importesForzados.descuento_promociones),
                    total: new client_1.Prisma.Decimal(importesForzados.total),
                    metodoPago: metodo,
                    esParcial,
                    personaPlanIndice: dto.persona_plan_indice ?? null,
                    ...this.planFacturaDataFromDto(dto),
                    cobroMixtoGrupo: grupo,
                    detalleExcesoCobro: detalleExcesoJson,
                },
            });
            const pedidoDet = await tx.pedido.findUnique({
                where: { idPedido },
                include: {
                    detalles: { include: detalleInclude, orderBy: { idDetalle: 'asc' } },
                },
            });
            const detallesPorId = new Map((pedidoDet?.detalles ?? []).map((d) => [d.idDetalle, d]));
            for (const s of sol) {
                const det = detallesPorId.get(s.id_detalle);
                if (!det) {
                    throw new common_1.BadRequestException('Ítem de cobro no encontrado');
                }
                if (det.idFactura != null) {
                    throw new common_1.ConflictException('Algún ítem ya fue cobrado. Actualiza el pedido e intenta de nuevo.');
                }
                await this.aplicarCobroDetalleEnTx(tx, det, s.cantidad, factura.idFactura);
            }
            return factura.idFactura;
        };
        try {
            await this.prisma.$transaction(async (tx) => {
                await (0, prisma_lock_1.lockPedidoEnTx)(tx, idPedido);
                let pedidoEnTx = await tx.pedido.findUnique({
                    where: { idPedido },
                    include: {
                        detalles: { include: detalleInclude, orderBy: { idDetalle: 'asc' } },
                        facturas: facturasInclude,
                    },
                });
                if (!pedidoEnTx) {
                    throw new common_1.NotFoundException('Pedido no encontrado');
                }
                if (pedidoEnTx.estado === 'facturado') {
                    throw new common_1.ConflictException('Este pedido ya fue facturado');
                }
                if (!ABIERTOS.includes(pedidoEnTx.estado)) {
                    throw new common_1.ConflictException('El pedido no se puede facturar');
                }
                let solEfTx = solEfectivo;
                let solTrTx = solTransferencia;
                if (enPlanSaldoMixto &&
                    proporcionales != null &&
                    solicitudes.length === 1 &&
                    reparto.efectivoFactura > 0 &&
                    reparto.transferenciaFactura > 0) {
                    const abonoId = solicitudes[0].id_detalle;
                    const abonoDet = await tx.detallePedido.findUnique({
                        where: { idDetalle: abonoId },
                    });
                    if (abonoDet && abonoDet.idFactura == null) {
                        await tx.detallePedido.update({
                            where: { idDetalle: abonoId },
                            data: { precioUnitario: proporcionales.primera.total },
                        });
                        const abonoTr = await tx.detallePedido.create({
                            data: {
                                idPedido,
                                idProducto: abonoDet.idProducto,
                                cantidad: 1,
                                precioUnitario: proporcionales.segunda.total,
                                notaCocina: saldo_restante_1.SALDO_ABONO_NOTA,
                                enviadoCocina: false,
                                listoCocina: false,
                                listoParaRecoger: false,
                            },
                        });
                        solEfTx = [{ id_detalle: abonoId, cantidad: 1 }];
                        solTrTx = [{ id_detalle: abonoTr.idDetalle, cantidad: 1 }];
                    }
                }
                if (reparto.efectivoFactura > 0) {
                    const impEf = proporcionales != null
                        ? proporcionales.primera
                        : {
                            subtotal: fullImportes.subtotal,
                            descuento_sopas: fullImportes.descuento_sopas,
                            descuento_muleros: fullImportes.descuento_muleros,
                            descuento_promociones: fullImportes.descuento_promociones,
                            total: fullImportes.total,
                        };
                    idsFacturas.push(await crearEnTx(tx, solEfTx, 'efectivo', cobroMixtoGrupo, impEf));
                }
                if (reparto.transferenciaFactura > 0) {
                    const impTr = proporcionales != null
                        ? proporcionales.segunda
                        : {
                            subtotal: fullImportes.subtotal,
                            descuento_sopas: fullImportes.descuento_sopas,
                            descuento_muleros: fullImportes.descuento_muleros,
                            descuento_promociones: fullImportes.descuento_promociones,
                            total: fullImportes.total,
                        };
                    idsFacturas.push(await crearEnTx(tx, solTrTx, 'transferencia', cobroMixtoGrupo, impTr));
                }
                if (proporcionales != null) {
                    const sumaPatas = proporcionales.primera.total + proporcionales.segunda.total;
                    if (sumaPatas !== totalNeto) {
                        throw new common_1.BadRequestException(`Inconsistencia de cobro mixto: ${sumaPatas} ≠ ${totalNeto}`);
                    }
                }
                if (idsFacturas.length > 0) {
                    await this.marcarPlatosRealesCobradosSiSaldoLiquidadoEnTx(tx, idPedido, idsFacturas[idsFacturas.length - 1], {
                        sobreTotal: dto.plan_personas_sobre_total === true,
                        pool: dto.plan_combinado_sobre_seleccion === true
                            ? (dto.detalles_seleccion_referencia ?? []).map((s) => ({
                                id_detalle: s.id_detalle,
                                cantidad: s.cantidad,
                            }))
                            : null,
                    });
                }
                if (reparto.excesoDevolverEfectivo > 0) {
                    await this.crearMovimientoExcesoTransferenciaEnTx(tx, {
                        idPedido,
                        idFactura: idsFacturas[0] ?? null,
                        idUsuario,
                        montoExceso: reparto.excesoDevolverEfectivo,
                        destino: dto.devolucion_exceso_metodo,
                    });
                }
                const idFacturaCierre = idsFacturas.length > 0
                    ? idsFacturas[idsFacturas.length - 1]
                    : 0;
                esParcial =
                    idFacturaCierre > 0
                        ? await this.liquidarYEvaluarPendienteEnTx(tx, idPedido, idFacturaCierre)
                        : true;
                if (idsFacturas.length > 0) {
                    await tx.factura.updateMany({
                        where: { idFactura: { in: idsFacturas } },
                        data: { esParcial },
                    });
                }
                if (!esParcial) {
                    await tx.pedido.update({
                        where: { idPedido },
                        data: {
                            estado: 'facturado',
                            cerradoEn: new Date(),
                        },
                    });
                    const abiertosRest = await tx.pedido.count({
                        where: { idMesa: pedidoEnTx.idMesa, estado: { in: ABIERTOS } },
                    });
                    if (abiertosRest === 0) {
                        await tx.mesa.update({
                            where: { idMesa: pedidoEnTx.idMesa },
                            data: { estado: 'libre' },
                        });
                    }
                }
            });
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                e.code === 'P2002' &&
                /id_pedido/i.test(String(e.meta?.target ?? ''))) {
                throw new common_1.BadRequestException('La base de datos aún no permite cobros parciales (varias facturas por pedido). ' +
                    'En el PC servidor ejecuta inicio.bat o, en desarrollo: cd services/api && npx prisma migrate deploy');
            }
            throw e;
        }
        this.emit(idPedido, pedido.idMesa, pedido.idUsuario, pedido.idRestaurante);
        const idFacturaImprimir = cobroMixtoGrupo != null
            ? Math.min(...idsFacturas)
            : idsFacturas[idsFacturas.length - 1];
        const completo = await this.obtenerPorIdTrasEscritura(idPedido);
        const ticketFactura = this.construirTicketFactura(completo, idFacturaImprimir, false, detalleExcesoCobro);
        const conCopia = dto.imprimir_factura !== false && dto.factura_con_copia === true;
        const impresionFactura = dto.imprimir_factura === false
            ? { impreso: false, omitido: true }
            : this.encolarImpresionFactura(ticketFactura, idPedido, conCopia);
        return {
            ...completo,
            id_factura_emitida: idFacturaImprimir,
            cobro_completo: !esParcial,
            impresion_factura: impresionFactura,
            factura_con_copia: conCopia,
            cobro_mixto_grupo: cobroMixtoGrupo,
        };
    }
    calcularImportesFactura(pedido, solicitudes, config) {
        const subtotalNum = (0, cobro_parcial_1.subtotalDesdeSolicitudes)(pedido.detalles.map((d) => ({
            id_detalle: d.idDetalle,
            precio_unitario: Number(d.precioUnitario),
            cantidad: d.cantidad,
        })), solicitudes);
        const subtotal = new client_1.Prisma.Decimal(subtotalNum);
        const detallesCobro = pedido.detalles.filter((d) => solicitudes.some((s) => s.id_detalle === d.idDetalle));
        const lineas = (0, cobro_parcial_1.lineasDescuentoDesdeSolicitudes)(detallesCobro.map((d) => ({
            id_detalle: d.idDetalle,
            cantidad: d.cantidad,
            precio_unitario: Number(d.precioUnitario),
            nombre_producto: d.producto.nombre,
            categoria_nombre: d.producto.categoria.nombre,
            id_categoria: d.producto.categoria.idCategoria,
            es_plato_principal: d.producto.esPlatoPrincipal,
            participa_descuento_sopas: d.producto.categoria.participaDescuentoSopas,
        })), solicitudes);
        const descuentos = this.descuentosDesdeConfig(lineas, config, pedido);
        const dS = new client_1.Prisma.Decimal(descuentos.descuento_sopas);
        const dM = new client_1.Prisma.Decimal(descuentos.descuento_muleros);
        const dP = new client_1.Prisma.Decimal(descuentos.descuento_promociones);
        const descTotal = dS.add(dM).add(dP);
        if (descTotal.gt(subtotal)) {
            throw new common_1.BadRequestException('La suma de descuentos no puede superar el subtotal de esta cuenta');
        }
        const total = subtotal.sub(descTotal);
        return { subtotal, dS, dM, dP, total };
    }
    async cerrarAnulandoPendiente(idPedido, dto, actor) {
        await this.assertPuedeCerrarConAnulacion(actor);
        const motivo = dto.motivo.trim();
        if (motivo.length < 3) {
            throw new common_1.BadRequestException('Indica un motivo de al menos 3 caracteres');
        }
        const pedido = await this.prisma.pedido.findUnique({
            where: { idPedido },
            include: {
                facturas: facturasInclude,
                mesa: true,
                detalles: {
                    include: { producto: { include: { categoria: true } } },
                },
            },
        });
        if (!pedido) {
            throw new common_1.NotFoundException('Pedido no encontrado');
        }
        if (!ABIERTOS.includes(pedido.estado)) {
            throw new common_1.ConflictException('El pedido ya está cerrado');
        }
        if (pedido.facturas.length === 0) {
            throw new common_1.BadRequestException('Esta acción solo aplica cuando ya hay cobros parciales registrados');
        }
        const idMesaPedido = pedido.idMesa;
        await this.prisma.$transaction(async (tx) => {
            await (0, prisma_lock_1.lockPedidoEnTx)(tx, idPedido);
            const pedidoTx = await tx.pedido.findUnique({
                where: { idPedido },
                include: { facturas: facturasInclude },
            });
            if (!pedidoTx || !ABIERTOS.includes(pedidoTx.estado)) {
                throw new common_1.ConflictException('El pedido ya no admite este cierre');
            }
            if (pedidoTx.facturas.length === 0) {
                throw new common_1.BadRequestException('Esta acción solo aplica cuando ya hay cobros parciales registrados');
            }
            const detallesTx = await tx.detallePedido.findMany({
                where: { idPedido },
                include: { producto: { include: { categoria: true } } },
            });
            const pendientesTx = detallesTx.filter((d) => d.idFactura == null);
            if (pendientesTx.length === 0) {
                throw new common_1.BadRequestException('No hay ítems pendientes por anular. Usa el cobro normal para cerrar la mesa.');
            }
            const lineasAnuladas = pendientesTx.map((d) => ({
                id_detalle: d.idDetalle,
                nombre_producto: d.producto.nombre,
                cantidad: d.cantidad,
                precio_unitario: Number(d.precioUnitario),
            }));
            for (const d of pendientesTx) {
                await (0, stock_bebida_1.reintegrarStockBebidaTx)(tx, d.producto, d.cantidad);
                await tx.detPersonalizacion.deleteMany({
                    where: { idDetalle: d.idDetalle },
                });
                await tx.detallePedido.delete({ where: { idDetalle: d.idDetalle } });
            }
            await tx.pedidoHistorial.create({
                data: {
                    idPedido,
                    idUsuario: actor.idUsuario,
                    tipo: 'pendiente_anulado_cierre',
                    detalleJson: {
                        motivo,
                        lineas_anuladas: lineasAnuladas,
                        facturas_previas: pedidoTx.facturas.map((f) => f.idFactura),
                    },
                },
            });
            await tx.pedido.update({
                where: { idPedido },
                data: { estado: 'facturado', cerradoEn: new Date() },
            });
            const abiertosRest = await tx.pedido.count({
                where: { idMesa: idMesaPedido, estado: { in: ABIERTOS } },
            });
            if (abiertosRest === 0) {
                await tx.mesa.update({
                    where: { idMesa: idMesaPedido },
                    data: { estado: 'libre' },
                });
            }
        });
        this.emit(idPedido, idMesaPedido, pedido.idUsuario, pedido.idRestaurante);
        return this.obtenerPorIdTrasEscritura(idPedido);
    }
    async assertPuedeCerrarConAnulacion(actor) {
        const efectivos = await this.permisos.getEfectivos(actor.idUsuario, actor.rol.nombre);
        if (!efectivos.puede_cerrar_anulando) {
            throw new common_1.ForbiddenException('Hoy no estás autorizado para cerrar mesa anulando lo pendiente. Pide al administrador.');
        }
    }
    esDetallePlatoCandidatoSaldo(d, pool, opts) {
        if (d.idDetallePadre != null)
            return false;
        if (d.producto.esCuotaPendienteReparto)
            return false;
        if ((0, saldo_restante_1.esNotaSaldoRestantePendiente)(d.notaCocina))
            return false;
        if ((d.notaCocina ?? '').trim().startsWith(saldo_restante_1.SALDO_ABONO_NOTA))
            return false;
        if (d.idFactura != null) {
            if (!opts?.incluirCobradosDePlan?.has(d.idFactura))
                return false;
        }
        if (pool != null && pool.length > 0) {
            return pool.some((p) => p.id_detalle === d.idDetalle);
        }
        return true;
    }
    async reconciliarSaldoAPlatos(idPedido, actor) {
        await this.exigirPermisoMesero(actor, 'cobrar');
        const pedido = await this.prisma.pedido.findUnique({
            where: { idPedido },
            include: {
                detalles: { include: detalleInclude, orderBy: { idDetalle: 'asc' } },
                facturas: { orderBy: { idFactura: 'asc' } },
            },
        });
        if (!pedido) {
            throw new common_1.NotFoundException('Pedido no encontrado');
        }
        if (pedido.estado === 'facturado') {
            throw new common_1.ConflictException('Este pedido ya fue facturado');
        }
        if (!ABIERTOS.includes(pedido.estado)) {
            throw new common_1.ConflictException('El pedido no admite cambios');
        }
        const saldo = this.findSaldoRestantePendiente(pedido.detalles);
        if (!saldo) {
            return this.obtenerPorIdTrasEscritura(idPedido);
        }
        const montoSaldo = Math.round(Number(saldo.precioUnitario)) * saldo.cantidad;
        const pool = (0, saldo_restante_1.parseSaldoRestantePool)(saldo.notaCocina);
        const idsFacturasPlan = new Set();
        for (const f of pedido.facturas) {
            if (f.planPersonasSobreTotal || f.planCombinadoSobreSeleccion) {
                idsFacturasPlan.add(f.idFactura);
            }
        }
        for (const d of pedido.detalles) {
            if (d.idFactura != null &&
                (d.notaCocina ?? '').trim().startsWith(saldo_restante_1.SALDO_ABONO_NOTA)) {
                idsFacturasPlan.add(d.idFactura);
            }
        }
        const candidatosPendientes = pedido.detalles.filter((d) => this.esDetallePlatoCandidatoSaldo(d, pool));
        const platosInput = candidatosPendientes.map((d) => ({
            id_detalle: d.idDetalle,
            precio_unitario: Math.round(Number(d.precioUnitario)),
            cantidad: d.cantidad,
        }));
        if (!(0, saldo_restante_1.saldoNecesitaReconciliarAPlatos)(montoSaldo, platosInput, saldo.notaCocina)) {
            return this.obtenerPorIdTrasEscritura(idPedido);
        }
        await this.prisma.$transaction(async (tx) => {
            await (0, prisma_lock_1.lockPedidoEnTx)(tx, idPedido);
            const pedidoTx = await tx.pedido.findUnique({
                where: { idPedido },
                include: {
                    detalles: { include: detalleInclude, orderBy: { idDetalle: 'asc' } },
                    facturas: { orderBy: { idFactura: 'asc' } },
                },
            });
            if (!pedidoTx) {
                throw new common_1.NotFoundException('Pedido no encontrado');
            }
            const saldoTx = this.findSaldoRestantePendiente(pedidoTx.detalles);
            if (!saldoTx)
                return;
            const montoSaldoTx = Math.round(Number(saldoTx.precioUnitario)) * saldoTx.cantidad;
            const poolTx = (0, saldo_restante_1.parseSaldoRestantePool)(saldoTx.notaCocina);
            const idsFacturasPlanTx = new Set();
            for (const f of pedidoTx.facturas) {
                if (f.planPersonasSobreTotal || f.planCombinadoSobreSeleccion) {
                    idsFacturasPlanTx.add(f.idFactura);
                }
            }
            for (const d of pedidoTx.detalles) {
                if (d.idFactura != null &&
                    (d.notaCocina ?? '').trim().startsWith(saldo_restante_1.SALDO_ABONO_NOTA)) {
                    idsFacturasPlanTx.add(d.idFactura);
                }
            }
            let candidatosTx = pedidoTx.detalles.filter((d) => this.esDetallePlatoCandidatoSaldo(d, poolTx));
            if (candidatosTx.length === 0 && idsFacturasPlanTx.size > 0) {
                for (const d of pedidoTx.detalles) {
                    if (!this.esDetallePlatoCandidatoSaldo(d, poolTx, {
                        incluirCobradosDePlan: idsFacturasPlanTx,
                    })) {
                        continue;
                    }
                    await tx.detallePedido.update({
                        where: { idDetalle: d.idDetalle },
                        data: { idFactura: null },
                    });
                    await tx.detallePedido.updateMany({
                        where: {
                            idPedido,
                            idDetallePadre: d.idDetalle,
                            idFactura: { in: [...idsFacturasPlanTx] },
                        },
                        data: { idFactura: null },
                    });
                }
                const recargado = await tx.pedido.findUnique({
                    where: { idPedido },
                    include: {
                        detalles: { include: detalleInclude, orderBy: { idDetalle: 'asc' } },
                    },
                });
                candidatosTx = (recargado?.detalles ?? []).filter((d) => this.esDetallePlatoCandidatoSaldo(d, poolTx));
            }
            if (candidatosTx.length === 0)
                return;
            const distTx = (0, saldo_restante_1.distribuirSaldoEnPlatos)(montoSaldoTx, candidatosTx.map((d) => ({
                id_detalle: d.idDetalle,
                precio_unitario: Math.round(Number(d.precioUnitario)),
                cantidad: d.cantidad,
            })));
            const liberarPorId = new Map(distTx.liberaciones.map((l) => [l.id_detalle, l.cantidad]));
            const idFacturaTx = pedidoTx.facturas.length > 0
                ? pedidoTx.facturas[pedidoTx.facturas.length - 1].idFactura
                : null;
            for (const d of candidatosTx) {
                const liberar = liberarPorId.get(d.idDetalle) ?? 0;
                const marcar = d.cantidad - liberar;
                if (marcar <= 0 || idFacturaTx == null)
                    continue;
                await this.aplicarCobroDetalleEnTx(tx, d, marcar, idFacturaTx);
            }
            const saldoActualizado = await tx.detallePedido.findUnique({
                where: { idDetalle: saldoTx.idDetalle },
            });
            if (!saldoActualizado || saldoActualizado.idFactura != null)
                return;
            if (distTx.montoSaldoRestante <= 0) {
                await tx.detallePedido.delete({
                    where: { idDetalle: saldoTx.idDetalle },
                });
            }
            else {
                await tx.detallePedido.update({
                    where: { idDetalle: saldoTx.idDetalle },
                    data: {
                        precioUnitario: distTx.montoSaldoRestante,
                        cantidad: 1,
                        notaCocina: saldo_restante_1.SALDO_RESTANTE_FRAGMENTO_NOTA,
                    },
                });
            }
            await tx.pedidoHistorial.create({
                data: {
                    idPedido,
                    idUsuario: actor.idUsuario,
                    tipo: 'detalle_agregado',
                    detalleJson: {
                        saldo_reconciliado_a_platos: true,
                        monto_saldo_antes: montoSaldoTx,
                        monto_platos: distTx.montoPlatos,
                        monto_saldo_restante: distTx.montoSaldoRestante,
                        liberaciones: distTx.liberaciones,
                    },
                },
            });
        });
        this.emit(idPedido, pedido.idMesa, pedido.idUsuario, pedido.idRestaurante);
        return this.obtenerPorIdTrasEscritura(idPedido);
    }
    async omitirCuotaPlan(idPedido, dto, actor) {
        await this.exigirPermisoMesero(actor, 'cobrar');
        const enPlan = dto.plan_personas_sobre_total === true ||
            dto.plan_combinado_sobre_seleccion === true;
        if (!enPlan) {
            throw new common_1.BadRequestException('Solo aplica en cobro por personas o combinado');
        }
        if (dto.persona_plan_indice > dto.total_personas_plan) {
            throw new common_1.BadRequestException('Índice de persona inválido');
        }
        if (dto.monto_persona_plan <= 0) {
            throw new common_1.BadRequestException('Cuota inválida');
        }
        const pedido = await this.prisma.pedido.findUnique({
            where: { idPedido },
            include: {
                detalles: { include: detalleInclude, orderBy: { idDetalle: 'asc' } },
                facturas: facturasInclude,
            },
        });
        if (!pedido) {
            throw new common_1.NotFoundException('Pedido no encontrado');
        }
        if (pedido.estado === 'facturado') {
            throw new common_1.ConflictException('Este pedido ya fue facturado');
        }
        if (!ABIERTOS.includes(pedido.estado)) {
            throw new common_1.ConflictException('El pedido no admite cambios');
        }
        const historialPrevio = await this.prisma.pedidoHistorial.findMany({
            where: { idPedido },
            select: { detalleJson: true, tipo: true },
        });
        const cuotasRegistradas = (0, cuota_pendiente_reparto_1.listarCuotasPlanOmitidas)(pedido.detalles.map((d) => ({
            cobrado: d.idFactura != null,
            nota_cocina: d.notaCocina,
            es_cuota_pendiente_reparto: d.producto.esCuotaPendienteReparto,
            precio_unitario: Number(d.precioUnitario),
            cantidad: d.cantidad,
        })), historialPrevio.map((h) => ({
            tipo: h.tipo,
            detalle: h.detalleJson,
        })));
        const sesionId = dto.plan_sesion_id != null && dto.plan_sesion_id > 0
            ? dto.plan_sesion_id
            : undefined;
        const yaExiste = cuotasRegistradas.some((c) => c.persona_plan_indice === dto.persona_plan_indice &&
            c.facturas_base_plan === dto.facturas_base_plan &&
            (sesionId != null
                ? c.plan_sesion_id === sesionId
                : c.plan_sesion_id == null));
        if (yaExiste) {
            throw new common_1.ConflictException(`La persona ${dto.persona_plan_indice} ya tiene cuota pendiente registrada`);
        }
        const configRow = await this.obtenerConfigDescuentosRow(pedido.idRestaurante);
        const config = this.mapConfigDescuentos(configRow);
        const poolRef = dto.plan_combinado_sobre_seleccion === true &&
            dto.detalles_seleccion_referencia != null &&
            dto.detalles_seleccion_referencia.length > 0
            ? dto.detalles_seleccion_referencia.map((s) => ({
                id_detalle: s.id_detalle,
                cantidad: s.cantidad,
            }))
            : null;
        let planBase = dto.plan_base_total != null ? Math.round(dto.plan_base_total) : 0;
        if (planBase <= 0) {
            const realesPendientes = pedido.detalles.filter((d) => d.idFactura == null &&
                d.idDetallePadre == null &&
                !d.producto.esCuotaPendienteReparto &&
                !(0, saldo_restante_1.esNotaSaldoRestantePendiente)(d.notaCocina));
            const baseSol = poolRef != null && poolRef.length > 0
                ? this.solicitudesPendientesEnPool(pedido, poolRef)
                : realesPendientes.map((d) => ({
                    id_detalle: d.idDetalle,
                    cantidad: d.cantidad,
                }));
            planBase =
                baseSol.length > 0
                    ? Number(this.calcularImportesFactura(pedido, baseSol, config).total)
                    : 0;
        }
        if (planBase <= 0) {
            throw new common_1.BadRequestException('No hay saldo pendiente para este reparto');
        }
        await this.prisma.$transaction(async (tx) => {
            await (0, prisma_lock_1.lockPedidoEnTx)(tx, idPedido);
            const pedidoTx = await tx.pedido.findUnique({
                where: { idPedido },
                include: {
                    detalles: { include: detalleInclude, orderBy: { idDetalle: 'asc' } },
                    facturas: { orderBy: { idFactura: 'asc' }, select: { total: true } },
                },
            });
            if (!pedidoTx) {
                throw new common_1.NotFoundException('Pedido no encontrado');
            }
            await tx.pedidoHistorial.create({
                data: {
                    idPedido,
                    idUsuario: actor.idUsuario,
                    tipo: 'detalle_agregado',
                    detalleJson: {
                        cuota_plan_omitida: true,
                        persona_plan_indice: dto.persona_plan_indice,
                        monto_persona_plan: dto.monto_persona_plan,
                        total_personas_plan: dto.total_personas_plan,
                        facturas_base_plan: dto.facturas_base_plan,
                        plan_sesion_id: sesionId ?? null,
                        plan_base_total: planBase,
                        plan_personas_sobre_total: dto.plan_personas_sobre_total ?? false,
                        plan_combinado_sobre_seleccion: dto.plan_combinado_sobre_seleccion ?? false,
                    },
                },
            });
            const cobradoEnPlan = pedidoTx.facturas
                .slice(dto.facturas_base_plan)
                .reduce((s, f) => s + Math.round(Number(f.total)), 0);
            const montoSaldo = Math.max(0, planBase - cobradoEnPlan);
            const notaSaldo = (0, saldo_restante_1.formatSaldoRestanteNota)(poolRef);
            const saldoExistente = this.findSaldoRestantePendiente(pedidoTx.detalles);
            if (montoSaldo <= 0) {
                if (saldoExistente) {
                    await tx.detallePedido.delete({
                        where: { idDetalle: saldoExistente.idDetalle },
                    });
                }
            }
            else if (saldoExistente) {
                await tx.detallePedido.update({
                    where: { idDetalle: saldoExistente.idDetalle },
                    data: {
                        precioUnitario: montoSaldo,
                        cantidad: 1,
                        notaCocina: notaSaldo,
                    },
                });
            }
            else {
                await this.asegurarSaldoRestanteEnTx(tx, idPedido, pedidoTx, montoSaldo, pedido.idRestaurante, poolRef);
            }
        });
        this.emit(idPedido, pedido.idMesa, pedido.idUsuario, pedido.idRestaurante);
        return this.obtenerPorIdTrasEscritura(idPedido);
    }
    async cancelar(idPedido, actor) {
        await this.exigirPermisoMesero(actor, 'cancelar_pedido');
        const pedido = await this.prisma.pedido.findUnique({
            where: { idPedido },
            include: { facturas: facturasInclude },
        });
        if (!pedido) {
            throw new common_1.NotFoundException('Pedido no encontrado');
        }
        if (pedido.estado === 'facturado' || pedido.facturas.length > 0) {
            throw new common_1.ConflictException('No se puede cancelar un pedido con cobros registrados');
        }
        if (!ABIERTOS.includes(pedido.estado)) {
            throw new common_1.ConflictException('El pedido no se puede cancelar');
        }
        const idMesaPedido = pedido.idMesa;
        await this.prisma.$transaction(async (tx) => {
            const detalles = await tx.detallePedido.findMany({
                where: { idPedido },
                include: { producto: { include: { categoria: true } } },
            });
            for (const d of detalles) {
                await (0, stock_bebida_1.reintegrarStockBebidaTx)(tx, d.producto, d.cantidad);
            }
            await tx.pedido.delete({ where: { idPedido } });
            const abiertosRest = await tx.pedido.count({
                where: { idMesa: idMesaPedido, estado: { in: ABIERTOS } },
            });
            if (abiertosRest === 0) {
                await tx.mesa.update({
                    where: { idMesa: idMesaPedido },
                    data: { estado: 'libre' },
                });
            }
        });
        this.emit(idPedido, pedido.idMesa, pedido.idUsuario, pedido.idRestaurante);
        return { ok: true };
    }
    async transferir(idPedido, dto, actor) {
        await this.exigirPermisoMesero(actor, 'transferir_mesa');
        const mesaNumero = dto.mesa_numero_nuevo;
        const idMesaFromDto = dto.id_mesa_nueva;
        if (mesaNumero == null && idMesaFromDto == null) {
            throw new common_1.BadRequestException('Debes enviar mesa_numero_nuevo (recomendado) o id_mesa_nueva');
        }
        const pedido = await this.prisma.pedido.findUnique({
            where: { idPedido },
            include: {
                facturas: facturasInclude,
                mesa: true,
                detalles: {
                    include: {
                        producto: { include: { categoria: true } },
                    },
                },
            },
        });
        if (!pedido) {
            throw new common_1.NotFoundException('Pedido no encontrado');
        }
        if (pedido.estado === 'facturado' || pedido.facturas.length > 0) {
            throw new common_1.ConflictException('No se puede transferir un pedido con cobros registrados');
        }
        if (!ABIERTOS.includes(pedido.estado)) {
            throw new common_1.ConflictException('El pedido no se puede transferir');
        }
        const mesaNueva = mesaNumero
            ? await this.prisma.mesa.findFirst({
                where: { numero: mesaNumero, idRestaurante: pedido.idRestaurante },
            })
            : await this.prisma.mesa.findFirst({
                where: { idMesa: idMesaFromDto, idRestaurante: pedido.idRestaurante },
            });
        if (!mesaNueva) {
            throw new common_1.NotFoundException('Mesa destino no encontrada');
        }
        if (pedido.idMesa === mesaNueva.idMesa) {
            throw new common_1.BadRequestException('La mesa destino debe ser diferente');
        }
        if (!(0, mesa_dia_1.mesaDisponibleHoyBogota)(mesaNueva)) {
            throw new common_1.ConflictException('La mesa destino no está disponible hoy');
        }
        const pedidoEnDestino = await this.prisma.pedido.findFirst({
            where: { idMesa: mesaNueva.idMesa, estado: { in: ABIERTOS } },
        });
        const destinoLibrePreliminar = mesaNueva.estado === 'libre' && pedidoEnDestino == null;
        const opRow = await this.obtenerConfigOperativaRow(pedido.idRestaurante);
        const validacionPreliminar = (0, transferencia_pedido_1.validarTransferenciaPedido)({
            origen_mesa_numero: pedido.mesa.numero,
            destino_mesa_numero: mesaNueva.numero,
            destino_libre: destinoLibrePreliminar,
            mesas_virtuales: opRow,
        });
        if (validacionPreliminar.accion === 'rechazar') {
            throw new common_1.ConflictException(validacionPreliminar.mensaje);
        }
        const mesaAnteriorId = pedido.idMesa;
        const op = await this.ctxOperativa(pedido.idRestaurante);
        await this.prisma.$transaction(async (tx) => {
            const idsOrdenados = [mesaAnteriorId, mesaNueva.idMesa].sort((a, b) => a - b);
            for (const idMesa of idsOrdenados) {
                await (0, prisma_lock_1.lockMesaEnTx)(tx, idMesa);
            }
            const pedidoTx = await tx.pedido.findUnique({
                where: { idPedido },
                include: { facturas: facturasInclude },
            });
            if (!pedidoTx) {
                throw new common_1.NotFoundException('Pedido no encontrado');
            }
            if (pedidoTx.estado === 'facturado' || pedidoTx.facturas.length > 0) {
                throw new common_1.ConflictException('No se puede transferir un pedido con cobros registrados');
            }
            if (!ABIERTOS.includes(pedidoTx.estado)) {
                throw new common_1.ConflictException('El pedido no se puede transferir');
            }
            const mesaDestinoTx = await tx.mesa.findUnique({
                where: { idMesa: mesaNueva.idMesa },
            });
            if (!mesaDestinoTx) {
                throw new common_1.NotFoundException('Mesa destino no encontrada');
            }
            const otroEnDestino = await tx.pedido.findFirst({
                where: { idMesa: mesaNueva.idMesa, estado: { in: ABIERTOS } },
            });
            const destinoLibre = mesaDestinoTx.estado === 'libre' && otroEnDestino == null;
            const validacion = (0, transferencia_pedido_1.validarTransferenciaPedido)({
                origen_mesa_numero: pedido.mesa.numero,
                destino_mesa_numero: mesaNueva.numero,
                destino_libre: destinoLibre,
                mesas_virtuales: opRow,
            });
            if (validacion.accion === 'rechazar') {
                throw new common_1.ConflictException(validacion.mensaje);
            }
            await tx.pedido.update({
                where: { idPedido },
                data: { idMesa: mesaNueva.idMesa, modoServicio: 'en_mesa' },
            });
            await tx.mesa.update({
                where: { idMesa: mesaNueva.idMesa },
                data: { estado: 'ocupada' },
            });
            const restantesOrigen = await tx.pedido.count({
                where: { idMesa: mesaAnteriorId, estado: { in: ABIERTOS } },
            });
            if (restantesOrigen === 0 &&
                !(await this.esMesaVirtualNumero(pedido.mesa.numero))) {
                await tx.mesa.update({
                    where: { idMesa: mesaAnteriorId },
                    data: { estado: 'libre' },
                });
            }
            const detallesPostMovimiento = await tx.detallePedido.findMany({
                where: { idPedido },
                include: { producto: { include: { categoria: true } } },
            });
            const detallesMazorcaCtx = detallesPostMovimiento.map((d) => ({
                es_bebida: (0, cocina_producto_1.categoriaEsBebida)(d.producto.categoria),
                es_acompanamiento_mazorca: d.producto.esAcompanamientoMazorca,
                es_empacable: d.producto.esEmpacable,
                categoria_nombre: d.producto.categoria.nombre,
                id_detalle_padre: d.idDetallePadre,
            }));
            await (0, mazorca_linea_pedido_1.sincronizarLineaMazorcaAcompanamiento)(tx, {
                idPedido,
                numComensales: pedido.numComensales,
                mesaNumero: mesaNueva.numero,
                estadoPedido: pedido.estado,
                idProductoMazorca: op.idProductoMazorca,
                usaLineaMazorca: (0, transferencia_pedido_1.pedidoDebeTenerLineaMazorca)(mesaNueva.numero, detallesMazorcaCtx, op.mazorcaActiva),
                idRestaurante: pedido.idRestaurante,
            });
        });
        this.emit(idPedido, mesaAnteriorId, pedido.idUsuario, pedido.idRestaurante);
        this.emit(idPedido, mesaNueva.idMesa, pedido.idUsuario, pedido.idRestaurante);
        return this.obtenerPorIdTrasEscritura(idPedido);
    }
    async cambiarEstado(idPedido, estado) {
        const pedido = await this.prisma.pedido.findUnique({
            where: { idPedido },
        });
        if (!pedido) {
            throw new common_1.NotFoundException('Pedido no encontrado');
        }
        (0, estado_pedido_transiciones_1.validarTransicionEstadoPedido)(pedido.estado, estado);
        if (pedido.estado === estado) {
            return this.obtenerPorIdTrasEscritura(idPedido);
        }
        await this.prisma.pedido.update({
            where: { idPedido },
            data: { estado },
        });
        this.emit(idPedido, pedido.idMesa, pedido.idUsuario, pedido.idRestaurante);
        return this.obtenerPorIdTrasEscritura(idPedido);
    }
    async setPrioridadCocina(idPedido, modo) {
        const pedido = await this.prisma.pedido.findUnique({
            where: { idPedido },
        });
        if (!pedido) {
            throw new common_1.NotFoundException('Pedido no encontrado');
        }
        if (!ABIERTOS.includes(pedido.estado)) {
            throw new common_1.ConflictException('Solo pedidos abiertos o en cocina admiten prioridad de cocina');
        }
        const data = {
            prioridadCocinaOverride: modo === 'auto' ? null : modo,
        };
        await this.prisma.pedido.update({
            where: { idPedido },
            data,
        });
        this.emit(idPedido, pedido.idMesa, pedido.idUsuario, pedido.idRestaurante);
        return this.obtenerPorIdTrasEscritura(idPedido);
    }
    lineaFacturaDesdePedidoSerial(d, cantidadOverride) {
        const cantidad = cantidadOverride ?? d.cantidad;
        const pu = d.precio_unitario;
        return {
            id_detalle: d.id_detalle,
            id_producto: d.id_producto,
            id_detalle_padre: d.id_detalle_padre,
            nombre_producto: d.nombre_producto,
            cantidad,
            precio_unitario: pu,
            subtotal_linea: cantidadOverride != null ? pu * cantidad : (d.subtotal_linea ?? pu * cantidad),
            nota_cocina: d.nota_cocina,
            cobrado: d.cobrado,
            personalizaciones: (d.personalizaciones ?? []).map((p) => ({
                id_opcion: p.id_opcion,
                descripcion: p.descripcion,
            })),
            categoria_nombre: d.categoria_nombre,
            es_plato_principal: d.es_plato_principal,
            es_bebida: d.es_bebida,
            es_empacable: d.es_empacable,
            es_acompanamiento_mazorca: d.es_acompanamiento_mazorca,
        };
    }
    lineaFacturaDesdePrismaResumen(d) {
        const pu = Number(d.precioUnitario);
        const cat = d.producto.categoria;
        return {
            id_detalle: d.idDetalle,
            id_producto: d.idProducto,
            id_detalle_padre: d.idDetallePadre,
            nombre_producto: d.producto.nombre,
            cantidad: d.cantidad,
            precio_unitario: pu,
            subtotal_linea: pu * d.cantidad,
            nota_cocina: d.notaCocina,
            personalizaciones: d.personalizaciones.map((dp) => ({
                id_opcion: dp.opcion.idOpcion,
                descripcion: dp.opcion.descripcion,
            })),
            categoria_nombre: cat.nombre,
            es_plato_principal: d.producto.esPlatoPrincipal,
            es_bebida: cat.esBebida,
            es_empacable: d.producto.esEmpacable,
            es_acompanamiento_mazorca: d.producto.esAcompanamientoMazorca,
        };
    }
    serializarPedido(p, opts) {
        const detalles = p.detalles.map((d) => {
            const esSaldoRestante = (0, saldo_restante_1.esNotaSaldoRestantePendiente)(d.notaCocina) ||
                (d.notaCocina ?? '').trim().startsWith(saldo_restante_1.SALDO_ABONO_NOTA);
            const esCuotaPend = d.producto.esCuotaPendienteReparto ||
                (0, cuota_pendiente_reparto_1.parseCuotaPendienteNota)(d.notaCocina) != null ||
                esSaldoRestante;
            const marcar = esCuotaPend
                ? false
                : productoDebePasarCocina(d.producto);
            const tipoProteina = (0, cocina_prioridad_1.tipoProteinaResuelto)(d.producto.tipoProteina, d.producto.categoria.nombre, d.producto.nombre);
            const nombreProducto = (0, saldo_restante_1.esNotaSaldoRestantePendiente)(d.notaCocina)
                ? saldo_restante_1.NOMBRE_DISPLAY_SALDO_PENDIENTE
                : (d.notaCocina ?? '').trim().startsWith(saldo_restante_1.SALDO_ABONO_NOTA)
                    ? 'Abono'
                    : esCuotaPend
                        ? (0, cuota_pendiente_reparto_1.nombreProductoCuotaPendienteDisplay)(d.producto.nombre, d.notaCocina)
                        : d.producto.nombre;
            return {
                id_detalle: d.idDetalle,
                id_producto: d.idProducto,
                id_detalle_padre: d.idDetallePadre,
                nombre_producto: nombreProducto,
                categoria_nombre: d.producto.categoria.nombre,
                id_categoria: d.producto.categoria.idCategoria,
                participa_descuento_sopas: d.producto.categoria.participaDescuentoSopas,
                tipo_proteina: tipoProteina,
                es_bebida: (0, cocina_producto_1.categoriaEsBebida)(d.producto.categoria),
                es_empacable: d.producto.esEmpacable,
                es_plato_principal: d.producto.esPlatoPrincipal,
                es_acompanamiento_mazorca: d.producto.esAcompanamientoMazorca,
                categoria_prioridad_cocina_baja: d.producto.categoria.prioridadCocinaBaja,
                producto_prioridad_cocina_baja: d.producto.prioridadCocinaBaja,
                es_cuota_pendiente_reparto: esCuotaPend,
                marcar_cocina: marcar,
                enviado_cocina: d.enviadoCocina,
                listo_para_recoger: d.listoParaRecoger,
                listo_cocina: d.listoCocina,
                cantidad: d.cantidad,
                precio_unitario: Number(d.precioUnitario),
                subtotal_linea: Number(d.precioUnitario) * d.cantidad,
                nota_cocina: d.notaCocina,
                cobrado: d.idFactura != null ||
                    (!esCuotaPend && d.producto.esAcompanamientoMazorca),
                id_factura: d.idFactura,
                personalizaciones: d.personalizaciones.map((dp) => ({
                    id_opcion: dp.opcion.idOpcion,
                    tipo: dp.opcion.tipo,
                    descripcion: dp.opcion.descripcion,
                })),
            };
        });
        const prioridadAuto = (0, cocina_prioridad_1.prioridadAutomaticaResuelta)(detalles.map((d) => ({
            categoria_nombre: d.categoria_nombre,
            nombre_producto: d.nombre_producto,
            marcar_cocina: d.marcar_cocina,
            es_plato_principal: d.es_plato_principal,
            categoria_prioridad_cocina_baja: d.categoria_prioridad_cocina_baja,
            producto_prioridad_cocina_baja: d.producto_prioridad_cocina_baja,
        })), {
            modo: opts?.prioridad_cocina_modo,
            automaticaActiva: opts?.prioridad_cocina_automatica,
        });
        const override = p.prioridadCocinaOverride ?? null;
        const { nivel: prioridadCocina, origen: prioridadCocinaOrigen } = (0, cocina_prioridad_1.prioridadCocinaEfectiva)(prioridadAuto, override);
        const facturas = p.facturas.map((f) => this.mapFacturaSerial(f));
        const ultimaFactura = facturas.length ? facturas[facturas.length - 1] : null;
        const pendientesComida = detalles.filter((d) => !d.cobrado &&
            !d.es_cuota_pendiente_reparto &&
            !d.es_acompanamiento_mazorca &&
            d.subtotal_linea > 0);
        const totalPendiente = pendientesComida.reduce((s, d) => s + d.subtotal_linea, 0);
        return {
            id_pedido: p.idPedido,
            id_mesa: p.idMesa,
            mesa_numero: p.mesa.numero,
            estado: p.estado,
            modo_servicio: p.modoServicio,
            num_comensales: p.numComensales,
            creado_en: p.creadoEn,
            cerrado_en: p.cerradoEn,
            prioridad_cocina: prioridadCocina,
            prioridad_cocina_origen: prioridadCocinaOrigen,
            prioridad_cocina_auto: prioridadAuto,
            prioridad_cocina_override: override === null ? null : override,
            cliente_mulero: p.clienteMulero,
            etiquetas_promocion: this.etiquetasPromocionPedido(p),
            mesero: {
                id: p.usuario.idUsuario,
                nombre: p.usuario.nombre,
                apellido: p.usuario.apellido,
                email: p.usuario.email,
                rol: p.usuario.rol.nombre,
            },
            detalles,
            facturas,
            factura: ultimaFactura,
            cuotas_plan_omitidas: [],
            cobro_pendiente: {
                items: pendientesComida.length,
                subtotal: totalPendiente,
            },
        };
    }
};
exports.PedidosService = PedidosService;
exports.PedidosService = PedidosService = PedidosService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        pedidos_gateway_1.PedidosGateway,
        comanda_printer_service_1.ComandaPrinterService,
        factura_email_service_1.FacturaEmailService,
        permisos_service_1.PermisosService])
], PedidosService);
//# sourceMappingURL=pedidos.service.js.map