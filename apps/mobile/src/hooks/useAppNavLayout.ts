import { useMemo } from 'react';
import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import {
  appNavZoneFromPath,
  pedidoIdFromPath,
  type AppNavZone,
} from '../lib/app-nav-zones';
import {
  BOTTOM_NAV_BAR_HEIGHT,
  SIDEBAR_NAV_WIDTH,
  bottomChromeHeight,
  fabBottomOffset,
} from '../lib/layout-constants';
import { useResponsive } from './useResponsive';
import {
  puedeTomarPedidos,
  puedeVerCocina,
  puedeVerMisPedidos,
} from './usePuedeTomarPedidos';

export type AppNavLayout = {
  zone: AppNavZone;
  pedidoId: string | null;
  /** Barra lateral en pantallas anchas. */
  sidebar: boolean;
  /** Barra inferior en móvil / tablet. */
  bottomBar: boolean;
  /** Mostrar algún tipo de navegación contextual. */
  visible: boolean;
  sidebarWidth: number;
  bottomBarHeight: number;
  fabBottom: number;
  scrollBottomNav: boolean;
  scrollSidebarNav: boolean;
};

export function useAppNavLayout(): AppNavLayout {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { navSidebar } = useResponsive();
  const { user } = useAuth();

  return useMemo(() => {
    const zone = appNavZoneFromPath(pathname);
    const pedidoId = pedidoIdFromPath(pathname);
    const esChef = user?.rol === 'chef';
    const esAdmin = user?.rol === 'admin';

    let visible = zone !== 'hidden';
    if (visible && zone === 'operacion' && esChef && !esAdmin) {
      visible = false;
    }
    if (visible && zone === 'pedido' && !puedeTomarPedidos(user?.rol)) {
      visible = false;
    }

    const sidebar = visible && navSidebar;
    const bottomBar = visible && !navSidebar;

    return {
      zone,
      pedidoId,
      sidebar,
      bottomBar,
      visible,
      sidebarWidth: sidebar ? SIDEBAR_NAV_WIDTH : 0,
      bottomBarHeight: bottomBar ? bottomChromeHeight(insets, true) : 0,
      fabBottom: fabBottomOffset(insets, bottomBar),
      scrollBottomNav: bottomBar,
      scrollSidebarNav: sidebar,
    };
  }, [pathname, insets, navSidebar, user?.rol]);
}

export function useNavCapabilities() {
  const { user } = useAuth();
  return {
    esAdmin: user?.rol === 'admin',
    esChef: user?.rol === 'chef',
    tomaPedidos: puedeTomarPedidos(user?.rol),
    veCocina: puedeVerCocina(user?.rol),
    veMisPedidos: puedeVerMisPedidos(user?.rol),
  };
}

export { BOTTOM_NAV_BAR_HEIGHT, SIDEBAR_NAV_WIDTH };
