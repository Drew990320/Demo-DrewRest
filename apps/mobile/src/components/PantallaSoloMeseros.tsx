import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { ActionIconBar } from './ActionIconBar';
import { AccionIcon } from '../lib/app-icons';

export function PantallaSoloMeseros({
  mensaje = 'Esta pantalla es solo para tomar pedidos (mesero o administrador).',
}: {
  mensaje?: string;
}) {
  const router = useRouter();
  return (
    <View style={styles.center}>
      <Text style={styles.denied}>{mensaje}</Text>
      <ActionIconBar
        actions={[
          {
            key: 'cocina',
            icon: AccionIcon.irCocina,
            label: 'Ir a cocina',
            variant: 'primary',
            onPress: () => router.replace('/(app)/cocina'),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f6f4ee',
  },
  denied: { textAlign: 'center', color: '#6f6e67', marginBottom: 16, fontSize: 16 },
});
