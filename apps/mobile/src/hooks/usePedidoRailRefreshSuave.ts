import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { debeMarcarCocina } from '@la-reserva/shared-domain/categoria-reglas';

const REFRESH_DEBOUNCE_MS = 320;

type ItemAgregado = {
  id_producto: number;
  es_empacable?: boolean;
};

function reconciliarDeltaOptimista(
  prevServer: number,
  delta: number,
  nuevoServer: number,
): number {
  const diff = nuevoServer - prevServer;
  if (diff < 0) return 0;
  if (diff > 0) return Math.max(0, delta - diff);
  return delta;
}

/**
 * Actualiza la barra del pedido sin saltos bruscos: sube el contador al instante
 * y sincroniza con el servidor en debounce.
 */
export function usePedidoRailRefreshSuave(
  cargarPedidoSnap: () => Promise<void>,
  categoriaPorProductoRef: RefObject<Map<number, string>>,
  idPedido: number,
  platosPendientesServidor: number,
) {
  const [deltaPendientesCocina, setDeltaPendientesCocina] = useState(0);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cargarRef = useRef(cargarPedidoSnap);
  const prevIdRef = useRef(idPedido);
  const prevServerRef = useRef(platosPendientesServidor);
  cargarRef.current = cargarPedidoSnap;

  useEffect(
    () => () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (prevIdRef.current !== idPedido) {
      prevIdRef.current = idPedido;
      prevServerRef.current = platosPendientesServidor;
      setDeltaPendientesCocina(0);
      return;
    }

    setDeltaPendientesCocina((d) => {
      const next = reconciliarDeltaOptimista(
        prevServerRef.current,
        d,
        platosPendientesServidor,
      );
      prevServerRef.current = platosPendientesServidor;
      return next;
    });
  }, [idPedido, platosPendientesServidor]);

  const programarSync = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      refreshTimer.current = null;
      void cargarRef.current();
    }, REFRESH_DEBOUNCE_MS);
  }, []);

  const notificarItemAgregado = useCallback(
    (item: ItemAgregado, cantidad = 1) => {
      const cat = categoriaPorProductoRef.current?.get(item.id_producto) ?? '';
      if (debeMarcarCocina(cat, Boolean(item.es_empacable))) {
        setDeltaPendientesCocina((d) => d + cantidad);
      }
      programarSync();
    },
    [categoriaPorProductoRef, programarSync],
  );

  const aplicarPendientesOptimistas = useCallback(
    (desdeServidor: number) => desdeServidor + deltaPendientesCocina,
    [deltaPendientesCocina],
  );

  return {
    deltaPendientesCocina,
    notificarItemAgregado,
    aplicarPendientesOptimistas,
  };
}
