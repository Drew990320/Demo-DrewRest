import { colors } from '../lib/theme';
import { screenStyles } from '../lib/screen-styles';
import { Stack, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { ActionIconBar } from './ActionIconBar';
import { AdminIcon } from '../lib/app-icons';

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
      <Stack.Screen options={{ title: 'Aviso', headerShown: false }} />
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
  container: screenStyles.center,
  card: {
    ...screenStyles.card,
    width: '100%',
    maxWidth: 400,
    padding: 20,
    marginBottom: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  sub: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: 16,
    textAlign: 'center',
  },
});
