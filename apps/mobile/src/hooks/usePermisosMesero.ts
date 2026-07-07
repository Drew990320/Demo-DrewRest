import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { esRolAdministrativo } from '../lib/admin-capacidades';
import { api } from '../lib/api';
import {
  PERMISOS_MESERO_DEFAULTS,
  type PermisosMeseroEfectivos,
  permisosMeseroTodos,
} from '@la-reserva/shared-domain/permisos-mesero';

let cacheKey: string | null = null;
let cacheData: PermisosMeseroEfectivos | null = null;

export function invalidarCachePermisosMesero() {
  cacheKey = null;
  cacheData = null;
}

function permisosPorDefecto(rol?: string): PermisosMeseroEfectivos {
  if (esRolAdministrativo(rol)) return permisosMeseroTodos();
  return {
    ...PERMISOS_MESERO_DEFAULTS,
    puede_cerrar_anulando: false,
    es_admin: false,
  };
}

export function usePermisosMesero() {
  const { token, user } = useAuth();
  const [permisos, setPermisos] = useState<PermisosMeseroEfectivos>(() =>
    permisosPorDefecto(user?.rol),
  );
  const [loading, setLoading] = useState(Boolean(token && user?.rol !== 'chef'));

  const reload = useCallback(async () => {
    if (!token || !user) {
      setPermisos(permisosPorDefecto(undefined));
      setLoading(false);
      return;
    }
    if (user.rol === 'chef') {
      setPermisos(permisosPorDefecto('chef'));
      setLoading(false);
      return;
    }
    const key = `${token}:${user.id}:${user.rol}`;
    if (cacheKey === key && cacheData) {
      setPermisos(cacheData);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api<PermisosMeseroEfectivos>('/permisos/efectivos', {
        token,
        cacheKey: `permisos_efectivos_${user.id}`,
      });
      cacheKey = key;
      cacheData = data;
      setPermisos(data);
    } catch {
      setPermisos(permisosPorDefecto(user.rol));
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { permisos, loading, reload, esAdmin: permisos.es_admin };
}
