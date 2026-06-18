import { Stack } from 'expo-router';
import { PantallaSoloMeseros } from '../../../../src/components/PantallaSoloMeseros';
import { useRequiereTomarPedidos } from '../../../../src/hooks/usePuedeTomarPedidos';

export default function PedidoLayout() {
  const { ok, loading } = useRequiereTomarPedidos();

  if (!loading && !ok) {
    return <PantallaSoloMeseros />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="menu" />
      <Stack.Screen name="factura" />
      <Stack.Screen name="producto/[productoId]" />
    </Stack>
  );
}
