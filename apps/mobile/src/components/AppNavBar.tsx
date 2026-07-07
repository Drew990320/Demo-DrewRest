import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppNavBadges } from '../hooks/useAppNavBadges';
import { useAppNavLayout } from '../hooks/useAppNavLayout';
import { useNavCapabilities } from '../hooks/useAppNavLayout';
import { usePedidoNavMeta } from '../hooks/usePedidoNavMeta';
import { useModulosRestaurante } from '../hooks/useModulosRestaurante';
import { usePermisosMesero } from '../hooks/usePermisosMesero';
import { useMesasVirtuales } from '../hooks/useMesasVirtuales';
import { useResponsive } from '../hooks/useResponsive';
import { useVisualTheme } from '../context/VisualThemeContext';
import {
  appNavZoneFromPath,
  isAdminRoutePath,
  isMesasHomePath,
  isMesaDetailPath,
  isPedidoFacturaPath,
  isPedidoMenuPath,
} from '../lib/app-nav-zones';
import { BOTTOM_NAV_BAR_HEIGHT, SIDEBAR_NAV_WIDTH } from '../lib/layout-constants';
import { type AppColors } from '../lib/theme';
import { blurWebFocus } from '../lib/web-a11y';
import {
  navBarChromeStyle,
  navItemChromeStyle,
  navItemIconColor,
  navItemLabelStyle,
} from '../lib/visual-chrome';
import { AppNavMoreSheet } from './AppNavMoreSheet';
import { AppNavChrome } from './AppNavChrome';

type IonName = ComponentProps<typeof Ionicons>['name'];

type NavItemDef = {
  key: string;
  label: string;
  icon: IonName;
  href?: string;
  action?: 'more';
  badge?: number;
  active: boolean;
};

type Props = {
  variant: 'bottom' | 'sidebar';
  style?: StyleProp<ViewStyle>;
};

