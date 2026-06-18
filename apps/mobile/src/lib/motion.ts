/** Duraciones cortas para uso en restaurante (no ralentizar al mesero). */
export const MOTION = {
  fast: 160,
  normal: 220,
  slow: 280,
  /** Retraso máximo al escalar entradas en listas largas. */
  staggerCapMs: 360,
  staggerStepMs: 42,
} as const;

export function staggerDelay(index: number): number {
  return Math.min(index * MOTION.staggerStepMs, MOTION.staggerCapMs);
}
