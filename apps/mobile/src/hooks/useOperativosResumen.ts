import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getOperativosResumenSnapshot,
  loadOperativosResumen,
  resetOperativosResumen,
  subscribeOperativosResumen,
  type OperativosResumenSnapshot,
} from '../lib/operativos-resumen-store';
import { puedeTomarPedidos } from './usePuedeTomarPedidos';
import { usePermisosMesero } from './usePermisosMesero';

export function useOperativosResumen(enabled = true) {
  const { token, user } = useAuth();
  const { permisos: permMesero } = usePermisosMesero();
  const [snap, setSnap] = useState<OperativosResumenSnapshot>(() =>
    getOperativosResumenSnapshot(),
  );

  const esAdmin = user?.rol === 'admin';
  const tomaPedidos = puedeTomarPedidos(user?.rol);

  useEffect(() => subscribeOperativosResumen(setSnap), []);

  const refresh = useCallback(async () => {
    if (!enabled || !token || user?.id == null) {
      resetOperativosResumen();
      return;
    }
    await loadOperativosResumen({
      token,
      userId: user.id,
      userRol: user.rol,
      esAdmin,
      tomaPedidos,
      ayudaCompaneros: permMesero.ayuda_companeros,
    });
  }, [
    enabled,
    token,
    user?.id,
    user?.rol,
    esAdmin,
    tomaPedidos,
    permMesero.ayuda_companeros,
  ]);

  useEffect(() => {
    if (!enabled) {
      resetOperativosResumen();
      return;
    }
    void refresh();
  }, [enabled, refresh]);

  return {
    misActivos: snap.misActivos,
    ayudaPlatosParaRecoger: snap.ayudaPlatosParaRecoger,
    pendientesCobro: snap.pendientesCobro,
    refresh,
  };
}
