import { useEffect } from 'react';
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeaderHomeTitle } from '../../src/components/HeaderHomeTitle';
import { MOTION } from '../../src/lib/motion';
import { useAuth } from '../../src/context/AuthContext';
import { useNetwork } from '../../src/context/NetworkContext';
import { useAuthSessionGuard } from '../../src/hooks/useAuthSessionGuard';
import { useImpresoraAlertas } from '../../src/hooks/useImpresoraAlertas';
import { usePedidoNotificaciones } from '../../src/hooks/usePedidoNotificaciones';
import { useBlurFocusOnRouteChange } from '../../src/hooks/useBlurFocusOnRouteChange';
import { useResponsive } from '../../src/hooks/useResponsive';
import { MENSAJE_SIN_CONEXION } from '../../src/lib/api-error';
import { ResumenDiarioToolsRailProvider } from '../../src/context/ResumenDiarioToolsRailContext';
import { NotificationProvider } from '../../src/context/NotificationCenterContext';
import { AppNavFabLayer, AppNavShell } from '../../src/components/AppNavShell';
import { NotificationHeaderButton } from '../../src/components/NotificationHeaderButton';
import { LlamarMeseroFab } from '../../src/components/LlamarMeseroFab';
import { colors } from '../../src/lib/theme';
import { warmMenuTodayCache } from '../../src/lib/menu-prefetch';
import { preloadCategoriaMenuIcons } from '../../src/lib/categoria-menu-icon-font';

function PedidoNotificacionesListener() {
  usePedidoNotificaciones();
  return null;
}

export default function AppGroupLayout() {
  const { token, loading } = useAuth();
  const { online } = useNetwork();
  const { isWeb } = useResponsive();
  useImpresoraAlertas();
  useAuthSessionGuard();
  useBlurFocusOnRouteChange();

  useEffect(() => {
    void preloadCategoriaMenuIcons();
    if (!token) return;
    void warmMenuTodayCache(token);
  }, [token]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <NotificationProvider>
    <ResumenDiarioToolsRailProvider>
    <PedidoNotificacionesListener />
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.backgroundAlt }} edges={['top']}>
      <View style={[styles.appFrame, isWeb && styles.appFrameWide]}>
        {!online && (
          <Animated.View
            entering={FadeInDown.duration(MOTION.normal).springify()}
            exiting={FadeOutUp.duration(MOTION.fast)}
            style={styles.offlineBanner}
          >
            <Text style={styles.offlineText}>
              {MENSAJE_SIN_CONEXION}
            </Text>
          </Animated.View>
        )}
        <AppNavShell
          footer={
            <AppNavFabLayer>
              <LlamarMeseroFab />
            </AppNavFabLayer>
          }
        >
          <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.backgroundAlt },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        headerTitleAlign: 'center',
        animation: 'slide_from_right',
        animationDuration: MOTION.normal,
        headerTitle: (props) => (
          <HeaderHomeTitle>{String(props.children ?? '')}</HeaderHomeTitle>
        ),
        headerRight: () => <NotificationHeaderButton />,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="mesas/index" options={{ title: 'Mesas' }} />
      <Stack.Screen
        name="mostrador"
        options={{ title: 'Mostrador' }}
      />
      <Stack.Screen
        name="para-llevar"
        options={{ title: 'Pedidos para llevar' }}
      />
      <Stack.Screen
        name="resumen-diario"
        options={{ title: 'Resumen diario' }}
      />
      <Stack.Screen
        name="mesa/[mesaId]"
        options={{ title: 'Mesa' }}
      />
      <Stack.Screen
        name="pedido/[pedidoId]"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="cocina" options={{ title: 'Cocina' }} />
      <Stack.Screen name="mis-pedidos" options={{ title: 'Mis pedidos' }} />
      <Stack.Screen
        name="ayuda-companeros"
        options={{ title: 'Ayudar a compañeros' }}
      />
      <Stack.Screen name="usuarios" options={{ title: 'Usuarios' }} />
      <Stack.Screen name="menu-admin" options={{ title: 'Menú (admin)' }} />
      <Stack.Screen
        name="categorias-admin"
        options={{ title: 'Categorías (admin)' }}
      />
      <Stack.Screen name="mesas-admin" options={{ title: 'Mesas (admin)' }} />
      <Stack.Screen
        name="configuracion"
        options={{ title: 'Configuración' }}
      />
      <Stack.Screen
        name="conexion-movil"
        options={{ title: 'Conexión móvil' }}
      />
      <Stack.Screen
        name="permisos"
        options={{ title: 'Permisos meseros' }}
      />
      <Stack.Screen
        name="meseros-operativos"
        options={{ title: 'Meseros (turno)' }}
      />
          </Stack>
        </AppNavShell>
      </View>
    </SafeAreaView>
    </ResumenDiarioToolsRailProvider>
    </NotificationProvider>
  );
}

const styles = StyleSheet.create({
  appFrame: { flex: 1, width: '100%' },
  appFrameWide: { alignItems: 'stretch' },
  offlineBanner: {
    backgroundColor: colors.offline,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  offlineText: { color: colors.onDark, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
