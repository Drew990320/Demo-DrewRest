import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api } from '../lib/api';
import { connectSocket, disconnectSocket, setSocketAuthToken } from '../lib/socket';
import { ensurePedidoSocketSync } from '../lib/pedido-sync';
import { storage } from '../lib/storage';

const TOKEN_KEY = 'lr_token';
const USER_KEY = 'lr_user';

export type User = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
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

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await storage.setItem(TOKEN_KEY, res.access_token);
    await storage.setItem(USER_KEY, JSON.stringify(res.user));
    setToken(res.access_token);
    setUser(res.user);
    setSocketAuthToken(res.access_token);
    connectSocket(res.access_token);
    ensurePedidoSocketSync();
  }, []);

  const logout = useCallback(async () => {
    await storage.deleteItem(TOKEN_KEY);
    await storage.deleteItem(USER_KEY);
    setToken(null);
    setUser(null);
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
