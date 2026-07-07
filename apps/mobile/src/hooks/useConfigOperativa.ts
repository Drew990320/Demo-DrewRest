import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export type ConfigOperativa = {
  precio_empaque_para_llevar: number;
  mazorca_activa: boolean;
  id_producto_mazorca: number | null;
  producto_mazorca_nombre: string | null;
  numero_mesa_para_llevar: number;
  numero_mesa_mostrador: number;
  etiqueta_para_llevar: string;
  etiqueta_mostrador: string;
  mostrador_activo: boolean;
  para_llevar_activo: boolean;
  beneficio_soda_almuerzo_activo: boolean;
  id_producto_soda_almuerzo: number | null;
  producto_soda_nombre: string | null;
  soda_almuerzo_descontar_stock: boolean;
};

const DEFAULT: ConfigOperativa = {
  precio_empaque_para_llevar: 1000,
  mazorca_activa: false,
  id_producto_mazorca: null,
  producto_mazorca_nombre: null,
  numero_mesa_para_llevar: 98,
  numero_mesa_mostrador: 99,
  etiqueta_para_llevar: 'Pedidos para llevar',
  etiqueta_mostrador: 'Mostrador',
  mostrador_activo: true,
  para_llevar_activo: true,
  beneficio_soda_almuerzo_activo: false,
  id_producto_soda_almuerzo: null,
  producto_soda_nombre: null,
  soda_almuerzo_descontar_stock: true,
};

let memCache: ConfigOperativa | null = null;
let inflightReload: Promise<ConfigOperativa> | null = null;

/** Config operativa del restaurante (empaque, acompañamiento opcional). */
export function useConfigOperativa() {
  const { token } = useAuth();
  const [config, setConfig] = useState<ConfigOperativa>(memCache ?? DEFAULT);
  const [loading, setLoading] = useState(memCache == null);
  const [configError, setConfigError] = useState(false);
  const [usandoCache, setUsandoCache] = useState(memCache != null);

  const reload = useCallback(async () => {
    if (!token) return DEFAULT;
    if (inflightReload) {
      return inflightReload;
    }
    inflightReload = (async () => {
      try {
        const data = await api<ConfigOperativa>('/pedidos/config-operativa', {
          token,
          cacheKey: 'config_operativa',
        });
        memCache = data;
        setConfig(data);
        setConfigError(false);
        setUsandoCache(false);
        return data;
      } finally {
        inflightReload = null;
      }
    })();
    return inflightReload;
  }, [token]);

  useEffect(() => {
    if (!token) return;
    if (memCache) {
      setConfig(memCache);
      setLoading(false);
      setUsandoCache(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await reload();
      } catch {
        if (!cancelled) {
          if (memCache) {
            setConfig(memCache);
            setUsandoCache(true);
          }
          setConfigError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reload, token]);

  return { config, loading, reload, configError, usandoCache };
}

export function invalidateConfigOperativaMemCache(): void {
  memCache = null;
}
