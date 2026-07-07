import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVisualTheme } from '../context/VisualThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { RESUMEN_TOOLS_RAIL_WIDTH } from '../lib/layout-constants';
import type { AppColors } from '../lib/theme';
import { AppNavChrome } from './AppNavChrome';
import { IconTooltipButton } from './IconTooltipButton';
import type { ActionIconItem } from './ActionIconBar';
import {
  TransferirPedidoPanel,
  type TransferirPedidoPanelProps,
} from './TransferirPedidoPanel';

export type PedidoToolsRailModel = {
  pedidoActions: ActionIconItem[];
  pedidoHint?: string;
  transfer?: Omit<TransferirPedidoPanelProps, 'presentation'> | null;
};

function createRailStyles(c: AppColors) {
  return StyleSheet.create({
    rail: {
      width: RESUMEN_TOOLS_RAIL_WIDTH,
      flexShrink: 0,
      alignSelf: 'stretch',
      borderLeftWidth: StyleSheet.hairlineWidth,
      ...Platform.select({
        web: { boxShadow: '-2px 0 12px rgba(61,54,48,0.06)' } as object,
        default: {},
      }),
    },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: 10,
      paddingBottom: 16,
      gap: 6,
    },
    section: {
      alignItems: 'center',
      gap: 8,
      paddingVertical: 6,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      textAlign: 'center',
    },
    actionsCol: {
      alignItems: 'center',
      gap: 8,
      width: '100%',
    },
    hint: {
      fontSize: 11,
      lineHeight: 15,
      color: c.textMuted,
      textAlign: 'center',
      paddingHorizontal: 4,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border,
      marginVertical: 8,
      alignSelf: 'stretch',
    },
  });
}

function RailSection({
  title,
  actions,
  styles,
}: {
  title: string;
  actions: ActionIconItem[];
  styles: ReturnType<typeof createRailStyles>;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.actionsCol}>
        {actions.map((a) => (
          <IconTooltipButton
            key={a.key}
            icon={a.icon}
            label={a.label}
            onPress={a.onPress}
            disabled={a.disabled}
            variant={a.variant}
            badge={a.badge}
            fixedSize
            size={26}
          />
        ))}
      </View>
    </View>
  );
}

/** Herramientas fijas del pedido activo (tablet+), espejo de la barra del resumen diario. */
export function PedidoToolsRail({
  pedidoActions,
  pedidoHint,
  transfer,
}: PedidoToolsRailModel) {
  const insets = useSafeAreaInsets();
  const { colors: themeColors } = useVisualTheme();
  const styles = useThemedStyles(createRailStyles);

  return (
    <AppNavChrome
      style={[
        styles.rail,
        {
          paddingTop: Math.max(insets.top, 8),
          paddingBottom: Math.max(insets.bottom, 12),
          borderLeftColor: themeColors.border,
        },
      ]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <RailSection title="Pedido" actions={pedidoActions} styles={styles} />
        {pedidoHint ? <Text style={styles.hint}>{pedidoHint}</Text> : null}
        {transfer ? (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Transferir</Text>
              <TransferirPedidoPanel {...transfer} presentation="rail" />
            </View>
          </>
        ) : null}
      </ScrollView>
    </AppNavChrome>
  );
}
