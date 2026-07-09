import 'react-native-reanimated';
import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MotionProvider } from '../src/context/MotionContext';
import { AuthProvider } from '../src/context/AuthContext';
import { VisualThemeProvider } from '../src/context/VisualThemeContext';
import { DialogProvider } from '../src/context/DialogProvider';
import { TicketPreviewProvider } from '../src/components/TicketPreviewModal';
import { NetworkProvider } from '../src/context/NetworkContext';
import { RouteRecoveryScreen } from '../src/components/RouteRecoveryScreen';
import { ThemedStatusBar } from '../src/components/ThemedStatusBar';
import { tituloErrorApi, mensajeErrorUsuario, esErrorRed } from '../src/lib/api-error';
import { manejarErrorOperacion } from '../src/lib/recurso-disponible';

export function ErrorBoundary({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  const router = useRouter();
  const titulo = esErrorRed(error)
    ? 'Sin conexión al servidor'
    : tituloErrorApi(error, 'No se pudo abrir esta pantalla');

  return (
    <RouteRecoveryScreen
      title={titulo}
      message={mensajeErrorUsuario(error, 'Ocurrió un error inesperado. Vuelve al inicio e intenta de nuevo.')}
      buttonLabel="Volver a mesas"
      configureStack={false}
      onPress={() => {
        retry();
        router.replace('/(app)/mesas');
      }}
    />
  );
}

function GlobalApiErrorHandler() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onRejection = (ev: PromiseRejectionEvent) => {
      const reason = ev.reason;
      if (reason == null) return;
      ev.preventDefault();
      void manejarErrorOperacion(reason);
    };
    window.addEventListener('unhandledrejection', onRejection);
    return () => window.removeEventListener('unhandledrejection', onRejection);
  }, []);
  return null;
}

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <MotionProvider>
      <NetworkProvider>
        <VisualThemeProvider>
        <AuthProvider>
          <DialogProvider>
            <TicketPreviewProvider>
            <GlobalApiErrorHandler />
            <ThemedStatusBar />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(app)" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="+not-found" />
            </Stack>
            </TicketPreviewProvider>
          </DialogProvider>
        </AuthProvider>
        </VisualThemeProvider>
      </NetworkProvider>
      </MotionProvider>
    </SafeAreaProvider>
  );
}
