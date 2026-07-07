import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { api } from '../lib/api';
import {
  registerAccessTokenRefresher,
} from '../lib/auth-token-refresh';
import {
  mensajeSesionCerrada,
  registerUnauthorizedHandler,
  setAuthSessionUserId,
  tituloSesionCerrada,
  type AuthInvalidReason,
} from '../lib/auth-session';
import { showNotice } from '../lib/app-dialog';
import { connectSocket, disconnectSocket, setSocketAuthToken } from '../lib/socket';
import { ensurePedidoSocketSync } from '../lib/pedido-sync';
import { storage } from '../lib/storage';

const TOKEN_KEY = 'lr_token';
const USER_KEY = 'lr_user';
const TOKEN_EXPIRES_KEY = 'lr_token_expires_at';
const DEFAULT_TOKEN_TTL_SEC = 86_400;

export type User = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  es_superadmin?: boolean;
  permisos_admin?: Record<string, boolean> | null;
};

type AuthState = {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);
  const userRef = useRef<User | null>(null);
  tokenRef.current = token;
  userRef.current = user;

  const applySession = useCallback(
    async (accessToken: string, sessionUser: User, expiresIn?: number) => {
      const ttlSec = expiresIn ?? DEFAULT_TOKEN_TTL_SEC;
      const expiresAt = Date.now() + ttlSec * 1000;
      await storage.setItem(TOKEN_KEY, accessToken);
      await storage.setItem(USER_KEY, JSON.stringify(sessionUser));
      await storage.setItem(TOKEN_EXPIRES_KEY, String(expiresAt));
      setToken(accessToken);
      setUser(sessionUser);
      setSocketAuthToken(accessToken);
      connectSocket(accessToken);
      ensurePedidoSocketSync();
    },
    [],
  );

  const refreshSession = useCallback(async (): Promise<string | null> => {
    const currentToken = tokenRef.current;
    const currentUser = userRef.current;
    if (!currentToken || !currentUser) return null;
    try {
      const res = await api<{ access_token: string; expires_in?: number }>(
        '/auth/refresh',
        { method: 'POST', token: currentToken },
      );
      await applySession(res.access_token, currentUser, res.expires_in);
      return res.access_token;
    } catch {
      return null;
    }
  }, [applySession]);

  useEffect(() => {
    setAuthSessionUserId(user?.id ?? null);
  }, [user?.id]);

  useEffect(() => {
    registerUnauthorizedHandler(async (reason: AuthInvalidReason, message?: string) => {
      await showNotice(
        tituloSesionCerrada(reason),
        mensajeSesionCerrada(reason, message),
        'warning',
      );
      await storage.deleteItem(TOKEN_KEY);
      await storage.deleteItem(USER_KEY);
      await storage.deleteItem(TOKEN_EXPIRES_KEY);
      setToken(null);
      setUser(null);
      setAuthSessionUserId(null);
      setSocketAuthToken(null);
      disconnectSocket();
    });
    return () => registerUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const t = await storage.getItem(TOKEN_KEY);
        const u = await storage.getItem(USER_KEY);
        if (t && u) {
          setToken(t);
          setUser(JSON.parse(u) as User);
          setSocketAuthToken(t);
          connectSocket(t);
          ensurePedidoSocketSync();
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    registerAccessTokenRefresher(() => refreshSession());
    return () => registerAccessTokenRefresher(null);
  }, [refreshSession]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = async () => {
      const expRaw = await storage.getItem(TOKEN_EXPIRES_KEY);
      const expiresAt = expRaw ? Number(expRaw) : Date.now() + 3_600_000;
      const delay = Math.max(60_000, expiresAt - Date.now() - 5 * 60_000);
      timer = setTimeout(async () => {
        if (cancelled) return;
        await refreshSession();
        if (!cancelled) void schedule();
      }, delay);
    };

    void schedule();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [token, refreshSession]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{
      access_token: string;
      expires_in?: number;
      user: User;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await applySession(res.access_token, res.user, res.expires_in);
  }, [applySession]);

  const logout = useCallback(async () => {
    await storage.deleteItem(TOKEN_KEY);
    await storage.deleteItem(USER_KEY);
    await storage.deleteItem(TOKEN_EXPIRES_KEY);
    setToken(null);
    setUser(null);
    setAuthSessionUserId(null);
    setSocketAuthToken(null);
    disconnectSocket();
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      logout,
    }),
    [token, user, loading, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
}
