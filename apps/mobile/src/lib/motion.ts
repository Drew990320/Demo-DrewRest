import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/** Duraciones cortas para uso en restaurante (no ralentizar al mesero). */
export const MOTION = {
  fast: 160,
  normal: 220,
  slow: 280,
  /** Retraso máximo al escalar entradas en listas largas. */
  staggerCapMs: 360,
  staggerStepMs: 42,
  /** Escala al presionar botones/tarjetas. */
  pressScale: 0.97,
} as const;

export function staggerDelay(index: number): number {
  return Math.min(index * MOTION.staggerStepMs, MOTION.staggerCapMs);
}

/** Respeta “reducir movimiento” del sistema. */
export function useMotionEnabled(): boolean {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || !window.matchMedia) return;
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      const update = () => setEnabled(!mq.matches);
      update();
      mq.addEventListener('change', update);
      return () => mq.removeEventListener('change', update);
    }
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => setEnabled(!v));
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => {
      setEnabled(!v);
    });
    return () => sub.remove();
  }, []);

  return enabled;
}
