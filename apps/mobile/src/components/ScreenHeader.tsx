import type { ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { screenStyles } from '../lib/screen-styles';
import { colors } from '../lib/theme';

type Props = {
  title: string;
  subtitle?: string;
  /** Etiqueta pequeña encima del título (antes «kicker»). */
  eyebrow?: string;
  /** `card`: tarjeta con borde; `plain`: solo tipografía. */
  variant?: 'card' | 'plain';
  align?: 'left' | 'center';
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  children?: ReactNode;
};

/** Encabezado minimalista reutilizable en pantallas con scroll. */
export function ScreenHeader({
  title,
  subtitle,
  eyebrow,
  variant = 'card',
  align = 'left',
  style,
  titleStyle,
  children,
}: Props) {
  return (
    <View
      style={[
        variant === 'card' ? screenStyles.headerCard : styles.plainWrap,
        style,
      ]}
    >
      {eyebrow ? (
        <Text style={[styles.eyebrow, { textAlign: align }]}>{eyebrow}</Text>
      ) : null}
      <Text style={[styles.title, { textAlign: align }, titleStyle]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { textAlign: align }]}>{subtitle}</Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  plainWrap: {
    marginBottom: 12,
  },
  eyebrow: {
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
