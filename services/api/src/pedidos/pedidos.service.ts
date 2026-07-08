import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DateTime } from 'luxon';
import {
  ConfigDescuento,
  ConfigOperativa,
  EstadoPedido,
  MetodoPago,
  Prisma,
  PrioridadCocina,
  TipoEventoPedido,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PedidosGateway } from './pedidos.gateway';
import { PermisosService } from '../permisos/permisos.service';
import type { PermisoMeseroKey } from '@la-reserva/shared-domain/permisos-mesero';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { AddDetalleDto } from './dto/add-detalle.dto';
import { FacturarDto } from './dto/facturar.dto';
import { FacturarMixtoDto } from './dto/facturar-mixto.dto';
import { OmitirCuotaPlanDto } from './dto/omitir-cuota-plan.dto';
import { DetalleCobroDto } from './dto/detalle-cobro.dto';
import { ImprimirPrecuentaDto } from './dto/imprimir-precuenta.dto';
import { UpsertCajaDiariaDto } from './dto/caja-diaria.dto';
import { UpsertCajaDiariaCierreDto } from './dto/caja-diaria-cierre.dto';
import { CrearMovimientoCajaDto } from './dto/crear-movimiento-caja.dto';
import { TransferirPedidoDto } from './dto/transferir.dto';
import { CerrarAnulandoPendienteDto } from './dto/cerrar-anulando-pendiente.dto';
import { PatchDetalleCocinaDto } from './dto/patch-detalle-cocina.dto';
import { PatchDetalleCantidadDto } from './dto/patch-detalle-cantidad.dto';
import { lineasFacturaParaTicket, lineasFacturaParaTicketPedidoTotal, lineasFacturaParaTicketSeleccionReferencia, type DetalleCantidadReferencia, type LineaFacturaAgrupable } from './factura-lineas-group';
import { lineasComandaParaTicket } from './comanda-lineas-group';
import {
  esMesaParaLlevarNumero,
  resolverMesasVirtuales,
} from '@la-reserva/shared-domain/mesa-label';
import { esRolAdministrativo } from '@la-reserva/shared-domain/roles';
import { mesaDisponibleHoyBogota } from '../common/mesa-dia';
import { fechaBogotaDb } from '../common/fecha-bogota-db';
import {
  getCachedConfigOperativaRow,
  invalidateConfigOperativaCache as invalidateSharedConfigOperativaCache,
  setCachedConfigOperativaRow,
  type ConfigOperativaRow,
} from '../common/config-operativa-cache';
import { lockMesaEnTx, lockPedidoEnTx } from '../common/prisma-lock';
import { OPERATIVE_PEDIDOS_MAX } from '../common/operative-limits';
import { validarTransicionEstadoPedido } from './estado-pedido-transiciones';
import { weekdayBogota } from '../common/timezone';
import { categoriaDisponibleEnDia } from '../common/categoria-dia';
import {
  categoriaEsBebida,
  debeMarcarCocina,
} from '@la-reserva/shared-domain/cocina-producto';
import { agregarVentasResumenDiario } from '@la-reserva/shared-domain/resumen-diario-ventas';
import {
  acumularVentaPorMetodoPago,
  calcularEfectivoEsperadoEnCaja,
  totalesPorMetodoResumenVacios,
} from '@la-reserva/shared-domain/movimiento-caja';
import {
  pedidoDebeTenerLineaMazorca,
  validarTransferenciaPedido,
} from '@la-reserva/shared-domain/transferencia-pedido';
import { pedidoUsaLineaMazorca } from '@la-reserva/shared-domain/mazorca-pedido';
import {
  ordenarPedidosCocinaPorLlegada,
} from '@la-reserva/shared-domain/cocina-vista';
import {
  contarPorcionesPendientesCocina,
  ordenarPedidosCocina,
  prioridadAutomaticaDesdeDetalles,
  prioridadCocinaEfectiva,
  tipoProteinaResuelto,
} from './cocina-prioridad';
import {
  precioEmpaqueParaLlevarDecimal,
  productoCobraEmpaqueParaLlevarPorPlatoFuerte,
} from './empaque-para-llevar';
import {
  empaqueFaltanteEnDetallePadre,
  nuevaCantidadEmpaqueTrasCambioPadre,
} from '@la-reserva/shared-domain/empaque-para-llevar';
import type { DetalleEmpaqueResumen } from '@la-reserva/shared-domain/empaque-para-llevar';
import { ComandaPrinterService, type ResultadoImpresion } from './comanda-printer.service';
import { FacturaEmailService } from './factura-email.service';
import {
  ajustarStockBebidaTx,
  descontarStockBebidaTx,
  reintegrarStockBebidaTx,
} from '../productos/stock-bebida';
import {
  type ComandaLinea,
  type ComandaTicket,
  etiquetaMesaComanda,
} from './comanda-ticket';
import type { FacturaTicket } from './factura-ticket';
import {
  agruparFacturasMixto,
  cobrosResumenMixto,
  dividirSolicitudesCobroMixto,
  esGrupoPagoMixto,
  facturasDeTandaCobro,
  facturasIdsImpresionUnica,
  nuevoCobroMixtoGrupo,
  repartoMixtoConDevolucion,
  resumenCobrosPedidoTotal,
} from './factura-mixto';
import { calcularDetalleExcesoCobro, parseDetalleExcesoCobro } from '@la-reserva/shared-domain/factura-vuelto';
import type { CierreCajaTicket, MovimientoCajaTicket } from './cierre-caja-ticket';
import {
  calcularDescuentosPedido,
  resolverConfigPromociones,
  type ConfigDescuentoCalc,
  type LineaDescuento,
} from './descuentos-pedido';
import {
  ETIQUETA_LEGACY_MULERO,
  parseEtiquetasPedido,
  parseReglasPromocion,
} from '@la-reserva/shared-domain/promociones-pedido';
import { asignarCantidadesParaSubtotal } from '@la-reserva/shared-domain/asignar-cobro-por-monto';
import { importesProporcionalesMixto } from '@la-reserva/shared-domain/cobro-invariantes';
import { repartirMontoEnCop } from '@la-reserva/shared-domain/repartir-monto-cop';
import { planConsolidarFragmentosPrecioPendientes } from '@la-reserva/shared-domain/consolidar-fragmentos-precio';
import {
  SALDO_ABONO_NOTA,
  SALDO_RESTANTE_NOTA,
  NOMBRE_DISPLAY_SALDO_PENDIENTE,
  esNotaSaldoRestantePendiente,
  formatSaldoRestanteNota,
  parseSaldoRestantePool,
  notaDisplaySaldoPendiente,
  distribuirSaldoEnPlatos,
  saldoNecesitaReconciliarAPlatos,
  esNotaSaldoFragmentoHuerfano,
  SALDO_RESTANTE_FRAGMENTO_NOTA,
  type SaldoPoolRef,
} from '@la-reserva/shared-domain/saldo-restante';
import { UpsertConfigDescuentosDto } from './dto/upsert-config-descuentos.dto';
import { PatchEtiquetasPromocionDto } from './dto/patch-etiquetas-promocion.dto';
import { UpsertConfigOperativaDto } from './dto/upsert-config-operativa.dto';
import { VaciarResumenDiarioDto } from './dto/vaciar-resumen-diario.dto';
import { CancelarReabiertosDto } from './dto/cancelar-reabiertos.dto';
import { ReabrirCobroDto } from './dto/reabrir-cobro.dto';
import { RevertirTandaCobroDto } from './dto/revertir-tanda-cobro.dto';
import {
  expandirDetallesParaCobro,
  expandirSolicitudesConEmpaques,
  idsDetallesPendientes,
  lineasDescuentoDesdeSolicitudes,
  ordenarSolicitudesCobro,
  quedaPendienteTrasCobro,
  resolverSolicitudesCobro,
  subtotalDesdeSolicitudes,
  type DetalleCobroCantidad,
  type DetalleSerialCobro,
} from './cobro-parcial';
import {
  pedidoVistaOperativaInclude,
  pedidoTieneRecogidaPendiente,
  platosPendientesRecogerPedido,
  serializarPedidoVistaOperativa,
} from './pedidos-vista-operativa';
import { PatchMazorcasPedidoDto } from './dto/patch-mazorcas-pedido.dto';
import {
  crearLineaMazorcaInicial,
  esDetalleMazorcaAcompanamiento,
  invalidateMazorcaProductIdCache,
  sincronizarLineaMazorcaAcompanamiento,
} from './mazorca-linea-pedido';
import {
  formatCuotaPendienteNota,
  idProductoCuotaPendienteReparto,
} from './cuota-pendiente-linea-pedido';
import {
  nombreProductoCuotaPendienteDisplay,
  parseCuotaPendienteNota,
  listarCuotasPlanOmitidas,
  type CuotaPlanOmitidaRegistro,
} from '@la-reserva/shared-domain/cuota-pendiente-reparto';

const ABIERTOS: EstadoPedido[] = ['abierto', 'en_cocina'];

const detalleInclude = {
  producto: { include: { categoria: true } },
  personalizaciones: { include: { opcion: true } },
} as const;

const facturasInclude = {
  orderBy: { emitidaEn: 'asc' as const },
};

function detalleAplicaLlamadaMesero(d: {
  enviadoCocina: boolean;
  listoCocina: boolean;
  listoParaRecoger: boolean;
  producto: {
    categoria: { nombre: string };
    esEmpacable: boolean;
  };
}): boolean {
  if (!d.enviadoCocina || d.listoCocina) return false;
  if (categoriaEsBebida(d.producto.categoria)) return false;
  if (d.producto.esEmpacable) return false;
  return debeMarcarCocina(
    d.producto.categoria,
    d.producto.esEmpacable,
  );
}

function conteoLlamaMesero(
  detalles: Array<{
    cantidad: number;
    enviadoCocina: boolean;
    listoCocina: boolean;
    listoParaRecoger: boolean;
    producto: {
      categoria: { nombre: string };
      esEmpacable: boolean;
      esAcompanamientoMazorca: boolean;
    };
  }>,
): { platos: number; entradas: number } {
  let platos = 0;
  let entradas = 0;
  for (const d of detalles) {
    if (!detalleAplicaLlamadaMesero(d)) continue;
    if (d.producto.esAcompanamientoMazorca) entradas += d.cantidad;
    else platos += d.cantidad;
  }
  return { platos, entradas };
}

function tipoListoCocinaLlama(platos: number, entradas: number): 'entrada' | 'plato' | 'mixto' {
  if (platos > 0 && entradas > 0) return 'mixto';
  if (entradas > 0) return 'entrada';
  return 'plato';
}

@Injectable()
export class PedidosService {
  private readonly logger = new Logger(PedidosService.name);

  private configDescuentosCache: {
    row: ConfigDescuento;
    expiresAt: number;
  } | null = null;

