import { buildLocalCategorias, buildLocalMenuProductos } from '../data/local-menu-seed';
import type { CategoriaLocal } from '../data/local-menu-seed';
import { notifyMesasInvalidated } from './mesas-sync';
import { deleteOfflineCache } from './offline-cache';
import { storage } from './storage';
import type { Producto } from './local-api-types';
import {
  inferirTipoProteina,
  ordenarPedidosCocina,
  prioridadAutomaticaDesdeTipos,
  prioridadCocinaEfectiva,
  tipoProteinaResuelto,
  type TipoProteina,
} from './cocina-prioridad';
import {
  PRECIO_EMPAQUE_PARA_LLEVAR_COP,
  productoCobraEmpaqueParaLlevarPorPlatoFuerte,
} from './empaque-para-llevar';
import {
  calcularDescuentosPedido,
  UMBRAL_SUBTOTAL_OTROS_COP,
} from './descuentos-pedido';
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

type ApiOptions = RequestInit & { token?: string | null };

type Rol = 'mesero' | 'chef' | 'admin';
type EstadoMesa = 'libre' | 'ocupada' | 'reservada';
type EstadoPedido = 'abierto' | 'en_cocina' | 'facturado';

const ABIERTOS_LOCAL: EstadoPedido[] = ['abierto', 'en_cocina'];

function esMesaVirtualNumero(numero: number): boolean {
  return numero === 98 || numero === 99;
}

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
  total: number;
  metodo_pago: 'efectivo' | 'transferencia';
  emitida_en: string;
  es_parcial?: boolean;
};

type PedidoHistorialRow = {
  id_historial: number;
  id_pedido: number;
  id_usuario: number;
  tipo: 'detalle_agregado' | 'detalle_eliminado' | 'cantidad_actualizada';
  detalle: unknown;
  creado_en: string;
};

type CajaDiaRow = { fecha: string; monto_base_efectivo: number };

