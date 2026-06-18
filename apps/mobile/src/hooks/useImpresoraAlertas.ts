import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { connectSocket, getSocket } from '../lib/socket';
import {
  type ImpresoraAlertaSocket,
  manejarAlertaImpresoraSocket,
} from '../lib/alarma-impresora';

/** Escucha alertas de impresora (sin papel) vía Socket.IO en todos los dispositivos conectados. */
export function useImpresoraAlertas() {
  const { token } = useAuth();

  useEffect(() => {
    const socket = connectSocket(token);
    if (!socket) return;

    const onAlerta = (payload: ImpresoraAlertaSocket) => {
      manejarAlertaImpresoraSocket(payload);
    };

    socket.on('impresora:alerta', onAlerta);
    return () => {
      getSocket()?.off('impresora:alerta', onAlerta);
    };
  }, [token]);
}
