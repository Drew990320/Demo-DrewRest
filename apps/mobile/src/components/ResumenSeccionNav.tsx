import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../hooks/useThemedStyles';
import type { AppColors } from '../lib/theme';

export type ResumenSeccionId =
  | 'ingresos'
  | 'platos'
  | 'items'
  | 'impresion'
  | 'detalle';

export type ResumenSeccionTab = {
  id: ResumenSeccionId;
  label: string;
  summary?: string;
};

type Props = {
  tabs: ResumenSeccionTab[];
  active: ResumenSeccionId;
  onChange: (id: ResumenSeccionId) => void;
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      marginBottom: 12,
    },
    row: {
      flexDirection: 'row',
      gap: 8,
      paddingVertical: 2,
    },
    tab: {
      minWidth: 108,
      maxWidth: 168,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surfaceMuted,
    },
    tabActive: {
      borderColor: c.primary,
      backgroundColor: c.backgroundAlt,
    },
    tabLabel: {
      fontWeight: '700',
      fontSize: 13,
      color: c.textMuted,
    },
    tabLabelActive: {
      color: c.primary,
    },
    tabSummary: {
      marginTop: 3,
      fontSize: 11,
      color: c.textMuted,
      lineHeight: 14,
    },
    tabSummaryActive: {
      color: c.text,
    },
  });
}

/** Pestañas del resumen diario: una vista activa a la vez. */
export function ResumenSeccionNav({ tabs, active, onChange }: Props) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {tabs.map((tab) => {
          const on = tab.id === active;
          return (
            <Pressable
              key={tab.id}
              style={[styles.tab, on && styles.tabActive]}
              onPress={() => onChange(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={tab.summary ? `${tab.label}. ${tab.summary}` : tab.label}
            >
              <Text style={[styles.tabLabel, on && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {tab.summary ? (
                <Text
                  style={[styles.tabSummary, on && styles.tabSummaryActive]}
                  numberOfLines={1}
                >
                  {tab.summary}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
