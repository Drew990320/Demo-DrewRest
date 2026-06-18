import { Ionicons } from '@expo/vector-icons';
import { Redirect, Stack } from 'expo-router';
import { useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';
import { MOTION } from '../../src/lib/motion';
import { useAuth } from '../../src/context/AuthContext';
import { useNetwork } from '../../src/context/NetworkContext';
import { useImpresoraAlertas } from '../../src/hooks/useImpresoraAlertas';
import { useBlurFocusOnRouteChange } from '../../src/hooks/useBlurFocusOnRouteChange';
import { useResponsive } from '../../src/hooks/useResponsive';
import { API_URL } from '../../src/lib/config';
import { NotificationProvider } from '../../src/context/NotificationCenterContext';
import { NotificationFab } from '../../src/components/NotificationFab';

function HeaderHomeTitle({ children }: { children?: string }) {
  const router = useRouter();
  const title = (children ?? '').trim();

  return (
    <View style={styles.headerTitleWrap}>
      <AnimatedPressable
        onPress={() => router.replace('/(app)/mesas')}
        style={styles.homePill}
        accessibilityRole="button"
        accessibilityLabel="Ir al inicio (mesas)"
      >
        <Ionicons name="home" size={20} color="#fff" />
      </AnimatedPressable>
      {!!title && title !== 'Mesas' && (
        <Text numberOfLines={1} style={styles.headerSubTitle}>
          {title}
        </Text>
      )}
    </View>
  );
}

export default function AppGroupLayout() {
  const { token, loading } = useAuth();
  const { online } = useNetwork();
  const { contentMaxWidth, isWeb } = useResponsive();
  useImpresoraAlertas();
  useBlurFocusOnRouteChange();

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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f0ede4' }} edges={['top']}>
      <View
        style={[
          styles.appFrame,
          isWeb && contentMaxWidth != null && styles.appFrameWide,
        ]}
      >
        {!online && (
          <Animated.View
            entering={FadeInDown.duration(MOTION.normal).springify()}
            exiting={FadeOutUp.duration(MOTION.fast)}
            style={styles.offlineBanner}
          >
            <Text style={styles.offlineText}>
              No se puede contactar el servidor en este PC ({API_URL.replace(/^https?:\/\//, '')}).
              Comprueba que inicio.bat siga abierto y que el celular use la misma Wi‑Fi.
            </Text>
          </Animated.View>
        )}
        <View
          style={[
            styles.appInner,
            contentMaxWidth != null && { maxWidth: contentMaxWidth },
          ]}
        >
          <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#f0ede4' },
        headerTintColor: '#262622',
        headerTitleStyle: { fontWeight: '700' },
        headerTitleAlign: 'center',
        animation: 'slide_from_right',
        animationDuration: MOTION.normal,
        headerTitle: (props) => (
          <HeaderHomeTitle>{String(props.children ?? '')}</HeaderHomeTitle>
        ),
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
          </Stack>
        </View>
        <NotificationFab />
      </View>
    </SafeAreaView>
    </NotificationProvider>
  );
}

const styles = StyleSheet.create({
  appFrame: { flex: 1, width: '100%' },
  appFrameWide: { alignItems: 'center' },
  appInner: { flex: 1, width: '100%' },
  offlineBanner: {
    backgroundColor: '#5c4033',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  offlineText: { color: '#f6f4ee', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitleWrap: { alignItems: 'center', justifyContent: 'center' },
  homePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#2f5e4f',
  },
  headerSubTitle: { marginTop: 4, color: '#6f6e67', fontWeight: '700', fontSize: 12 },
});
