import { useMemo } from 'react';
import { Stack } from 'expo-router';
import { HeaderHomeTitle } from '../../../../src/components/HeaderHomeTitle';
import { NotificationHeaderButton } from '../../../../src/components/NotificationHeaderButton';
import { PantallaSoloMeseros } from '../../../../src/components/PantallaSoloMeseros';
import { useVisualTheme } from '../../../../src/context/VisualThemeContext';
import { useRequiereTomarPedidos } from '../../../../src/hooks/usePuedeTomarPedidos';
import { MOTION } from '../../../../src/lib/motion';

export default function PedidoLayout() {
  const { ok, loading } = useRequiereTomarPedidos();
  const { colors } = useVisualTheme();

  const screenOptions = useMemo(
    () => ({
      headerStyle: { backgroundColor: colors.backgroundAlt },
      headerTintColor: colors.text,
      headerTitleAlign: 'center' as const,
      animation: 'slide_from_right' as const,
      animationDuration: MOTION.normal,
      headerTitle: (props: { children?: string }) => (
        <HeaderHomeTitle>{String(props.children ?? '')}</HeaderHomeTitle>
      ),
      headerRight: () => <NotificationHeaderButton />,
      headerShadowVisible: false,
    }),
    [colors],
  );

  if (!loading && !ok) {
    return <PantallaSoloMeseros />;
  }

  return (
    <Stack screenOptions={screenOptions}>
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
