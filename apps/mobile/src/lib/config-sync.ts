import { deleteOfflineCache } from './offline-cache';
import { invalidateMenuTodayCache } from './menu-cache';
import { notifyMesasInvalidated } from './mesas-sync';

export type ConfigScope = 'menu' | 'mesas' | 'categorias' | 'visual';

export type ConfigUpdatedPayload = {
  scope: ConfigScope;
  at: string;
};

type Listener = (payload: ConfigUpdatedPayload) => void;

const listeners = new Set<Listener>();
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pending: ConfigUpdatedPayload[] = [];

const DEBOUNCE_MS = 350;

function aplicarEfectos(scope: ConfigScope): void {
  if (scope === 'menu' || scope === 'categorias') {
    invalidateMenuTodayCache();
    void deleteOfflineCache('menu_today').catch(() => undefined);
  }
  if (scope === 'mesas' || scope === 'categorias') {
    notifyMesasInvalidated();
  }
}

function flush(): void {
  debounceTimer = null;
  if (pending.length === 0) return;
  const batch = pending;
  pending = [];
  const scopes = new Set(batch.map((p) => p.scope));
  for (const scope of scopes) {
    aplicarEfectos(scope);
  }
  for (const fn of listeners) {
    for (const payload of batch) {
      try {
        fn(payload);
      } catch {
        // ignore
      }
    }
  }
}

export function subscribeConfigUpdated(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Tras cambios admin (API remota vía socket o modo local). */
export function notifyConfigUpdated(scope: ConfigScope): void {
  pending.push({ scope, at: new Date().toISOString() });
  if (debounceTimer != null) return;
  debounceTimer = setTimeout(flush, DEBOUNCE_MS);
}
