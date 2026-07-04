import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RESUMEN_TOOLS_RAIL_WIDTH } from '../lib/layout-constants';
import { colors } from '../lib/theme';
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

function RailSection({
  title,
  actions,
}: {
  title: string;
  actions: ActionIconItem[];
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

  return (
    <View
      style={[
        styles.rail,
        { paddingTop: Math.max(insets.top, 8), paddingBottom: Math.max(insets.bottom, 12) },
      ]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <RailSection title="Pedido" actions={pedidoActions} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: RESUMEN_TOOLS_RAIL_WIDTH,
    flexShrink: 0,
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
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
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  actionsCol: {
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 6,
    alignSelf: 'stretch',
  },
  hint: {
    fontSize: 10,
    lineHeight: 14,
    color: colors.textMuted,
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 2,
  },
});
