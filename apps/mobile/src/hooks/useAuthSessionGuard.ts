import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const SESSION_PING_MS = 90_000;

/**
 * Valida /auth/me periódicamente cuando la app está visible.
 * El cierre por socket (usuario desactivado) lo maneja pedido-sync.
 */
export function useAuthSessionGuard(): void {
  const { token } = useAuth();

  const pingSession = useCallback(async () => {
    if (!token) return;
    try {
      await api('/auth/me', { token });
    } catch {
      // api() ya notifica y cierra sesión en 401 con token activo
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      void pingSession();
      const id = setInterval(() => {
        void pingSession();
      }, SESSION_PING_MS);
      return () => clearInterval(id);
    }, [token, pingSession]),
  );
}
