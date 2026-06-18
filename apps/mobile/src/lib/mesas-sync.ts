/**
 * En modo local no hay Socket.IO; tras persistir en `local-api` se notifica
 * para que la pantalla de mesas vuelva a cargar `/mesas` sin salir y volver.
 */
type Listener = () => void;
const listeners = new Set<Listener>();
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const DEBOUNCE_MS = 350;

function flushMesasInvalidated(): void {
  debounceTimer = null;
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      // ignore
    }
  }
}

export function subscribeMesasInvalidated(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Agrupa ráfagas de escrituras locales en modo offline. */
export function notifyMesasInvalidated(): void {
  if (debounceTimer != null) return;
  debounceTimer = setTimeout(flushMesasInvalidated, DEBOUNCE_MS);
}
