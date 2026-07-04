import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { manejarErrorAccion } from '../lib/recurso-disponible';

const STORAGE_KEY = 'modo_pruebas_admin_hasta';
const DURACION_MS = 2 * 60 * 60 * 1000;

export function useModoPruebasAdmin() {
  const { token, user } = useAuth();
  const [habilitadoHasta, setHabilitadoHasta] = useState<number | null>(null);
  const [verificando, setVerificando] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const hasta = Number(raw);
        if (Number.isFinite(hasta) && hasta > Date.now()) {
          setHabilitadoHasta(hasta);
        } else {
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const habilitado = useMemo(() => {
    if (user?.rol !== 'admin') return false;
    return habilitadoHasta != null && habilitadoHasta > Date.now();
  }, [user?.rol, habilitadoHasta]);

  const activarConPassword = useCallback(
    async (password: string) => {
      if (user?.rol !== 'admin') return false;
      const pwd = password.trim();
      if (!pwd) return false;
      setVerificando(true);
      try {
        await api<{ ok: boolean }>('/auth/verify-password', {
          method: 'POST',
          token,
          body: JSON.stringify({ password: pwd }),
        });
        const hasta = Date.now() + DURACION_MS;
        setHabilitadoHasta(hasta);
        await AsyncStorage.setItem(STORAGE_KEY, String(hasta));
        return true;
      } catch (e) {
        await manejarErrorAccion(e, 'verificar la contraseña');
        return false;
      } finally {
        setVerificando(false);
      }
    },
    [token, user?.rol],
  );

  const desactivar = useCallback(async () => {
    setHabilitadoHasta(null);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return {
    habilitado,
    verificando,
    activarConPassword,
    desactivar,
    minutosRestantes:
      habilitado && habilitadoHasta != null
        ? Math.max(1, Math.ceil((habilitadoHasta - Date.now()) / 60_000))
        : 0,
  };
}
