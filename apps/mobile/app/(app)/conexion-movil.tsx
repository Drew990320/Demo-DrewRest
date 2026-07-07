import { ScreenScroll } from '../../src/components/ScreenScroll';
import { ConexionCelularesCard } from '../../src/components/ConexionCelularesCard';
import { useAuth } from '../../src/context/AuthContext';
import { useVisualTheme } from '../../src/context/VisualThemeContext';
import { useThemedStyles } from '../../src/hooks/useThemedStyles';
import { useResponsive } from '../../src/hooks/useResponsive';
import { Redirect } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import type { AppColors } from '../../src/lib/theme';

function createStyles(c: AppColors) {
  return StyleSheet.create({
    intro: {
      color: c.textMuted,
      lineHeight: 22,
      marginBottom: 16,
    },
  });
}

export default function ConexionMovilScreen() {
  const { user } = useAuth();
  const r = useResponsive();
  const styles = useThemedStyles(createStyles);

  if (user?.rol !== 'admin') {
    return <Redirect href="/(app)/mesas" />;
  }

  return (
    <ScreenScroll contentPadding={r.contentPadding}>
      <Text style={[styles.intro, { fontSize: r.fontSize.body }]}>
        Muestra el código QR o comparte la dirección para que los meseros abran La
        Reserva en el navegador del celular. En el restaurante usan la misma red Wi‑Fi
        del servidor; en la demo en la nube el QR apunta a la app pública para simular
        ese flujo.
      </Text>
      <ConexionCelularesCard variant="page" />
    </ScreenScroll>
  );
}
