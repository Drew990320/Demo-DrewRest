import { Pressable, StyleSheet, Text } from 'react-native';
import { status } from '../lib/theme';

export type StatusAlertVariant = 'recoger' | 'cocina' | 'ayuda' | 'cobro';

type Props = {
  variant: StatusAlertVariant;
  title: string;
  message: string;
  onPress?: () => void;
};

const PALETTE = {
  recoger: status.ok,
  cocina: status.warn,
  ayuda: status.info,
  cobro: status.busy,
} as const;

export function StatusAlertBanner({ variant, title, message, onPress }: Props) {
  const p = PALETTE[variant];
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
    borderLeftWidth: 3,
    padding: 14,
    marginBottom: 12,
  },
  title: {
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.9,
  },
});
