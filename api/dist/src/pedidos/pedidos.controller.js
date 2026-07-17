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
exports.PedidosController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const write_throttle_decorator_1 = require("../common/write-throttle.decorator");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const current_tenant_decorator_1 = require("../tenant/current-tenant.decorator");
const detalle_tenant_guard_1 = require("../tenant/detalle-tenant.guard");
const pedido_tenant_guard_1 = require("../tenant/pedido-tenant.guard");
const pedidos_service_1 = require("./pedidos.service");
const create_pedido_dto_1 = require("./dto/create-pedido.dto");
const add_detalle_dto_1 = require("./dto/add-detalle.dto");
const facturar_dto_1 = require("./dto/facturar.dto");
const facturar_mixto_dto_1 = require("./dto/facturar-mixto.dto");
const omitir_cuota_plan_dto_1 = require("./dto/omitir-cuota-plan.dto");
const imprimir_precuenta_dto_1 = require("./dto/imprimir-precuenta.dto");
const imprimir_resumen_seleccion_dto_1 = require("./dto/imprimir-resumen-seleccion.dto");
const caja_diaria_dto_1 = require("./dto/caja-diaria.dto");
const caja_diaria_cierre_dto_1 = require("./dto/caja-diaria-cierre.dto");
const crear_movimiento_caja_dto_1 = require("./dto/crear-movimiento-caja.dto");
const vaciar_resumen_diario_dto_1 = require("./dto/vaciar-resumen-diario.dto");
const upsert_config_descuentos_dto_1 = require("./dto/upsert-config-descuentos.dto");
const upsert_config_operativa_dto_1 = require("./dto/upsert-config-operativa.dto");
const patch_cliente_mulero_dto_1 = require("./dto/patch-cliente-mulero.dto");
const patch_etiquetas_promocion_dto_1 = require("./dto/patch-etiquetas-promocion.dto");
const patch_mazorcas_pedido_dto_1 = require("./dto/patch-mazorcas-pedido.dto");
const patch_estado_dto_1 = require("./dto/patch-estado.dto");
const transferir_dto_1 = require("./dto/transferir.dto");
const agrupar_mesa_dto_1 = require("./dto/agrupar-mesa.dto");
const cerrar_anulando_pendiente_dto_1 = require("./dto/cerrar-anulando-pendiente.dto");
const cancelar_reabiertos_dto_1 = require("./dto/cancelar-reabiertos.dto");
const reabrir_cobro_dto_1 = require("./dto/reabrir-cobro.dto");
const revertir_tanda_cobro_dto_1 = require("./dto/revertir-tanda-cobro.dto");
const enviar_factura_correo_dto_1 = require("./dto/enviar-factura-correo.dto");
const patch_detalle_cocina_dto_1 = require("./dto/patch-detalle-cocina.dto");
const patch_listo_para_recoger_dto_1 = require("./dto/patch-listo-para-recoger.dto");
const falta_en_cocina_dto_1 = require("./dto/falta-en-cocina.dto");
const patch_detalle_cantidad_dto_1 = require("./dto/patch-detalle-cantidad.dto");
const patch_detalle_subitems_dto_1 = require("./dto/patch-detalle-subitems.dto");
const patch_prioridad_cocina_dto_1 = require("./dto/patch-prioridad-cocina.dto");
let PedidosController = class PedidosController {
    pedidos;
    constructor(pedidos) {
        this.pedidos = pedidos;
    }
    estadoImpresora() {
        return this.pedidos.estadoImpresora();
    }
    pruebaImpresora() {
        return this.pedidos.pruebaImpresora();
    }
    crear(dto, req) {
        return this.pedidos.crear(dto, req.user.idUsuario, req.user.idRestaurante);
    }
    activosPorMesa(mesaId, req) {
        return this.pedidos.pedidosActivosPorMesa(mesaId, req.user.idRestaurante);
    }
    porMesa(mesaId, req) {
        return this.pedidos.pedidoActivoPorMesa(mesaId, req.user.idRestaurante);
    }
    listarCocina(req) {
        return this.pedidos.listarCocina(req.user);
    }
    listarMisActivosResumen(req) {
        return this.pedidos.listarMisActivosResumen(req.user);
    }
    listarPendientesCobroResumen(req) {
        return this.pedidos.listarPendientesCobroResumen(req.user);
    }
    listarMisActivos(req) {
        return this.pedidos.listarMisActivos(req.user);
    }
    listarAyudaCompanerosResumen(req) {
        return this.pedidos.listarAyudaCompanerosResumen(req.user);
    }
    listarAyudaCompaneros(req) {
        return this.pedidos.listarAyudaCompaneros(req.user);
    }
    listar(estados, orden, limitStr, offsetStr, tenantId) {
        if (!estados?.trim()) {
            throw new common_1.BadRequestException('El parámetro "estados" es obligatorio (ej. estados=abierto,en_cocina)');
        }
        const o = orden === 'prioridad_cocina'
            ? 'prioridad_cocina'
            : orden === 'asc'
                ? 'asc'
                : 'desc';
        const limitRaw = Number(limitStr ?? '50');
        const offsetRaw = Number(offsetStr ?? '0');
        const limit = Math.min(200, Math.max(1, Number.isFinite(limitRaw) ? Math.floor(limitRaw) : 50));
        const offset = Math.max(0, Number.isFinite(offsetRaw) ? Math.floor(offsetRaw) : 0);
        return this.pedidos.listar(estados, o, { limit, offset }, tenantId);
    }
    resumenDiarioLineasFactura(idFactura) {
        return this.pedidos.resumenDiarioLineasFactura(idFactura);
    }
    resumenDiario(fecha, periodo, tenantId) {
        return this.pedidos.resumenDiario(fecha, { periodo }, tenantId);
    }
    vaciarResumenDiario(dto, fecha, req) {
        return this.pedidos.vaciarResumenDiario(req.user, dto, fecha);
    }
    cancelarPedidosReabiertos(dto, fecha, req) {
        return this.pedidos.cancelarPedidosReabiertos(req.user, dto, fecha);
    }
    imprimirResumenCompleto(fecha) {
        return this.pedidos.imprimirResumenDiarioCompleto(fecha);
    }
    imprimirResumenTotal(fecha) {
        return this.pedidos.imprimirResumenDiarioTotal(fecha);
    }
    imprimirResumenSeleccion(dto, fecha) {
        return this.pedidos.imprimirResumenDiarioSeleccion(dto, fecha);
    }
    cajaDiaria(fecha, tenantId) {
        return this.pedidos.getCajaDiaria(fecha, tenantId);
    }
    upsertCajaDiaria(dto, tenantId) {
        return this.pedidos.upsertCajaDiaria(dto, tenantId);
    }
    upsertCajaDiariaCierre(dto, tenantId) {
        return this.pedidos.upsertCajaDiariaCierre(dto, tenantId);
    }
    crearMovimientoCaja(dto, req) {
        return this.pedidos.registrarMovimientoCajaManual(req.user, dto);
    }
    imprimirMovimientoCaja(id, req) {
        return this.pedidos.imprimirMovimientoCajaManual(req.user, id);
    }
    eliminarMovimientoCaja(id, req) {
        return this.pedidos.eliminarMovimientoCaja(req.user, id);
    }
    configDescuentos(tenantId) {
        return this.pedidos.getConfigDescuentos(tenantId);
    }
    upsertConfigDescuentos(dto, tenantId) {
        return this.pedidos.upsertConfigDescuentos(dto, tenantId);
    }
    configOperativa(tenantId) {
        return this.pedidos.getConfigOperativa(tenantId);
    }
    upsertConfigOperativa(dto, tenantId) {
        return this.pedidos.upsertConfigOperativa(dto, tenantId);
    }
    setClienteMulero(id, dto) {
        return this.pedidos.setClienteMulero(id, dto.cliente_mulero);
    }
    setEtiquetasPromocion(id, dto) {
        return this.pedidos.setEtiquetasPromocion(id, dto);
    }
    actualizarComensales(id, dto) {
        return this.pedidos.actualizarComensalesPedido(id, dto);
    }
    marcarDetalleCocina(idDetalle, dto) {
        return this.pedidos.marcarDetalleRecogido(idDetalle, dto);
    }
    avisarFaltaEnCocina(idDetalle, dto, req) {
        return this.pedidos.avisarFaltaEnCocina(idDetalle, req.user.idUsuario, req.user.rol.nombre, dto.cantidad);
    }
    marcarListoParaRecoger(idDetalle, dto) {
        return this.pedidos.marcarListoParaRecoger(idDetalle, dto);
    }
    llamarMesero(id) {
        return this.pedidos.llamarMesero(id);
    }
    actualizarCantidadDetalle(idDetalle, dto, req) {
        return this.pedidos.actualizarCantidadDetalle(idDetalle, dto, req.user);
    }
    asignarSubitemsDetalle(idDetalle, dto, req) {
        return this.pedidos.asignarSubitemsDetalle(idDetalle, dto, req.user);
    }
    eliminarDetalle(idDetalle, req) {
        return this.pedidos.eliminarDetalle(idDetalle, req.user);
    }
    agregarEmpaqueAutoDetalle(idDetalle, req) {
        return this.pedidos.agregarEmpaqueAutoDetalle(idDetalle, req.user);
    }
    sincronizarEmpaquesParaLlevar(id, req) {
        return this.pedidos.sincronizarEmpaquesParaLlevar(id, req.user);
    }
    historialPedido(id) {
        return this.pedidos.historialPedido(id);
    }
    uno(id, vista) {
        if (vista === 'operativa') {
            return this.pedidos.obtenerPorIdVistaOperativa(id);
        }
        return this.pedidos.obtenerPorId(id);
    }
    agregarDetalle(id, dto, req) {
        return this.pedidos.agregarDetalle(id, dto, req.user);
    }
    pasarCocina(id, req) {
        return this.pedidos.pasarCocina(id, req.user);
    }
    reimprimirComanda(id, req) {
        return this.pedidos.reimprimirComanda(id, req.user);
    }
    enviarFacturaCorreo(id, dto, req) {
        return this.pedidos.enviarFacturaCorreo(id, dto.id_factura, dto.email, req.user);
    }
    reimprimirFactura(id, idFactura, req) {
        const idF = idFactura != null && idFactura !== ''
            ? parseInt(idFactura, 10)
            : undefined;
        return this.pedidos.reimprimirFactura(id, idF != null && Number.isFinite(idF) ? idF : undefined, req.user);
    }
    reimprimirPedidoTotal(id) {
        return this.pedidos.reimprimirPedidoTotal(id);
    }
    imprimirPrecuenta(id, dto, req) {
        return this.pedidos.imprimirPrecuenta(id, dto, req.user);
    }
    facturar(id, dto, req) {
        return this.pedidos.facturar(id, dto, req.user);
    }
    facturarMixto(id, dto, req) {
        return this.pedidos.facturarMixto(id, dto, req.user);
    }
    omitirCuotaPlan(id, dto, req) {
        return this.pedidos.omitirCuotaPlan(id, dto, req.user);
    }
    reconciliarSaldoAPlatos(id, req) {
        return this.pedidos.reconciliarSaldoAPlatos(id, req.user);
    }
    cancelar(id, req) {
        return this.pedidos.cancelar(id, req.user);
    }
    cerrarAnulandoPendiente(id, dto, req) {
        return this.pedidos.cerrarAnulandoPendiente(id, dto, req.user);
    }
    reabrirCobro(id, dto, req) {
        return this.pedidos.reabrirCobro(id, dto, req.user);
    }
    revertirTandaCobro(id, dto, req) {
        return this.pedidos.revertirTandaCobro(id, dto, req.user);
    }
    agruparMesa(id, dto, req) {
        return this.pedidos.agruparMesa(id, dto, req.user);
    }
    desagruparMesa(id, dto, req) {
        return this.pedidos.desagruparMesa(id, dto, req.user);
    }
    transferir(id, dto, req) {
        return this.pedidos.transferir(id, dto, req.user);
    }
    estado(id, dto) {
        return this.pedidos.cambiarEstado(id, dto.estado);
    }
    prioridadCocina(id, dto) {
        return this.pedidos.setPrioridadCocina(id, dto.modo);
    }
};
exports.PedidosController = PedidosController;
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)('estado-impresora'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "estadoImpresora", null);
__decorate([
    (0, common_1.Post)('prueba-impresora'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "pruebaImpresora", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_pedido_dto_1.CreatePedidoDto, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "crear", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)('activos-por-mesa/:mesaId'),
    __param(0, (0, common_1.Param)('mesaId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "activosPorMesa", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)('por-mesa/:mesaId'),
    __param(0, (0, common_1.Param)('mesaId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "porMesa", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)('cocina'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'chef'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "listarCocina", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)('mis-activos/resumen'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "listarMisActivosResumen", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)('pendientes-cobro/resumen'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "listarPendientesCobroResumen", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)('mis-activos'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "listarMisActivos", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)('ayuda-companeros/resumen'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "listarAyudaCompanerosResumen", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)('ayuda-companeros'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "listarAyudaCompaneros", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('estados')),
    __param(1, (0, common_1.Query)('orden')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('offset')),
    __param(4, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Number]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "listar", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)('resumen-diario/facturas/:idFactura/lineas'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'superadmin'),
    __param(0, (0, common_1.Param)('idFactura', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "resumenDiarioLineasFactura", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)('resumen-diario'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'superadmin'),
    __param(0, (0, common_1.Query)('fecha')),
    __param(1, (0, common_1.Query)('periodo')),
    __param(2, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "resumenDiario", null);
__decorate([
    (0, common_1.Post)('resumen-diario/vaciar'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('superadmin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('fecha')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [vaciar_resumen_diario_dto_1.VaciarResumenDiarioDto, Object, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "vaciarResumenDiario", null);
__decorate([
    (0, common_1.Post)('resumen-diario/cancelar-reabiertos'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('superadmin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('fecha')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cancelar_reabiertos_dto_1.CancelarReabiertosDto, Object, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "cancelarPedidosReabiertos", null);
__decorate([
    (0, common_1.Post)('resumen-diario/imprimir-completo'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'superadmin'),
    __param(0, (0, common_1.Query)('fecha')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "imprimirResumenCompleto", null);
__decorate([
    (0, common_1.Post)('resumen-diario/imprimir-total'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'superadmin'),
    __param(0, (0, common_1.Query)('fecha')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "imprimirResumenTotal", null);
__decorate([
    (0, common_1.Post)('resumen-diario/imprimir-seleccion'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'superadmin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('fecha')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [imprimir_resumen_seleccion_dto_1.ImprimirResumenSeleccionDto, String]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "imprimirResumenSeleccion", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)('caja-diaria'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Query)('fecha')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "cajaDiaria", null);
__decorate([
    (0, common_1.Put)('caja-diaria'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [caja_diaria_dto_1.UpsertCajaDiariaDto, Number]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "upsertCajaDiaria", null);
__decorate([
    (0, common_1.Put)('caja-diaria/cierre'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [caja_diaria_cierre_dto_1.UpsertCajaDiariaCierreDto, Number]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "upsertCajaDiariaCierre", null);
__decorate([
    (0, common_1.Post)('movimientos-caja'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [crear_movimiento_caja_dto_1.CrearMovimientoCajaDto, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "crearMovimientoCaja", null);
__decorate([
    (0, common_1.Post)('movimientos-caja/:id/imprimir'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "imprimirMovimientoCaja", null);
__decorate([
    (0, common_1.Delete)('movimientos-caja/:id'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "eliminarMovimientoCaja", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)('config-descuentos'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "configDescuentos", null);
__decorate([
    (0, common_1.Put)('config-descuentos'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [upsert_config_descuentos_dto_1.UpsertConfigDescuentosDto, Number]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "upsertConfigDescuentos", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)('config-operativa'),
    __param(0, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "configOperativa", null);
__decorate([
    (0, common_1.Put)('config-operativa'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [upsert_config_operativa_dto_1.UpsertConfigOperativaDto, Number]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "upsertConfigOperativa", null);
__decorate([
    (0, common_1.Patch)(':id/cliente-mulero'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, patch_cliente_mulero_dto_1.PatchClienteMuleroDto]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "setClienteMulero", null);
__decorate([
    (0, common_1.Patch)(':id/etiquetas-promocion'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, patch_etiquetas_promocion_dto_1.PatchEtiquetasPromocionDto]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "setEtiquetasPromocion", null);
__decorate([
    (0, common_1.Patch)(':id/mazorcas'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, patch_mazorcas_pedido_dto_1.PatchMazorcasPedidoDto]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "actualizarComensales", null);
__decorate([
    (0, common_1.Patch)('detalles/:idDetalle/cocina'),
    (0, common_1.UseGuards)(detalle_tenant_guard_1.DetalleTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Param)('idDetalle', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, patch_detalle_cocina_dto_1.PatchDetalleCocinaDto]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "marcarDetalleCocina", null);
__decorate([
    (0, common_1.Post)('detalles/:idDetalle/falta-en-cocina'),
    (0, common_1.UseGuards)(detalle_tenant_guard_1.DetalleTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Param)('idDetalle', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, falta_en_cocina_dto_1.FaltaEnCocinaDto, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "avisarFaltaEnCocina", null);
__decorate([
    (0, common_1.Patch)('detalles/:idDetalle/listo-para-recoger'),
    (0, common_1.UseGuards)(detalle_tenant_guard_1.DetalleTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'chef'),
    __param(0, (0, common_1.Param)('idDetalle', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, patch_listo_para_recoger_dto_1.PatchListoParaRecogerDto]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "marcarListoParaRecoger", null);
__decorate([
    (0, common_1.Post)(':id/llamar-mesero'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'chef'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "llamarMesero", null);
__decorate([
    (0, common_1.Patch)('detalles/:idDetalle/cantidad'),
    (0, common_1.UseGuards)(detalle_tenant_guard_1.DetalleTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Param)('idDetalle', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, patch_detalle_cantidad_dto_1.PatchDetalleCantidadDto, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "actualizarCantidadDetalle", null);
__decorate([
    (0, common_1.Patch)('detalles/:idDetalle/subitems'),
    (0, common_1.UseGuards)(detalle_tenant_guard_1.DetalleTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Param)('idDetalle', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, patch_detalle_subitems_dto_1.PatchDetalleSubitemsDto, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "asignarSubitemsDetalle", null);
__decorate([
    (0, common_1.Delete)('detalles/:idDetalle'),
    (0, common_1.UseGuards)(detalle_tenant_guard_1.DetalleTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Param)('idDetalle', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "eliminarDetalle", null);
__decorate([
    (0, common_1.Post)('detalles/:idDetalle/empaque-auto'),
    (0, common_1.UseGuards)(detalle_tenant_guard_1.DetalleTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Param)('idDetalle', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "agregarEmpaqueAutoDetalle", null);
__decorate([
    (0, common_1.Post)(':id/sincronizar-empaques'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "sincronizarEmpaquesParaLlevar", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)(':id/historial'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "historialPedido", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('vista')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "uno", null);
__decorate([
    (0, common_1.Post)(':id/detalles'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, add_detalle_dto_1.AddDetalleDto, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "agregarDetalle", null);
__decorate([
    (0, common_1.Post)(':id/pasar-cocina'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "pasarCocina", null);
__decorate([
    (0, common_1.Post)(':id/reimprimir-comanda'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'mesero', 'chef'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "reimprimirComanda", null);
__decorate([
    (0, common_1.Post)(':id/enviar-factura-correo'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, enviar_factura_correo_dto_1.EnviarFacturaCorreoDto, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "enviarFacturaCorreo", null);
__decorate([
    (0, common_1.Post)(':id/reimprimir-factura'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('id_factura')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "reimprimirFactura", null);
__decorate([
    (0, common_1.Post)(':id/reimprimir-pedido-total'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "reimprimirPedidoTotal", null);
__decorate([
    (0, common_1.Post)(':id/imprimir-precuenta'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, imprimir_precuenta_dto_1.ImprimirPrecuentaDto, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "imprimirPrecuenta", null);
__decorate([
    (0, common_1.Post)(':id/facturar'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, facturar_dto_1.FacturarDto, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "facturar", null);
__decorate([
    (0, common_1.Post)(':id/facturar-mixto'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, facturar_mixto_dto_1.FacturarMixtoDto, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "facturarMixto", null);
__decorate([
    (0, common_1.Post)(':id/plan/omitir-cuota'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, omitir_cuota_plan_dto_1.OmitirCuotaPlanDto, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "omitirCuotaPlan", null);
__decorate([
    (0, common_1.Post)(':id/plan/reconciliar-saldo-platos'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "reconciliarSaldoAPlatos", null);
__decorate([
    (0, common_1.Post)(':id/cancelar'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "cancelar", null);
__decorate([
    (0, common_1.Post)(':id/cerrar-anulando-pendiente'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, cerrar_anulando_pendiente_dto_1.CerrarAnulandoPendienteDto, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "cerrarAnulandoPendiente", null);
__decorate([
    (0, common_1.Post)(':id/reabrir-cobro'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, reabrir_cobro_dto_1.ReabrirCobroDto, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "reabrirCobro", null);
__decorate([
    (0, common_1.Post)(':id/revertir-tanda-cobro'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, revertir_tanda_cobro_dto_1.RevertirTandaCobroDto, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "revertirTandaCobro", null);
__decorate([
    (0, common_1.Post)(':id/agrupar-mesa'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, agrupar_mesa_dto_1.AgruparMesaDto, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "agruparMesa", null);
__decorate([
    (0, common_1.Post)(':id/desagrupar-mesa'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, agrupar_mesa_dto_1.DesagruparMesaDto, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "desagruparMesa", null);
__decorate([
    (0, common_1.Post)(':id/transferir'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'mesero'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, transferir_dto_1.TransferirPedidoDto, Object]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "transferir", null);
__decorate([
    (0, common_1.Patch)(':id/estado'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, patch_estado_dto_1.PatchEstadoDto]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "estado", null);
__decorate([
    (0, common_1.Patch)(':id/prioridad-cocina'),
    (0, common_1.UseGuards)(pedido_tenant_guard_1.PedidoTenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, patch_prioridad_cocina_dto_1.PatchPrioridadCocinaDto]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "prioridadCocina", null);
exports.PedidosController = PedidosController = __decorate([
    (0, write_throttle_decorator_1.WriteThrottle)(),
    (0, common_1.Controller)('pedidos'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [pedidos_service_1.PedidosService])
], PedidosController);
//# sourceMappingURL=pedidos.controller.js.map