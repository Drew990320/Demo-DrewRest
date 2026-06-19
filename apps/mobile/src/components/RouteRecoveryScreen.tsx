import { colors } from '../lib/theme';
import { Stack, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { ActionIconBar } from './ActionIconBar';
import { AdminIcon } from '../lib/app-icons';
import { appShadow } from '../lib/shadow';

type Props = {
  title?: string;
  message?: string;
  buttonLabel?: string;
  onPress?: () => void;
};

/** Pantalla de recuperación cuando falla una carga o la ruta quedó inválida. */
export function RouteRecoveryScreen({
  title = 'No se pudo abrir',
  message = 'El recurso no existe o ya no está disponible.',
  buttonLabel = 'Volver a mesas',
  onPress,
}: Props) {
  const router = useRouter();

  function volver() {
    if (onPress) {
      onPress();
      return;
    }
    router.replace('/(app)/mesas');
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Error', headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.sub}>{message}</Text>
          <ActionIconBar
            actions={[
              {
                key: 'back',
                icon: AdminIcon.volverMesas,
                label: buttonLabel,
                variant: 'primary',
                onPress: volver,
              },
            ]}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...appShadow('soft'),
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8 },
  sub: { fontSize: 15, color: colors.textMuted, lineHeight: 22, marginBottom: 18 },
});
