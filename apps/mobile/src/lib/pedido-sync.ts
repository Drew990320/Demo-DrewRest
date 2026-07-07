import { connectSocket, getSocket } from './socket';
import { tituloLugarMesa } from './mesa-label';
import { notifyConfigUpdated, type ConfigUpdatedPayload } from './config-sync';
import {
  notifyUnauthorized,
  parseUnauthorizedMessage,
} from './auth-session';
import type { CompaneroModificaPedidoAccion } from '@la-reserva/shared-domain/companero-pedido';
import { mensajeListosParaRecoger } from '@la-reserva/shared-domain/cocina-vista';

export type CocinaLlamaTipoListo = 'entrada' | 'plato' | 'mixto';

export type PedidoUpdatedPayload = {
  pedidoId: number;
  mesaId: number;
  at: string;
};

export type CocinaLlamaMeseroPayload = {
  pedidoId: number;
  mesaId: number;
  mesaNumero: number;
  idMesero: number;
  meseroNombre: string;
  /** Platos de cocina (sin mazorcas). */
  platosListos: number;
  /** Mazorcas / entradas listas. */
  entradasListos?: number;
  /** @deprecated Usar platosListos + entradasListos */
  tipo_listo?: CocinaLlamaTipoListo;
  at: string;
};

export function tituloCocinaLlamaMesero(
  platos: number,
  entradas: number,
): string {
  if (platos > 0 && entradas > 0) return 'Platos y acompañamientos listos';
  if (entradas > 0) return 'Acompañamientos listos';
  return 'Cocina te llama';
}

export function mensajeCocinaLlamaMesero(
  payload: CocinaLlamaMeseroPayload,
  opts?: { incluirMesa?: boolean },
): string {
  const lugar =
    opts?.incluirMesa !== false
      ? ` · ${tituloLugarMesa(payload.mesaNumero)}`
      : '';
  const pedido = ` · pedido #${payload.pedidoId}`;

  const entradas =
    payload.entradasListos ??
    (payload.tipo_listo === 'entrada' ? payload.platosListos : 0);
  const platos =
    payload.tipo_listo === 'entrada' && payload.entradasListos == null
      ? 0
      : payload.platosListos;

  return mensajeListosParaRecoger(platos, entradas, `${lugar}${pedido}`);
}

export type CocinaFaltaPlatoPayload = {
  pedidoId: number;
  mesaId: number;
  mesaNumero: number;
  idDetalle: number;
  productoNombre: string;
  cantidad: number;
  meseroNombre: string;
  at: string;
};

export type CompaneroAgregoItemsPayload = {
  pedidoId: number;
  mesaId: number;
  mesaNumero: number;
  idMeseroDueno: number;
  idMeseroQuienAgrego: number;
  meseroQuienAgregoNombre: string;
  lineas: { nombre_producto: string; cantidad: number }[];
  accion?: CompaneroModificaPedidoAccion;
  at: string;
};

type PedidoListener = (payloads: PedidoUpdatedPayload[]) => void;
type MesasListener = (payloads: PedidoUpdatedPayload[]) => void;
type CocinaLlamaListener = (payload: CocinaLlamaMeseroPayload) => void;
type CocinaFaltaPlatoListener = (payload: CocinaFaltaPlatoPayload) => void;
type CompaneroAgregoListener = (payload: CompaneroAgregoItemsPayload) => void;

const pedidoListeners = new Set<PedidoListener>();
const mesasListeners = new Set<MesasListener>();
const cocinaLlamaListeners = new Set<CocinaLlamaListener>();
const cocinaFaltaPlatoListeners = new Set<CocinaFaltaPlatoListener>();
const companeroAgregoListeners = new Set<CompaneroAgregoListener>();
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let mesasDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPedido: PedidoUpdatedPayload[] = [];
let pendingMesas: PedidoUpdatedPayload[] = [];
let boundSocketId: string | null = null;
let lastJoin: {
  mesaId?: number;
  cocina?: boolean;
  resumen?: boolean;
} = {};
const ultimaFaltaPlato = { clave: '', en: 0 };
const ultimoLlamaMesero = { clave: '', en: 0 };
const ultimoCompaneroAgrego = { clave: '', en: 0 };

