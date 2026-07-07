import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  VISUAL_STYLE_IDS,
  presetEstiloVisual,
  type VisualStyleId,
} from '@la-reserva/shared-domain/visual-style';
import { useVisualTheme } from '../context/VisualThemeContext';
import type { AppColors } from '../lib/theme';
import {
  iconButtonChromeStyle,
  iconButtonRadius,
  navBarChromeStyle,
  navItemChromeStyle,
  navItemIconColor,
} from '../lib/visual-chrome';

type Props = {
  value: VisualStyleId;
  disabled?: boolean;
  onSelect: (id: VisualStyleId) => void;
};

function StyleChromeMockup({
  id,
  themeColors,
}: {
  id: VisualStyleId;
  themeColors: AppColors;
}) {
  const preset = presetEstiloVisual(id);
  const { chrome, layout } = preset;
  const barStyle = navBarChromeStyle(chrome, layout, themeColors, 'bottom');
  const items = [
    { active: true, icon: 'grid-outline' as const },
    { active: false, icon: 'list-outline' as const },
    { active: false, icon: 'bonfire-outline' as const },
  ];
  const btnSize = 34;
  const btnRadius = iconButtonRadius(chrome, layout, btnSize);

  return (
    <View style={styles.mockWrap}>
      <View style={[styles.mockBar, barStyle]}>
        {items.map((item, i) => (
          <View
            key={i}
            style={[
              styles.mockNavItem,
              navItemChromeStyle(chrome, layout, themeColors, item.active, 'bottom'),
            ]}
          >
            <Ionicons
              name={item.icon}
              size={16}
              color={navItemIconColor(chrome, themeColors, item.active)}
            />
          </View>
        ))}
      </View>
      <View style={styles.mockActions}>
        <View
          style={[
            styles.mockIconBtn,
            {
              width: btnSize,
              height: btnSize,
              borderRadius: btnRadius,
            },
            iconButtonChromeStyle(chrome, layout, themeColors, 'default'),
          ]}
        >
          <Ionicons name="save-outline" size={16} color={themeColors.text} />
        </View>
        <View
          style={[
            styles.mockIconBtn,
            {
              width: btnSize,
              height: btnSize,
              borderRadius: btnRadius,
            },
            iconButtonChromeStyle(chrome, layout, themeColors, 'primary'),
          ]}
        >
          <Ionicons name="checkmark-outline" size={16} color={themeColors.onPrimary} />
        </View>
      </View>
    </View>
  );
}

export function VisualStylePresetPanel({ value, disabled, onSelect }: Props) {
  const { colors } = useVisualTheme();

  return (
    <View style={styles.grid}>
      {VISUAL_STYLE_IDS.map((id) => {
        const preset = presetEstiloVisual(id);
        const active = value === id;
        return (
          <Pressable
            key={id}
            disabled={disabled}
            onPress={() => onSelect(id)}
            style={({ pressed }) => [
              styles.card,
              {
                borderColor: active ? colors.primary : colors.border,
                backgroundColor: active ? colors.backgroundAlt : colors.surface,
                borderWidth: active ? 2 : StyleSheet.hairlineWidth,
                opacity: disabled ? 0.55 : pressed ? 0.92 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <StyleChromeMockup id={id} themeColors={colors} />
            <Text
              style={[
                styles.title,
                {
                  color: active ? colors.primaryDark : colors.text,
                  fontWeight: preset.layout.titleWeight,
                },
              ]}
            >
              {preset.nombre}
            </Text>
            <Text style={[styles.desc, { color: colors.textMuted }]} numberOfLines={3}>
              {preset.descripcion}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: 168,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  mockWrap: { gap: 8, marginBottom: 2 },
  mockBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    minHeight: 40,
  },
  mockNavItem: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
  },
  mockActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  mockIconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    letterSpacing: -0.2,
  },
  desc: {
    fontSize: 12,
    lineHeight: 16,
  },
});
