import { buildLocalCategorias, buildLocalMenuProductos } from '../data/local-menu-seed';
import type { CategoriaLocal } from '../data/local-menu-seed';
import { notifyMesasInvalidated } from './mesas-sync';
import { notifyConfigUpdated } from './config-sync';
import { notifyAuthSesionInvalidada } from './auth-session';
import { dispatchCompaneroModificoPedido } from './pedido-sync';
import { ApiHttpError } from './api-error';
import { deleteOfflineCache } from './offline-cache';
import { storage } from './storage';
import type { Producto } from './local-api-types';
import {
  inferirTipoProteina,
  ordenarPedidosCocina,
  prioridadAutomaticaDesdeDetalles,
  prioridadCocinaEfectiva,
  tipoProteinaResuelto,
  type TipoProteina,
} from './cocina-prioridad';
import { ordenarPedidosCocinaPorLlegada } from './cocina-pedido-view';
import {
  PRECIO_EMPAQUE_PARA_LLEVAR_COP,
  empaqueFaltanteEnDetallePadre,
  flagsProductoMenuPorCategoria,
  nuevaCantidadEmpaqueTrasCambioPadre,
  productoCobraEmpaqueParaLlevarPorPlatoFuerte,
} from './empaque-para-llevar';
import {
  calcularDescuentosPedido,
  MULEROS_MIN_PLATOS_PRINCIPALES_DEFAULT,
  resolverConfigPromociones,
  SOPAS_MIN_UNIDADES_DEFAULT,
  UMBRAL_SUBTOTAL_OTROS_COP,
} from './descuentos-pedido';
import { ETIQUETA_LEGACY_MULERO, parseEtiquetasPedido, parseReglasPromocion } from './promociones-pedido';
import {
  expandirDetallesParaCobro,
  expandirSolicitudesConEmpaques,
  idsDetallesPendientes,
  lineasDescuentoDesdeSolicitudes,
  ordenarSolicitudesCobro,
  quedaPendienteTrasCobro,
  resolverSolicitudesCobro,
  subtotalDesdeSolicitudes,
} from './cobro-parcial';
import { lineasFacturaParaTicket } from './factura-lineas-group';
import { emailMeseroDesdeNombre } from './email-mesero';
import { nombreUsuarioDisplay } from './nombre-usuario-display';
import { pedidoUsaLineaMazorca, esDetalleMazorcaAcompanamiento } from './mazorca-pedido';
import {
  crearLineaMazorcaInicialLocal,
  idProductoMazorcaLocal,
  sincronizarLineaMazorcaLocal,
} from './mazorca-linea-pedido';
import {
  ensureProductoCuotaPendienteLocal,
  formatCuotaPendienteNota,
} from './cuota-pendiente-linea-pedido';
import {
  listarCuotasPlanOmitidas,
  nombreProductoCuotaPendienteDisplay,
} from '@la-reserva/shared-domain/cuota-pendiente-reparto';
import {
  NOMBRE_DISPLAY_SALDO_PENDIENTE,
  SALDO_RESTANTE_FRAGMENTO_NOTA,
  distribuirSaldoEnPlatos,
  esNotaSaldoRestantePendiente,
  formatSaldoRestanteNota,
  parseSaldoRestantePool,
  saldoNecesitaReconciliarAPlatos,
} from '@la-reserva/shared-domain/saldo-restante';
import {
  PERMISOS_MESERO_DEFAULTS,
  PERMISOS_MESERO_KEYS,
  type PermisosMeseroConfig,
  permisosMeseroTodos,
} from '@la-reserva/shared-domain/permisos-mesero';
import {
  inferirReglasCategoriaDesdeNombre,
  type TipoLineaCocinaCategoria,
} from '@la-reserva/shared-domain/categoria-reglas';
import {
  inferirIconoCategoriaDesdeNombre,
  normalizarIconoMenuGuardado,
} from '@la-reserva/shared-domain/categoria-menu-icon';
import {
  productoAgotado,
  productoVisibleEnMenu,
} from '@la-reserva/shared-domain/stock-producto';
import { categoriaDisponibleEnDiaSnake } from '@la-reserva/shared-domain/dias-semana';
import {
  categoriaEsBebida,
  debeMarcarCocina,
} from '@la-reserva/shared-domain/cocina-producto';
import {
  esMesaMostradorNumero,
  esMesaParaLlevarNumero,
  esMesaVirtualNumero,
  MESA_MOSTRADOR_NUMERO,
  MESA_PARA_LLEVAR_NUMERO,
  numerosMesasVirtuales,
  resolverMesasVirtuales,
} from './mesa-label';
import {
  type PatchDisponibilidadMesa,
  validarCambioNumeroMesaAdmin,
  validarDesactivarUsuario,
  validarEliminarMesaAdmin,
  validarNumeroMesaReservado,
  validarPatchMesaAdmin,
} from '@la-reserva/shared-domain/mesa-admin-validacion';
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
import {
  dividirSolicitudesCobroMixto,
  facturasDeTandaCobro,
  nuevoCobroMixtoGrupo,
  repartoMixtoConDevolucion,
} from '@la-reserva/shared-domain/factura-mixto';
import { importesProporcionalesMixto } from '@la-reserva/shared-domain/cobro-invariantes';
import { calcularDetalleExcesoCobro } from '@la-reserva/shared-domain/factura-vuelto';
import type { DetalleCobroCantidad } from '@la-reserva/shared-domain/cobro-parcial';

type ApiOptions = RequestInit & { token?: string | null };

type Rol = 'mesero' | 'chef' | 'admin' | 'superadmin';
type EstadoMesa = 'libre' | 'ocupada' | 'reservada';
type EstadoPedido = 'abierto' | 'en_cocina' | 'facturado';

const ABIERTOS_LOCAL: EstadoPedido[] = ['abierto', 'en_cocina'];

type User = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: Rol;
  password: string;
  activo: boolean;
};

type Mesa = {
  id_mesa: number;
  numero: number;
  capacidad: number;
  estado: EstadoMesa;
  disponible_lunes: boolean;
  disponible_martes: boolean;
  disponible_miercoles: boolean;
  disponible_jueves: boolean;
  disponible_viernes: boolean;
  disponible_sabado: boolean;
  disponible_domingo: boolean;
};

type PedidoDetalle = {
  id_detalle: number;
  id_producto: number;
  id_detalle_padre: number | null;
  cantidad: number;
  precio_unitario: number;
  nota_cocina: string | null;
  opcion_ids: number[];
  listo_cocina: boolean;
  listo_para_recoger: boolean;
  enviado_cocina: boolean;
  id_factura?: number | null;
};

type Pedido = {
  id_pedido: number;
  id_mesa: number;
  id_usuario: number;
  estado: EstadoPedido;
  modo_servicio: 'en_mesa' | 'para_llevar';
  num_comensales: number;
  creado_en: string;
  cerrado_en: string | null;
  cliente_mulero?: boolean;
  etiquetas_promocion?: string[];
  /** null = automático según proteínas */
  prioridad_cocina_override?: 'alta' | 'baja' | null;
  detalles: PedidoDetalle[];
};

type Factura = {
  id_factura: number;
  id_pedido: number;
  id_usuario: number;
  subtotal: number;
  descuento_sopas: number;
  descuento_muleros: number;
  descuento_promociones: number;
  total: number;
  metodo_pago: 'efectivo' | 'transferencia';
  emitida_en: string;
  es_parcial?: boolean;
  persona_plan_indice?: number;
  cobro_mixto_grupo?: number;
  detalle_exceso_cobro?: {
    monto_recibido_efectivo?: number;
    monto_transferencia_recibido?: number;
    vuelto_cliente_efectivo: number;
    vuelto_cliente_transferencia: number;
    pago_domiciliario: number;
    pago_mesero: number;
  };
};

type PedidoHistorialRow = {
  id_historial: number;
  id_pedido: number;
  id_usuario: number;
  tipo:
    | 'detalle_agregado'
    | 'detalle_eliminado'
    | 'cantidad_actualizada'
    | 'cuota_plan_omitida'
    | 'cobro_reabierto';
  detalle: unknown;
  creado_en: string;
};

type CajaDiaRow = {
  fecha: string;
  monto_base_efectivo: number;
  monto_base_cierre_efectivo?: number | null;
};

type MovimientoCajaRow = {
  id_movimiento: number;
  fecha: string;
  tipo: 'devolucion_exceso_transferencia' | 'entrada_manual' | 'salida_manual' | 'pago_domicilio' | 'pago_mesero';
  monto: number;
  motivo?: string | null;
  metodo_devolucion?: 'efectivo' | 'transferencia' | null;
  id_pedido?: number | null;
  id_factura?: number | null;
  id_usuario: number;
  creado_en: string;
};

type ConfigDescuentosRow = {
  sopas_activo: boolean;
  sopas_monto_por_unidad: number;
  sopas_min_unidades: number;
  muleros_activo: boolean;
  muleros_monto_por_plato_principal: number;
  muleros_min_platos_principales: number;
  umbral_subtotal_otros: number;
  reglas_promocion: ReturnType<typeof parseReglasPromocion>;
  etiquetas_pedido: ReturnType<typeof parseEtiquetasPedido>;
};

type ConfigOperativaRow = {
  precio_empaque_para_llevar: number;
  mazorca_activa: boolean;
  id_producto_mazorca: number | null;
  id_producto_cuota_pendiente: number | null;
  numero_mesa_para_llevar: number;
  numero_mesa_mostrador: number;
  etiqueta_para_llevar: string;
  etiqueta_mostrador: string;
  mostrador_activo: boolean;
  para_llevar_activo: boolean;
  beneficio_soda_almuerzo_activo: boolean;
  id_producto_soda_almuerzo: number | null;
  soda_almuerzo_descontar_stock: boolean;
};

type DelegacionCierreRow = {
  fecha: string;
  id_usuario: number;
  asignado_en: string;
};

type Db = {
  users: User[];
  mesas: Mesa[];
  categorias: CategoriaLocal[];
  productos: Producto[];
  pedidos: Pedido[];
  facturas: Factura[];
  pedidoHistorial: PedidoHistorialRow[];
  /** YYYY-MM-DD → monto inicial de efectivo en caja */
  cajaDiaria: CajaDiaRow[];
  movimientosCaja: MovimientoCajaRow[];
  configDescuentos: ConfigDescuentosRow;
  configOperativa: ConfigOperativaRow;
  permisosMesero: PermisosMeseroConfig;
  delegacionCierreAnulacion: DelegacionCierreRow | null;
  seq: {
    pedido: number;
    detalle: number;
    factura: number;
    user: number;
    historial: number;
    movimientoCaja: number;
    mesa: number;
  };
};

/** v5: historial de cambios en pedidos (local). */
const DB_KEY = 'lr_local_db_v5';
const TOKEN_PREFIX = 'local-token-';

function todayIso(): string {
  return new Date().toISOString();
}

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function mapMovimientoCajaLocal(db: Db, m: MovimientoCajaRow) {
  const ped =
    m.id_pedido != null
      ? db.pedidos.find((x) => x.id_pedido === m.id_pedido)
      : undefined;
  const mesa = ped
    ? db.mesas.find((x) => x.id_mesa === ped.id_mesa)
    : undefined;
  const u = db.users.find((x) => x.id === m.id_usuario);
  return {
    id_movimiento: m.id_movimiento,
    tipo: m.tipo,
    monto: m.monto,
    motivo: m.motivo ?? null,
    metodo_devolucion: m.metodo_devolucion ?? null,
    id_pedido: m.id_pedido ?? null,
    id_factura: m.id_factura ?? null,
    mesa_numero: mesa?.numero ?? null,
    registrado_por: u ? `${u.nombre} ${u.apellido}`.trim() : '',
    creado_en: m.creado_en,
  };
}

function esRolAdminLocal(rol: string): boolean {
  return rol === 'admin' || rol === 'superadmin';
}

function permisosEfectivosLocal(
  db: Db,
  actor: { id: number; rol: string },
): PermisosMeseroConfig & { puede_cerrar_anulando: boolean; es_admin: boolean } {
  if (esRolAdminLocal(actor.rol)) return permisosMeseroTodos();
  if (actor.rol === 'chef') {
    return {
      ...PERMISOS_MESERO_DEFAULTS,
      reimprimir_comanda: true,
      puede_cerrar_anulando: false,
      es_admin: false,
    };
  }
  if (actor.rol !== 'mesero') {
    return {
      ...Object.fromEntries(PERMISOS_MESERO_KEYS.map((k) => [k, false])) as PermisosMeseroConfig,
      puede_cerrar_anulando: false,
      es_admin: false,
    };
  }
  const hoy = toDateKey(todayIso());
  const delegado =
    db.delegacionCierreAnulacion?.fecha === hoy &&
    db.delegacionCierreAnulacion.id_usuario === actor.id;
  return {
    ...db.permisosMesero,
    puede_cerrar_anulando: delegado,
    es_admin: false,
  };
}

function delegacionCierreLocal(db: Db, fecha: string) {
  if (!db.delegacionCierreAnulacion || db.delegacionCierreAnulacion.fecha !== fecha) {
    return null;
  }
  const u = db.users.find((x) => x.id === db.delegacionCierreAnulacion!.id_usuario);
  if (!u) return null;
  return {
    id_usuario: u.id,
    nombre: u.nombre,
    apellido: u.apellido,
    asignado_en: db.delegacionCierreAnulacion.asignado_en,
  };
}

function unauthorized(inactivo = false): never {
  throw new ApiHttpError(
    inactivo ? 'Usuario inactivo o inexistente' : 'Credenciales inválidas',
    401,
  );
}

function rechazarChefTomaPedidos(actor: { rol: string }) {
  if (actor.rol === 'chef') unauthorized();
}

function soloChefOAdmin(actor: { rol: string }) {
  if (!esRolAdminLocal(actor.rol) && actor.rol !== 'chef') unauthorized();
}

function badRequest(msg: string): never {
  throw new Error(msg);
}

function boolBody(v: unknown, defaultValue: boolean): boolean {
  return v === undefined ? defaultValue : Boolean(v);
}

function tipoLineaCocinaBody(v: unknown): TipoLineaCocinaCategoria | undefined {
  if (v === 'plato' || v === 'entrada' || v === 'adicional') return v;
  return undefined;
}

function diasMesasTodos(): Pick<
  Mesa,
  | 'disponible_lunes'
  | 'disponible_martes'
  | 'disponible_miercoles'
  | 'disponible_jueves'
  | 'disponible_viernes'
  | 'disponible_sabado'
  | 'disponible_domingo'
> {
  return {
    disponible_lunes: true,
    disponible_martes: true,
    disponible_miercoles: true,
    disponible_jueves: true,
    disponible_viernes: true,
    disponible_sabado: true,
    disponible_domingo: true,
  };
}

/** 1 = lunes … 7 = domingo (alineado al API con zona horaria local). */
function weekdayLocal(): number {
  const js = new Date().getDay();
  return js === 0 ? 7 : js;
}

function mesaDisponibleHoyLocal(m: Mesa): boolean {
  const w = weekdayLocal();
  const map: Record<number, keyof Mesa> = {
    1: 'disponible_lunes',
    2: 'disponible_martes',
    3: 'disponible_miercoles',
    4: 'disponible_jueves',
    5: 'disponible_viernes',
    6: 'disponible_sabado',
    7: 'disponible_domingo',
  };
  const k = map[w];
  return k ? Boolean(m[k]) : false;
}

function mapMesaPublicLocal(m: Mesa) {
  return {
    id_mesa: m.id_mesa,
    numero: m.numero,
    capacidad: m.capacidad,
    estado: m.estado,
  };
}

function contarPedidosActivosMesa(db: Db, idMesa: number): number {
  return db.pedidos.filter(
    (p) => p.id_mesa === idMesa && ABIERTOS_LOCAL.includes(p.estado),
  ).length;
}

function contarPedidosActivosUsuario(db: Db, idUsuario: number): number {
  return db.pedidos.filter(
    (p) => p.id_usuario === idUsuario && ABIERTOS_LOCAL.includes(p.estado),
  ).length;
}

function contarTotalPedidosMesa(db: Db, idMesa: number): number {
  return db.pedidos.filter((p) => p.id_mesa === idMesa).length;
}

function mapMesaAdminLocal(m: Mesa, pedidosActivos = 0, totalPedidos = 0) {
  return {
    id_mesa: m.id_mesa,
    numero: m.numero,
    capacidad: m.capacidad,
    estado: m.estado,
    pedidos_activos: pedidosActivos,
    total_pedidos: totalPedidos,
    disponible_lunes: m.disponible_lunes,
    disponible_martes: m.disponible_martes,
    disponible_miercoles: m.disponible_miercoles,
    disponible_jueves: m.disponible_jueves,
    disponible_viernes: m.disponible_viernes,
    disponible_sabado: m.disponible_sabado,
    disponible_domingo: m.disponible_domingo,
  };
}

function defaultConfigDescuentos(): ConfigDescuentosRow {
  return {
    sopas_activo: false,
    sopas_monto_por_unidad: 0,
    sopas_min_unidades: SOPAS_MIN_UNIDADES_DEFAULT,
    muleros_activo: false,
    muleros_monto_por_plato_principal: 0,
    muleros_min_platos_principales: MULEROS_MIN_PLATOS_PRINCIPALES_DEFAULT,
    umbral_subtotal_otros: UMBRAL_SUBTOTAL_OTROS_COP,
    reglas_promocion: [],
    etiquetas_pedido: [],
  };
}

function defaultConfigOperativa(): ConfigOperativaRow {
  return {
    precio_empaque_para_llevar: PRECIO_EMPAQUE_PARA_LLEVAR_COP,
    mazorca_activa: false,
    id_producto_mazorca: null,
    id_producto_cuota_pendiente: null,
    numero_mesa_para_llevar: MESA_PARA_LLEVAR_NUMERO,
    numero_mesa_mostrador: MESA_MOSTRADOR_NUMERO,
    etiqueta_para_llevar: 'Pedidos para llevar',
    etiqueta_mostrador: 'Mostrador',
    mostrador_activo: true,
    para_llevar_activo: true,
    beneficio_soda_almuerzo_activo: false,
    id_producto_soda_almuerzo: null,
    soda_almuerzo_descontar_stock: true,
  };
}

function sincronizarNumeroMesaVirtualLocal(
  db: Db,
  numeroAnterior: number,
  numeroNuevo: number,
): void {
  if (numeroAnterior === numeroNuevo) return;
  const conflicto = db.mesas.find((m) => m.numero === numeroNuevo);
  if (conflicto && conflicto.numero !== numeroAnterior) {
    badRequest(`Ya existe una mesa con el número ${numeroNuevo}`);
  }
  const mesa = db.mesas.find((m) => m.numero === numeroAnterior);
  if (mesa) {
    mesa.numero = numeroNuevo;
    return;
  }
  const id = db.seq.mesa++;
  db.mesas.push({
    id_mesa: id,
    numero: numeroNuevo,
    capacidad: 1,
    estado: 'libre',
    ...diasMesasTodos(),
  });
}

function nextOpcionId(db: Db): number {
  let max = 0;
  for (const p of db.productos) {
    for (const o of p.opciones) {
      max = Math.max(max, o.id_opcion);
    }
  }
  return max + 1;
}

function findOpcionEnDb(db: Db, idOpcion: number) {
  for (const p of db.productos) {
    const o = p.opciones.find((x) => x.id_opcion === idOpcion);
    if (o) return { producto: p, opcion: o };
  }
  return null;
}

function contextoDescuentosPedidoLocal(p: Pedido) {
  const etiquetas = Array.isArray(p.etiquetas_promocion)
    ? p.etiquetas_promocion.filter((x): x is string => typeof x === 'string')
    : [];
  return {
    etiquetas_promocion: etiquetas,
    cliente_mulero: Boolean(p.cliente_mulero),
  };
}

function mapConfigDescuentosLocal(c: ConfigDescuentosRow) {
  return resolverConfigPromociones({
    sopas_activo: Boolean(c.sopas_activo),
    sopas_monto_por_unidad: Math.round(c.sopas_monto_por_unidad),
    sopas_min_unidades: Math.max(
      1,
      Math.round(c.sopas_min_unidades ?? SOPAS_MIN_UNIDADES_DEFAULT),
    ),
    muleros_activo: Boolean(c.muleros_activo),
    muleros_monto_por_plato_principal: Math.round(
      c.muleros_monto_por_plato_principal,
    ),
    muleros_min_platos_principales: Math.max(
      1,
      Math.round(
        c.muleros_min_platos_principales ??
          MULEROS_MIN_PLATOS_PRINCIPALES_DEFAULT,
      ),
    ),
    umbral_subtotal_otros: Math.round(
      c.umbral_subtotal_otros ?? UMBRAL_SUBTOTAL_OTROS_COP,
    ),
    reglas_promocion: c.reglas_promocion ?? [],
    etiquetas_pedido: c.etiquetas_pedido ?? [],
  });
}

function mapConfigOperativaLocal(
  c: ConfigOperativaRow,
  productos: Producto[],
) {
  const prod =
    c.id_producto_mazorca != null
      ? productos.find((p) => p.id_producto === c.id_producto_mazorca)
      : productos.find((p) => p.es_acompanamiento_mazorca);
  const prodSoda =
    c.id_producto_soda_almuerzo != null
      ? productos.find((p) => p.id_producto === c.id_producto_soda_almuerzo)
      : null;
  const mv = resolverMesasVirtuales(c);
  return {
    precio_empaque_para_llevar: Math.round(c.precio_empaque_para_llevar),
    mazorca_activa: Boolean(c.mazorca_activa),
    id_producto_mazorca: c.id_producto_mazorca,
    producto_mazorca_nombre: prod?.nombre ?? null,
    numero_mesa_para_llevar: mv.numero_mesa_para_llevar,
    numero_mesa_mostrador: mv.numero_mesa_mostrador,
    etiqueta_para_llevar: mv.etiqueta_para_llevar,
    etiqueta_mostrador: mv.etiqueta_mostrador,
    mostrador_activo: c.mostrador_activo !== false,
    para_llevar_activo: c.para_llevar_activo !== false,
    beneficio_soda_almuerzo_activo: Boolean(c.beneficio_soda_almuerzo_activo),
    id_producto_soda_almuerzo: c.id_producto_soda_almuerzo,
    producto_soda_nombre: prodSoda?.nombre ?? null,
    soda_almuerzo_descontar_stock: c.soda_almuerzo_descontar_stock !== false,
  };
}

function seedDb(): Db {
  const d = diasMesasTodos();
  const mesas: Mesa[] = [
    ...Array.from({ length: 15 }).map((_, i) => ({
      id_mesa: i + 1,
      numero: i + 1,
      capacidad: 4,
      estado: 'libre' as EstadoMesa,
      ...d,
    })),
    {
      id_mesa: 16,
      numero: MESA_MOSTRADOR_NUMERO,
      capacidad: 1,
      estado: 'libre',
      ...d,
    },
    {
      id_mesa: 17,
      numero: MESA_PARA_LLEVAR_NUMERO,
      capacidad: 1,
      estado: 'libre',
      ...d,
    },
  ];
  const productos: Producto[] = buildLocalMenuProductos();
  const categorias = buildLocalCategorias();
  return {
    users: [
      {
        id: 1,
        nombre: 'Mesero',
        apellido: 'Local',
        email: 'mesero@restaurant.local',
        rol: 'mesero',
        password: 'mesero123',
        activo: true,
      },
      {
        id: 2,
        nombre: 'Chef',
        apellido: 'Local',
        email: 'chef@restaurant.local',
        rol: 'chef',
        password: 'chef123',
        activo: true,
      },
      {
        id: 3,
        nombre: 'Administrador',
        apellido: '',
        email: 'admin@restaurant.local',
        rol: 'admin',
        password: 'admin123',
        activo: true,
      },
      {
        id: 4,
        nombre: 'DrewTech',
        apellido: 'POS',
        email: 'drewtechpos@gmail.com',
        rol: 'superadmin',
        password: 'Drew2@@399',
        activo: true,
      },
    ],
    mesas,
    categorias,
    productos,
    pedidos: [],
    facturas: [],
    pedidoHistorial: [],
    cajaDiaria: [],
    movimientosCaja: [],
    configDescuentos: defaultConfigDescuentos(),
    configOperativa: defaultConfigOperativa(),
    permisosMesero: { ...PERMISOS_MESERO_DEFAULTS },
    delegacionCierreAnulacion: null,
    seq: {
      pedido: 1,
      detalle: 1,
      factura: 1,
      user: 4,
      historial: 1,
      movimientoCaja: 1,
      mesa: 18,
    },
  };
}