function dedupeEvento(
  clave: string,
  state: { clave: string; en: number },
  ventanaMs = 3000,
): boolean {
  const ahora = Date.now();
  if (clave === state.clave && ahora - state.en < ventanaMs) {
    return true;
  }
  state.clave = clave;
  state.en = ahora;
  return false;
}

function rejoinRooms(): void {
  const s = getSocket();
  if (!s?.connected) return;
  if (
    lastJoin.mesaId != null ||
    lastJoin.cocina ||
    lastJoin.resumen
  ) {
    s.emit('join', lastJoin);
  }
}

const DEBOUNCE_MS = 400;

function flushPedido() {
  debounceTimer = null;
  if (pendingPedido.length === 0) return;
  const batch = pendingPedido;
  pendingPedido = [];
  for (const fn of pedidoListeners) {
    try {
      fn(batch);
    } catch {
      // ignore
    }
  }
}

function flushMesas() {
  mesasDebounceTimer = null;
  if (pendingMesas.length === 0) return;
  const batch = pendingMesas;
  pendingMesas = [];
  for (const fn of mesasListeners) {
    try {
      fn(batch);
    } catch {
      // ignore
    }
  }
}

function schedulePedidoFlush() {
  if (debounceTimer != null) return;
  debounceTimer = setTimeout(flushPedido, DEBOUNCE_MS);
}

function scheduleMesasFlush() {
  if (mesasDebounceTimer != null) return;
  mesasDebounceTimer = setTimeout(flushMesas, DEBOUNCE_MS);
}

function attachPedidoSocketHandlers(s: NonNullable<ReturnType<typeof getSocket>>): void {
  s.off('pedido:updated');
  s.off('mesas:updated');
  s.off('cocina:llama-mesero');
  s.off('cocina:falta-plato');
  s.off('mesero:companero-agrego');
  s.off('connect');
  s.off('config:actualizada');
  s.off('auth:sesion-invalidada');

  s.on('pedido:updated', (payload: PedidoUpdatedPayload) => {
    pendingPedido.push(payload);
    schedulePedidoFlush();
  });
  s.on('mesas:updated', (payload: PedidoUpdatedPayload) => {
    pendingMesas.push(payload);
    scheduleMesasFlush();
  });
  s.on('cocina:llama-mesero', (payload: CocinaLlamaMeseroPayload) => {
    const clave = `${payload.pedidoId}:${payload.idMesero}:${payload.platosListos}:${payload.tipo_listo ?? 'plato'}:${payload.at}`;
    if (dedupeEvento(clave, ultimoLlamaMesero)) return;
    for (const fn of cocinaLlamaListeners) {
      try {
        fn(payload);
      } catch {
        // ignore
      }
    }
  });
  s.on('cocina:falta-plato', (payload: CocinaFaltaPlatoPayload) => {
    const clave = `${payload.pedidoId}:${payload.idDetalle}:${payload.cantidad}:${payload.at}`;
    if (dedupeEvento(clave, ultimaFaltaPlato)) return;
    for (const fn of cocinaFaltaPlatoListeners) {
      try {
        fn(payload);
      } catch {
        // ignore
      }
    }
  });
  s.on('mesero:companero-agrego', (payload: CompaneroAgregoItemsPayload) => {
    dispatchCompaneroModificoPedido(payload);
  });
  s.on('connect', () => {
    rejoinRooms();
  });
  s.on('config:actualizada', (payload: ConfigUpdatedPayload) => {
    if (payload?.scope) {
      notifyConfigUpdated(payload.scope);
    }
  });
  s.on('auth:sesion-invalidada', (payload: { motivo?: string; mensaje?: string }) => {
    const reason =
      payload.motivo === 'desactivado' ||
      payload.motivo === 'credenciales' ||
      payload.motivo === 'expirado'
        ? payload.motivo
        : parseUnauthorizedMessage(payload.mensaje ?? '');
    void notifyUnauthorized(reason, payload.mensaje);
  });
}

