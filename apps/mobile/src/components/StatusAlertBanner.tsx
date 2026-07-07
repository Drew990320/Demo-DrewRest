import { Pressable, StyleSheet, Text } from 'react-native';
import { useVisualTheme } from '../context/VisualThemeContext';
import { statusFromAppColors } from '../lib/visual-theme';

export type StatusAlertVariant = 'recoger' | 'cocina' | 'ayuda' | 'cobro';

type Props = {
  variant: StatusAlertVariant;
  title: string;
  message: string;
  onPress?: () => void;
};

export function StatusAlertBanner({ variant, title, message, onPress }: Props) {
  const { colors } = useVisualTheme();
  const palette = statusFromAppColors(colors);
  const p =
    variant === 'recoger'
      ? palette.ok
      : variant === 'cocina'
        ? palette.warn
        : variant === 'ayuda'
          ? palette.info
          : palette.busy;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.banner,
        { backgroundColor: p.bg, borderColor: p.border },
      ]}
    >
      <Text style={[styles.title, { color: p.fg }]}>{title}</Text>
      <Text style={[styles.message, { color: p.fg }]}>{message}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    marginBottom: 12,
  },
  title: {
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
});
