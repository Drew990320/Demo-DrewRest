/** Billete/moneda mínima habitual en efectivo (COP). */
export const PASO_MONEDA_COP = 100;

/**
 * Reparte un total entre N personas en montos enteros de COP,
 * cada uno múltiplo de `paso` (p. ej. $100). La suma coincide con el total.
 */
export function repartirMontoEnCop(
  total: number,
  personas: number,
  paso = PASO_MONEDA_COP,
): number[] {
  const t = Math.round(total);
  if (personas < 1 || t <= 0) return [];

  const base = Math.floor(t / personas / paso) * paso;
  const montos = Array.from({ length: personas }, () => base);
  let resto = t - base * personas;
  let i = 0;
  while (resto >= paso) {
    montos[i % personas] += paso;
    resto -= paso;
    i += 1;
  }
  if (resto > 0) {
    montos[0] += resto;
  }
  return montos;
}
