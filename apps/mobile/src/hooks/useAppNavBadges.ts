import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMesasVirtuales } from './useMesasVirtuales';
import { puedeTomarPedidos, puedeVerMisPedidos } from './usePuedeTomarPedidos';
import { useRefetchOnSync } from './useRefetchOnSync';
import { useOperativosResumen } from './useOperativosResumen';
import { useThrottledCallback } from './useThrottledCallback';

/** Agrupa ráfagas de socket (pedido/mesa) para no martillar el API en hora pico. */
const BADGE_SYNC_THROTTLE_MS = 1_500;

export type AppNavBadges = {
  misPedidos?: number;
  mostrador?: number;
  paraLlevar?: number;
  ayudaCompaneros?: number;
  resumenDiario?: number;
};

export function useAppNavBadges() {
  const { user } = useAuth();
  const esAdmin = user?.rol === 'admin';
  const tomaPedidos = puedeTomarPedidos(user?.rol);
  const mv = useMesasVirtuales();
  const {
    misActivos,
    ayudaPlatosParaRecoger,
    pendientesCobro,
    refresh,
  } = useOperativosResumen(!!user);

  const scheduleRefresh = useThrottledCallback(refresh, BADGE_SYNC_THROTTLE_MS);

  const badges = useMemo((): AppNavBadges => {
    const next: AppNavBadges = {};

    if (tomaPedidos && misActivos) {
      const recoger =
        (misActivos.platos_para_recoger ?? 0) +
        (misActivos.mazorcas_para_recoger ?? 0);
      const sinCocina = misActivos.platos_sin_pasar_cocina ?? 0;
      next.misPedidos =
        recoger > 0 ? recoger : sinCocina > 0 ? sinCocina : undefined;
      next.mostrador = misActivos.pedidos_mostrador ?? 0;
      next.paraLlevar = misActivos.pedidos_para_llevar ?? 0;
    }

    if (puedeVerMisPedidos(user?.rol) && ayudaPlatosParaRecoger > 0) {
      next.ayudaCompaneros = ayudaPlatosParaRecoger;
    }

    if (esAdmin && pendientesCobro) {
      next.resumenDiario =
        pendientesCobro.total_pedidos > 0
          ? pendientesCobro.total_pedidos
          : undefined;
      next.mostrador = pendientesCobro.pedidos_mostrador ?? next.mostrador;
      next.paraLlevar = pendientesCobro.pedidos_para_llevar ?? next.paraLlevar;
    }

    return next;
  }, [
    misActivos,
    ayudaPlatosParaRecoger,
    pendientesCobro,
    tomaPedidos,
    esAdmin,
    user?.rol,
  ]);

  useRefetchOnSync(scheduleRefresh, { source: 'mesas' });
  useRefetchOnSync(scheduleRefresh, {
    source: 'pedido',
    enabled: esAdmin || tomaPedidos,
  });

  return {
    badges,
    refreshBadges: refresh,
    mostradorActivo: mv.mostradorActivo,
    paraLlevarActivo: mv.paraLlevarActivo,
  };
}
