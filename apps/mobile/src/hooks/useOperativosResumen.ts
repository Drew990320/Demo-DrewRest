import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { puedeCapacidadAdmin } from '../lib/admin-capacidades';
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

  const veResumenDiario = puedeCapacidadAdmin(user, 'resumen_diario');
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
      esAdmin: veResumenDiario,
      tomaPedidos,
      ayudaCompaneros: permMesero.ayuda_companeros,
    });
  }, [
    enabled,
    token,
    user?.id,
    user?.rol,
    veResumenDiario,
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
