import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useMemo, useState } from 'react';
import {
  Platform,
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
import { usePermisosMesero } from '../hooks/usePermisosMesero';
import { useResponsive } from '../hooks/useResponsive';
import { NavIcon, PedidoIcon } from '../lib/app-icons';
import {
  appNavZoneFromPath,
  isAdminRoutePath,
  isMesasHomePath,
  isMesaDetailPath,
  isPedidoFacturaPath,
  isPedidoMenuPath,
} from '../lib/app-nav-zones';
import { BOTTOM_NAV_BAR_HEIGHT, SIDEBAR_NAV_WIDTH } from '../lib/layout-constants';
import { blurWebFocus } from '../lib/web-a11y';
import { colors } from '../lib/theme';
import { AppNavMoreSheet } from './AppNavMoreSheet';

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
}: {
  item: NavItemDef;
  variant: 'bottom' | 'sidebar';
  compactLabel: boolean;
  onPress: () => void;
}) {
  const active = item.active;
  const accent = active ? colors.primary : colors.textMuted;
  const bg = active ? colors.primaryLight : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        variant === 'bottom' ? styles.bottomItem : styles.sidebarItem,
        { backgroundColor: bg },
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
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {item.badge > 99 ? '99+' : item.badge}
            </Text>
          </View>
        ) : null}
      </View>
      {!compactLabel || variant === 'bottom' ? (
        <Text
          style={[
            variant === 'bottom' ? styles.bottomLabel : styles.sidebarLabel,
            { color: active ? colors.primaryDark : colors.textMuted },
            active && styles.labelActive,
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
  const { idMesa } = usePedidoNavMeta(nav.pedidoId);
  const { isCompact } = useResponsive();
  const [moreOpen, setMoreOpen] = useState(false);

  const zone = appNavZoneFromPath(pathname);

  const items = useMemo((): NavItemDef[] => {
    if (zone === 'pedido' && nav.pedidoId) {
      const pid = nav.pedidoId;
      return [
        {
          key: 'mesa',
          label: 'Mesa',
          icon: 'restaurant-outline',
          href: idMesa != null ? `/(app)/mesa/${idMesa}` : '/(app)/mesas',
          active: false,
        },
        {
          key: 'menu',
          label: 'Menú',
          icon: PedidoIcon.agregarMenu,
          href: `/(app)/pedido/${pid}/menu`,
          active: isPedidoMenuPath(pathname),
        },
        {
          key: 'cobrar',
          label: 'Cobrar',
          icon: PedidoIcon.cobrar,
          href: `/(app)/pedido/${pid}/factura`,
          active: isPedidoFacturaPath(pathname),
        },
      ];
    }

    const list: NavItemDef[] = [
      {
        key: 'mesas',
        label: 'Mesas',
        icon: 'grid-outline',
        href: '/(app)/mesas',
        active: isMesasHomePath(pathname) || isMesaDetailPath(pathname),
      },
    ];

    if (caps.veMisPedidos) {
      list.push({
        key: 'pedidos',
        label: 'Pedidos',
        icon: NavIcon.misPedidos,
        href: '/(app)/mis-pedidos',
        badge: badges.misPedidos,
        active: pathname.includes('/mis-pedidos'),
      });
    }

    if (caps.tomaPedidos && mostradorActivo && (!caps.esAdmin || variant === 'sidebar')) {
      list.push({
        key: 'mostrador',
        label: 'Mostrador',
        icon: NavIcon.mostrador,
        href: '/(app)/mostrador',
        badge: badges.mostrador,
        active: pathname.includes('/mostrador'),
      });
    }

    if (caps.tomaPedidos && paraLlevarActivo && (!caps.esAdmin || variant === 'sidebar')) {
      list.push({
        key: 'para-llevar',
        label: 'Para llevar',
        icon: NavIcon.paraLlevar,
        href: '/(app)/para-llevar',
        badge: badges.paraLlevar,
        active: pathname.includes('/para-llevar'),
      });
    }

    if (caps.veMisPedidos && permMesero.ayuda_companeros && (!caps.esAdmin || variant === 'sidebar')) {
      list.push({
        key: 'ayuda',
        label: 'Ayuda',
        icon: NavIcon.ayudaCompaneros,
        href: '/(app)/ayuda-companeros',
        badge: badges.ayudaCompaneros,
        active: pathname.includes('/ayuda-companeros'),
      });
    }

    if (caps.veCocina) {
      list.push({
        key: 'cocina',
        label: 'Cocina',
        icon: NavIcon.cocina,
        href: '/(app)/cocina',
        active: pathname.includes('/cocina'),
      });
    }

    if (caps.esAdmin) {
      list.push({
        key: 'caja',
        label: 'Caja',
        icon: NavIcon.resumenDiario,
        href: '/(app)/resumen-diario',
        badge: badges.resumenDiario,
        active: pathname.includes('/resumen-diario'),
      });
      list.push({
        key: 'mas',
        label: 'Más',
        icon: 'ellipsis-horizontal',
        action: 'more',
        active:
          isAdminRoutePath(pathname) &&
          !pathname.includes('/resumen-diario') &&
          !pathname.includes('/mostrador') &&
          !pathname.includes('/para-llevar') &&
          !pathname.includes('/ayuda-companeros'),
      });
    } else if (caps.tomaPedidos) {
      list.push({
        key: 'mas',
        label: 'Cuenta',
        icon: NavIcon.cerrarSesion,
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
    caps,
    badges,
    mostradorActivo,
    paraLlevarActivo,
    permMesero.ayuda_companeros,
    variant,
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

  const bar = (
    <View
      style={[
        variant === 'bottom' ? styles.bottomBar : styles.sidebarBar,
        variant === 'bottom' && {
          paddingBottom: Math.max(insets.bottom, 4),
          height: BOTTOM_NAV_BAR_HEIGHT + Math.max(insets.bottom, 4),
        },
        variant === 'sidebar' && { width: SIDEBAR_NAV_WIDTH },
        style,
      ]}
    >
      {items.map((item) => (
        <NavItemButton
          key={item.key}
          item={item}
          variant={variant}
          compactLabel={variant === 'sidebar' && isCompact}
          onPress={() => onItemPress(item)}
        />
      ))}
    </View>
  );

  return (
    <>
      {bar}
      {caps.esAdmin || caps.tomaPedidos ? (
        <AppNavMoreSheet
          visible={moreOpen}
          onClose={() => setMoreOpen(false)}
          mode={caps.esAdmin ? 'admin' : 'mesero'}
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
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 6,
    ...Platform.select({
      web: { boxShadow: '0 -2px 12px rgba(61,54,48,0.08)' } as object,
      default: {},
    }),
  },
  sidebarBar: {
    width: SIDEBAR_NAV_WIDTH,
    backgroundColor: colors.surface,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
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
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.onPrimary,
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
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15,
  },
  labelActive: { fontWeight: '800' },
});