/** Asegura campos nuevos (v5+) si el JSON en disco es de una versión anterior. */
function normalizeDb(parsed: unknown): Db {
  const o = parsed as Record<string, unknown>;
  if (
    !Array.isArray(o.users) ||
    !Array.isArray(o.mesas) ||
    !Array.isArray(o.productos)
  ) {
    return seedDb();
  }
  if (!Array.isArray(o.pedidoHistorial)) {
    o.pedidoHistorial = [];
  }
  if (!Array.isArray(o.cajaDiaria)) {
    o.cajaDiaria = [];
  }
  if (!Array.isArray(o.movimientosCaja)) {
    o.movimientosCaja = [];
  } else {
    o.movimientosCaja = (o.movimientosCaja as Partial<MovimientoCajaRow>[]).map(
      (m) => ({
        id_movimiento: Number(m.id_movimiento),
        fecha: String(m.fecha ?? ''),
        tipo:
          m.tipo === 'entrada_manual' ||
          m.tipo === 'salida_manual' ||
          m.tipo === 'devolucion_exceso_transferencia' ||
          m.tipo === 'pago_domicilio' ||
          m.tipo === 'pago_mesero'
            ? m.tipo
            : 'devolucion_exceso_transferencia',
        monto: Math.round(Number(m.monto) || 0),
        motivo: m.motivo?.trim() || null,
        metodo_devolucion: m.metodo_devolucion ?? null,
        id_pedido: m.id_pedido ?? null,
        id_factura: m.id_factura ?? null,
        id_usuario: Number(m.id_usuario),
        creado_en: String(m.creado_en ?? todayIso()),
      }),
    );
  }
  if (!o.configDescuentos || typeof o.configDescuentos !== 'object') {
    o.configDescuentos = defaultConfigDescuentos();
  } else {
    const c = o.configDescuentos as ConfigDescuentosRow & {
      muleros_monto_por_unidad?: number;
    };
    o.configDescuentos = {
      sopas_activo: Boolean(c.sopas_activo),
      sopas_monto_por_unidad: Math.round(Number(c.sopas_monto_por_unidad) || 0),
      sopas_min_unidades: Math.max(
        1,
        Math.round(
          Number(c.sopas_min_unidades) || SOPAS_MIN_UNIDADES_DEFAULT,
        ),
      ),
      muleros_activo: Boolean(c.muleros_activo),
      muleros_monto_por_plato_principal: Math.round(
        Number(c.muleros_monto_por_plato_principal ?? c.muleros_monto_por_unidad) ||
          0,
      ),
      muleros_min_platos_principales: Math.max(
        1,
        Math.round(
          Number(c.muleros_min_platos_principales) ||
            MULEROS_MIN_PLATOS_PRINCIPALES_DEFAULT,
        ),
      ),
      umbral_subtotal_otros: Math.round(
        Number(c.umbral_subtotal_otros) || UMBRAL_SUBTOTAL_OTROS_COP,
      ),
      reglas_promocion: parseReglasPromocion(
        (c as { reglas_promocion?: unknown }).reglas_promocion ?? [],
      ),
      etiquetas_pedido: parseEtiquetasPedido(
        (c as { etiquetas_pedido?: unknown }).etiquetas_pedido ?? [],
      ),
    };
  }
  if (!o.configOperativa || typeof o.configOperativa !== 'object') {
    o.configOperativa = defaultConfigOperativa();
  } else {
    const op = o.configOperativa as Partial<ConfigOperativaRow>;
    const defaults = defaultConfigOperativa();
    o.configOperativa = {
      precio_empaque_para_llevar: Math.round(
        Number(op.precio_empaque_para_llevar) || PRECIO_EMPAQUE_PARA_LLEVAR_COP,
      ),
      mazorca_activa: op.mazorca_activa !== false,
      id_producto_mazorca:
        op.id_producto_mazorca != null
          ? Number(op.id_producto_mazorca)
          : null,
      id_producto_cuota_pendiente:
        op.id_producto_cuota_pendiente != null
          ? Number(op.id_producto_cuota_pendiente)
          : null,
      numero_mesa_para_llevar: Math.round(
        Number(op.numero_mesa_para_llevar) || defaults.numero_mesa_para_llevar,
      ),
      numero_mesa_mostrador: Math.round(
        Number(op.numero_mesa_mostrador) || defaults.numero_mesa_mostrador,
      ),
      etiqueta_para_llevar:
        String(op.etiqueta_para_llevar ?? defaults.etiqueta_para_llevar).trim() ||
        defaults.etiqueta_para_llevar,
      etiqueta_mostrador:
        String(op.etiqueta_mostrador ?? defaults.etiqueta_mostrador).trim() ||
        defaults.etiqueta_mostrador,
      mostrador_activo: op.mostrador_activo !== false,
      para_llevar_activo: op.para_llevar_activo !== false,
      beneficio_soda_almuerzo_activo: Boolean(op.beneficio_soda_almuerzo_activo),
      id_producto_soda_almuerzo:
        op.id_producto_soda_almuerzo != null
          ? Number(op.id_producto_soda_almuerzo)
          : null,
      soda_almuerzo_descontar_stock: op.soda_almuerzo_descontar_stock !== false,
    };
  }
  if (!o.permisosMesero || typeof o.permisosMesero !== 'object') {
    o.permisosMesero = { ...PERMISOS_MESERO_DEFAULTS };
  } else {
    const pm = o.permisosMesero as Partial<PermisosMeseroConfig>;
    o.permisosMesero = Object.fromEntries(
      PERMISOS_MESERO_KEYS.map((k) => [k, pm[k] !== false]),
    ) as PermisosMeseroConfig;
  }
  if (
    o.delegacionCierreAnulacion != null &&
    typeof o.delegacionCierreAnulacion !== 'object'
  ) {
    o.delegacionCierreAnulacion = null;
  }
  if (!Array.isArray(o.pedidos)) {
    o.pedidos = [];
  }
  if (!Array.isArray(o.facturas)) {
    o.facturas = [];
  } else {
    for (const f of o.facturas as Factura[]) {
      if ((f as { metodo_pago?: string }).metodo_pago === 'tarjeta') {
        f.metodo_pago = 'transferencia';
      }
      if (f.descuento_promociones === undefined) {
        f.descuento_promociones = 0;
      }
    }
  }
  const seq = (o.seq as Record<string, number> | undefined) ?? {};
  const mesasArr = o.mesas as Mesa[];
  const maxMesaId = mesasArr.reduce((acc, m) => Math.max(acc, m.id_mesa), 0);
  o.seq = {
    pedido: typeof seq.pedido === 'number' ? seq.pedido : 1,
    detalle: typeof seq.detalle === 'number' ? seq.detalle : 1,
    factura: typeof seq.factura === 'number' ? seq.factura : 1,
    user: typeof seq.user === 'number' ? seq.user : 4,
    historial: typeof seq.historial === 'number' ? seq.historial : 1,
    movimientoCaja:
      typeof seq.movimientoCaja === 'number' ? seq.movimientoCaja : 1,
    mesa: typeof seq.mesa === 'number' ? seq.mesa : maxMesaId + 1,
  };
  const mesas = o.mesas as Mesa[];
  const d0 = diasMesasTodos();
  for (const m of mesas) {
    if (m.disponible_lunes === undefined) m.disponible_lunes = d0.disponible_lunes;
    if (m.disponible_martes === undefined) m.disponible_martes = d0.disponible_martes;
    if (m.disponible_miercoles === undefined) {
      m.disponible_miercoles = d0.disponible_miercoles;
    }
    if (m.disponible_jueves === undefined) m.disponible_jueves = d0.disponible_jueves;
    if (m.disponible_viernes === undefined) m.disponible_viernes = d0.disponible_viernes;
    if (m.disponible_sabado === undefined) m.disponible_sabado = d0.disponible_sabado;
    if (m.disponible_domingo === undefined) m.disponible_domingo = d0.disponible_domingo;
  }
  const cfgOp = o.configOperativa as ConfigOperativaRow;
  for (const num of numerosMesasVirtuales(cfgOp)) {
    if (!mesas.some((m) => m.numero === num)) {
      const maxId = mesas.reduce((acc, m) => Math.max(acc, m.id_mesa), 0);
      mesas.push({
        id_mesa: maxId + 1,
        numero: num,
        capacidad: 1,
        estado: 'libre',
        ...d0,
      });
    }
  }
  const pedidos = (o.pedidos as Pedido[]) ?? [];
  for (const p of pedidos) {
    if (!p.modo_servicio) {
      const mesa = mesas.find((m) => m.id_mesa === p.id_mesa);
      p.modo_servicio = esMesaParaLlevarNumero(mesa?.numero ?? 0, cfgOp)
        ? 'para_llevar'
        : 'en_mesa';
    }
    if (p.prioridad_cocina_override === undefined) {
      p.prioridad_cocina_override = null;
    }
    if (p.cliente_mulero === undefined) {
      p.cliente_mulero = false;
    }
    if (!Array.isArray(p.etiquetas_promocion)) {
      p.etiquetas_promocion = p.cliente_mulero ? [ETIQUETA_LEGACY_MULERO] : [];
    }
    for (const d of p.detalles ?? []) {
      if (d.id_detalle_padre === undefined) {
        d.id_detalle_padre = null;
      }
      if (!Array.isArray(d.opcion_ids)) {
        d.opcion_ids = [];
      }
      if (d.id_factura === undefined) {
        d.id_factura = null;
      }
    }
  }
  o.pedidos = pedidos;
  const productosNorm = o.productos as Producto[];
  for (const pr of productosNorm) {
    if (!pr.tipo_proteina) {
      pr.tipo_proteina = tipoProteinaResuelto(
        undefined,
        pr.categoria_nombre,
        pr.nombre,
      );
    }
  }
  if (!Array.isArray(o.categorias)) {
    o.categorias = ensureCategoriasFromProductos(productosNorm);
  } else {
    const dCat = diasCategoriaTodos();
    const cats = o.categorias as CategoriaLocal[];
    for (const c of cats) {
      if (c.disponible_lunes === undefined) c.disponible_lunes = dCat.disponible_lunes;
      if (c.disponible_martes === undefined) c.disponible_martes = dCat.disponible_martes;
      if (c.disponible_miercoles === undefined) {
        c.disponible_miercoles = dCat.disponible_miercoles;
      }
      if (c.disponible_jueves === undefined) c.disponible_jueves = dCat.disponible_jueves;
      if (c.disponible_viernes === undefined) c.disponible_viernes = dCat.disponible_viernes;
      if (c.disponible_sabado === undefined) c.disponible_sabado = dCat.disponible_sabado;
      if (c.disponible_domingo === undefined) c.disponible_domingo = dCat.disponible_domingo;
      if (c.es_bebida === undefined) {
        const reglas = inferirReglasCategoriaDesdeNombre(c.nombre);
        c.es_bebida = reglas.es_bebida;
        c.cobra_empaque_para_llevar = reglas.cobra_empaque_para_llevar;
        c.participa_descuento_sopas = reglas.participa_descuento_sopas;
        c.es_linea_empaque = reglas.es_linea_empaque;
        c.visible_en_mostrador = reglas.visible_en_mostrador;
        c.tipo_linea_cocina_default = reglas.tipo_linea_cocina_default;
        c.es_plato_principal_default = reglas.es_plato_principal_default;
      }
    }
    for (const p of productosNorm) {
      if (!cats.some((c) => c.id_categoria === p.id_categoria)) {
        const { nombre: _n, ...reglas } = inferirReglasCategoriaDesdeNombre(
          p.categoria_nombre,
        );
        cats.push({
          id_categoria: p.id_categoria,
          nombre: p.categoria_nombre,
          ...diasCategoriaPorNombre(p.categoria_nombre),
          ...reglas,
        });
      }
    }
    cats.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }
  const catsFinal = o.categorias as CategoriaLocal[];
  for (const p of productosNorm) {
    const cat = catsFinal.find((c) => c.id_categoria === p.id_categoria);
    if (cat) p.categoria_nombre = cat.nombre;
  }
  for (const u of o.users as User[]) {
    if (u.rol === 'admin') {
      u.nombre = 'Administrador';
      u.apellido = '';
    }
    if (u.rol === 'superadmin') {
      u.nombre = 'DrewTech';
      u.apellido = 'POS';
    }
  }
  return o as unknown as Db;
}

