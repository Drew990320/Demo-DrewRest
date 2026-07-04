import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { useAppNavLayout } from '../hooks/useAppNavLayout';
import { colors } from '../lib/theme';

type Props = {
  children?: string;
};

/** Título de header; atajo «Inicio» solo cuando la barra contextual no basta (p. ej. admin). */
export function HeaderHomeTitle({ children }: Props) {
  const router = useRouter();
  const nav = useAppNavLayout();
  const title = (children ?? '').trim();
  const showHomeShortcut = !nav.visible;

  if (!showHomeShortcut) {
    return title ? (
      <Text numberOfLines={1} style={styles.titleOnly}>
        {title}
      </Text>
    ) : null;
  }

  return (
    <View style={styles.wrap}>
      <AnimatedPressable
        onPress={() => router.replace('/(app)/mesas')}
        style={styles.homePill}
        accessibilityRole="button"
        accessibilityLabel="Ir al inicio (mesas)"
      >
        <Ionicons name="home" size={20} color={colors.onPrimary} />
      </AnimatedPressable>
      {!!title && title !== 'Mesas' ? (
        <Text numberOfLines={1} style={styles.subTitle}>
          {title}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  titleOnly: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 17,
    maxWidth: 280,
  },
  homePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  subTitle: { marginTop: 4, color: colors.textMuted, fontWeight: '700', fontSize: 12 },
});
