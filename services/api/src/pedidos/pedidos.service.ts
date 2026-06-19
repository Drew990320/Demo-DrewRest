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
  EstadoPedido,
  MetodoPago,
  Prisma,
  PrioridadCocina,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PedidosGateway } from './pedidos.gateway';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { AddDetalleDto } from './dto/add-detalle.dto';
import { FacturarDto } from './dto/facturar.dto';
import { DetalleCobroDto } from './dto/detalle-cobro.dto';
import { ImprimirPrecuentaDto } from './dto/imprimir-precuenta.dto';
import { UpsertCajaDiariaDto } from './dto/caja-diaria.dto';
import { TransferirPedidoDto } from './dto/transferir.dto';
import { PatchDetalleCocinaDto } from './dto/patch-detalle-cocina.dto';
import { PatchDetalleCantidadDto } from './dto/patch-detalle-cantidad.dto';
import { lineasFacturaParaTicket } from './factura-lineas-group';
import { lineasComandaParaTicket } from './comanda-lineas-group';
import {
  MESA_MOSTRADOR_NUMERO,
  MESA_PARA_LLEVAR_NUMERO,
} from '../mesas/mesas.service';
import { mesaDisponibleHoyBogota } from '../common/mesa-dia';
import { weekdayBogota } from '../common/timezone';
import { categoriaDisponibleEnDia } from '../common/categoria-dia';
import {
  categoriaEsBebida,
  debeMarcarCocina,
} from '@la-reserva/shared-domain/cocina-producto';
import { agregarVentasResumenDiario } from '@la-reserva/shared-domain/resumen-diario-ventas';
import {
  pedidoDebeTenerLineaMazorca,
  validarTransferenciaPedido,
} from '@la-reserva/shared-domain/transferencia-pedido';
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
import { ComandaPrinterService, type ResultadoImpresion } from './comanda-printer.service';
import {
  type ComandaLinea,
  type ComandaTicket,
  etiquetaMesaComanda,
} from './comanda-ticket';
import type { FacturaTicket } from './factura-ticket';
import type { CierreCajaTicket } from './cierre-caja-ticket';
import {
  calcularDescuentosPedido,
  type ConfigDescuentoCalc,
  type LineaDescuento,
  UMBRAL_SUBTOTAL_OTROS_COP,
} from './descuentos-pedido';
import { UpsertConfigDescuentosDto } from './dto/upsert-config-descuentos.dto';
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
  sincronizarLineaMazorcaAcompanamiento,
} from './mazorca-linea-pedido';

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
  if (categoriaEsBebida(d.producto.categoria.nombre)) return false;
  if (d.producto.esEmpacable) return false;
  return debeMarcarCocina(
    d.producto.categoria.nombre,
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
    row: {
      id: number;
      sopasActivo: boolean;
      sopasMontoPorUnidad: Prisma.Decimal;
      mulerosActivo: boolean;
      mulerosMontoPorUnidad: Prisma.Decimal;
    };
    expiresAt: number;
  } | null = null;

  private static readonly CONFIG_CACHE_TTL_MS = 60_000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: PedidosGateway,
    private readonly comandaPrinter: ComandaPrinterService,
  ) {}

  private emit(pedidoId: number, mesaId: number, idUsuario: number) {
    this.gateway.emitPedidoActualizado(pedidoId, mesaId, idUsuario);
  }

  private async notificarCompaneroAgregoItems(
    pedido: { idPedido: number; idMesa: number; idUsuario: number },
    idUsuarioActor: number,
    lineas: { nombre_producto: string; cantidad: number }[],
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

  estadoImpresora() {
    return this.comandaPrinter.consultarEstadoPapel();
  }

  /** Mesas 98 (para llevar) y 99 (mostrador): varios pedidos abiertos a la vez. */
  private esMesaVirtualNumero(numero: number): boolean {
    return (
      numero === MESA_PARA_LLEVAR_NUMERO || numero === MESA_MOSTRADOR_NUMERO
    );
  }

  private fechaCalendarioBogota(dt: DateTime): Date {
    return new Date(Date.UTC(dt.year, dt.month - 1, dt.day));
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

  private mapConfigDescuentos(row: {
    sopasActivo: boolean;
    sopasMontoPorUnidad: Prisma.Decimal;
    mulerosActivo: boolean;
    mulerosMontoPorUnidad: Prisma.Decimal;
  }) {
    return {
      sopas_activo: row.sopasActivo,
      sopas_monto_por_unidad: Math.round(Number(row.sopasMontoPorUnidad)),
      muleros_activo: row.mulerosActivo,
      muleros_monto_por_plato_principal: Math.round(
        Number(row.mulerosMontoPorUnidad),
      ),
      umbral_subtotal_otros: UMBRAL_SUBTOTAL_OTROS_COP,
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
    const existing = await this.ensureConfigDescuentos();
    const row = await this.prisma.configDescuento.update({
      where: { id: 1 },
      data: {
        ...(dto.sopas_activo != null ? { sopasActivo: dto.sopas_activo } : {}),
        ...(dto.sopas_monto_por_unidad != null
          ? { sopasMontoPorUnidad: Math.round(dto.sopas_monto_por_unidad) }
          : {}),
        ...(dto.muleros_activo != null ? { mulerosActivo: dto.muleros_activo } : {}),
        ...(dto.muleros_monto_por_plato_principal != null
          ? {
              mulerosMontoPorUnidad: Math.round(
                dto.muleros_monto_por_plato_principal,
              ),
            }
          : {}),
      },
    });
    if (
      dto.sopas_activo &&
      Math.round(Number(row.sopasMontoPorUnidad)) <= 0 &&
      dto.sopas_monto_por_unidad == null &&
      Number(existing.sopasMontoPorUnidad) <= 0
    ) {
      throw new BadRequestException(
        'Indica el monto por unidad de sopa al activar el descuento',
      );
    }
    if (
      dto.muleros_activo &&
      Math.round(Number(row.mulerosMontoPorUnidad)) <= 0 &&
      dto.muleros_monto_por_plato_principal == null &&
      Number(existing.mulerosMontoPorUnidad) <= 0
    ) {
      throw new BadRequestException(
        'Indica el monto por plato principal al activar el descuento de camioneros',
      );
    }
    this.invalidateConfigDescuentosCache();
    return this.mapConfigDescuentos(row);
  }

  private lineasParaDescuento(
    detalles: {
      cantidad: number;
      precioUnitario: Prisma.Decimal;
      producto: {
        nombre: string;
        categoria: { nombre: string };
        esPlatoPrincipal: boolean;
      };
    }[],
  ): LineaDescuento[] {
    return detalles.map((d) => ({
      cantidad: d.cantidad,
      subtotal_linea: Number(d.precioUnitario) * d.cantidad,
      nombre_producto: d.producto.nombre,
      categoria_nombre: d.producto.categoria.nombre,
      es_plato_principal: d.producto.esPlatoPrincipal,
    }));
  }

  private descuentosDesdeConfig(
    lineas: LineaDescuento[],
    config: ConfigDescuentoCalc,
    clienteMulero: boolean,
  ) {
    return calcularDescuentosPedido(lineas, config, clienteMulero);
  }

  private mapFacturaSerial(f: {
    idFactura: number;
    subtotal: Prisma.Decimal;
    descuentoSopas: Prisma.Decimal;
    descuentoMuleros: Prisma.Decimal;
    total: Prisma.Decimal;
    metodoPago: MetodoPago;
    emitidaEn: Date;
    esParcial: boolean;
  }) {
    return {
      id_factura: f.idFactura,
      subtotal: Number(f.subtotal),
      descuento_sopas: Number(f.descuentoSopas),
      descuento_muleros: Number(f.descuentoMuleros),
      total: Number(f.total),
      metodo_pago:
        f.metodoPago === 'tarjeta' ? 'transferencia' : f.metodoPago,
      emitida_en: f.emitidaEn,
      es_parcial: f.esParcial,
    };
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
                    producto: { select: { nombre: true } },
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

    const totalesPorMetodo = {
      efectivo: 0,
      transferencia: 0,
    };

    const byMesa = new Map<number, { pedidos: number; total: number }>();
    let totalFacturado = 0;
    for (const f of facturas) {
      const t = Number(f.total);
      totalFacturado += t;
      if (f.metodoPago === 'efectivo') totalesPorMetodo.efectivo += t;
      else {
        /* transferencia y registros históricos con tarjeta */
        totalesPorMetodo.transferencia += t;
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
        total: Number(f.total),
        metodo_pago: f.metodoPago,
        emitida_en: f.emitidaEn.toISOString(),
        es_parcial: f.esParcial,
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
          producto: { nombre: string };
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
            .map((d) => {
              const pu = Number(d.precioUnitario);
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
              };
            }),
        ),
      };
    });

    const efectivoEsperadoEnCaja =
      montoBaseEfectivo + totalesPorMetodo.efectivo;

    const detallesFacturados = await this.prisma.detallePedido.findMany({
      where: {
        idFactura: { not: null },
        factura: { emitidaEn: { gte: start, lt: end } },
        producto: { esAcompanamientoMazorca: false },
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

    return {
      fecha: base.toFormat('yyyy-LL-dd'),
      total_facturado: totalFacturado,
      total_facturas: facturas.length,
      total_mesas_atendidas: mesas.length,
      mesas,
      pedidos_detalle: pedidosDetalle,
      monto_base_efectivo: montoBaseEfectivo,
      totales_por_metodo: totalesPorMetodo,
      efectivo_esperado_en_caja: efectivoEsperadoEnCaja,
      platos_por_categoria: ventas.platos_por_categoria,
      items_menu: ventas.items_menu,
    };
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
                producto: { select: { nombre: true } },
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
        f.pedido.detalles.map((d) => {
          const pu = Number(d.precioUnitario);
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
          };
        }),
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

        if (detenidoSinPapel) break;

        const factura = await this.imprimirFacturaPorId(ped.id_factura);
        if (factura.impreso) {
          facturasImpresas += 1;
        } else {
          errores.push(
            `Pedido #${ped.id_pedido} factura: ${factura.error ?? 'sin imprimir'}`,
          );
          if (factura.codigo_error === 'sin_papel') {
            detenidoSinPapel = true;
            this.emitirAlertaImpresora(factura, 'factura', ped.id_pedido);
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

  /** Imprime un único ticket con totales del día (cierre resumido). */
  async imprimirResumenDiarioTotal(fecha?: string) {
    const resumen = await this.resumenDiario(fecha);
    const ticket: CierreCajaTicket = {
      fecha: resumen.fecha,
      total_facturado: resumen.total_facturado,
      total_facturas: resumen.total_facturas,
      monto_base_efectivo: resumen.monto_base_efectivo,
      totales_por_metodo: resumen.totales_por_metodo,
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
        debeMarcarCocina(d.producto.categoria.nombre, d.producto.esEmpacable) &&
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
    const virtual = this.esMesaVirtualNumero(mesa.numero);
    if (!virtual) {
      if (mesa.estado !== 'libre') {
        throw new ConflictException('La mesa no está libre');
      }
      const otro = await this.prisma.pedido.findFirst({
        where: {
          idMesa: dto.id_mesa,
          estado: { in: ABIERTOS },
        },
      });
      if (otro) {
        throw new ConflictException('Ya existe un pedido abierto en esta mesa');
      }
    }

    const modoServicio =
      mesa.numero === MESA_PARA_LLEVAR_NUMERO ? 'para_llevar' : 'en_mesa';

    const pedido = await this.prisma.$transaction(async (tx) => {
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
      });
      return p;
    });

    this.emit(pedido.idPedido, pedido.idMesa, pedido.idUsuario);
    return this.obtenerPorId(pedido.idPedido);
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
      include: {
        mesa: true,
        usuario: { include: { rol: true } },
        detalles: {
          include: detalleInclude,
          orderBy: { idDetalle: 'asc' },
        },
        facturas: facturasInclude,
      },
      orderBy: orderByPrisma,
      take: pagination?.limit,
      skip: pagination?.offset,
    });
    const serializados = rows.map((p) => this.serializarPedido(p));
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

    for (const p of rows) {
      pedidoIds.push(p.idPedido);
      mesaIds.push(p.idMesa);
      const numero = p.mesa.numero;
      if (numero === 99) pedidosMostrador += 1;
      if (numero === 98) pedidosParaLlevar += 1;

      for (const d of p.detalles) {
        const cat = d.producto.categoria.nombre;
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

  /**
   * Pedidos de otros meseros con platos pendientes de recoger en cocina
   * (para que un compañero pueda confirmar la recogida).
   */
  async listarAyudaCompaneros(actor: {
    idUsuario: number;
    rol: { nombre: string };
  }) {
    if (actor.rol.nombre !== 'mesero' && actor.rol.nombre !== 'admin') {
      return { pedidos: [], total_platos_para_recoger: 0 };
    }
    const rows = await this.prisma.pedido.findMany({
      where: {
        estado: { in: ABIERTOS },
        idUsuario: { not: actor.idUsuario },
      },
      include: pedidoVistaOperativaInclude,
      orderBy: { creadoEn: 'asc' },
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
    const data = await this.listarAyudaCompaneros(actor);
    return {
      platos_para_recoger: data.total_platos_para_recoger,
      pedidos: data.pedidos.length,
      pedido_ids: data.pedidos.map((p) => p.id_pedido),
      mesa_ids: data.pedidos.map((p) => p.id_mesa),
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
    if (categoriaEsBebida(det.producto.categoria.nombre)) {
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
    if (categoriaEsBebida(det.producto.categoria.nombre)) {
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
      actorRol !== 'admin' &&
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
    if (categoriaEsBebida(det.producto.categoria.nombre)) {
      throw new BadRequestException('Las bebidas no aplican en cocina');
    }
    if (det.producto.esEmpacable) {
      throw new BadRequestException('Los empaques no aplican en cocina');
    }
    if (
      !debeMarcarCocina(
        det.producto.categoria.nombre,
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
    return rows.map((row) => this.serializarPedido(row));
  }

  async obtenerPorId(idPedido: number) {
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

    const ctxMazorca = p.detalles.map((d) => ({
      es_bebida: categoriaEsBebida(d.producto.categoria.nombre),
      es_acompanamiento_mazorca: d.producto.esAcompanamientoMazorca,
      es_empacable: d.producto.esEmpacable,
      categoria_nombre: d.producto.categoria.nombre,
      listo_para_recoger: d.listoParaRecoger,
      id_detalle_padre: d.idDetallePadre,
    }));
    const debeMz = pedidoDebeTenerLineaMazorca(p.mesa.numero, ctxMazorca);
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
    const configRow = await this.obtenerConfigDescuentosRow();
    const config = this.mapConfigDescuentos(configRow);
    const pendientes = p.detalles.filter((d) => d.idFactura == null);
    if (pendientes.length > 0) {
      const lineas = this.lineasParaDescuento(pendientes);
      return {
        ...serialized,
        descuentos_estimados: this.descuentosDesdeConfig(
          lineas,
          config,
          p.clienteMulero,
        ),
      };
    }
    return serialized;
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
      data: { clienteMulero },
    });
    this.emit(idPedido, pedido.idMesa, pedido.idUsuario);
    return this.obtenerPorId(idPedido);
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
      });
    });
    this.emit(idPedido, pedido.idMesa, pedido.idUsuario);
    return this.obtenerPorId(idPedido);
  }

  async agregarDetalle(
    idPedido: number,
    dto: AddDetalleDto,
    idUsuario: number,
  ) {
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
      return this.actualizarCantidadDetalle(
        fusion.idDetalle,
        { cantidad: fusion.cantidad + dto.cantidad },
        idUsuario,
      );
    }

    const sinEmpaque = dto.sin_empaque_auto === true;
    const debeAutoEmpaque =
      pedido.modoServicio === 'para_llevar' &&
      productoCobraEmpaqueParaLlevarPorPlatoFuerte(producto) &&
      !sinEmpaque;

    const lineasAgregadas: {
      id_detalle: number;
      nombre_producto: string;
      cantidad: number;
    }[] = [];

    await this.prisma.$transaction(async (tx) => {
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
            precioUnitario: precioEmpaqueParaLlevarDecimal(),
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

      if (debeMarcarCocina(producto.categoria.nombre, producto.esEmpacable)) {
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
            es_bebida: categoriaEsBebida(d.producto.categoria.nombre),
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
            usaLineaMazorca: pedidoDebeTenerLineaMazorca(mesa.numero, ctx),
          });
        }
      }
    });

    await this.notificarCompaneroAgregoItems(
      pedido,
      idUsuario,
      lineasAgregadas.filter((l) => l.nombre_producto === producto.nombre),
    );

    this.emit(idPedido, pedido.idMesa, pedido.idUsuario);
    return this.obtenerPorId(idPedido);
  }

  async eliminarDetalle(idDetalle: number, idUsuario: number) {
    const det = await this.prisma.detallePedido.findUnique({
      where: { idDetalle },
      include: { pedido: true, producto: true },
    });
    if (!det) {
      throw new NotFoundException('Línea no encontrada');
    }
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
    this.emit(pedidoId, mesaId, det.pedido.idUsuario);
    return this.obtenerPorId(pedidoId);
  }

  async actualizarCantidadDetalle(
    idDetalle: number,
    dto: PatchDetalleCantidadDto,
    idUsuario: number,
  ) {
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
      return this.obtenerPorId(det.pedido.idPedido);
    }
    const marcarCocina = debeMarcarCocina(
      det.producto.categoria.nombre,
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
      await this.notificarCompaneroAgregoItems(det.pedido, idUsuario, [
        { nombre_producto: det.producto.nombre, cantidad: delta },
      ]);
      this.emit(det.pedido.idPedido, det.pedido.idMesa, det.pedido.idUsuario);
      return this.obtenerPorId(det.pedido.idPedido);
    }
    if (cantidad > det.cantidad) {
      await this.notificarCompaneroAgregoItems(det.pedido, idUsuario, [
        {
          nombre_producto: det.producto.nombre,
          cantidad: cantidad - det.cantidad,
        },
      ]);
    }
    const hijosPre =
      det.idDetallePadre == null
        ? await this.prisma.detallePedido.findMany({
            where: { idDetallePadre: idDetalle },
          })
        : [];
    await this.prisma.$transaction(async (tx) => {
      await tx.detallePedido.update({
        where: { idDetalle },
        data: { cantidad },
      });
      if (det.idDetallePadre == null) {
        const hijos = await tx.detallePedido.findMany({
          where: { idDetallePadre: idDetalle },
        });
        for (const h of hijos) {
          await tx.detallePedido.update({
            where: { idDetalle: h.idDetalle },
            data: { cantidad },
          });
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
    return this.obtenerPorId(det.pedido.idPedido);
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
  async pasarCocina(idPedido: number) {
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
      debeMarcarCocina(d.producto.categoria.nombre, d.producto.esEmpacable) &&
      !d.enviadoCocina,
    );
    if (pendientes.length === 0) {
      throw new BadRequestException(
        'No hay platos nuevos para cocina (las bebidas solo se cobran al final)',
      );
    }

    const esAdicional = pedido.detalles.some(
      (d) =>
        debeMarcarCocina(d.producto.categoria.nombre, d.producto.esEmpacable) &&
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

  /** Reimprime comanda de cocina (platos ya enviados, sin bebidas ni precios). */
  async reimprimirComanda(idPedido: number) {
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
        debeMarcarCocina(d.producto.categoria.nombre, d.producto.esEmpacable) &&
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

  /** Reimprime una factura del pedido (por defecto la última). */
  async reimprimirFactura(idPedido: number, idFactura?: number) {
    const completo = await this.obtenerPorId(idPedido);
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
    const completo = await this.obtenerPorId(idPedido);
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
  async imprimirPrecuenta(idPedido: number, dto: ImprimirPrecuentaDto) {
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
        es_plato_principal: d.producto.esPlatoPrincipal,
      })),
      solicitudes,
    );
    const { descuento_sopas, descuento_muleros } = this.descuentosDesdeConfig(
      lineas,
      config,
      pedido.clienteMulero,
    );
    const descTotal = new Prisma.Decimal(descuento_sopas).add(
      new Prisma.Decimal(descuento_muleros),
    );
    if (descTotal.gt(subtotal)) {
      throw new BadRequestException(
        'La suma de descuentos no puede superar el subtotal de esta cuenta',
      );
    }
    const total = subtotal.sub(descTotal);

    const completo = await this.obtenerPorId(idPedido);
    const esTandaParcial = quedaPendienteTrasCobro(detallesSerial, solicitudes);
    const ticket = this.construirTicketPrecuenta(
      completo,
      solicitudes,
      {
        subtotal: Number(subtotal),
        descuento_sopas,
        descuento_muleros,
        total: Number(total),
      },
      esTandaParcial,
    );

    const conCopia = dto.factura_con_copia === true;
    const impresion = this.encolarImpresionFactura(
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

  private construirTicketFactura(
    completo: Awaited<ReturnType<PedidosService['obtenerPorId']>>,
    idFactura: number,
    esReimpresion = false,
  ): FacturaTicket {
    const factura = (completo.facturas ?? []).find(
      (f) => f.id_factura === idFactura,
    );
    if (!factura) {
      throw new BadRequestException('Factura no encontrada en el pedido');
    }
    const meseroStr = completo.mesero
      ? `${completo.mesero.nombre} ${completo.mesero.apellido}`.trim()
      : '';
    const lineas = completo.detalles.filter(
      (d) => d.id_factura === idFactura,
    );
    return {
      id_pedido: completo.id_pedido,
      id_factura: factura.id_factura,
      mesa_numero: completo.mesa_numero,
      mesa_etiqueta: etiquetaMesaComanda(completo.mesa_numero),
      num_comensales: completo.num_comensales,
      mesero: meseroStr,
      modo_servicio: completo.modo_servicio,
      lineas: lineasFacturaParaTicket(
        lineas.map((d) => ({
          id_detalle: d.id_detalle,
          id_producto: d.id_producto,
          id_detalle_padre: d.id_detalle_padre,
          nombre_producto: d.nombre_producto,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          subtotal_linea: d.subtotal_linea,
          nota_cocina: d.nota_cocina,
          cobrado: d.cobrado,
          personalizaciones: d.personalizaciones,
        })),
      ),
      subtotal: factura.subtotal,
      descuento_sopas: factura.descuento_sopas,
      descuento_muleros: factura.descuento_muleros,
      total: factura.total,
      metodo_pago: factura.metodo_pago as FacturaTicket['metodo_pago'],
      emitida_en: String(factura.emitida_en),
      es_reimpresion: esReimpresion || undefined,
      es_cobro_parcial: factura.es_parcial || undefined,
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
    const lineasCobradas = completo.detalles.filter((d) => d.cobrado);
    const cobrosResumen = facturas.map((f) => ({
      metodo_pago: f.metodo_pago as NonNullable<FacturaTicket['metodo_pago']>,
      total: f.total,
    }));
    const metodos = new Set(cobrosResumen.map((c) => c.metodo_pago));
    const ultima = facturas[facturas.length - 1];
    return {
      id_pedido: completo.id_pedido,
      mesa_numero: completo.mesa_numero,
      mesa_etiqueta: etiquetaMesaComanda(completo.mesa_numero),
      num_comensales: completo.num_comensales,
      mesero: meseroStr,
      modo_servicio: completo.modo_servicio,
      lineas: lineasFacturaParaTicket(
        lineasCobradas.map((d) => ({
          id_detalle: d.id_detalle,
          id_producto: d.id_producto,
          id_detalle_padre: d.id_detalle_padre,
          nombre_producto: d.nombre_producto,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          subtotal_linea: d.subtotal_linea,
          nota_cocina: d.nota_cocina,
          cobrado: d.cobrado,
          personalizaciones: d.personalizaciones,
        })),
      ),
      subtotal: facturas.reduce((s, f) => s + f.subtotal, 0),
      descuento_sopas: facturas.reduce((s, f) => s + f.descuento_sopas, 0),
      descuento_muleros: facturas.reduce((s, f) => s + f.descuento_muleros, 0),
      total: facturas.reduce((s, f) => s + f.total, 0),
      metodo_pago:
        metodos.size === 1
          ? cobrosResumen[0].metodo_pago
          : undefined,
      emitida_en: String(ultima.emitida_en),
      es_reimpresion: esReimpresion || undefined,
      es_total_pedido: true,
      cobros_resumen: facturas.length > 1 ? cobrosResumen : undefined,
    };
  }

  private construirTicketPrecuenta(
    completo: Awaited<ReturnType<PedidosService['obtenerPorId']>>,
    solicitudes: DetalleCobroCantidad[],
    totals: {
      subtotal: number;
      descuento_sopas: number;
      descuento_muleros: number;
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
      .map((d) => ({
        id_detalle: d.id_detalle,
        id_producto: d.id_producto,
        id_detalle_padre: d.id_detalle_padre,
        nombre_producto: d.nombre_producto,
        cantidad: qty.get(d.id_detalle)!,
        precio_unitario: d.precio_unitario,
        subtotal_linea: d.precio_unitario * qty.get(d.id_detalle)!,
        nota_cocina: d.nota_cocina,
        cobrado: d.cobrado,
        personalizaciones: d.personalizaciones,
      }));
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
      throw new BadRequestException('Algún ítem ya fue cobrado');
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
        es_plato_principal: d.producto.esPlatoPrincipal,
      })),
      solicitudes,
    );
    const { descuento_sopas, descuento_muleros } = this.descuentosDesdeConfig(
      lineas,
      config,
      pedido.clienteMulero,
    );
    const descSopas = descuento_sopas;
    const descMuleros = descuento_muleros;

    const dS = new Prisma.Decimal(descSopas);
    const dM = new Prisma.Decimal(descMuleros);
    const descTotal = dS.add(dM);
    if (descTotal.gt(subtotal)) {
      throw new BadRequestException(
        'La suma de descuentos no puede superar el subtotal de esta cuenta',
      );
    }
    const total = subtotal.sub(descTotal);

    const esParcial = quedaPendienteTrasCobro(detallesSerial, solicitudes);

    let idFacturaCreada = 0;

    try {
      await this.prisma.$transaction(async (tx) => {
        const factura = await tx.factura.create({
          data: {
            idPedido,
            idUsuario,
            subtotal,
            descuentoSopas: dS,
            descuentoMuleros: dM,
            total,
            metodoPago: dto.metodo_pago as MetodoPago,
            esParcial,
          },
        });
        idFacturaCreada = factura.idFactura;

        const byId = new Map(pedido.detalles.map((d) => [d.idDetalle, d]));
        for (const s of solicitudes) {
          const det = byId.get(s.id_detalle);
          if (!det) continue;
          await this.aplicarCobroDetalleEnTx(
            tx,
            det,
            s.cantidad,
            factura.idFactura,
          );
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
            where: { idMesa: pedido.idMesa, estado: { in: ABIERTOS } },
          });
          if (abiertosRest === 0) {
            await tx.mesa.update({
              where: { idMesa: pedido.idMesa },
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

    const completo = await this.obtenerPorId(idPedido);
    const ticketFactura = this.construirTicketFactura(
      completo,
      idFacturaCreada,
      false,
    );
    const conCopia =
      dto.imprimir_factura !== false && dto.factura_con_copia === true;

    const impresionFactura =
      dto.imprimir_factura === false
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

  /** Cancela el pedido (solo si está abierto/en cocina y sin cobros), libera la mesa y elimina el pedido. */
  async cancelar(idPedido: number) {
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
  async transferir(idPedido: number, dto: TransferirPedidoDto) {
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
    const destinoLibre =
      mesaNueva.estado === 'libre' && pedidoEnDestino == null;

    const validacion = validarTransferenciaPedido({
      origen_mesa_numero: pedido.mesa.numero,
      destino_mesa_numero: mesaNueva.numero,
      destino_libre: destinoLibre,
    });
    if (validacion.accion === 'rechazar') {
      throw new ConflictException(validacion.mensaje);
    }

    const mesaAnteriorId = pedido.idMesa;

    await this.prisma.$transaction(async (tx) => {
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
        !this.esMesaVirtualNumero(pedido.mesa.numero)
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
        es_bebida: categoriaEsBebida(d.producto.categoria.nombre),
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
        usaLineaMazorca: pedidoDebeTenerLineaMazorca(
          mesaNueva.numero,
          detallesMazorcaCtx,
        ),
      });
    });

    this.emit(idPedido, mesaAnteriorId, pedido.idUsuario);
    this.emit(idPedido, mesaNueva.idMesa, pedido.idUsuario);
    return this.obtenerPorId(idPedido);
  }

  async cambiarEstado(idPedido: number, estado: EstadoPedido) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { idPedido },
    });
    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }
    if (pedido.estado === 'facturado') {
      throw new ConflictException('Pedido ya cerrado');
    }
    await this.prisma.pedido.update({
      where: { idPedido },
      data: { estado },
    });
    this.emit(idPedido, pedido.idMesa, pedido.idUsuario);
    return this.obtenerPorId(idPedido);
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
    return this.obtenerPorId(idPedido);
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
    const catBebida = (nombre: string) => categoriaEsBebida(nombre);
    const detalles = p.detalles.map((d) => {
      const marcar = debeMarcarCocina(
        d.producto.categoria.nombre,
        d.producto.esEmpacable,
      );
      const tipoProteina = tipoProteinaResuelto(
        d.producto.tipoProteina,
        d.producto.categoria.nombre,
        d.producto.nombre,
      );
      return {
        id_detalle: d.idDetalle,
        id_producto: d.idProducto,
        id_detalle_padre: d.idDetallePadre,
        nombre_producto: d.producto.nombre,
        categoria_nombre: d.producto.categoria.nombre,
        tipo_proteina: tipoProteina,
        es_bebida: catBebida(d.producto.categoria.nombre),
        es_empacable: d.producto.esEmpacable,
        es_plato_principal: d.producto.esPlatoPrincipal,
        es_acompanamiento_mazorca: d.producto.esAcompanamientoMazorca,
        marcar_cocina: marcar,
        enviado_cocina: d.enviadoCocina,
        listo_para_recoger: d.listoParaRecoger,
        listo_cocina: d.listoCocina,
        cantidad: d.cantidad,
        precio_unitario: Number(d.precioUnitario),
        subtotal_linea: Number(d.precioUnitario) * d.cantidad,
        nota_cocina: d.notaCocina,
        cobrado: d.idFactura != null || d.producto.esAcompanamientoMazorca,
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
    const pendientes = detalles.filter((d) => !d.cobrado);
    const totalPendiente = pendientes.reduce(
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
      cobro_pendiente: {
        items: pendientes.length,
        subtotal: totalPendiente,
      },
    };
  }
}
