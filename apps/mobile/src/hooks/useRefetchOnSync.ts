import { useCallback, useEffect, useRef } from 'react';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { subscribeMesasInvalidated } from '../lib/mesas-sync';
import {
  subscribeMesasUpdates,
  subscribePedidoUpdates,
  type PedidoUpdatedPayload,
} from '../lib/pedido-sync';

export type RefetchOnSyncSource = 'pedido' | 'mesas' | 'local-mesas';

export type RefetchOnSyncOptions = {
  enabled?: boolean;
  source: RefetchOnSyncSource;
  filter?: (batch: PedidoUpdatedPayload[]) => boolean;
  /** Si true (default), solo refetch con la pantalla visible; si no, marca pendiente al volver. */
  onlyWhenFocused?: boolean;
};

/**
 * Suscripción unificada a eventos de sync con debounce del socket y refetch
 * solo cuando la pantalla está enfocada (o al recuperar el foco si hubo cambios).
 */
export function useRefetchOnSync(
  refetch: () => void | Promise<void>,
  options: RefetchOnSyncOptions,
): void {
  const {
    enabled = true,
    source,
    filter,
    onlyWhenFocused = true,
  } = options;
  const isFocused = useIsFocused();
  const dirtyRef = useRef(false);
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  const runRefetch = useCallback(() => {
    void Promise.resolve(refetchRef.current()).catch(() => undefined);
  }, []);

  const tryRefetch = useCallback(
    (batch?: PedidoUpdatedPayload[]) => {
      if (!enabled) return;
      if (filter && batch && !filter(batch)) return;
      if (onlyWhenFocused && !isFocused) {
        dirtyRef.current = true;
        return;
      }
      dirtyRef.current = false;
      runRefetch();
    },
    [enabled, filter, isFocused, onlyWhenFocused, runRefetch],
  );

  useFocusEffect(
    useCallback(() => {
      if (dirtyRef.current && enabled) {
        dirtyRef.current = false;
        runRefetch();
      }
    }, [enabled, runRefetch]),
  );

  useEffect(() => {
    if (!enabled) return;
    if (source === 'local-mesas') {
      return subscribeMesasInvalidated(() => tryRefetch());
    }
    if (source === 'mesas') {
      return subscribeMesasUpdates((batch) => tryRefetch(batch));
    }
    return subscribePedidoUpdates((batch) => tryRefetch(batch));
  }, [enabled, source, tryRefetch]);
}