function NavItemButton({
  item,
  variant,
  compactLabel,
  onPress,
  themeColors,
  chrome,
  layout,
}: {
  item: NavItemDef;
  variant: 'bottom' | 'sidebar';
  compactLabel: boolean;
  onPress: () => void;
  themeColors: AppColors;
  chrome: ReturnType<typeof useVisualTheme>['chrome'];
  layout: ReturnType<typeof useVisualTheme>['layout'];
}) {
  const active = item.active;
  const accent = navItemIconColor(chrome, themeColors, active);
  const itemChrome = navItemChromeStyle(chrome, layout, themeColors, active, variant);
  const labelChrome = navItemLabelStyle(chrome, themeColors, active, layout);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        variant === 'bottom' ? styles.bottomItem : styles.sidebarItem,
        itemChrome,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={item.label}
    >
      <View style={styles.iconWrap}>
        <Ionicons
          name={item.icon}
          size={variant === 'sidebar' ? 28 : 22}
          color={accent}
        />
        {item.badge != null && item.badge > 0 ? (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: themeColors.danger,
                borderColor: themeColors.surface,
              },
            ]}
          >
            <Text style={[styles.badgeText, { color: themeColors.onPrimary }]}>
              {item.badge > 99 ? '99+' : item.badge}
            </Text>
          </View>
        ) : null}
      </View>
      {!compactLabel || variant === 'bottom' ? (
        <Text
          style={[
            variant === 'bottom' ? styles.bottomLabel : styles.sidebarLabel,
            labelChrome,
          ]}
          numberOfLines={1}
        >
          {item.label}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function AppNavBar({ variant, style }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const nav = useAppNavLayout();
  const caps = useNavCapabilities();
  const { badges, mostradorActivo, paraLlevarActivo } = useAppNavBadges();
  const { permisos: permMesero } = usePermisosMesero();
  const modulos = useModulosRestaurante();
  const mv = useMesasVirtuales();
  const { idMesa, mesaNumero } = usePedidoNavMeta(nav.pedidoId);
  const { isCompact } = useResponsive();
  const { colors: themeColors, navIcon, chrome, layout } = useVisualTheme();
  const [moreOpen, setMoreOpen] = useState(false);
  const ni = navIcon;

  const zone = appNavZoneFromPath(pathname);
  const chefSolo = caps.esChef && !caps.esAdmin;

  const items = useMemo((): NavItemDef[] => {
    if (zone === 'pedido' && nav.pedidoId) {
      const pid = nav.pedidoId;
      const listadoMesasHref =
        mesaNumero != null && mv.esMostrador(mesaNumero)
          ? '/(app)/mostrador'
          : mesaNumero != null && mv.esParaLlevar(mesaNumero)
            ? '/(app)/para-llevar'
            : '/(app)/mesas';
      const listadoMesasLabel =
        mesaNumero != null && mv.esMostrador(mesaNumero)
          ? mv.resueltas.etiqueta_mostrador
          : mesaNumero != null && mv.esParaLlevar(mesaNumero)
            ? mv.resueltas.etiqueta_para_llevar
            : 'Mesas';
      return [
        {
          key: 'mesas',
          label: listadoMesasLabel,
          icon: ni('mesas'),
          href: listadoMesasHref,
          active: false,
        },
        {
          key: 'mesa',
          label: 'Mesa',
          icon: ni('mesa'),
          href: idMesa != null ? `/(app)/mesa/${idMesa}` : listadoMesasHref,
          active: false,
        },
        {
          key: 'menu',
          label: 'Menú',
          icon: ni('menu'),
          href: `/(app)/pedido/${pid}/menu`,
          active: isPedidoMenuPath(pathname),
        },
        {
          key: 'cobrar',
          label: 'Cobrar',
          icon: ni('cobrar'),
          href: `/(app)/pedido/${pid}/factura`,
          active: isPedidoFacturaPath(pathname),
        },
      ];
    }

    const list: NavItemDef[] = [];

    if (!chefSolo) {
      list.push({
        key: 'mesas',
        label: 'Mesas',
        icon: ni('mesas'),
        href: '/(app)/mesas',
        active: isMesasHomePath(pathname) || isMesaDetailPath(pathname),
      });
    }

    if (caps.veMisPedidos) {
      list.push({
        key: 'pedidos',
        label: 'Pedidos',
        icon: ni('pedidos'),
        href: '/(app)/mis-pedidos',
        badge: badges.misPedidos,
        active: pathname.includes('/mis-pedidos'),
      });
    }

    if (caps.tomaPedidos && mostradorActivo && (!caps.esAdmin || variant === 'sidebar')) {
      list.push({
        key: 'mostrador',
        label: 'Mostrador',
        icon: ni('mostrador'),
        href: '/(app)/mostrador',
        badge: badges.mostrador,
        active: pathname.includes('/mostrador'),
      });
    }

    if (caps.tomaPedidos && paraLlevarActivo && (!caps.esAdmin || variant === 'sidebar')) {
      list.push({
        key: 'para-llevar',
        label: 'Para llevar',
        icon: ni('para_llevar'),
        href: '/(app)/para-llevar',
        badge: badges.paraLlevar,
        active: pathname.includes('/para-llevar'),
      });
    }

    if (caps.veMisPedidos && permMesero.ayuda_companeros && (!caps.esAdmin || variant === 'sidebar')) {
      list.push({
        key: 'ayuda',
        label: 'Ayuda',
        icon: ni('ayuda'),
        href: '/(app)/ayuda-companeros',
        badge: badges.ayudaCompaneros,
        active: pathname.includes('/ayuda-companeros'),
      });
    }

    if (caps.veCocina) {
      list.push({
        key: 'cocina',
        label: 'Cocina',
        icon: ni('cocina'),
        href: '/(app)/cocina',
        active: pathname.includes('/cocina'),
      });
    }

    if (caps.esAdmin && modulos.modulo_resumen_diario_activo) {
      list.push({
        key: 'caja',
        label: 'Caja',
        icon: ni('caja'),
        href: '/(app)/resumen-diario',
        badge: badges.resumenDiario,
        active: pathname.includes('/resumen-diario'),
      });
    }
    if (caps.esAdmin) {
      list.push({
        key: 'mas',
        label: 'Más',
        icon: ni('mas'),
        action: 'more',
        active:
          isAdminRoutePath(pathname) &&
          !pathname.includes('/resumen-diario') &&
          !pathname.includes('/mostrador') &&
          !pathname.includes('/para-llevar') &&
          !pathname.includes('/ayuda-companeros'),
      });
    } else if (caps.tomaPedidos || chefSolo) {
      list.push({
        key: 'mas',
        label: 'Cuenta',
        icon: ni('cuenta'),
        action: 'more',
        active: false,
      });
    }

    return list;
  }, [
    zone,
    nav.pedidoId,
    pathname,
    idMesa,
    mesaNumero,
    mv,
    caps,
    badges,
    mostradorActivo,
    paraLlevarActivo,
    permMesero.ayuda_companeros,
    modulos.modulo_resumen_diario_activo,
    variant,
    ni,
    chefSolo,
  ]);

  if (!nav.visible || items.length < 2) {
    return null;
  }

  function onItemPress(item: NavItemDef) {
    blurWebFocus();
    if (item.action === 'more') {
      setMoreOpen(true);
      return;
    }
    if (item.href) {
      router.replace(item.href);
    }
  }

  const barStyle = [
    variant === 'bottom' ? styles.bottomBar : styles.sidebarBar,
    navBarChromeStyle(chrome, layout, themeColors, variant),
    variant === 'bottom' &&
      chrome.navBar !== 'floating' && {
        paddingBottom: Math.max(insets.bottom, 4),
        height: BOTTOM_NAV_BAR_HEIGHT + Math.max(insets.bottom, 4),
      },
    variant === 'bottom' &&
      chrome.navBar === 'floating' && {
        paddingBottom: Math.max(insets.bottom, 8),
        marginBottom: Math.max(insets.bottom, 0),
      },
    variant === 'sidebar' && { width: SIDEBAR_NAV_WIDTH },
    style,
  ];

  const barInner = items.map((item) => (
    <NavItemButton
      key={item.key}
      item={item}
      variant={variant}
      compactLabel={variant === 'sidebar' && isCompact}
      themeColors={themeColors}
      chrome={chrome}
      layout={layout}
      onPress={() => onItemPress(item)}
    />
  ));

  const bar = (
    <AppNavChrome style={barStyle}>{barInner}</AppNavChrome>
  );

  return (
    <>
      {bar}
      {caps.esAdmin || caps.tomaPedidos || chefSolo ? (
        <AppNavMoreSheet
          visible={moreOpen}
          onClose={() => setMoreOpen(false)}
          mode={caps.esAdmin ? 'admin' : 'mesero'}
          modulos={modulos}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-around',
    paddingTop: 6,
  },
  sidebarBar: {
    width: SIDEBAR_NAV_WIDTH,
    paddingVertical: 16,
    paddingHorizontal: 10,
    gap: 6,
    alignItems: 'center',
  },
  bottomItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 56,
    maxWidth: 120,
  },
  sidebarItem: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 16,
    gap: 6,
    minHeight: 72,
  },
  pressed: { opacity: 0.88 },
  iconWrap: { position: 'relative' },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  bottomLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  sidebarLabel: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 15,
  },
});
