import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import NetInfo from '@react-native-community/netinfo';
import { reconnectSocket } from '../lib/socket';
import { API_URL, apiIsOnLocalLan } from '../lib/config';

type NetworkState = {
  /** True si el API local responde o hay red con internet (según el modo). */
  online: boolean;
};

const NetworkContext = createContext<NetworkState | null>(null);

async function pingLocalApi(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/health`, { cache: 'no-store' });
    return res.ok;
  } catch {
    return false;
  }
}

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(true);
  const wasOffline = useRef(false);
  const lanMode = apiIsOnLocalLan();

  const applyOnline = useCallback((up: boolean) => {
    setOnline(up);
    if (!up) {
      wasOffline.current = true;
      return;
    }
    if (wasOffline.current) {
      wasOffline.current = false;
      reconnectSocket();
    }
  }, []);

  useEffect(() => {
    if (!lanMode) return;

    NetInfo.configure({
      reachabilityUrl: `${API_URL}/health`,
      reachabilityMethod: 'GET',
      reachabilityTest: async (response) => response.ok,
      useNativeReachability: false,
    });

    let cancelled = false;
    const tick = async () => {
      const up = await pingLocalApi();
      if (!cancelled) applyOnline(up);
    };
    tick();
    const id = setInterval(tick, 45_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [lanMode, applyOnline]);

  useEffect(() => {
    if (lanMode) return;

    const sub = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? false;
      if (!connected) {
        applyOnline(false);
        return;
      }
      const reachable = state.isInternetReachable;
      if (reachable === false) {
        applyOnline(false);
        return;
      }
      applyOnline(true);
    });
    NetInfo.fetch().then((state) => {
      const connected = state.isConnected ?? false;
      const reachable = state.isInternetReachable;
      applyOnline(connected && reachable !== false);
    });
    return () => sub();
  }, [lanMode, applyOnline]);

  const value = useMemo(() => ({ online }), [online]);
  return (
    <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
  );
}

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) {
    throw new Error('useNetwork debe usarse dentro de NetworkProvider');
  }
  return ctx;
}