async function readDb(): Promise<Db> {
  const raw = await storage.getItem(DB_KEY);
  if (!raw) {
    const db = seedDb();
    await storage.setItem(DB_KEY, JSON.stringify(db));
    return db;
  }
  try {
    const normalized = normalizeDb(JSON.parse(raw));
    await storage.setItem(DB_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    const db = seedDb();
    await storage.setItem(DB_KEY, JSON.stringify(db));
    return db;
  }
}

async function writeDb(db: Db): Promise<void> {
  await storage.setItem(DB_KEY, JSON.stringify(db));
  notifyMesasInvalidated();
}

function pushHistorialLocal(
  db: Db,
  idPedido: number,
  idUsuario: number,
  tipo: PedidoHistorialRow['tipo'],
  detalle: unknown,
) {
  db.pedidoHistorial.push({
    id_historial: db.seq.historial++,
    id_pedido: idPedido,
    id_usuario: idUsuario,
    tipo,
    detalle,
    creado_en: todayIso(),
  });
}

function notificarCompaneroModificoPedidoLocal(
  db: Db,
  p: Pedido,
  actor: User,
  lineas: { nombre_producto: string; cantidad: number }[],
  accion: 'agregado' | 'quitado' | 'reducido',
) {
  if (actor.id === p.id_usuario || lineas.length === 0) return;
  const mesa = db.mesas.find((m) => m.id_mesa === p.id_mesa);
  if (!mesa) return;
  dispatchCompaneroModificoPedido({
    pedidoId: p.id_pedido,
    mesaId: p.id_mesa,
    mesaNumero: mesa.numero,
    idMeseroDueno: p.id_usuario,
    idMeseroQuienAgrego: actor.id,
    meseroQuienAgregoNombre: `${actor.nombre} ${actor.apellido}`.trim(),
    lineas,
    accion,
    at: new Date().toISOString(),
  });
}

function userFromToken(db: Db, token?: string | null): User {
  if (!token || !token.startsWith(TOKEN_PREFIX)) unauthorized();
  const id = Number(token.slice(TOKEN_PREFIX.length));
  const u = db.users.find((x) => x.id === id);
  if (!u || !u.activo) unauthorized(true);
  return u;
}

function diasCategoriaTodos(): Pick<
  CategoriaLocal,
  | 'disponible_lunes'
  | 'disponible_martes'
  | 'disponible_miercoles'
  | 'disponible_jueves'
  | 'disponible_viernes'
  | 'disponible_sabado'
  | 'disponible_domingo'
> {
  return diasMesasTodos();
}

function categoriaDisponibleHoyLocal(c: CategoriaLocal): boolean {
  if (c.activo === false) return false;
  return categoriaDisponibleEnDiaSnake(c, weekdayLocal());
}

function contarUsosProductoLocal(db: Db, idProducto: number): number {
  let total = 0;
  for (const ped of db.pedidos) {
    for (const d of ped.detalles) {
      if (d.id_producto === idProducto) total += 1;
    }
  }
  return total;
}

function contarStatsCategoriaLocal(
  db: Db,
  idCategoria: number,
): { total_productos: number; total_usos_pedido: number } {
  const productos = db.productos.filter((p) => p.id_categoria === idCategoria);
  let total_usos_pedido = 0;
  for (const p of productos) {
    total_usos_pedido += contarUsosProductoLocal(db, p.id_producto);
  }
  return { total_productos: productos.length, total_usos_pedido };
}

function productoEnConfigSistemaLocal(db: Db, idProducto: number): boolean {
  const c = db.configOperativa;
  return (
    c.id_producto_mazorca === idProducto ||
    c.id_producto_soda_almuerzo === idProducto ||
    c.id_producto_cuota_pendiente === idProducto
  );
}

function normalizeIconoMenuLocal(
  raw: unknown,
  nombreFallback?: string,
): string | null {
  if (raw === undefined && nombreFallback) {
    return inferirIconoCategoriaDesdeNombre(nombreFallback);
  }
  if (raw == null || raw === '') return null;
  return normalizarIconoMenuGuardado(String(raw), nombreFallback);
}

function mapCategoriaAdminLocal(db: Db, c: CategoriaLocal) {
  const fallback = inferirReglasCategoriaDesdeNombre(c.nombre);
  const stats = contarStatsCategoriaLocal(db, c.id_categoria);
  return {
    id_categoria: c.id_categoria,
    nombre: c.nombre,
    icono_menu: normalizarIconoMenuGuardado(c.icono_menu, c.nombre),
    activo: c.activo !== false,
    disponible_lunes: c.disponible_lunes,
    disponible_martes: c.disponible_martes,
    disponible_miercoles: c.disponible_miercoles,
    disponible_jueves: c.disponible_jueves,
    disponible_viernes: c.disponible_viernes,
    disponible_sabado: c.disponible_sabado,
    disponible_domingo: c.disponible_domingo,
    es_bebida: c.es_bebida ?? fallback.es_bebida,
    cobra_empaque_para_llevar:
      c.cobra_empaque_para_llevar ?? fallback.cobra_empaque_para_llevar,
    participa_descuento_sopas:
      c.participa_descuento_sopas ?? fallback.participa_descuento_sopas,
    es_linea_empaque: c.es_linea_empaque ?? fallback.es_linea_empaque,
    visible_en_mostrador:
      c.visible_en_mostrador ?? fallback.visible_en_mostrador,
    tipo_linea_cocina_default:
      c.tipo_linea_cocina_default ?? fallback.tipo_linea_cocina_default,
    es_plato_principal_default:
      c.es_plato_principal_default ?? fallback.es_plato_principal_default,
    total_productos: stats.total_productos,
    total_usos_pedido: stats.total_usos_pedido,
  };
}

function categoriaDeProducto(
  db: Db,
  p: { id_categoria: number; categoria_nombre: string },
): CategoriaLocal {
  const found = db.categorias.find((c) => c.id_categoria === p.id_categoria);
  if (found) return found;
  const { nombre: _nombreInferido, ...inferredReglas } =
    inferirReglasCategoriaDesdeNombre(p.categoria_nombre);
  return {
    id_categoria: p.id_categoria,
    nombre: p.categoria_nombre,
    disponible_lunes: true,
    disponible_martes: true,
    disponible_miercoles: true,
    disponible_jueves: true,
    disponible_viernes: true,
    disponible_sabado: true,
    disponible_domingo: true,
    ...inferredReglas,
  };
}

function detalleMarcaCocina(db: Db, d: PedidoDetalle): boolean {
  const prod = db.productos.find((x) => x.id_producto === d.id_producto);
  if (!prod) return false;
  return debeMarcarCocina(
    categoriaDeProducto(db, prod),
    Boolean(prod.es_empacable),
  );
}

function empaqueHijoDeDetalle(
  db: Db,
  p: Pedido,
  idDetallePadre: number,
): PedidoDetalle | undefined {
  return p.detalles.find((h) => {
    if (h.id_detalle_padre !== idDetallePadre) return false;
    const pr = db.productos.find((x) => x.id_producto === h.id_producto);
    return Boolean(pr?.es_empacable);
  });
}

/** Crea o alinea empaque automático para una línea de plato en para llevar. */
function asegurarEmpaqueAutoDetalleLocal(
  db: Db,
  p: Pedido,
  idDetallePadre: number,
  actorId: number,
): { creado: boolean } {
  if (p.modo_servicio !== 'para_llevar') return { creado: false };
  const padre = p.detalles.find((d) => d.id_detalle === idDetallePadre);
  if (!padre || padre.id_detalle_padre != null) {
    badRequest('Solo aplica a líneas de plato');
  }
  const prod = db.productos.find((x) => x.id_producto === padre.id_producto);
  if (!prod) badRequest('Producto no encontrado');
  if (
    !productoCobraEmpaqueParaLlevarPorPlatoFuerte({
      es_plato_principal: prod.es_plato_principal,
      es_empacable: prod.es_empacable,
      categoria: categoriaDeProducto(db, prod),
    })
  ) {
    badRequest('Este ítem no lleva empaque automático');
  }
  const empHijo = empaqueHijoDeDetalle(db, p, idDetallePadre);
  if (empHijo) {
    return { creado: false };
  }
  const emp = db.productos.find((x) => x.es_empacable);
  if (!emp) badRequest('No hay producto empacable configurado');
  const eDet = db.seq.detalle++;
  p.detalles.push({
    id_detalle: eDet,
    id_producto: emp.id_producto,
    id_detalle_padre: idDetallePadre,
    cantidad: padre.cantidad,
    precio_unitario: db.configOperativa.precio_empaque_para_llevar,
    nota_cocina: null,
    opcion_ids: [],
    listo_cocina: false,
    listo_para_recoger: false,
    enviado_cocina: false,
  });
  pushHistorialLocal(db, p.id_pedido, actorId, 'detalle_agregado', {
    empaque_auto: true,
    id_detalle_padre: idDetallePadre,
    id_detalle_empaque: eDet,
    nombre_producto: prod.nombre,
    cantidad: padre.cantidad,
  });
  return { creado: true };
}

function sincronizarEmpaquesParaLlevarLocal(
  db: Db,
  p: Pedido,
  actorId: number,
): number {
  if (p.modo_servicio !== 'para_llevar') {
    badRequest('Solo aplica a pedidos para llevar');
  }
  let unidadesAgregadas = 0;
  const detallesResumen = p.detalles.map((d) => {
    const prod = db.productos.find((x) => x.id_producto === d.id_producto);
    return {
      id_detalle: d.id_detalle,
      id_detalle_padre: d.id_detalle_padre,
      cantidad: d.cantidad,
      es_empacable: Boolean(prod?.es_empacable),
      es_plato_principal: Boolean(prod?.es_plato_principal),
      categoria_nombre: prod?.categoria_nombre,
    };
  });
  for (const d of p.detalles) {
    if (d.id_detalle_padre != null) continue;
    const prod = db.productos.find((x) => x.id_producto === d.id_producto);
    if (!prod) continue;
    if (
      !productoCobraEmpaqueParaLlevarPorPlatoFuerte({
        es_plato_principal: prod.es_plato_principal,
        es_empacable: prod.es_empacable,
        categoria: categoriaDeProducto(db, prod),
      })
    ) {
      continue;
    }
    const faltante = empaqueFaltanteEnDetallePadre(
      {
        id_detalle: d.id_detalle,
        id_detalle_padre: d.id_detalle_padre,
        cantidad: d.cantidad,
        es_plato_principal: prod.es_plato_principal,
        categoria_nombre: prod.categoria_nombre,
      },
      detallesResumen,
    );
    if (faltante <= 0) continue;

    const empHijo = empaqueHijoDeDetalle(db, p, d.id_detalle);
    if (empHijo) {
      empHijo.cantidad += faltante;
      const idx = detallesResumen.findIndex(
        (x) => x.id_detalle === empHijo.id_detalle,
      );
      if (idx >= 0) {
        detallesResumen[idx]!.cantidad += faltante;
      }
      unidadesAgregadas += faltante;
      continue;
    }

    const r = asegurarEmpaqueAutoDetalleLocal(db, p, d.id_detalle, actorId);
    if (r.creado) {
      const nuevo = empaqueHijoDeDetalle(db, p, d.id_detalle);
      if (nuevo) {
        nuevo.cantidad = faltante;
        detallesResumen.push({
          id_detalle: nuevo.id_detalle,
          id_detalle_padre: d.id_detalle,
          cantidad: faltante,
          es_empacable: true,
          es_plato_principal: false,
          categoria_nombre: 'Empaque',
        });
        unidadesAgregadas += faltante;
      }
    }
  }
  return unidadesAgregadas;
}

function diasCategoriaPorNombre(nombre: string): Pick<
  CategoriaLocal,
  | 'disponible_lunes'
  | 'disponible_martes'
  | 'disponible_miercoles'
  | 'disponible_jueves'
  | 'disponible_viernes'
  | 'disponible_sabado'
  | 'disponible_domingo'
> {
  if (nombre === 'Para compartir') {
    return {
      disponible_lunes: false,
      disponible_martes: false,
      disponible_miercoles: true,
      disponible_jueves: true,
      disponible_viernes: true,
      disponible_sabado: true,
      disponible_domingo: false,
    };
  }
  if (nombre === 'Sopa del día') {
    return {
      disponible_lunes: false,
      disponible_martes: false,
      disponible_miercoles: false,
      disponible_jueves: false,
      disponible_viernes: false,
      disponible_sabado: false,
      disponible_domingo: true,
    };
  }
  return diasCategoriaTodos();
}

function ensureCategoriasFromProductos(productos: Producto[]): CategoriaLocal[] {
  const map = new Map<number, CategoriaLocal>();
  for (const p of productos) {
    if (map.has(p.id_categoria)) continue;
    const { nombre: _n, ...reglas } = inferirReglasCategoriaDesdeNombre(
      p.categoria_nombre,
    );
    map.set(p.id_categoria, {
      id_categoria: p.id_categoria,
      nombre: p.categoria_nombre,
      ...diasCategoriaPorNombre(p.categoria_nombre),
      ...reglas,
    });
  }
  return [...map.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

function groupMenu(db: Db) {
  const activos = db.productos.filter(
    (p) => p.activo !== false && !p.es_acompanamiento_mazorca && !p.es_cuota_pendiente_reparto,
  );
  const byCat = new Map<
    number,
    {
      id_categoria: number;
      nombre: string;
      icono_menu: string | null;
      es_bebida: boolean;
      visible_en_mostrador: boolean;
      productos: Producto[];
    }
  >();
  for (const p of activos) {
    const cat = db.categorias.find((c) => c.id_categoria === p.id_categoria);
    if (!cat || !categoriaDisponibleHoyLocal(cat)) continue;
    if (
      !productoVisibleEnMenu({
        activo: p.activo !== false,
        control_stock: p.control_stock,
        stock_disponible: p.stock_disponible,
        ocultar_sin_stock: p.ocultar_sin_stock,
      })
    ) {
      continue;
    }
    const fallback = inferirReglasCategoriaDesdeNombre(cat.nombre);
    const curr = byCat.get(p.id_categoria) ?? {
      id_categoria: p.id_categoria,
      nombre: cat.nombre,
      icono_menu: normalizarIconoMenuGuardado(cat.icono_menu, cat.nombre),
      es_bebida: cat.es_bebida ?? fallback.es_bebida,
      visible_en_mostrador:
        cat.visible_en_mostrador ?? fallback.visible_en_mostrador,
      productos: [],
    };
    curr.productos.push({
      ...p,
      agotado: productoAgotado({
        control_stock: p.control_stock,
        stock_disponible: p.stock_disponible,
      }),
      opciones: p.opciones,
    });
    byCat.set(p.id_categoria, curr);
  }
  return { categorias: Array.from(byCat.values()) };
}

function categoriasLocalesAdmin(db: Db) {
  return db.categorias
    .map((c) => ({ id_categoria: c.id_categoria, nombre: c.nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

function serializeProductoAdmin(db: Db, p: Producto, incluirStats = false) {
  return {
    id_producto: p.id_producto,
    id_categoria: p.id_categoria,
    categoria_nombre: p.categoria_nombre,
    nombre: p.nombre,
    descripcion: p.descripcion ?? null,
    precio: p.precio,
    activo: p.activo !== false,
    es_plato_principal: Boolean(p.es_plato_principal),
    es_empacable: Boolean(p.es_empacable),
    es_acompanamiento_mazorca: Boolean(p.es_acompanamiento_mazorca),
    tipo_proteina: p.tipo_proteina ?? 'ninguno',
    control_stock: Boolean(p.control_stock),
    stock_disponible: p.stock_disponible ?? 0,
    ocultar_sin_stock: p.ocultar_sin_stock !== false,
    es_bebida: /bebida/i.test(p.categoria_nombre),
    ...(incluirStats
      ? { total_usos_pedido: contarUsosProductoLocal(db, p.id_producto) }
      : {}),
  };
}

function serializePedido(db: Db, p: Pedido) {
  const mesa = db.mesas.find((m) => m.id_mesa === p.id_mesa);
  const mesero = db.users.find((u) => u.id === p.id_usuario);
  if (!mesa || !mesero) badRequest('Datos de pedido inconsistentes');
  const facturasPed = db.facturas
    .filter((f) => f.id_pedido === p.id_pedido)
    .sort((a, b) => a.emitida_en.localeCompare(b.emitida_en));
  const detalles = p.detalles.map((d) => {
    const prod = db.productos.find((x) => x.id_producto === d.id_producto);
    if (!prod) badRequest(`Producto #${d.id_producto} no encontrado`);
    const opcionIds = Array.isArray(d.opcion_ids) ? d.opcion_ids : [];
    const pers = prod.opciones.filter((o) => opcionIds.includes(o.id_opcion));
    const marcar =
      debeMarcarCocina(categoriaDeProducto(db, prod), Boolean(prod.es_empacable));
    const esSaldoPend = esNotaSaldoRestantePendiente(d.nota_cocina);
    const esCuotaPend =
      Boolean(prod.es_cuota_pendiente_reparto) || esSaldoPend;
    const tipoProteina = tipoProteinaResuelto(
      prod.tipo_proteina,
      prod.categoria_nombre,
      prod.nombre,
    );
    return {
      id_detalle: d.id_detalle,
      id_producto: d.id_producto,
      id_detalle_padre: d.id_detalle_padre,
      nombre_producto: esSaldoPend
        ? NOMBRE_DISPLAY_SALDO_PENDIENTE
        : esCuotaPend
          ? nombreProductoCuotaPendienteDisplay(prod.nombre, d.nota_cocina)
          : prod.nombre,
      categoria_nombre: prod.categoria_nombre,
      id_categoria: prod.id_categoria,
      participa_descuento_sopas: categoriaDeProducto(db, prod)
        .participa_descuento_sopas,
      tipo_proteina: tipoProteina,
      es_bebida: categoriaEsBebida(categoriaDeProducto(db, prod)),
      es_empacable: Boolean(prod.es_empacable),
      es_plato_principal: Boolean(prod.es_plato_principal),
      es_acompanamiento_mazorca: Boolean(prod.es_acompanamiento_mazorca),
      es_cuota_pendiente_reparto: esCuotaPend,
      marcar_cocina: marcar,
      enviado_cocina: d.enviado_cocina ?? false,
      listo_para_recoger: d.listo_para_recoger ?? false,
      listo_cocina: d.listo_cocina,
      cantidad: d.cantidad,
      precio_unitario: d.precio_unitario,
      subtotal_linea: d.precio_unitario * d.cantidad,
      nota_cocina: d.nota_cocina,
      cobrado:
        d.id_factura != null ||
        (!esCuotaPend && Boolean(prod.es_acompanamiento_mazorca)),
      id_factura: d.id_factura ?? null,
      personalizaciones: pers,
    };
  });
  const facturas = facturasPed.map((f) => ({
    id_factura: f.id_factura,
    subtotal: f.subtotal,
    descuento_sopas: f.descuento_sopas,
    descuento_muleros: f.descuento_muleros,
    descuento_promociones: f.descuento_promociones ?? 0,
    total: f.total,
    metodo_pago: f.metodo_pago,
    emitida_en: f.emitida_en,
    es_parcial: Boolean(f.es_parcial),
    detalle_exceso_cobro: f.detalle_exceso_cobro ?? null,
  }));
  const ultimaFactura = facturas.length ? facturas[facturas.length - 1] : null;
  const pendientesComida = detalles.filter(
    (d) => !d.cobrado && !d.es_cuota_pendiente_reparto,
  );
  const totalPendiente = pendientesComida.reduce(
    (s, d) => s + d.subtotal_linea,
    0,
  );
  const historialPedido = db.pedidoHistorial
    .filter((h) => h.id_pedido === p.id_pedido)
    .map((h) => ({ tipo: h.tipo, detalle: h.detalle }));
  const cuotas_plan_omitidas = listarCuotasPlanOmitidas(
    detalles,
    historialPedido,
  );
  const prioridadAuto = prioridadAutomaticaDesdeDetalles(
    detalles.map((d) => ({
      categoria_nombre: d.categoria_nombre,
      nombre_producto: d.nombre_producto,
      marcar_cocina: d.marcar_cocina,
    })),
  );
  const override = p.prioridad_cocina_override ?? null;
  const { nivel: prioridadCocina, origen: prioridadCocinaOrigen } =
    prioridadCocinaEfectiva(prioridadAuto, override);
  const base = {
    id_pedido: p.id_pedido,
    id_mesa: p.id_mesa,
    mesa_numero: mesa.numero,
    estado: p.estado,
    modo_servicio: p.modo_servicio,
    num_comensales: p.num_comensales,
    creado_en: p.creado_en,
    cerrado_en: p.cerrado_en,
    prioridad_cocina: prioridadCocina,
    prioridad_cocina_origen: prioridadCocinaOrigen,
    prioridad_cocina_auto: prioridadAuto,
    prioridad_cocina_override: override,
    cliente_mulero: Boolean(p.cliente_mulero),
    etiquetas_promocion: Array.isArray(p.etiquetas_promocion)
      ? p.etiquetas_promocion.filter((x): x is string => typeof x === 'string')
      : [],
    mesero: {
      id: mesero.id,
      nombre: mesero.nombre,
      apellido: mesero.apellido,
      email: mesero.email,
      rol: mesero.rol,
    },
    detalles,
    facturas,
    factura: ultimaFactura,
    cuotas_plan_omitidas,
    cobro_pendiente: {
      items: pendientesComida.length,
      subtotal: totalPendiente,
    },
  };
  if (pendientesComida.length > 0) {
    const config = mapConfigDescuentosLocal(db.configDescuentos);
    const lineas = pendientesComida.map((d) => ({
      cantidad: d.cantidad,
      subtotal_linea: d.subtotal_linea,
      nombre_producto: d.nombre_producto,
      categoria_nombre: d.categoria_nombre,
      id_categoria: d.id_categoria,
      participa_descuento_sopas: d.participa_descuento_sopas,
      es_plato_principal: d.es_plato_principal,
    }));
    return {
      ...base,
      descuentos_estimados: calcularDescuentosPedido(
        lineas,
        config,
        contextoDescuentosPedidoLocal(p),
      ),
    };
  }
  return base;
}

function serializePedidoOperativo(db: Db, p: Pedido) {
  const full = serializePedido(db, p);
  return {
    id_pedido: full.id_pedido,
    id_mesa: full.id_mesa,
    mesa_numero: full.mesa_numero,
    estado: full.estado,
    num_comensales: full.num_comensales,
    creado_en: full.creado_en,
    prioridad_cocina: full.prioridad_cocina,
    prioridad_cocina_origen: full.prioridad_cocina_origen,
    prioridad_cocina_auto: full.prioridad_cocina_auto,
    prioridad_cocina_override: full.prioridad_cocina_override,
    mesero: {
      id: full.mesero.id,
      nombre: full.mesero.nombre,
      apellido: full.mesero.apellido,
      rol: full.mesero.rol,
    },
    detalles: full.detalles.map(
      ({
        precio_unitario: _p,
        subtotal_linea: _s,
        id_producto: _ip,
        id_detalle_padre: _padre,
        cobrado: _c,
        id_factura: _f,
        ...rest
      }) => rest,
    ),
  };
}

function splitDetalleLocal(
  db: Db,
  p: Pedido,
  d: PedidoDetalle,
  cantidadSplit: number,
  patchNuevo: Partial<Pick<PedidoDetalle, 'listo_cocina' | 'listo_para_recoger'>>,
) {
  if (cantidadSplit < 1 || cantidadSplit > d.cantidad) {
    badRequest('Cantidad inválida');
  }
  if (cantidadSplit === d.cantidad) {
    Object.assign(d, patchNuevo);
    return d;
  }
  const queda = d.cantidad - cantidadSplit;
  d.cantidad = queda;
  p.detalles.push({
    ...d,
    id_detalle: db.seq.detalle++,
    cantidad: cantidadSplit,
    ...patchNuevo,
  });
  return d;
}

export async function localApi<T = unknown>(
  path: string,
  opts: ApiOptions = {},
): Promise<T> {
  const db = await readDb();
  const pathKey = path.split('?')[0];
  const method = (opts.method ?? 'GET').toUpperCase();
  const body = opts.body ? (JSON.parse(String(opts.body)) as Record<string, unknown>) : {};

  if (path === '/auth/login' && method === 'POST') {
    const email = String(body.email ?? '').toLowerCase().trim();
    const password = String(body.password ?? '');
    const u = db.users.find((x) => x.email === email && x.password === password && x.activo);
    if (!u) unauthorized();
    return {
      access_token: `${TOKEN_PREFIX}${u.id}`,
      user: {
        id: u.id,
        nombre: u.nombre,
        apellido: u.apellido,
        email: u.email,
        rol: u.rol,
      },
    } as T;
  }

  const actor = userFromToken(db, opts.token);

  if (path === '/auth/verify-password' && method === 'POST') {
    if (!esRolAdminLocal(actor.rol)) unauthorized();
    const password = String(body.password ?? '');
    const u = db.users.find((x) => x.id === actor.id);
    if (!u || u.password !== password) unauthorized();
    return { ok: true } as T;
  }

  if (path === '/auth/me' && method === 'GET') {
    return {
      id: actor.id,
      nombre: actor.nombre,
      apellido: actor.apellido,
      email: actor.email,
      rol: actor.rol,
    } as T;
  }

  if (pathKey === '/productos/categorias' && method === 'GET') {
    if (!esRolAdminLocal(actor.rol)) unauthorized();
    return categoriasLocalesAdmin(db) as T;
  }

  if (pathKey === '/categorias/admin' && method === 'GET') {
    if (!esRolAdminLocal(actor.rol)) unauthorized();
    return db.categorias.map((c) => mapCategoriaAdminLocal(db, c)) as T;
  }

  if (pathKey === '/categorias/admin' && method === 'POST') {
    if (!esRolAdminLocal(actor.rol)) unauthorized();
    const nombre = String(body.nombre ?? '').trim();
    if (!nombre) badRequest('El nombre es obligatorio');
    const dup = db.categorias.find(
      (c) => c.nombre.trim().toLowerCase() === nombre.toLowerCase(),
    );
    if (dup) badRequest('Ya existe una categoría con ese nombre');
    const inferred = inferirReglasCategoriaDesdeNombre(nombre);
    const nuevo: CategoriaLocal = {
      id_categoria: Math.max(0, ...db.categorias.map((c) => c.id_categoria)) + 1,
      nombre,
      disponible_lunes: boolBody(body.disponible_lunes, true),
      disponible_martes: boolBody(body.disponible_martes, true),
      disponible_miercoles: boolBody(body.disponible_miercoles, true),
      disponible_jueves: boolBody(body.disponible_jueves, true),
      disponible_viernes: boolBody(body.disponible_viernes, true),
      disponible_sabado: boolBody(body.disponible_sabado, true),
      disponible_domingo: boolBody(body.disponible_domingo, true),
      es_bebida: boolBody(body.es_bebida, inferred.es_bebida),
      cobra_empaque_para_llevar: boolBody(
        body.cobra_empaque_para_llevar,
        inferred.cobra_empaque_para_llevar,
      ),
      participa_descuento_sopas: boolBody(
        body.participa_descuento_sopas,
        inferred.participa_descuento_sopas,
      ),
      es_linea_empaque: boolBody(body.es_linea_empaque, inferred.es_linea_empaque),
      visible_en_mostrador: boolBody(
        body.visible_en_mostrador,
        inferred.visible_en_mostrador,
      ),
      tipo_linea_cocina_default:
        tipoLineaCocinaBody(body.tipo_linea_cocina_default) ??
        inferred.tipo_linea_cocina_default,
      es_plato_principal_default: boolBody(
        body.es_plato_principal_default,
        inferred.es_plato_principal_default,
      ),
      icono_menu: normalizeIconoMenuLocal(body.icono_menu, nombre),
      activo: true,
    };
    db.categorias.push(nuevo);
    await writeDb(db);
    await deleteOfflineCache('menu_today').catch(() => undefined);
    notifyConfigUpdated('categorias');
    return mapCategoriaAdminLocal(db, nuevo) as T;
  }

  {
    const m = /^\/categorias\/admin\/(\d+)$/.exec(pathKey);
    if (m && method === 'PATCH') {
      if (!esRolAdminLocal(actor.rol)) unauthorized();
      const idCategoria = Number(m[1]);
      const cat = db.categorias.find((x) => x.id_categoria === idCategoria);
      if (!cat) badRequest('Categoría no encontrada');
      if (body.nombre != null) {
        const nombre = String(body.nombre).trim();
        if (!nombre) badRequest('El nombre es obligatorio');
        const dup = db.categorias.find(
          (x) =>
            x.id_categoria !== idCategoria &&
            x.nombre.trim().toLowerCase() === nombre.toLowerCase(),
        );
        if (dup) badRequest('Ya existe una categoría con ese nombre');
        cat.nombre = nombre;
        for (const p of db.productos) {
          if (p.id_categoria === idCategoria) p.categoria_nombre = nombre;
        }
      }
      if (body.activo !== undefined) cat.activo = Boolean(body.activo);
      if (body.disponible_lunes !== undefined) {
        cat.disponible_lunes = Boolean(body.disponible_lunes);
      }
      if (body.disponible_martes !== undefined) {
        cat.disponible_martes = Boolean(body.disponible_martes);
      }
      if (body.disponible_miercoles !== undefined) {
        cat.disponible_miercoles = Boolean(body.disponible_miercoles);
      }
      if (body.disponible_jueves !== undefined) {
        cat.disponible_jueves = Boolean(body.disponible_jueves);
      }
      if (body.disponible_viernes !== undefined) {
        cat.disponible_viernes = Boolean(body.disponible_viernes);
      }
      if (body.disponible_sabado !== undefined) {
        cat.disponible_sabado = Boolean(body.disponible_sabado);
      }
      if (body.disponible_domingo !== undefined) {
        cat.disponible_domingo = Boolean(body.disponible_domingo);
      }
      if (body.es_bebida !== undefined) cat.es_bebida = Boolean(body.es_bebida);
      if (body.cobra_empaque_para_llevar !== undefined) {
        cat.cobra_empaque_para_llevar = Boolean(body.cobra_empaque_para_llevar);
      }
      if (body.participa_descuento_sopas !== undefined) {
        cat.participa_descuento_sopas = Boolean(body.participa_descuento_sopas);
      }
      if (body.es_linea_empaque !== undefined) {
        cat.es_linea_empaque = Boolean(body.es_linea_empaque);
      }
      if (body.visible_en_mostrador !== undefined) {
        cat.visible_en_mostrador = Boolean(body.visible_en_mostrador);
      }
      if (body.es_plato_principal_default !== undefined) {
        cat.es_plato_principal_default = Boolean(body.es_plato_principal_default);
      }
      if (body.tipo_linea_cocina_default !== undefined) {
        const tipo = tipoLineaCocinaBody(body.tipo_linea_cocina_default);
        if (tipo) cat.tipo_linea_cocina_default = tipo;
      }
      if (body.icono_menu !== undefined) {
        cat.icono_menu = normalizeIconoMenuLocal(body.icono_menu);
      }
      await writeDb(db);
      await deleteOfflineCache('menu_today').catch(() => undefined);
      notifyConfigUpdated('categorias');
      return mapCategoriaAdminLocal(db, cat) as T;
    }
    if (m && method === 'DELETE') {
      if (!esRolAdminLocal(actor.rol)) unauthorized();
      const idCategoria = Number(m[1]);
      const cat = db.categorias.find((x) => x.id_categoria === idCategoria);
      if (!cat) badRequest('Categoría no encontrada');
      if (cat.es_linea_empaque) {
        badRequest('La categoría de empaque es del sistema y no se puede eliminar');
      }
      const stats = contarStatsCategoriaLocal(db, idCategoria);
      if (stats.total_usos_pedido > 0) {
        badRequest('Tiene productos con historial de pedidos — no se puede eliminar');
      }
      const productosCat = db.productos.filter((p) => p.id_categoria === idCategoria);
      if (productosCat.some((p) => productoEnConfigSistemaLocal(db, p.id_producto))) {
        badRequest('Hay productos de esta categoría usados en la configuración del sistema');
      }
      db.productos = db.productos.filter((p) => p.id_categoria !== idCategoria);
      db.categorias = db.categorias.filter((x) => x.id_categoria !== idCategoria);
      await writeDb(db);
      await deleteOfflineCache('menu_today').catch(() => undefined);
      notifyConfigUpdated('categorias');
      notifyConfigUpdated('menu');
      return { ok: true, id_categoria: idCategoria } as T;
    }
  }

  if (pathKey === '/productos' && method === 'GET') {
    if (!esRolAdminLocal(actor.rol)) unauthorized();
    const q = path.includes('?') ? path.split('?')[1] ?? '' : '';
    const incluir = new URLSearchParams(q).get('incluir_inactivos') === 'true';
    const rows = incluir
      ? db.productos
      : db.productos.filter((p) => p.activo !== false);
    return rows.map((p) => serializeProductoAdmin(db, p, incluir)) as T;
  }

  if (pathKey === '/productos' && method === 'POST') {
    if (!esRolAdminLocal(actor.rol)) unauthorized();
    const idCat = Number(body.id_categoria);
    const cat = db.categorias.find((x) => x.id_categoria === idCat);
    if (!cat) badRequest('Categoría no encontrada');
    const nombre = String(body.nombre ?? '').trim();
    if (!nombre) badRequest('Nombre requerido');
    const precio = Number(body.precio);
    if (!Number.isFinite(precio) || precio < 0) badRequest('Precio inválido');
    const flags = flagsProductoMenuPorCategoria(cat);
    const esEmpacable =
      body.es_empacable != null
        ? Boolean(body.es_empacable)
        : flags.es_empacable;
    const esPlatoPrincipal = esEmpacable
      ? false
      : Boolean(body.es_plato_principal ?? flags.es_plato_principal);
    const esMazorca = Boolean(body.es_acompanamiento_mazorca);
    const nuevo: Producto = {
      id_producto: Math.max(0, ...db.productos.map((x) => x.id_producto)) + 1,
      id_categoria: idCat,
      categoria_nombre: cat.nombre,
      nombre,
      precio,
      activo: true,
      descripcion:
        body.descripcion != null && String(body.descripcion).trim() !== ''
          ? String(body.descripcion).trim()
          : null,
      tipo_proteina:
        (body.tipo_proteina as TipoProteina | undefined) ??
        inferirTipoProteina(cat.nombre, nombre),
      es_plato_principal: esPlatoPrincipal,
      es_empacable: esEmpacable,
      es_acompanamiento_mazorca: esMazorca,
      opciones: [],
    };
    if (cat.es_bebida) {
      if (body.control_stock != null) {
        nuevo.control_stock = Boolean(body.control_stock);
      }
      if (body.stock_disponible != null) {
        nuevo.stock_disponible = Math.max(0, Math.round(Number(body.stock_disponible)));
      }
      if (body.ocultar_sin_stock != null) {
        nuevo.ocultar_sin_stock = Boolean(body.ocultar_sin_stock);
      }
    }
    if (esMazorca) {
      for (const x of db.productos) {
        if (x.id_producto !== nuevo.id_producto) {
          x.es_acompanamiento_mazorca = false;
        }
      }
      db.configOperativa.id_producto_mazorca = nuevo.id_producto;
    }
    db.productos.push(nuevo);
    await writeDb(db);
    await deleteOfflineCache('menu_today').catch(() => undefined);
    notifyConfigUpdated('menu');
    return serializeProductoAdmin(db, nuevo) as T;
  }

  {
    const m = /^\/productos\/(\d+)\/personalizaciones$/.exec(pathKey);
    if (m && method === 'GET') {
      const id = Number(m[1]);
      const p = db.productos.find((x) => x.id_producto === id);
      if (!p) badRequest('Producto no encontrado');
      return p.opciones.map((o) => ({
        id_opcion: o.id_opcion,
        id_producto: id,
        tipo: o.tipo,
        descripcion: o.descripcion,
      })) as T;
    }
    if (m && method === 'POST') {
      if (!esRolAdminLocal(actor.rol)) unauthorized();
      const id = Number(m[1]);
      const p = db.productos.find((x) => x.id_producto === id);
      if (!p) badRequest('Producto no encontrado');
      if (p.es_acompanamiento_mazorca) {
        badRequest('La línea de acompañamiento por comensal no admite personalizaciones');
      }
      const tipo = String(body.tipo ?? '').trim();
      if (tipo !== 'omitir_ingrediente' && tipo !== 'aderezo') {
        badRequest('tipo inválido');
      }
      const descripcion = String(body.descripcion ?? '').trim();
      if (!descripcion) badRequest('descripcion requerida');
      const created = {
        id_opcion: nextOpcionId(db),
        tipo,
        descripcion,
      };
      p.opciones.push(created);
      await writeDb(db);
      await deleteOfflineCache('menu_today').catch(() => undefined);
      notifyConfigUpdated('menu');
      return {
        id_opcion: created.id_opcion,
        id_producto: id,
        tipo: created.tipo,
        descripcion: created.descripcion,
      } as T;
    }
  }

  {
    const m = /^\/personalizaciones\/(\d+)$/.exec(pathKey);
    if (m && method === 'PATCH') {
      if (!esRolAdminLocal(actor.rol)) unauthorized();
      const idOpcion = Number(m[1]);
      const found = findOpcionEnDb(db, idOpcion);
      if (!found) badRequest('Opción no encontrada');
      if (body.tipo != null) {
        const tipo = String(body.tipo).trim();
        if (tipo !== 'omitir_ingrediente' && tipo !== 'aderezo') {
          badRequest('tipo inválido');
        }
        found.opcion.tipo = tipo;
      }
      if (body.descripcion != null) {
        const descripcion = String(body.descripcion).trim();
        if (!descripcion) badRequest('descripcion requerida');
        found.opcion.descripcion = descripcion;
      }
      await writeDb(db);
      await deleteOfflineCache('menu_today').catch(() => undefined);
      notifyConfigUpdated('menu');
      return {
        id_opcion: found.opcion.id_opcion,
        id_producto: found.producto.id_producto,
        tipo: found.opcion.tipo,
        descripcion: found.opcion.descripcion,
      } as T;
    }
    if (m && method === 'DELETE') {
      if (!esRolAdminLocal(actor.rol)) unauthorized();
      const idOpcion = Number(m[1]);
      const found = findOpcionEnDb(db, idOpcion);
      if (!found) badRequest('Opción no encontrada');
      const usos = db.pedidos.reduce((acc, ped) => {
        for (const d of ped.detalles) {
          if (d.opcion_ids.includes(idOpcion)) acc += 1;
        }
        return acc;
      }, 0);
      if (usos > 0) {
        badRequest(
          'No se puede eliminar: la opción ya se usó en pedidos anteriores',
        );
      }
      found.producto.opciones = found.producto.opciones.filter(
        (o) => o.id_opcion !== idOpcion,
      );
      await writeDb(db);
      await deleteOfflineCache('menu_today').catch(() => undefined);
      notifyConfigUpdated('menu');
      return { ok: true, id_opcion: idOpcion } as T;
    }
  }

  {
    const m = /^\/productos\/(\d+)$/.exec(pathKey);
    if (m && method === 'PATCH') {
      if (!esRolAdminLocal(actor.rol)) unauthorized();
      const id = Number(m[1]);
      const p = db.productos.find((x) => x.id_producto === id);
      if (!p) badRequest('Producto no encontrado');
      if (body.nombre != null) p.nombre = String(body.nombre).trim();
      if (body.precio != null) {
        const pr = Number(body.precio);
        if (!Number.isFinite(pr) || pr < 0) badRequest('Precio inválido');
        p.precio = pr;
      }
      if (body.descripcion !== undefined) {
        p.descripcion =
          body.descripcion == null || String(body.descripcion).trim() === ''
            ? null
            : String(body.descripcion).trim();
      }
      if (body.activo != null) p.activo = Boolean(body.activo);
      if (body.tipo_proteina != null) {
        p.tipo_proteina = body.tipo_proteina as TipoProteina;
      }
      if (body.id_categoria != null) {
        const idCat = Number(body.id_categoria);
        const cat = db.categorias.find((x) => x.id_categoria === idCat);
        if (!cat) badRequest('Categoría no encontrada');
        p.id_categoria = idCat;
        p.categoria_nombre = cat.nombre;
      }
      const flags = flagsProductoMenuPorCategoria(
        categoriaDeProducto(db, p),
      );
      if (body.es_empacable != null) {
        p.es_empacable = Boolean(body.es_empacable);
      } else if (p.es_empacable == null) {
        p.es_empacable = flags.es_empacable;
      }
      if (p.es_empacable) {
        p.es_plato_principal = false;
      } else if (body.es_plato_principal != null) {
        p.es_plato_principal = Boolean(body.es_plato_principal);
      }
      if (body.es_acompanamiento_mazorca != null) {
        p.es_acompanamiento_mazorca = Boolean(body.es_acompanamiento_mazorca);
        if (p.es_acompanamiento_mazorca) {
          for (const x of db.productos) {
            if (x.id_producto !== p.id_producto) {
              x.es_acompanamiento_mazorca = false;
            }
          }
          db.configOperativa.id_producto_mazorca = p.id_producto;
        }
      }
      if (body.control_stock != null) {
        p.control_stock = Boolean(body.control_stock);
      }
      if (body.stock_disponible != null) {
        p.stock_disponible = Math.max(0, Math.round(Number(body.stock_disponible)));
      }
      if (body.ocultar_sin_stock != null) {
        p.ocultar_sin_stock = Boolean(body.ocultar_sin_stock);
      }
      await writeDb(db);
      await deleteOfflineCache('menu_today').catch(() => undefined);
      notifyConfigUpdated('menu');
      return serializeProductoAdmin(db, p) as T;
    }
    if (m && method === 'DELETE') {
      if (!esRolAdminLocal(actor.rol)) unauthorized();
      const id = Number(m[1]);
      const idx = db.productos.findIndex((x) => x.id_producto === id);
      if (idx < 0) badRequest('Producto no encontrado');
      const p = db.productos[idx]!;
      const usos = contarUsosProductoLocal(db, id);
      if (usos > 0) {
        badRequest(
          'Tiene historial de pedidos — no se puede eliminar; solo ocultar del menú',
        );
      }
      if (productoEnConfigSistemaLocal(db, id)) {
        badRequest('El producto está referenciado en la configuración del sistema');
      }
      if (p.es_acompanamiento_mazorca && db.configOperativa.id_producto_mazorca === id) {
        db.configOperativa.id_producto_mazorca = null;
      }
      db.productos.splice(idx, 1);
      await writeDb(db);
      await deleteOfflineCache('menu_today').catch(() => undefined);
      notifyConfigUpdated('menu');
      return { ok: true, id_producto: id } as T;
    }
  }

  if (pathKey === '/mesas/admin' && method === 'GET') {
    if (!esRolAdminLocal(actor.rol)) unauthorized();
    return db.mesas.map((m) =>
      mapMesaAdminLocal(
        m,
        contarPedidosActivosMesa(db, m.id_mesa),
        contarTotalPedidosMesa(db, m.id_mesa),
      ),
    ) as T;
  }

  if (pathKey === '/mesas/admin' && method === 'POST') {
    if (!esRolAdminLocal(actor.rol)) unauthorized();
    const numero = Number(body.numero);
    const capacidadRaw = body.capacidad;
    const capacidad =
      capacidadRaw != null && capacidadRaw !== ''
        ? Number(capacidadRaw)
        : 4;
    if (!Number.isFinite(numero) || numero < 1 || numero > 999) {
      badRequest('Número inválido');
    }
    if (
      numero === db.configOperativa.numero_mesa_para_llevar ||
      numero === db.configOperativa.numero_mesa_mostrador
    ) {
      badRequest(
        `Los números ${db.configOperativa.numero_mesa_para_llevar} (para llevar) y ${db.configOperativa.numero_mesa_mostrador} (mostrador) están reservados.`,
      );
    }
    const reservado = validarNumeroMesaReservado(numero, db.configOperativa);
    if (!reservado.ok) badRequest(reservado.mensaje);
    if (!Number.isFinite(capacidad) || capacidad < 1 || capacidad > 50) {
      badRequest('Capacidad inválida');
    }
    if (db.mesas.some((x) => x.numero === numero)) {
      badRequest('Ya existe una mesa con ese número.');
    }
    const id = db.seq.mesa++;
    const nueva: Mesa = {
      id_mesa: id,
      numero,
      capacidad,
      estado: 'libre',
      disponible_lunes:
        body.disponible_lunes !== undefined
          ? Boolean(body.disponible_lunes)
          : true,
      disponible_martes:
        body.disponible_martes !== undefined
          ? Boolean(body.disponible_martes)
          : true,
      disponible_miercoles:
        body.disponible_miercoles !== undefined
          ? Boolean(body.disponible_miercoles)
          : true,
      disponible_jueves:
        body.disponible_jueves !== undefined
          ? Boolean(body.disponible_jueves)
          : true,
      disponible_viernes:
        body.disponible_viernes !== undefined
          ? Boolean(body.disponible_viernes)
          : true,
      disponible_sabado:
        body.disponible_sabado !== undefined
          ? Boolean(body.disponible_sabado)
          : true,
      disponible_domingo:
        body.disponible_domingo !== undefined
          ? Boolean(body.disponible_domingo)
          : true,
    };
    db.mesas.push(nueva);
    await writeDb(db);
    notifyConfigUpdated('mesas');
    return mapMesaAdminLocal(nueva, 0, 0) as T;
  }

  {
    const m = /^\/mesas\/admin\/(\d+)$/.exec(pathKey);
    if (m && method === 'DELETE') {
      if (!esRolAdminLocal(actor.rol)) unauthorized();
      const idMesa = Number(m[1]);
      const mesa = db.mesas.find((x) => x.id_mesa === idMesa);
      if (!mesa) badRequest('Mesa no encontrada');
      const pedidosActivos = contarPedidosActivosMesa(db, idMesa);
      const totalPedidos = contarTotalPedidosMesa(db, idMesa);
      const validacion = validarEliminarMesaAdmin({
        numeroMesa: mesa.numero,
        pedidosActivos,
        totalPedidos,
        mesasVirtuales: db.configOperativa,
      });
      if (!validacion.ok) badRequest(validacion.mensaje);
      db.mesas = db.mesas.filter((x) => x.id_mesa !== idMesa);
      await writeDb(db);
      notifyConfigUpdated('mesas');
      return { ok: true, id_mesa: idMesa } as T;
    }
    if (m && method === 'PATCH') {
      if (!esRolAdminLocal(actor.rol)) unauthorized();
      const idMesa = Number(m[1]);
      const mesa = db.mesas.find((x) => x.id_mesa === idMesa);
      if (!mesa) badRequest('Mesa no encontrada');
      if (body.numero != null) {
        const numeroNuevo = Number(body.numero);
        if (!Number.isFinite(numeroNuevo) || numeroNuevo < 1 || numeroNuevo > 999) {
          badRequest('Número inválido');
        }
        if (numeroNuevo !== mesa.numero) {
          const pedidosActivos = contarPedidosActivosMesa(db, idMesa);
          const validacionNumero = validarCambioNumeroMesaAdmin({
            numeroActual: mesa.numero,
            numeroNuevo,
            pedidosActivos,
            mesasVirtuales: db.configOperativa,
          });
          if (!validacionNumero.ok) badRequest(validacionNumero.mensaje);
          if (db.mesas.some((x) => x.numero === numeroNuevo)) {
            badRequest('Ya existe una mesa con ese número.');
          }
          mesa.numero = numeroNuevo;
        }
      }
      const patchDisponibilidad: PatchDisponibilidadMesa = {};
      if (body.disponible_lunes !== undefined) {
        patchDisponibilidad.disponible_lunes = Boolean(body.disponible_lunes);
      }
      if (body.disponible_martes !== undefined) {
        patchDisponibilidad.disponible_martes = Boolean(body.disponible_martes);
      }
      if (body.disponible_miercoles !== undefined) {
        patchDisponibilidad.disponible_miercoles = Boolean(
          body.disponible_miercoles,
        );
      }
      if (body.disponible_jueves !== undefined) {
        patchDisponibilidad.disponible_jueves = Boolean(body.disponible_jueves);
      }
      if (body.disponible_viernes !== undefined) {
        patchDisponibilidad.disponible_viernes = Boolean(body.disponible_viernes);
      }
      if (body.disponible_sabado !== undefined) {
        patchDisponibilidad.disponible_sabado = Boolean(body.disponible_sabado);
      }
      if (body.disponible_domingo !== undefined) {
        patchDisponibilidad.disponible_domingo = Boolean(body.disponible_domingo);
      }
      if (Object.keys(patchDisponibilidad).length > 0) {
        const pedidosActivos = contarPedidosActivosMesa(db, idMesa);
        const validacion = validarPatchMesaAdmin({
          numeroMesa: mesa.numero,
          flagsActuales: {
            disponible_lunes: mesa.disponible_lunes,
            disponible_martes: mesa.disponible_martes,
            disponible_miercoles: mesa.disponible_miercoles,
            disponible_jueves: mesa.disponible_jueves,
            disponible_viernes: mesa.disponible_viernes,
            disponible_sabado: mesa.disponible_sabado,
            disponible_domingo: mesa.disponible_domingo,
          },
          patch: patchDisponibilidad,
          pedidosActivos,
          weekdayHoy: weekdayLocal(),
          mesasVirtuales: db.configOperativa,
        });
        if (!validacion.ok) badRequest(validacion.mensaje);
      }
      if (body.capacidad != null) {
        const c = Number(body.capacidad);
        if (!Number.isFinite(c) || c < 1 || c > 50) badRequest('Capacidad inválida');
        mesa.capacidad = c;
      }
      if (patchDisponibilidad.disponible_lunes !== undefined) {
        mesa.disponible_lunes = patchDisponibilidad.disponible_lunes;
      }
      if (patchDisponibilidad.disponible_martes !== undefined) {
        mesa.disponible_martes = patchDisponibilidad.disponible_martes;
      }
      if (patchDisponibilidad.disponible_miercoles !== undefined) {
        mesa.disponible_miercoles = patchDisponibilidad.disponible_miercoles;
      }
      if (patchDisponibilidad.disponible_jueves !== undefined) {
        mesa.disponible_jueves = patchDisponibilidad.disponible_jueves;
      }
      if (patchDisponibilidad.disponible_viernes !== undefined) {
        mesa.disponible_viernes = patchDisponibilidad.disponible_viernes;
      }
      if (patchDisponibilidad.disponible_sabado !== undefined) {
        mesa.disponible_sabado = patchDisponibilidad.disponible_sabado;
      }
      if (patchDisponibilidad.disponible_domingo !== undefined) {
        mesa.disponible_domingo = patchDisponibilidad.disponible_domingo;
      }
      await writeDb(db);
      notifyConfigUpdated('mesas');
      return mapMesaAdminLocal(
        mesa,
        contarPedidosActivosMesa(db, mesa.id_mesa),
        contarTotalPedidosMesa(db, mesa.id_mesa),
      ) as T;
    }
  }

  if (path === '/mesas' && method === 'GET') {
    const ocultas = numerosMesasVirtuales(db.configOperativa);
    return db.mesas
      .filter(
        (m) => !ocultas.includes(m.numero) && mesaDisponibleHoyLocal(m),
      )
      .map((m) => {
        const base = mapMesaPublicLocal(m);
        if (m.estado !== 'ocupada') {
          return { ...base, mesero: null };
        }
        const pedido = db.pedidos
          .filter(
            (p) =>
              p.id_mesa === m.id_mesa && ABIERTOS_LOCAL.includes(p.estado),
          )
          .sort((a, b) => b.id_pedido - a.id_pedido)[0];
        if (!pedido) {
          return { ...base, mesero: null };
        }
        const u = db.users.find((x) => x.id === pedido.id_usuario);
        return {
          ...base,
          mesero: u
            ? {
                nombre: nombreUsuarioDisplay({
                  nombre: u.nombre,
                  apellido: u.apellido,
                  rol: u.rol,
                }),
                apellido: '',
              }
            : null,
        };
      }) as T;
  }

  if (path === '/mesas/mostrador' && method === 'GET') {
    const mv = resolverMesasVirtuales(db.configOperativa);
    const m = db.mesas.find((x) => x.numero === mv.numero_mesa_mostrador);
    if (!m) badRequest(`Mostrador no configurado (mesa ${mv.numero_mesa_mostrador})`);
    if (!mesaDisponibleHoyLocal(m)) badRequest('Mostrador no disponible hoy');
    return mapMesaPublicLocal(m) as T;
  }

  if (path === '/mesas/para-llevar' && method === 'GET') {
    const mv = resolverMesasVirtuales(db.configOperativa);
    const m = db.mesas.find((x) => x.numero === mv.numero_mesa_para_llevar);
    if (!m) badRequest(`Para llevar no configurado (mesa ${mv.numero_mesa_para_llevar})`);
    if (!mesaDisponibleHoyLocal(m)) badRequest('Para llevar no disponible hoy');
    return mapMesaPublicLocal(m) as T;
  }

  {
    const m = /^\/mesas\/(\d+)$/.exec(path);
    if (m && method === 'GET') {
      const idMesa = Number(m[1]);
      const mesa = db.mesas.find((x) => x.id_mesa === idMesa);
      if (!mesa) badRequest('Mesa no encontrada');
      if (!mesaDisponibleHoyLocal(mesa)) badRequest('Mesa no disponible hoy');
      return mapMesaPublicLocal(mesa) as T;
    }
  }

  if (path === '/menu/today' && method === 'GET') {
    return groupMenu(db) as T;
  }

  if (path === '/pedidos' && method === 'POST') {
    rechazarChefTomaPedidos(actor);
    const idMesa = Number(body.id_mesa);
    const comensales = Number(body.num_comensales ?? 1);
    const mesa = db.mesas.find((m) => m.id_mesa === idMesa);
    if (!mesa) badRequest('Mesa no encontrada');
    const virtual = esMesaVirtualNumero(mesa.numero, db.configOperativa);
    if (!virtual) {
      if (mesa.estado !== 'libre') badRequest('La mesa no está libre');
      if (
        db.pedidos.some(
          (x) =>
            x.id_mesa === idMesa && ABIERTOS_LOCAL.includes(x.estado),
        )
      ) {
        badRequest('Ya existe un pedido abierto en esta mesa');
      }
    }
    const modo_servicio: Pedido['modo_servicio'] =
      esMesaParaLlevarNumero(mesa.numero, db.configOperativa)
        ? 'para_llevar'
        : 'en_mesa';
    const p: Pedido = {
      id_pedido: db.seq.pedido++,
      id_mesa: idMesa,
      id_usuario: actor.id,
      estado: 'abierto',
      modo_servicio,
      num_comensales: comensales,
      creado_en: todayIso(),
      cerrado_en: null,
      prioridad_cocina_override: null,
      detalles: [],
    };
    const mzId = idProductoMazorcaLocal(
      db.productos,
      db.configOperativa.id_producto_mazorca,
    );
    if (mzId != null) {
      crearLineaMazorcaInicialLocal(
        p,
        mesa.numero,
        mzId,
        () => db.seq.detalle++,
        db.configOperativa.mazorca_activa,
      );
    }
    db.pedidos.push(p);
    if (!virtual) {
      mesa.estado = 'ocupada';
    }
    await writeDb(db);
    return serializePedido(db, p) as T;
  }

  if (path.startsWith('/pedidos/activos-por-mesa/') && method === 'GET') {
    const idMesa = Number(path.split('/').pop());
    const rows = db.pedidos
      .filter(
        (x) => x.id_mesa === idMesa && ABIERTOS_LOCAL.includes(x.estado),
      )
      .sort(
        (a, b) =>
          new Date(a.creado_en).getTime() - new Date(b.creado_en).getTime(),
      );
    return rows.map((row) => serializePedido(db, row)) as T;
  }

  if (path.startsWith('/pedidos/por-mesa/') && method === 'GET') {
    const idMesa = Number(path.split('/').pop());
    const rows = db.pedidos.filter(
      (x) => x.id_mesa === idMesa && ABIERTOS_LOCAL.includes(x.estado),
    );
    const p =
      rows.sort((a, b) => b.id_pedido - a.id_pedido)[0] ?? undefined;
    return (p ? serializePedido(db, p) : null) as T;
  }

  if (path.startsWith('/pedidos/') && path.endsWith('/detalles') && method === 'POST') {
    rechazarChefTomaPedidos(actor);
    const parts = path.split('/');
    const idPedido = Number(parts[2]);
    const p = db.pedidos.find((x) => x.id_pedido === idPedido);
    if (!p) badRequest('Pedido no encontrado');
    if (p.estado === 'facturado') badRequest('El pedido no admite más ítems');
    const idProducto = Number(body.id_producto);
    const prod = db.productos.find((x) => x.id_producto === idProducto);
    if (!prod || prod.activo === false) badRequest('Producto no disponible');
    if (prod.es_acompanamiento_mazorca) {
      badRequest(
        'El acompañamiento por comensal se ajusta con el número de comensales',
      );
    }
    const cat = db.categorias.find((x) => x.id_categoria === prod.id_categoria);
    if (!cat || !categoriaDisponibleHoyLocal(cat)) {
      badRequest('Este producto no está disponible en el menú de hoy');
    }
    const cantidad = Number(body.cantidad ?? 1);
    const sinEmpaque = body.sin_empaque_auto === true;
    const opcionIds = Array.isArray(body.opcion_ids)
      ? (body.opcion_ids as number[])
      : [];
    const notaCocina =
      body.nota_cocina != null && String(body.nota_cocina).trim() !== ''
        ? String(body.nota_cocina).trim()
        : null;
    const opcionOrdenados = [...opcionIds].sort((a, b) => a - b);
    const fusion = p.detalles.find((x) => {
      if (x.id_detalle_padre != null) return false;
      if (x.id_producto !== idProducto) return false;
      if ((x.nota_cocina ?? null) !== notaCocina) return false;
      if (x.enviado_cocina || x.listo_cocina || x.listo_para_recoger) return false;
      const ids = [...x.opcion_ids].sort((a, b) => a - b);
      return (
        ids.length === opcionOrdenados.length &&
        ids.every((id, i) => id === opcionOrdenados[i])
      );
    });
    if (fusion) {
      const debeAutoEmpaqueFusion =
        p.modo_servicio === 'para_llevar' &&
        productoCobraEmpaqueParaLlevarPorPlatoFuerte({
          es_plato_principal: prod.es_plato_principal,
          es_empacable: prod.es_empacable,
          categoria: categoriaDeProducto(db, prod),
        }) &&
        !sinEmpaque;
      if (debeAutoEmpaqueFusion) {
        asegurarEmpaqueAutoDetalleLocal(db, p, fusion.id_detalle, actor.id);
      }
      const cantidadAnterior = fusion.cantidad;
      fusion.cantidad += cantidad;
      if (fusion.id_detalle_padre == null) {
        for (const h of p.detalles) {
          if (h.id_detalle_padre === fusion.id_detalle) {
            h.cantidad = fusion.cantidad;
          }
        }
      }
      pushHistorialLocal(db, p.id_pedido, actor.id, 'cantidad_actualizada', {
        id_detalle: fusion.id_detalle,
        nombre_producto: prod.nombre,
        cantidad_anterior: cantidadAnterior,
        cantidad_nueva: fusion.cantidad,
        fusionado_al_agregar: true,
      });
      notificarCompaneroModificoPedidoLocal(
        db,
        p,
        actor,
        [{ nombre_producto: prod.nombre, cantidad }],
        'agregado',
      );
      await writeDb(db);
      return serializePedido(db, p) as T;
    }
    const debeAutoEmpaque =
      p.modo_servicio === 'para_llevar' &&
      productoCobraEmpaqueParaLlevarPorPlatoFuerte({
        es_plato_principal: prod.es_plato_principal,
        es_empacable: prod.es_empacable,
        categoria: categoriaDeProducto(db, prod),
      }) &&
      !sinEmpaque;
    const d: PedidoDetalle = {
      id_detalle: db.seq.detalle++,
      id_producto: idProducto,
      id_detalle_padre: null,
      cantidad,
      precio_unitario: prod.precio,
      nota_cocina: (body.nota_cocina as string | undefined) ?? null,
      opcion_ids: opcionIds,
      listo_cocina: false,
      listo_para_recoger: false,
      enviado_cocina: false,
    };
    p.detalles.push(d);
    const lineasAgregadas: {
      id_detalle: number;
      nombre_producto: string;
      cantidad: number;
    }[] = [
      {
        id_detalle: d.id_detalle,
        nombre_producto: prod.nombre,
        cantidad,
      },
    ];
    if (debeAutoEmpaque) {
      const emp = db.productos.find((x) => x.es_empacable);
      if (!emp) badRequest('No hay producto empacable configurado');
      const eDet = db.seq.detalle++;
      p.detalles.push({
        id_detalle: eDet,
        id_producto: emp.id_producto,
        id_detalle_padre: d.id_detalle,
        cantidad,
        precio_unitario: db.configOperativa.precio_empaque_para_llevar,
        nota_cocina: null,
        opcion_ids: [],
        listo_cocina: false,
        listo_para_recoger: false,
        enviado_cocina: false,
      });
      lineasAgregadas.push({
        id_detalle: eDet,
        nombre_producto: emp.nombre,
        cantidad,
      });
    }
    pushHistorialLocal(db, p.id_pedido, actor.id, 'detalle_agregado', {
      lineas: lineasAgregadas,
    });
    notificarCompaneroModificoPedidoLocal(
      db,
      p,
      actor,
      lineasAgregadas.filter((l) => l.nombre_producto === prod.nombre),
      'agregado',
    );
    await writeDb(db);
    return serializePedido(db, p) as T;
  }

  if (path.startsWith('/pedidos/') && path.endsWith('/sincronizar-empaques') && method === 'POST') {
    rechazarChefTomaPedidos(actor);
    const idPedido = Number(path.split('/')[2]);
    const p = db.pedidos.find((x) => x.id_pedido === idPedido);
    if (!p) badRequest('Pedido no encontrado');
    const empaquesCreados = sincronizarEmpaquesParaLlevarLocal(db, p, actor.id);
    await writeDb(db);
    return {
      ok: true,
      empaques_creados: empaquesCreados,
      pedido: serializePedido(db, p),
    } as T;
  }

  {
    const empaqueAuto = /^\/pedidos\/detalles\/(\d+)\/empaque-auto$/.exec(path);
    if (empaqueAuto && method === 'POST') {
      rechazarChefTomaPedidos(actor);
      const idDetalle = Number(empaqueAuto[1]);
      const p = db.pedidos.find((ped) =>
        ped.detalles.some((d) => d.id_detalle === idDetalle),
      );
      if (!p) badRequest('Detalle no encontrado');
      const creado = asegurarEmpaqueAutoDetalleLocal(
        db,
        p,
        idDetalle,
        actor.id,
      ).creado;
      await writeDb(db);
      return {
        ok: true,
        creado,
        pedido: serializePedido(db, p),
      } as T;
    }
  }

  if (path.startsWith('/pedidos/') && path.endsWith('/pasar-cocina') && method === 'POST') {
    rechazarChefTomaPedidos(actor);
    const idPedido = Number(path.split('/')[2]);
    const p = db.pedidos.find((x) => x.id_pedido === idPedido);
    if (!p) badRequest('Pedido no encontrado');
    if (p.estado === 'facturado') badRequest('El pedido ya fue facturado');
    if (p.detalles.length === 0) {
      badRequest('Agrega ítems al pedido antes de enviar a cocina');
    }
    const pendientes = p.detalles.filter((d) => {
      const prod = db.productos.find((x) => x.id_producto === d.id_producto);
      if (!prod) return false;
      const marcar = debeMarcarCocina(categoriaDeProducto(db, prod), Boolean(prod.es_empacable));
      return marcar && !(d.enviado_cocina ?? false);
    });
    if (pendientes.length === 0) {
      badRequest(
        'No hay platos nuevos para cocina (las bebidas solo se cobran al final)',
      );
    }
    const esAdicional = p.detalles.some((d) => {
      const prod = db.productos.find((x) => x.id_producto === d.id_producto);
      if (!prod) return false;
      const marcar = debeMarcarCocina(categoriaDeProducto(db, prod), Boolean(prod.es_empacable));
      return marcar && (d.enviado_cocina ?? false);
    });
    for (const d of pendientes) {
      d.enviado_cocina = true;
    }
    if (p.estado === 'abierto') {
      p.estado = 'en_cocina';
    }
    await writeDb(db);
    return {
      ok: true,
      es_adicional: esAdicional,
      impreso: false,
      impresion_en_cola: false,
      error_impresion: 'Impresión solo disponible con el API en el PC del restaurante',
      pedido: serializePedido(db, p),
    } as T;
  }

  {
    const patchCant = /^\/pedidos\/detalles\/(\d+)\/cantidad$/.exec(path);
    if (patchCant && method === 'PATCH') {
      rechazarChefTomaPedidos(actor);
      const idDetalle = Number(patchCant[1]);
      const cantidad = Number(body.cantidad ?? 0);
      if (cantidad < 1) badRequest('Cantidad inválida');
      for (const p of db.pedidos) {
        const det = p.detalles.find((x) => x.id_detalle === idDetalle);
        if (!det) continue;
        if (p.estado === 'facturado') badRequest('El pedido no admite cambios');
        if (det.cantidad === cantidad) {
          return serializePedido(db, p) as T;
        }
        const prod = db.productos.find((x) => x.id_producto === det.id_producto)!;
        if (prod.es_acompanamiento_mazorca) {
          badRequest('La cantidad del acompañamiento por comensal se ajusta con el número de comensales');
        }
        if (prod.es_empacable && det.id_detalle_padre != null) {
          const padre = p.detalles.find((x) => x.id_detalle === det.id_detalle_padre);
          if (!padre) badRequest('Línea de plato padre no encontrada');
          if (cantidad > padre.cantidad) {
            badRequest(
              `El empaque no puede superar la cantidad del plato (${padre.cantidad})`,
            );
          }
          if (cantidad < 1) {
            badRequest('Usa quitar línea para eliminar el empaque por completo');
          }
          const cantidadAnterior = det.cantidad;
          det.cantidad = cantidad;
          pushHistorialLocal(db, p.id_pedido, actor.id, 'cantidad_actualizada', {
            id_detalle: idDetalle,
            nombre_producto: prod.nombre,
            cantidad_anterior: cantidadAnterior,
            cantidad_nueva: cantidad,
            empaque_manual: true,
          });
          await writeDb(db);
          return serializePedido(db, p) as T;
        }
        const marcarCocina = debeMarcarCocina(
          categoriaDeProducto(db, prod),
          Boolean(prod.es_empacable),
        );
        if (
          cantidad > det.cantidad &&
          (det.enviado_cocina ?? false) &&
          marcarCocina
        ) {
          const delta = cantidad - det.cantidad;
          const hijosEmpaque = p.detalles.filter(
            (x) => x.id_detalle_padre === idDetalle,
          );
          const nuevoId = db.seq.detalle++;
          p.detalles.push({
            id_detalle: nuevoId,
            id_producto: det.id_producto,
            id_detalle_padre: null,
            cantidad: delta,
            precio_unitario: det.precio_unitario,
            nota_cocina: det.nota_cocina,
            opcion_ids: [...det.opcion_ids],
            listo_cocina: false,
            listo_para_recoger: false,
            enviado_cocina: false,
          });
          for (const h of hijosEmpaque) {
            p.detalles.push({
              id_detalle: db.seq.detalle++,
              id_producto: h.id_producto,
              id_detalle_padre: nuevoId,
              cantidad: delta,
              precio_unitario: h.precio_unitario,
              nota_cocina: null,
              opcion_ids: [],
              listo_cocina: false,
              listo_para_recoger: false,
              enviado_cocina: false,
            });
          }
          pushHistorialLocal(db, p.id_pedido, actor.id, 'detalle_agregado', {
            lineas: [
              {
                id_detalle: nuevoId,
                nombre_producto: prod.nombre,
                cantidad: delta,
                motivo: 'unidades_adicionales_pendientes_cocina',
              },
            ],
          });
          notificarCompaneroModificoPedidoLocal(
            db,
            p,
            actor,
            [{ nombre_producto: prod.nombre, cantidad: delta }],
            'agregado',
          );
          await writeDb(db);
          return serializePedido(db, p) as T;
        }
        const cantidadAnterior = det.cantidad;
        const hijosPre =
          det.id_detalle_padre == null
            ? p.detalles.filter((x) => x.id_detalle_padre === idDetalle)
            : [];
        det.cantidad = cantidad;
        if (det.id_detalle_padre == null) {
          for (const h of p.detalles) {
            if (h.id_detalle_padre !== idDetalle) continue;
            const hProd = db.productos.find((x) => x.id_producto === h.id_producto);
            h.cantidad = hProd?.es_empacable
              ? nuevaCantidadEmpaqueTrasCambioPadre(
                  h.cantidad,
                  cantidadAnterior,
                  cantidad,
                )
              : cantidad;
          }
        }
        pushHistorialLocal(db, p.id_pedido, actor.id, 'cantidad_actualizada', {
          id_detalle: idDetalle,
          nombre_producto: prod.nombre,
          cantidad_anterior: cantidadAnterior,
          cantidad_nueva: cantidad,
          empaques_vinculados_sincronizados:
            det.id_detalle_padre == null && hijosPre.length > 0,
        });
        if (cantidad > cantidadAnterior) {
          notificarCompaneroModificoPedidoLocal(
            db,
            p,
            actor,
            [
              {
                nombre_producto: prod.nombre,
                cantidad: cantidad - cantidadAnterior,
              },
            ],
            'agregado',
          );
        } else if (cantidad < cantidadAnterior) {
          notificarCompaneroModificoPedidoLocal(
            db,
            p,
            actor,
            [
              {
                nombre_producto: prod.nombre,
                cantidad: cantidadAnterior - cantidad,
              },
            ],
            'reducido',
          );
        }
        await writeDb(db);
        return serializePedido(db, p) as T;
      }
      badRequest('Línea no encontrada');
    }
  }

  {
    const delDet = /^\/pedidos\/detalles\/(\d+)$/.exec(path);
    if (delDet && method === 'DELETE') {
      rechazarChefTomaPedidos(actor);
      const idDetalle = Number(delDet[1]);
      for (const p of db.pedidos) {
        const det = p.detalles.find((x) => x.id_detalle === idDetalle);
        if (!det) continue;
        if (p.estado === 'facturado') badRequest('El pedido no admite cambios');
        const prod = db.productos.find((x) => x.id_producto === det.id_producto)!;
        if (prod.es_acompanamiento_mazorca) {
          badRequest('La línea de acompañamiento por comensal se ajusta con el número de comensales');
        }
        const hijos =
          det.id_detalle_padre == null
            ? p.detalles.filter((x) => x.id_detalle_padre === idDetalle)
            : [];
        const lineas = [
          {
            id_detalle: det.id_detalle,
            nombre_producto: prod.nombre,
            cantidad: det.cantidad,
          },
          ...hijos.map((h) => {
            const hp = db.productos.find((x) => x.id_producto === h.id_producto)!;
            return {
              id_detalle: h.id_detalle,
              nombre_producto: hp.nombre,
              cantidad: h.cantidad,
            };
          }),
        ];
        pushHistorialLocal(db, p.id_pedido, actor.id, 'detalle_eliminado', {
          lineas,
        });
        notificarCompaneroModificoPedidoLocal(
          db,
          p,
          actor,
          [{ nombre_producto: prod.nombre, cantidad: det.cantidad }],
          'quitado',
        );
        p.detalles = p.detalles.filter(
          (x) => x.id_detalle !== idDetalle && x.id_detalle_padre !== idDetalle,
        );
        await writeDb(db);
        return serializePedido(db, p) as T;
      }
      badRequest('Línea no encontrada');
    }
  }

  {
    const cm = /^\/pedidos\/(\d+)\/cliente-mulero$/.exec(path);
    if (cm && method === 'PATCH') {
      rechazarChefTomaPedidos(actor);
      const idPedido = Number(cm[1]);
      const p = db.pedidos.find((x) => x.id_pedido === idPedido);
      if (!p) badRequest('Pedido no encontrado');
      if (p.estado === 'facturado') badRequest('El pedido ya fue facturado');
      p.cliente_mulero = Boolean(body.cliente_mulero);
      const etiquetas = new Set(p.etiquetas_promocion ?? []);
      if (p.cliente_mulero) {
        etiquetas.add(ETIQUETA_LEGACY_MULERO);
      } else {
        etiquetas.delete(ETIQUETA_LEGACY_MULERO);
      }
      p.etiquetas_promocion = [...etiquetas];
      await writeDb(db);
      return serializePedido(db, p) as T;
    }
  }

  {
    const ep = /^\/pedidos\/(\d+)\/etiquetas-promocion$/.exec(path);
    if (ep && method === 'PATCH') {
      rechazarChefTomaPedidos(actor);
      const idPedido = Number(ep[1]);
      const p = db.pedidos.find((x) => x.id_pedido === idPedido);
      if (!p) badRequest('Pedido no encontrado');
      if (p.estado === 'facturado') badRequest('El pedido ya fue facturado');
      if (!ABIERTOS_LOCAL.includes(p.estado)) {
        badRequest('El pedido no admite cambios');
      }
      const etiquetas = [
        ...new Set(
          (Array.isArray(body.etiquetas_promocion) ? body.etiquetas_promocion : [])
            .map((x: unknown) => String(x).trim())
            .filter(Boolean),
        ),
      ];
      p.etiquetas_promocion = etiquetas;
      p.cliente_mulero =
        body.cliente_mulero != null
          ? Boolean(body.cliente_mulero)
          : etiquetas.includes(ETIQUETA_LEGACY_MULERO);
      await writeDb(db);
      return serializePedido(db, p) as T;
    }
  }

  {
    const mz = /^\/pedidos\/(\d+)\/mazorcas$/.exec(path);
    if (mz && method === 'PATCH') {
      rechazarChefTomaPedidos(actor);
      const idPedido = Number(mz[1]);
      const p = db.pedidos.find((x) => x.id_pedido === idPedido);
      if (!p) badRequest('Pedido no encontrado');
      if (!ABIERTOS_LOCAL.includes(p.estado)) {
        badRequest('El pedido no admite cambios');
      }
      const mesa = db.mesas.find((m) => m.id_mesa === p.id_mesa);
      if (!mesa) badRequest('Mesa no encontrada');
      const numComensales = Number(body.num_comensales);
      if (!Number.isFinite(numComensales) || numComensales < 1) {
        badRequest('Debe haber al menos 1 comensal');
      }
      p.num_comensales = numComensales;
      const mzId = idProductoMazorcaLocal(
        db.productos,
        db.configOperativa.id_producto_mazorca,
      );
      if (mzId != null) {
        const err = sincronizarLineaMazorcaLocal(
          p,
          mesa.numero,
          mzId,
          () => db.seq.detalle++,
          undefined,
          db.configOperativa.mazorca_activa,
        );
        if (err) badRequest(err);
      }
      await writeDb(db);
      return serializePedido(db, p) as T;
    }
  }

  if (path.startsWith('/pedidos/') && path.endsWith('/imprimir-precuenta') && method === 'POST') {
    rechazarChefTomaPedidos(actor);
    const idPedido = Number(path.split('/')[2]);
    const p = db.pedidos.find((x) => x.id_pedido === idPedido);
    if (!p) badRequest('Pedido no encontrado');
    if (p.estado === 'facturado') badRequest('Este pedido ya fue facturado');
    if (p.detalles.length === 0) badRequest('No hay ítems en el pedido');

    const detallesSerial = p.detalles.map((d) => ({
      id_detalle: d.id_detalle,
      id_detalle_padre: d.id_detalle_padre,
      cobrado: d.id_factura != null,
    }));
    const pendientes = idsDetallesPendientes(detallesSerial);
    if (pendientes.length === 0) badRequest('No quedan ítems pendientes de cobro');

    const rawIds = Array.isArray(body.id_detalles) ? body.id_detalles : [];
    const idsBase =
      rawIds.length > 0
        ? rawIds.map((x: unknown) => Number(x)).filter((n: number) => Number.isFinite(n))
        : pendientes;
    const idsCobro = expandirDetallesParaCobro(detallesSerial, idsBase);
    if (idsCobro.length === 0) {
      badRequest('Selecciona al menos un ítem pendiente de cobro');
    }

    const detallesCobro = p.detalles.filter((d) => idsCobro.includes(d.id_detalle));
    if (detallesCobro.some((d) => d.id_factura != null)) {
      badRequest('Algún ítem ya fue cobrado');
    }

    const subtotal = detallesCobro.reduce(
      (s, d) => s + d.precio_unitario * d.cantidad,
      0,
    );
    const config = mapConfigDescuentosLocal(db.configDescuentos);
    const lineas = detallesCobro.map((d) => {
      const prod = db.productos.find((x) => x.id_producto === d.id_producto)!;
      const cat = categoriaDeProducto(db, prod);
      return {
        cantidad: d.cantidad,
        subtotal_linea: d.precio_unitario * d.cantidad,
        nombre_producto: prod.nombre,
        categoria_nombre: prod.categoria_nombre,
        id_categoria: prod.id_categoria,
        es_plato_principal: Boolean(prod.es_plato_principal),
        participa_descuento_sopas: cat.participa_descuento_sopas,
      };
    });
    const descuentos = calcularDescuentosPedido(
      lineas,
      config,
      contextoDescuentosPedidoLocal(p),
    );
    if (descuentos.descuento_promociones > subtotal) {
      badRequest('Los descuentos no pueden superar el subtotal de esta cuenta');
    }

    return {
      ok: true,
      id_pedido: idPedido,
      impresion_precuenta: {
        impreso: false,
        error:
          'Impresión de pre-cuenta solo disponible con el API en el PC del restaurante',
      },
      factura_con_copia: body.factura_con_copia === true,
    } as T;
  }

  if (path.startsWith('/pedidos/') && path.endsWith('/facturar') && method === 'POST') {
    rechazarChefTomaPedidos(actor);
    const idPedido = Number(path.split('/')[2]);
    const p = db.pedidos.find((x) => x.id_pedido === idPedido);
    if (!p) badRequest('Pedido no encontrado');
    const pedido = p;
    if (pedido.estado === 'facturado') badRequest('Este pedido ya fue facturado');
    if (pedido.detalles.length === 0) badRequest('No hay ítems en el pedido');

    const detallesSerial = pedido.detalles.map((d) => ({
      id_detalle: d.id_detalle,
      id_detalle_padre: d.id_detalle_padre,
      cobrado: d.id_factura != null,
      cantidad: d.cantidad,
    }));
    const pendientes = idsDetallesPendientes(detallesSerial);
    if (pendientes.length === 0) badRequest('No quedan ítems pendientes de cobro');

    const rawCobro = Array.isArray(body.detalles_cobro) ? body.detalles_cobro : [];
    const detallesCobroBody = rawCobro
      .map((x: { id_detalle?: unknown; cantidad?: unknown }) => ({
        id_detalle: Number(x.id_detalle),
        cantidad: Number(x.cantidad),
      }))
      .filter(
        (x: { id_detalle: number; cantidad: number }) =>
          Number.isFinite(x.id_detalle) && x.cantidad > 0,
      );
    const rawIds = Array.isArray(body.id_detalles) ? body.id_detalles : [];
    let solicitudes;
    try {
      const base = resolverSolicitudesCobro(
        {
          id_detalles:
            rawIds.length > 0
              ? rawIds
                  .map((x: unknown) => Number(x))
                  .filter((n: number) => Number.isFinite(n))
              : undefined,
          detalles_cobro:
            detallesCobroBody.length > 0 ? detallesCobroBody : undefined,
        },
        detallesSerial,
        pendientes,
      );
      solicitudes = ordenarSolicitudesCobro(
        detallesSerial,
        expandirSolicitudesConEmpaques(detallesSerial, base),
      );
    } catch (e) {
      badRequest(e instanceof Error ? e.message : 'Cantidades de cobro inválidas');
    }
    if (solicitudes.length === 0) {
      badRequest('Selecciona al menos un ítem pendiente de cobro');
    }

    const detallesCobro = p.detalles.filter((d) =>
      solicitudes.some((s) => s.id_detalle === d.id_detalle),
    );
    if (detallesCobro.some((d) => d.id_factura != null)) {
      badRequest('Algún ítem ya fue cobrado');
    }

    const subtotal = subtotalDesdeSolicitudes(
      p.detalles.map((d) => ({
        id_detalle: d.id_detalle,
        precio_unitario: d.precio_unitario,
        cantidad: d.cantidad,
      })),
      solicitudes,
    );
    const config = mapConfigDescuentosLocal(db.configDescuentos);
    const lineas = lineasDescuentoDesdeSolicitudes(
      detallesCobro.map((d) => {
        const prod = db.productos.find((x) => x.id_producto === d.id_producto)!;
        const cat = categoriaDeProducto(db, prod);
        return {
          id_detalle: d.id_detalle,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          nombre_producto: prod.nombre,
          categoria_nombre: prod.categoria_nombre,
          id_categoria: prod.id_categoria,
          es_plato_principal: Boolean(prod.es_plato_principal),
          participa_descuento_sopas: cat.participa_descuento_sopas,
        };
      }),
      solicitudes,
    );
    const descuentos = calcularDescuentosPedido(
      lineas,
      config,
      contextoDescuentosPedidoLocal(p),
    );
    if (descuentos.descuento_promociones > subtotal) {
      badRequest('Los descuentos no pueden superar el subtotal de esta cuenta');
    }
    const total =
      subtotal - descuentos.descuento_promociones;
    const rawMp = String(body.metodo_pago ?? 'efectivo').toLowerCase();
    if (rawMp !== 'efectivo' && rawMp !== 'transferencia') {
      badRequest('Método de pago no válido (solo efectivo o transferencia).');
    }
    const metodoPago: Factura['metodo_pago'] =
      rawMp === 'transferencia' ? 'transferencia' : 'efectivo';
    const totalNeto = Math.round(total);
    const montoTransferencia =
      body.monto_transferencia != null
        ? Math.round(Number(body.monto_transferencia))
        : undefined;
    if (metodoPago === 'transferencia' && montoTransferencia != null) {
      if (montoTransferencia < totalNeto) {
        badRequest('La transferencia debe cubrir al menos el total de la cuenta');
      }
      const exceso = montoTransferencia - totalNeto;
      if (exceso > 0) {
        const dest = body.devolucion_exceso_metodo;
        if (dest !== 'efectivo' && dest !== 'transferencia' && dest !== 'domicilio' && dest !== 'mesero') {
          badRequest(
            'Indica si el exceso es devolución al cliente, pago domiciliario o propina al mesero',
          );
        }
      }
    }
    const quedanPendientes = quedaPendienteTrasCobro(detallesSerial, solicitudes);
    const montoRecibidoEfectivo =
      body.monto_recibido_efectivo != null
        ? Math.round(Number(body.monto_recibido_efectivo))
        : undefined;
    const detalleExcesoCobro = calcularDetalleExcesoCobro({
      total: totalNeto,
      metodo: metodoPago,
      monto_recibido_efectivo: montoRecibidoEfectivo,
      monto_transferencia: montoTransferencia,
      devolucion_exceso_metodo: body.devolucion_exceso_metodo as
        | 'efectivo'
        | 'transferencia'
        | 'domicilio'
        | 'mesero'
        | undefined,
    });
    const idFactura = db.seq.factura++;
    const factura: Factura = {
      id_factura: idFactura,
      id_pedido: idPedido,
      id_usuario: actor.id,
      subtotal,
      descuento_sopas: descuentos.descuento_sopas,
      descuento_muleros: descuentos.descuento_muleros,
      descuento_promociones: descuentos.descuento_promociones,
      total,
      metodo_pago: metodoPago,
      emitida_en: todayIso(),
      es_parcial: quedanPendientes,
      detalle_exceso_cobro: detalleExcesoCobro ?? undefined,
    };
    db.facturas.push(factura);

    function aplicarCobroLocal(det: PedidoDetalle, cantidadCobrar: number) {
      if (cantidadCobrar < 1 || cantidadCobrar > det.cantidad) {
        badRequest('Cantidad de cobro inválida');
      }
      if (cantidadCobrar === det.cantidad) {
        det.id_factura = idFactura;
        return;
      }
      const queda = det.cantidad - cantidadCobrar;
      det.cantidad = queda;
      const nuevoId = db.seq.detalle++;
      pedido.detalles.push({
        id_detalle: nuevoId,
        id_producto: det.id_producto,
        id_detalle_padre: det.id_detalle_padre,
        cantidad: cantidadCobrar,
        precio_unitario: det.precio_unitario,
        nota_cocina: det.nota_cocina,
        opcion_ids: [...det.opcion_ids],
        listo_cocina: det.listo_cocina,
        listo_para_recoger: det.listo_para_recoger,
        enviado_cocina: det.enviado_cocina,
        id_factura: idFactura,
      });
    }

    const byId = new Map(pedido.detalles.map((d) => [d.id_detalle, d]));
    for (const s of solicitudes) {
      const det = byId.get(s.id_detalle);
      if (!det) continue;
      aplicarCobroLocal(det, s.cantidad);
    }
    if (
      metodoPago === 'transferencia' &&
      montoTransferencia != null &&
      montoTransferencia > totalNeto
    ) {
      const dest = body.devolucion_exceso_metodo as
        | 'efectivo'
        | 'transferencia'
        | 'domicilio'
        | 'mesero';
      const esDomicilio = dest === 'domicilio';
      const esMesero = dest === 'mesero';
      const mesero = db.users.find((u) => u.id === p.id_usuario);
      const nombreMesero = mesero
        ? `${mesero.nombre} ${mesero.apellido}`.trim()
        : 'Mesero';
      db.movimientosCaja.push({
        id_movimiento: db.seq.movimientoCaja++,
        fecha: toDateKey(todayIso()),
        tipo: esMesero
          ? 'pago_mesero'
          : esDomicilio
            ? 'pago_domicilio'
            : 'devolucion_exceso_transferencia',
        monto: montoTransferencia - totalNeto,
        motivo: esMesero
          ? `${nombreMesero} · pedido #${idPedido}`
          : esDomicilio
            ? `Domicilio · pedido #${idPedido}`
            : null,
        metodo_devolucion: esDomicilio || esMesero ? null : dest,
        id_pedido: idPedido,
        id_factura: idFactura,
        id_usuario: actor.id,
        creado_en: todayIso(),
      });
    }
    const idMesaP = p.id_mesa;
    if (!quedanPendientes) {
      p.estado = 'facturado';
      p.cerrado_en = todayIso();
      const mesa = db.mesas.find((m) => m.id_mesa === idMesaP);
      const abiertosRest = db.pedidos.filter(
        (x) => x.id_mesa === idMesaP && ABIERTOS_LOCAL.includes(x.estado),
      ).length;
      if (mesa && abiertosRest === 0) {
        mesa.estado = 'libre';
      }
    }
    await writeDb(db);
    const serialized = serializePedido(db, p);
    const quiereImprimir = body.imprimir_factura !== false;
    return {
      ...serialized,
      id_factura_emitida: idFactura,
      cobro_completo: !quedanPendientes,
      impresion_factura: quiereImprimir
        ? {
            impreso: false,
            error:
              'Impresión de factura solo disponible con el API en el PC del restaurante',
          }
        : { impreso: false, omitido: true },
    } as T;
  }

  if (
    path.startsWith('/pedidos/') &&
    path.endsWith('/plan/omitir-cuota') &&
    method === 'POST'
  ) {
    rechazarChefTomaPedidos(actor);
    const idPedido = Number(path.split('/')[2]);
    const p = db.pedidos.find((x) => x.id_pedido === idPedido);
    if (!p) badRequest('Pedido no encontrado');
    if (p.estado === 'facturado') badRequest('Este pedido ya fue facturado');
    if (!ABIERTOS_LOCAL.includes(p.estado)) {
      badRequest('El pedido no admite cambios');
    }

    const enPlan =
      body.plan_personas_sobre_total === true ||
      body.plan_combinado_sobre_seleccion === true;
    if (!enPlan) badRequest('Solo aplica en cobro por personas o combinado');

    const personaIdx = Number(body.persona_plan_indice);
    const monto = Math.round(Number(body.monto_persona_plan));
    const totalPersonas = Number(body.total_personas_plan);
    const facturasBase = Number(body.facturas_base_plan);

    if (
      !Number.isFinite(personaIdx) ||
      personaIdx < 1 ||
      personaIdx > totalPersonas
    ) {
      badRequest('Índice de persona inválido');
    }
    if (!Number.isFinite(monto) || monto <= 0) badRequest('Cuota inválida');

    const historialRows = db.pedidoHistorial
      .filter((h) => h.id_pedido === idPedido)
      .map((h) => ({ tipo: h.tipo, detalle: h.detalle }));
    const cuotasRegistradas = listarCuotasPlanOmitidas(
      p.detalles.map((d) => {
        const prod = db.productos.find((x) => x.id_producto === d.id_producto);
        return {
          cobrado: d.id_factura != null,
          nota_cocina: d.nota_cocina,
          es_cuota_pendiente_reparto: Boolean(prod?.es_cuota_pendiente_reparto),
          precio_unitario: d.precio_unitario,
          cantidad: d.cantidad,
        };
      }),
      historialRows,
    );
    const yaExiste = cuotasRegistradas.some(
      (c) =>
        c.persona_plan_indice === personaIdx &&
        c.facturas_base_plan === facturasBase,
    );
    if (yaExiste) {
      badRequest(
        `La persona ${personaIdx} ya tiene cuota pendiente registrada`,
      );
    }

    const planBaseRaw = Math.round(Number(body.plan_base_total ?? 0));
    const poolRef =
      body.plan_combinado_sobre_seleccion === true &&
      Array.isArray(body.detalles_seleccion_referencia)
        ? (body.detalles_seleccion_referencia as {
            id_detalle?: number;
            cantidad?: number;
          }[])
            .map((s) => ({
              id_detalle: Number(s.id_detalle),
              cantidad: Number(s.cantidad),
            }))
            .filter((s) => s.id_detalle > 0 && s.cantidad > 0)
        : null;
    const planBase =
      planBaseRaw > 0
        ? planBaseRaw
        : monto * (Number.isFinite(totalPersonas) ? totalPersonas : 1);
    const facturasPedido = db.facturas
      .filter((f) => f.id_pedido === idPedido)
      .sort((a, b) => a.id_factura - b.id_factura);
    const cobradoEnPlan = facturasPedido
      .slice(facturasBase)
      .reduce((s, f) => s + Math.round(f.total), 0);
    const montoSaldo = Math.max(0, planBase - cobradoEnPlan);
    const idProdSaldo = ensureProductoCuotaPendienteLocal(
      db.productos,
      db.categorias,
      () => Math.max(0, ...db.productos.map((x) => x.id_producto)) + 1,
    );
    const notaSaldo = formatSaldoRestanteNota(poolRef);
    const saldoExistente = p.detalles.find(
      (d) =>
        d.id_factura == null && esNotaSaldoRestantePendiente(d.nota_cocina),
    );
    if (montoSaldo <= 0) {
      if (saldoExistente) {
        p.detalles = p.detalles.filter(
          (d) => d.id_detalle !== saldoExistente.id_detalle,
        );
      }
    } else if (saldoExistente) {
      saldoExistente.precio_unitario = montoSaldo;
      saldoExistente.cantidad = 1;
      saldoExistente.nota_cocina = notaSaldo;
    } else {
      p.detalles.push({
        id_detalle: db.seq.detalle++,
        id_producto: idProdSaldo,
        id_detalle_padre: null,
        cantidad: 1,
        precio_unitario: montoSaldo,
        nota_cocina: notaSaldo,
        enviado_cocina: false,
        listo_cocina: false,
        listo_para_recoger: false,
        id_factura: null,
        opcion_ids: [],
      });
    }

    const planSesionId = Number(body.plan_sesion_id);
    pushHistorialLocal(db, idPedido, actor?.id ?? p.id_usuario, 'detalle_agregado', {
      cuota_plan_omitida: true,
      persona_plan_indice: personaIdx,
      monto_persona_plan: monto,
      total_personas_plan: totalPersonas,
      facturas_base_plan: facturasBase,
      plan_sesion_id:
        Number.isFinite(planSesionId) && planSesionId > 0
          ? planSesionId
          : undefined,
      plan_base_total: planBase,
      plan_personas_sobre_total: body.plan_personas_sobre_total === true,
      plan_combinado_sobre_seleccion:
        body.plan_combinado_sobre_seleccion === true,
    });

    await writeDb(db);
    return serializePedido(db, p) as T;
  }

  if (
    path.startsWith('/pedidos/') &&
    path.endsWith('/plan/reconciliar-saldo-platos') &&
    method === 'POST'
  ) {
    rechazarChefTomaPedidos(actor);
    const idPedido = Number(path.split('/')[2]);
    const p = db.pedidos.find((x) => x.id_pedido === idPedido);
    if (!p) badRequest('Pedido no encontrado');
    if (p.estado === 'facturado') badRequest('Este pedido ya fue facturado');
    if (!ABIERTOS_LOCAL.includes(p.estado)) {
      badRequest('El pedido no admite cambios');
    }

    const saldo = p.detalles.find(
      (d) =>
        d.id_factura == null && esNotaSaldoRestantePendiente(d.nota_cocina),
    );
    if (!saldo) {
      return serializePedido(db, p) as T;
    }

    const montoSaldo = Math.round(saldo.precio_unitario) * saldo.cantidad;
    const pool = parseSaldoRestantePool(saldo.nota_cocina);
    const facturasPed = db.facturas
      .filter((f) => f.id_pedido === idPedido)
      .sort((a, b) => a.id_factura - b.id_factura);
    const idsFacturasPlan = new Set<number>();
    for (const f of facturasPed) {
      if (
        (f as { plan_personas_sobre_total?: boolean }).plan_personas_sobre_total ||
        (f as { plan_combinado_sobre_seleccion?: boolean })
          .plan_combinado_sobre_seleccion
      ) {
        idsFacturasPlan.add(f.id_factura);
      }
    }
    for (const d of p.detalles) {
      if (
        d.id_factura != null &&
        (d.nota_cocina ?? '').startsWith('saldo_restante:abono')
      ) {
        idsFacturasPlan.add(d.id_factura);
      }
    }

    const esCandidato = (d: PedidoDetalle, incluirPlan: boolean) => {
      if (d.id_detalle_padre != null) return false;
      const prod = db.productos.find((x) => x.id_producto === d.id_producto);
      if (prod?.es_cuota_pendiente_reparto) return false;
      if (esNotaSaldoRestantePendiente(d.nota_cocina)) return false;
      if (d.id_factura != null) {
        if (!incluirPlan || !idsFacturasPlan.has(d.id_factura)) return false;
      }
      if (pool != null && pool.length > 0) {
        return pool.some((x) => x.id_detalle === d.id_detalle);
      }
      return true;
    };

    let candidatos = p.detalles.filter((d) => esCandidato(d, false));
    const platosInput = candidatos.map((d) => ({
      id_detalle: d.id_detalle,
      precio_unitario: d.precio_unitario,
      cantidad: d.cantidad,
    }));
    if (
      !saldoNecesitaReconciliarAPlatos(
        montoSaldo,
        platosInput,
        saldo.nota_cocina,
      )
    ) {
      return serializePedido(db, p) as T;
    }

    if (candidatos.length === 0 && idsFacturasPlan.size > 0) {
      for (const d of p.detalles) {
        if (!esCandidato(d, true)) continue;
        d.id_factura = null;
        for (const h of p.detalles) {
          if (
            h.id_detalle_padre === d.id_detalle &&
            h.id_factura != null &&
            idsFacturasPlan.has(h.id_factura)
          ) {
            h.id_factura = null;
          }
        }
      }
      candidatos = p.detalles.filter((d) => esCandidato(d, false));
    }
    if (candidatos.length === 0) {
      return serializePedido(db, p) as T;
    }

    const dist = distribuirSaldoEnPlatos(
      montoSaldo,
      candidatos.map((d) => ({
        id_detalle: d.id_detalle,
        precio_unitario: d.precio_unitario,
        cantidad: d.cantidad,
      })),
    );
    const liberarPorId = new Map(
      dist.liberaciones.map((l) => [l.id_detalle, l.cantidad]),
    );
    const idFacturaRef =
      facturasPed.length > 0
        ? facturasPed[facturasPed.length - 1]!.id_factura
        : null;

    for (const d of [...candidatos]) {
      const liberar = liberarPorId.get(d.id_detalle) ?? 0;
      const marcar = d.cantidad - liberar;
      if (marcar <= 0 || idFacturaRef == null) continue;
      if (marcar === d.cantidad) {
        d.id_factura = idFacturaRef;
        for (const h of p.detalles) {
          if (h.id_detalle_padre === d.id_detalle && h.id_factura == null) {
            h.id_factura = idFacturaRef;
          }
        }
      } else {
        d.cantidad = liberar;
        p.detalles.push({
          id_detalle: db.seq.detalle++,
          id_producto: d.id_producto,
          id_detalle_padre: d.id_detalle_padre,
          cantidad: marcar,
          precio_unitario: d.precio_unitario,
          nota_cocina: d.nota_cocina,
          opcion_ids: [...d.opcion_ids],
          listo_cocina: d.listo_cocina,
          listo_para_recoger: d.listo_para_recoger,
          enviado_cocina: d.enviado_cocina,
          id_factura: idFacturaRef,
        });
      }
    }

    if (dist.montoSaldoRestante <= 0) {
      p.detalles = p.detalles.filter((d) => d.id_detalle !== saldo.id_detalle);
    } else {
      saldo.precio_unitario = dist.montoSaldoRestante;
      saldo.cantidad = 1;
      saldo.nota_cocina = SALDO_RESTANTE_FRAGMENTO_NOTA;
    }

    pushHistorialLocal(db, idPedido, actor?.id ?? p.id_usuario, 'detalle_agregado', {
      saldo_reconciliado_a_platos: true,
      monto_saldo_antes: montoSaldo,
      monto_platos: dist.montoPlatos,
      monto_saldo_restante: dist.montoSaldoRestante,
      liberaciones: dist.liberaciones,
    });

    await writeDb(db);
    return serializePedido(db, p) as T;
  }

  if (
    path.startsWith('/pedidos/') &&
    path.endsWith('/facturar-mixto') &&
    method === 'POST'
  ) {
    rechazarChefTomaPedidos(actor);
    const idPedido = Number(path.split('/')[2]);
    const p = db.pedidos.find((x) => x.id_pedido === idPedido);
    if (!p) badRequest('Pedido no encontrado');
    if (p.estado === 'facturado') badRequest('Este pedido ya fue facturado');
    if (p.detalles.length === 0) badRequest('No hay ítems en el pedido');

    const montoTransferencia = Math.round(Number(body.monto_transferencia ?? 0));
    if (!Number.isFinite(montoTransferencia) || montoTransferencia < 1) {
      badRequest('Indica cuánto transfirió el cliente');
    }
    const montoRecibidoEfectivo =
      body.monto_recibido_efectivo != null
        ? Math.round(Number(body.monto_recibido_efectivo))
        : undefined;

    const detallesSerial = p.detalles.map((d) => ({
      id_detalle: d.id_detalle,
      id_detalle_padre: d.id_detalle_padre,
      cobrado: d.id_factura != null,
      cantidad: d.cantidad,
    }));
    const pendientes = idsDetallesPendientes(detallesSerial);
    if (pendientes.length === 0) badRequest('No quedan ítems pendientes de cobro');

    const rawCobro = Array.isArray(body.detalles_cobro) ? body.detalles_cobro : [];
    const detallesCobroBody = rawCobro
      .map((x: { id_detalle?: unknown; cantidad?: unknown }) => ({
        id_detalle: Number(x.id_detalle),
        cantidad: Number(x.cantidad),
      }))
      .filter(
        (x: { id_detalle: number; cantidad: number }) =>
          Number.isFinite(x.id_detalle) && x.cantidad > 0,
      );
    let solicitudes: DetalleCobroCantidad[];
    try {
      const base = resolverSolicitudesCobro(
        {
          detalles_cobro:
            detallesCobroBody.length > 0 ? detallesCobroBody : undefined,
        },
        detallesSerial,
        pendientes,
      );
      solicitudes = ordenarSolicitudesCobro(
        detallesSerial,
        expandirSolicitudesConEmpaques(detallesSerial, base),
      );
    } catch (e) {
      badRequest(e instanceof Error ? e.message : 'Cantidades de cobro inválidas');
    }
    if (solicitudes.length === 0) {
      badRequest('Selecciona al menos un ítem pendiente de cobro');
    }

    const config = mapConfigDescuentosLocal(db.configDescuentos);

    function importesDesdeSolicitudes(sol: DetalleCobroCantidad[]) {
      const detallesCobro = p!.detalles.filter((d) =>
        sol.some((s) => s.id_detalle === d.id_detalle),
      );
      const subtotal = subtotalDesdeSolicitudes(
        p!.detalles.map((d) => ({
          id_detalle: d.id_detalle,
          precio_unitario: d.precio_unitario,
          cantidad: d.cantidad,
        })),
        sol,
      );
      const lineas = lineasDescuentoDesdeSolicitudes(
        detallesCobro.map((d) => {
          const prod = db.productos.find((x) => x.id_producto === d.id_producto)!;
          const cat = categoriaDeProducto(db, prod);
          return {
            id_detalle: d.id_detalle,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
            nombre_producto: prod.nombre,
            categoria_nombre: prod.categoria_nombre,
            id_categoria: prod.id_categoria,
            es_plato_principal: Boolean(prod.es_plato_principal),
            participa_descuento_sopas:
              'participa_descuento_sopas' in cat
                ? cat.participa_descuento_sopas
                : undefined,
          };
        }),
        sol,
      );
      const descuentos = calcularDescuentosPedido(
        lineas,
        config,
        contextoDescuentosPedidoLocal(p!),
      );
      const descTotal = descuentos.descuento_promociones;
      if (descTotal > subtotal) {
        badRequest('Los descuentos no pueden superar el subtotal de esta cuenta');
      }
      const total = subtotal - descTotal;
      return { subtotal, descuentos, total };
    }

    const importesTotales = importesDesdeSolicitudes(solicitudes);
    const totalNeto = importesTotales.total;
    const recibidoEf = montoRecibidoEfectivo ?? 0;
    const metodoDev = body.devolucion_exceso_metodo as
      | 'efectivo'
      | 'transferencia'
      | 'domicilio'
      | 'mesero'
      | undefined;
    const reparto = repartoMixtoConDevolucion(
      totalNeto,
      montoTransferencia,
      recibidoEf,
      metodoDev,
    );

    if (reparto.excesoDevolverEfectivo === 0) {
      if (reparto.efectivoFactura + reparto.transferenciaFactura !== totalNeto) {
        badRequest('Efectivo y transferencia deben sumar el total de esta cuenta');
      }
    } else {
      if (
        metodoDev !== 'efectivo' &&
        metodoDev !== 'transferencia' &&
        metodoDev !== 'domicilio' &&
        metodoDev !== 'mesero'
      ) {
        badRequest(
          'Indica si el exceso es devolución al cliente, pago domiciliario o propina al mesero',
        );
      }
    }
    if (reparto.efectivoFactura > 0 && recibidoEf < reparto.efectivoFactura) {
      badRequest('El efectivo recibido debe cubrir la parte en efectivo');
    }

    const detalleExcesoCobro = calcularDetalleExcesoCobro({
      total: totalNeto,
      metodo: 'mixto',
      monto_recibido_efectivo: recibidoEf,
      monto_transferencia: montoTransferencia,
      devolucion_exceso_metodo: metodoDev,
    });

    const precios: Record<number, number> = {};
    const lineasPadre: {
      id_detalle: number;
      precio_unitario: number;
      cantidad_pendiente: number;
    }[] = [];
    const cantSolicitud = new Map(
      solicitudes.map((s) => [s.id_detalle, s.cantidad]),
    );
    for (const d of p.detalles) {
      precios[d.id_detalle] = d.precio_unitario;
      if (d.id_detalle_padre != null) continue;
      const q = cantSolicitud.get(d.id_detalle);
      if (q == null || q <= 0) continue;
      lineasPadre.push({
        id_detalle: d.id_detalle,
        precio_unitario: d.precio_unitario,
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
      return importesDesdeSolicitudes(expandidas).total;
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

    // Nunca partir precios: montos exactos van en cabecera de factura.
    if (
      reparto.efectivoFactura > 0 &&
      reparto.transferenciaFactura > 0 &&
      (solEfectivo.length === 0 || solTransferencia.length === 0)
    ) {
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
    const descFull =
      importesTotales.descuentos.descuento_sopas +
      importesTotales.descuentos.descuento_muleros +
      importesTotales.descuentos.descuento_promociones;
    const fullImportes = {
      subtotal:
        totalNeto === importesTotales.total
          ? importesTotales.subtotal
          : totalNeto + descFull,
      descuento_sopas: importesTotales.descuentos.descuento_sopas,
      descuento_muleros: importesTotales.descuentos.descuento_muleros,
      descuento_promociones: importesTotales.descuentos.descuento_promociones,
      total: totalNeto,
    };
    const proporcionales =
      cobroMixtoGrupo != null
        ? importesProporcionalesMixto(fullImportes, reparto.efectivoFactura)
        : null;
    const quedanPendientes = quedaPendienteTrasCobro(detallesSerial, solicitudes);
    const idsFacturas: number[] = [];

    function aplicarCobroLocal(det: PedidoDetalle, cantidadCobrar: number, idFactura: number) {
      if (cantidadCobrar < 1 || cantidadCobrar > det.cantidad) {
        badRequest('Cantidad de cobro inválida');
      }
      if (det.id_factura != null) {
        badRequest('Algún ítem ya fue cobrado');
      }
      if (cantidadCobrar === det.cantidad) {
        det.id_factura = idFactura;
        return;
      }
      const queda = det.cantidad - cantidadCobrar;
      det.cantidad = queda;
      const nuevoId = db.seq.detalle++;
      p!.detalles.push({
        id_detalle: nuevoId,
        id_producto: det.id_producto,
        id_detalle_padre: det.id_detalle_padre,
        cantidad: cantidadCobrar,
        precio_unitario: det.precio_unitario,
        nota_cocina: det.nota_cocina,
        opcion_ids: [...det.opcion_ids],
        listo_cocina: det.listo_cocina,
        listo_para_recoger: det.listo_para_recoger,
        enviado_cocina: det.enviado_cocina,
        id_factura: idFactura,
      });
    }

    function crearFacturaLocal(
      sol: DetalleCobroCantidad[],
      metodoPago: Factura['metodo_pago'],
      grupo: number | null,
      importesForzados: {
        subtotal: number;
        descuento_sopas: number;
        descuento_muleros: number;
        descuento_promociones: number;
        total: number;
      },
    ) {
      const idFactura = db.seq.factura++;
      const factura: Factura = {
        id_factura: idFactura,
        id_pedido: idPedido,
        id_usuario: actor.id,
        subtotal: importesForzados.subtotal,
        descuento_sopas: importesForzados.descuento_sopas,
        descuento_muleros: importesForzados.descuento_muleros,
        descuento_promociones: importesForzados.descuento_promociones,
        total: importesForzados.total,
        metodo_pago: metodoPago,
        emitida_en: todayIso(),
        es_parcial: quedanPendientes,
        persona_plan_indice:
          body.persona_plan_indice != null
            ? Number(body.persona_plan_indice)
            : undefined,
        cobro_mixto_grupo: grupo ?? undefined,
        detalle_exceso_cobro: detalleExcesoCobro ?? undefined,
      };
      db.facturas.push(factura);
      idsFacturas.push(idFactura);

      const byId = new Map(p!.detalles.map((d) => [d.id_detalle, d]));
      for (const s of sol) {
        const det = byId.get(s.id_detalle);
        if (!det) continue;
        aplicarCobroLocal(det, s.cantidad, idFactura);
      }
      return idFactura;
    }

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
      crearFacturaLocal(solEfectivo, 'efectivo', cobroMixtoGrupo, impEf);
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
      crearFacturaLocal(solTransferencia, 'transferencia', cobroMixtoGrupo, impTr);
    }

    if (reparto.excesoDevolverEfectivo > 0) {
      const metodoDev = body.devolucion_exceso_metodo as
        | 'efectivo'
        | 'transferencia'
        | 'domicilio'
        | 'mesero';
      const esDomicilio = metodoDev === 'domicilio';
      const esMesero = metodoDev === 'mesero';
      const mesero = db.users.find((u) => u.id === p!.id_usuario);
      const nombreMesero = mesero
        ? `${mesero.nombre} ${mesero.apellido}`.trim()
        : 'Mesero';
      db.movimientosCaja.push({
        id_movimiento: db.seq.movimientoCaja++,
        fecha: toDateKey(todayIso()),
        tipo: esMesero
          ? 'pago_mesero'
          : esDomicilio
            ? 'pago_domicilio'
            : 'devolucion_exceso_transferencia',
        monto: reparto.excesoDevolverEfectivo,
        motivo: esMesero
          ? `${nombreMesero} · pedido #${idPedido}`
          : esDomicilio
            ? `Domicilio · pedido #${idPedido}`
            : null,
        metodo_devolucion: esDomicilio || esMesero ? null : metodoDev,
        id_pedido: idPedido,
        id_factura: idsFacturas[0],
        id_usuario: actor.id,
        creado_en: todayIso(),
      });
    }

    const idMesaP = p.id_mesa;
    if (!quedanPendientes) {
      p.estado = 'facturado';
      p.cerrado_en = todayIso();
      const mesa = db.mesas.find((m) => m.id_mesa === idMesaP);
      const abiertosRest = db.pedidos.filter(
        (x) => x.id_mesa === idMesaP && ABIERTOS_LOCAL.includes(x.estado),
      ).length;
      if (mesa && abiertosRest === 0) {
        mesa.estado = 'libre';
      }
    }

    await writeDb(db);
    const serialized = serializePedido(db, p);
    const quiereImprimir = body.imprimir_factura !== false;
    const idFacturaImprimir =
      cobroMixtoGrupo != null
        ? Math.min(...idsFacturas)
        : idsFacturas[idsFacturas.length - 1]!;
    return {
      ...serialized,
      id_factura_emitida: idFacturaImprimir,
      cobro_completo: !quedanPendientes,
      impresion_factura: quiereImprimir
        ? {
            impreso: false,
            error:
              'Impresión de factura solo disponible con el API en el PC del restaurante',
          }
        : { impreso: false, omitido: true },
    } as T;
  }

  if (path.startsWith('/pedidos/') && path.endsWith('/reimprimir-comanda') && method === 'POST') {
    const idPedido = Number(path.split('/')[2]);
    const p = db.pedidos.find((x) => x.id_pedido === idPedido);
    if (!p) badRequest('Pedido no encontrado');
    const enviados = p.detalles.filter(
      (d) => detalleMarcaCocina(db, d) && d.enviado_cocina,
    );
    if (enviados.length === 0) {
      badRequest('No hay platos enviados a cocina para reimprimir');
    }
    return {
      ok: true,
      id_pedido: idPedido,
      lineas: enviados.length,
      impresion_comanda: {
        impreso: false,
        error:
          'Reimpresión de comanda solo disponible con el API en el PC del restaurante',
      },
    } as T;
  }

  if (
    /\/pedidos\/\d+\/enviar-factura-correo$/.test(path.split('?')[0]) &&
    method === 'POST'
  ) {
    badRequest(
      'El envío por correo requiere el API en el PC del restaurante con internet y SMTP configurado.',
    );
  }

  if (
    /\/pedidos\/\d+\/reimprimir-factura/.test(path.split('?')[0]) &&
    method === 'POST'
  ) {
    const pathOnly = path.split('?')[0];
    const idPedido = Number(pathOnly.split('/')[2]);
    const url = new URL(`http://local${path}`);
    const idFacturaParam = url.searchParams.get('id_factura');
    const p = db.pedidos.find((x) => x.id_pedido === idPedido);
    if (!p) badRequest('Pedido no encontrado');
    const delPedido = db.facturas.filter((f) => f.id_pedido === idPedido);
    const factura =
      idFacturaParam != null && idFacturaParam !== ''
        ? delPedido.find((f) => f.id_factura === Number(idFacturaParam))
        : delPedido[delPedido.length - 1];
    if (!factura) badRequest('Factura no encontrada');
    return {
      ok: true,
      id_pedido: idPedido,
      id_factura: factura.id_factura,
      impresion_factura: {
        impreso: false,
        error:
          'Reimpresión solo disponible con el API en el PC del restaurante',
      },
    } as T;
  }

  if (
    /\/pedidos\/\d+\/reimprimir-pedido-total$/.test(path.split('?')[0]) &&
    method === 'POST'
  ) {
    const pathOnly = path.split('?')[0];
    const idPedido = Number(pathOnly.split('/')[2]);
    const p = db.pedidos.find((x) => x.id_pedido === idPedido);
    if (!p) badRequest('Pedido no encontrado');
    if (p.estado !== 'facturado') {
      badRequest('El pedido aún no está pagado por completo');
    }
    const delPedido = db.facturas.filter((f) => f.id_pedido === idPedido);
    if (delPedido.length === 0) badRequest('Este pedido no tiene facturas');
    return {
      ok: true,
      id_pedido: idPedido,
      num_cobros: delPedido.length,
      impresion_factura: {
        impreso: false,
        error:
          'Reimpresión solo disponible con el API en el PC del restaurante',
      },
    } as T;
  }

  if (path.startsWith('/pedidos/') && path.endsWith('/cancelar') && method === 'POST') {
    rechazarChefTomaPedidos(actor);
    const idPedido = Number(path.split('/')[2]);
    const idx = db.pedidos.findIndex((x) => x.id_pedido === idPedido);
    if (idx < 0) badRequest('Pedido no encontrado');
    const p = db.pedidos[idx];
    if (p.estado === 'facturado') badRequest('No se puede cancelar un pedido facturado');
    const idMesaP = p.id_mesa;
    db.pedidoHistorial = db.pedidoHistorial.filter((h) => h.id_pedido !== idPedido);
    db.pedidos.splice(idx, 1);
    const mesa = db.mesas.find((m) => m.id_mesa === idMesaP);
    const abiertosRest = db.pedidos.filter(
      (x) => x.id_mesa === idMesaP && ABIERTOS_LOCAL.includes(x.estado),
    ).length;
    if (mesa && abiertosRest === 0) {
      mesa.estado = 'libre';
    }
    await writeDb(db);
    return { ok: true } as T;
  }

  if (path.startsWith('/pedidos/') && path.endsWith('/transferir') && method === 'POST') {
    rechazarChefTomaPedidos(actor);
    const idPedido = Number(path.split('/')[2]);
    const p = db.pedidos.find((x) => x.id_pedido === idPedido);
    if (!p) badRequest('Pedido no encontrado');
    if (p.estado === 'facturado' || db.facturas.some((f) => f.id_pedido === idPedido)) {
      badRequest('No se puede transferir un pedido con cobros registrados');
    }
    if (!ABIERTOS_LOCAL.includes(p.estado)) {
      badRequest('El pedido no se puede transferir');
    }

    const numMesaNueva = Number(body.mesa_numero_nuevo ?? 0);
    const mesaNueva = db.mesas.find((m) => m.numero === numMesaNueva);
    if (!mesaNueva) badRequest('Mesa destino no encontrada');
    const mesaOrigen = db.mesas.find((m) => m.id_mesa === p.id_mesa);
    if (!mesaOrigen) badRequest('Mesa origen no encontrada');
    if (mesaNueva.id_mesa === p.id_mesa) {
      badRequest('La mesa destino debe ser diferente');
    }
    if (!mesaDisponibleHoyLocal(mesaNueva)) {
      badRequest('La mesa destino no está disponible hoy');
    }

    const pedidoEnDestino = db.pedidos.find(
      (x) =>
        x.id_mesa === mesaNueva.id_mesa && ABIERTOS_LOCAL.includes(x.estado),
    );
    const destinoLibre =
      mesaNueva.estado === 'libre' && pedidoEnDestino == null;

    const validacion = validarTransferenciaPedido({
      origen_mesa_numero: mesaOrigen.numero,
      destino_mesa_numero: mesaNueva.numero,
      destino_libre: destinoLibre,
      mesas_virtuales: db.configOperativa,
    });
    if (validacion.accion === 'rechazar') {
      badRequest(validacion.mensaje);
    }

    const idAnterior = p.id_mesa;

    p.id_mesa = mesaNueva.id_mesa;
    p.modo_servicio = 'en_mesa';
    mesaNueva.estado = 'ocupada';

    const restOrigen = db.pedidos.filter(
      (x) => x.id_mesa === idAnterior && ABIERTOS_LOCAL.includes(x.estado),
    ).length;
    if (mesaOrigen && restOrigen === 0 && !esMesaVirtualNumero(mesaOrigen.numero, db.configOperativa)) {
      mesaOrigen.estado = 'libre';
    }

    const ctx = p.detalles.map((d) => {
      const prod = db.productos.find((x) => x.id_producto === d.id_producto);
      return {
        es_bebida: prod ? categoriaEsBebida(categoriaDeProducto(db, prod)) : false,
        es_acompanamiento_mazorca: Boolean(prod?.es_acompanamiento_mazorca),
        es_empacable: Boolean(prod?.es_empacable),
        categoria_nombre: prod?.categoria_nombre ?? '',
        id_detalle_padre: d.id_detalle_padre,
      };
    });
    const errMz = sincronizarLineaMazorcaLocal(
      p,
      mesaNueva.numero,
      idProductoMazorcaLocal(db.productos, db.configOperativa.id_producto_mazorca),
      () => db.seq.detalle++,
      pedidoDebeTenerLineaMazorca(
        mesaNueva.numero,
        ctx,
        db.configOperativa.mazorca_activa,
      ),
      db.configOperativa.mazorca_activa,
    );
    if (errMz) badRequest(errMz);

    await writeDb(db);
    const pedidoFinal = db.pedidos.find((x) => x.id_pedido === idPedido);
    if (!pedidoFinal) badRequest('Pedido no encontrado tras transferir');
    return serializePedido(db, pedidoFinal) as T;
  }

  if (path.startsWith('/pedidos/detalles/') && path.endsWith('/cocina') && method === 'PATCH') {
    if (actor.rol !== 'mesero' && !esRolAdminLocal(actor.rol)) unauthorized();
    const idDetalle = Number(path.split('/')[3]);
    for (const p of db.pedidos) {
      const d = p.detalles.find((x) => x.id_detalle === idDetalle);
      if (!d) continue;
      const prod = db.productos.find((x) => x.id_producto === d.id_producto)!;
      if (categoriaEsBebida(categoriaDeProducto(db, prod))) {
        badRequest('Las bebidas no se marcan en cocina');
      }
      if (prod.es_empacable) {
        badRequest('Los empaques no se marcan en cocina');
      }
      if (Boolean(body.listo_cocina)) {
        if (!d.enviado_cocina) {
          badRequest('La línea aún no se envió a cocina');
        }
        if (d.listo_cocina) {
          badRequest('Este plato ya está marcado en la mesa');
        }
        const qty = Math.floor(Number(body.cantidad ?? d.cantidad));
        splitDetalleLocal(db, p, d, qty, {
          listo_cocina: true,
          listo_para_recoger: true,
        });
      } else {
        d.listo_cocina = false;
      }
      await writeDb(db);
      return { id_detalle: d.id_detalle, id_pedido: p.id_pedido, listo_cocina: d.listo_cocina } as T;
    }
    badRequest('Línea no encontrada');
  }

  if (
    path.startsWith('/pedidos/detalles/') &&
    path.endsWith('/falta-en-cocina') &&
    method === 'POST'
  ) {
    if (actor.rol !== 'mesero' && !esRolAdminLocal(actor.rol)) unauthorized();
    const idDetalle = Number(path.split('/')[3]);
    for (const p of db.pedidos) {
      const d = p.detalles.find((x) => x.id_detalle === idDetalle);
      if (!d) continue;
      const prod = db.productos.find((x) => x.id_producto === d.id_producto)!;
      if (categoriaEsBebida(categoriaDeProducto(db, prod))) {
        badRequest('Las bebidas no aplican en cocina');
      }
      if (prod.es_empacable) {
        badRequest('Los empaques no aplican en cocina');
      }
      if (!d.enviado_cocina) {
        badRequest('La línea aún no se envió a cocina');
      }
      if (d.listo_cocina) {
        badRequest('Este plato ya está marcado en la mesa');
      }
      const qty = Math.floor(Number(body.cantidad ?? d.cantidad));
      splitDetalleLocal(db, p, d, qty, {
        listo_para_recoger: false,
        listo_cocina: false,
      });
      await writeDb(db);
      return {
        id_detalle: d.id_detalle,
        id_pedido: p.id_pedido,
        listo_para_recoger: false,
        cantidad: qty,
      } as T;
    }
    badRequest('Línea no encontrada');
  }

  if (
    path.startsWith('/pedidos/detalles/') &&
    path.endsWith('/listo-para-recoger') &&
    method === 'PATCH'
  ) {
    soloChefOAdmin(actor);
    const idDetalle = Number(path.split('/')[3]);
    for (const p of db.pedidos) {
      const d = p.detalles.find((x) => x.id_detalle === idDetalle);
      if (!d) continue;
      const prod = db.productos.find((x) => x.id_producto === d.id_producto)!;
      if (categoriaEsBebida(categoriaDeProducto(db, prod))) {
        badRequest('Las bebidas no aplican en cocina');
      }
      if (prod.es_empacable) {
        badRequest('Los empaques no aplican en cocina');
      }
      if (!d.enviado_cocina) {
        badRequest('La línea aún no se envió a cocina');
      }
      if (d.listo_cocina) {
        badRequest('El mesero ya marcó este plato como recogido');
      }
      d.listo_para_recoger = Boolean(body.listo_para_recoger);
      await writeDb(db);
      return {
        id_detalle: d.id_detalle,
        id_pedido: p.id_pedido,
        listo_para_recoger: d.listo_para_recoger,
      } as T;
    }
    badRequest('Línea no encontrada');
  }

  {
    const mLlamar = /^\/pedidos\/(\d+)\/llamar-mesero$/.exec(path);
    if (mLlamar && method === 'POST') {
      soloChefOAdmin(actor);
      const idPedido = Number(mLlamar[1]);
      const p = db.pedidos.find((x) => x.id_pedido === idPedido);
      if (!p) badRequest('Pedido no encontrado');
      const aplica = (d: PedidoDetalle) => {
        if (!d.enviado_cocina || d.listo_cocina) return false;
        const prod = db.productos.find((x) => x.id_producto === d.id_producto)!;
        if (!debeMarcarCocina(categoriaDeProducto(db, prod), Boolean(prod.es_empacable))) {
          return false;
        }
        return true;
      };
      let marcadosAhora = 0;
      for (const d of p.detalles) {
        if (aplica(d) && !d.listo_para_recoger) {
          d.listo_para_recoger = true;
          marcadosAhora += d.cantidad;
        }
      }
      const platosListos = p.detalles
        .filter(aplica)
        .reduce((acc, d) => acc + d.cantidad, 0);
      if (platosListos === 0) {
        badRequest('No hay platos de cocina pendientes de recoger en este pedido');
      }
      await writeDb(db);
      const mesero = db.users.find((u) => u.id === p.id_usuario)!;
      return {
        id_pedido: idPedido,
        platos_listos: platosListos,
        marcados_ahora: marcadosAhora,
        mesero: {
          id: mesero.id,
          nombre: mesero.nombre,
          apellido: mesero.apellido,
        },
      } as T;
    }
  }

  {
    const mPrio = /^\/pedidos\/(\d+)\/prioridad-cocina$/.exec(path);
    if (mPrio && method === 'PATCH') {
      if (!esRolAdminLocal(actor.rol)) unauthorized();
      const idPedido = Number(mPrio[1]);
      const modo = String(body.modo ?? '');
      if (modo !== 'alta' && modo !== 'baja' && modo !== 'auto') {
        badRequest('modo inválido (alta, baja o auto)');
      }
      const pedido = db.pedidos.find((x) => x.id_pedido === idPedido);
      if (!pedido) badRequest('Pedido no encontrado');
      if (pedido.estado === 'facturado') {
        badRequest('El pedido no admite cambio de prioridad');
      }
      pedido.prioridad_cocina_override =
        modo === 'auto' ? null : (modo as 'alta' | 'baja');
      await writeDb(db);
      return serializePedido(db, pedido) as T;
    }
  }

  if (path === '/pedidos/mis-activos/resumen' && method === 'GET') {
    if (actor.rol !== 'mesero' && !esRolAdminLocal(actor.rol)) unauthorized();
    const rows = db.pedidos.filter(
      (p) => ABIERTOS_LOCAL.includes(p.estado) && p.id_usuario === actor.id,
    );
    let pedidosMostrador = 0;
    let pedidosParaLlevar = 0;
    let platosSinPasarCocina = 0;
    let platosParaRecoger = 0;
    let mazorcasParaRecoger = 0;
    const mesaIds: number[] = [];
    const pedidoIds: number[] = [];
    for (const p of rows) {
      pedidoIds.push(p.id_pedido);
      mesaIds.push(p.id_mesa);
      const mesa = db.mesas.find((m) => m.id_mesa === p.id_mesa);
      const numero = mesa?.numero ?? 0;
      if (esMesaMostradorNumero(numero, db.configOperativa)) pedidosMostrador += 1;
      if (esMesaParaLlevarNumero(numero, db.configOperativa)) pedidosParaLlevar += 1;
      for (const d of p.detalles) {
        const prod = db.productos.find((x) => x.id_producto === d.id_producto);
        const cat = prod
          ? db.categorias.find((c) => c.id_categoria === prod.id_categoria)
          : null;
        const catNombre = cat?.nombre ?? '';
        const esBebida = catNombre.toLowerCase().includes('bebida');
        const esEmpacable = prod?.es_empacable ?? false;
        if (detalleMarcaCocina(db, d) && !d.enviado_cocina) {
          platosSinPasarCocina += d.cantidad;
        }
        if (
          detalleMarcaCocina(db, d) &&
          d.enviado_cocina &&
          d.listo_para_recoger &&
          !d.listo_cocina &&
          !esBebida &&
          !esEmpacable
        ) {
          if (prod?.es_acompanamiento_mazorca) {
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
    } as T;
  }

  if (path === '/pedidos/pendientes-cobro/resumen' && method === 'GET') {
    if (!esRolAdminLocal(actor.rol)) unauthorized();
    const rows = db.pedidos.filter((p) => ABIERTOS_LOCAL.includes(p.estado));
    let pedidosMostrador = 0;
    let pedidosParaLlevar = 0;
    let pedidosEnMesas = 0;
    const pedidos = rows.map((p) => {
      const mesa = db.mesas.find((m) => m.id_mesa === p.id_mesa);
      const numero = mesa?.numero ?? 0;
      const u = db.users.find((x) => x.id === p.id_usuario);
      let canal: 'mostrador' | 'para_llevar' | 'mesa' = 'mesa';
      if (esMesaMostradorNumero(numero, db.configOperativa)) {
        pedidosMostrador += 1;
        canal = 'mostrador';
      } else if (esMesaParaLlevarNumero(numero, db.configOperativa)) {
        pedidosParaLlevar += 1;
        canal = 'para_llevar';
      } else {
        pedidosEnMesas += 1;
      }
      return {
        id_pedido: p.id_pedido,
        id_mesa: p.id_mesa,
        mesa_numero: numero,
        canal,
        mesero: u ? `${u.nombre} ${u.apellido}`.trim() : '',
      };
    });
    return {
      total_pedidos: rows.length,
      pedidos_mostrador: pedidosMostrador,
      pedidos_para_llevar: pedidosParaLlevar,
      pedidos_en_mesas: pedidosEnMesas,
      pedidos,
    } as T;
  }

  if (path === '/pedidos/mis-activos' && method === 'GET') {
    if (actor.rol !== 'mesero' && !esRolAdminLocal(actor.rol)) unauthorized();
    const rows = db.pedidos.filter(
      (p) => ABIERTOS_LOCAL.includes(p.estado) && p.id_usuario === actor.id,
    );
    const pedidos = rows.map((p) => serializePedidoOperativo(db, p));
    const mesas = new Set(pedidos.map((p) => p.mesa_numero));
    return {
      pedidos,
      mesas_activas: mesas.size,
    } as T;
  }

  function detallePendienteRecogerLocal(
    dbRef: Db,
    d: PedidoDetalle,
    prod: { categoria_nombre?: string; es_empacable?: boolean } | undefined,
  ) {
    if (!detalleMarcaCocina(dbRef, d)) return false;
    const catNombre = prod?.categoria_nombre ?? '';
    const esBebida = catNombre.toLowerCase().includes('bebida');
    const esEmpacable = prod?.es_empacable ?? false;
    return (
      d.enviado_cocina &&
      !d.listo_cocina &&
      !esBebida &&
      !esEmpacable
    );
  }

  function platosPendientesRecogerLocal(p: Pedido) {
    let total = 0;
    for (const d of p.detalles) {
      const prod = db.productos.find((x) => x.id_producto === d.id_producto);
      if (detallePendienteRecogerLocal(db, d, prod)) {
        total += d.cantidad;
      }
    }
    return total;
  }

  if (path === '/pedidos/ayuda-companeros/resumen' && method === 'GET') {
    if (actor.rol !== 'mesero' && !esRolAdminLocal(actor.rol)) unauthorized();
    const rows = db.pedidos.filter(
      (p) =>
        ABIERTOS_LOCAL.includes(p.estado) &&
        p.id_usuario !== actor.id &&
        platosPendientesRecogerLocal(p) > 0,
    );
    const platosParaRecoger = rows.reduce(
      (acc, p) => acc + platosPendientesRecogerLocal(p),
      0,
    );
    return {
      platos_para_recoger: platosParaRecoger,
      pedidos: rows.length,
      pedido_ids: rows.map((p) => p.id_pedido),
      mesa_ids: rows.map((p) => p.id_mesa),
    } as T;
  }

  if (path === '/pedidos/ayuda-companeros' && method === 'GET') {
    if (actor.rol !== 'mesero' && !esRolAdminLocal(actor.rol)) unauthorized();
    const rows = db.pedidos
      .filter(
        (p) =>
          ABIERTOS_LOCAL.includes(p.estado) &&
          p.id_usuario !== actor.id &&
          platosPendientesRecogerLocal(p) > 0,
      )
      .sort(
        (a, b) =>
          new Date(a.creado_en).getTime() - new Date(b.creado_en).getTime(),
      );
    const pedidos = rows.map((p) => serializePedidoOperativo(db, p));
    const total = rows.reduce((acc, p) => acc + platosPendientesRecogerLocal(p), 0);
    return {
      pedidos,
      total_platos_para_recoger: total,
    } as T;
  }

  if (path === '/pedidos/cocina' && method === 'GET') {
    if (!esRolAdminLocal(actor.rol) && actor.rol !== 'chef') unauthorized();
    const rows = db.pedidos.filter((p) => p.estado === 'en_cocina');
    const serializados = ordenarPedidosCocinaPorLlegada(
      rows.map((p) => serializePedidoOperativo(db, p)),
    );
    return { pedidos: serializados } as T;
  }

  if (path.startsWith('/pedidos?') && method === 'GET') {
    const url = new URL(`http://local${path}`);
    const estadosCsv = url.searchParams.get('estados') ?? '';
    const ordenParam = url.searchParams.get('orden');
    const orden: 'asc' | 'desc' | 'prioridad_cocina' =
      ordenParam === 'asc'
        ? 'asc'
        : ordenParam === 'prioridad_cocina'
          ? 'prioridad_cocina'
          : 'desc';
    const estados = estadosCsv.split(',').map((s) => s.trim()).filter(Boolean);
    if (!estados.length) {
      badRequest('El parámetro "estados" es obligatorio');
    }
    const limitRaw = Number(url.searchParams.get('limit') ?? '50');
    const offsetRaw = Number(url.searchParams.get('offset') ?? '0');
    const limit = Math.min(
      200,
      Math.max(1, Number.isFinite(limitRaw) ? Math.floor(limitRaw) : 50),
    );
    const offset = Math.max(
      0,
      Number.isFinite(offsetRaw) ? Math.floor(offsetRaw) : 0,
    );
    let rows = db.pedidos.filter((p) => estados.includes(p.estado));
    if (orden === 'prioridad_cocina') {
      const serializados = ordenarPedidosCocina(
        rows.map((p) => serializePedido(db, p)),
      );
      const page = serializados.slice(offset, offset + limit);
      return {
        pedidos: page,
        limit,
        offset,
        count: page.length,
      } as T;
    }
    rows = rows.sort((a, b) =>
      orden === 'asc'
        ? a.creado_en.localeCompare(b.creado_en)
        : b.creado_en.localeCompare(a.creado_en),
    );
    const page = rows.slice(offset, offset + limit).map((p) => serializePedido(db, p));
    return {
      pedidos: page,
      limit,
      offset,
      count: page.length,
    } as T;
  }

  if (path.startsWith('/pedidos/caja-diaria') && method === 'GET') {
    if (!esRolAdminLocal(actor.rol)) unauthorized();
    const url = new URL(`http://local${path}`);
    let fecha = (url.searchParams.get('fecha') ?? '').trim();
    if (!fecha) fecha = toDateKey(todayIso());
    const row = db.cajaDiaria.find((c) => c.fecha === fecha);
    return {
      fecha,
      monto_base_efectivo: row?.monto_base_efectivo ?? 0,
      monto_base_cierre_efectivo: row?.monto_base_cierre_efectivo ?? null,
    } as T;
  }

  if (path === '/pedidos/caja-diaria/cierre' && method === 'PUT') {
    if (!esRolAdminLocal(actor.rol)) unauthorized();
    const fecha = String(body.fecha ?? '').trim().slice(0, 10);
    const monto = Number(body.monto_base_cierre_efectivo);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) badRequest('Fecha inválida');
    if (!Number.isFinite(monto) || monto < 0) badRequest('Monto inválido');
    const idx = db.cajaDiaria.findIndex((c) => c.fecha === fecha);
    const baseRow = idx >= 0 ? db.cajaDiaria[idx] : null;
    const montoBaseEfectivo = baseRow?.monto_base_efectivo ?? 0;
    const target = fecha;
    const facturas = db.facturas.filter((f) => toDateKey(f.emitida_en) === target);
    const totalesPorMetodo = totalesPorMetodoResumenVacios();
    for (const f of facturas) {
      acumularVentaPorMetodoPago(totalesPorMetodo, f.metodo_pago, f.total);
    }
    const movimientosDia = db.movimientosCaja
      .filter((m) => m.fecha === target)
      .map((m) => mapMovimientoCajaLocal(db, m));
    const cuadre = calcularEfectivoEsperadoEnCaja({
      monto_base_efectivo: montoBaseEfectivo,
      ventas_efectivo: totalesPorMetodo.efectivo,
      total_pagos_meseros: 0,
      movimientos: movimientosDia.map((m) => ({
        tipo: m.tipo,
        monto: m.monto,
        metodo_devolucion: m.metodo_devolucion,
      })),
    });
    if (idx >= 0) {
      db.cajaDiaria[idx].monto_base_cierre_efectivo = monto;
    } else {
      db.cajaDiaria.push({
        fecha,
        monto_base_efectivo: montoBaseEfectivo,
        monto_base_cierre_efectivo: monto,
      });
    }
    await writeDb(db);
    return {
      fecha,
      monto_base_cierre_efectivo: monto,
      efectivo_esperado_en_caja: cuadre.efectivo_esperado_en_caja,
      impresion_cierre: { impreso: false, en_cola: true },
    } as T;
  }

  if (path === '/pedidos/caja-diaria' && method === 'PUT') {
    if (!esRolAdminLocal(actor.rol)) unauthorized();
    const fecha = String(body.fecha ?? '').trim().slice(0, 10);
    const monto = Number(body.monto_base_efectivo);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) badRequest('Fecha inválida');
    if (!Number.isFinite(monto) || monto < 0) badRequest('Monto inválido');
    const idx = db.cajaDiaria.findIndex((c) => c.fecha === fecha);
    if (idx >= 0) db.cajaDiaria[idx].monto_base_efectivo = monto;
    else db.cajaDiaria.push({ fecha, monto_base_efectivo: monto });
    await writeDb(db);
    return {
      fecha,
      monto_base_efectivo: monto,
      impresion_base: { impreso: false, en_cola: true },
    } as T;
  }

  if (path === '/pedidos/movimientos-caja' && method === 'POST') {
    if (!esRolAdminLocal(actor.rol)) unauthorized();
    const tipo = String(body.tipo ?? '');
    if (tipo !== 'entrada_manual' && tipo !== 'salida_manual') {
      badRequest('Tipo de movimiento inválido');
    }
    const motivo = String(body.motivo ?? '').trim();
    if (!motivo) badRequest('Indica el motivo del movimiento');
    const monto = Math.round(Number(body.monto));
    if (!Number.isFinite(monto) || monto <= 0) badRequest('Monto inválido');
    let fecha = String(body.fecha ?? '').trim().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) fecha = toDateKey(todayIso());
    const row: MovimientoCajaRow = {
      id_movimiento: db.seq.movimientoCaja++,
      fecha,
      tipo,
      monto,
      motivo,
      metodo_devolucion: null,
      id_pedido: null,
      id_factura: null,
      id_usuario: actor.id,
      creado_en: todayIso(),
    };
    db.movimientosCaja.push(row);
    await writeDb(db);
    return {
      fecha,
      movimiento: mapMovimientoCajaLocal(db, row),
      impresion_movimiento: { impreso: false, en_cola: true },
    } as T;
  }

  {
    const mMovPrint = /^\/pedidos\/movimientos-caja\/(\d+)\/imprimir$/.exec(path);
    if (mMovPrint && method === 'POST') {
      if (!esRolAdminLocal(actor.rol)) unauthorized();
      const idMov = Number(mMovPrint[1]);
      const row = db.movimientosCaja.find((x) => x.id_movimiento === idMov);
      if (!row) badRequest('Movimiento no encontrado');
      if (row.tipo !== 'entrada_manual' && row.tipo !== 'salida_manual') {
        badRequest('Solo se pueden imprimir entradas o salidas manuales');
      }
      return {
        ok: true,
        impresion_movimiento: { impreso: false, en_cola: true },
      } as T;
    }
  }

  {
    const mMovDel = /^\/pedidos\/movimientos-caja\/(\d+)$/.exec(path);
    if (mMovDel && method === 'DELETE') {
      if (!esRolAdminLocal(actor.rol)) unauthorized();
      const idMov = Number(mMovDel[1]);
      const idx = db.movimientosCaja.findIndex((x) => x.id_movimiento === idMov);
      if (idx < 0) badRequest('Movimiento no encontrado');
      const row = db.movimientosCaja[idx]!;
      if (row.tipo !== 'entrada_manual' && row.tipo !== 'salida_manual') {
        badRequest('Solo se pueden eliminar entradas o salidas manuales');
      }
      db.movimientosCaja.splice(idx, 1);
      await writeDb(db);
      return { ok: true, id_movimiento: idMov } as T;
    }
  }

  if (path === '/pedidos/config-descuentos' && method === 'GET') {
    return mapConfigDescuentosLocal(db.configDescuentos) as T;
  }

  if (path === '/pedidos/config-descuentos' && method === 'PUT') {
    if (!esRolAdminLocal(actor.rol)) badRequest('Solo admin');
    const prev = db.configDescuentos;
    const next: ConfigDescuentosRow = {
      sopas_activo:
        body.reglas_promocion != null || body.etiquetas_pedido != null
          ? false
          : body.sopas_activo != null
            ? Boolean(body.sopas_activo)
            : prev.sopas_activo,
      sopas_monto_por_unidad:
        body.sopas_monto_por_unidad != null
          ? Math.round(Number(body.sopas_monto_por_unidad))
          : prev.sopas_monto_por_unidad,
      sopas_min_unidades:
        body.sopas_min_unidades != null
          ? Math.max(1, Math.round(Number(body.sopas_min_unidades)))
          : prev.sopas_min_unidades,
      muleros_activo:
        body.reglas_promocion != null || body.etiquetas_pedido != null
          ? false
          : body.muleros_activo != null
            ? Boolean(body.muleros_activo)
            : prev.muleros_activo,
      muleros_monto_por_plato_principal:
        body.muleros_monto_por_plato_principal != null
          ? Math.round(Number(body.muleros_monto_por_plato_principal))
          : prev.muleros_monto_por_plato_principal,
      muleros_min_platos_principales:
        body.muleros_min_platos_principales != null
          ? Math.max(1, Math.round(Number(body.muleros_min_platos_principales)))
          : prev.muleros_min_platos_principales,
      umbral_subtotal_otros:
        body.umbral_subtotal_otros != null
          ? Math.round(Number(body.umbral_subtotal_otros))
          : prev.umbral_subtotal_otros,
      reglas_promocion:
        body.reglas_promocion != null
          ? parseReglasPromocion(body.reglas_promocion)
          : prev.reglas_promocion,
      etiquetas_pedido:
        body.etiquetas_pedido != null
          ? parseEtiquetasPedido(body.etiquetas_pedido)
          : prev.etiquetas_pedido ?? [],
    };
    if (next.sopas_activo && next.sopas_monto_por_unidad <= 0) {
      badRequest('Indica el monto por unidad al activar la promoción legacy');
    }
    if (next.muleros_activo && next.muleros_monto_por_plato_principal <= 0) {
      badRequest(
        'Indica el monto por plato principal al activar la promoción legacy',
      );
    }
    db.configDescuentos = next;
    await writeDb(db);
    return mapConfigDescuentosLocal(next) as T;
  }

  if (path === '/pedidos/config-operativa' && method === 'GET') {
    return mapConfigOperativaLocal(db.configOperativa, db.productos) as T;
  }

  if (path === '/pedidos/config-operativa' && method === 'PUT') {
    if (!esRolAdminLocal(actor.rol)) badRequest('Solo admin');
    const prev = db.configOperativa;
    const nuevoParaLlevar =
      body.numero_mesa_para_llevar != null
        ? Math.round(Number(body.numero_mesa_para_llevar))
        : prev.numero_mesa_para_llevar;
    const nuevoMostrador =
      body.numero_mesa_mostrador != null
        ? Math.round(Number(body.numero_mesa_mostrador))
        : prev.numero_mesa_mostrador;
    if (nuevoParaLlevar === nuevoMostrador) {
      badRequest('Para llevar y mostrador deben usar números de mesa distintos');
    }
    if (
      body.numero_mesa_para_llevar != null &&
      nuevoParaLlevar !== prev.numero_mesa_para_llevar
    ) {
      sincronizarNumeroMesaVirtualLocal(
        db,
        prev.numero_mesa_para_llevar,
        nuevoParaLlevar,
      );
    }
    if (
      body.numero_mesa_mostrador != null &&
      nuevoMostrador !== prev.numero_mesa_mostrador
    ) {
      sincronizarNumeroMesaVirtualLocal(
        db,
        prev.numero_mesa_mostrador,
        nuevoMostrador,
      );
    }
    const next: ConfigOperativaRow = {
      precio_empaque_para_llevar:
        body.precio_empaque_para_llevar != null
          ? Math.round(Number(body.precio_empaque_para_llevar))
          : prev.precio_empaque_para_llevar,
      mazorca_activa:
        body.mazorca_activa != null
          ? Boolean(body.mazorca_activa)
          : prev.mazorca_activa,
      id_producto_mazorca:
        body.id_producto_mazorca !== undefined
          ? body.id_producto_mazorca == null
            ? null
            : Number(body.id_producto_mazorca)
          : prev.id_producto_mazorca,
      id_producto_cuota_pendiente:
        body.id_producto_cuota_pendiente !== undefined
          ? body.id_producto_cuota_pendiente == null
            ? null
            : Number(body.id_producto_cuota_pendiente)
          : prev.id_producto_cuota_pendiente,
      numero_mesa_para_llevar: nuevoParaLlevar,
      numero_mesa_mostrador: nuevoMostrador,
      etiqueta_para_llevar:
        body.etiqueta_para_llevar != null
          ? String(body.etiqueta_para_llevar).trim()
          : prev.etiqueta_para_llevar,
      etiqueta_mostrador:
        body.etiqueta_mostrador != null
          ? String(body.etiqueta_mostrador).trim()
          : prev.etiqueta_mostrador,
      mostrador_activo:
        body.mostrador_activo != null
          ? Boolean(body.mostrador_activo)
          : prev.mostrador_activo,
      para_llevar_activo:
        body.para_llevar_activo != null
          ? Boolean(body.para_llevar_activo)
          : prev.para_llevar_activo,
      beneficio_soda_almuerzo_activo:
        body.beneficio_soda_almuerzo_activo != null
          ? Boolean(body.beneficio_soda_almuerzo_activo)
          : prev.beneficio_soda_almuerzo_activo,
      id_producto_soda_almuerzo:
        body.id_producto_soda_almuerzo !== undefined
          ? body.id_producto_soda_almuerzo == null
            ? null
            : Number(body.id_producto_soda_almuerzo)
          : prev.id_producto_soda_almuerzo,
      soda_almuerzo_descontar_stock:
        body.soda_almuerzo_descontar_stock != null
          ? Boolean(body.soda_almuerzo_descontar_stock)
          : prev.soda_almuerzo_descontar_stock,
    };
    if (next.id_producto_mazorca != null) {
      for (const p of db.productos) {
        p.es_acompanamiento_mazorca =
          p.id_producto === next.id_producto_mazorca;
      }
    }
    db.configOperativa = next;
    await writeDb(db);
    notifyConfigUpdated('mesas');
    return mapConfigOperativaLocal(next, db.productos) as T;
  }

  {
    const url = new URL(`http://local${path}`);
    const fechaQ = (url.searchParams.get('fecha') ?? '').trim();
    if (
      pathKey === '/pedidos/resumen-diario/imprimir-completo' &&
      method === 'POST'
    ) {
      if (!esRolAdminLocal(actor.rol)) unauthorized();
      return {
        fecha: fechaQ || toDateKey(todayIso()),
        total_pedidos: 0,
        comandas_impresas: 0,
        comandas_omitidas: 0,
        facturas_impresas: 0,
        errores: [
          'Impresión de cierre solo disponible con el API en el PC del restaurante',
        ],
        detenido_sin_papel: false,
      } as T;
    }
    if (pathKey === '/sistema/conexion-celulares' && method === 'GET') {
    if (!esRolAdminLocal(actor.rol)) unauthorized();
    return {
      ip: '127.0.0.1',
      adaptador: 'local',
      tipo_red: 'otro',
      puerto_api: 3000,
      puerto_web: 8080,
      url_api: 'http://127.0.0.1:3000',
      url_web_celular: 'http://127.0.0.1:8080',
      url_web_local: 'http://localhost:8080',
      health_celular: 'http://127.0.0.1:3000/health',
      aviso: 'Modo local: conecta el API del restaurante para ver la IP real.',
    } as T;
  }
  if (
      pathKey === '/pedidos/resumen-diario/imprimir-seleccion' &&
      method === 'POST'
    ) {
      if (!esRolAdminLocal(actor.rol)) unauthorized();
      return {
        fecha: fechaQ || toDateKey(todayIso()),
        comandas_impresas: 0,
        comandas_omitidas: 0,
        facturas_impresas: 0,
        errores: [
          'Impresión de cierre solo disponible con el API en el PC del restaurante',
        ],
        detenido_sin_papel: false,
      } as T;
    }
    if (
      pathKey === '/pedidos/resumen-diario/imprimir-total' &&
      method === 'POST'
    ) {
      if (!esRolAdminLocal(actor.rol)) unauthorized();
      return {
        ok: false,
        fecha: fechaQ || toDateKey(todayIso()),
        impresion_cierre: {
          impreso: false,
          error:
            'Impresión de cierre solo disponible con el API en el PC del restaurante',
        },
        resumen: { total_facturado: 0, efectivo_esperado_en_caja: 0 },
      } as T;
    }
  }

  const mResumenLineas = /^\/pedidos\/resumen-diario\/facturas\/(\d+)\/lineas$/.exec(
    pathKey,
  );
  if (mResumenLineas && method === 'GET') {
    if (!esRolAdminLocal(actor.rol)) unauthorized();
    const idFactura = Number(mResumenLineas[1]);
    const f = db.facturas.find((x) => x.id_factura === idFactura);
    if (!f) badRequest('Factura no encontrada');
    const p = db.pedidos.find((x) => x.id_pedido === f.id_pedido);
    if (!p) badRequest('Pedido no encontrado');
    const detalles = lineasFacturaParaTicket(
      p.detalles
        .filter((d) => d.id_factura === idFactura)
        .map((d) => {
          const prod = db.productos.find((x) => x.id_producto === d.id_producto);
          const cat = prod
            ? db.categorias.find((c) => c.id_categoria === prod.id_categoria)
            : undefined;
          const reglas = cat
            ? inferirReglasCategoriaDesdeNombre(cat.nombre)
            : null;
          const nombre = prod?.nombre ?? `Producto #${d.id_producto}`;
          const pu = d.precio_unitario;
          const opcionIds = Array.isArray(d.opcion_ids) ? d.opcion_ids : [];
          const pers = (prod?.opciones ?? []).filter((o) =>
            opcionIds.includes(o.id_opcion),
          );
          return {
            id_detalle: d.id_detalle,
            id_producto: d.id_producto,
            id_detalle_padre: d.id_detalle_padre ?? null,
            nombre_producto: nombre,
            cantidad: d.cantidad,
            precio_unitario: pu,
            subtotal_linea: pu * d.cantidad,
            nota_cocina: d.nota_cocina ?? null,
            cobrado: d.id_factura != null,
            categoria_nombre: cat?.nombre,
            es_plato_principal: prod?.es_plato_principal,
            es_bebida: reglas?.es_bebida,
            es_empacable: prod?.es_empacable,
            es_acompanamiento_mazorca: prod?.es_acompanamiento_mazorca,
            personalizaciones: pers.map((o) => ({
              id_opcion: o.id_opcion,
              descripcion: o.descripcion,
            })),
          };
        }),
    );
    return { id_factura: idFactura, detalles } as T;
  }

  function idsPedidosReabiertosPendientesLocal(_target: string): number[] {
    return db.pedidos
      .filter((p) => {
        if (!ABIERTOS_LOCAL.includes(p.estado)) return false;
        if (db.facturas.some((f) => f.id_pedido === p.id_pedido)) return false;
        if (p.detalles.length === 0) return false;
        return db.pedidoHistorial.some(
          (h) => h.id_pedido === p.id_pedido && h.tipo === 'cobro_reabierto',
        );
      })
      .map((p) => p.id_pedido);
  }

  if (
    pathKey === '/pedidos/resumen-diario/cancelar-reabiertos' &&
    method === 'POST'
  ) {
    if (!esRolAdminLocal(actor.rol)) unauthorized();
    if (String(body.confirmar ?? '').trim().toUpperCase() !== 'CANCELAR') {
      badRequest('Escribe confirmar: "CANCELAR"');
    }
    const url = new URL(`http://local${path}`);
    const fecha = (url.searchParams.get('fecha') ?? '').trim();
    const target = fecha || toDateKey(todayIso());
    const ids = idsPedidosReabiertosPendientesLocal(target);
    const mesasLiberadas = new Set<number>();
    let cancelados = 0;
    for (const idPedido of ids) {
      const idx = db.pedidos.findIndex((x) => x.id_pedido === idPedido);
      if (idx < 0) continue;
      const p = db.pedidos[idx];
      if (db.facturas.some((f) => f.id_pedido === idPedido)) continue;
      const idMesaP = p.id_mesa;
      db.pedidoHistorial = db.pedidoHistorial.filter((h) => h.id_pedido !== idPedido);
      db.pedidos.splice(idx, 1);
      const abiertosRest = db.pedidos.filter(
        (x) => x.id_mesa === idMesaP && ABIERTOS_LOCAL.includes(x.estado),
      ).length;
      const mesa = db.mesas.find((m) => m.id_mesa === idMesaP);
      if (mesa && abiertosRest === 0) {
        mesa.estado = 'libre';
        mesasLiberadas.add(idMesaP);
      }
      cancelados += 1;
    }
    await writeDb(db);
    return {
      fecha: target,
      pedidos_cancelados: cancelados,
      mesas_liberadas: mesasLiberadas.size,
    } as T;
  }

  if (pathKey === '/pedidos/resumen-diario/vaciar' && method === 'POST') {
    if (!esRolAdminLocal(actor.rol)) unauthorized();
    if (String(body.confirmar ?? '').trim().toUpperCase() !== 'VACIAR') {
      badRequest('Escribe confirmar: "VACIAR"');
    }
    const url = new URL(`http://local${path}`);
    const fecha = (url.searchParams.get('fecha') ?? '').trim();
    const target = fecha || toDateKey(todayIso());
    const facturasDia = db.facturas.filter((f) => toDateKey(f.emitida_en) === target);
    const idsFacturas = facturasDia.map((f) => f.id_factura);
    const pedidoIds = [...new Set(facturasDia.map((f) => f.id_pedido))];
    let pedidosReabiertos = 0;

    for (const d of db.pedidos.flatMap((p) => p.detalles)) {
      if (d.id_factura != null && idsFacturas.includes(d.id_factura)) {
        d.id_factura = null;
      }
    }
    db.facturas = db.facturas.filter((f) => !idsFacturas.includes(f.id_factura));
    db.movimientosCaja = db.movimientosCaja.filter((m) => m.fecha !== target);
    db.cajaDiaria = db.cajaDiaria.filter((c) => c.fecha !== target);

    for (const idPedido of pedidoIds) {
      if (db.facturas.some((f) => f.id_pedido === idPedido)) continue;
      const p = db.pedidos.find((x) => x.id_pedido === idPedido);
      if (!p || p.detalles.length === 0) continue;
      if (p.estado === 'facturado') {
        const enCocina = p.detalles.some((d) => d.enviado_cocina);
        p.estado = enCocina ? 'en_cocina' : 'abierto';
        p.cerrado_en = null;
        const mesa = db.mesas.find((m) => m.id_mesa === p.id_mesa);
        if (mesa) mesa.estado = 'ocupada';
      }
      const yaHistorial = db.pedidoHistorial.some(
        (h) => h.id_pedido === idPedido && h.tipo === 'cobro_reabierto',
      );
      if (!yaHistorial) {
        db.pedidoHistorial.push({
          id_historial: db.seq.historial++,
          id_pedido: idPedido,
          id_usuario: actor.id,
          tipo: 'cobro_reabierto',
          detalle: {
            motivo: 'Vaciado resumen diario (pruebas)',
            origen: 'vaciar_resumen_diario',
          },
          creado_en: todayIso(),
        });
      }
      pedidosReabiertos += 1;
    }

    await writeDb(db);
    return {
      fecha: target,
      facturas_eliminadas: idsFacturas.length,
      pedidos_reabiertos: pedidosReabiertos,
    } as T;
  }

  if (pathKey.startsWith('/pedidos/resumen-diario') && method === 'GET') {
    if (!esRolAdminLocal(actor.rol)) unauthorized();
    const url = new URL(`http://local${path}`);
    const fecha = (url.searchParams.get('fecha') ?? '').trim();
    const target = fecha || toDateKey(todayIso());
    const facturas = db.facturas.filter((f) => toDateKey(f.emitida_en) === target);
    const montoBaseEfectivo =
      db.cajaDiaria.find((c) => c.fecha === target)?.monto_base_efectivo ?? 0;
    const montoBaseCierreEfectivo =
      db.cajaDiaria.find((c) => c.fecha === target)?.monto_base_cierre_efectivo ??
      null;
    const totalesPorMetodo = totalesPorMetodoResumenVacios();
    const byMesa = new Map<number, { pedidos: number; total: number }>();
    for (const f of facturas) {
      const t = f.total;
      acumularVentaPorMetodoPago(totalesPorMetodo, f.metodo_pago, t);
      const p = db.pedidos.find((x) => x.id_pedido === f.id_pedido);
      if (!p) continue;
      const mesa = db.mesas.find((m) => m.id_mesa === p.id_mesa);
      if (!mesa) continue;
      const prev = byMesa.get(mesa.numero) ?? { pedidos: 0, total: 0 };
      prev.pedidos += 1;
      prev.total += t;
      byMesa.set(mesa.numero, prev);
    }
    const mesas = Array.from(byMesa.entries())
      .map(([mesa_numero, v]) => ({
        mesa_numero,
        pedidos_atendidos: v.pedidos,
        total_facturado: v.total,
      }))
      .sort((a, b) => a.mesa_numero - b.mesa_numero);

    const pedidosDetalle = facturas
      .map((f) => {
        const p = db.pedidos.find((x) => x.id_pedido === f.id_pedido);
        if (!p) return null;
        const mesa = db.mesas.find((m) => m.id_mesa === p.id_mesa);
        const cobrador = db.users.find((u) => u.id === f.id_usuario);
        return {
          id_factura: f.id_factura,
          id_pedido: p.id_pedido,
          mesa_numero: mesa?.numero ?? 0,
          pedido_estado: p.estado,
          mesero: cobrador
            ? `${cobrador.nombre} ${cobrador.apellido}`.trim()
            : undefined,
          subtotal: f.subtotal,
          descuento_sopas: f.descuento_sopas,
          descuento_muleros: f.descuento_muleros,
          descuento_promociones: f.descuento_promociones ?? 0,
          total: f.total,
          metodo_pago: f.metodo_pago,
          emitida_en: f.emitida_en,
          es_parcial: Boolean(f.es_parcial),
          detalles: [],
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => a.emitida_en.localeCompare(b.emitida_en));

    const idFacturasDia = new Set(facturas.map((f) => f.id_factura));
    const lineasVenta = [];
    for (const p of db.pedidos) {
      for (const d of p.detalles) {
        if (d.id_factura == null || !idFacturasDia.has(d.id_factura)) continue;
        const prod = db.productos.find((x) => x.id_producto === d.id_producto);
        if (!prod || prod.es_acompanamiento_mazorca) continue;
        const cat = db.categorias.find((c) => c.id_categoria === prod.id_categoria);
        lineasVenta.push({
          id_producto: prod.id_producto,
          nombre_producto: prod.nombre,
          categoria_nombre: cat?.nombre ?? 'Sin categoría',
          es_plato_principal: Boolean(prod.es_plato_principal),
          cantidad: d.cantidad,
          subtotal_linea: d.precio_unitario * d.cantidad,
        });
      }
    }
    const ventas = agregarVentasResumenDiario(lineasVenta);

    const movimientosDia = db.movimientosCaja
      .filter((m) => m.fecha === target)
      .sort((a, b) => a.creado_en.localeCompare(b.creado_en));
    const movimientos_caja = movimientosDia.map((m) =>
      mapMovimientoCajaLocal(db, m),
    );
    const cuadre = calcularEfectivoEsperadoEnCaja({
      monto_base_efectivo: montoBaseEfectivo,
      ventas_efectivo: totalesPorMetodo.efectivo,
      total_pagos_meseros: 0,
      movimientos: movimientos_caja.map((m) => ({
        tipo: m.tipo,
        monto: m.monto,
        metodo_devolucion: m.metodo_devolucion,
      })),
    });
    const devoluciones_exceso_transferencia = movimientos_caja.filter(
      (m) => m.tipo === 'devolucion_exceso_transferencia',
    );

    return {
      fecha: target,
      total_facturado: facturas.reduce((s, f) => s + f.total, 0),
      total_facturas: facturas.length,
      total_mesas_atendidas: mesas.length,
      mesas,
      pedidos_detalle: pedidosDetalle,
      monto_base_efectivo: montoBaseEfectivo,
      monto_base_cierre_efectivo: montoBaseCierreEfectivo,
      totales_por_metodo: totalesPorMetodo,
      total_pagos_meseros: 0,
      pagos_meseros: [],
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
      pedidos_reabiertos_pendientes: idsPedidosReabiertosPendientesLocal(target).length,
    } as T;
  }

  {
    const mHist = /^\/pedidos\/(\d+)\/historial$/.exec(path);
    if (mHist && method === 'GET') {
      const idPedido = Number(mHist[1]);
      if (!db.pedidos.some((x) => x.id_pedido === idPedido)) {
        badRequest('Pedido no encontrado');
      }
      const rows = db.pedidoHistorial
        .filter((h) => h.id_pedido === idPedido)
        .sort((a, b) => b.creado_en.localeCompare(a.creado_en));
      return rows.map((h) => {
        const u = db.users.find((x) => x.id === h.id_usuario)!;
        return {
          id_historial: h.id_historial,
          tipo: h.tipo,
          detalle: h.detalle,
          creado_en: h.creado_en,
          usuario: {
            id: u.id,
            nombre: u.nombre,
            apellido: u.apellido,
          },
        };
      }) as T;
    }
  }

  if (path.startsWith('/pedidos/') && method === 'GET') {
    const id = Number(path.split('/')[2]);
    const p = db.pedidos.find((x) => x.id_pedido === id);
    if (!p) badRequest('Pedido no encontrado');
    return serializePedido(db, p) as T;
  }

  if (pathKey === '/meseros-operativos/resumen' && method === 'GET') {
    if (!esRolAdminLocal(actor.rol)) unauthorized();
    const url = new URL(`http://local${path}`);
    const fechaQ = (url.searchParams.get('fecha') ?? '').trim() || toDateKey(todayIso());
    const op = mapConfigOperativaLocal(db.configOperativa, db.productos);
    const meseros = db.users
      .filter((u) => u.rol === 'mesero' && u.activo)
      .map((u) => ({
        id_usuario: u.id,
        nombre: u.nombre,
        apellido: u.apellido,
        soda_almuerzo: null,
        pago_turno: null,
      }));
    return {
      fecha: fechaQ,
      delegacion_cierre_anulacion: null,
      config: {
        beneficio_soda_almuerzo_activo: op.beneficio_soda_almuerzo_activo,
        id_producto_soda_almuerzo: op.id_producto_soda_almuerzo,
        producto_soda_nombre: op.producto_soda_nombre,
        soda_almuerzo_descontar_stock: op.soda_almuerzo_descontar_stock,
        producto_control_stock: false,
        producto_stock_disponible: null,
      },
      meseros,
      totales: {
        sodas_aplicadas: 0,
        pagos_registrados: 0,
        monto_pagos_total: 0,
      },
    } as T;
  }

  if (pathKey === '/permisos/efectivos' && method === 'GET') {
    return permisosEfectivosLocal(db, actor) as T;
  }

  if (pathKey === '/permisos/resumen' && method === 'GET') {
    if (!esRolAdminLocal(actor.rol)) unauthorized();
    const urlPermisos = new URL(`http://local${path}`);
    const fechaQ =
      (urlPermisos.searchParams.get('fecha') ?? '').trim() || toDateKey(todayIso());
    const meseros = db.users
      .filter((u) => u.rol === 'mesero' && u.activo)
      .map((u) => ({
        id_usuario: u.id,
        nombre: u.nombre,
        apellido: u.apellido,
      }));
    return {
      fecha: fechaQ,
      permisos_mesero: db.permisosMesero,
      delegacion_cierre_anulacion: delegacionCierreLocal(db, fechaQ),
      meseros,
    } as T;
  }

  if (pathKey === '/permisos/mesero' && method === 'PATCH') {
    if (!esRolAdminLocal(actor.rol)) unauthorized();
    const next = { ...db.permisosMesero };
    for (const key of PERMISOS_MESERO_KEYS) {
      if (body[key] !== undefined) next[key] = Boolean(body[key]);
    }
    db.permisosMesero = next;
    await writeDb(db);
    notifyConfigUpdated('menu');
    return next as T;
  }

  if (pathKey === '/permisos/delegacion/cierre-anulacion' && method === 'PUT') {
    if (!esRolAdminLocal(actor.rol)) unauthorized();
    const fecha = String(body.fecha ?? '').trim() || toDateKey(todayIso());
    const idUsuario =
      body.id_usuario == null ? null : Number(body.id_usuario);
    if (idUsuario == null) {
      if (db.delegacionCierreAnulacion?.fecha === fecha) {
        db.delegacionCierreAnulacion = null;
      }
    } else {
      const mesero = db.users.find(
        (u) => u.id === idUsuario && u.rol === 'mesero' && u.activo,
      );
      if (!mesero) badRequest('Mesero no encontrado o inactivo');
      db.delegacionCierreAnulacion = {
        fecha,
        id_usuario: idUsuario,
        asignado_en: todayIso(),
      };
    }
    await writeDb(db);
    notifyConfigUpdated('menu');
    return {
      fecha,
      delegacion_cierre_anulacion: delegacionCierreLocal(db, fecha),
    } as T;
  }

  if (pathKey === '/meseros-operativos/mi-delegacion' && method === 'GET') {
    const efectivos = permisosEfectivosLocal(db, actor);
    return {
      puede_cerrar_anulando: efectivos.puede_cerrar_anulando,
      es_admin: efectivos.es_admin,
    } as T;
  }

  if (
    pathKey.startsWith('/meseros-operativos/') &&
    (method === 'POST' || method === 'DELETE' || method === 'PUT')
  ) {
    if (!esRolAdminLocal(actor.rol)) unauthorized();
    badRequest(
      'Beneficios y pagos de meseros solo están disponibles con el API del restaurante',
    );
  }

  if (
    path.match(/^\/pedidos\/\d+\/reabrir-cobro$/) &&
    method === 'POST'
  ) {
    if (!esRolAdminLocal(actor.rol)) unauthorized();
    const idPedido = Number(path.split('/')[2]);
    const p = db.pedidos.find((x) => x.id_pedido === idPedido);
    if (!p) badRequest('Pedido no encontrado');
    const confirmar = String(body.confirmar ?? '').trim().toUpperCase();
    if (confirmar !== 'REABRIR') {
      badRequest('Escribe confirmar: "REABRIR"');
    }
    const motivo = String(body.motivo ?? '').trim();
    if (motivo.length < 3) badRequest('Indica un motivo (mínimo 3 caracteres)');

    const facturasPedido = db.facturas.filter((f) => f.id_pedido === idPedido);
    if (facturasPedido.length === 0) {
      badRequest('Este pedido no tiene cobros registrados');
    }
    const idsFacturas = facturasPedido.map((f) => f.id_factura);
    const movAntes = db.movimientosCaja.length;
    db.movimientosCaja = db.movimientosCaja.filter(
      (m) =>
        m.id_pedido !== idPedido &&
        (m.id_factura == null || !idsFacturas.includes(m.id_factura)),
    );
    const movimientosEliminados = movAntes - db.movimientosCaja.length;
    db.facturas = db.facturas.filter((f) => f.id_pedido !== idPedido);
    for (const d of p.detalles) {
      if (d.id_factura != null && idsFacturas.includes(d.id_factura)) {
        d.id_factura = null;
      }
    }

    const enCocina = p.detalles.some((d) => d.enviado_cocina);
    p.estado = enCocina ? 'en_cocina' : 'abierto';
    p.cerrado_en = null;
    const mesa = db.mesas.find((m) => m.id_mesa === p.id_mesa);
    if (mesa) mesa.estado = 'ocupada';

    db.pedidoHistorial.push({
      id_historial: db.seq.historial++,
      id_pedido: idPedido,
      id_usuario: actor.id,
      tipo: 'cobro_reabierto',
      detalle: {
        motivo,
        facturas_eliminadas: idsFacturas,
      },
      creado_en: todayIso(),
    });

    await writeDb(db);
    return {
      ok: true,
      id_pedido: idPedido,
      facturas_eliminadas: idsFacturas.length,
      movimientos_caja_eliminados: movimientosEliminados,
      pedido_reabierto: true,
      estado: p.estado,
    } as T;
  }

  if (
    path.match(/^\/pedidos\/\d+\/revertir-tanda-cobro$/) &&
    method === 'POST'
  ) {
    if (!esRolAdminLocal(actor.rol)) unauthorized();
    const idPedido = Number(path.split('/')[2]);
    const p = db.pedidos.find((x) => x.id_pedido === idPedido);
    if (!p) badRequest('Pedido no encontrado');
    const confirmar = String(body.confirmar ?? '').trim().toUpperCase();
    if (confirmar !== 'REVERTIR') {
      badRequest('Escribe confirmar: "REVERTIR"');
    }
    const motivo = String(body.motivo ?? '').trim();
    if (motivo.length < 3) badRequest('Indica un motivo (mínimo 3 caracteres)');
    const idFactura = Number(body.id_factura);
    if (!Number.isFinite(idFactura) || idFactura < 1) {
      badRequest('id_factura inválido');
    }

    const facturasPedido = db.facturas.filter((f) => f.id_pedido === idPedido);
    if (facturasPedido.length === 0) {
      badRequest('Este pedido no tiene cobros registrados');
    }
    const tanda = facturasDeTandaCobro(
      facturasPedido.map((f) => ({
        id_factura: f.id_factura,
        metodo_pago: f.metodo_pago,
        persona_plan_indice: f.persona_plan_indice,
        cobro_mixto_grupo: f.cobro_mixto_grupo,
        total: f.total,
        emitida_en: f.emitida_en,
      })),
      idFactura,
    );
    if (tanda.length === 0) {
      badRequest('La factura indicada no pertenece a este pedido');
    }
    const idsFacturas = tanda.map((f) => f.id_factura);
    const quedanOtras = facturasPedido.some(
      (f) => !idsFacturas.includes(f.id_factura),
    );
    const movAntes = db.movimientosCaja.length;
    db.movimientosCaja = db.movimientosCaja.filter(
      (m) => m.id_factura == null || !idsFacturas.includes(m.id_factura),
    );
    const movimientosEliminados = movAntes - db.movimientosCaja.length;
    db.facturas = db.facturas.filter((f) => !idsFacturas.includes(f.id_factura));
    for (const d of p.detalles) {
      if (d.id_factura != null && idsFacturas.includes(d.id_factura)) {
        d.id_factura = null;
      }
    }

    const esInternoSaldoLocal = (d: PedidoDetalle) => {
      const prod = db.productos.find((x) => x.id_producto === d.id_producto);
      return (
        Boolean(prod?.es_cuota_pendiente_reparto) ||
        esNotaSaldoRestantePendiente(d.nota_cocina) ||
        (d.nota_cocina ?? '').startsWith('saldo_restante:abono')
      );
    };

    // Limpiar saldo/abonos huérfanos y desmarcar platos del plan.
    p.detalles = p.detalles.filter(
      (d) => !(d.id_factura == null && esInternoSaldoLocal(d)),
    );
    const facturasRestantes = db.facturas.filter((f) => f.id_pedido === idPedido);
    const idsPlan = new Set<number>();
    for (const f of facturasRestantes) {
      if (f.persona_plan_indice != null) idsPlan.add(f.id_factura);
    }
    for (const d of p.detalles) {
      if (d.id_factura != null && esInternoSaldoLocal(d)) {
        idsPlan.add(d.id_factura);
      }
    }
    for (const d of p.detalles) {
      if (
        d.id_factura != null &&
        idsPlan.has(d.id_factura) &&
        !esInternoSaldoLocal(d)
      ) {
        d.id_factura = null;
      }
    }
    if (idsPlan.size > 0) {
      const cobradoPlan = facturasRestantes
        .filter((f) => idsPlan.has(f.id_factura))
        .reduce((s, f) => s + Math.round(f.total), 0);
      const realesPend = p.detalles.filter(
        (d) =>
          d.id_factura == null &&
          d.id_detalle_padre == null &&
          !esInternoSaldoLocal(d),
      );
      const totalPend = realesPend.reduce(
        (s, d) => s + Math.round(d.precio_unitario) * d.cantidad,
        0,
      );
      const montoSaldo = Math.max(0, totalPend - cobradoPlan);
      if (montoSaldo > 0 && cobradoPlan > 0) {
        const idProdSaldo = ensureProductoCuotaPendienteLocal(
          db.productos,
          db.categorias,
          () => Math.max(0, ...db.productos.map((x) => x.id_producto)) + 1,
        );
        const idSaldoDet = db.seq.detalle++;
        p.detalles.push({
          id_detalle: idSaldoDet,
          id_producto: idProdSaldo,
          id_detalle_padre: null,
          cantidad: 1,
          precio_unitario: montoSaldo,
          nota_cocina: 'saldo_restante',
          enviado_cocina: false,
          listo_cocina: false,
          listo_para_recoger: false,
          id_factura: null,
          opcion_ids: [],
        });
        // Repartir en unidades de plato de inmediato.
        const dist = distribuirSaldoEnPlatos(
          montoSaldo,
          realesPend.map((d) => ({
            id_detalle: d.id_detalle,
            precio_unitario: d.precio_unitario,
            cantidad: d.cantidad,
          })),
        );
        const liberarPorId = new Map(
          dist.liberaciones.map((l) => [l.id_detalle, l.cantidad]),
        );
        const idFacturaRef = [...idsPlan].sort((a, b) => b - a)[0] ?? null;
        for (const d of [...realesPend]) {
          const liberar = liberarPorId.get(d.id_detalle) ?? 0;
          const marcar = d.cantidad - liberar;
          if (marcar <= 0 || idFacturaRef == null) continue;
          if (marcar === d.cantidad) {
            d.id_factura = idFacturaRef;
          } else {
            d.cantidad = liberar;
            p.detalles.push({
              id_detalle: db.seq.detalle++,
              id_producto: d.id_producto,
              id_detalle_padre: d.id_detalle_padre,
              cantidad: marcar,
              precio_unitario: d.precio_unitario,
              nota_cocina: d.nota_cocina,
              opcion_ids: [...d.opcion_ids],
              listo_cocina: d.listo_cocina,
              listo_para_recoger: d.listo_para_recoger,
              enviado_cocina: d.enviado_cocina,
              id_factura: idFacturaRef,
            });
          }
        }
        const saldoLine = p.detalles.find((d) => d.id_detalle === idSaldoDet);
        if (saldoLine) {
          if (dist.montoSaldoRestante <= 0) {
            p.detalles = p.detalles.filter((d) => d.id_detalle !== idSaldoDet);
          } else {
            saldoLine.precio_unitario = dist.montoSaldoRestante;
            saldoLine.nota_cocina = SALDO_RESTANTE_FRAGMENTO_NOTA;
          }
        }
      }
    }

    const enCocina = p.detalles.some((d) => d.enviado_cocina);
    p.estado = enCocina ? 'en_cocina' : 'abierto';
    p.cerrado_en = null;
    const mesa = db.mesas.find((m) => m.id_mesa === p.id_mesa);
    if (mesa) mesa.estado = 'ocupada';

    db.pedidoHistorial.push({
      id_historial: db.seq.historial++,
      id_pedido: idPedido,
      id_usuario: actor.id,
      tipo: 'cobro_reabierto',
      detalle: {
        motivo,
        alcance: 'tanda',
        id_factura_solicitada: idFactura,
        facturas_eliminadas: idsFacturas,
        quedan_otras_facturas: quedanOtras,
      },
      creado_en: todayIso(),
    });

    await writeDb(db);
    const pedidoSerial = serializePedido(db, p);
    return {
      ok: true,
      id_pedido: idPedido,
      facturas_eliminadas: idsFacturas,
      movimientos_caja_eliminados: movimientosEliminados,
      quedan_cobros: quedanOtras,
      pedido_reabierto: true,
      estado: p.estado,
      pedido: pedidoSerial,
    } as T;
  }

  if (
    path.match(/^\/pedidos\/\d+\/cerrar-anulando-pendiente$/) &&
    method === 'POST'
  ) {
    badRequest(
      'Cierre con anulación solo está disponible con el API del restaurante',
    );
  }

  if (path === '/usuarios' && method === 'GET') {
    return db.users
      .filter((u) => u.rol !== 'superadmin' && u.email !== 'drewtechpos@gmail.com')
      .map((u) => ({
      id: u.id,
      nombre: u.nombre,
      apellido: u.apellido,
      email: u.email,
      rol: u.rol,
      activo: u.activo,
      creado_en: todayIso(),
    })) as T;
  }

  if (path === '/usuarios/meseros' && method === 'POST') {
    if (!esRolAdminLocal(actor.rol)) badRequest('Solo admin');
    const nombre = String(body.nombre ?? '').trim();
    const emailManual = body.email != null ? String(body.email).toLowerCase().trim() : '';
    let email = emailManual;
    if (!email) {
      email = emailMeseroDesdeNombre(nombre);
      let n = 2;
      while (db.users.some((u) => u.email === email)) {
        email = emailMeseroDesdeNombre(nombre, String(n));
        n += 1;
      }
    } else if (db.users.some((u) => u.email === email)) {
      badRequest('Ya existe un usuario con ese correo');
    }
    const u: User = {
      id: db.seq.user++,
      nombre,
      apellido: String(body.apellido ?? '').trim(),
      email,
      rol: 'mesero',
      password: String(body.password ?? ''),
      activo: true,
    };
    db.users.push(u);
    await writeDb(db);
    return { id: u.id, nombre: u.nombre, apellido: u.apellido, email: u.email, rol: u.rol, activo: u.activo } as T;
  }

  if (path.startsWith('/usuarios/') && method === 'PATCH') {
    if (!esRolAdminLocal(actor.rol)) badRequest('Solo admin');
    const id = Number(path.split('/')[2]);
    const u = db.users.find((x) => x.id === id);
    if (!u) badRequest('Usuario no encontrado');
    if (
      (u.rol === 'admin' || u.rol === 'superadmin') &&
      actor.rol !== 'superadmin'
    ) {
      badRequest('Solo el superadmin DrewTech puede modificar administradores');
    }
    if (typeof body.activo === 'boolean' && body.activo === false) {
      if (id === actor.id) {
        badRequest('No puedes desactivar tu propia sesión');
      }
      const validacion = validarDesactivarUsuario({
        pedidosActivos: contarPedidosActivosUsuario(db, id),
      });
      if (!validacion.ok) badRequest(validacion.mensaje);
    }
    if (typeof body.activo === 'boolean') u.activo = body.activo;
    if (typeof body.password === 'string' && body.password.trim()) {
      u.password = body.password.trim();
    }
    await writeDb(db);
    if (typeof body.activo === 'boolean' && body.activo === false) {
      notifyAuthSesionInvalidada(id, 'desactivado');
    }
    if (typeof body.password === 'string' && body.password.trim()) {
      notifyAuthSesionInvalidada(id, 'credenciales');
    }
    return { id: u.id, nombre: u.nombre, apellido: u.apellido, email: u.email, rol: u.rol, activo: u.activo } as T;
  }

  badRequest(`Ruta no soportada en modo local: ${method} ${path}`);
}

