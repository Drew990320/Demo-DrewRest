import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type DetalleCocinaConteo = {
  marcar_cocina?: boolean;
  enviado_cocina?: boolean;
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

/** Contadores de cocina con delta optimista (evita saltos bruscos en la barra). */
export function usePedidoCocinaContadoresSuave(
  idPedido: number,
  detalles: DetalleCocinaConteo[],
) {
  const [deltaPendientes, setDeltaPendientes] = useState(0);
  const prevIdRef = useRef(idPedido);

  const platosPendientesServidor = useMemo(
    () =>
      detalles.filter((d) => d.marcar_cocina && !d.enviado_cocina).length,
    [detalles],
  );

  const prevServerRef = useRef(platosPendientesServidor);

  useEffect(() => {
    if (prevIdRef.current !== idPedido) {
      prevIdRef.current = idPedido;
      prevServerRef.current = platosPendientesServidor;
      setDeltaPendientes(0);
      return;
    }

    setDeltaPendientes((d) => {
      const next = reconciliarDeltaOptimista(
        prevServerRef.current,
        d,
        platosPendientesServidor,
      );
      prevServerRef.current = platosPendientesServidor;
      return next;
    });
  }, [idPedido, platosPendientesServidor]);

  const platosEnCocina = useMemo(
    () =>
      detalles.filter((d) => d.marcar_cocina && d.enviado_cocina).length,
    [detalles],
  );

  const platosPendientesCocina = platosPendientesServidor + deltaPendientes;

  const bumpPendientesCocina = useCallback((cantidad = 1) => {
    if (cantidad === 0) return;
    setDeltaPendientes((d) => Math.max(0, d + cantidad));
  }, []);

  const syncPendientesCocina = useCallback(() => {
    setDeltaPendientes(0);
  }, []);

  return {
    platosPendientesCocina,
    platosPendientesServidor,
    platosEnCocina,
    bumpPendientesCocina,
    syncPendientesCocina,
  };
}
