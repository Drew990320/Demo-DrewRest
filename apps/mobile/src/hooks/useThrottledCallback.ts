import { useCallback, useEffect, useRef } from 'react';

/** Ejecuta fn como máximo una vez cada `ms` (ráfagas se coalescen). */
export function useThrottledCallback(fn: () => void | Promise<void>, ms: number) {
  const fnRef = useRef(fn);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  fnRef.current = fn;

  useEffect(
    () => () => {
      if (timerRef.current != null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    },
    [],
  );

  return useCallback(() => {
    if (timerRef.current != null) return;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void Promise.resolve(fnRef.current()).catch(() => undefined);
    }, ms);
  }, [ms]);
}