/** Un solo listener de socket con debounce para toda la app. */
export function ensurePedidoSocketSync(): void {
  const s = connectSocket();
  if (!s) return;
  if (boundSocketId !== s.id) {
    boundSocketId = s.id ?? null;
    attachPedidoSocketHandlers(s);
  }
  rejoinRooms();
}

export function joinPedidoRooms(opts: {
  mesaId?: number;
  cocina?: boolean;
  resumen?: boolean;
}): void {
  lastJoin = { ...lastJoin, ...opts };
  ensurePedidoSocketSync();
  const s = getSocket();
  s?.emit('join', lastJoin);
}

export function subscribePedidoUpdates(listener: PedidoListener): () => void {
  ensurePedidoSocketSync();
  pedidoListeners.add(listener);
  return () => {
    pedidoListeners.delete(listener);
  };
}

export function subscribeMesasUpdates(listener: MesasListener): () => void {
  ensurePedidoSocketSync();
  mesasListeners.add(listener);
  return () => {
    mesasListeners.delete(listener);
  };
}

export function subscribeCocinaLlamaMesero(
  listener: CocinaLlamaListener,
): () => void {
  ensurePedidoSocketSync();
  cocinaLlamaListeners.add(listener);
  return () => {
    cocinaLlamaListeners.delete(listener);
  };
}

export function subscribeCocinaFaltaPlato(
  listener: CocinaFaltaPlatoListener,
): () => void {
  ensurePedidoSocketSync();
  cocinaFaltaPlatoListeners.add(listener);
  return () => {
    cocinaFaltaPlatoListeners.delete(listener);
  };
}

export function dispatchCompaneroModificoPedido(
  payload: CompaneroAgregoItemsPayload,
): void {
  const accion = payload.accion ?? 'agregado';
  const clave = `${payload.pedidoId}:${payload.idMeseroDueno}:${accion}:${payload.at}`;
  if (dedupeEvento(clave, ultimoCompaneroAgrego)) {
    return;
  }
  for (const fn of companeroAgregoListeners) {
    try {
      fn(payload);
    } catch {
      // ignore
    }
  }
}

export function subscribeCompaneroAgregoItems(
  listener: CompaneroAgregoListener,
): () => void {
  ensurePedidoSocketSync();
  companeroAgregoListeners.add(listener);
  return () => {
    companeroAgregoListeners.delete(listener);
  };
}

export function resumenLineasAgregadas(
  lineas: { nombre_producto: string; cantidad: number }[],
): string {
  return lineas.map((l) => `${l.cantidad}× ${l.nombre_producto}`).join(', ');
}

/** Refetch solo si algún evento afecta esta mesa. */
export function batchAfectaMesa(
  batch: PedidoUpdatedPayload[],
  idMesa: number,
): boolean {
  return batch.some((p) => p.mesaId === idMesa);
}

/** Refetch de mis-pedidos solo si el batch toca pedidos/mesas del mesero. */
export function batchAfectaMisPedidos(
  batch: PedidoUpdatedPayload[],
  mesaIds: ReadonlySet<number> | readonly number[],
  pedidoIds?: ReadonlySet<number> | readonly number[],
): boolean {
  const mesas = mesaIds instanceof Set ? mesaIds : new Set(mesaIds);
  const pedidos =
    pedidoIds == null
      ? null
      : pedidoIds instanceof Set
        ? pedidoIds
        : new Set(pedidoIds);
  return batch.some(
    (p) => mesas.has(p.mesaId) || (pedidos?.has(p.pedidoId) ?? false),
  );
}
