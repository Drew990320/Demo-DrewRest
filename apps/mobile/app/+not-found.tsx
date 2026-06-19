import { colors } from '../src/lib/theme';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ActionIconBar } from '../src/components/ActionIconBar';
import { useAuth } from '../src/context/AuthContext';
import { AdminIcon } from '../src/lib/app-icons';
import { appShadow } from '../src/lib/shadow';

/** Ruta segura tras un 404 (mesas si hay sesión, login si no). */
function rutaRecuperacion(token: string | null): string {
  return token ? '/(app)/mesas' : '/(auth)/login';
}

export default function NotFoundScreen() {
  const router = useRouter();
  const { token, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const destino = rutaRecuperacion(token);
    const t = setTimeout(() => {
      router.replace(destino);
    }, 12000);
    return () => clearTimeout(t);
  }, [loading, token, router]);

  function volver() {
    router.replace(rutaRecuperacion(token));
  }

  return (
    <>
      <Stack.Screen options={{ title: 'No encontrada', headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.kicker}>404</Text>
          <Text style={styles.title}>Pantalla no encontrada</Text>
          <Text style={styles.sub}>
            El enlace puede estar desactualizado o la página ya no existe. Puedes
            volver al inicio sin borrar la URL del navegador.
          </Text>
          <ActionIconBar
            actions={[
              {
                key: 'home',
                icon: token ? AdminIcon.volverMesas : AdminIcon.entrar,
                label: token ? 'Ir a mesas' : 'Ir al inicio de sesión',
                variant: 'primary',
                onPress: volver,
              },
            ]}
          />
          <Text style={styles.hint}>
            Si no haces nada, te redirigimos automáticamente en unos segundos.
          </Text>
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
    ...appShadow('elevated'),
  },
  kicker: { color: colors.danger, fontWeight: '800', letterSpacing: 1 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginTop: 8,
    marginBottom: 10,
  },
  sub: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: 18,
  },
  hint: {
    marginTop: 14,
    fontSize: 12,
    color: colors.textHint,
    textAlign: 'center',
  },
});
