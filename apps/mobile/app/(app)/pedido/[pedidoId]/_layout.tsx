import { Stack } from 'expo-router';
import { HeaderHomeTitle } from '../../../../src/components/HeaderHomeTitle';
import { NotificationHeaderButton } from '../../../../src/components/NotificationHeaderButton';
import { PantallaSoloMeseros } from '../../../../src/components/PantallaSoloMeseros';
import { useRequiereTomarPedidos } from '../../../../src/hooks/usePuedeTomarPedidos';
import { MOTION } from '../../../../src/lib/motion';
import { colors } from '../../../../src/lib/theme';

export default function PedidoLayout() {
  const { ok, loading } = useRequiereTomarPedidos();

  if (!loading && !ok) {
    return <PantallaSoloMeseros />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.backgroundAlt },
        headerTintColor: colors.text,
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
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="menu" options={{ title: 'Menú' }} />
      <Stack.Screen name="factura" options={{ title: 'Cobrar' }} />
      <Stack.Screen
        name="producto/[productoId]"
        options={{ title: 'Producto' }}
      />
    </Stack>
  );
}
