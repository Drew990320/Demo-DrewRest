import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

const MotionContext = createContext(true);

function readMotionPreference(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return Promise.resolve(true);
    }
    return Promise.resolve(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  return AccessibilityInfo.isReduceMotionEnabled().then((v) => !v);
}

export function MotionProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void readMotionPreference().then((v) => {
      if (!cancelled) setEnabled(v);
    });

    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || !window.matchMedia) return;
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      const update = () => setEnabled(!mq.matches);
      mq.addEventListener('change', update);
      return () => {
        cancelled = true;
        mq.removeEventListener('change', update);
      };
    }

    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => {
      setEnabled(!v);
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  return (
    <MotionContext.Provider value={enabled}>{children}</MotionContext.Provider>
  );
}

/** Preferencia global de animación (un solo listener en toda la app). */
export function useMotionEnabled(): boolean {
  return useContext(MotionContext);
}