  private static readonly CONFIG_CACHE_TTL_MS = 60_000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: PedidosGateway,
    private readonly comandaPrinter: ComandaPrinterService,
    private readonly facturaEmail: FacturaEmailService,
    private readonly permisos: PermisosService,
  ) {}

  private async exigirPermisoMesero(
    actor: { idUsuario: number; rol: { nombre: string } } | undefined,
    permiso: PermisoMeseroKey,
    opts?: { permitirChef?: boolean },
  ) {
    if (!actor) return;
    await this.permisos.assertPermiso(actor, permiso, opts);
  }

  private emit(pedidoId: number, mesaId: number, idUsuario: number) {
    this.gateway.emitPedidoActualizado(pedidoId, mesaId, idUsuario);
  }

  private async notificarCompaneroModificoPedido(
    pedido: { idPedido: number; idMesa: number; idUsuario: number },
    idUsuarioActor: number,
    lineas: { nombre_producto: string; cantidad: number }[],
    accion: 'agregado' | 'quitado' | 'reducido' = 'agregado',
  ) {
    if (idUsuarioActor === pedido.idUsuario || lineas.length === 0) {
      return;
    }
    const [actor, mesa] = await Promise.all([
      this.prisma.usuario.findUnique({ where: { idUsuario: idUsuarioActor } }),
      this.prisma.mesa.findUnique({ where: { idMesa: pedido.idMesa } }),
    ]);
    if (!actor || !mesa) return;
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
    });
  }

  private emitirAlertaImpresora(
    impresion: ResultadoImpresion,
    contexto: 'comanda' | 'factura' | 'prueba' | 'cierre',
    pedidoId?: number,
  ) {
    if (
      impresion.codigo_error !== 'sin_papel' &&
      impresion.codigo_error !== 'papel_bajo'
    ) {
      return;
    }
    this.gateway.emitImpresoraAlerta({
      codigo: impresion.codigo_error,
      mensaje:
        impresion.error ??
        (impresion.codigo_error === 'sin_papel'
          ? 'Sin papel en la impresora POS'
          : 'Papel bajo en la impresora POS'),
      destino: impresion.destino,
      contexto,
      pedidoId,
      at: new Date().toISOString(),
    });
  }

  /** Imprime en cola sin bloquear la respuesta HTTP. */
  private encolarImpresion(
    job: () => Promise<ResultadoImpresion>,
    contexto: 'comanda' | 'factura' | 'prueba',
    pedidoId?: number,
  ): ResultadoImpresion {
    void job()
      .then((impresion) => {
        this.emitirAlertaImpresora(impresion, contexto, pedidoId);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Error en cola de impresión (${contexto}${pedidoId != null ? ` pedido ${pedidoId}` : ''}): ${msg}`,
        );
      });
    return { impreso: false, en_cola: true };
  }

  private encolarImpresionComanda(comanda: ComandaTicket, idPedido: number) {
    return this.encolarImpresion(
      () => this.comandaPrinter.imprimirComanda(comanda),
      'comanda',
      idPedido,
    );
  }

  private encolarImpresionFactura(
    ticket: FacturaTicket,
    idPedido: number,
    conCopia = false,
  ) {
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
          error:
            cliente.error ??
            'Copia cliente no impresa (la copia negocio sí salió)',
        };
      }
      return cliente;
    }, 'factura', idPedido);
  }

  /** En producción encola; en demo devuelve vista previa HTML de inmediato. */
  private async imprimirFacturaEnRespuesta(
    ticket: FacturaTicket,
    idPedido: number,
    conCopia = false,
  ): Promise<ResultadoImpresion> {
    if (this.comandaPrinter.isEnabled()) {
      return this.encolarImpresionFactura(ticket, idPedido, conCopia);
    }
    const negocio = await this.comandaPrinter.imprimirFactura({
      ...ticket,
      copia_destinatario: conCopia ? 'negocio' : undefined,
    });
    if (!conCopia) {
      this.emitirAlertaImpresora(negocio, 'factura', idPedido);
      return negocio;
    }
    const cliente = await this.comandaPrinter.imprimirFactura({
      ...ticket,
      copia_destinatario: 'cliente',
    });
    const imp = cliente.preview_html
      ? {
          ...cliente,
          error: 'Vista previa demo (copia cliente; negocio también disponible)',
        }
      : negocio;
    this.emitirAlertaImpresora(imp, 'factura', idPedido);
    return imp;
  }

  estadoImpresora() {
    return this.comandaPrinter.consultarEstadoPapel();
  }

  /** Mesas virtuales (para llevar / mostrador): varios pedidos abiertos a la vez. */
  private async esMesaVirtualNumero(numero: number): Promise<boolean> {
    const row = await this.obtenerConfigOperativaRow();
    const mv = resolverMesasVirtuales(row);
    return (
      numero === mv.numero_mesa_para_llevar ||
      numero === mv.numero_mesa_mostrador
    );
  }

  private async sincronizarNumeroMesaVirtual(
    numeroAnterior: number,
    numeroNuevo: number,
  ): Promise<void> {
    if (numeroAnterior === numeroNuevo) return;
    const conflicto = await this.prisma.mesa.findFirst({
      where: { numero: numeroNuevo },
    });
    if (conflicto && conflicto.numero !== numeroAnterior) {
      throw new BadRequestException(
        `Ya existe una mesa con el número ${numeroNuevo}`,
      );
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

  private fechaCalendarioBogota(dt: DateTime): Date {
    return new Date(Date.UTC(dt.year, dt.month - 1, dt.day));
  }

  private parseFechaResumenBogota(fecha?: string): {
    base: DateTime;
    fechaOnly: Date;
  } {
    let base = DateTime.now().setZone('America/Bogota');
    if (fecha) {
      const parsed = DateTime.fromISO(fecha, { zone: 'America/Bogota' });
      if (!parsed.isValid) {
        throw new BadRequestException('fecha inválida, usa formato YYYY-MM-DD');
      }
      base = parsed;
    }
    return { base, fechaOnly: this.fechaCalendarioBogota(base) };
  }

  private mapMovimientoCajaRow(r: {
    idMovimientoCaja: number;
    tipo: string;
    monto: Prisma.Decimal;
    motivo: string | null;
    metodoDevolucion: string | null;
    idPedido: number | null;
    idFactura: number | null;
    creadoEn: Date;
    usuario: { nombre: string; apellido: string };
    pedido?: { mesa: { numero: number } } | null;
  }) {
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

  private validarExcesoTransferenciaFactura(
    totalNeto: number,
    montoTransferencia: number | undefined,
    destino: string | undefined,
  ): number {
    if (montoTransferencia == null) return 0;
    const total = Math.round(totalNeto);
    const tr = Math.round(montoTransferencia);
    if (tr < total) {
      throw new BadRequestException(
        `La transferencia debe cubrir al menos el total (${total} COP)`,
      );
    }
    const exceso = tr - total;
    if (exceso > 0) {
      if (
        destino !== 'efectivo' &&
        destino !== 'transferencia' &&
        destino !== 'domicilio' &&
        destino !== 'mesero'
      ) {
        throw new BadRequestException(
          'Indica si el exceso es devolución al cliente, pago domiciliario o propina al mesero',
        );
      }
    }
    return exceso;
  }

  private async crearMovimientoExcesoTransferenciaEnTx(
    tx: Prisma.TransactionClient,
    opts: {
      idPedido: number;
      idFactura: number | null;
      idUsuario: number;
      montoExceso: number;
      destino: 'efectivo' | 'transferencia' | 'domicilio' | 'mesero';
    },
  ) {
    const fechaMov = this.fechaCalendarioBogota(
      DateTime.now().setZone('America/Bogota'),
    );
    const esDomicilio = opts.destino === 'domicilio';
    const esMesero = opts.destino === 'mesero';
    const metodoDevolucion: 'efectivo' | 'transferencia' | null =
      opts.destino === 'efectivo'
        ? 'efectivo'
        : opts.destino === 'transferencia'
          ? 'transferencia'
          : null;
    let motivo: string | null = null;
    if (esDomicilio) {
      motivo = `Domicilio · pedido #${opts.idPedido}`;
    } else if (esMesero) {
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

  /** Créditos ligados bloquean borrar facturas/pedidos (FK); quitar antes en pruebas/reaperturas. */
  private async eliminarCuentasCreditoEnTx(
    tx: Prisma.TransactionClient,
    filtro: { idPedido?: number; idFacturas?: number[] },
  ) {
    const or: Prisma.CuentaCreditoWhereInput[] = [];
    if (filtro.idPedido != null) or.push({ idPedido: filtro.idPedido });
    if (filtro.idFacturas?.length) {
      or.push({ idFactura: { in: filtro.idFacturas } });
    }
    if (or.length === 0) return;
    await tx.cuentaCredito.deleteMany({ where: { OR: or } });
  }

  /**
   * Monto base de efectivo al abrir caja (día en Bogotá).
   */
  async getCajaDiaria(fecha?: string) {
    let base = DateTime.now().setZone('America/Bogota');
    if (fecha) {
      const parsed = DateTime.fromISO(fecha, { zone: 'America/Bogota' });
      if (!parsed.isValid) {
        throw new BadRequestException('fecha inválida, usa formato YYYY-MM-DD');
      }
      base = parsed;
    }
    const fechaOnly = this.fechaCalendarioBogota(base);
    const row = await this.prisma.cajaDiaria.findUnique({
      where: { fecha: fechaOnly },
    });
    return {
      fecha: base.toFormat('yyyy-LL-dd'),
      monto_base_efectivo: row ? Number(row.montoBaseEfectivo) : 0,
      monto_base_cierre_efectivo:
        row?.montoBaseCierreEfectivo != null
          ? Number(row.montoBaseCierreEfectivo)
          : null,
    };
  }

  async upsertCajaDiaria(dto: UpsertCajaDiariaDto) {
    const base = DateTime.fromISO(dto.fecha, { zone: 'America/Bogota' });
    if (!base.isValid) {
      throw new BadRequestException('fecha inválida, usa formato YYYY-MM-DD');
    }
    const fechaOnly = this.fechaCalendarioBogota(base);
    const row = await this.prisma.cajaDiaria.upsert({
      where: { fecha: fechaOnly },
      create: {
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

  async upsertCajaDiariaCierre(dto: UpsertCajaDiariaCierreDto) {
    const base = DateTime.fromISO(dto.fecha, { zone: 'America/Bogota' });
    if (!base.isValid) {
      throw new BadRequestException('fecha inválida, usa formato YYYY-MM-DD');
    }
    const fechaOnly = this.fechaCalendarioBogota(base);
    const resumen = await this.resumenDiario(dto.fecha);
    const row = await this.prisma.cajaDiaria.upsert({
      where: { fecha: fechaOnly },
      create: {
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

  async registrarMovimientoCajaManual(
    actor: { idUsuario: number; rol: { nombre: string } },
    dto: CrearMovimientoCajaDto,
  ) {
    if (!esRolAdministrativo(actor.rol.nombre)) {
      throw new ForbiddenException('Solo admin');
    }
    const { base, fechaOnly } = this.parseFechaResumenBogota(dto.fecha);
    const motivo = dto.motivo?.trim() || null;
    if (!motivo) {
      throw new BadRequestException('Indica el motivo del movimiento');
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
    const impresion = await this.comandaPrinter.imprimirMovimientoCaja(
      this.ticketMovimientoCajaDesdeRow(row, fechaStr),
    );
    this.emitirAlertaImpresora(impresion, 'cierre');
    return {
      fecha: fechaStr,
      movimiento: this.mapMovimientoCajaRow({ ...row, pedido: null }),
      impresion_movimiento: impresion,
    };
  }

  async imprimirMovimientoCajaManual(
    actor: { idUsuario: number; rol: { nombre: string } },
    idMovimiento: number,
  ) {
    if (!esRolAdministrativo(actor.rol.nombre)) {
      throw new ForbiddenException('Solo admin');
    }
    const row = await this.prisma.movimientoCaja.findUnique({
      where: { idMovimientoCaja: idMovimiento },
      include: {
        usuario: { select: { nombre: true, apellido: true } },
      },
    });
    if (!row) {
      throw new NotFoundException('Movimiento no encontrado');
    }
    if (row.tipo !== 'entrada_manual' && row.tipo !== 'salida_manual') {
      throw new BadRequestException(
        'Solo se pueden imprimir entradas o salidas manuales',
      );
    }
    const fechaStr = DateTime.fromJSDate(row.fecha, {
      zone: 'America/Bogota',
    }).toFormat('yyyy-LL-dd');
    const impresion = await this.comandaPrinter.imprimirMovimientoCaja(
      this.ticketMovimientoCajaDesdeRow(row, fechaStr),
    );
    this.emitirAlertaImpresora(impresion, 'cierre');
    return { ok: true, impresion_movimiento: impresion };
  }

  private ticketMovimientoCajaDesdeRow(
    row: {
      idMovimientoCaja: number;
      tipo: string;
      monto: Prisma.Decimal;
      motivo: string | null;
      creadoEn: Date;
      usuario: { nombre: string; apellido: string };
    },
    fecha: string,
  ): MovimientoCajaTicket {
    return {
      id_movimiento: row.idMovimientoCaja,
      tipo: row.tipo as 'entrada_manual' | 'salida_manual',
      fecha,
      monto: Math.round(Number(row.monto)),
      motivo: row.motivo?.trim() || '-',
      registrado_por: `${row.usuario.nombre} ${row.usuario.apellido}`.trim(),
      creado_en: row.creadoEn.toISOString(),
      emitida_en: new Date().toISOString(),
    };
  }

  async eliminarMovimientoCaja(
    actor: { idUsuario: number; rol: { nombre: string } },
    idMovimiento: number,
  ) {
    if (!esRolAdministrativo(actor.rol.nombre)) {
      throw new ForbiddenException('Solo admin');
    }
    const row = await this.prisma.movimientoCaja.findUnique({
      where: { idMovimientoCaja: idMovimiento },
    });
    if (!row) {
      throw new NotFoundException('Movimiento no encontrado');
    }
    if (
      row.tipo !== 'entrada_manual' &&
      row.tipo !== 'salida_manual'
    ) {
      throw new ConflictException(
        'Solo se pueden eliminar entradas o salidas manuales',
      );
    }
    await this.prisma.movimientoCaja.delete({
      where: { idMovimientoCaja: idMovimiento },
    });
    return { ok: true, id_movimiento: idMovimiento };
  }

  private mapConfigDescuentos(row: {
    sopasActivo: boolean;
    sopasMontoPorUnidad: Prisma.Decimal;
    sopasMinUnidades: number;
    mulerosActivo: boolean;
    mulerosMontoPorUnidad: Prisma.Decimal;
    mulerosMinPlatosPrincipales: number;
    umbralSubtotalOtros: Prisma.Decimal;
    reglasPromocion?: Prisma.JsonValue;
    etiquetasPedido?: Prisma.JsonValue;
  }) {
    const resolved = resolverConfigPromociones({
      sopas_activo: row.sopasActivo,
      sopas_monto_por_unidad: Math.round(Number(row.sopasMontoPorUnidad)),
      sopas_min_unidades: Math.max(1, Math.round(row.sopasMinUnidades)),
      muleros_activo: row.mulerosActivo,
      muleros_monto_por_plato_principal: Math.round(
        Number(row.mulerosMontoPorUnidad),
      ),
      muleros_min_platos_principales: Math.max(
        1,
        Math.round(row.mulerosMinPlatosPrincipales),
      ),
      umbral_subtotal_otros: Math.round(Number(row.umbralSubtotalOtros)),
      reglas_promocion: parseReglasPromocion(row.reglasPromocion ?? []),
      etiquetas_pedido: parseEtiquetasPedido(row.etiquetasPedido ?? []),
    });
    return {
      reglas_promocion: resolved.reglas_promocion,
      etiquetas_pedido: resolved.etiquetas_pedido,
    };
  }

  private async obtenerConfigDescuentosRow() {
    const now = Date.now();
    const cached = this.configDescuentosCache;
    if (cached && cached.expiresAt > now) {
      return cached.row;
    }
    let row = await this.prisma.configDescuento.findUnique({ where: { id: 1 } });
    if (!row) {
      row = await this.prisma.configDescuento.create({ data: { id: 1 } });
    }
    this.configDescuentosCache = {
      row,
      expiresAt: now + PedidosService.CONFIG_CACHE_TTL_MS,
    };
    return row;
  }

  private invalidateConfigDescuentosCache(): void {
    this.configDescuentosCache = null;
  }

  private async ensureConfigDescuentos() {
    return this.obtenerConfigDescuentosRow();
  }

  async getConfigDescuentos() {
    const row = await this.obtenerConfigDescuentosRow();
    return this.mapConfigDescuentos(row);
  }

  async upsertConfigDescuentos(dto: UpsertConfigDescuentosDto) {
    const row = await this.prisma.configDescuento.update({
      where: { id: 1 },
      data: {
        ...(dto.reglas_promocion != null
          ? {
              reglasPromocion: parseReglasPromocion(dto.reglas_promocion),
              sopasActivo: false,
              mulerosActivo: false,
            }
          : {}),
        ...(dto.etiquetas_pedido != null
          ? { etiquetasPedido: parseEtiquetasPedido(dto.etiquetas_pedido) }
          : {}),
      },
    });
    this.invalidateConfigDescuentosCache();
    return this.mapConfigDescuentos(row);
  }

  private mapConfigOperativa(row: {
    precioEmpaqueParaLlevar: Prisma.Decimal;
    mazorcaActiva: boolean;
    idProductoMazorca: number | null;
    numeroMesaParaLlevar: number;
    numeroMesaMostrador: number;
    etiquetaParaLlevar: string;
    etiquetaMostrador: string;
    mostradorActivo: boolean;
    paraLlevarActivo: boolean;
    beneficioSodaAlmuerzoActivo: boolean;
    idProductoSodaAlmuerzo: number | null;
    sodaAlmuerzoDescontarStock: boolean;
    productoMazorca?: { idProducto: number; nombre: string } | null;
    productoSodaAlmuerzo?: { idProducto: number; nombre: string } | null;
  }) {
    return {
      precio_empaque_para_llevar: Math.round(
        Number(row.precioEmpaqueParaLlevar),
      ),
      mazorca_activa: row.mazorcaActiva,
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

  private async obtenerConfigOperativaRow(): Promise<ConfigOperativaRow> {
    const cached = getCachedConfigOperativaRow();
    if (cached) {
      return cached;
    }
    const include = {
      productoMazorca: { select: { idProducto: true, nombre: true } },
      productoSodaAlmuerzo: { select: { idProducto: true, nombre: true } },
      productoCuotaPendiente: { select: { idProducto: true, nombre: true } },
    } as const;
    let row = await this.prisma.configOperativa.findUnique({
      where: { id: 1 },
      include,
    });
    if (!row) {
      row = await this.prisma.configOperativa.create({
        data: { id: 1 },
        include,
      });
    }
    setCachedConfigOperativaRow(row);
    return row;
  }

  private invalidateConfigOperativaCache(): void {
    invalidateSharedConfigOperativaCache();
  }

  private async ctxOperativa() {
    const row = await this.obtenerConfigOperativaRow();
    return {
      mazorcaActiva: row.mazorcaActiva,
      idProductoMazorca: row.idProductoMazorca,
      precioEmpaque: Math.round(Number(row.precioEmpaqueParaLlevar)),
    };
  }

  async getConfigOperativa() {
    const row = await this.obtenerConfigOperativaRow();
    return this.mapConfigOperativa(row);
  }

  async upsertConfigOperativa(dto: UpsertConfigOperativaDto) {
    if (dto.id_producto_mazorca != null) {
      const prod = await this.prisma.producto.findUnique({
        where: { idProducto: dto.id_producto_mazorca },
      });
      if (!prod) {
        throw new BadRequestException('Producto de acompañamiento por comensal no encontrado');
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
        throw new BadRequestException('Producto de soda almuerzo no encontrado');
      }
    }

    const actual = await this.obtenerConfigOperativaRow();
    const nuevoParaLlevar =
      dto.numero_mesa_para_llevar ?? actual.numeroMesaParaLlevar;
    const nuevoMostrador =
      dto.numero_mesa_mostrador ?? actual.numeroMesaMostrador;
    if (nuevoParaLlevar === nuevoMostrador) {
      throw new BadRequestException(
        'Para llevar y mostrador deben usar números de mesa distintos',
      );
    }

    if (
      dto.numero_mesa_para_llevar != null &&
      dto.numero_mesa_para_llevar !== actual.numeroMesaParaLlevar
    ) {
      await this.sincronizarNumeroMesaVirtual(
        actual.numeroMesaParaLlevar,
        dto.numero_mesa_para_llevar,
      );
    }
    if (
      dto.numero_mesa_mostrador != null &&
      dto.numero_mesa_mostrador !== actual.numeroMesaMostrador
    ) {
      await this.sincronizarNumeroMesaVirtual(
        actual.numeroMesaMostrador,
        dto.numero_mesa_mostrador,
      );
    }

    const row = await this.prisma.configOperativa.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        ...(dto.precio_empaque_para_llevar != null
          ? {
              precioEmpaqueParaLlevar: Math.round(
                dto.precio_empaque_para_llevar,
              ),
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
      },
      update: {
        ...(dto.precio_empaque_para_llevar != null
          ? {
              precioEmpaqueParaLlevar: Math.round(
                dto.precio_empaque_para_llevar,
              ),
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
      },
      include: {
        productoMazorca: { select: { idProducto: true, nombre: true } },
        productoSodaAlmuerzo: { select: { idProducto: true, nombre: true } },
        productoCuotaPendiente: { select: { idProducto: true, nombre: true } },
      },
    });

    invalidateMazorcaProductIdCache();
    this.invalidateConfigOperativaCache();
    this.gateway.emitConfigActualizada('menu');
    if (
      dto.numero_mesa_para_llevar != null ||
      dto.numero_mesa_mostrador != null ||
      dto.etiqueta_para_llevar != null ||
      dto.etiqueta_mostrador != null ||
      dto.mostrador_activo != null ||
      dto.para_llevar_activo != null
    ) {
      this.gateway.emitConfigActualizada('mesas');
    }
    return this.mapConfigOperativa(row);
  }

  private lineasParaDescuento(
    detalles: {
      cantidad: number;
      precioUnitario: Prisma.Decimal;
      producto: {
        nombre: string;
        categoria: {
          idCategoria: number;
          nombre: string;
          participaDescuentoSopas: boolean;
        };
        esPlatoPrincipal: boolean;
      };
    }[],
  ): LineaDescuento[] {
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

  private etiquetasPromocionPedido(p: {
    etiquetasPromocion?: Prisma.JsonValue;
    clienteMulero: boolean;
  }): string[] {
    const raw = Array.isArray(p.etiquetasPromocion) ? p.etiquetasPromocion : [];
    return raw.filter((x): x is string => typeof x === 'string');
  }

  private descuentosDesdeConfig(
    lineas: LineaDescuento[],
    config: ConfigDescuentoCalc,
    pedido: { etiquetasPromocion?: Prisma.JsonValue; clienteMulero: boolean },
  ) {
    return calcularDescuentosPedido(lineas, config, {
      etiquetas_promocion: this.etiquetasPromocionPedido(pedido),
      cliente_mulero: pedido.clienteMulero,
    });
  }

  private mapFacturaSerial(f: {
    idFactura: number;
    subtotal: Prisma.Decimal;
    descuentoSopas: Prisma.Decimal;
    descuentoMuleros: Prisma.Decimal;
    descuentoPromociones: Prisma.Decimal;
    total: Prisma.Decimal;
    metodoPago: MetodoPago;
    emitidaEn: Date;
    esParcial: boolean;
    personaPlanIndice?: number | null;
    planPersonasSobreTotal?: boolean;
    planCombinadoSobreSeleccion?: boolean;
    planSeleccionReferencia?: Prisma.JsonValue | null;
    cobroMixtoGrupo?: number | null;
    detalleExcesoCobro?: Prisma.JsonValue | null;
  }) {
    return {
      id_factura: f.idFactura,
      subtotal: Number(f.subtotal),
      descuento_sopas: Number(f.descuentoSopas),
      descuento_muleros: Number(f.descuentoMuleros),
      descuento_promociones: Number(f.descuentoPromociones),
      total: Number(f.total),
      metodo_pago:
        f.metodoPago === 'tarjeta' ? 'transferencia' : f.metodoPago,
      emitida_en: f.emitidaEn,
      es_parcial: f.esParcial,
      persona_plan_indice: f.personaPlanIndice ?? null,
      plan_personas_sobre_total: f.planPersonasSobreTotal ?? false,
      plan_combinado_sobre_seleccion: f.planCombinadoSobreSeleccion ?? false,
      plan_seleccion_referencia: f.planSeleccionReferencia ?? null,
      cobro_mixto_grupo: f.cobroMixtoGrupo ?? null,
      detalle_exceso_cobro: parseDetalleExcesoCobro(f.detalleExcesoCobro) ?? null,
    };
  }

  private seleccionReferenciaJsonFromDto(
    dto: FacturarDto | FacturarMixtoDto,
  ): Prisma.InputJsonValue | undefined {
    const ref = dto.detalles_seleccion_referencia;
    if (!ref?.length) return undefined;
    return ref.map((s) => ({
      id_detalle: s.id_detalle,
      cantidad: s.cantidad,
    }));
  }

  private parseSeleccionReferenciaFactura(
    raw: Prisma.JsonValue | null | undefined,
  ): DetalleCantidadReferencia[] {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((x) => {
        if (!x || typeof x !== 'object') return null;
        const row = x as { id_detalle?: unknown; cantidad?: unknown };
        const id = Number(row.id_detalle);
        const cantidad = Number(row.cantidad);
        if (!Number.isFinite(id) || !Number.isFinite(cantidad) || cantidad <= 0) {
          return null;
        }
        return { id_detalle: id, cantidad };
      })
      .filter((x): x is DetalleCantidadReferencia => x != null);
  }

  private planFacturaDataFromDto(dto: FacturarDto | FacturarMixtoDto) {
    return {
      planPersonasSobreTotal: dto.plan_personas_sobre_total === true,
      planCombinadoSobreSeleccion: dto.plan_combinado_sobre_seleccion === true,
      planSeleccionReferencia: this.seleccionReferenciaJsonFromDto(dto),
    };
  }

  private solicitudesPendientesEnPool(
    pedido: {
      detalles: Prisma.DetallePedidoGetPayload<{ include: typeof detalleInclude }>[];
    },
    pool: DetalleCobroCantidad[],
  ): DetalleCobroCantidad[] {
    const serial = this.serialDetallesCobro(pedido.detalles);
    const poolOrigIds = new Set(pool.map((s) => s.id_detalle));
    const raw: DetalleCobroCantidad[] = [];

    for (const det of pedido.detalles) {
      if (det.idFactura != null || det.cantidad <= 0) continue;
      let enPool = poolOrigIds.has(det.idDetalle);
      if (!enPool) {
        const comb = this.parseCombinadoNota(det.notaCocina);
        enPool = comb != null && poolOrigIds.has(comb.origId);
      }
      if (!enPool) continue;
      raw.push({ id_detalle: det.idDetalle, cantidad: det.cantidad });
    }

    if (raw.length === 0) return [];
    return ordenarSolicitudesCobro(
      serial,
      expandirSolicitudesConEmpaques(serial, raw),
    );
  }

  private async aplicarCuotaPlanEnFacturacion<
    TPedido extends {
      idPedido: number;
      clienteMulero: boolean;
      detalles: Prisma.DetallePedidoGetPayload<{ include: typeof detalleInclude }>[];
    },
  >(
    idPedido: number,
    dto: FacturarDto | FacturarMixtoDto,
    pedidoParaCobro: TPedido,
    solicitudes: DetalleCobroCantidad[],
    config: ConfigDescuentoCalc,
  ): Promise<{
    solicitudes: DetalleCobroCantidad[];
    pedido: TPedido;
  }> {
    const enPlanCuota =
      dto.persona_plan_indice != null &&
      dto.total_personas_plan != null &&
      dto.total_personas_plan >= 2 &&
      (dto.plan_personas_sobre_total === true ||
        dto.plan_combinado_sobre_seleccion === true);

    if (!enPlanCuota) {
      return { solicitudes, pedido: pedidoParaCobro };
    }

    const poolSeleccion =
      dto.plan_combinado_sobre_seleccion === true
        ? (dto.detalles_seleccion_referencia ?? solicitudes).map((s) => ({
            id_detalle: s.id_detalle,
            cantidad: s.cantidad,
          }))
        : undefined;

    let sol: DetalleCobroCantidad[] = [];
    await this.prisma.$transaction(async (tx) => {
      sol = await this.resolverCobroSobreSaldoRestanteEnTx(
        tx,
        idPedido,
        pedidoParaCobro,
        dto.persona_plan_indice!,
        dto.total_personas_plan!,
        dto.monto_persona_plan,
        config,
        poolSeleccion,
      );
    });

    const reloaded = await this.prisma.pedido.findUnique({
      where: { idPedido },
      include: {
        detalles: { include: detalleInclude, orderBy: { idDetalle: 'asc' } },
        facturas: facturasInclude,
      },
    });
    if (reloaded) {
      return { solicitudes: sol, pedido: reloaded as unknown as TPedido };
    }
    return { solicitudes: sol, pedido: pedidoParaCobro };
  }

  private findSaldoRestantePendiente(
    detalles: {
      idDetalle: number;
      idFactura: number | null;
      notaCocina: string | null;
      precioUnitario: Prisma.Decimal | number;
      cantidad: number;
      producto: { esCuotaPendienteReparto: boolean };
    }[],
  ) {
    return detalles.find(
      (d) =>
        d.idFactura == null &&
        esNotaSaldoRestantePendiente(d.notaCocina) &&
        d.producto.esCuotaPendienteReparto,
    );
  }

  private async countSaldoRestantePendienteEnTx(
    tx: Prisma.TransactionClient,
    idPedido: number,
  ): Promise<number> {
    const rows = await tx.detallePedido.findMany({
      where: { idPedido, idFactura: null },
      select: { notaCocina: true },
    });
    return rows.filter((d) => esNotaSaldoRestantePendiente(d.notaCocina)).length;
  }

  /**
   * ¿Queda dinero por cobrar? Ignora mazorca ($0) y abonos internos.
   * Si no queda, adjunta líneas gratuitas (mazorca, $0) a la última factura.
   */
  private async liquidarYEvaluarPendienteEnTx(
    tx: Prisma.TransactionClient,
    idPedido: number,
    idFacturaCierre: number,
  ): Promise<boolean> {
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
    const idsGratuitos: number[] = [];

    for (const d of pendientes) {
      if (esNotaSaldoRestantePendiente(d.notaCocina)) {
        hayCobroPendiente = true;
        continue;
      }
      if ((d.notaCocina ?? '').trim().startsWith(SALDO_ABONO_NOTA)) {
        // Abono huérfano: no bloquea cierre.
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

  /**
   * Abre o reutiliza la línea «Saldo pendiente» sin partir platos.
   * `poolSeleccion` null/vacío = sobre el total; con ítems = combinado.
   */
  private mismoPoolSaldo(
    nota: string | null | undefined,
    pool: SaldoPoolRef[] | null | undefined,
  ): boolean {
    const actual = parseSaldoRestantePool(nota);
    if (pool == null || pool.length === 0) {
      return actual == null && !esNotaSaldoFragmentoHuerfano(nota);
    }
    if (actual == null || actual.length !== pool.length) return false;
    const key = (p: SaldoPoolRef) => `${p.id_detalle}:${p.cantidad}`;
    const a = new Set(actual.map(key));
    return pool.every((p) => a.has(key(p)));
  }

  private async asegurarSaldoRestanteEnTx(
    tx: Prisma.TransactionClient,
    idPedido: number,
    pedido: {
      detalles: Prisma.DetallePedidoGetPayload<{ include: typeof detalleInclude }>[];
      clienteMulero: boolean;
    },
    montoBase: number,
    poolSeleccion?: SaldoPoolRef[] | null,
    opts?: { reemplazar?: boolean },
  ): Promise<{ idDetalle: number; monto: number; nota: string }> {
    const monto = Math.round(montoBase);
    if (monto <= 0) {
      throw new BadRequestException('No hay saldo pendiente para este reparto');
    }

    const nota = formatSaldoRestanteNota(poolSeleccion);
    const saldoExistente = this.findSaldoRestantePendiente(pedido.detalles);
    const opRow = await this.obtenerConfigOperativaRow();
    const idProductoSaldo = await idProductoCuotaPendienteReparto(
      tx,
      opRow.idProductoCuotaPendiente,
    );

    if (saldoExistente) {
      const actual =
        Math.round(Number(saldoExistente.precioUnitario)) *
        saldoExistente.cantidad;
      const notaActual = saldoExistente.notaCocina ?? SALDO_RESTANTE_NOTA;

      // Nuevo reparto combinado: sustituye saldo de otro plan (no mezclar montos).
      if (opts?.reemplazar) {
        await tx.detallePedido.update({
          where: { idDetalle: saldoExistente.idDetalle },
          data: { precioUnitario: monto, cantidad: 1, notaCocina: nota },
        });
        return { idDetalle: saldoExistente.idDetalle, monto, nota };
      }

      const necesitaNota =
        parseSaldoRestantePool(notaActual) == null &&
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

  /**
   * Plan personas/combinado: cobra sobre un ítem interno «Saldo pendiente»
   * sin partir platos reales. Cada abono crea una línea de abono; el saldo
   * pendiente se reduce. Cada persona paga solo su cuota (nunca absorbe omisiones).
   */
  private async resolverCobroSobreSaldoRestanteEnTx(
    tx: Prisma.TransactionClient,
    idPedido: number,
    pedido: {
      detalles: Prisma.DetallePedidoGetPayload<{ include: typeof detalleInclude }>[];
      clienteMulero: boolean;
    },
    personaPlanIndice: number,
    totalPersonasPlan: number,
    montoObjetivoNeto: number | undefined,
    config: ConfigDescuentoCalc,
    poolSeleccion?: DetalleCobroCantidad[],
  ): Promise<DetalleCobroCantidad[]> {
    const realesPendientes = pedido.detalles.filter(
      (d) =>
        d.idFactura == null &&
        d.idDetallePadre == null &&
        !d.producto.esCuotaPendienteReparto &&
        !esNotaSaldoRestantePendiente(d.notaCocina),
    );

    let baseSolicitudes: DetalleCobroCantidad[];
    if (poolSeleccion != null && poolSeleccion.length > 0) {
      baseSolicitudes = this.solicitudesPendientesEnPool(pedido, poolSeleccion);
    } else {
      baseSolicitudes = realesPendientes.map((d) => ({
        id_detalle: d.idDetalle,
        cantidad: d.cantidad,
      }));
    }

    const totalBase =
      baseSolicitudes.length > 0
        ? Number(this.calcularImportesFactura(pedido, baseSolicitudes, config).total)
        : 0;

    const saldoExistente = this.findSaldoRestantePendiente(pedido.detalles);
    const saldoActual = saldoExistente
      ? Math.round(Number(saldoExistente.precioUnitario)) * saldoExistente.cantidad
      : 0;

    const poolRef: SaldoPoolRef[] | null =
      poolSeleccion != null && poolSeleccion.length > 0
        ? poolSeleccion.map((s) => ({
            id_detalle: s.id_detalle,
            cantidad: s.cantidad,
          }))
        : null;

    const poolSoloSaldoExistente =
      saldoExistente != null &&
      poolRef != null &&
      poolRef.length > 0 &&
      poolRef.every((p) => p.id_detalle === saldoExistente.idDetalle);

    // ¿El saldo abierto es de ESTE mismo reparto combinado (mismo pool)?
    const saldoDelMismoReparto =
      saldoExistente != null &&
      poolRef != null &&
      !poolSoloSaldoExistente &&
      this.mismoPoolSaldo(saldoExistente.notaCocina, poolRef);

    /**
     * Combinado sobre platos: la base es el total del pool, NUNCA un saldo viejo
     * de “personas” (si no, la 1.ª cuota liquidaba ese saldo, marcaba todo el
     * pool y cerraba la mesa).
     */
    let disponible: number;
    let baseApertura: number;
    let reemplazarSaldo = false;

    if (poolRef != null && poolRef.length > 0 && !poolSoloSaldoExistente) {
      if (saldoDelMismoReparto && saldoActual > 0) {
        // Continuación del mismo combinado: usar restante.
        disponible = saldoActual;
        baseApertura = saldoActual;
      } else {
        // Nuevo combinado: base = selección actual.
        disponible = totalBase;
        baseApertura = totalBase;
        reemplazarSaldo = saldoExistente != null;
      }
    } else if (saldoActual > 0) {
      // Personas o combinado solo sobre el ítem saldo pendiente.
      disponible = saldoActual;
      baseApertura = saldoActual;
    } else {
      disponible = totalBase;
      baseApertura = totalBase;
    }

    if (disponible <= 0 || baseApertura <= 0) {
      throw new BadRequestException('No hay saldo pendiente para este reparto');
    }

    // Cuota congelada del cliente; si falta, reparte entre quienes faltan.
    const personasRestantes = Math.max(
      1,
      totalPersonasPlan - personaPlanIndice + 1,
    );
    const cuotaCongelada =
      montoObjetivoNeto != null && montoObjetivoNeto > 0
        ? Math.round(montoObjetivoNeto)
        : repartirMontoEnCop(disponible, personasRestantes)[0] ?? 0;
    const objetivo = Math.min(disponible, cuotaCongelada);
    if (objetivo <= 0) {
      throw new BadRequestException('Cuota de persona inválida');
    }

    const poolParaNota =
      poolRef ??
      (saldoExistente
        ? parseSaldoRestantePool(saldoExistente.notaCocina)
        : null);

    const saldo = await this.asegurarSaldoRestanteEnTx(
      tx,
      idPedido,
      pedido,
      baseApertura,
      poolParaNota,
      { reemplazar: reemplazarSaldo },
    );

    const opRow = await this.obtenerConfigOperativaRow();
    const idProductoSaldo = await idProductoCuotaPendienteReparto(
      tx,
      opRow.idProductoCuotaPendiente,
    );

    const queda = saldo.monto - objetivo;
    const abono = await tx.detallePedido.create({
      data: {
        idPedido,
        idProducto: idProductoSaldo,
        cantidad: 1,
        precioUnitario: objetivo,
        notaCocina: SALDO_ABONO_NOTA,
        enviadoCocina: false,
        listoCocina: false,
        listoParaRecoger: false,
      },
    });

    if (queda <= 0) {
      await tx.detallePedido.delete({ where: { idDetalle: saldo.idDetalle } });
    } else {
      await tx.detallePedido.update({
        where: { idDetalle: saldo.idDetalle },
        data: { precioUnitario: queda, cantidad: 1, notaCocina: saldo.nota },
      });
    }

    return [{ id_detalle: abono.idDetalle, cantidad: 1 }];
  }

  /**
   * Si ya no queda saldo pendiente, marca platos reales del alcance como cobrados.
   * Personas (sin pool): todos los platos pendientes.
   * Combinado (con pool en nota o en opts): solo el pool.
   */
  private async marcarPlatosRealesCobradosSiSaldoLiquidadoEnTx(
    tx: Prisma.TransactionClient,
    idPedido: number,
    idFactura: number,
    opts?: {
      pool?: SaldoPoolRef[] | null;
      sobreTotal?: boolean;
      notaSaldo?: string | null;
    },
  ) {
    const sigueSaldo = await this.countSaldoRestantePendienteEnTx(tx, idPedido);
    if (sigueSaldo > 0) return;

    const pedido = await tx.pedido.findUnique({
      where: { idPedido },
      include: {
        detalles: { include: detalleInclude, orderBy: { idDetalle: 'asc' } },
      },
    });
    if (!pedido) return;

    // Solo aplica al liquidar un «Saldo pendiente». Un cobro por platos no debe
    // marcar el resto del pedido ni liberar la mesa.
    const cargoSaldoEnFactura = pedido.detalles.some(
      (d) =>
        d.idFactura === idFactura &&
        (esNotaSaldoRestantePendiente(d.notaCocina) ||
          (d.notaCocina ?? '').trim().startsWith(SALDO_ABONO_NOTA)),
    );
    const planSaldo =
      opts?.sobreTotal === true ||
      (opts?.pool != null && opts.pool.length > 0) ||
      opts?.notaSaldo != null;
    if (!cargoSaldoEnFactura && !planSaldo) {
      return;
    }

    // Fragmento huérfano (post-reconciliación a platos): no marca platos.
    const saldoEnFactura = pedido.detalles.find(
      (d) =>
        d.idFactura === idFactura &&
        esNotaSaldoRestantePendiente(d.notaCocina),
    );
    if (
      saldoEnFactura &&
      esNotaSaldoFragmentoHuerfano(saldoEnFactura.notaCocina)
    ) {
      return;
    }

    let pool =
      opts?.pool ??
      (opts?.notaSaldo ? parseSaldoRestantePool(opts.notaSaldo) : null);
    let sobreTotal = opts?.sobreTotal === true;

    // Saldo cobrado entero en esta factura (cobro directo del ítem pendiente).
    if (pool == null && !sobreTotal && saldoEnFactura) {
      pool = parseSaldoRestantePool(saldoEnFactura.notaCocina);
      if (pool == null) sobreTotal = true;
    }

    // Si no vino pool, intentar desde facturas del plan (combinado).
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
        pool = this.parseSeleccionReferenciaFactura(
          factura.planSeleccionReferencia,
        );
      } else if (factura?.planPersonasSobreTotal) {
        sobreTotal = true;
        pool = null;
      }
    }

    // Sin evidencia de alcance de saldo: no tocar platos ajenos a la tanda.
    if (!sobreTotal && (pool == null || pool.length === 0) && !cargoSaldoEnFactura) {
      return;
    }

    if (pool != null && pool.length > 0) {
      const solicitudes = this.solicitudesPendientesEnPool(pedido, pool);
      const porId = new Map(pedido.detalles.map((d) => [d.idDetalle, d]));
      for (const s of solicitudes) {
        const det = porId.get(s.id_detalle);
        if (!det || det.idFactura != null) continue;
        await this.aplicarCobroDetalleEnTx(tx, det, s.cantidad, idFactura);
      }
      return;
    }

    // Sobre total (o saldo sin pool): todos los platos reales pendientes.
    if (!sobreTotal && !cargoSaldoEnFactura) {
      return;
    }
    for (const det of pedido.detalles) {
      if (det.idFactura != null) continue;
      if (det.producto.esCuotaPendienteReparto) continue;
      if (esNotaSaldoRestantePendiente(det.notaCocina)) continue;
      await tx.detallePedido.update({
        where: { idDetalle: det.idDetalle },
        data: { idFactura },
      });
    }
  }

  /**
   * Resumen de facturación del día (o fecha YYYY-MM-DD) en zona Bogotá.
   * Por defecto no incluye líneas de cada factura (cargar bajo demanda).
   */
  async resumenDiario(
    fecha?: string,
    opts?: { incluirLineas?: boolean },
  ) {
    const incluirLineas = opts?.incluirLineas === true;
    let base = DateTime.now().setZone('America/Bogota');
    if (fecha) {
      const parsed = DateTime.fromISO(fecha, { zone: 'America/Bogota' });
      if (!parsed.isValid) {
        throw new BadRequestException('fecha inválida, usa formato YYYY-MM-DD');
      }
      base = parsed;
    }

    const start = base.startOf('day').toJSDate();
    const end = base.endOf('day').plus({ millisecond: 1 }).toJSDate();

    const facturas = await this.prisma.factura.findMany({
      where: { emitidaEn: { gte: start, lt: end } },
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
      where: { fecha: fechaOnly },
    });
    const montoBaseEfectivo = cajaRow ? Number(cajaRow.montoBaseEfectivo) : 0;
    const montoBaseCierreEfectivo =
      cajaRow?.montoBaseCierreEfectivo != null
        ? Number(cajaRow.montoBaseCierreEfectivo)
        : null;

    const totalesPorMetodo = totalesPorMetodoResumenVacios();

    const byMesa = new Map<number, { pedidos: number; total: number }>();
    let totalFacturado = 0;
    for (const f of facturas) {
      const t = Number(f.total);
      totalFacturado += t;
      acumularVentaPorMetodoPago(totalesPorMetodo, f.metodoPago, t);

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
      const pedidoConLineas = f.pedido as (typeof f.pedido) & {
        detalles: {
          idDetalle: number;
          idProducto: number;
          idDetallePadre: number | null;
          idFactura: number | null;
          cantidad: number;
          precioUnitario: Prisma.Decimal;
          notaCocina: string | null;
          producto: {
            nombre: string;
            esPlatoPrincipal: boolean;
            esEmpacable: boolean;
            esAcompanamientoMazorca: boolean;
            categoria: {
              nombre: string;
              esBebida: boolean;
              esLineaEmpaque: boolean;
            };
          };
          personalizaciones: {
            opcion: { idOpcion: number; descripcion: string };
          }[];
        }[];
      };
      return {
        ...header,
        detalles: lineasFacturaParaTicket(
          pedidoConLineas.detalles
            .filter((d) => d.idFactura === f.idFactura)
            .map((d) => this.lineaFacturaDesdePrismaResumen(d)),
        ),
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

    const ventas = agregarVentasResumenDiario(
      detallesFacturados.map((d) => {
        const pu = Number(d.precioUnitario);
        return {
          id_producto: d.producto.idProducto,
          nombre_producto: d.producto.nombre,
          categoria_nombre: d.producto.categoria.nombre,
          es_plato_principal: d.producto.esPlatoPrincipal,
          cantidad: d.cantidad,
          subtotal_linea: pu * d.cantidad,
        };
      }),
    );

    const subtotal_ventas_bruto = ventas.items_menu.reduce(
      (s, i) => s + i.subtotal,
      0,
    );
    const total_descuentos_dia = facturas.reduce(
      (s, f) =>
        s +
        Number(f.descuentoSopas) +
        Number(f.descuentoMuleros) +
        Number(f.descuentoPromociones),
      0,
    );

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
    const movimientos_caja = devolucionesRows.map((r) =>
      this.mapMovimientoCajaRow(r),
    );
    const cuadre = calcularEfectivoEsperadoEnCaja({
      monto_base_efectivo: montoBaseEfectivo,
      ventas_efectivo: totalesPorMetodo.efectivo,
      total_pagos_meseros,
      movimientos: movimientos_caja.map((m) => ({
        tipo: m.tipo as
          | 'devolucion_exceso_transferencia'
          | 'entrada_manual'
          | 'salida_manual'
          | 'pago_domicilio'
          | 'pago_mesero',
        monto: m.monto,
        metodo_devolucion: m.metodo_devolucion as 'efectivo' | 'transferencia' | null,
      })),
    });
    const devoluciones_exceso_transferencia = movimientos_caja.filter(
      (m) => m.tipo === 'devolucion_exceso_transferencia',
    );

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
      pedidos_reabiertos_pendientes:
        await this.contarPedidosReabiertosPendientes(fecha),
    };
  }

  /** Pedidos sin cobro con historial de cobro reabierto (para limpieza en pruebas). */
  private async idsPedidosReabiertosPendientes(_fecha?: string): Promise<number[]> {
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
      take: OPERATIVE_PEDIDOS_MAX,
    });
    return rows.map((r) => r.idPedido);
  }

  async contarPedidosReabiertosPendientes(fecha?: string): Promise<number> {
    const ids = await this.idsPedidosReabiertosPendientes(fecha);
    return ids.length;
  }

  /**
   * Cancela en masa pedidos reabiertos sin cobro del día (solo pruebas / admin).
   * Libera mesas y reintegra stock de bebidas.
   */
  async cancelarPedidosReabiertos(
    actor: { idUsuario: number; rol: { nombre: string } },
    dto: CancelarReabiertosDto,
    fecha?: string,
  ) {
    if (!esRolAdministrativo(actor.rol.nombre)) {
      throw new ForbiddenException('Solo admin');
    }
    if (dto.confirmar.trim().toUpperCase() !== 'CANCELAR') {
      throw new BadRequestException(
        'Escribe confirmar: "CANCELAR" para eliminar pedidos reabiertos',
      );
    }

    const ids = await this.idsPedidosReabiertosPendientes(fecha);
    if (ids.length === 0) {
      return {
        fecha: fecha ?? DateTime.now().setZone('America/Bogota').toFormat('yyyy-LL-dd'),
        pedidos_cancelados: 0,
        mesas_liberadas: 0,
      };
    }

    const mesasLiberadas = new Set<number>();
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
      if (
        !pedido ||
        pedido.facturas.length > 0 ||
        !['abierto', 'en_cocina'].includes(pedido.estado)
      ) {
        continue;
      }

      const idMesaPedido = pedido.idMesa;
      await this.prisma.$transaction(async (tx) => {
        for (const d of pedido.detalles) {
          await reintegrarStockBebidaTx(tx, d.producto, d.cantidad);
        }
        await this.eliminarCuentasCreditoEnTx(tx, { idPedido });
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

      this.emit(idPedido, idMesaPedido, pedido.idUsuario);
      cancelados += 1;
    }

    if (cancelados > 0) {
      this.gateway.emitConfigActualizada('mesas');
    }

    let fechaLabel = DateTime.now().setZone('America/Bogota').toFormat('yyyy-LL-dd');
    if (fecha) {
      const parsed = DateTime.fromISO(fecha, { zone: 'America/Bogota' });
      if (parsed.isValid) fechaLabel = parsed.toFormat('yyyy-LL-dd');
    }

    return {
      fecha: fechaLabel,
      pedidos_cancelados: cancelados,
      mesas_liberadas: mesasLiberadas.size,
    };
  }

  /**
   * Elimina facturas y caja del día (solo pruebas / corrección admin).
   * Reabre pedidos afectados y libera mesas si corresponde.
   */
  async vaciarResumenDiario(
    actor: { idUsuario: number; rol: { nombre: string } },
    dto: VaciarResumenDiarioDto,
    fecha?: string,
  ) {
    if (!esRolAdministrativo(actor.rol.nombre)) {
      throw new ForbiddenException('Solo admin');
    }
    if (dto.confirmar.trim().toUpperCase() !== 'VACIAR') {
      throw new BadRequestException(
        'Escribe confirmar: "VACIAR" para vaciar el resumen del día',
      );
    }

    let base = DateTime.now().setZone('America/Bogota');
    if (fecha) {
      const parsed = DateTime.fromISO(fecha, { zone: 'America/Bogota' });
      if (!parsed.isValid) {
        throw new BadRequestException('fecha inválida, usa formato YYYY-MM-DD');
      }
      base = parsed;
    }
    const start = base.startOf('day').toJSDate();
    const end = base.endOf('day').plus({ millisecond: 1 }).toJSDate();
    const fechaOnly = this.fechaCalendarioBogota(base);

    const facturas = await this.prisma.factura.findMany({
      where: { emitidaEn: { gte: start, lt: end } },
      select: { idFactura: true, idPedido: true },
    });

    if (facturas.length === 0) {
      await this.prisma.cajaDiaria.deleteMany({ where: { fecha: fechaOnly } });
      await this.prisma.registroBeneficioMesero.deleteMany({
        where: { fecha: fechaOnly },
      });
      await this.prisma.movimientoCaja.deleteMany({ where: { fecha: fechaOnly } });
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
      await this.eliminarCuentasCreditoEnTx(tx, { idFacturas: idsFacturas });
      await tx.factura.deleteMany({
        where: { idFactura: { in: idsFacturas } },
      });

      for (const idPedido of pedidoIds) {
        const restantes = await tx.factura.count({ where: { idPedido } });
        if (restantes > 0) continue;

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
        if (!pedido || pedido.detalles.length === 0) continue;

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

        // Historial para que «Cancelar reabiertos» los encuentre a la primera.
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

      await tx.cajaDiaria.deleteMany({ where: { fecha: fechaOnly } });
      await tx.registroBeneficioMesero.deleteMany({
        where: { fecha: fechaOnly },
      });
      await tx.movimientoCaja.deleteMany({ where: { fecha: fechaOnly } });
    });

    for (const idPedido of pedidoIds) {
      const p = await this.prisma.pedido.findUnique({
        where: { idPedido },
        select: { idMesa: true, idUsuario: true },
      });
      if (p) {
        this.emit(idPedido, p.idMesa, p.idUsuario);
      }
    }
    this.gateway.emitConfigActualizada('mesas');

    return {
      fecha: base.toFormat('yyyy-LL-dd'),
      facturas_eliminadas: idsFacturas.length,
      pedidos_reabiertos: pedidosReabiertos,
    };
  }

  /**
   * Anula todos los cobros de un pedido, revierte movimientos de caja ligados
   * y reabre el pedido para editar y volver a facturar (solo admin).
   */
  async reabrirCobro(
    idPedido: number,
    dto: ReabrirCobroDto,
    actor: { idUsuario: number; rol: { nombre: string } },
  ) {
    if (!esRolAdministrativo(actor.rol.nombre)) {
      throw new ForbiddenException('Solo admin');
    }
    if (dto.confirmar.trim().toUpperCase() !== 'REABRIR') {
      throw new BadRequestException(
        'Escribe confirmar: "REABRIR" para anular los cobros del pedido',
      );
    }

    const pedido = await this.prisma.pedido.findUnique({
      where: { idPedido },
      include: {
        facturas: { orderBy: { emitidaEn: 'asc' } },
        detalles: { select: { enviadoCocina: true } },
      },
    });
    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }
    if (pedido.facturas.length === 0) {
      throw new ConflictException('Este pedido no tiene cobros registrados');
    }

    const idsFacturas = pedido.facturas.map((f) => f.idFactura);
    const motivo = dto.motivo.trim();
    const detalleHistorial = {
      motivo,
      facturas_eliminadas: idsFacturas,
      cobro_mixto_grupos: [
        ...new Set(
          pedido.facturas
            .map((f) => f.cobroMixtoGrupo)
            .filter((g): g is number => g != null),
        ),
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
        ...new Set(
          pedido.facturas
            .map((f) => f.personaPlanIndice)
            .filter((i): i is number => i != null),
        ),
      ],
      era_parcial: pedido.facturas.some((f) => f.esParcial),
    };

    let movimientosEliminados = 0;
    const enCocina = pedido.detalles.some((d) => d.enviadoCocina);
    const nuevoEstado = enCocina ? 'en_cocina' : 'abierto';

    await this.prisma.$transaction(async (tx) => {
      await lockPedidoEnTx(tx, idPedido);

      const movDel = await tx.movimientoCaja.deleteMany({
        where: {
          OR: [{ idPedido }, { idFactura: { in: idsFacturas } }],
        },
      });
      movimientosEliminados = movDel.count;

      // Liberar ítems antes de borrar facturas (FK detalle_pedido.id_factura).
      await tx.detallePedido.updateMany({
        where: { idPedido, idFactura: { in: idsFacturas } },
        data: { idFactura: null },
      });

      await this.eliminarCuentasCreditoEnTx(tx, {
        idPedido,
        idFacturas: idsFacturas,
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

    this.emit(idPedido, pedido.idMesa, pedido.idUsuario);
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

  /**
   * Anula una sola tanda de cobro (factura simple o grupo mixto).
   * Los demás cobros del pedido se conservan. Solo admin.
   */
  async revertirTandaCobro(
    idPedido: number,
    dto: RevertirTandaCobroDto,
    actor: { idUsuario: number; rol: { nombre: string } },
  ) {
    if (!esRolAdministrativo(actor.rol.nombre)) {
      throw new ForbiddenException('Solo admin');
    }
    if (dto.confirmar.trim().toUpperCase() !== 'REVERTIR') {
      throw new BadRequestException(
        'Escribe confirmar: "REVERTIR" para anular esta tanda de cobro',
      );
    }

    const motivo = dto.motivo.trim();
    if (motivo.length < 3) {
      throw new BadRequestException('Indica un motivo de al menos 3 caracteres');
    }

    const pedido = await this.prisma.pedido.findUnique({
      where: { idPedido },
      include: {
        facturas: { orderBy: { emitidaEn: 'asc' } },
        detalles: { select: { enviadoCocina: true, idFactura: true } },
      },
    });
    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }
    if (pedido.facturas.length === 0) {
      throw new ConflictException('Este pedido no tiene cobros registrados');
    }

    const facturasRefs = pedido.facturas.map((f) => ({
      id_factura: f.idFactura,
      metodo_pago: f.metodoPago,
      persona_plan_indice: f.personaPlanIndice,
      cobro_mixto_grupo: f.cobroMixtoGrupo,
      total: Math.round(Number(f.total)),
      emitida_en: f.emitidaEn,
    }));
    const tanda = facturasDeTandaCobro(facturasRefs, dto.id_factura);
    if (tanda.length === 0) {
      throw new NotFoundException(
        'La factura indicada no pertenece a este pedido',
      );
    }

    const idsFacturas = tanda.map((f) => f.id_factura);
    const quedanOtrasFacturas = pedido.facturas.some(
      (f) => !idsFacturas.includes(f.idFactura),
    );
    const enCocina = pedido.detalles.some((d) => d.enviadoCocina);
    const nuevoEstado = enCocina ? 'en_cocina' : 'abierto';

    const detalleHistorial = {
      motivo,
      alcance: 'tanda' as const,
      id_factura_solicitada: dto.id_factura,
      facturas_eliminadas: idsFacturas,
      cobro_mixto_grupo:
        tanda.find((f) => f.cobro_mixto_grupo != null)?.cobro_mixto_grupo ??
        null,
      persona_plan_indice:
        tanda.find((f) => f.persona_plan_indice != null)?.persona_plan_indice ??
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
      await lockPedidoEnTx(tx, idPedido);

      const movDel = await tx.movimientoCaja.deleteMany({
        where: { idFactura: { in: idsFacturas } },
      });
      movimientosEliminados = movDel.count;

      await tx.detallePedido.updateMany({
        where: { idPedido, idFactura: { in: idsFacturas } },
        data: { idFactura: null },
      });

      await this.eliminarCuentasCreditoEnTx(tx, { idFacturas: idsFacturas });
      await tx.factura.deleteMany({
        where: { idPedido, idFactura: { in: idsFacturas } },
      });

      // Pedido vuelve a abierto/en_cocina (había ítems liberados o estaba facturado).
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
          // Mismo enum que reabrir-todo; se distingue por detalleJson.alcance = 'tanda'.
          tipo: 'cobro_reabierto',
          detalleJson: detalleHistorial,
        },
      });
    });

    await this.consolidarFragmentosPrecioPendientesPedido(idPedido);
    await this.reconstruirSaldoPendienteTrasRevertirTanda(idPedido);
    // Reparte el saldo en unidades de plato (evita platos enteros + saldo = sobrecobro).
    await this.reconciliarSaldoAPlatos(idPedido, actor);

    this.emit(idPedido, pedido.idMesa, pedido.idUsuario);
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

  /**
   * Tras revertir una tanda del plan personas/combinado: limpia abonos/saldo
   * huérfanos, desmarca platos solo atribuidos al plan y recrea el saldo
   * pendiente (= platos libres − cobros de plan que siguen vigentes).
   */
  private async reconstruirSaldoPendienteTrasRevertirTanda(
    idPedido: number,
  ): Promise<void> {
    const configRow = await this.obtenerConfigDescuentosRow();
    const config = this.mapConfigDescuentos(configRow);

    await this.prisma.$transaction(async (tx) => {
      await lockPedidoEnTx(tx, idPedido);

      const pedido = await tx.pedido.findUnique({
        where: { idPedido },
        include: {
          detalles: { include: detalleInclude, orderBy: { idDetalle: 'asc' } },
          facturas: { orderBy: { idFactura: 'asc' } },
        },
      });
      if (!pedido) return;

      const esInternoSaldo = (d: {
        notaCocina: string | null;
        producto: { esCuotaPendienteReparto: boolean };
      }) =>
        d.producto.esCuotaPendienteReparto ||
        esNotaSaldoRestantePendiente(d.notaCocina) ||
        (d.notaCocina ?? '').trim().startsWith(SALDO_ABONO_NOTA);

      // Sin cobros: solo limpiar internos pendientes.
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

      const idsFacturasPlan = new Set<number>();
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

      // 1) Borrar saldo/abonos pendientes (huérfanos del revertir).
      const idsInternosPendientes = pedido.detalles
        .filter((d) => d.idFactura == null && esInternoSaldo(d))
        .map((d) => d.idDetalle);
      if (idsInternosPendientes.length > 0) {
        await tx.detallePedido.deleteMany({
          where: { idDetalle: { in: idsInternosPendientes } },
        });
      }

      // 2) Desmarcar platos reales atribuidos solo al plan (los abonos de
      // facturas vigentes se conservan como registro del dinero cobrado).
      if (idsFacturasPlan.size > 0) {
        for (const d of pedido.detalles) {
          if (d.idFactura == null) continue;
          if (!idsFacturasPlan.has(d.idFactura)) continue;
          if (esInternoSaldo(d)) continue;
          await tx.detallePedido.update({
            where: { idDetalle: d.idDetalle },
            data: { idFactura: null },
          });
        }
      }

      // Si ya no queda ningún cobro de plan, no hay saldo que reconstruir.
      if (idsFacturasPlan.size === 0) return;

      const pedido2 = await tx.pedido.findUnique({
        where: { idPedido },
        include: {
          detalles: { include: detalleInclude, orderBy: { idDetalle: 'asc' } },
          facturas: { orderBy: { idFactura: 'asc' } },
        },
      });
      if (!pedido2) return;

      const cobradoPlan = pedido2.facturas
        .filter((f) => idsFacturasPlan.has(f.idFactura))
        .reduce((s, f) => s + Math.round(Number(f.total)), 0);
      if (cobradoPlan <= 0) return;

      const realesPendientes = pedido2.detalles.filter(
        (d) =>
          d.idFactura == null &&
          d.idDetallePadre == null &&
          !esInternoSaldo(d),
      );
      if (realesPendientes.length === 0) return;

      const solicitudes = realesPendientes.map((d) => ({
        id_detalle: d.idDetalle,
        cantidad: d.cantidad,
      }));
      const totalPendiente = Number(
        this.calcularImportesFactura(pedido2, solicitudes, config).total,
      );
      const montoSaldo = Math.max(0, totalPendiente - cobradoPlan);
      if (montoSaldo <= 0) return;

      await this.asegurarSaldoRestanteEnTx(
        tx,
        idPedido,
        pedido2,
        montoSaldo,
        null,
      );
    });
  }

  async resumenDiarioLineasFactura(idFactura: number) {
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
      throw new NotFoundException('Factura no encontrada');
    }
    return {
      id_factura: f.idFactura,
      detalles: lineasFacturaParaTicket(
        f.pedido.detalles.map((d) => this.lineaFacturaDesdePrismaResumen(d)),
      ),
    };
  }

  /**
   * Reimprime, por cada venta del día en orden cronológico, la comanda de cocina
   * (si aplica) y la factura. Útil para archivo físico al cierre.
   */
  async imprimirResumenDiarioCompleto(fecha?: string) {
    const resumen = await this.resumenDiario(fecha, { incluirLineas: true });
    if (resumen.total_facturas === 0) {
      throw new BadRequestException('No hay ventas facturadas en esta fecha');
    }

    return this.comandaPrinter.runWithImpresionRapida(async () => {
      let comandasImpresas = 0;
      let comandasOmitidas = 0;
      let facturasImpresas = 0;
      const errores: string[] = [];
      let detenidoSinPapel = false;

      const comandasImpresasPedidos = new Set<number>();

      for (const ped of resumen.pedidos_detalle) {
        if (detenidoSinPapel) break;

        if (!comandasImpresasPedidos.has(ped.id_pedido)) {
          const comanda = await this.imprimirComandaPedidoSiAplica(ped.id_pedido);
          comandasImpresasPedidos.add(ped.id_pedido);
          if (comanda === null) {
            comandasOmitidas += 1;
          } else if (comanda.impreso) {
            comandasImpresas += 1;
          } else {
            errores.push(
              `Pedido #${ped.id_pedido} comanda: ${comanda.error ?? 'sin imprimir'}`,
            );
            if (comanda.codigo_error === 'sin_papel') {
              detenidoSinPapel = true;
              this.emitirAlertaImpresora(comanda, 'comanda', ped.id_pedido);
              break;
            }
          }
        }
      }

      const idsFacturasUnicas = facturasIdsImpresionUnica(resumen.pedidos_detalle);
      for (const idFactura of idsFacturasUnicas) {
        if (detenidoSinPapel) break;

        const ped = resumen.pedidos_detalle.find((p) => p.id_factura === idFactura);
        const factura = await this.imprimirFacturaPorId(idFactura);
        if (factura.impreso) {
          facturasImpresas += 1;
        } else {
          errores.push(
            `Pedido #${ped?.id_pedido ?? '?'} factura: ${factura.error ?? 'sin imprimir'}`,
          );
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

  /** Imprime solo las facturas y comandas indicadas del resumen del día. */
  async imprimirResumenDiarioSeleccion(
    dto: { id_facturas?: number[]; id_pedidos_comanda?: number[] },
    fecha?: string,
  ) {
    const idFacturas = [...new Set(dto.id_facturas ?? [])].filter((id) => id > 0);
    const idPedidosComanda = [...new Set(dto.id_pedidos_comanda ?? [])].filter(
      (id) => id > 0,
    );
    if (idFacturas.length === 0 && idPedidosComanda.length === 0) {
      throw new BadRequestException(
        'Selecciona al menos una factura o comanda',
      );
    }

    const resumen = await this.resumenDiario(fecha, { incluirLineas: false });
    const facturasValidas = new Set(
      resumen.pedidos_detalle.map((p) => p.id_factura),
    );
    const pedidosValidos = new Set(
      resumen.pedidos_detalle.map((p) => p.id_pedido),
    );

    const facturasInvalidas = idFacturas.filter((id) => !facturasValidas.has(id));
    const pedidosInvalidos = idPedidosComanda.filter(
      (id) => !pedidosValidos.has(id),
    );
    if (facturasInvalidas.length > 0 || pedidosInvalidos.length > 0) {
      throw new BadRequestException(
        'Hay ítems seleccionados que no pertenecen a esta fecha',
      );
    }

    const ordenFacturas = resumen.pedidos_detalle
      .filter((p) => idFacturas.includes(p.id_factura))
      .sort(
        (a, b) =>
          new Date(a.emitida_en).getTime() - new Date(b.emitida_en).getTime(),
      );
    const idsFacturasDedup = facturasIdsImpresionUnica(ordenFacturas);
    const ordenPedidos = [...idPedidosComanda].sort((a, b) => a - b);

    return this.comandaPrinter.runWithImpresionRapida(async () => {
      let comandasImpresas = 0;
      let comandasOmitidas = 0;
      let facturasImpresas = 0;
      const errores: string[] = [];
      let detenidoSinPapel = false;

      for (const idPedido of ordenPedidos) {
        if (detenidoSinPapel) break;

        const comanda = await this.imprimirComandaPedidoSiAplica(idPedido);
        if (comanda === null) {
          comandasOmitidas += 1;
        } else if (comanda.impreso) {
          comandasImpresas += 1;
        } else {
          errores.push(
            `Pedido #${idPedido} comanda: ${comanda.error ?? 'sin imprimir'}`,
          );
          if (comanda.codigo_error === 'sin_papel') {
            detenidoSinPapel = true;
            this.emitirAlertaImpresora(comanda, 'comanda', idPedido);
            break;
          }
        }
      }

      for (const idFactura of idsFacturasDedup) {
        if (detenidoSinPapel) break;

        const pedidoDetalle = resumen.pedidos_detalle.find(
          (p) => p.id_factura === idFactura,
        );
        const factura = await this.imprimirFacturaPorId(idFactura);
        if (factura.impreso) {
          facturasImpresas += 1;
        } else {
          errores.push(
            `Factura #${idFactura}${pedidoDetalle ? ` (pedido #${pedidoDetalle.id_pedido})` : ''}: ${factura.error ?? 'sin imprimir'}`,
          );
          if (factura.codigo_error === 'sin_papel') {
            detenidoSinPapel = true;
            this.emitirAlertaImpresora(
              factura,
              'factura',
              pedidoDetalle?.id_pedido,
            );
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

  /** Imprime un único ticket con totales del día (cierre resumido). */
  async imprimirResumenDiarioTotal(fecha?: string) {
    const resumen = await this.resumenDiario(fecha);
    const ticket: CierreCajaTicket = {
      fecha: resumen.fecha,
      total_facturado: resumen.total_facturado,
      total_facturas: resumen.total_facturas,
      monto_base_efectivo: resumen.monto_base_efectivo,
      totales_por_metodo: resumen.totales_por_metodo,
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
    const impresion = await this.comandaPrinter.runWithImpresionRapida(() =>
      this.comandaPrinter.imprimirCierreCaja(ticket),
    );
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

  /** Comanda de cocina si el pedido tiene platos enviados; null si no aplica. */
  private async imprimirComandaPedidoSiAplica(
    idPedido: number,
  ): Promise<ResultadoImpresion | null> {
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
    const enviados = pedido.detalles.filter(
      (d) =>
        debeMarcarCocina(d.producto.categoria, d.producto.esEmpacable) &&
        d.enviadoCocina,
    );
    if (enviados.length === 0) {
      return null;
    }
    const comanda = this.construirTicketComanda(pedido, enviados, {
      esReimpresion: true,
    });
    return this.comandaPrinter.imprimirComanda(comanda);
  }

  private async imprimirFacturaPorId(
    idFactura: number,
  ): Promise<ResultadoImpresion> {
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

  private async imprimirFacturaPedido(idPedido: number): Promise<ResultadoImpresion> {
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

  async crear(dto: CreatePedidoDto, idUsuario: number) {
    const mesa = await this.prisma.mesa.findUnique({
      where: { idMesa: dto.id_mesa },
    });
    if (!mesa) {
      throw new NotFoundException('Mesa no encontrada');
    }
    if (!mesaDisponibleHoyBogota(mesa)) {
      throw new ConflictException('Esta mesa no está disponible hoy');
    }
    const virtual = await this.esMesaVirtualNumero(mesa.numero);

    const opRow = await this.obtenerConfigOperativaRow();
    const modoServicio = esMesaParaLlevarNumero(mesa.numero, opRow)
      ? 'para_llevar'
      : 'en_mesa';

    const op = await this.ctxOperativa();

    const pedido = await this.prisma.$transaction(async (tx) => {
      if (!virtual) {
        await lockMesaEnTx(tx, dto.id_mesa);
        const mesaTx = await tx.mesa.findUnique({
          where: { idMesa: dto.id_mesa },
        });
        if (!mesaTx || mesaTx.estado !== 'libre') {
          throw new ConflictException('La mesa no está libre');
        }
        const otro = await tx.pedido.findFirst({
          where: {
            idMesa: dto.id_mesa,
            estado: { in: ABIERTOS },
          },
        });
        if (otro) {
          throw new ConflictException('Ya existe un pedido abierto en esta mesa');
        }
      }

      const p = await tx.pedido.create({
        data: {
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
      await crearLineaMazorcaInicial(tx, {
        idPedido: p.idPedido,
        numComensales: dto.num_comensales,
        mesaNumero: mesa.numero,
        mazorcaActiva: op.mazorcaActiva,
        idProductoMazorca: op.idProductoMazorca,
      });
      return p;
    });

    this.emit(pedido.idPedido, pedido.idMesa, pedido.idUsuario);
    return this.obtenerPorIdTrasEscritura(pedido.idPedido);
  }

  async listar(
    estadosCsv: string,
    orden: 'asc' | 'desc' | 'prioridad_cocina' = 'desc',
    pagination?: { limit: number; offset: number },
  ) {
    const estados = estadosCsv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean) as EstadoPedido[];
    if (estados.length === 0) {
      throw new BadRequestException(
        'Indica al menos un estado en el parámetro "estados"',
      );
    }
    const orderByPrisma =
      orden === 'prioridad_cocina'
        ? { creadoEn: 'asc' as const }
        : { creadoEn: orden };
    const rows = await this.prisma.pedido.findMany({
      where: { estado: { in: estados } },
      include: pedidoVistaOperativaInclude,
      orderBy: orderByPrisma,
      take: pagination?.limit,
      skip: pagination?.offset,
    });
    const serializados = rows.map((p) => serializarPedidoVistaOperativa(p));
    if (orden === 'prioridad_cocina') {
      return {
        pedidos: ordenarPedidosCocina(serializados),
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

  /** Vista ligera para pantalla de cocina (sin factura ni precios). */
  async listarCocina(actor?: { idUsuario: number; rol: { nombre: string } }) {
    const rows = await this.prisma.pedido.findMany({
      where: { estado: 'en_cocina' },
      include: pedidoVistaOperativaInclude,
      orderBy: { creadoEn: 'asc' },
      take: OPERATIVE_PEDIDOS_MAX,
    });
    const serializados = rows.map(serializarPedidoVistaOperativa);
    const todos = ordenarPedidosCocinaPorLlegada(serializados);
    return { pedidos: todos };
  }

  /** Pedidos abiertos/en cocina del mesero (seguimiento en sala). */
  async listarMisActivos(actor: { idUsuario: number; rol: { nombre: string } }) {
    const rows = await this.prisma.pedido.findMany({
      where: {
        estado: { in: ABIERTOS },
        idUsuario: actor.idUsuario,
      },
      include: pedidoVistaOperativaInclude,
      orderBy: { creadoEn: 'asc' },
      take: OPERATIVE_PEDIDOS_MAX,
    });
    const pedidos = rows.map(serializarPedidoVistaOperativa);
    const mesas = new Set(pedidos.map((p) => p.mesa_numero));
    return {
      pedidos,
      mesas_activas: mesas.size,
    };
  }

  /** Contadores livianos para badges en mesas (sin serializar pedidos completos). */
  async listarMisActivosResumen(actor: {
    idUsuario: number;
    rol: { nombre: string };
  }) {
    const rows = await this.prisma.pedido.findMany({
      where: {
        estado: { in: ABIERTOS },
        idUsuario: actor.idUsuario,
      },
      take: OPERATIVE_PEDIDOS_MAX,
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
    const mesaIds: number[] = [];
    const pedidoIds: number[] = [];
    const mv = resolverMesasVirtuales(await this.obtenerConfigOperativaRow());

    for (const p of rows) {
      pedidoIds.push(p.idPedido);
      mesaIds.push(p.idMesa);
      const numero = p.mesa.numero;
      if (numero === mv.numero_mesa_mostrador) pedidosMostrador += 1;
      if (numero === mv.numero_mesa_para_llevar) pedidosParaLlevar += 1;

      for (const d of p.detalles) {
        const cat = d.producto.categoria;
        const esBebida = categoriaEsBebida(cat);
        const esEmpacable = d.producto.esEmpacable;
        const marcarCocina = debeMarcarCocina(cat, esEmpacable);
        if (marcarCocina && !d.enviadoCocina) {
          platosSinPasarCocina += d.cantidad;
        }
        if (
          marcarCocina &&
          d.enviadoCocina &&
          d.listoParaRecoger &&
          !d.listoCocina &&
          !esBebida &&
          !esEmpacable
        ) {
          if (d.producto.esAcompanamientoMazorca) {
            mazorcasParaRecoger += d.cantidad;
          } else {
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

  /** Pedidos abiertos/en cocina de todo el restaurante (admin: badges y avisos de cobro). */
  async listarPendientesCobroResumen(actor: {
    rol: { nombre: string };
  }) {
    if (!esRolAdministrativo(actor.rol.nombre)) {
      throw new ForbiddenException('Solo admin');
    }

    const rows = await this.prisma.pedido.findMany({
      where: { estado: { in: ABIERTOS } },
      select: {
        idPedido: true,
        idMesa: true,
        mesa: { select: { numero: true } },
        usuario: { select: { nombre: true, apellido: true } },
      },
      orderBy: { creadoEn: 'asc' },
      take: OPERATIVE_PEDIDOS_MAX,
    });

    const mv = resolverMesasVirtuales(await this.obtenerConfigOperativaRow());
    let pedidosMostrador = 0;
    let pedidosParaLlevar = 0;
    let pedidosEnMesas = 0;

    const pedidos = rows.map((p) => {
      const numero = p.mesa.numero;
      let canal: 'mostrador' | 'para_llevar' | 'mesa' = 'mesa';
      if (numero === mv.numero_mesa_mostrador) {
        pedidosMostrador += 1;
        canal = 'mostrador';
      } else if (numero === mv.numero_mesa_para_llevar) {
        pedidosParaLlevar += 1;
        canal = 'para_llevar';
      } else {
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

  /**
   * Pedidos de otros meseros con platos pendientes de recoger en cocina
   * (para que un compañero pueda confirmar la recogida).
   */
  async listarAyudaCompaneros(actor: {
    idUsuario: number;
    rol: { nombre: string };
  }) {
    await this.exigirPermisoMesero(actor, 'ayuda_companeros');
    if (actor.rol.nombre !== 'mesero' && !esRolAdministrativo(actor.rol.nombre)) {
      return { pedidos: [], total_platos_para_recoger: 0 };
    }
    const rows = await this.prisma.pedido.findMany({
      where: {
        estado: { in: ABIERTOS },
        idUsuario: { not: actor.idUsuario },
      },
      include: pedidoVistaOperativaInclude,
      orderBy: { creadoEn: 'asc' },
      take: OPERATIVE_PEDIDOS_MAX,
    });
    const pedidos = rows
      .map(serializarPedidoVistaOperativa)
      .filter(pedidoTieneRecogidaPendiente);
    const total = pedidos.reduce(
      (acc, p) => acc + platosPendientesRecogerPedido(p),
      0,
    );
    return {
      pedidos,
      total_platos_para_recoger: total,
    };
  }

  async listarAyudaCompanerosResumen(actor: {
    idUsuario: number;
    rol: { nombre: string };
  }) {
    await this.exigirPermisoMesero(actor, 'ayuda_companeros');
    if (actor.rol.nombre !== 'mesero' && !esRolAdministrativo(actor.rol.nombre)) {
      return {
        platos_para_recoger: 0,
        pedidos: 0,
        pedido_ids: [] as number[],
        mesa_ids: [] as number[],
      };
    }

    const rows = await this.prisma.pedido.findMany({
      where: {
        estado: { in: ABIERTOS },
        idUsuario: { not: actor.idUsuario },
      },
      take: OPERATIVE_PEDIDOS_MAX,
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
                categoria: { select: { nombre: true, esBebida: true } },
              },
            },
          },
        },
      },
    });

    let platosParaRecoger = 0;
    const pedidoIds: number[] = [];
    const mesaIds: number[] = [];

    for (const p of rows) {
      let platosPedido = 0;
      for (const d of p.detalles) {
        const cat = d.producto.categoria;
        const esBebida = categoriaEsBebida(cat);
        const esEmpacable = d.producto.esEmpacable;
        const marcarCocina = debeMarcarCocina(cat, esEmpacable);
        if (
          marcarCocina &&
          d.enviadoCocina &&
          !d.listoCocina &&
          !esBebida &&
          !esEmpacable
        ) {
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

  /** Cocina avisa que el plato está listo para recoger (no cierra la línea en cocina). */
  async marcarListoParaRecoger(
    idDetalle: number,
    dto: { listo_para_recoger: boolean },
  ) {
    const det = await this.prisma.detallePedido.findUnique({
      where: { idDetalle },
      include: {
        producto: { include: { categoria: true } },
        pedido: { include: { mesa: true, usuario: true } },
      },
    });
    if (!det) {
      throw new NotFoundException('Línea no encontrada');
    }
    if (!ABIERTOS.includes(det.pedido.estado)) {
      throw new ConflictException('El pedido ya no está en cocina');
    }
    if (!det.enviadoCocina) {
      throw new BadRequestException('La línea aún no se envió a cocina');
    }
    if (categoriaEsBebida(det.producto.categoria)) {
      throw new BadRequestException('Las bebidas no aplican en cocina');
    }
    if (det.producto.esEmpacable) {
      throw new BadRequestException('Los empaques no aplican en cocina');
    }
    if (det.listoCocina) {
      throw new ConflictException('El mesero ya marcó este plato como recogido');
    }
    const listo = Boolean(dto.listo_para_recoger);
    await this.prisma.detallePedido.update({
      where: { idDetalle },
      data: { listoParaRecoger: listo },
    });
    this.emit(det.pedido.idPedido, det.pedido.idMesa, det.pedido.idUsuario);
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
      });
    }
    return {
      id_detalle: idDetalle,
      id_pedido: det.pedido.idPedido,
      listo_para_recoger: listo,
    };
  }

  /** Mesero confirma que recogió el plato en cocina. */
  async marcarDetalleRecogido(
    idDetalle: number,
    dto: PatchDetalleCocinaDto,
  ) {
    const det = await this.prisma.detallePedido.findUnique({
      where: { idDetalle },
      include: {
        producto: { include: { categoria: true } },
        pedido: true,
      },
    });
    if (!det) {
      throw new NotFoundException('Línea no encontrada');
    }
    if (!ABIERTOS.includes(det.pedido.estado)) {
      throw new ConflictException('El pedido ya no está en cocina');
    }
    if (categoriaEsBebida(det.producto.categoria)) {
      throw new BadRequestException(
        'Las bebidas no se marcan en cocina; solo platos y adicionales',
      );
    }
    if (det.producto.esEmpacable) {
      throw new BadRequestException(
        'Los empaques no se marcan en cocina; solo platos y adicionales',
      );
    }
    if (dto.listo_cocina) {
      if (!det.enviadoCocina) {
        throw new BadRequestException('La línea aún no se envió a cocina');
      }
      if (det.listoCocina) {
        throw new ConflictException('Este plato ya está marcado en la mesa');
      }
      const qty = dto.cantidad ?? det.cantidad;
      await this.aplicarRecogidaParcial(det, qty);
    } else {
      await this.prisma.detallePedido.update({
        where: { idDetalle },
        data: {
          listoCocina: false,
          listoParaRecoger: det.listoParaRecoger,
        },
      });
    }
    this.emit(det.pedido.idPedido, det.pedido.idMesa, det.pedido.idUsuario);
    return {
      id_detalle: idDetalle,
      id_pedido: det.pedido.idPedido,
      listo_cocina: dto.listo_cocina,
    };
  }

  /** Mesero avisa a cocina que un plato no está listo en el pase. */
  async avisarFaltaEnCocina(
    idDetalle: number,
    actorId: number,
    actorRol: string,
    cantidad?: number,
  ) {
    const det = await this.prisma.detallePedido.findUnique({
      where: { idDetalle },
      include: {
        producto: { include: { categoria: true } },
        pedido: { include: { mesa: true, usuario: true } },
      },
    });
    if (!det) {
      throw new NotFoundException('Línea no encontrada');
    }
    if (!ABIERTOS.includes(det.pedido.estado)) {
      throw new ConflictException('El pedido ya no está activo');
    }
    if (
      !esRolAdministrativo(actorRol) &&
      actorRol !== 'mesero' &&
      det.pedido.idUsuario !== actorId
    ) {
      throw new ForbiddenException('No tienes permiso para avisar en este pedido');
    }
    if (!det.enviadoCocina) {
      throw new BadRequestException('La línea aún no se envió a cocina');
    }
    if (det.listoCocina) {
      throw new ConflictException('Este plato ya está marcado en la mesa');
    }
    if (categoriaEsBebida(det.producto.categoria)) {
      throw new BadRequestException('Las bebidas no aplican en cocina');
    }
    if (det.producto.esEmpacable) {
      throw new BadRequestException('Los empaques no aplican en cocina');
    }
    if (
      !debeMarcarCocina(
        det.producto.categoria,
        det.producto.esEmpacable,
      )
    ) {
      throw new BadRequestException('Esta línea no pasa por cocina');
    }
    const qty = cantidad ?? det.cantidad;
    const cantidadAvisada = await this.aplicarFaltaParcial(det, qty);
    const mesero = det.pedido.usuario;
    this.emit(det.pedido.idPedido, det.pedido.idMesa, det.pedido.idUsuario);
    this.gateway.emitCocinaFaltaPlato({
      pedidoId: det.pedido.idPedido,
      mesaId: det.pedido.idMesa,
      mesaNumero: det.pedido.mesa.numero,
      idDetalle,
      productoNombre: det.producto.nombre,
      cantidad: cantidadAvisada,
      meseroNombre: `${mesero.nombre} ${mesero.apellido}`.trim(),
      at: new Date().toISOString(),
    });
    return {
      id_detalle: idDetalle,
      id_pedido: det.pedido.idPedido,
      listo_para_recoger: false,
      cantidad: cantidadAvisada,
    };
  }

  private async copiarPersonalizacionesDetalle(
    tx: Prisma.TransactionClient,
    desdeId: number,
    haciaId: number,
  ) {
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

  private async aplicarRecogidaParcial(
    det: {
      idDetalle: number;
      idPedido: number;
      idProducto: number;
      cantidad: number;
      precioUnitario: Prisma.Decimal;
      notaCocina: string | null;
      enviadoCocina: boolean;
      listoParaRecoger: boolean;
      listoCocina: boolean;
      idDetallePadre: number | null;
      idFactura: number | null;
    },
    cantidadRecoger: number,
  ) {
    if (cantidadRecoger < 1 || cantidadRecoger > det.cantidad) {
      throw new BadRequestException('Cantidad inválida');
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
      await this.copiarPersonalizacionesDetalle(
        tx,
        det.idDetalle,
        nuevo.idDetalle,
      );
    });
  }

  private async aplicarFaltaParcial(
    det: {
      idDetalle: number;
      idPedido: number;
      idProducto: number;
      cantidad: number;
      precioUnitario: Prisma.Decimal;
      notaCocina: string | null;
      enviadoCocina: boolean;
      idDetallePadre: number | null;
      idFactura: number | null;
    },
    cantidadFalta: number,
  ): Promise<number> {
    if (cantidadFalta < 1 || cantidadFalta > det.cantidad) {
      throw new BadRequestException('Cantidad inválida');
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
      await this.copiarPersonalizacionesDetalle(
        tx,
        det.idDetalle,
        nuevo.idDetalle,
      );
    });
    return cantidadFalta;
  }

  async llamarMesero(idPedido: number) {
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
      throw new NotFoundException('Pedido no encontrado');
    }
    if (!ABIERTOS.includes(pedido.estado)) {
      throw new ConflictException('El pedido ya no está activo');
    }

    const aplicaLlamada = detalleAplicaLlamadaMesero;

    const pendientesMarcar = pedido.detalles.filter(
      (d) => aplicaLlamada(d) && !d.listoParaRecoger,
    );
    if (pendientesMarcar.length > 0) {
      await this.prisma.detallePedido.updateMany({
        where: {
          idDetalle: { in: pendientesMarcar.map((d) => d.idDetalle) },
        },
        data: { listoParaRecoger: true },
      });
    }

    const lineasListas = pedido.detalles.filter((d) => aplicaLlamada(d));
    const { platos: platosListos, entradas: entradasListos } =
      conteoLlamaMesero(lineasListas);

    if (platosListos + entradasListos === 0) {
      throw new BadRequestException(
        'No hay platos de cocina pendientes de recoger en este pedido',
      );
    }

    const mesero = pedido.usuario;
    this.emit(idPedido, pedido.idMesa, pedido.idUsuario);
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
    });
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

  /** @deprecated use marcarDetalleRecogido / marcarListoParaRecoger */
  async marcarDetalleCocina(idDetalle: number, dto: PatchDetalleCocinaDto) {
    return this.marcarDetalleRecogido(idDetalle, dto);
  }

  async pedidoActivoPorMesa(idMesa: number) {
    const previo = await this.prisma.pedido.findFirst({
      where: {
        idMesa,
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

  /** Todos los pedidos abiertos/en cocina de una mesa (p. ej. mostrador / para llevar). */
  async pedidosActivosPorMesa(idMesa: number) {
    const rows = await this.prisma.pedido.findMany({
      where: {
        idMesa,
        estado: { in: ABIERTOS },
      },
      orderBy: { creadoEn: 'asc' },
      take: OPERATIVE_PEDIDOS_MAX,
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

  /**
   * Repara platos partidos por precio (mixto/cuota) que quedaron pendientes
   * al salir del cobro o al revertir una tanda. Idempotente.
   */
  private async consolidarFragmentosPrecioPendientesPedido(
    idPedido: number,
  ): Promise<boolean> {
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
    if (detalles.length === 0) return false;

    const plan = planConsolidarFragmentosPrecioPendientes(
      detalles.map((d) => ({
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
      })),
    );
    if (plan.length === 0) return false;

    await this.prisma.$transaction(async (tx) => {
      for (const m of plan) {
        if (m.deleteIds.length > 0) {
          // Empaques hijos de filas eliminadas pasan al ítem conservado.
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

  async obtenerPorId(idPedido: number) {
    return this.obtenerPorIdCore(idPedido, false);
  }

  /** Lectura liviana para polling (menú, chips, cocina) sin facturas ni consolidación de precios. */
  async obtenerPorIdVistaOperativa(idPedido: number) {
    const p = await this.prisma.pedido.findUnique({
      where: { idPedido },
      include: {
        ...pedidoVistaOperativaInclude,
        facturas: { select: { idFactura: true } },
      },
    });
    if (!p) {
      throw new NotFoundException('Pedido no encontrado');
    }
    return {
      ...serializarPedidoVistaOperativa(p),
      facturas: p.facturas.map((f) => ({ id_factura: f.idFactura })),
    };
  }

  /** Tras cobros, reversiones o ediciones que pueden dejar fragmentos de precio. */
  async obtenerPorIdTrasEscritura(idPedido: number) {
    const reparo = await this.consolidarFragmentosPrecioPendientesPedido(idPedido);
    return this.obtenerPorIdCore(idPedido, reparo);
  }

  private async obtenerPorIdCore(idPedido: number, reparo: boolean) {
    let p = await this.prisma.pedido.findUnique({
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
      throw new NotFoundException('Pedido no encontrado');
    }

    if (reparo) {
      this.emit(idPedido, p.idMesa, p.idUsuario);
    }

    const op = await this.ctxOperativa();
    const ctxMazorca = p.detalles.map((d) => ({
      es_bebida: categoriaEsBebida(d.producto.categoria),
      es_acompanamiento_mazorca: d.producto.esAcompanamientoMazorca,
      es_empacable: d.producto.esEmpacable,
      categoria_nombre: d.producto.categoria.nombre,
      listo_para_recoger: d.listoParaRecoger,
      id_detalle_padre: d.idDetallePadre,
    }));
    const debeMz = pedidoDebeTenerLineaMazorca(
      p.mesa.numero,
      ctxMazorca,
      op.mazorcaActiva,
    );
    const tieneMz = p.detalles.some((d) =>
      esDetalleMazorcaAcompanamiento(d.producto),
    );
    if (tieneMz && !debeMz) {
      await this.prisma.$transaction(async (tx) => {
        await sincronizarLineaMazorcaAcompanamiento(tx, {
          idPedido,
          numComensales: p!.numComensales,
          mesaNumero: p!.mesa.numero,
          estadoPedido: p!.estado,
          usaLineaMazorca: false,
          idProductoMazorca: op.idProductoMazorca,
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
        throw new NotFoundException('Pedido no encontrado');
      }
    }

    const serialized = this.serializarPedido(p);
    const historialCuotas = await this.prisma.pedidoHistorial.findMany({
      where: { idPedido },
      select: { tipo: true, detalleJson: true },
    });
    const cuotas_plan_omitidas = listarCuotasPlanOmitidas(
      serialized.detalles,
      historialCuotas.map((h) => ({
        tipo: h.tipo,
        detalle: h.detalleJson,
      })),
    );
    const configRow = await this.obtenerConfigDescuentosRow();
    const config = this.mapConfigDescuentos(configRow);
    const saldoPendienteRow = p.detalles.find(
      (d) =>
        d.idFactura == null && esNotaSaldoRestantePendiente(d.notaCocina),
    );
    const poolSaldo = saldoPendienteRow
      ? parseSaldoRestantePool(saldoPendienteRow.notaCocina)
      : null;
    const idsPoolSaldo =
      poolSaldo != null ? new Set(poolSaldo.map((x) => x.id_detalle)) : null;
    const pendientesComida = p.detalles.filter((d) => {
      if (d.idFactura != null) return false;
      if (esNotaSaldoRestantePendiente(d.notaCocina)) return true;
      if ((d.notaCocina ?? '').trim().startsWith(SALDO_ABONO_NOTA)) return false;
      if (d.producto.esCuotaPendienteReparto) return false;
      if (parseCuotaPendienteNota(d.notaCocina) != null) return false;
      if (d.producto.esAcompanamientoMazorca) return false;
      if (Math.round(Number(d.precioUnitario)) * d.cantidad <= 0) return false;
      // Platos absorbidos por saldo pendiente no cuentan como cobrables aparte.
      if (saldoPendienteRow) {
        if (idsPoolSaldo == null) return false;
        if (idsPoolSaldo.has(d.idDetalle)) return false;
      }
      return true;
    });
    const base = {
      ...serialized,
      cuotas_plan_omitidas,
      cobro_pendiente: {
        items: pendientesComida.length,
        subtotal: pendientesComida.reduce(
          (s, d) => s + Number(d.precioUnitario) * d.cantidad,
          0,
        ),
      },
    };
    if (pendientesComida.length > 0) {
      const lineas = this.lineasParaDescuento(
        pendientesComida.filter(
          (d) => !esNotaSaldoRestantePendiente(d.notaCocina),
        ),
      );
      const descPlatos =
        lineas.length > 0
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

  async setClienteMulero(idPedido: number, clienteMulero: boolean) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { idPedido },
      include: { facturas: facturasInclude },
    });
    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }
    if (pedido.estado === 'facturado') {
      throw new ConflictException('El pedido ya fue facturado');
    }
    if (!ABIERTOS.includes(pedido.estado)) {
      throw new ConflictException('El pedido no admite cambios');
    }
    await this.prisma.pedido.update({
      where: { idPedido },
      data: {
        clienteMulero,
        etiquetasPromocion: clienteMulero
          ? [ETIQUETA_LEGACY_MULERO]
          : [],
      },
    });
    this.emit(idPedido, pedido.idMesa, pedido.idUsuario);
    return this.obtenerPorIdTrasEscritura(idPedido);
  }

  async setEtiquetasPromocion(
    idPedido: number,
    dto: PatchEtiquetasPromocionDto,
  ) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { idPedido },
      include: { facturas: facturasInclude },
    });
    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }
    if (pedido.estado === 'facturado') {
      throw new ConflictException('El pedido ya fue facturado');
    }
    if (!ABIERTOS.includes(pedido.estado)) {
      throw new ConflictException('El pedido no admite cambios');
    }
    const etiquetas = [...new Set(dto.etiquetas_promocion.map((x) => x.trim()).filter(Boolean))];
    const clienteMulero =
      dto.cliente_mulero ??
      etiquetas.includes(ETIQUETA_LEGACY_MULERO);
    await this.prisma.pedido.update({
      where: { idPedido },
      data: { etiquetasPromocion: etiquetas, clienteMulero },
    });
    this.emit(idPedido, pedido.idMesa, pedido.idUsuario);
    return this.obtenerPorIdTrasEscritura(idPedido);
  }

  async actualizarComensalesPedido(
    idPedido: number,
    dto: PatchMazorcasPedidoDto,
  ) {
    if (dto.num_comensales == null) {
      throw new BadRequestException('Indica num_comensales');
    }
    const pedido = await this.prisma.pedido.findUnique({
      where: { idPedido },
      include: { mesa: { select: { numero: true } } },
    });
    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }
    if (!ABIERTOS.includes(pedido.estado)) {
      throw new ConflictException('El pedido no admite cambios');
    }

    const op = await this.ctxOperativa();

    await this.prisma.$transaction(async (tx) => {
      await tx.pedido.update({
        where: { idPedido },
        data: { numComensales: dto.num_comensales! },
      });
      await sincronizarLineaMazorcaAcompanamiento(tx, {
        idPedido,
        numComensales: dto.num_comensales!,
        mesaNumero: pedido.mesa.numero,
        estadoPedido: pedido.estado,
        idProductoMazorca: op.idProductoMazorca,
        usaLineaMazorca: pedidoUsaLineaMazorca(
          pedido.mesa.numero,
          op.mazorcaActiva,
        ),
      });
    });
    this.emit(idPedido, pedido.idMesa, pedido.idUsuario);
    return this.obtenerPorIdTrasEscritura(idPedido);
  }

  async agregarDetalle(
    idPedido: number,
    dto: AddDetalleDto,
    actor: { idUsuario: number; rol: { nombre: string } },
  ) {
    await this.exigirPermisoMesero(actor, 'agregar_items');
    const idUsuario = actor.idUsuario;
    const pedido = await this.prisma.pedido.findUnique({
      where: { idPedido },
    });
    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }
    if (!ABIERTOS.includes(pedido.estado)) {
      throw new ConflictException('El pedido no admite más ítems');
    }

    const producto = await this.prisma.producto.findUnique({
      where: { idProducto: dto.id_producto },
      include: { categoria: true },
    });
    if (!producto?.activo) {
      throw new BadRequestException('Producto no disponible');
    }
    if (producto.esAcompanamientoMazorca) {
      throw new BadRequestException(
        'Las mazorcas de acompañamiento se ajustan con el número de comensales',
      );
    }
    const dia = weekdayBogota();
    if (!categoriaDisponibleEnDia(producto.categoria, dia)) {
      throw new BadRequestException(
        'Este producto no está disponible en el menú de hoy',
      );
    }

    const opcionIds = Array.isArray(dto.opcion_ids) ? dto.opcion_ids : [];
    if (opcionIds.length) {
      const opts = await this.prisma.personalizacionOpcion.findMany({
        where: {
          idProducto: dto.id_producto,
          idOpcion: { in: opcionIds },
        },
      });
      if (opts.length !== opcionIds.length) {
        throw new BadRequestException(
          'Alguna opción de personalización no pertenece al producto',
        );
      }
    }

    const opcionIdsOrdenados = [...opcionIds].sort((a, b) => a - b);
    const candidatosFusion = await this.prisma.detallePedido.findMany({
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
      return (
        ids.length === opcionIdsOrdenados.length &&
        ids.every((id, i) => id === opcionIdsOrdenados[i])
      );
    });
    if (fusion) {
      const sinEmpaqueFusion = dto.sin_empaque_auto === true;
      const debeAutoEmpaqueFusion =
        pedido.modoServicio === 'para_llevar' &&
        productoCobraEmpaqueParaLlevarPorPlatoFuerte({
          esPlatoPrincipal: producto.esPlatoPrincipal,
          esEmpacable: producto.esEmpacable,
          categoria: producto.categoria,
        }) &&
        !sinEmpaqueFusion;
      if (debeAutoEmpaqueFusion) {
        const opFusion = await this.ctxOperativa();
        await this.prisma.$transaction(async (tx) => {
          await this.asegurarEmpaqueAutoParaDetallePadreTx(
            tx,
            fusion.idDetalle,
            opFusion.precioEmpaque,
            idUsuario,
          );
        });
      }
      return this.actualizarCantidadDetalle(
        fusion.idDetalle,
        { cantidad: fusion.cantidad + dto.cantidad },
        actor,
      );
    }

    const sinEmpaque = dto.sin_empaque_auto === true;
    const debeAutoEmpaque =
      pedido.modoServicio === 'para_llevar' &&
      productoCobraEmpaqueParaLlevarPorPlatoFuerte({
        esPlatoPrincipal: producto.esPlatoPrincipal,
        esEmpacable: producto.esEmpacable,
        categoria: producto.categoria,
      }) &&
      !sinEmpaque;

    const lineasAgregadas: {
      id_detalle: number;
      nombre_producto: string;
      cantidad: number;
    }[] = [];

    const op = await this.ctxOperativa();

    await this.prisma.$transaction(async (tx) => {
      await descontarStockBebidaTx(tx, producto, dto.cantidad);
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
          throw new BadRequestException(
            'No hay producto empacable configurado en el catálogo',
          );
        }
        const e = await tx.detallePedido.create({
          data: {
            idPedido,
            idProducto: emp.idProducto,
            cantidad: dto.cantidad,
            precioUnitario: precioEmpaqueParaLlevarDecimal(op.precioEmpaque),
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

      if (debeMarcarCocina(producto.categoria, producto.esEmpacable)) {
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
            es_bebida: categoriaEsBebida(d.producto.categoria),
            es_acompanamiento_mazorca: d.producto.esAcompanamientoMazorca,
            es_empacable: d.producto.esEmpacable,
            categoria_nombre: d.producto.categoria.nombre,
            listo_para_recoger: d.listoParaRecoger,
            id_detalle_padre: d.idDetallePadre,
          }));
          await sincronizarLineaMazorcaAcompanamiento(tx, {
            idPedido,
            numComensales: pedido.numComensales,
            mesaNumero: mesa.numero,
            estadoPedido: pedido.estado,
            idProductoMazorca: op.idProductoMazorca,
            usaLineaMazorca: pedidoDebeTenerLineaMazorca(
              mesa.numero,
              ctx,
              op.mazorcaActiva,
            ),
          });
        }
      }
    });

    await this.notificarCompaneroModificoPedido(
      pedido,
      idUsuario,
      lineasAgregadas,
      'agregado',
    );

    this.emit(idPedido, pedido.idMesa, pedido.idUsuario);
    return this.obtenerPorIdTrasEscritura(idPedido);
  }

  async eliminarDetalle(
    idDetalle: number,
    actor: { idUsuario: number; rol: { nombre: string } },
  ) {
    const idUsuario = actor.idUsuario;
    const det = await this.prisma.detallePedido.findUnique({
      where: { idDetalle },
      include: { pedido: true, producto: { include: { categoria: true } } },
    });
    if (!det) {
      throw new NotFoundException('Línea no encontrada');
    }
    const permisoQuitar =
      det.producto.esEmpacable && det.idDetallePadre != null
        ? 'editar_cantidades'
        : 'quitar_lineas';
    await this.exigirPermisoMesero(actor, permisoQuitar);
    if (!ABIERTOS.includes(det.pedido.estado)) {
      throw new ConflictException('El pedido no admite cambios en las líneas');
    }
    if (esDetalleMazorcaAcompanamiento(det.producto)) {
      throw new BadRequestException(
        'La línea de mazorca se ajusta con el número de comensales',
      );
    }
    const mesaId = det.pedido.idMesa;
    const pedidoId = det.pedido.idPedido;
    const hijos =
      det.idDetallePadre == null
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
      await reintegrarStockBebidaTx(tx, det.producto, det.cantidad);
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
    await this.notificarCompaneroModificoPedido(
      det.pedido,
      idUsuario,
      [{ nombre_producto: det.producto.nombre, cantidad: det.cantidad }],
      'quitado',
    );
    this.emit(pedidoId, mesaId, det.pedido.idUsuario);
    return this.obtenerPorIdTrasEscritura(pedidoId);
  }

  async actualizarCantidadDetalle(
    idDetalle: number,
    dto: PatchDetalleCantidadDto,
    actor: { idUsuario: number; rol: { nombre: string } },
  ) {
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
      throw new NotFoundException('Línea no encontrada');
    }
    if (!ABIERTOS.includes(det.pedido.estado)) {
      throw new ConflictException('El pedido no admite cambios en las líneas');
    }
    if (esDetalleMazorcaAcompanamiento(det.producto)) {
      throw new BadRequestException(
        'La cantidad de mazorcas se ajusta con el número de comensales',
      );
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
        throw new BadRequestException('Línea de plato padre no encontrada');
      }
      if (cantidad > padre.cantidad) {
        throw new BadRequestException(
          `El empaque no puede superar la cantidad del plato (${padre.cantidad})`,
        );
      }
      if (cantidad < 1) {
        throw new BadRequestException(
          'Usa quitar línea para eliminar el empaque por completo',
        );
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
      this.emit(det.pedido.idPedido, det.pedido.idMesa, det.pedido.idUsuario);
      return this.obtenerPorIdTrasEscritura(det.pedido.idPedido);
    }

    const marcarCocina = debeMarcarCocina(
      det.producto.categoria,
      det.producto.esEmpacable,
    );
    if (cantidad > det.cantidad && det.enviadoCocina && marcarCocina) {
      const delta = cantidad - det.cantidad;
      const hijosEmpaque = await this.prisma.detallePedido.findMany({
        where: { idDetallePadre: idDetalle },
      });
      const personalizaciones = await this.prisma.detPersonalizacion.findMany({
        where: { idDetalle },
      });
      await this.prisma.$transaction(async (tx) => {
        await descontarStockBebidaTx(tx, det.producto, delta);
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
      this.emit(det.pedido.idPedido, det.pedido.idMesa, det.pedido.idUsuario);
      return this.obtenerPorIdTrasEscritura(det.pedido.idPedido);
    }
    if (cantidad > det.cantidad) {
      await this.notificarCompaneroModificoPedido(det.pedido, idUsuario, [
        {
          nombre_producto: det.producto.nombre,
          cantidad: cantidad - det.cantidad,
        },
      ], 'agregado');
    } else if (cantidad < det.cantidad) {
      await this.notificarCompaneroModificoPedido(det.pedido, idUsuario, [
        {
          nombre_producto: det.producto.nombre,
          cantidad: det.cantidad - cantidad,
        },
      ], 'reducido');
    }
    const hijosPre =
      det.idDetallePadre == null
        ? await this.prisma.detallePedido.findMany({
            where: { idDetallePadre: idDetalle },
          })
        : [];
    await this.prisma.$transaction(async (tx) => {
      await ajustarStockBebidaTx(
        tx,
        det.producto,
        cantidad - det.cantidad,
      );
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
            ? nuevaCantidadEmpaqueTrasCambioPadre(
                h.cantidad,
                det.cantidad,
                cantidad,
              )
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
            empaques_vinculados_sincronizados:
              det.idDetallePadre == null && hijosPre.length > 0,
          },
        },
      });
    });
    this.emit(det.pedido.idPedido, det.pedido.idMesa, det.pedido.idUsuario);
    return this.obtenerPorIdTrasEscritura(det.pedido.idPedido);
  }

  private async asegurarEmpaqueAutoParaDetallePadreTx(
    tx: Prisma.TransactionClient,
    idDetallePadre: number,
    precioEmpaque: number,
    idUsuario: number,
  ): Promise<{ creado: boolean; id_detalle_empaque?: number }> {
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
      throw new BadRequestException('Solo aplica a líneas de plato');
    }
    if (
      !productoCobraEmpaqueParaLlevarPorPlatoFuerte({
        esPlatoPrincipal: padre.producto.esPlatoPrincipal,
        esEmpacable: padre.producto.esEmpacable,
        categoria: padre.producto.categoria,
      })
    ) {
      throw new BadRequestException('Este ítem no lleva empaque automático');
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
      throw new BadRequestException(
        'No hay producto empacable configurado en el catálogo',
      );
    }
    const e = await tx.detallePedido.create({
      data: {
        idPedido: padre.idPedido,
        idProducto: emp.idProducto,
        cantidad: padre.cantidad,
        precioUnitario: precioEmpaqueParaLlevarDecimal(precioEmpaque),
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

  async agregarEmpaqueAutoDetalle(
    idDetalle: number,
    actor?: { idUsuario: number; rol: { nombre: string } },
  ) {
    await this.exigirPermisoMesero(actor, 'editar_cantidades');
    const idUsuario = actor?.idUsuario ?? 0;
    const det = await this.prisma.detallePedido.findUnique({
      where: { idDetalle },
      include: { pedido: true },
    });
    if (!det) {
      throw new NotFoundException('Detalle no encontrado');
    }
    const op = await this.ctxOperativa();
    let creado = false;
    await this.prisma.$transaction(async (tx) => {
      const r = await this.asegurarEmpaqueAutoParaDetallePadreTx(
        tx,
        idDetalle,
        op.precioEmpaque,
        idUsuario,
      );
      creado = r.creado;
    });
    this.emit(det.pedido.idPedido, det.pedido.idMesa, det.pedido.idUsuario);
    return {
      ok: true,
      creado,
      pedido: await this.obtenerPorIdTrasEscritura(det.pedido.idPedido),
    };
  }

  async sincronizarEmpaquesParaLlevar(
    idPedido: number,
    actor?: { idUsuario: number; rol: { nombre: string } },
  ) {
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
      throw new NotFoundException('Pedido no encontrado');
    }
    if (pedido.modoServicio !== 'para_llevar') {
      throw new BadRequestException('Solo aplica a pedidos para llevar');
    }
    const op = await this.ctxOperativa();
    let empaquesCreados = 0;
    let unidadesAgregadas = 0;
    const detallesResumen: DetalleEmpaqueResumen[] = pedido.detalles.map((d) => ({
      id_detalle: d.idDetalle,
      id_detalle_padre: d.idDetallePadre,
      cantidad: d.cantidad,
      es_empacable: d.producto.esEmpacable,
      es_plato_principal: d.producto.esPlatoPrincipal,
      categoria: d.producto.categoria,
    }));
    await this.prisma.$transaction(async (tx) => {
      for (const p of pedido.detalles) {
        if (p.idDetallePadre != null) continue;
        if (
          !productoCobraEmpaqueParaLlevarPorPlatoFuerte({
            esPlatoPrincipal: p.producto.esPlatoPrincipal,
            esEmpacable: p.producto.esEmpacable,
            categoria: p.producto.categoria,
          })
        ) {
          continue;
        }
        const faltante = empaqueFaltanteEnDetallePadre(
          {
            id_detalle: p.idDetalle,
            id_detalle_padre: p.idDetallePadre,
            cantidad: p.cantidad,
            es_plato_principal: p.producto.esPlatoPrincipal,
            categoria: p.producto.categoria,
          },
          detallesResumen,
        );
        if (faltante <= 0) continue;

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
          const idx = detallesResumen.findIndex(
            (d) => d.id_detalle === empHijo.idDetalle,
          );
          if (idx >= 0) {
            detallesResumen[idx]!.cantidad += faltante;
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
          throw new BadRequestException(
            'No hay producto empacable configurado en el catálogo',
          );
        }
        const e = await tx.detallePedido.create({
          data: {
            idPedido: pedido.idPedido,
            idProducto: emp.idProducto,
            cantidad: faltante,
            precioUnitario: precioEmpaqueParaLlevarDecimal(op.precioEmpaque),
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
    this.emit(pedido.idPedido, pedido.idMesa, pedido.idUsuario);
    return {
      ok: true,
      empaques_creados: empaquesCreados,
      unidades_agregadas: unidadesAgregadas,
      pedido: await this.obtenerPorIdTrasEscritura(idPedido),
    };
  }

  async historialPedido(idPedido: number) {
    const existe = await this.prisma.pedido.findUnique({
      where: { idPedido },
      select: { idPedido: true },
    });
    if (!existe) {
      throw new NotFoundException('Pedido no encontrado');
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

  /**
   * Envía platos pendientes a cocina, imprime comanda (sin bebidas ni precios)
   * y deja bebidas solo para el cobro final.
   */
  async pasarCocina(
    idPedido: number,
    actor?: { idUsuario: number; rol: { nombre: string } },
  ) {
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
      throw new NotFoundException('Pedido no encontrado');
    }
    if (pedido.estado === 'facturado') {
      throw new ConflictException('El pedido ya fue facturado');
    }
    if (!ABIERTOS.includes(pedido.estado)) {
      throw new ConflictException('El pedido no admite envío a cocina');
    }
    if (pedido.detalles.length === 0) {
      throw new BadRequestException('Agrega ítems al pedido antes de enviar a cocina');
    }

    const pendientes = pedido.detalles.filter((d) =>
      debeMarcarCocina(d.producto.categoria, d.producto.esEmpacable) &&
      !d.enviadoCocina,
    );
    if (pendientes.length === 0) {
      throw new BadRequestException(
        'No hay platos nuevos para cocina (las bebidas solo se cobran al final)',
      );
    }

    const esAdicional = pedido.detalles.some(
      (d) =>
        debeMarcarCocina(d.producto.categoria, d.producto.esEmpacable) &&
        d.enviadoCocina,
    );

    const idsPendientes = pendientes.map((d) => d.idDetalle);
    const emitidaEn = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.detallePedido.updateMany({
        where: { idDetalle: { in: idsPendientes } },
        data: { enviadoCocina: true },
      });
      if (pedido.estado === 'abierto') {
        await tx.pedido.update({
          where: { idPedido },
          data: { estado: 'en_cocina' },
        });
      }
    });

    const lineas: ComandaLinea[] = pendientes.map((d) => ({
      id_detalle: d.idDetalle,
      cantidad: d.cantidad,
      nombre_producto: d.producto.nombre,
      nota_cocina: d.notaCocina,
      personalizaciones: d.personalizaciones.map((dp) => dp.opcion.descripcion),
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

    this.emit(idPedido, pedido.idMesa, pedido.idUsuario);
    const impresion = this.comandaPrinter.isEnabled()
      ? this.encolarImpresionComanda(comanda, idPedido)
      : { impreso: false, omitido: true };

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

  /** Reimprime comanda de cocina (platos ya enviados, sin bebidas ni precios). */
  async reimprimirComanda(
    idPedido: number,
    actor?: { idUsuario: number; rol: { nombre: string } },
  ) {
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
      throw new NotFoundException('Pedido no encontrado');
    }

    const enviados = pedido.detalles.filter(
      (d) =>
        debeMarcarCocina(d.producto.categoria, d.producto.esEmpacable) &&
        d.enviadoCocina,
    );
    if (enviados.length === 0) {
      throw new BadRequestException(
        'No hay platos enviados a cocina para reimprimir',
      );
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

  /**
   * Envía el recibo/factura por correo (requiere SMTP e internet en el PC del API).
   * No es factura electrónica DIAN; es el mismo comprobante del restaurante.
   */
  async enviarFacturaCorreo(
    idPedido: number,
    idFactura: number | undefined,
    email: string,
    actor: { idUsuario: number; rol: { nombre: string } },
  ) {
    await this.exigirPermisoMesero(actor, 'cobrar');
    const completo = await this.obtenerPorIdTrasEscritura(idPedido);
    const facturas = completo.facturas ?? [];
    if (facturas.length === 0) {
      throw new ConflictException(
        'Este pedido no tiene facturas; no se puede enviar por correo',
      );
    }
    const target =
      idFactura != null
        ? facturas.find((f) => f.id_factura === idFactura)
        : facturas[facturas.length - 1];
    if (!target) {
      throw new NotFoundException('Factura no encontrada en este pedido');
    }
    const ticket = this.construirTicketFactura(
      completo,
      target.id_factura,
      false,
    );
    const envio = await this.facturaEmail.enviarFactura(ticket, email);
    if (!envio.enviado) {
      throw new BadRequestException(
        envio.error ?? 'No se pudo enviar el correo',
      );
    }
    return {
      ok: true,
      id_pedido: idPedido,
      id_factura: target.id_factura,
      email: envio.email,
      mensaje: `Factura enviada a ${envio.email}`,
    };
  }

  /** Reimprime una factura del pedido (por defecto la última). */
  async reimprimirFactura(
    idPedido: number,
    idFactura: number | undefined,
    actor: { idUsuario: number; rol: { nombre: string } },
  ) {
    await this.exigirPermisoMesero(actor, 'reimprimir_factura');
    const completo = await this.obtenerPorIdTrasEscritura(idPedido);
    const facturas = completo.facturas ?? [];
    if (facturas.length === 0) {
      throw new ConflictException('Este pedido no tiene facturas; no se puede reimprimir');
    }
    const target =
      idFactura != null
        ? facturas.find((f) => f.id_factura === idFactura)
        : facturas[facturas.length - 1];
    if (!target) {
      throw new NotFoundException('Factura no encontrada en este pedido');
    }
    const ticket = this.construirTicketFactura(
      completo,
      target.id_factura,
      true,
    );
    const impresion = await this.comandaPrinter.imprimirFactura(ticket);
    this.emitirAlertaImpresora(impresion, 'factura', idPedido);
    return {
      ok: true,
      id_pedido: idPedido,
      id_factura: target.id_factura,
      impresion_factura: impresion,
    };
  }

  /** Reimprime el total consolidado del pedido (todos los ítems y cobros). */
  async reimprimirPedidoTotal(idPedido: number) {
    const completo = await this.obtenerPorIdTrasEscritura(idPedido);
    if (completo.estado !== 'facturado') {
      throw new BadRequestException(
        'El pedido aún no está pagado por completo',
      );
    }
    const facturas = completo.facturas ?? [];
    if (facturas.length === 0) {
      throw new ConflictException('Este pedido no tiene facturas');
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

  /** Imprime pre-cuenta (sin registrar cobro). */
  async imprimirPrecuenta(
    idPedido: number,
    dto: ImprimirPrecuentaDto,
    actor: { idUsuario: number; rol: { nombre: string } },
  ) {
    await this.exigirPermisoMesero(actor, 'precuenta');
    const pedido = await this.prisma.pedido.findUnique({
      where: { idPedido },
      include: {
        detalles: { include: detalleInclude, orderBy: { idDetalle: 'asc' } },
      },
    });
    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }
    if (pedido.estado === 'facturado') {
      throw new ConflictException('Este pedido ya fue facturado');
    }
    if (!ABIERTOS.includes(pedido.estado)) {
      throw new ConflictException('El pedido no admite pre-cuenta');
    }
    if (pedido.detalles.length === 0) {
      throw new BadRequestException('No hay ítems en el pedido');
    }

    const detallesSerial = this.serialDetallesCobro(pedido.detalles);
    const solicitudes = this.prepararSolicitudesCobro(pedido, dto);

    const detallesCobro = pedido.detalles.filter((d) =>
      solicitudes.some((s) => s.id_detalle === d.idDetalle),
    );

    const subtotalNum = subtotalDesdeSolicitudes(
      pedido.detalles.map((d) => ({
        id_detalle: d.idDetalle,
        precio_unitario: Number(d.precioUnitario),
        cantidad: d.cantidad,
      })),
      solicitudes,
    );
    const subtotal = new Prisma.Decimal(subtotalNum);

    const configRow = await this.obtenerConfigDescuentosRow();
    const config = this.mapConfigDescuentos(configRow);
    const lineas = lineasDescuentoDesdeSolicitudes(
      detallesCobro.map((d) => ({
        id_detalle: d.idDetalle,
        cantidad: d.cantidad,
        precio_unitario: Number(d.precioUnitario),
        nombre_producto: d.producto.nombre,
        categoria_nombre: d.producto.categoria.nombre,
        id_categoria: d.producto.categoria.idCategoria,
        es_plato_principal: d.producto.esPlatoPrincipal,
        participa_descuento_sopas: d.producto.categoria.participaDescuentoSopas,
      })),
      solicitudes,
    );
    const descuentos = this.descuentosDesdeConfig(
      lineas,
      config,
      pedido,
    );
    const descTotal = new Prisma.Decimal(descuentos.descuento_sopas)
      .add(descuentos.descuento_muleros)
      .add(descuentos.descuento_promociones);
    if (descTotal.gt(subtotal)) {
      throw new BadRequestException(
        'La suma de descuentos no puede superar el subtotal de esta cuenta',
      );
    }
    const total = subtotal.sub(descTotal);

    const completo = await this.obtenerPorIdTrasEscritura(idPedido);
    const esTandaParcial = quedaPendienteTrasCobro(detallesSerial, solicitudes);
    const ticket = this.construirTicketPrecuenta(
      completo,
      solicitudes,
      {
        subtotal: Number(subtotal),
        descuento_sopas: descuentos.descuento_sopas,
        descuento_muleros: descuentos.descuento_muleros,
        descuento_promociones: descuentos.descuento_promociones,
        promociones_desglose: descuentos.promociones_desglose,
        total: Number(total),
      },
      esTandaParcial,
    );

    const conCopia = dto.factura_con_copia === true;
    const impresion = await this.imprimirFacturaEnRespuesta(
      ticket,
      idPedido,
      conCopia,
    );

    return {
      ok: true,
      id_pedido: idPedido,
      impresion_precuenta: impresion,
      factura_con_copia: conCopia,
    };
  }

  private construirTicketComanda(
    pedido: {
      idPedido: number;
      numComensales: number;
      modoServicio: 'en_mesa' | 'para_llevar';
      mesa: { numero: number };
      usuario: { nombre: string; apellido: string };
    },
    detalles: Prisma.DetallePedidoGetPayload<{
      include: typeof detalleInclude;
    }>[],
    opts: {
      esReimpresion?: boolean;
      esAdicional?: boolean;
      emitidaEn?: Date;
    } = {},
  ): ComandaTicket {
    const emitidaEn = opts.emitidaEn ?? new Date();
    const esReimpresion = opts.esReimpresion ?? false;
    const esAdicional = opts.esAdicional ?? false;
    const lineas: ComandaLinea[] = lineasComandaParaTicket(
      detalles.map((d) => ({
        id_detalle: d.idDetalle,
        id_producto: d.idProducto,
        id_detalle_padre: d.idDetallePadre,
        nombre_producto: d.producto.nombre,
        categoria_nombre: d.producto.categoria.nombre,
        es_acompanamiento_mazorca: d.producto.esAcompanamientoMazorca,
        es_plato_principal: d.producto.esPlatoPrincipal,
        cantidad: d.cantidad,
        nota_cocina: d.notaCocina,
        personalizaciones: d.personalizaciones.map((dp) => ({
          id_opcion: dp.opcion.idOpcion,
          descripcion: dp.opcion.descripcion,
        })),
      })),
    );
    const mesero = `${pedido.usuario.nombre} ${pedido.usuario.apellido}`.trim();
    return {
      id_pedido: pedido.idPedido,
      mesa_numero: pedido.mesa.numero,
      mesa_etiqueta: etiquetaMesaComanda(pedido.mesa.numero),
      num_comensales: pedido.numComensales,
      mesero,
      modo_servicio: pedido.modoServicio,
      lineas,
      emitida_en: emitidaEn.toISOString(),
      es_reimpresion: esReimpresion || undefined,
      es_adicional: esAdicional || undefined,
    };
  }

  private esDetalleInternoSaldo(d: {
    nota_cocina?: string | null;
    es_cuota_pendiente_reparto?: boolean;
  }): boolean {
    return (
      Boolean(d.es_cuota_pendiente_reparto) ||
      esNotaSaldoRestantePendiente(d.nota_cocina) ||
      (d.nota_cocina ?? '').trim().startsWith(SALDO_ABONO_NOTA)
    );
  }

  /** Líneas del ticket según modo de cobro (sin partes fantasma por persona). */
  private lineasTicketSegunModoCobro(
    completo: Awaited<ReturnType<PedidosService['obtenerPorId']>>,
    factura: {
      id_factura: number;
      plan_personas_sobre_total?: boolean;
      plan_combinado_sobre_seleccion?: boolean;
      plan_seleccion_referencia?: unknown;
    },
    idsGrupo: Set<number>,
    esMixto: boolean,
  ) {
    const detalles = completo.detalles ?? [];
    const facturas = completo.facturas ?? [];
    const lineasCobradas = detalles.filter((d) =>
      idsGrupo.has(d.id_factura ?? -1),
    );
    const reales = detalles.filter(
      (d) => d.id_detalle_padre == null && !this.esDetalleInternoSaldo(d),
    );
    const esCuotaPersonas = factura.plan_personas_sobre_total === true;
    const esCuotaCombinado = factura.plan_combinado_sobre_seleccion === true;

    if (esCuotaPersonas) {
      const idsPreviasNoPlan = new Set(
        facturas
          .filter(
            (f) =>
              f.id_factura < factura.id_factura &&
              f.plan_personas_sobre_total !== true &&
              f.plan_combinado_sobre_seleccion !== true,
          )
          .map((f) => f.id_factura),
      );
      const itemsAlcance =
        idsPreviasNoPlan.size > 0
          ? reales.filter(
              (d) =>
                d.id_factura == null ||
                !idsPreviasNoPlan.has(d.id_factura) ||
                idsGrupo.has(d.id_factura),
            )
          : reales;
      return lineasFacturaParaTicketPedidoTotal(
        itemsAlcance.map((d) => this.lineaFacturaDesdePedidoSerial(d)),
      );
    }

    if (esCuotaCombinado) {
      const huboPagosCombinadoPrevios = facturas.some(
        (f) =>
          f.id_factura < factura.id_factura &&
          f.plan_combinado_sobre_seleccion === true,
      );
      const abonosEnFactura = lineasCobradas.filter((d) =>
        this.esDetalleInternoSaldo(d),
      );
      // Pagos posteriores del mismo plan: solo «Saldo pendiente».
      if (huboPagosCombinadoPrevios && abonosEnFactura.length > 0) {
        const montoAbono = abonosEnFactura.reduce(
          (s, d) => s + d.precio_unitario * d.cantidad,
          0,
        );
        if (montoAbono > 0) {
          return [
            {
              cantidad: 1,
              nombre_producto: NOMBRE_DISPLAY_SALDO_PENDIENTE,
              precio_unitario: montoAbono,
              subtotal_linea: montoAbono,
              personalizaciones: [] as string[],
              nota_cocina: null as string | null,
            },
          ];
        }
      }
      // Primer pago combinado: platos de la selección de referencia.
      const seleccionRef = this.parseSeleccionReferenciaFactura(
        factura.plan_seleccion_referencia as Prisma.JsonValue | null,
      );
      return lineasFacturaParaTicketSeleccionReferencia(
        reales.map((d) => this.lineaFacturaDesdePedidoSerial(d)),
        seleccionRef,
      );
    }

    // Platos / cobro estándar: ítems de la tanda + saldo pendiente si queda.
    const ticket = lineasFacturaParaTicket(
      lineasCobradas
        .filter((d) => !this.esDetalleInternoSaldo(d))
        .map((d) => this.lineaFacturaDesdePedidoSerial(d)),
      { consolidarMixtoPrecio: esMixto },
    );
    const abonosEnTanda = lineasCobradas.filter((d) =>
      this.esDetalleInternoSaldo(d),
    );
    if (abonosEnTanda.length > 0) {
      const monto = abonosEnTanda.reduce(
        (s, d) => s + d.precio_unitario * d.cantidad,
        0,
      );
      ticket.push({
        cantidad: 1,
        nombre_producto: NOMBRE_DISPLAY_SALDO_PENDIENTE,
        precio_unitario: monto,
        subtotal_linea: monto,
        personalizaciones: [],
        nota_cocina: null,
      });
    }
    const saldoPendiente = detalles.find(
      (d) =>
        !d.cobrado &&
        d.id_factura == null &&
        esNotaSaldoRestantePendiente(d.nota_cocina),
    );
    if (saldoPendiente) {
      const monto =
        Math.round(saldoPendiente.precio_unitario) * saldoPendiente.cantidad;
      ticket.push({
        cantidad: 1,
        nombre_producto: NOMBRE_DISPLAY_SALDO_PENDIENTE,
        precio_unitario: monto,
        subtotal_linea: monto,
        personalizaciones: [],
        nota_cocina: saldoPendiente.nota_cocina ?? null,
      });
    }
    // Cobro de saldo pendiente + platos fuera del pool en la misma tanda.
    const platosEnTanda = lineasCobradas.filter(
      (d) => !this.esDetalleInternoSaldo(d),
    );
    if (abonosEnTanda.length > 0 && platosEnTanda.length > 0) {
      // Ya se agregaron platos y abono arriba.
      return ticket;
    }
    return ticket;
  }

  private construirTicketFactura(
    completo: Awaited<ReturnType<PedidosService['obtenerPorId']>>,
    idFactura: number,
    esReimpresion = false,
    detalleExcesoOverride?: ReturnType<typeof calcularDetalleExcesoCobro> | null,
  ): FacturaTicket {
    const facturas = completo.facturas ?? [];
    const factura = facturas.find((f) => f.id_factura === idFactura);
    if (!factura) {
      throw new BadRequestException('Factura no encontrada en el pedido');
    }
    const grupoMixto = agruparFacturasMixto(facturas, factura);
    const esMixto = esGrupoPagoMixto(grupoMixto);
    const facturasTicket = esMixto ? grupoMixto : [factura];
    const idsGrupo = new Set(facturasTicket.map((f) => f.id_factura));
    const meseroStr = completo.mesero
      ? `${completo.mesero.nombre} ${completo.mesero.apellido}`.trim()
      : '';
    const esCuotaPersonas = factura.plan_personas_sobre_total === true;
    const esCuotaCombinado = factura.plan_combinado_sobre_seleccion === true;
    const subtotal = facturasTicket.reduce((s, f) => s + f.subtotal, 0);
    const descuento_sopas = facturasTicket.reduce((s, f) => s + f.descuento_sopas, 0);
    const descuento_muleros = facturasTicket.reduce(
      (s, f) => s + f.descuento_muleros,
      0,
    );
    const descuento_promociones = facturasTicket.reduce(
      (s, f) => s + (f.descuento_promociones ?? 0),
      0,
    );
    const total = facturasTicket.reduce((s, f) => s + f.total, 0);
    const detalleExceso =
      detalleExcesoOverride ??
      facturasTicket
        .map((f) => f.detalle_exceso_cobro)
        .find((d) => d != null) ??
      undefined;
    return {
      id_pedido: completo.id_pedido,
      id_factura: factura.id_factura,
      mesa_numero: completo.mesa_numero,
      mesa_etiqueta: etiquetaMesaComanda(completo.mesa_numero),
      num_comensales: completo.num_comensales,
      mesero: meseroStr,
      modo_servicio: completo.modo_servicio,
      lineas: this.lineasTicketSegunModoCobro(
        completo,
        factura,
        idsGrupo,
        esMixto,
      ),
      subtotal,
      descuento_sopas,
      descuento_muleros,
      descuento_promociones,
      total,
      metodo_pago: esMixto
        ? 'mixto'
        : (factura.metodo_pago as FacturaTicket['metodo_pago']),
      cobros_resumen: esMixto ? cobrosResumenMixto(grupoMixto) : undefined,
      emitida_en: String(factura.emitida_en),
      es_reimpresion: esReimpresion || undefined,
      es_cobro_parcial: factura.es_parcial || undefined,
      es_cuota_personas: esCuotaPersonas || undefined,
      es_cuota_combinado: esCuotaCombinado || undefined,
      es_cobro_combinado:
        !esCuotaPersonas && !esCuotaCombinado && factura.persona_plan_indice != null
          ? true
          : undefined,
      detalle_exceso_cobro: detalleExceso ?? undefined,
    };
  }

  private construirTicketPedidoTotal(
    completo: Awaited<ReturnType<PedidosService['obtenerPorId']>>,
    esReimpresion = false,
  ): FacturaTicket {
    const facturas = completo.facturas ?? [];
    const meseroStr = completo.mesero
      ? `${completo.mesero.nombre} ${completo.mesero.apellido}`.trim()
      : '';
    const lineasPedido = completo.detalles.map((d) =>
      this.lineaFacturaDesdePedidoSerial(d),
    );
    const resumenCobros = resumenCobrosPedidoTotal(facturas);
    const ultima = facturas[facturas.length - 1];
    return {
      id_pedido: completo.id_pedido,
      mesa_numero: completo.mesa_numero,
      mesa_etiqueta: etiquetaMesaComanda(completo.mesa_numero),
      num_comensales: completo.num_comensales,
      mesero: meseroStr,
      modo_servicio: completo.modo_servicio,
      lineas: lineasFacturaParaTicketPedidoTotal(lineasPedido),
      subtotal: facturas.reduce((s, f) => s + f.subtotal, 0),
      descuento_sopas: facturas.reduce((s, f) => s + f.descuento_sopas, 0),
      descuento_muleros: facturas.reduce((s, f) => s + f.descuento_muleros, 0),
      descuento_promociones: facturas.reduce(
        (s, f) => s + (f.descuento_promociones ?? 0),
        0,
      ),
      total: facturas.reduce((s, f) => s + f.total, 0),
      metodo_pago: resumenCobros.metodo_pago as FacturaTicket['metodo_pago'],
      emitida_en: String(ultima.emitida_en),
      es_reimpresion: esReimpresion || undefined,
      es_total_pedido: true,
      cobros_resumen:
        resumenCobros.cobros_resumen && resumenCobros.cobros_resumen.length > 0
          ? resumenCobros.cobros_resumen
          : undefined,
    };
  }

  private construirTicketPrecuenta(
    completo: Awaited<ReturnType<PedidosService['obtenerPorId']>>,
    solicitudes: DetalleCobroCantidad[],
    totals: {
      subtotal: number;
      descuento_sopas: number;
      descuento_muleros: number;
      descuento_promociones: number;
      promociones_desglose?: { etiqueta: string; monto: number }[];
      total: number;
    },
    esTandaParcial: boolean,
  ): FacturaTicket {
    const meseroStr = completo.mesero
      ? `${completo.mesero.nombre} ${completo.mesero.apellido}`.trim()
      : '';
    const qty = new Map(solicitudes.map((s) => [s.id_detalle, s.cantidad]));
    const lineas = completo.detalles
      .filter((d) => qty.has(d.id_detalle))
      .map((d) =>
        this.lineaFacturaDesdePedidoSerial(d, qty.get(d.id_detalle)!),
      );
    return {
      id_pedido: completo.id_pedido,
      mesa_numero: completo.mesa_numero,
      mesa_etiqueta: etiquetaMesaComanda(completo.mesa_numero),
      num_comensales: completo.num_comensales,
      mesero: meseroStr,
      modo_servicio: completo.modo_servicio,
      lineas: lineasFacturaParaTicket(lineas),
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

  private serialDetallesCobro(
    detalles: {
      idDetalle: number;
      idDetallePadre: number | null;
      idFactura: number | null;
      cantidad: number;
      producto?: { esAcompanamientoMazorca: boolean };
    }[],
  ): DetalleSerialCobro[] {
    return detalles
      .filter((d) => !d.producto?.esAcompanamientoMazorca)
      .map((d) => ({
        id_detalle: d.idDetalle,
        id_detalle_padre: d.idDetallePadre,
        cobrado: d.idFactura != null,
        cantidad: d.cantidad,
      }));
  }

  private static readonly COMBINADO_NOTA_PREFIX = 'combinado:';
  private static readonly MIXTO_NOTA_PREFIX = 'mixto:';

  private combinadoNota(origId: number, personaIdx: number): string {
    return `${PedidosService.COMBINADO_NOTA_PREFIX}${origId}:${personaIdx}`;
  }

  private parseCombinadoNota(
    nota: string | null | undefined,
  ): { origId: number; personaIdx: number } | null {
    if (!nota?.startsWith(PedidosService.COMBINADO_NOTA_PREFIX)) return null;
    const rest = nota.slice(PedidosService.COMBINADO_NOTA_PREFIX.length);
    const [orig, idx] = rest.split(':');
    const origId = Number(orig);
    const personaIdx = Number(idx);
    if (!Number.isFinite(origId) || !Number.isFinite(personaIdx)) return null;
    return { origId, personaIdx };
  }

  private findCombinadoSlices(
    detalles: { idDetalle: number; notaCocina: string | null }[],
    origId: number,
  ): { personaIdx: number; idDetalle: number }[] {
    return detalles
      .map((d) => {
        const p = this.parseCombinadoNota(d.notaCocina);
        if (!p || p.origId !== origId) return null;
        return { personaIdx: p.personaIdx, idDetalle: d.idDetalle };
      })
      .filter((x): x is { personaIdx: number; idDetalle: number } => x != null)
      .sort((a, b) => a.personaIdx - b.personaIdx);
  }

  private async ensureCombinadoSlicesEnTx(
    tx: Prisma.TransactionClient,
    det: Prisma.DetallePedidoGetPayload<{ include: typeof detalleInclude }>,
    totalPersonasPlan: number,
  ): Promise<{ personaIdx: number; idDetalle: number }[]> {
    const origId = this.parseCombinadoNota(det.notaCocina)?.origId ?? det.idDetalle;
    const allDet = await tx.detallePedido.findMany({
      where: { idPedido: det.idPedido },
      include: detalleInclude,
    });
    const slices = this.findCombinadoSlices(allDet, origId);
    if (slices.length >= totalPersonasPlan) {
      return slices;
    }

    const baseDet =
      allDet.find((d) => d.idDetalle === origId && d.idFactura == null) ??
      allDet.find((d) => d.idDetalle === origId);
    if (!baseDet || baseDet.idFactura != null) {
      throw new BadRequestException(
        'El ítem compartido ya fue cobrado o no está disponible',
      );
    }
    if (baseDet.cantidad !== 1) {
      throw new BadRequestException(
        'El reparto combinado por monto solo aplica a ítems de 1 unidad',
      );
    }

    const precios = repartirMontoEnCop(
      Number(baseDet.precioUnitario),
      totalPersonasPlan,
    );
    const notaBase = (baseDet.notaCocina ?? '').trim();
    const notaSlice = (idx: number) => {
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

    const out: { personaIdx: number; idDetalle: number }[] = [
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

  private async resolverSolicitudesCombinadoEnTx(
    tx: Prisma.TransactionClient,
    pedido: {
      idPedido: number;
      detalles: Prisma.DetallePedidoGetPayload<{ include: typeof detalleInclude }>[];
    },
    solicitudes: DetalleCobroCantidad[],
    personaPlanIndice: number,
    totalPersonasPlan: number,
  ): Promise<DetalleCobroCantidad[]> {
    const totalUnidades = solicitudes.reduce((s, x) => s + x.cantidad, 0);
    if (totalUnidades >= totalPersonasPlan) {
      return solicitudes;
    }

    const out: DetalleCobroCantidad[] = [];
    for (const sol of solicitudes) {
      const det = pedido.detalles.find((d) => d.idDetalle === sol.id_detalle);
      if (!det || det.cantidad !== 1 || sol.cantidad !== 1) {
        out.push(sol);
        continue;
      }
      const slices = await this.ensureCombinadoSlicesEnTx(
        tx,
        det,
        totalPersonasPlan,
      );
      const slice = slices.find((s) => s.personaIdx === personaPlanIndice);
      if (!slice) {
        throw new BadRequestException(
          `No se encontró la porción combinada para la persona ${personaPlanIndice}`,
        );
      }
      out.push({ id_detalle: slice.idDetalle, cantidad: 1 });
    }
    return out;
  }

  private solicitudesDesdeCantidadesEnPedido(
    serial: DetalleSerialCobro[],
    cantidades: Record<number, number>,
  ): DetalleCobroCantidad[] {
    const base = Object.entries(cantidades)
      .filter(([, q]) => q > 0)
      .map(([id, cantidad]) => ({
        id_detalle: Number(id),
        cantidad,
      }));
    if (base.length === 0) return [];
    return ordenarSolicitudesCobro(
      serial,
      expandirSolicitudesConEmpaques(serial, base),
    );
  }

  private asignarCantidadesParaCuotaNeta(
    pedido: {
      detalles: Prisma.DetallePedidoGetPayload<{ include: typeof detalleInclude }>[];
      clienteMulero: boolean;
    },
    solicitudes: DetalleCobroCantidad[],
    montoObjetivoNeto: number,
    config: ConfigDescuentoCalc,
  ): Record<number, number> {
    const cantSolicitud = new Map(
      solicitudes.map((s) => [s.id_detalle, s.cantidad]),
    );
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

    if (lineas.length === 0 || montoObjetivoNeto <= 0) return {};

    const serial = this.serialDetallesCobro(pedido.detalles);
    const netoDeCantidades = (cantidades: Record<number, number>) => {
      const sol = this.solicitudesDesdeCantidadesEnPedido(serial, cantidades);
      if (sol.length === 0) return 0;
      return Number(this.calcularImportesFactura(pedido, sol, config).total);
    };

    const brutoPendiente = lineas.reduce(
      (s, l) => s + l.precio_unitario * l.cantidad_pendiente,
      0,
    );
    const totalPendienteNeto = Number(
      this.calcularImportesFactura(pedido, solicitudes, config).total,
    );

    if (totalPendienteNeto > 0 && totalPendienteNeto <= montoObjetivoNeto) {
      const todas: Record<number, number> = {};
      for (const s of solicitudes) {
        todas[s.id_detalle] = s.cantidad;
      }
      return todas;
    }

    let lo = 0;
    let hi = brutoPendiente;
    let best: Record<number, number> = {};

    for (let i = 0; i < 24; i++) {
      const mid = Math.round((lo + hi) / 2);
      if (mid <= 0) break;
      const cantidades = asignarCantidadesParaSubtotal(lineas, mid);
      if (Object.keys(cantidades).length === 0) {
        hi = mid - 1;
        continue;
      }
      const neto = netoDeCantidades(cantidades);
      if (neto <= montoObjetivoNeto) {
        best = cantidades;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    return best;
  }

  private async peelAndSplitBrutoCuotaEnTx(
    tx: Prisma.TransactionClient,
    idDetalle: number,
    brutoCobro: number,
  ): Promise<number> {
    const unitDet = await this.peelOneUnitDetalleEnTx(tx, idDetalle);
    const brutoUnit = Math.round(Number(unitDet.precioUnitario));
    const brutoParaCobro = Math.min(
      brutoUnit,
      Math.max(1, Math.round(brutoCobro)),
    );
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

  /** Modo por personas: cuota sobre el total, sin asignar ítems fijos en el cliente. */
  private async resolverSolicitudesPersonasTotalEnTx(
    tx: Prisma.TransactionClient,
    idPedido: number,
    pedido: {
      detalles: Prisma.DetallePedidoGetPayload<{ include: typeof detalleInclude }>[];
      clienteMulero: boolean;
    },
    solicitudes: DetalleCobroCantidad[],
    personaPlanIndice: number,
    totalPersonasPlan: number,
    montoObjetivoNeto: number | undefined,
    config: ConfigDescuentoCalc,
    poolSeleccion?: DetalleCobroCantidad[],
  ): Promise<DetalleCobroCantidad[]> {
    if (personaPlanIndice >= totalPersonasPlan) {
      return solicitudes;
    }

    const objetivo =
      montoObjetivoNeto ??
      repartirMontoEnCop(
        Number(this.calcularImportesFactura(pedido, solicitudes, config).total),
        totalPersonasPlan,
      )[personaPlanIndice - 1] ??
      0;
    if (objetivo <= 0) {
      throw new BadRequestException('Cuota de persona inválida');
    }

    let pedidoActivo = pedido;
    const solicitudesCuota =
      poolSeleccion != null && poolSeleccion.length > 0
        ? this.solicitudesPendientesEnPool(pedidoActivo, poolSeleccion)
        : solicitudes;
    const baseSolicitudes =
      solicitudesCuota.length > 0 ? solicitudesCuota : solicitudes;

    // Solo ítems enteros: no partir precios (evita N filas fantasma por plato).
    // El total de la factura se fuerza a `objetivo` en facturar/facturarMixto.
    const cantidades = this.asignarCantidadesParaCuotaNeta(
      pedidoActivo,
      baseSolicitudes,
      objetivo,
      config,
    );
    const serial = this.serialDetallesCobro(pedidoActivo.detalles);
    let sol = this.solicitudesDesdeCantidadesEnPedido(serial, cantidades);

    if (sol.length === 0) {
      // Si no calza por cantidad, asigna la unidad pendiente más barata entera.
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
        .filter(
          (x): x is { id_detalle: number; precio: number; cantidad: number } =>
            x != null && x.precio > 0 && x.cantidad > 0,
        )
        .sort((a, b) => a.precio - b.precio)[0];
      if (!candidato) {
        throw new BadRequestException(
          'No se pudo calcular la cuota de esta persona sobre el total',
        );
      }
      sol = [{ id_detalle: candidato.id_detalle, cantidad: 1 }];
    }
    return sol;
  }

  private mixtoPrecioNota(
    origId: number,
    lado: 'efectivo' | 'transferencia',
  ): string {
    return `${PedidosService.MIXTO_NOTA_PREFIX}${origId}:${lado}`;
  }

  private parseMixtoPrecioNota(
    nota: string | null | undefined,
  ): { origId: number; lado: 'efectivo' | 'transferencia' } | null {
    if (!nota?.includes(PedidosService.MIXTO_NOTA_PREFIX)) return null;
    const idx = nota.indexOf(PedidosService.MIXTO_NOTA_PREFIX);
    const tag = nota.slice(idx + PedidosService.MIXTO_NOTA_PREFIX.length);
    const [orig, lado] = tag.split(':');
    if (lado !== 'efectivo' && lado !== 'transferencia') return null;
    const origId = Number(orig);
    if (!Number.isFinite(origId)) return null;
    return { origId, lado };
  }

  private findMixtoPrecioSlices(
    detalles: { idDetalle: number; notaCocina: string | null }[],
    origId: number,
  ): { lado: 'efectivo' | 'transferencia'; idDetalle: number }[] {
    return detalles
      .map((d) => {
        const p = this.parseMixtoPrecioNota(d.notaCocina);
        if (!p || p.origId !== origId) return null;
        return { lado: p.lado, idDetalle: d.idDetalle };
      })
      .filter(
        (x): x is { lado: 'efectivo' | 'transferencia'; idDetalle: number } =>
          x != null,
      );
  }

  private repartirBrutoMixtoEnCop(
    brutoLinea: number,
    netoEfectivo: number,
    totalNeto: number,
  ): [number, number] {
    const bruto = Math.round(brutoLinea);
    if (bruto <= 0 || totalNeto <= 0 || netoEfectivo <= 0) {
      return [0, bruto];
    }
    if (netoEfectivo >= totalNeto) {
      return [bruto, 0];
    }
    let brutoE = Math.round((bruto * netoEfectivo) / totalNeto);
    let brutoT = bruto - brutoE;
    if (
      bruto >= 2 &&
      netoEfectivo > 0 &&
      netoEfectivo < totalNeto &&
      (brutoE <= 0 || brutoT <= 0)
    ) {
      brutoE = Math.max(1, brutoE);
      brutoT = bruto - brutoE;
      if (brutoT <= 0) {
        brutoT = 1;
        brutoE = bruto - 1;
      }
    }
    return [brutoE, brutoT];
  }

  private mergeSolicitudesCobro(
    arr: DetalleCobroCantidad[],
  ): DetalleCobroCantidad[] {
    const m = new Map<number, number>();
    for (const s of arr) {
      m.set(s.id_detalle, (m.get(s.id_detalle) ?? 0) + s.cantidad);
    }
    return [...m.entries()].map(([id_detalle, cantidad]) => ({
      id_detalle,
      cantidad,
    }));
  }

  /** Separa una unidad cobrable en su propia línea (cantidad 1). */
  private async peelOneUnitDetalleEnTx(
    tx: Prisma.TransactionClient,
    idDetalle: number,
  ): Promise<
    Prisma.DetallePedidoGetPayload<{ include: typeof detalleInclude }>
  > {
    const det = await tx.detallePedido.findUnique({
      where: { idDetalle },
      include: detalleInclude,
    });
    if (!det || det.idFactura != null) {
      throw new BadRequestException('Ítem de cobro no disponible');
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

  private async ensureMixtoPrecioSlicesEnTx(
    tx: Prisma.TransactionClient,
    det: Prisma.DetallePedidoGetPayload<{ include: typeof detalleInclude }>,
    brutoEfectivo: number,
    brutoTransferencia: number,
  ): Promise<{ idEfectivo: number; idTransferencia: number }> {
    const origId =
      this.parseMixtoPrecioNota(det.notaCocina)?.origId ??
      this.parseCombinadoNota(det.notaCocina)?.origId ??
      det.idDetalle;
    const allDet = await tx.detallePedido.findMany({
      where: { idPedido: det.idPedido },
      include: detalleInclude,
    });
    const slices = this.findMixtoPrecioSlices(allDet, origId);
    const idE =
      slices.find((s) => s.lado === 'efectivo')?.idDetalle ??
      (this.parseMixtoPrecioNota(det.notaCocina)?.lado === 'efectivo'
        ? det.idDetalle
        : undefined);
    const idT =
      slices.find((s) => s.lado === 'transferencia')?.idDetalle ??
      (this.parseMixtoPrecioNota(det.notaCocina)?.lado === 'transferencia'
        ? det.idDetalle
        : undefined);
    if (idE != null && idT != null) {
      return { idEfectivo: idE, idTransferencia: idT };
    }

    const baseDet =
      allDet.find((d) => d.idDetalle === origId && d.idFactura == null) ??
      allDet.find((d) => d.idDetalle === det.idDetalle && d.idFactura == null) ??
      det;
    if (!baseDet || baseDet.idFactura != null) {
      throw new BadRequestException(
        'El ítem ya fue cobrado o no está disponible para pago mixto',
      );
    }
    if (baseDet.cantidad !== 1) {
      throw new BadRequestException(
        'El pago mixto por monto solo aplica a ítems de 1 unidad indivisible',
      );
    }
    if (brutoEfectivo <= 0 || brutoTransferencia <= 0) {
      throw new BadRequestException(
        'No se pudo repartir el precio del ítem entre efectivo y transferencia',
      );
    }

    const notaBase = (baseDet.notaCocina ?? '').trim();
    const notaConTag = (lado: 'efectivo' | 'transferencia') => {
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

  private async resolverSplitMixtoPrecioEnTx(
    tx: Prisma.TransactionClient,
    pedido: {
      detalles: Prisma.DetallePedidoGetPayload<{ include: typeof detalleInclude }>[];
    },
    solicitudes: DetalleCobroCantidad[],
    reparto: { efectivoFactura: number; transferenciaFactura: number },
    totalNeto: number,
  ): Promise<{
    efectivo: DetalleCobroCantidad[];
    transferencia: DetalleCobroCantidad[];
  }> {
    const solEfectivo: DetalleCobroCantidad[] = [];
    const solTransferencia: DetalleCobroCantidad[] = [];
    const pendientesPrecioCero: DetalleCobroCantidad[] = [];

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

        if (
          brutoLinea === 1 &&
          reparto.efectivoFactura > 0 &&
          reparto.transferenciaFactura > 0
        ) {
          if (reparto.efectivoFactura <= reparto.transferenciaFactura) {
            solTransferencia.push({ id_detalle: unitDet.idDetalle, cantidad: 1 });
          } else {
            solEfectivo.push({ id_detalle: unitDet.idDetalle, cantidad: 1 });
          }
          continue;
        }

        const [brutoE, brutoT] = this.repartirBrutoMixtoEnCop(
          brutoLinea,
          reparto.efectivoFactura,
          totalNeto,
        );
        if (brutoE <= 0 || brutoT <= 0) {
          throw new BadRequestException(
            'No se pudo dividir el cobro mixto entre efectivo y transferencia. Ajusta los montos o divide la cuenta manualmente.',
          );
        }
        const { idEfectivo, idTransferencia } =
          await this.ensureMixtoPrecioSlicesEnTx(tx, unitDet, brutoE, brutoT);
        solEfectivo.push({ id_detalle: idEfectivo, cantidad: 1 });
        solTransferencia.push({ id_detalle: idTransferencia, cantidad: 1 });
      }
    }

    const repartirPrecioCero = (z: DetalleCobroCantidad) => {
      if (solEfectivo.length <= solTransferencia.length) {
        solEfectivo.push(z);
      } else {
        solTransferencia.push(z);
      }
    };
    for (const z of pendientesPrecioCero) {
      if (solEfectivo.length === 0) {
        solEfectivo.push(z);
      } else if (solTransferencia.length === 0) {
        solTransferencia.push(z);
      } else {
        repartirPrecioCero(z);
      }
    }

    const efectivo = this.mergeSolicitudesCobro(solEfectivo);
    const transferencia = this.mergeSolicitudesCobro(solTransferencia);

    if (efectivo.length === 0 || transferencia.length === 0) {
      throw new BadRequestException(
        'No se pudo dividir el cobro mixto entre efectivo y transferencia',
      );
    }
    return { efectivo, transferencia };
  }

  private prepararSolicitudesCobro(
    pedido: {
      detalles: {
        idDetalle: number;
        idDetallePadre: number | null;
        idFactura: number | null;
        cantidad: number;
      }[];
    },
    opts: {
      id_detalles?: number[];
      detalles_cobro?: DetalleCobroDto[];
    },
  ): DetalleCobroCantidad[] {
    const serial = this.serialDetallesCobro(pedido.detalles);
    const pendientes = idsDetallesPendientes(serial);
    if (pendientes.length === 0) {
      throw new ConflictException('No quedan ítems pendientes de cobro');
    }
    const base = resolverSolicitudesCobro(opts, serial, pendientes);
    if (base.length === 0) {
      throw new BadRequestException(
        'Selecciona al menos un ítem pendiente de cobro',
      );
    }
    try {
      return ordenarSolicitudesCobro(
        serial,
        expandirSolicitudesConEmpaques(serial, base),
      );
    } catch (e) {
      throw new BadRequestException(
        e instanceof Error ? e.message : 'Cantidades de cobro inválidas',
      );
    }
  }

  private async aplicarCobroDetalleEnTx(
    tx: Prisma.TransactionClient,
    det: Prisma.DetallePedidoGetPayload<{ include: typeof detalleInclude }>,
    cantidadCobrar: number,
    idFactura: number,
  ) {
    if (cantidadCobrar < 1 || cantidadCobrar > det.cantidad) {
      throw new BadRequestException('Cantidad de cobro inválida');
    }
    if (det.idFactura != null) {
      throw new ConflictException('Algún ítem ya fue cobrado');
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

  async facturar(
    idPedido: number,
    dto: FacturarDto,
    actor: { idUsuario: number; rol: { nombre: string } },
  ) {
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
      throw new NotFoundException('Pedido no encontrado');
    }
    if (pedido.estado === 'facturado') {
      throw new ConflictException('Este pedido ya fue facturado');
    }
    if (!ABIERTOS.includes(pedido.estado)) {
      throw new ConflictException('El pedido no se puede facturar');
    }
    if (pedido.detalles.length === 0) {
      throw new BadRequestException('No hay ítems en el pedido');
    }
    if (dto.metodo_pago === 'credito') {
      const nombre = dto.nombre_cliente_credito?.trim();
      if (!nombre) {
        throw new BadRequestException(
          'Indica el nombre del cliente para registrar el crédito',
        );
      }
      if (dto.cobro_mixto_grupo != null) {
        throw new BadRequestException(
          'El crédito no se combina con pago mixto en la misma factura',
        );
      }
    }

    let solicitudes = this.prepararSolicitudesCobro(pedido, dto);
    let pedidoParaCobro = pedido;

    const configRow = await this.obtenerConfigDescuentosRow();
    const config = this.mapConfigDescuentos(configRow);

    const cuotaPlan = await this.aplicarCuotaPlanEnFacturacion(
      idPedido,
      dto,
      pedidoParaCobro,
      solicitudes,
      config,
    );
    solicitudes = cuotaPlan.solicitudes;
    pedidoParaCobro = cuotaPlan.pedido;

    // Legacy: partir platos por persona. No aplica al plan saldo (personas/combinado).
    if (
      dto.plan_combinado_sobre_seleccion !== true &&
      dto.plan_personas_sobre_total !== true &&
      dto.persona_plan_indice != null &&
      dto.total_personas_plan != null &&
      dto.total_personas_plan >= 2
    ) {
      const unidadesSol = solicitudes.reduce((s, x) => s + x.cantidad, 0);
      if (unidadesSol < dto.total_personas_plan) {
        await this.prisma.$transaction(async (tx) => {
          solicitudes = await this.resolverSolicitudesCombinadoEnTx(
            tx,
            pedidoParaCobro,
            solicitudes,
            dto.persona_plan_indice!,
            dto.total_personas_plan!,
          );
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

    const detallesCobro = pedidoParaCobro.detalles.filter((d) =>
      solicitudes.some((s) => s.id_detalle === d.idDetalle),
    );

    const subtotalNum = subtotalDesdeSolicitudes(
      pedidoParaCobro.detalles.map((d) => ({
        id_detalle: d.idDetalle,
        precio_unitario: Number(d.precioUnitario),
        cantidad: d.cantidad,
      })),
      solicitudes,
    );
    const subtotal = new Prisma.Decimal(subtotalNum);

    const lineas = lineasDescuentoDesdeSolicitudes(
      detallesCobro.map((d) => ({
        id_detalle: d.idDetalle,
        cantidad: d.cantidad,
        precio_unitario: Number(d.precioUnitario),
        nombre_producto: d.producto.nombre,
        categoria_nombre: d.producto.categoria.nombre,
        id_categoria: d.producto.categoria.idCategoria,
        es_plato_principal: d.producto.esPlatoPrincipal,
        participa_descuento_sopas: d.producto.categoria.participaDescuentoSopas,
      })),
      solicitudes,
    );
    const descuentos = this.descuentosDesdeConfig(
      lineas,
      config,
      pedido,
    );
    const dS = new Prisma.Decimal(descuentos.descuento_sopas);
    const dM = new Prisma.Decimal(descuentos.descuento_muleros);
    const dP = new Prisma.Decimal(descuentos.descuento_promociones);
    const descTotal = dS.add(dM).add(dP);
    if (descTotal.gt(subtotal)) {
      throw new BadRequestException(
        'La suma de descuentos no puede superar el subtotal de esta cuenta',
      );
    }
    // Con plan/saldo el abono ya trae el monto exacto de la cuota (o el resto).
    const total = subtotal.sub(descTotal);
    const subtotalFactura = subtotal;
    const excesoTransferencia =
      dto.metodo_pago === 'transferencia'
        ? this.validarExcesoTransferenciaFactura(
            Number(total),
            dto.monto_transferencia,
            dto.devolucion_exceso_metodo,
          )
        : 0;

    const detalleExcesoCobro = calcularDetalleExcesoCobro({
      total: Number(total),
      metodo: dto.metodo_pago,
      monto_recibido_efectivo: dto.monto_recibido_efectivo,
      monto_transferencia: dto.monto_transferencia,
      devolucion_exceso_metodo: dto.devolucion_exceso_metodo,
    });
    const detalleExcesoJson = detalleExcesoCobro
      ? (detalleExcesoCobro as Prisma.InputJsonValue)
      : undefined;

    const enPlanSaldo =
      dto.plan_personas_sobre_total === true ||
      dto.plan_combinado_sobre_seleccion === true;
    // Estimación previa; dentro de la tx se recalcula tras marcar platos/saldo.
    let esParcial = enPlanSaldo
      ? pedidoParaCobro.detalles.some(
          (d) =>
            d.idFactura == null && esNotaSaldoRestantePendiente(d.notaCocina),
        )
      : quedaPendienteTrasCobro(detallesSerial, solicitudes);

    let idFacturaCreada = 0;

    if (
      dto.cobro_mixto_grupo != null &&
      (dto.cobro_mixto_grupo < 1 || dto.cobro_mixto_grupo > 2_147_483_647)
    ) {
      throw new BadRequestException(
        'cobro_mixto_grupo inválido. Recarga la app (F5 en el navegador) e intenta de nuevo.',
      );
    }
    if (dto.cobro_mixto_grupo != null && !dto.detalles_cobro?.length) {
      throw new BadRequestException(
        'El pago mixto requiere detalles_cobro en cada parte (efectivo y transferencia). Recarga la app.',
      );
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await lockPedidoEnTx(tx, idPedido);

        const pedidoTx = await tx.pedido.findUnique({
          where: { idPedido },
          select: { estado: true, idMesa: true },
        });
        if (!pedidoTx) {
          throw new NotFoundException('Pedido no encontrado');
        }
        if (pedidoTx.estado === 'facturado') {
          throw new ConflictException('Este pedido ya fue facturado');
        }
        if (!ABIERTOS.includes(pedidoTx.estado)) {
          throw new ConflictException('El pedido no se puede facturar');
        }

        const pedidoDetalles = await tx.pedido.findUnique({
          where: { idPedido },
          include: {
            detalles: { include: detalleInclude, orderBy: { idDetalle: 'asc' } },
          },
        });
        const detallesPorId = new Map(
          (pedidoDetalles?.detalles ?? []).map((d) => [d.idDetalle, d]),
        );
        for (const s of solicitudes) {
          const det = detallesPorId.get(s.id_detalle);
          if (!det || det.idFactura != null) {
            throw new ConflictException(
              'Algún ítem ya fue cobrado. Actualiza el pedido e intenta de nuevo.',
            );
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
            metodoPago: dto.metodo_pago as MetodoPago,
            esParcial,
            personaPlanIndice: dto.persona_plan_indice ?? null,
            ...this.planFacturaDataFromDto(dto),
            cobroMixtoGrupo: dto.cobro_mixto_grupo ?? null,
            detalleExcesoCobro: detalleExcesoJson,
          },
        });
        idFacturaCreada = factura.idFactura;

        if (dto.metodo_pago === 'credito') {
          await tx.cuentaCredito.create({
            data: {
              idPedido,
              idFactura: factura.idFactura,
              nombreCliente: dto.nombre_cliente_credito!.trim(),
              telefono: dto.telefono_credito?.trim() || null,
              montoTotal: total,
              saldoPendiente: total,
              notas: dto.notas_credito?.trim() || null,
              idUsuario,
            },
          });
        }

        for (const s of solicitudes) {
          const det = detallesPorId.get(s.id_detalle);
          if (!det || det.idPedido !== idPedido) {
            throw new BadRequestException('Ítem de cobro no encontrado');
          }
          await this.aplicarCobroDetalleEnTx(
            tx,
            det,
            s.cantidad,
            factura.idFactura,
          );
        }

        await this.marcarPlatosRealesCobradosSiSaldoLiquidadoEnTx(
          tx,
          idPedido,
          factura.idFactura,
          {
            sobreTotal: dto.plan_personas_sobre_total === true,
            pool:
              dto.plan_combinado_sobre_seleccion === true
                ? (dto.detalles_seleccion_referencia ?? []).map((s) => ({
                    id_detalle: s.id_detalle,
                    cantidad: s.cantidad,
                  }))
                : null,
          },
        );

        if (excesoTransferencia > 0) {
          await this.crearMovimientoExcesoTransferenciaEnTx(tx, {
            idPedido,
            idFactura: factura.idFactura,
            idUsuario,
            montoExceso: excesoTransferencia,
            destino: dto.devolucion_exceso_metodo!,
          });
        }

        esParcial = await this.liquidarYEvaluarPendienteEnTx(
          tx,
          idPedido,
          factura.idFactura,
        );
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
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002' &&
        /id_pedido/i.test(String(e.meta?.target ?? ''))
      ) {
        throw new BadRequestException(
          'La base de datos aún no permite cobros parciales (varias facturas por pedido). ' +
            'En el PC servidor ejecuta inicio.bat o, en desarrollo: cd services/api && npx prisma migrate deploy',
        );
      }
      throw e;
    }

    this.emit(idPedido, pedido.idMesa, pedido.idUsuario);

    const completo = await this.obtenerPorIdTrasEscritura(idPedido);
    const ticketFactura = this.construirTicketFactura(
      completo,
      idFacturaCreada,
      false,
      detalleExcesoCobro,
    );
    const conCopia =
      dto.imprimir_factura !== false && dto.factura_con_copia === true;

    const impresionFactura =
      dto.imprimir_factura === false
        ? { impreso: false, omitido: true }
        : await this.imprimirFacturaEnRespuesta(ticketFactura, idPedido, conCopia);

    return {
      ...completo,
      id_factura_emitida: idFacturaCreada,
      cobro_completo: !esParcial,
      impresion_factura: impresionFactura,
      factura_con_copia: conCopia,
    };
  }

  async facturarMixto(
    idPedido: number,
    dto: FacturarMixtoDto,
    actor: { idUsuario: number; rol: { nombre: string } },
  ) {
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
      throw new NotFoundException('Pedido no encontrado');
    }
    if (pedido.estado === 'facturado') {
      throw new ConflictException('Este pedido ya fue facturado');
    }
    if (!ABIERTOS.includes(pedido.estado)) {
      throw new ConflictException('El pedido no se puede facturar');
    }
    if (pedido.detalles.length === 0) {
      throw new BadRequestException('No hay ítems en el pedido');
    }

    let solicitudes = this.prepararSolicitudesCobro(pedido, dto);
    if (solicitudes.length === 0) {
      throw new BadRequestException('No hay ítems pendientes de cobro');
    }
    let pedidoParaCobro = pedido;

    const configRow = await this.obtenerConfigDescuentosRow();
    const config = this.mapConfigDescuentos(configRow);

    const cuotaPlan = await this.aplicarCuotaPlanEnFacturacion(
      idPedido,
      dto,
      pedidoParaCobro,
      solicitudes,
      config,
    );
    solicitudes = cuotaPlan.solicitudes;
    pedidoParaCobro = cuotaPlan.pedido;

    // Legacy: partir platos por persona. No aplica al plan saldo (personas/combinado).
    if (
      dto.plan_combinado_sobre_seleccion !== true &&
      dto.plan_personas_sobre_total !== true &&
      dto.persona_plan_indice != null &&
      dto.total_personas_plan != null &&
      dto.total_personas_plan >= 2
    ) {
      const unidadesSol = solicitudes.reduce((s, x) => s + x.cantidad, 0);
      if (unidadesSol < dto.total_personas_plan) {
        await this.prisma.$transaction(async (tx) => {
          solicitudes = await this.resolverSolicitudesCombinadoEnTx(
            tx,
            pedidoParaCobro,
            solicitudes,
            dto.persona_plan_indice!,
            dto.total_personas_plan!,
          );
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

    const importesTotales = this.calcularImportesFactura(
      pedidoParaCobro,
      solicitudes,
      config,
    );
    // Abono de saldo ya trae el monto de la cuota (o el resto al liquidar).
    const totalNeto = Number(importesTotales.total);
    const montoRecibidoEfectivo = dto.monto_recibido_efectivo ?? 0;
    const reparto = repartoMixtoConDevolucion(
      totalNeto,
      dto.monto_transferencia,
      montoRecibidoEfectivo,
      dto.devolucion_exceso_metodo,
    );

    if (reparto.excesoDevolverEfectivo === 0) {
      if (reparto.efectivoFactura + reparto.transferenciaFactura !== totalNeto) {
        throw new BadRequestException(
          'Efectivo y transferencia deben sumar el total de esta cuenta',
        );
      }
    } else if (
      dto.devolucion_exceso_metodo !== 'efectivo' &&
      dto.devolucion_exceso_metodo !== 'transferencia' &&
      dto.devolucion_exceso_metodo !== 'domicilio' &&
      dto.devolucion_exceso_metodo !== 'mesero'
    ) {
      throw new BadRequestException(
        'Indica si el exceso es devolución al cliente (efectivo o transferencia) o pago domiciliario',
      );
    }

    if (reparto.efectivoFactura > 0 && montoRecibidoEfectivo < reparto.efectivoFactura) {
      throw new BadRequestException(
        `El efectivo recibido debe cubrir la parte en efectivo (${reparto.efectivoFactura} de ${totalNeto} COP; recibido: ${montoRecibidoEfectivo})`,
      );
    }

    const detalleExcesoCobro = calcularDetalleExcesoCobro({
      total: totalNeto,
      metodo: 'mixto',
      monto_recibido_efectivo: montoRecibidoEfectivo,
      monto_transferencia: dto.monto_transferencia,
      devolucion_exceso_metodo: dto.devolucion_exceso_metodo,
    });
    const detalleExcesoJson = detalleExcesoCobro
      ? (detalleExcesoCobro as Prisma.InputJsonValue)
      : undefined;

    const precios: Record<number, number> = {};
    const lineasPadre: {
      id_detalle: number;
      precio_unitario: number;
      cantidad_pendiente: number;
    }[] = [];
    const cantSolicitud = new Map(
      solicitudes.map((s) => [s.id_detalle, s.cantidad]),
    );
    for (const d of pedidoParaCobro.detalles) {
      precios[d.idDetalle] = Number(d.precioUnitario);
      if (d.idDetallePadre != null) continue;
      const q = cantSolicitud.get(d.idDetalle);
      if (q == null || q <= 0) continue;
      lineasPadre.push({
        id_detalle: d.idDetalle,
        precio_unitario: Number(d.precioUnitario),
        cantidad_pendiente: q,
      });
    }

    const netoDeCantidades = (cantidades: Record<number, number>) => {
      const base = Object.entries(cantidades)
        .filter(([, q]) => q > 0)
        .map(([id, cantidad]) => ({
          id_detalle: Number(id),
          cantidad,
        }));
      if (base.length === 0) return 0;
      const expandidas = ordenarSolicitudesCobro(
        detallesSerial,
        expandirSolicitudesConEmpaques(detallesSerial, base),
      );
      return Number(
        this.calcularImportesFactura(pedidoParaCobro, expandidas, config).total,
      );
    };

    const expandirCantidades = (cantidades: Record<number, number>) => {
      const base = Object.entries(cantidades)
        .filter(([, q]) => q > 0)
        .map(([id, cantidad]) => ({
          id_detalle: Number(id),
          cantidad,
        }));
      if (base.length === 0) return [];
      return ordenarSolicitudesCobro(
        detallesSerial,
        expandirSolicitudesConEmpaques(detallesSerial, base),
      );
    };

    // Ítems enteros por cantidad (nunca partir precios). Los montos exactos de
    // efectivo/transferencia van en la cabecera de cada factura (proporcionales).
    // Partir precios dejaba N filas fantasma por plato (p. ej. 3 picadas → 9 líneas).
    let { efectivo: solEfectivo, transferencia: solTransferencia } =
      dividirSolicitudesCobroMixto(
        solicitudes,
        precios,
        reparto.efectivoFactura,
        totalNeto,
        {
          lineasPadre,
          netoDeCantidades,
          expandirCantidades,
        },
      );

    if (
      reparto.efectivoFactura > 0 &&
      reparto.transferenciaFactura > 0 &&
      (solEfectivo.length === 0 || solTransferencia.length === 0)
    ) {
      // Una sola unidad o montos que no calzan: todos los ítems en una pata;
      // la otra factura queda solo con el monto (auditable, sin fragmentar platos).
      if (solEfectivo.length === 0 && solTransferencia.length === 0) {
        solTransferencia = [...solicitudes];
      } else if (solEfectivo.length === 0) {
        solEfectivo = [];
        solTransferencia = [...solicitudes];
      } else {
        solTransferencia = [];
        solEfectivo = [...solicitudes];
      }
    }

    if (
      solEfectivo.length === 0 &&
      solTransferencia.length === 0 &&
      solicitudes.length > 0
    ) {
      solEfectivo = [...solicitudes];
    }

    const cobroMixtoGrupo =
      reparto.efectivoFactura > 0 && reparto.transferenciaFactura > 0
        ? nuevoCobroMixtoGrupo()
        : null;

    // Importes de cabecera: siempre los montos exactos del reparto (auditables).
    // Si solo hay una pata, usa el total completo de la operación.
    const descFull =
      Number(importesTotales.dS) +
      Number(importesTotales.dM) +
      Number(importesTotales.dP);
    const fullImportes = {
      subtotal:
        totalNeto === Number(importesTotales.total)
          ? Number(importesTotales.subtotal)
          : totalNeto + descFull,
      descuento_sopas: Number(importesTotales.dS),
      descuento_muleros: Number(importesTotales.dM),
      descuento_promociones: Number(importesTotales.dP),
      total: totalNeto,
    };
    const proporcionales =
      cobroMixtoGrupo != null
        ? importesProporcionalesMixto(fullImportes, reparto.efectivoFactura)
        : null;

    const enPlanSaldoMixto =
      dto.plan_personas_sobre_total === true ||
      dto.plan_combinado_sobre_seleccion === true;
    let esParcial = enPlanSaldoMixto
      ? pedidoParaCobro.detalles.some(
          (d) =>
            d.idFactura == null && esNotaSaldoRestantePendiente(d.notaCocina),
        )
      : quedaPendienteTrasCobro(detallesSerial, solicitudes);
    const idsFacturas: number[] = [];

    const crearEnTx = async (
      tx: Prisma.TransactionClient,
      sol: DetalleCobroCantidad[],
      metodo: MetodoPago,
      grupo: number | null,
      importesForzados: {
        subtotal: number;
        descuento_sopas: number;
        descuento_muleros: number;
        descuento_promociones: number;
        total: number;
      },
    ) => {
      const factura = await tx.factura.create({
        data: {
          idPedido,
          idUsuario,
          subtotal: new Prisma.Decimal(importesForzados.subtotal),
          descuentoSopas: new Prisma.Decimal(importesForzados.descuento_sopas),
          descuentoMuleros: new Prisma.Decimal(
            importesForzados.descuento_muleros,
          ),
          descuentoPromociones: new Prisma.Decimal(
            importesForzados.descuento_promociones,
          ),
          total: new Prisma.Decimal(importesForzados.total),
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
      const detallesPorId = new Map(
        (pedidoDet?.detalles ?? []).map((d) => [d.idDetalle, d]),
      );
      for (const s of sol) {
        const det = detallesPorId.get(s.id_detalle);
        if (!det) {
          throw new BadRequestException('Ítem de cobro no encontrado');
        }
        if (det.idFactura != null) {
          throw new ConflictException(
            'Algún ítem ya fue cobrado. Actualiza el pedido e intenta de nuevo.',
          );
        }
        await this.aplicarCobroDetalleEnTx(
          tx,
          det,
          s.cantidad,
          factura.idFactura,
        );
      }
      return factura.idFactura;
    };

    try {
      await this.prisma.$transaction(async (tx) => {
        await lockPedidoEnTx(tx, idPedido);

        let pedidoEnTx = await tx.pedido.findUnique({
          where: { idPedido },
          include: {
            detalles: { include: detalleInclude, orderBy: { idDetalle: 'asc' } },
            facturas: facturasInclude,
          },
        });
        if (!pedidoEnTx) {
          throw new NotFoundException('Pedido no encontrado');
        }
        if (pedidoEnTx.estado === 'facturado') {
          throw new ConflictException('Este pedido ya fue facturado');
        }
        if (!ABIERTOS.includes(pedidoEnTx.estado)) {
          throw new ConflictException('El pedido no se puede facturar');
        }

        let solEfTx = solEfectivo;
        let solTrTx = solTransferencia;

        // Plan + mixto: partir solo el abono de saldo (nunca platos reales).
        if (
          enPlanSaldoMixto &&
          proporcionales != null &&
          solicitudes.length === 1 &&
          reparto.efectivoFactura > 0 &&
          reparto.transferenciaFactura > 0
        ) {
          const abonoId = solicitudes[0]!.id_detalle;
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
                notaCocina: SALDO_ABONO_NOTA,
                enviadoCocina: false,
                listoCocina: false,
                listoParaRecoger: false,
              },
            });
            solEfTx = [{ id_detalle: abonoId, cantidad: 1 }];
            solTrTx = [{ id_detalle: abonoTr.idDetalle, cantidad: 1 }];
          }
        }

        // Crear factura por cada pata con monto > 0 (puede no llevar ítems).
        if (reparto.efectivoFactura > 0) {
          const impEf =
            proporcionales != null
              ? proporcionales.primera
              : {
                  subtotal: fullImportes.subtotal,
                  descuento_sopas: fullImportes.descuento_sopas,
                  descuento_muleros: fullImportes.descuento_muleros,
                  descuento_promociones: fullImportes.descuento_promociones,
                  total: fullImportes.total,
                };
          idsFacturas.push(
            await crearEnTx(tx, solEfTx, 'efectivo', cobroMixtoGrupo, impEf),
          );
        }
        if (reparto.transferenciaFactura > 0) {
          const impTr =
            proporcionales != null
              ? proporcionales.segunda
              : {
                  subtotal: fullImportes.subtotal,
                  descuento_sopas: fullImportes.descuento_sopas,
                  descuento_muleros: fullImportes.descuento_muleros,
                  descuento_promociones: fullImportes.descuento_promociones,
                  total: fullImportes.total,
                };
          idsFacturas.push(
            await crearEnTx(
              tx,
              solTrTx,
              'transferencia',
              cobroMixtoGrupo,
              impTr,
            ),
          );
        }

        // Invariante: desglose mixto exacto y sin sobre-pago de la operación.
        if (proporcionales != null) {
          const sumaPatas =
            proporcionales.primera.total + proporcionales.segunda.total;
          if (sumaPatas !== totalNeto) {
            throw new BadRequestException(
              `Inconsistencia de cobro mixto: ${sumaPatas} ≠ ${totalNeto}`,
            );
          }
        }

        if (idsFacturas.length > 0) {
          await this.marcarPlatosRealesCobradosSiSaldoLiquidadoEnTx(
            tx,
            idPedido,
            idsFacturas[idsFacturas.length - 1]!,
            {
              sobreTotal: dto.plan_personas_sobre_total === true,
              pool:
                dto.plan_combinado_sobre_seleccion === true
                  ? (dto.detalles_seleccion_referencia ?? []).map((s) => ({
                      id_detalle: s.id_detalle,
                      cantidad: s.cantidad,
                    }))
                  : null,
            },
          );
        }

        if (reparto.excesoDevolverEfectivo > 0) {
          await this.crearMovimientoExcesoTransferenciaEnTx(tx, {
            idPedido,
            idFactura: idsFacturas[0] ?? null,
            idUsuario,
            montoExceso: reparto.excesoDevolverEfectivo,
            destino: dto.devolucion_exceso_metodo!,
          });
        }

        const idFacturaCierre =
          idsFacturas.length > 0
            ? idsFacturas[idsFacturas.length - 1]!
            : 0;
        esParcial =
          idFacturaCierre > 0
            ? await this.liquidarYEvaluarPendienteEnTx(
                tx,
                idPedido,
                idFacturaCierre,
              )
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
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002' &&
        /id_pedido/i.test(String(e.meta?.target ?? ''))
      ) {
        throw new BadRequestException(
          'La base de datos aún no permite cobros parciales (varias facturas por pedido). ' +
            'En el PC servidor ejecuta inicio.bat o, en desarrollo: cd services/api && npx prisma migrate deploy',
        );
      }
      throw e;
    }

    this.emit(idPedido, pedido.idMesa, pedido.idUsuario);

    const idFacturaImprimir =
      cobroMixtoGrupo != null
        ? Math.min(...idsFacturas)
        : idsFacturas[idsFacturas.length - 1]!;

    const completo = await this.obtenerPorIdTrasEscritura(idPedido);
    const ticketFactura = this.construirTicketFactura(
      completo,
      idFacturaImprimir,
      false,
      detalleExcesoCobro,
    );
    const conCopia =
      dto.imprimir_factura !== false && dto.factura_con_copia === true;

    const impresionFactura =
      dto.imprimir_factura === false
        ? { impreso: false, omitido: true }
        : await this.imprimirFacturaEnRespuesta(ticketFactura, idPedido, conCopia);

    return {
      ...completo,
      id_factura_emitida: idFacturaImprimir,
      cobro_completo: !esParcial,
      impresion_factura: impresionFactura,
      factura_con_copia: conCopia,
      cobro_mixto_grupo: cobroMixtoGrupo,
    };
  }

  private calcularImportesFactura(
    pedido: {
      detalles: Prisma.DetallePedidoGetPayload<{ include: typeof detalleInclude }>[];
      clienteMulero: boolean;
    },
    solicitudes: DetalleCobroCantidad[],
    config: ConfigDescuentoCalc,
  ) {
    const subtotalNum = subtotalDesdeSolicitudes(
      pedido.detalles.map((d) => ({
        id_detalle: d.idDetalle,
        precio_unitario: Number(d.precioUnitario),
        cantidad: d.cantidad,
      })),
      solicitudes,
    );
    const subtotal = new Prisma.Decimal(subtotalNum);
    const detallesCobro = pedido.detalles.filter((d) =>
      solicitudes.some((s) => s.id_detalle === d.idDetalle),
    );
    const lineas = lineasDescuentoDesdeSolicitudes(
      detallesCobro.map((d) => ({
        id_detalle: d.idDetalle,
        cantidad: d.cantidad,
        precio_unitario: Number(d.precioUnitario),
        nombre_producto: d.producto.nombre,
        categoria_nombre: d.producto.categoria.nombre,
        id_categoria: d.producto.categoria.idCategoria,
        es_plato_principal: d.producto.esPlatoPrincipal,
        participa_descuento_sopas: d.producto.categoria.participaDescuentoSopas,
      })),
      solicitudes,
    );
    const descuentos = this.descuentosDesdeConfig(
      lineas,
      config,
      pedido,
    );
    const dS = new Prisma.Decimal(descuentos.descuento_sopas);
    const dM = new Prisma.Decimal(descuentos.descuento_muleros);
    const dP = new Prisma.Decimal(descuentos.descuento_promociones);
    const descTotal = dS.add(dM).add(dP);
    if (descTotal.gt(subtotal)) {
      throw new BadRequestException(
        'La suma de descuentos no puede superar el subtotal de esta cuenta',
      );
    }
    const total = subtotal.sub(descTotal);
    return { subtotal, dS, dM, dP, total };
  }

  /** Cancela el pedido (solo si está abierto/en cocina y sin cobros), libera la mesa y elimina el pedido. */
  async cerrarAnulandoPendiente(
    idPedido: number,
    dto: CerrarAnulandoPendienteDto,
    actor: { idUsuario: number; rol: { nombre: string } },
  ) {
    await this.assertPuedeCerrarConAnulacion(actor);

    const motivo = dto.motivo.trim();
    if (motivo.length < 3) {
      throw new BadRequestException('Indica un motivo de al menos 3 caracteres');
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
      throw new NotFoundException('Pedido no encontrado');
    }
    if (!ABIERTOS.includes(pedido.estado)) {
      throw new ConflictException('El pedido ya está cerrado');
    }
    if (pedido.facturas.length === 0) {
      throw new BadRequestException(
        'Esta acción solo aplica cuando ya hay cobros parciales registrados',
      );
    }

    const idMesaPedido = pedido.idMesa;

    await this.prisma.$transaction(async (tx) => {
      await lockPedidoEnTx(tx, idPedido);

      const pedidoTx = await tx.pedido.findUnique({
        where: { idPedido },
        include: { facturas: facturasInclude },
      });
      if (!pedidoTx || !ABIERTOS.includes(pedidoTx.estado)) {
        throw new ConflictException('El pedido ya no admite este cierre');
      }
      if (pedidoTx.facturas.length === 0) {
        throw new BadRequestException(
          'Esta acción solo aplica cuando ya hay cobros parciales registrados',
        );
      }

      const detallesTx = await tx.detallePedido.findMany({
        where: { idPedido },
        include: { producto: { include: { categoria: true } } },
      });
      const pendientesTx = detallesTx.filter((d) => d.idFactura == null);
      if (pendientesTx.length === 0) {
        throw new BadRequestException(
          'No hay ítems pendientes por anular. Usa el cobro normal para cerrar la mesa.',
        );
      }

      const lineasAnuladas = pendientesTx.map((d) => ({
        id_detalle: d.idDetalle,
        nombre_producto: d.producto.nombre,
        cantidad: d.cantidad,
        precio_unitario: Number(d.precioUnitario),
      }));

      for (const d of pendientesTx) {
        await reintegrarStockBebidaTx(tx, d.producto, d.cantidad);
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

    this.emit(idPedido, idMesaPedido, pedido.idUsuario);
    return this.obtenerPorIdTrasEscritura(idPedido);
  }

  private async assertPuedeCerrarConAnulacion(actor: {
    idUsuario: number;
    rol: { nombre: string };
  }) {
    const efectivos = await this.permisos.getEfectivos(
      actor.idUsuario,
      actor.rol.nombre,
    );
    if (!efectivos.puede_cerrar_anulando) {
      throw new ForbiddenException(
        'Hoy no estás autorizado para cerrar mesa anulando lo pendiente. Pide al administrador.',
      );
    }
  }

  private esDetallePlatoCandidatoSaldo(
    d: {
      idFactura: number | null;
      idDetallePadre: number | null;
      idDetalle: number;
      notaCocina: string | null;
      producto: { esCuotaPendienteReparto: boolean };
    },
    pool: SaldoPoolRef[] | null,
    opts?: { incluirCobradosDePlan?: Set<number> },
  ): boolean {
    if (d.idDetallePadre != null) return false;
    if (d.producto.esCuotaPendienteReparto) return false;
    if (esNotaSaldoRestantePendiente(d.notaCocina)) return false;
    if ((d.notaCocina ?? '').trim().startsWith(SALDO_ABONO_NOTA)) return false;
    if (d.idFactura != null) {
      if (!opts?.incluirCobradosDePlan?.has(d.idFactura)) return false;
    }
    if (pool != null && pool.length > 0) {
      return pool.some((p) => p.id_detalle === d.idDetalle);
    }
    return true;
  }

  /**
   * Tras un reparto por personas/combinado con saldo pendiente, prepara el cobro
   * por platos: libera unidades enteras que caben en el saldo y deja el remanente
   * como «Saldo pendiente». Los platos ya cubiertos por abonos se marcan cobrados.
   */
  async reconciliarSaldoAPlatos(
    idPedido: number,
    actor: { idUsuario: number; rol: { nombre: string } },
  ) {
    await this.exigirPermisoMesero(actor, 'cobrar');

    const pedido = await this.prisma.pedido.findUnique({
      where: { idPedido },
      include: {
        detalles: { include: detalleInclude, orderBy: { idDetalle: 'asc' } },
        facturas: { orderBy: { idFactura: 'asc' } },
      },
    });
    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }
    if (pedido.estado === 'facturado') {
      throw new ConflictException('Este pedido ya fue facturado');
    }
    if (!ABIERTOS.includes(pedido.estado)) {
      throw new ConflictException('El pedido no admite cambios');
    }

    const saldo = this.findSaldoRestantePendiente(pedido.detalles);
    if (!saldo) {
      return this.obtenerPorIdTrasEscritura(idPedido);
    }

    const montoSaldo =
      Math.round(Number(saldo.precioUnitario)) * saldo.cantidad;
    const pool = parseSaldoRestantePool(saldo.notaCocina);
    const idsFacturasPlan = new Set<number>();
    for (const f of pedido.facturas) {
      if (f.planPersonasSobreTotal || f.planCombinadoSobreSeleccion) {
        idsFacturasPlan.add(f.idFactura);
      }
    }
    for (const d of pedido.detalles) {
      if (
        d.idFactura != null &&
        (d.notaCocina ?? '').trim().startsWith(SALDO_ABONO_NOTA)
      ) {
        idsFacturasPlan.add(d.idFactura);
      }
    }

    const candidatosPendientes = pedido.detalles.filter((d) =>
      this.esDetallePlatoCandidatoSaldo(d, pool),
    );
    const platosInput = candidatosPendientes.map((d) => ({
      id_detalle: d.idDetalle,
      precio_unitario: Math.round(Number(d.precioUnitario)),
      cantidad: d.cantidad,
    }));

    if (
      !saldoNecesitaReconciliarAPlatos(
        montoSaldo,
        platosInput,
        saldo.notaCocina,
      )
    ) {
      return this.obtenerPorIdTrasEscritura(idPedido);
    }

    await this.prisma.$transaction(async (tx) => {
      await lockPedidoEnTx(tx, idPedido);

      const pedidoTx = await tx.pedido.findUnique({
        where: { idPedido },
        include: {
          detalles: { include: detalleInclude, orderBy: { idDetalle: 'asc' } },
          facturas: { orderBy: { idFactura: 'asc' } },
        },
      });
      if (!pedidoTx) {
        throw new NotFoundException('Pedido no encontrado');
      }

      const saldoTx = this.findSaldoRestantePendiente(pedidoTx.detalles);
      if (!saldoTx) return;

      const montoSaldoTx =
        Math.round(Number(saldoTx.precioUnitario)) * saldoTx.cantidad;
      const poolTx = parseSaldoRestantePool(saldoTx.notaCocina);

      const idsFacturasPlanTx = new Set<number>();
      for (const f of pedidoTx.facturas) {
        if (f.planPersonasSobreTotal || f.planCombinadoSobreSeleccion) {
          idsFacturasPlanTx.add(f.idFactura);
        }
      }
      for (const d of pedidoTx.detalles) {
        if (
          d.idFactura != null &&
          (d.notaCocina ?? '').trim().startsWith(SALDO_ABONO_NOTA)
        ) {
          idsFacturasPlanTx.add(d.idFactura);
        }
      }

      // Reabrir platos mal marcados por un reconcile anterior (línea completa
      // que no cabía en el saldo, p. ej. 3× picada vs saldo de 1–2 unidades).
      let candidatosTx = pedidoTx.detalles.filter((d) =>
        this.esDetallePlatoCandidatoSaldo(d, poolTx),
      );
      if (candidatosTx.length === 0 && idsFacturasPlanTx.size > 0) {
        for (const d of pedidoTx.detalles) {
          if (
            !this.esDetallePlatoCandidatoSaldo(d, poolTx, {
              incluirCobradosDePlan: idsFacturasPlanTx,
            })
          ) {
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
        candidatosTx = (recargado?.detalles ?? []).filter((d) =>
          this.esDetallePlatoCandidatoSaldo(d, poolTx),
        );
      }

      if (candidatosTx.length === 0) return;

      const distTx = distribuirSaldoEnPlatos(
        montoSaldoTx,
        candidatosTx.map((d) => ({
          id_detalle: d.idDetalle,
          precio_unitario: Math.round(Number(d.precioUnitario)),
          cantidad: d.cantidad,
        })),
      );
      const liberarPorId = new Map(
        distTx.liberaciones.map((l) => [l.id_detalle, l.cantidad]),
      );
      const idFacturaTx =
        pedidoTx.facturas.length > 0
          ? pedidoTx.facturas[pedidoTx.facturas.length - 1]!.idFactura
          : null;

      for (const d of candidatosTx) {
        const liberar = liberarPorId.get(d.idDetalle) ?? 0;
        const marcar = d.cantidad - liberar;
        if (marcar <= 0 || idFacturaTx == null) continue;
        // Marca solo las unidades cubiertas por abonos; deja liberar pendientes.
        await this.aplicarCobroDetalleEnTx(tx, d, marcar, idFacturaTx);
      }

      const saldoActualizado = await tx.detallePedido.findUnique({
        where: { idDetalle: saldoTx.idDetalle },
      });
      if (!saldoActualizado || saldoActualizado.idFactura != null) return;

      if (distTx.montoSaldoRestante <= 0) {
        await tx.detallePedido.delete({
          where: { idDetalle: saldoTx.idDetalle },
        });
      } else {
        await tx.detallePedido.update({
          where: { idDetalle: saldoTx.idDetalle },
          data: {
            precioUnitario: distTx.montoSaldoRestante,
            cantidad: 1,
            notaCocina: SALDO_RESTANTE_FRAGMENTO_NOTA,
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

    this.emit(idPedido, pedido.idMesa, pedido.idUsuario);
    return this.obtenerPorIdTrasEscritura(idPedido);
  }

  async omitirCuotaPlan(
    idPedido: number,
    dto: OmitirCuotaPlanDto,
    actor: { idUsuario: number; rol: { nombre: string } },
  ) {
    await this.exigirPermisoMesero(actor, 'cobrar');
    const enPlan =
      dto.plan_personas_sobre_total === true ||
      dto.plan_combinado_sobre_seleccion === true;
    if (!enPlan) {
      throw new BadRequestException(
        'Solo aplica en cobro por personas o combinado',
      );
    }
    if (dto.persona_plan_indice > dto.total_personas_plan) {
      throw new BadRequestException('Índice de persona inválido');
    }
    if (dto.monto_persona_plan <= 0) {
      throw new BadRequestException('Cuota inválida');
    }

    const pedido = await this.prisma.pedido.findUnique({
      where: { idPedido },
      include: {
        detalles: { include: detalleInclude, orderBy: { idDetalle: 'asc' } },
        facturas: facturasInclude,
      },
    });
    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }
    if (pedido.estado === 'facturado') {
      throw new ConflictException('Este pedido ya fue facturado');
    }
    if (!ABIERTOS.includes(pedido.estado)) {
      throw new ConflictException('El pedido no admite cambios');
    }

    const historialPrevio = await this.prisma.pedidoHistorial.findMany({
      where: { idPedido },
      select: { detalleJson: true, tipo: true },
    });
    const cuotasRegistradas = listarCuotasPlanOmitidas(
      pedido.detalles.map((d) => ({
        cobrado: d.idFactura != null,
        nota_cocina: d.notaCocina,
        es_cuota_pendiente_reparto: d.producto.esCuotaPendienteReparto,
        precio_unitario: Number(d.precioUnitario),
        cantidad: d.cantidad,
      })),
      historialPrevio.map((h) => ({
        tipo: h.tipo,
        detalle: h.detalleJson,
      })),
    );
    const sesionId =
      dto.plan_sesion_id != null && dto.plan_sesion_id > 0
        ? dto.plan_sesion_id
        : undefined;
    const yaExiste = cuotasRegistradas.some(
      (c) =>
        c.persona_plan_indice === dto.persona_plan_indice &&
        c.facturas_base_plan === dto.facturas_base_plan &&
        (sesionId != null
          ? c.plan_sesion_id === sesionId
          : c.plan_sesion_id == null),
    );
    if (yaExiste) {
      throw new ConflictException(
        `La persona ${dto.persona_plan_indice} ya tiene cuota pendiente registrada`,
      );
    }

    const configRow = await this.obtenerConfigDescuentosRow();
    const config = this.mapConfigDescuentos(configRow);
    const poolRef: SaldoPoolRef[] | null =
      dto.plan_combinado_sobre_seleccion === true &&
      dto.detalles_seleccion_referencia != null &&
      dto.detalles_seleccion_referencia.length > 0
        ? dto.detalles_seleccion_referencia.map((s) => ({
            id_detalle: s.id_detalle,
            cantidad: s.cantidad,
          }))
        : null;

    let planBase = dto.plan_base_total != null ? Math.round(dto.plan_base_total) : 0;
    if (planBase <= 0) {
      const realesPendientes = pedido.detalles.filter(
        (d) =>
          d.idFactura == null &&
          d.idDetallePadre == null &&
          !d.producto.esCuotaPendienteReparto &&
          !esNotaSaldoRestantePendiente(d.notaCocina),
      );
      const baseSol =
        poolRef != null && poolRef.length > 0
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
      throw new BadRequestException('No hay saldo pendiente para este reparto');
    }

    await this.prisma.$transaction(async (tx) => {
      await lockPedidoEnTx(tx, idPedido);

      const pedidoTx = await tx.pedido.findUnique({
        where: { idPedido },
        include: {
          detalles: { include: detalleInclude, orderBy: { idDetalle: 'asc' } },
          facturas: { orderBy: { idFactura: 'asc' }, select: { total: true } },
        },
      });
      if (!pedidoTx) {
        throw new NotFoundException('Pedido no encontrado');
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
            plan_combinado_sobre_seleccion:
              dto.plan_combinado_sobre_seleccion ?? false,
          },
        },
      });

      // Saldo pendiente = base del plan − lo ya cobrado en esta sesión.
      // Así la última persona que omite deja exactamente su cuota (u omisiones
      // acumuladas), sin liberar la mesa ni marcar platos como pagados.
      const cobradoEnPlan = pedidoTx.facturas
        .slice(dto.facturas_base_plan)
        .reduce((s, f) => s + Math.round(Number(f.total)), 0);
      const montoSaldo = Math.max(0, planBase - cobradoEnPlan);
      const notaSaldo = formatSaldoRestanteNota(poolRef);
      const saldoExistente = this.findSaldoRestantePendiente(pedidoTx.detalles);

      if (montoSaldo <= 0) {
        if (saldoExistente) {
          await tx.detallePedido.delete({
            where: { idDetalle: saldoExistente.idDetalle },
          });
        }
      } else if (saldoExistente) {
        await tx.detallePedido.update({
          where: { idDetalle: saldoExistente.idDetalle },
          data: {
            precioUnitario: montoSaldo,
            cantidad: 1,
            notaCocina: notaSaldo,
          },
        });
      } else {
        await this.asegurarSaldoRestanteEnTx(
          tx,
          idPedido,
          pedidoTx,
          montoSaldo,
          poolRef,
        );
      }
    });

    this.emit(idPedido, pedido.idMesa, pedido.idUsuario);
    return this.obtenerPorIdTrasEscritura(idPedido);
  }

  async cancelar(
    idPedido: number,
    actor?: { idUsuario: number; rol: { nombre: string } },
  ) {
    await this.exigirPermisoMesero(actor, 'cancelar_pedido');
    const pedido = await this.prisma.pedido.findUnique({
      where: { idPedido },
      include: { facturas: facturasInclude },
    });
    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }
    if (pedido.estado === 'facturado' || pedido.facturas.length > 0) {
      throw new ConflictException(
        'No se puede cancelar un pedido con cobros registrados',
      );
    }
    if (!ABIERTOS.includes(pedido.estado)) {
      throw new ConflictException('El pedido no se puede cancelar');
    }

    const idMesaPedido = pedido.idMesa;
    await this.prisma.$transaction(async (tx) => {
      const detalles = await tx.detallePedido.findMany({
        where: { idPedido },
        include: { producto: { include: { categoria: true } } },
      });
      for (const d of detalles) {
        await reintegrarStockBebidaTx(tx, d.producto, d.cantidad);
      }
      await this.eliminarCuentasCreditoEnTx(tx, { idPedido });
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

    this.emit(idPedido, pedido.idMesa, pedido.idUsuario);
    return { ok: true };
  }

  /** Transfiere el pedido a otra mesa libre (no 98 ni 99). */
  async transferir(
    idPedido: number,
    dto: TransferirPedidoDto,
    actor?: { idUsuario: number; rol: { nombre: string } },
  ) {
    await this.exigirPermisoMesero(actor, 'transferir_mesa');
    const mesaNumero = dto.mesa_numero_nuevo;
    const idMesaFromDto = dto.id_mesa_nueva;
    if (mesaNumero == null && idMesaFromDto == null) {
      throw new BadRequestException(
        'Debes enviar mesa_numero_nuevo (recomendado) o id_mesa_nueva',
      );
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
      throw new NotFoundException('Pedido no encontrado');
    }
    if (pedido.estado === 'facturado' || pedido.facturas.length > 0) {
      throw new ConflictException(
        'No se puede transferir un pedido con cobros registrados',
      );
    }
    if (!ABIERTOS.includes(pedido.estado)) {
      throw new ConflictException('El pedido no se puede transferir');
    }

    const mesaNueva = mesaNumero
      ? await this.prisma.mesa.findUnique({ where: { numero: mesaNumero } })
      : await this.prisma.mesa.findUnique({ where: { idMesa: idMesaFromDto! } });
    if (!mesaNueva) {
      throw new NotFoundException('Mesa destino no encontrada');
    }
    if (pedido.idMesa === mesaNueva.idMesa) {
      throw new BadRequestException('La mesa destino debe ser diferente');
    }
    if (!mesaDisponibleHoyBogota(mesaNueva)) {
      throw new ConflictException('La mesa destino no está disponible hoy');
    }

    const pedidoEnDestino = await this.prisma.pedido.findFirst({
      where: { idMesa: mesaNueva.idMesa, estado: { in: ABIERTOS } },
    });
    const destinoLibrePreliminar =
      mesaNueva.estado === 'libre' && pedidoEnDestino == null;

    const opRow = await this.obtenerConfigOperativaRow();
    const validacionPreliminar = validarTransferenciaPedido({
      origen_mesa_numero: pedido.mesa.numero,
      destino_mesa_numero: mesaNueva.numero,
      destino_libre: destinoLibrePreliminar,
      mesas_virtuales: opRow,
    });
    if (validacionPreliminar.accion === 'rechazar') {
      throw new ConflictException(validacionPreliminar.mensaje);
    }

    const mesaAnteriorId = pedido.idMesa;
    const op = await this.ctxOperativa();

    await this.prisma.$transaction(async (tx) => {
      const idsOrdenados = [mesaAnteriorId, mesaNueva.idMesa].sort(
        (a, b) => a - b,
      );
      for (const idMesa of idsOrdenados) {
        await lockMesaEnTx(tx, idMesa);
      }

      const pedidoTx = await tx.pedido.findUnique({
        where: { idPedido },
        include: { facturas: facturasInclude },
      });
      if (!pedidoTx) {
        throw new NotFoundException('Pedido no encontrado');
      }
      if (pedidoTx.estado === 'facturado' || pedidoTx.facturas.length > 0) {
        throw new ConflictException(
          'No se puede transferir un pedido con cobros registrados',
        );
      }
      if (!ABIERTOS.includes(pedidoTx.estado)) {
        throw new ConflictException('El pedido no se puede transferir');
      }

      const mesaDestinoTx = await tx.mesa.findUnique({
        where: { idMesa: mesaNueva.idMesa },
      });
      if (!mesaDestinoTx) {
        throw new NotFoundException('Mesa destino no encontrada');
      }
      const otroEnDestino = await tx.pedido.findFirst({
        where: { idMesa: mesaNueva.idMesa, estado: { in: ABIERTOS } },
      });
      const destinoLibre =
        mesaDestinoTx.estado === 'libre' && otroEnDestino == null;

      const validacion = validarTransferenciaPedido({
        origen_mesa_numero: pedido.mesa.numero,
        destino_mesa_numero: mesaNueva.numero,
        destino_libre: destinoLibre,
        mesas_virtuales: opRow,
      });
      if (validacion.accion === 'rechazar') {
        throw new ConflictException(validacion.mensaje);
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
      if (
        restantesOrigen === 0 &&
        !(await this.esMesaVirtualNumero(pedido.mesa.numero))
      ) {
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
        es_bebida: categoriaEsBebida(d.producto.categoria),
        es_acompanamiento_mazorca: d.producto.esAcompanamientoMazorca,
        es_empacable: d.producto.esEmpacable,
        categoria_nombre: d.producto.categoria.nombre,
        id_detalle_padre: d.idDetallePadre,
      }));

      await sincronizarLineaMazorcaAcompanamiento(tx, {
        idPedido,
        numComensales: pedido.numComensales,
        mesaNumero: mesaNueva.numero,
        estadoPedido: pedido.estado,
        idProductoMazorca: op.idProductoMazorca,
        usaLineaMazorca: pedidoDebeTenerLineaMazorca(
          mesaNueva.numero,
          detallesMazorcaCtx,
          op.mazorcaActiva,
        ),
      });
    });

    this.emit(idPedido, mesaAnteriorId, pedido.idUsuario);
    this.emit(idPedido, mesaNueva.idMesa, pedido.idUsuario);
    return this.obtenerPorIdTrasEscritura(idPedido);
  }

  async cambiarEstado(idPedido: number, estado: EstadoPedido) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { idPedido },
    });
    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }
    validarTransicionEstadoPedido(pedido.estado, estado);
    if (pedido.estado === estado) {
      return this.obtenerPorIdTrasEscritura(idPedido);
    }
    await this.prisma.pedido.update({
      where: { idPedido },
      data: { estado },
    });
    this.emit(idPedido, pedido.idMesa, pedido.idUsuario);
    return this.obtenerPorIdTrasEscritura(idPedido);
  }

  async setPrioridadCocina(
    idPedido: number,
    modo: 'alta' | 'baja' | 'auto',
  ) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { idPedido },
    });
    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }
    if (!ABIERTOS.includes(pedido.estado)) {
      throw new ConflictException(
        'Solo pedidos abiertos o en cocina admiten prioridad de cocina',
      );
    }
    const data: { prioridadCocinaOverride: PrioridadCocina | null } = {
      prioridadCocinaOverride:
        modo === 'auto' ? null : (modo as PrioridadCocina),
    };
    await this.prisma.pedido.update({
      where: { idPedido },
      data,
    });
    this.emit(idPedido, pedido.idMesa, pedido.idUsuario);
    return this.obtenerPorIdTrasEscritura(idPedido);
  }

  private lineaFacturaDesdePedidoSerial(
    d: {
      id_detalle: number;
      id_producto?: number;
      id_detalle_padre: number | null;
      nombre_producto: string;
      cantidad: number;
      precio_unitario: number;
      subtotal_linea?: number;
      nota_cocina?: string | null;
      cobrado?: boolean;
      personalizaciones?: {
        id_opcion?: number;
        descripcion: string;
        tipo?: string;
      }[];
      categoria_nombre?: string;
      es_plato_principal?: boolean;
      es_bebida?: boolean;
      es_empacable?: boolean;
      es_acompanamiento_mazorca?: boolean;
    },
    cantidadOverride?: number,
  ): LineaFacturaAgrupable {
    const cantidad = cantidadOverride ?? d.cantidad;
    const pu = d.precio_unitario;
    return {
      id_detalle: d.id_detalle,
      id_producto: d.id_producto,
      id_detalle_padre: d.id_detalle_padre,
      nombre_producto: d.nombre_producto,
      cantidad,
      precio_unitario: pu,
      subtotal_linea:
        cantidadOverride != null ? pu * cantidad : (d.subtotal_linea ?? pu * cantidad),
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

  private lineaFacturaDesdePrismaResumen(d: {
    idDetalle: number;
    idProducto: number;
    idDetallePadre: number | null;
    cantidad: number;
    precioUnitario: Prisma.Decimal;
    notaCocina: string | null;
    producto: {
      nombre: string;
      esPlatoPrincipal: boolean;
      esEmpacable: boolean;
      esAcompanamientoMazorca: boolean;
      categoria: {
        nombre: string;
        esBebida: boolean;
        esLineaEmpaque: boolean;
      };
    };
    personalizaciones: {
      opcion: { idOpcion: number; descripcion: string };
    }[];
  }): LineaFacturaAgrupable {
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

  private serializarPedido(
    p: Prisma.PedidoGetPayload<{
      include: {
        mesa: true;
        usuario: { include: { rol: true } };
        detalles: {
          include: {
            producto: { include: { categoria: true } };
            personalizaciones: { include: { opcion: true } };
          };
        };
        facturas: true;
      };
    }>,
  ) {
    const detalles = p.detalles.map((d) => {
      const esSaldoRestante =
        esNotaSaldoRestantePendiente(d.notaCocina) ||
        (d.notaCocina ?? '').trim().startsWith(SALDO_ABONO_NOTA);
      const esCuotaPend =
        d.producto.esCuotaPendienteReparto ||
        parseCuotaPendienteNota(d.notaCocina) != null ||
        esSaldoRestante;
      const marcar = esCuotaPend
        ? false
        : debeMarcarCocina(
            d.producto.categoria,
            d.producto.esEmpacable,
          );
      const tipoProteina = tipoProteinaResuelto(
        d.producto.tipoProteina,
        d.producto.categoria.nombre,
        d.producto.nombre,
      );
      const nombreProducto = esNotaSaldoRestantePendiente(d.notaCocina)
        ? NOMBRE_DISPLAY_SALDO_PENDIENTE
        : (d.notaCocina ?? '').trim().startsWith(SALDO_ABONO_NOTA)
          ? 'Abono'
          : esCuotaPend
            ? nombreProductoCuotaPendienteDisplay(
                d.producto.nombre,
                d.notaCocina,
              )
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
        es_bebida: categoriaEsBebida(d.producto.categoria),
        es_empacable: d.producto.esEmpacable,
        es_plato_principal: d.producto.esPlatoPrincipal,
        es_acompanamiento_mazorca: d.producto.esAcompanamientoMazorca,
        es_cuota_pendiente_reparto: esCuotaPend,
        marcar_cocina: marcar,
        enviado_cocina: d.enviadoCocina,
        listo_para_recoger: d.listoParaRecoger,
        listo_cocina: d.listoCocina,
        cantidad: d.cantidad,
        precio_unitario: Number(d.precioUnitario),
        subtotal_linea: Number(d.precioUnitario) * d.cantidad,
        nota_cocina: d.notaCocina,
        cobrado:
          d.idFactura != null ||
          (!esCuotaPend && d.producto.esAcompanamientoMazorca),
        id_factura: d.idFactura,
        personalizaciones: d.personalizaciones.map((dp) => ({
          id_opcion: dp.opcion.idOpcion,
          tipo: dp.opcion.tipo,
          descripcion: dp.opcion.descripcion,
        })),
      };
    });
    const prioridadAuto = prioridadAutomaticaDesdeDetalles(
      detalles.map((d) => ({
        categoria_nombre: d.categoria_nombre,
        nombre_producto: d.nombre_producto,
        marcar_cocina: d.marcar_cocina,
      })),
    );
    const override = p.prioridadCocinaOverride ?? null;
    const { nivel: prioridadCocina, origen: prioridadCocinaOrigen } =
      prioridadCocinaEfectiva(prioridadAuto, override);
    const facturas = p.facturas.map((f) => this.mapFacturaSerial(f));
    const ultimaFactura = facturas.length ? facturas[facturas.length - 1] : null;
    const pendientesComida = detalles.filter(
      (d) =>
        !d.cobrado &&
        !d.es_cuota_pendiente_reparto &&
        !d.es_acompanamiento_mazorca &&
        d.subtotal_linea > 0,
    );
    const totalPendiente = pendientesComida.reduce(
      (s, d) => s + d.subtotal_linea,
      0,
    );
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
      prioridad_cocina_override:
        override === null ? null : override,
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
      cuotas_plan_omitidas: [] as CuotaPlanOmitidaRegistro[],
      cobro_pendiente: {
        items: pendientesComida.length,
        subtotal: totalPendiente,
      },
    };
  }
}
