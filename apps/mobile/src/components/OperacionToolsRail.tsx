import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVisualTheme } from '../context/VisualThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { RESUMEN_TOOLS_RAIL_WIDTH } from '../lib/layout-constants';
import type { AppColors } from '../lib/theme';
import { AppNavChrome } from './AppNavChrome';
import { IconTooltipButton } from './IconTooltipButton';
import type { ActionIconItem } from './ActionIconBar';

export type OperacionToolsRailModel = {
  sectionTitle: string;
  actions: ActionIconItem[];
  hint?: string;
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
  });
}

/** Barra derecha de acciones globales (cocina, mis pedidos, ayuda, etc.). */
export function OperacionToolsRail({
  sectionTitle,
  actions,
  hint,
}: OperacionToolsRailModel) {
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{sectionTitle}</Text>
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
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </ScrollView>
    </AppNavChrome>
  );
}
