import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { useAppNavLayout } from '../hooks/useAppNavLayout';
import { useVisualTheme } from '../context/VisualThemeContext';

type Props = {
  children?: string;
};

/** Título de header; atajo «Inicio» solo cuando la barra contextual no basta (p. ej. admin). */
export function HeaderHomeTitle({ children }: Props) {
  const router = useRouter();
  const nav = useAppNavLayout();
  const { colors } = useVisualTheme();
  const title = (children ?? '').trim();
  const showHomeShortcut = !nav.visible;

  const themed = useMemo(
    () => ({
      titleOnly: { ...styles.titleOnly, color: colors.text },
      homePill: { ...styles.homePill, backgroundColor: colors.primary },
      subTitle: { ...styles.subTitle, color: colors.textMuted },
    }),
    [colors],
  );

  if (!showHomeShortcut) {
    return title ? (
      <Text numberOfLines={1} style={themed.titleOnly}>
        {title}
      </Text>
    ) : null;
  }

  return (
    <View style={styles.wrap}>
      <AnimatedPressable
        onPress={() => router.replace('/(app)/mesas')}
        style={themed.homePill}
        accessibilityRole="button"
        accessibilityLabel="Ir al inicio (mesas)"
      >
        <Ionicons name="home" size={20} color={colors.onPrimary} />
      </AnimatedPressable>
      {!!title && title !== 'Mesas' ? (
        <Text numberOfLines={1} style={themed.subTitle}>
          {title}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  titleOnly: {
    fontWeight: '700',
    fontSize: 17,
    maxWidth: 280,
  },
  homePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  subTitle: { marginTop: 4, fontWeight: '700', fontSize: 12 },
});
