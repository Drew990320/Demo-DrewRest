import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useVisualTheme } from '../context/VisualThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import { actionBarChromeStyle } from '../lib/visual-chrome';
import { IconTooltipButton, type IconTooltipVariant } from './IconTooltipButton';

type IonName = ComponentProps<typeof Ionicons>['name'];

export type ActionIconItem = {
  key: string;
  icon: IonName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: IconTooltipVariant;
  badge?: number | string;
};

type Props = {
  actions: ActionIconItem[];
  style?: StyleProp<ViewStyle>;
  /** Fondo de la franja (p. ej. vista previa en personalización). */
  backgroundColor?: string;
};

/** Fila horizontal de botones solo icono con tooltip al pasar el cursor (web). */
export function ActionIconBar({ actions, style, backgroundColor }: Props) {
  const { isCompact, gridGap } = useResponsive();
  const { colors, chrome, layout } = useVisualTheme();
  const barBg = backgroundColor ?? colors.backgroundAlt;
  const barChrome = actionBarChromeStyle(chrome, layout, colors, barBg);

  return (
    <View
      style={[
        styles.row,
        {
          gap: isCompact ? 8 : gridGap,
          ...barChrome,
        },
        style,
      ]}
    >
      {actions.map((a) => (
        <IconTooltipButton
          key={a.key}
          icon={a.icon}
          label={a.label}
          onPress={a.onPress}
          disabled={a.disabled}
          variant={a.variant}
          badge={a.badge}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    ...Platform.select({
      web: { overflow: 'visible' } as object,
      default: {},
    }),
  },
});
