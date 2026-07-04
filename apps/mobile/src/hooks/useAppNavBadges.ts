import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMesasVirtuales } from './useMesasVirtuales';
import {
  puedeTomarPedidos,
  puedeVerMisPedidos,
} from './usePuedeTomarPedidos';
import { usePermisosMesero } from './usePermisosMesero';
import { api } from '../lib/api';
import type { MisActivosResumen } from '../lib/mis-activos-resumen';
import type { PendientesCobroResumen } from '../lib/pendientes-cobro-resumen';
import { useRefetchOnSync } from './useRefetchOnSync';

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
  const { token, user } = useAuth();
  const esAdmin = user?.rol === 'admin';
  const tomaPedidos = puedeTomarPedidos(user?.rol);
  const mv = useMesasVirtuales();
  const { permisos: permMesero } = usePermisosMesero();
  const [badges, setBadges] = useState<AppNavBadges>({});
  const throttleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!token || !user) {
      setBadges({});
      return;
    }

    const next: AppNavBadges = {};

    if (tomaPedidos && user.id != null) {
      try {
        const raw = await api<MisActivosResumen>('/pedidos/mis-activos/resumen', {
          token,
          cacheKey: `mis_activos_resumen_u${user.id}`,
        });
        const recoger = (raw.platos_para_recoger ?? 0) + (raw.mazorcas_para_recoger ?? 0);
        const sinCocina = raw.platos_sin_pasar_cocina ?? 0;
        next.misPedidos = recoger > 0 ? recoger : sinCocina > 0 ? sinCocina : undefined;
        next.mostrador = raw.pedidos_mostrador ?? 0;
        next.paraLlevar = raw.pedidos_para_llevar ?? 0;
      } catch {
        /* mantener últimos valores */
      }

      if (puedeVerMisPedidos(user.rol) && permMesero.ayuda_companeros) {
        try {
          const ayuda = await api<{ platos_para_recoger: number }>(
            '/pedidos/ayuda-companeros/resumen',
            { token, cacheKey: `ayuda_companeros_resumen_u${user.id}` },
          );
          next.ayudaCompaneros = ayuda.platos_para_recoger || undefined;
        } catch {
          /* noop */
        }
      }
    }

    if (esAdmin) {
      try {
        const cobro = await api<PendientesCobroResumen>(
          '/pedidos/pendientes-cobro/resumen',
          { token, cacheKey: 'pendientes_cobro_admin' },
        );
        next.resumenDiario =
          cobro.total_pedidos > 0 ? cobro.total_pedidos : undefined;
        next.mostrador = cobro.pedidos_mostrador ?? next.mostrador;
        next.paraLlevar = cobro.pedidos_para_llevar ?? next.paraLlevar;
      } catch {
        /* noop */
      }
    }

    setBadges(next);
  }, [token, user, tomaPedidos, esAdmin, permMesero.ayuda_companeros]);

  const scheduleLoad = useCallback(() => {
    if (throttleTimer.current != null) return;
    throttleTimer.current = setTimeout(() => {
      throttleTimer.current = null;
      void load();
    }, BADGE_SYNC_THROTTLE_MS);
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(
    () => () => {
      if (throttleTimer.current != null) {
        clearTimeout(throttleTimer.current);
        throttleTimer.current = null;
      }
    },
    [],
  );

  useRefetchOnSync(scheduleLoad, { source: 'mesas' });
  useRefetchOnSync(scheduleLoad, {
    source: 'pedido',
    enabled: esAdmin || tomaPedidos,
  });

  return {
    badges,
    refreshBadges: load,
    mostradorActivo: mv.mostradorActivo,
    paraLlevarActivo: mv.paraLlevarActivo,
  };
}
