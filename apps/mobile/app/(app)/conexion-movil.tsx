import { ScreenScroll } from '../../src/components/ScreenScroll';
import { ConexionCelularesCard } from '../../src/components/ConexionCelularesCard';
import { useAuth } from '../../src/context/AuthContext';
import { colors } from '../../src/lib/theme';
import { useResponsive } from '../../src/hooks/useResponsive';
import { Redirect } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

export default function ConexionMovilScreen() {
  const { user } = useAuth();
  const r = useResponsive();

  if (user?.rol !== 'admin') {
    return <Redirect href="/(app)/mesas" />;
  }

  return (
    <ScreenScroll contentPadding={r.contentPadding}>
      <Text style={[styles.intro, { fontSize: r.fontSize.body }]}>
        Muestra el código QR o comparte la dirección para que los meseros abran La
        Reserva en el navegador del celular (misma red Wi‑Fi del restaurante).
      </Text>
      <ConexionCelularesCard variant="page" />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  intro: {
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: 16,
  },
});
