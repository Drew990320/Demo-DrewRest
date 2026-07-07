import type { ReactNode } from 'react';
import { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useVisualTheme } from '../context/VisualThemeContext';
import { useScreenStyles } from '../lib/screen-styles';

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
  const screenStyles = useScreenStyles();
  const { colors } = useVisualTheme();
  const textStyles = useMemo(
    () => ({
      eyebrow: { ...styles.eyebrow, color: colors.textMuted },
      title: { ...styles.title, color: colors.text },
      subtitle: { ...styles.subtitle, color: colors.textMuted },
    }),
    [colors],
  );

  return (
    <View
      style={[
        variant === 'card' ? screenStyles.headerCard : styles.plainWrap,
        style,
      ]}
    >
      {eyebrow ? (
        <Text style={[textStyles.eyebrow, { textAlign: align }]}>{eyebrow}</Text>
      ) : null}
      <Text style={[textStyles.title, { textAlign: align }, titleStyle]}>{title}</Text>
      {subtitle ? (
        <Text style={[textStyles.subtitle, { textAlign: align }]}>{subtitle}</Text>
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
    fontWeight: '600',
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});
