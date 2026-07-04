import { useEffect, useRef } from 'react';
import {
  subscribeConfigUpdated,
  type ConfigScope,
} from '../lib/config-sync';

type Options = {
  enabled?: boolean;
  scopes: ConfigScope[];
};

/** Refetch cuando un admin cambia menú, mesas o categorías (socket o modo local). */
export function useConfigSync(
  refetch: () => void | Promise<void>,
  options: Options,
): void {
  const { enabled = true, scopes } = options;
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;
  const scopesKey = scopes.join(',');

  useEffect(() => {
    if (!enabled) return;
    const allowed = new Set(scopesKey.split(',') as ConfigScope[]);
    return subscribeConfigUpdated((payload) => {
      if (!allowed.has(payload.scope)) return;
      void Promise.resolve(refetchRef.current()).catch(() => undefined);
    });
  }, [enabled, scopesKey]);
}
