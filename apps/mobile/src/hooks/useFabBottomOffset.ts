import { useFabPlacement } from './useFabPlacement';

/** Offset inferior para FABs según barra de navegación visible. */
export function useFabBottomOffset(): number {
  return useFabPlacement().bottom;
}
