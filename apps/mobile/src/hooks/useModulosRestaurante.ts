import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export type ModulosRestaurante = {
  modulo_inventario_activo: boolean;
  modulo_meseros_operativos_activo: boolean;
  modulo_envio_correo_activo: boolean;
  modulo_resumen_diario_activo: boolean;
};

const DEFAULTS: ModulosRestaurante = {
  modulo_inventario_activo: false,
  modulo_meseros_operativos_activo: true,
  modulo_envio_correo_activo: false,
  modulo_resumen_diario_activo: true,
};

let cacheModulos: ModulosRestaurante | null = null;

export function invalidarCacheModulosRestaurante(): void {
  cacheModulos = null;
}

export function useModulosRestaurante(): ModulosRestaurante {
  const { token, user } = useAuth();
  const [modulos, setModulos] = useState<ModulosRestaurante>(
    () => cacheModulos ?? DEFAULTS,
  );

  const load = useCallback(async () => {
    if (!token || user?.rol !== 'admin') {
      setModulos(DEFAULTS);
      return;
    }
    try {
      const res = await api<ModulosRestaurante>('/restaurante/config', { token });
      const next: ModulosRestaurante = {
        modulo_inventario_activo: res.modulo_inventario_activo,
        modulo_meseros_operativos_activo: res.modulo_meseros_operativos_activo,
        modulo_envio_correo_activo: res.modulo_envio_correo_activo,
        modulo_resumen_diario_activo: res.modulo_resumen_diario_activo,
      };
      cacheModulos = next;
      setModulos(next);
    } catch {
      /* conservar último valor conocido */
    }
  }, [token, user?.rol]);

  useEffect(() => {
    void load();
  }, [load]);

  return modulos;
}