type ConfigDescuentosRow = {
  sopas_activo: boolean;
  sopas_monto_por_unidad: number;
  muleros_activo: boolean;
  muleros_monto_por_plato_principal: number;
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
  configDescuentos: ConfigDescuentosRow;
  seq: {
    pedido: number;
    detalle: number;
    factura: number;
    user: number;
    historial: number;
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

function isBebida(cat: string) {
  return cat.toLowerCase().includes('bebida');
}

function unauthorized(): never {
  throw new Error('Credenciales inválidas');
}

function rechazarChefTomaPedidos(actor: { rol: string }) {
  if (actor.rol === 'chef') unauthorized();
}

function soloChefOAdmin(actor: { rol: string }) {
  if (actor.rol !== 'admin' && actor.rol !== 'chef') unauthorized();
}

function badRequest(msg: string): never {
  throw new Error(msg);
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

function mapMesaAdminLocal(m: Mesa) {
  return {
    id_mesa: m.id_mesa,
    numero: m.numero,
    capacidad: m.capacidad,
    estado: m.estado,
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
    muleros_activo: false,
    muleros_monto_por_plato_principal: 0,
  };
}

function mapConfigDescuentosLocal(c: ConfigDescuentosRow) {
  return {
    sopas_activo: Boolean(c.sopas_activo),
    sopas_monto_por_unidad: Math.round(c.sopas_monto_por_unidad),
    muleros_activo: Boolean(c.muleros_activo),
    muleros_monto_por_plato_principal: Math.round(
      c.muleros_monto_por_plato_principal,
    ),
    umbral_subtotal_otros: UMBRAL_SUBTOTAL_OTROS_COP,
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
      numero: 99,
      capacidad: 1,
      estado: 'libre',
      ...d,
    },
    {
      id_mesa: 17,
      numero: 98,
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
        email: 'mesero@lareserva.local',
        rol: 'mesero',
        password: 'mesero123',
        activo: true,
      },
      {
        id: 2,
        nombre: 'Chef',
        apellido: 'Local',
        email: 'chef@lareserva.local',
        rol: 'chef',
        password: 'chef123',
        activo: true,
      },
      {
        id: 3,
        nombre: 'Administrador',
        apellido: '',
        email: 'admin@lareserva.local',
        rol: 'admin',
        password: 'admin123',
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
    configDescuentos: defaultConfigDescuentos(),
    seq: { pedido: 1, detalle: 1, factura: 1, user: 4, historial: 1, mesa: 18 },
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
  if (!o.configDescuentos || typeof o.configDescuentos !== 'object') {
    o.configDescuentos = defaultConfigDescuentos();
  } else {
    const c = o.configDescuentos as ConfigDescuentosRow;
    o.configDescuentos = {
      sopas_activo: Boolean(c.sopas_activo),
      sopas_monto_por_unidad: Math.round(Number(c.sopas_monto_por_unidad) || 0),
      muleros_activo: Boolean(c.muleros_activo),
      muleros_monto_por_plato_principal: Math.round(
        Number(c.muleros_monto_por_plato_principal ?? c.muleros_monto_por_unidad) ||
          0,
      ),
    };
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
  if (!mesas.some((m) => m.numero === 98)) {
    const maxId = mesas.reduce((acc, m) => Math.max(acc, m.id_mesa), 0);
    mesas.push({
      id_mesa: maxId + 1,
      numero: 98,
      capacidad: 1,
      estado: 'libre',
      ...d0,
    });
  }
  const pedidos = (o.pedidos as Pedido[]) ?? [];
  for (const p of pedidos) {
    if (!p.modo_servicio) {
      const mesa = mesas.find((m) => m.id_mesa === p.id_mesa);
      p.modo_servicio = mesa?.numero === 98 ? 'para_llevar' : 'en_mesa';
    }
    if (p.prioridad_cocina_override === undefined) {
      p.prioridad_cocina_override = null;
    }
    if (p.cliente_mulero === undefined) {
      p.cliente_mulero = false;
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
    }
    for (const p of productosNorm) {
      if (!cats.some((c) => c.id_categoria === p.id_categoria)) {
        cats.push({
          id_categoria: p.id_categoria,
          nombre: p.categoria_nombre,
          ...diasCategoriaPorNombre(p.categoria_nombre),
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

function userFromToken(db: Db, token?: string | null): User {
  if (!token || !token.startsWith(TOKEN_PREFIX)) unauthorized();
  const id = Number(token.slice(TOKEN_PREFIX.length));
  const u = db.users.find((x) => x.id === id && x.activo);
  if (!u) unauthorized();
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
  const w = weekdayLocal();
  const map: Record<number, keyof CategoriaLocal> = {
    1: 'disponible_lunes',
    2: 'disponible_martes',
    3: 'disponible_miercoles',
    4: 'disponible_jueves',
    5: 'disponible_viernes',
    6: 'disponible_sabado',
    7: 'disponible_domingo',
  };
  const key = map[w];
  return key ? Boolean(c[key]) : false;
}

function mapCategoriaAdminLocal(c: CategoriaLocal) {
  return {
    id_categoria: c.id_categoria,
    nombre: c.nombre,
    disponible_lunes: c.disponible_lunes,
    disponible_martes: c.disponible_martes,
    disponible_miercoles: c.disponible_miercoles,
    disponible_jueves: c.disponible_jueves,
    disponible_viernes: c.disponible_viernes,
    disponible_sabado: c.disponible_sabado,
    disponible_domingo: c.disponible_domingo,
  };
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
    map.set(p.id_categoria, {
      id_categoria: p.id_categoria,
      nombre: p.categoria_nombre,
      ...diasCategoriaPorNombre(p.categoria_nombre),
    });
  }
  return [...map.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

function groupMenu(db: Db) {
  const activos = db.productos.filter(
    (p) => p.activo !== false && !p.es_acompanamiento_mazorca,
  );
  const byCat = new Map<number, { id_categoria: number; nombre: string; productos: Producto[] }>();
  for (const p of activos) {
    const cat = db.categorias.find((c) => c.id_categoria === p.id_categoria);
    if (!cat || !categoriaDisponibleHoyLocal(cat)) continue;
    const curr = byCat.get(p.id_categoria) ?? {
      id_categoria: p.id_categoria,
      nombre: cat.nombre,
      productos: [],
    };
    curr.productos.push({
      ...p,
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

function serializeProductoAdmin(p: Producto) {
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
    tipo_proteina: p.tipo_proteina ?? 'ninguno',
  };
}

function serializePedido(db: Db, p: Pedido) {
  const mesa = db.mesas.find((m) => m.id_mesa === p.id_mesa);
  const mesero = db.users.find((u) => u.id === p.id_usuario);
  if (!mesa || !mesero) badRequest('Datos de pedido inconsistentes');
  const facturasPed = db.facturas
    .filter((f) => f.id_pedido === p.id_pedido)
    .sort((a, b) => a.emitida_en.localeCompare(b.emitida_en));
  const tiposEnCocina: TipoProteina[] = [];
  const detalles = p.detalles.map((d) => {
    const prod = db.productos.find((x) => x.id_producto === d.id_producto);
    if (!prod) badRequest(`Producto #${d.id_producto} no encontrado`);
    const opcionIds = Array.isArray(d.opcion_ids) ? d.opcion_ids : [];
    const pers = prod.opciones.filter((o) => opcionIds.includes(o.id_opcion));
    const marcar =
      !isBebida(prod.categoria_nombre) && !prod.es_empacable;
    const tipoProteina = tipoProteinaResuelto(
      prod.tipo_proteina,
      prod.categoria_nombre,
      prod.nombre,
    );
    if (marcar) {
      tiposEnCocina.push(tipoProteina);
    }
    return {
      id_detalle: d.id_detalle,
      id_producto: d.id_producto,
      id_detalle_padre: d.id_detalle_padre,
      nombre_producto: prod.nombre,
      categoria_nombre: prod.categoria_nombre,
      tipo_proteina: tipoProteina,
      es_bebida: isBebida(prod.categoria_nombre),
      es_empacable: Boolean(prod.es_empacable),
      es_plato_principal: Boolean(prod.es_plato_principal),
      es_acompanamiento_mazorca: Boolean(prod.es_acompanamiento_mazorca),
      marcar_cocina: marcar,
      enviado_cocina: d.enviado_cocina ?? false,
      listo_para_recoger: d.listo_para_recoger ?? false,
      listo_cocina: d.listo_cocina,
      cantidad: d.cantidad,
      precio_unitario: d.precio_unitario,
      subtotal_linea: d.precio_unitario * d.cantidad,
      nota_cocina: d.nota_cocina,
      cobrado: d.id_factura != null || Boolean(prod.es_acompanamiento_mazorca),
      id_factura: d.id_factura ?? null,
      personalizaciones: pers,
    };
  });
  const facturas = facturasPed.map((f) => ({
    id_factura: f.id_factura,
    subtotal: f.subtotal,
    descuento_sopas: f.descuento_sopas,
    descuento_muleros: f.descuento_muleros,
    total: f.total,
    metodo_pago: f.metodo_pago,
    emitida_en: f.emitida_en,
    es_parcial: Boolean(f.es_parcial),
  }));
  const ultimaFactura = facturas.length ? facturas[facturas.length - 1] : null;
  const pendientes = detalles.filter((d) => !d.cobrado);
  const totalPendiente = pendientes.reduce((s, d) => s + d.subtotal_linea, 0);
  const prioridadAuto = prioridadAutomaticaDesdeTipos(tiposEnCocina);
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
    cobro_pendiente: {
      items: pendientes.length,
      subtotal: totalPendiente,
    },
  };
  if (pendientes.length > 0) {
    const config = mapConfigDescuentosLocal(db.configDescuentos);
    const lineas = pendientes.map((d) => ({
      cantidad: d.cantidad,
      subtotal_linea: d.subtotal_linea,
      nombre_producto: d.nombre_producto,
      categoria_nombre: d.categoria_nombre,
      es_plato_principal: d.es_plato_principal,
    }));
    return {
      ...base,
      descuentos_estimados: calcularDescuentosPedido(
        lineas,
        config,
        Boolean(p.cliente_mulero),
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
        es_plato_principal: _ep,
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
    if (actor.rol !== 'admin') unauthorized();
    return categoriasLocalesAdmin(db) as T;
  }

  if (pathKey === '/categorias/admin' && method === 'GET') {
    if (actor.rol !== 'admin') unauthorized();
    return db.categorias.map(mapCategoriaAdminLocal) as T;
  }

  {
    const m = /^\/categorias\/admin\/(\d+)$/.exec(pathKey);
    if (m && method === 'PATCH') {
      if (actor.rol !== 'admin') unauthorized();
      const idCategoria = Number(m[1]);
      const cat = db.categorias.find((x) => x.id_categoria === idCategoria);
      if (!cat) badRequest('Categoría no encontrada');
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
      await writeDb(db);
      await deleteOfflineCache('menu_today').catch(() => undefined);
      return mapCategoriaAdminLocal(cat) as T;
    }
  }

  if (pathKey === '/productos' && method === 'GET') {
    if (actor.rol !== 'admin') unauthorized();
    const q = path.includes('?') ? path.split('?')[1] ?? '' : '';
    const incluir = new URLSearchParams(q).get('incluir_inactivos') === 'true';
    const rows = incluir
      ? db.productos
      : db.productos.filter((p) => p.activo !== false);
    return rows.map(serializeProductoAdmin) as T;
  }

  if (pathKey === '/productos' && method === 'POST') {
    if (actor.rol !== 'admin') unauthorized();
    const idCat = Number(body.id_categoria);
    const cat = db.categorias.find((x) => x.id_categoria === idCat);
    if (!cat) badRequest('Categoría no encontrada');
    const nombre = String(body.nombre ?? '').trim();
    if (!nombre) badRequest('Nombre requerido');
    const precio = Number(body.precio);
    if (!Number.isFinite(precio) || precio < 0) badRequest('Precio inválido');
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
      es_plato_principal: Boolean(body.es_plato_principal),
      es_empacable: Boolean(body.es_empacable),
      opciones: [],
    };
    db.productos.push(nuevo);
    await writeDb(db);
    await deleteOfflineCache('menu_today').catch(() => undefined);
    return serializeProductoAdmin(nuevo) as T;
  }

  {
    const m = /^\/productos\/(\d+)$/.exec(pathKey);
    if (m && method === 'PATCH') {
      if (actor.rol !== 'admin') unauthorized();
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
      if (body.es_plato_principal != null) {
        p.es_plato_principal = Boolean(body.es_plato_principal);
      }
      if (body.es_empacable != null) p.es_empacable = Boolean(body.es_empacable);
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
      await writeDb(db);
      await deleteOfflineCache('menu_today').catch(() => undefined);
      return serializeProductoAdmin(p) as T;
    }
    if (m && method === 'DELETE') {
      if (actor.rol !== 'admin') unauthorized();
      const id = Number(m[1]);
      const p = db.productos.find((x) => x.id_producto === id);
      if (!p) badRequest('Producto no encontrado');
      p.activo = false;
      await writeDb(db);
      await deleteOfflineCache('menu_today').catch(() => undefined);
      return serializeProductoAdmin(p) as T;
    }
  }

  if (pathKey === '/mesas/admin' && method === 'GET') {
    if (actor.rol !== 'admin') unauthorized();
    return db.mesas.map(mapMesaAdminLocal) as T;
  }

  if (pathKey === '/mesas/admin' && method === 'POST') {
    if (actor.rol !== 'admin') unauthorized();
    const numero = Number(body.numero);
    const capacidadRaw = body.capacidad;
    const capacidad =
      capacidadRaw != null && capacidadRaw !== ''
        ? Number(capacidadRaw)
        : 4;
    if (!Number.isFinite(numero) || numero < 1 || numero > 999) {
      badRequest('Número inválido');
    }
    if (numero === 98 || numero === 99) {
      badRequest('Los números 98 y 99 están reservados (para llevar / mostrador).');
    }
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
    return mapMesaAdminLocal(nueva) as T;
  }

  {
    const m = /^\/mesas\/admin\/(\d+)$/.exec(pathKey);
    if (m && method === 'PATCH') {
      if (actor.rol !== 'admin') unauthorized();
      const idMesa = Number(m[1]);
      const mesa = db.mesas.find((x) => x.id_mesa === idMesa);
      if (!mesa) badRequest('Mesa no encontrada');
      if (body.capacidad != null) {
        const c = Number(body.capacidad);
        if (!Number.isFinite(c) || c < 1 || c > 50) badRequest('Capacidad inválida');
        mesa.capacidad = c;
      }
      if (body.disponible_lunes !== undefined) {
        mesa.disponible_lunes = Boolean(body.disponible_lunes);
      }
      if (body.disponible_martes !== undefined) {
        mesa.disponible_martes = Boolean(body.disponible_martes);
      }
      if (body.disponible_miercoles !== undefined) {
        mesa.disponible_miercoles = Boolean(body.disponible_miercoles);
      }
      if (body.disponible_jueves !== undefined) {
        mesa.disponible_jueves = Boolean(body.disponible_jueves);
      }
      if (body.disponible_viernes !== undefined) {
        mesa.disponible_viernes = Boolean(body.disponible_viernes);
      }
      if (body.disponible_sabado !== undefined) {
        mesa.disponible_sabado = Boolean(body.disponible_sabado);
      }
      if (body.disponible_domingo !== undefined) {
        mesa.disponible_domingo = Boolean(body.disponible_domingo);
      }
      await writeDb(db);
      return mapMesaAdminLocal(mesa) as T;
    }
  }

  if (path === '/mesas' && method === 'GET') {
    return db.mesas
      .filter(
        (m) =>
          m.numero !== 99 &&
          m.numero !== 98 &&
          mesaDisponibleHoyLocal(m),
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
    const m = db.mesas.find((x) => x.numero === 99);
    if (!m) badRequest('Mostrador no configurado');
    if (!mesaDisponibleHoyLocal(m)) badRequest('Mostrador no disponible hoy');
    return mapMesaPublicLocal(m) as T;
  }

  if (path === '/mesas/para-llevar' && method === 'GET') {
    const m = db.mesas.find((x) => x.numero === 98);
    if (!m) badRequest('Para llevar no configurado');
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
    const virtual = esMesaVirtualNumero(mesa.numero);
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
      mesa.numero === 98 ? 'para_llevar' : 'en_mesa';
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
    const mzId = idProductoMazorcaLocal(db.productos);
    if (mzId != null) {
      crearLineaMazorcaInicialLocal(p, mesa.numero, mzId, () => db.seq.detalle++);
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
      .sort((a, b) => b.id_pedido - a.id_pedido);
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
        'Las mazorcas de acompañamiento se ajustan con el número de comensales',
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
      await writeDb(db);
      return serializePedido(db, p) as T;
    }
    const debeAutoEmpaque =
      p.modo_servicio === 'para_llevar' &&
      productoCobraEmpaqueParaLlevarPorPlatoFuerte({
        es_plato_principal: prod.es_plato_principal,
        es_empacable: prod.es_empacable,
        categoria_nombre: prod.categoria_nombre,
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
        precio_unitario: PRECIO_EMPAQUE_PARA_LLEVAR_COP,
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
    await writeDb(db);
    return serializePedido(db, p) as T;
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
      const marcar = !isBebida(prod.categoria_nombre) && !prod.es_empacable;
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
      const marcar = !isBebida(prod.categoria_nombre) && !prod.es_empacable;
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
          badRequest('La cantidad de mazorcas se ajusta con el número de comensales');
        }
        const marcarCocina = !isBebida(prod.categoria_nombre) && !prod.es_empacable;
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
            if (h.id_detalle_padre === idDetalle) {
              h.cantidad = cantidad;
            }
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
          badRequest('La línea de mazorca se ajusta con el número de comensales');
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
      const mzId = idProductoMazorcaLocal(db.productos);
      if (mzId != null) {
        const err = sincronizarLineaMazorcaLocal(
          p,
          mesa.numero,
          mzId,
          () => db.seq.detalle++,
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
      return {
        cantidad: d.cantidad,
        subtotal_linea: d.precio_unitario * d.cantidad,
        nombre_producto: prod.nombre,
        categoria_nombre: prod.categoria_nombre,
        es_plato_principal: Boolean(prod.es_plato_principal),
      };
    });
    const { descuento_sopas: descSopas, descuento_muleros: descMuleros } =
      calcularDescuentosPedido(lineas, config, Boolean(p.cliente_mulero));
    if (descSopas + descMuleros > subtotal) {
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
    if (p.estado === 'facturado') badRequest('Este pedido ya fue facturado');
    if (p.detalles.length === 0) badRequest('No hay ítems en el pedido');

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
        return {
          id_detalle: d.id_detalle,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          nombre_producto: prod.nombre,
          categoria_nombre: prod.categoria_nombre,
          es_plato_principal: Boolean(prod.es_plato_principal),
        };
      }),
      solicitudes,
    );
    const { descuento_sopas: descSopas, descuento_muleros: descMuleros } =
      calcularDescuentosPedido(lineas, config, Boolean(p.cliente_mulero));
    if (descSopas + descMuleros > subtotal) {
      badRequest('Los descuentos no pueden superar el subtotal de esta cuenta');
    }
    const total = subtotal - descSopas - descMuleros;
    const rawMp = String(body.metodo_pago ?? 'efectivo').toLowerCase();
    if (rawMp !== 'efectivo' && rawMp !== 'transferencia') {
      badRequest('Método de pago no válido (solo efectivo o transferencia).');
    }
    const metodoPago: Factura['metodo_pago'] =
      rawMp === 'transferencia' ? 'transferencia' : 'efectivo';
    const quedanPendientes = quedaPendienteTrasCobro(detallesSerial, solicitudes);
    const idFactura = db.seq.factura++;
    const factura: Factura = {
      id_factura: idFactura,
      id_pedido: idPedido,
      id_usuario: actor.id,
      subtotal,
      descuento_sopas: descSopas,
      descuento_muleros: descMuleros,
      total,
      metodo_pago: metodoPago,
      emitida_en: todayIso(),
      es_parcial: quedanPendientes,
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
      p.detalles.push({
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

    const byId = new Map(p.detalles.map((d) => [d.id_detalle, d]));
    for (const s of solicitudes) {
      const det = byId.get(s.id_detalle);
      if (!det) continue;
      aplicarCobroLocal(det, s.cantidad);
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

  if (path.startsWith('/pedidos/') && path.endsWith('/reimprimir-comanda') && method === 'POST') {
    const idPedido = Number(path.split('/')[2]);
    const p = db.pedidos.find((x) => x.id_pedido === idPedido);
    if (!p) badRequest('Pedido no encontrado');
    const enviados = p.detalles.filter(
      (d) => d.marcar_cocina && d.enviado_cocina,
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
    const numMesaNueva = Number(body.mesa_numero_nuevo ?? 0);
    const mesaNueva = db.mesas.find((m) => m.numero === numMesaNueva);
    if (!mesaNueva) badRequest('Mesa destino no encontrada');
    const destinoVirtual = esMesaVirtualNumero(mesaNueva.numero);
    if (!destinoVirtual) {
      if (mesaNueva.estado !== 'libre') badRequest('Mesa destino no está libre');
      if (
        db.pedidos.some(
          (x) =>
            x.id_mesa === mesaNueva.id_mesa && ABIERTOS_LOCAL.includes(x.estado),
        )
      ) {
        badRequest('La mesa destino ya tiene un pedido abierto');
      }
    }
    const idAnterior = p.id_mesa;
    const mesaOrigen = db.mesas.find((m) => m.id_mesa === idAnterior);
    p.id_mesa = mesaNueva.id_mesa;
    if (!destinoVirtual) {
      mesaNueva.estado = 'ocupada';
    }
    const restOrigen = db.pedidos.filter(
      (x) => x.id_mesa === idAnterior && ABIERTOS_LOCAL.includes(x.estado),
    ).length;
    if (mesaOrigen && restOrigen === 0) {
      mesaOrigen.estado = 'libre';
    }
    await writeDb(db);
    return serializePedido(db, p) as T;
  }

  if (path.startsWith('/pedidos/detalles/') && path.endsWith('/cocina') && method === 'PATCH') {
    if (actor.rol !== 'mesero' && actor.rol !== 'admin') unauthorized();
    const idDetalle = Number(path.split('/')[3]);
    for (const p of db.pedidos) {
      const d = p.detalles.find((x) => x.id_detalle === idDetalle);
      if (!d) continue;
      const prod = db.productos.find((x) => x.id_producto === d.id_producto)!;
      if (isBebida(prod.categoria_nombre)) {
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
    if (actor.rol !== 'mesero' && actor.rol !== 'admin') unauthorized();
    const idDetalle = Number(path.split('/')[3]);
    for (const p of db.pedidos) {
      const d = p.detalles.find((x) => x.id_detalle === idDetalle);
      if (!d) continue;
      const prod = db.productos.find((x) => x.id_producto === d.id_producto)!;
      if (isBebida(prod.categoria_nombre)) {
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
      if (isBebida(prod.categoria_nombre)) {
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
        if (isBebida(prod.categoria_nombre) || prod.es_empacable) return false;
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
      const mesero = db.users.find((u) => u.id_usuario === p.id_usuario)!;
      return {
        id_pedido: idPedido,
        platos_listos: platosListos,
        marcados_ahora: marcadosAhora,
        mesero: {
          id: mesero.id_usuario,
          nombre: mesero.nombre,
          apellido: mesero.apellido,
        },
      } as T;
    }
  }

  {
    const mPrio = /^\/pedidos\/(\d+)\/prioridad-cocina$/.exec(path);
    if (mPrio && method === 'PATCH') {
      if (actor.rol !== 'admin') unauthorized();
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
    if (actor.rol !== 'mesero' && actor.rol !== 'admin') unauthorized();
    const rows = db.pedidos.filter(
      (p) => ABIERTOS_LOCAL.includes(p.estado) && p.id_usuario === actor.id,
    );
    let pedidosMostrador = 0;
    let pedidosParaLlevar = 0;
    let platosSinPasarCocina = 0;
    let platosParaRecoger = 0;
    const mesaIds: number[] = [];
    const pedidoIds: number[] = [];
    for (const p of rows) {
      pedidoIds.push(p.id_pedido);
      mesaIds.push(p.id_mesa);
      const mesa = db.mesas.find((m) => m.id_mesa === p.id_mesa);
      const numero = mesa?.numero ?? 0;
      if (numero === 99) pedidosMostrador += 1;
      if (numero === 98) pedidosParaLlevar += 1;
      for (const d of p.detalles) {
        const prod = db.productos.find((x) => x.id_producto === d.id_producto);
        const cat = prod
          ? db.categorias.find((c) => c.id_categoria === prod.id_categoria)
          : null;
        const catNombre = cat?.nombre ?? '';
        const esBebida = catNombre.toLowerCase().includes('bebida');
        const esEmpacable = prod?.es_empacable ?? false;
        if (d.marcar_cocina && !d.enviado_cocina) {
          platosSinPasarCocina += d.cantidad;
        }
        if (
          d.marcar_cocina &&
          d.enviado_cocina &&
          d.listo_para_recoger &&
          !d.listo_cocina &&
          !esBebida &&
          !esEmpacable
        ) {
          platosParaRecoger += d.cantidad;
        }
      }
    }
    return {
      pedidos_mostrador: pedidosMostrador,
      pedidos_para_llevar: pedidosParaLlevar,
      platos_sin_pasar_cocina: platosSinPasarCocina,
      platos_para_recoger: platosParaRecoger,
      mesa_ids: mesaIds,
      pedido_ids: pedidoIds,
    } as T;
  }

  if (path === '/pedidos/mis-activos' && method === 'GET') {
    if (actor.rol !== 'mesero' && actor.rol !== 'admin') unauthorized();
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

  function detallePendienteRecogerLocal(d: PedidoDetalle, prod: { categoria_nombre?: string; es_empacable?: boolean } | undefined) {
    const catNombre = prod?.categoria_nombre ?? '';
    const esBebida = catNombre.toLowerCase().includes('bebida');
    const esEmpacable = prod?.es_empacable ?? false;
    return (
      d.marcar_cocina &&
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
      if (detallePendienteRecogerLocal(d, prod)) {
        total += d.cantidad;
      }
    }
    return total;
  }

  if (path === '/pedidos/ayuda-companeros/resumen' && method === 'GET') {
    if (actor.rol !== 'mesero' && actor.rol !== 'admin') unauthorized();
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
    if (actor.rol !== 'mesero' && actor.rol !== 'admin') unauthorized();
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
    if (actor.rol !== 'admin' && actor.rol !== 'chef') unauthorized();
    const rows = db.pedidos.filter((p) => p.estado === 'en_cocina');
    const serializados = ordenarPedidosCocina(
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
    if (actor.rol !== 'admin') unauthorized();
    const url = new URL(`http://local${path}`);
    let fecha = (url.searchParams.get('fecha') ?? '').trim();
    if (!fecha) fecha = toDateKey(todayIso());
    const row = db.cajaDiaria.find((c) => c.fecha === fecha);
    return {
      fecha,
      monto_base_efectivo: row?.monto_base_efectivo ?? 0,
    } as T;
  }

  if (path === '/pedidos/caja-diaria' && method === 'PUT') {
    if (actor.rol !== 'admin') unauthorized();
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

  if (path === '/pedidos/config-descuentos' && method === 'GET') {
    return mapConfigDescuentosLocal(db.configDescuentos) as T;
  }

  if (path === '/pedidos/config-descuentos' && method === 'PUT') {
    if (actor.rol !== 'admin') badRequest('Solo admin');
    const prev = db.configDescuentos;
    const next: ConfigDescuentosRow = {
      sopas_activo:
        body.sopas_activo != null ? Boolean(body.sopas_activo) : prev.sopas_activo,
      sopas_monto_por_unidad:
        body.sopas_monto_por_unidad != null
          ? Math.round(Number(body.sopas_monto_por_unidad))
          : prev.sopas_monto_por_unidad,
      muleros_activo:
        body.muleros_activo != null
          ? Boolean(body.muleros_activo)
          : prev.muleros_activo,
      muleros_monto_por_plato_principal:
        body.muleros_monto_por_plato_principal != null
          ? Math.round(Number(body.muleros_monto_por_plato_principal))
          : prev.muleros_monto_por_plato_principal,
    };
    if (next.sopas_activo && next.sopas_monto_por_unidad <= 0) {
      badRequest('Indica el monto por unidad de sopa al activar el descuento');
    }
    if (next.muleros_activo && next.muleros_monto_por_plato_principal <= 0) {
      badRequest(
        'Indica el monto por plato principal al activar el descuento de camioneros',
      );
    }
    db.configDescuentos = next;
    await writeDb(db);
    return mapConfigDescuentosLocal(next) as T;
  }

  {
    const url = new URL(`http://local${path}`);
    const fechaQ = (url.searchParams.get('fecha') ?? '').trim();
    if (
      pathKey === '/pedidos/resumen-diario/imprimir-completo' &&
      method === 'POST'
    ) {
      if (actor.rol !== 'admin') unauthorized();
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
    if (
      pathKey === '/pedidos/resumen-diario/imprimir-total' &&
      method === 'POST'
    ) {
      if (actor.rol !== 'admin') unauthorized();
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
    if (actor.rol !== 'admin') unauthorized();
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
            personalizaciones: pers.map((o) => ({
              id_opcion: o.id_opcion,
              descripcion: o.descripcion,
            })),
          };
        }),
    );
    return { id_factura: idFactura, detalles } as T;
  }

  if (pathKey.startsWith('/pedidos/resumen-diario') && method === 'GET') {
    if (actor.rol !== 'admin') unauthorized();
    const url = new URL(`http://local${path}`);
    const fecha = (url.searchParams.get('fecha') ?? '').trim();
    const target = fecha || toDateKey(todayIso());
    const facturas = db.facturas.filter((f) => toDateKey(f.emitida_en) === target);
    const montoBaseEfectivo =
      db.cajaDiaria.find((c) => c.fecha === target)?.monto_base_efectivo ?? 0;
    const totalesPorMetodo = { efectivo: 0, transferencia: 0 };
    const byMesa = new Map<number, { pedidos: number; total: number }>();
    for (const f of facturas) {
      const t = f.total;
      if (f.metodo_pago === 'efectivo') totalesPorMetodo.efectivo += t;
      else totalesPorMetodo.transferencia += t;
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
          total: f.total,
          metodo_pago: f.metodo_pago,
          emitida_en: f.emitida_en,
          es_parcial: Boolean(f.es_parcial),
          detalles: [],
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => a.emitida_en.localeCompare(b.emitida_en));

    return {
      fecha: target,
      total_facturado: facturas.reduce((s, f) => s + f.total, 0),
      total_facturas: facturas.length,
      total_mesas_atendidas: mesas.length,
      mesas,
      pedidos_detalle: pedidosDetalle,
      monto_base_efectivo: montoBaseEfectivo,
      totales_por_metodo: totalesPorMetodo,
      efectivo_esperado_en_caja: montoBaseEfectivo + totalesPorMetodo.efectivo,
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

  if (path === '/usuarios' && method === 'GET') {
    return db.users.map((u) => ({
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
    if (actor.rol !== 'admin') badRequest('Solo admin');
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
    if (actor.rol !== 'admin') badRequest('Solo admin');
    const id = Number(path.split('/')[2]);
    const u = db.users.find((x) => x.id === id);
    if (!u) badRequest('Usuario no encontrado');
    if (typeof body.activo === 'boolean') u.activo = body.activo;
    if (typeof body.password === 'string' && body.password.trim()) u.password = body.password.trim();
    await writeDb(db);
    return { id: u.id, nombre: u.nombre, apellido: u.apellido, email: u.email, rol: u.rol, activo: u.activo } as T;
  }

  badRequest(`Ruta no soportada en modo local: ${method} ${path}`);
}

