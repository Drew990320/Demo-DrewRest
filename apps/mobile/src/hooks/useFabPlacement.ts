import { usePathname } from 'expo-router';
import { useAppToolsRailActive } from '../context/ResumenDiarioToolsRailContext';
import { useAppNavLayout } from './useAppNavLayout';
import { useResponsive } from './useResponsive';
import { RESUMEN_TOOLS_RAIL_WIDTH } from '../lib/layout-constants';

const FAB_EDGE = 16;
const FAB_RAIL_GAP = 12;

export type FabPlacement = {
  bottom: number;
  right: number;
  /** Panel compacto anclado al FAB (p. ej. resumen con barra derecha). */
  compactPanel: boolean;
};

/** Posición de FABs globales (p. ej. llamar mesero en cocina). */
export function useFabPlacement(): FabPlacement {
  const nav = useAppNavLayout();
  const { navSidebar } = useResponsive();
  const pathname = usePathname();
  const toolsRailActive = useAppToolsRailActive();
  const resumenConBarra =
    navSidebar && toolsRailActive && pathname.includes('/resumen-diario');

  return {
    bottom: nav.fabBottom,
    right:
      navSidebar && toolsRailActive
        ? RESUMEN_TOOLS_RAIL_WIDTH + FAB_RAIL_GAP
        : FAB_EDGE,
    compactPanel: resumenConBarra,
  };
}
