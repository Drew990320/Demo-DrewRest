import 'react-native-reanimated';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { DialogProvider } from '../src/context/DialogProvider';
import { NetworkProvider } from '../src/context/NetworkContext';
import { RouteRecoveryScreen } from '../src/components/RouteRecoveryScreen';

export function ErrorBoundary({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  const router = useRouter();

  return (
    <RouteRecoveryScreen
      title="No se pudo abrir esta pantalla"
      message={error.message || 'Ocurrió un error inesperado.'}
      buttonLabel="Volver a mesas"
      onPress={() => {
        retry();
        router.replace('/(app)/mesas');
      }}
    />
  );
}

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <NetworkProvider>
        <AuthProvider>
          <DialogProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(app)" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="+not-found" />
            </Stack>
          </DialogProvider>
        </AuthProvider>
      </NetworkProvider>
    </SafeAreaProvider>
  );
}
