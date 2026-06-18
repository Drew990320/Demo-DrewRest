/** Columnas para tarjetas admin con chips de días (mesas, categorías). */
export function adminGridColumns(
  contentWidth: number,
  mesaGridColumns: number,
): number {
  if (contentWidth < 520) return 1;
  if (contentWidth < 768) return 2;
  if (contentWidth < 1024) return 3;
  return Math.min(4, mesaGridColumns);
}
