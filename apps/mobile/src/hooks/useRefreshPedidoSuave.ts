import { useCallback, useEffect, useRef } from 'react';

const REFRESH_DEBOUNCE_MS = 320;

/** Agrupa refrescos del pedido para no parpadear la barra en cada cambio. */
export function useRefreshPedidoSuave(
  onRefresh: () => Promise<void>,
  onSynced?: () => void,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRefreshRef = useRef(onRefresh);
  const onSyncedRef = useRef(onSynced);
  onRefreshRef.current = onRefresh;
  onSyncedRef.current = onSynced;

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const refreshSuave = useCallback((opts?: { inmediato?: boolean }) => {
    const ejecutar = () =>
      onRefreshRef.current().finally(() => onSyncedRef.current?.());

    if (opts?.inmediato) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      return ejecutar();
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void ejecutar();
    }, REFRESH_DEBOUNCE_MS);
    return Promise.resolve();
  }, []);

  return refreshSuave;
}
