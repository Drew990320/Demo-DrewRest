import { io, Socket } from 'socket.io-client';
import { API_URL } from './config';

let socket: Socket | null = null;
let connecting = false;
let authToken: string | null = null;

/**
 * Mismo criterio que `api()`: en modo local no hay servidor → no abrir Socket.IO
 * (evita errores repetidos `ws://localhost:3000/socket.io` en consola).
 */
function debeOmitirSocket(): boolean {
  if (process.env.EXPO_PUBLIC_LOCAL_MODE === 'true') {
    return true;
  }
  if (process.env.EXPO_PUBLIC_DISABLE_SOCKET === 'true') {
    return true;
  }
  return false;
}

export function setSocketAuthToken(token: string | null): void {
  authToken = token;
  if (!socket) return;
  socket.auth = { token: token ?? '' };
  if (token) {
    if (socket.connected) {
      socket.disconnect();
      socket.connect();
    }
  } else {
    socket.disconnect();
  }
}

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(token?: string | null): Socket | null {
  if (debeOmitirSocket()) {
    disconnectSocket();
    return null;
  }

  const resolved = token ?? authToken;
  if (!resolved) {
    return null;
  }
  authToken = resolved;

  if (socket?.connected) {
    socket.auth = { token: resolved };
    return socket;
  }

  if (socket && !socket.connected) {
    socket.auth = { token: resolved };
    if (!connecting) {
      connecting = true;
      socket.connect();
      socket.once('connect', () => {
        connecting = false;
      });
      socket.once('connect_error', () => {
        connecting = false;
      });
    }
    return socket;
  }

  socket = io(API_URL, {
    auth: { token: resolved },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnectionAttempts: 12,
    reconnectionDelay: 1500,
    timeout: 10000,
  });

  return socket;
}

export function reconnectSocket(token?: string | null): Socket | null {
  if (debeOmitirSocket()) {
    disconnectSocket();
    return null;
  }
  const resolved = token ?? authToken;
  if (!resolved) {
    return null;
  }
  authToken = resolved;
  if (socket) {
    socket.auth = { token: resolved };
    socket.connect();
    return socket;
  }
  return connectSocket(resolved);
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  connecting = false;
}
