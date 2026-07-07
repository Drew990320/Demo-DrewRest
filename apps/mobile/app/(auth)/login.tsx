import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ActionIconBar } from '../../src/components/ActionIconBar';
import { RestaurantLogo } from '../../src/components/RestaurantLogo';
import { useAuth } from '../../src/context/AuthContext';
import { useVisualTheme } from '../../src/context/VisualThemeContext';
import { useFormShell } from '../../src/hooks/useFormShell';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useThemedStyles } from '../../src/hooks/useThemedStyles';
import { AdminIcon } from '../../src/lib/app-icons';
import { showNotice } from '../../src/lib/app-dialog';
import { avisarSiFaltanObligatorios } from '../../src/lib/form-validation';
import { useFormStyles } from '../../src/lib/form-layout';
import { manejarErrorOperacion } from '../../src/lib/recurso-disponible';
import type { AppColors } from '../../src/lib/theme';

function createLoginStyles(c: AppColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    badge: {
      alignSelf: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: c.primaryLight,
      color: c.primary,
      fontSize: 12,
      fontWeight: '700',
      marginBottom: 6,
    },
    sub: {
      fontSize: 15,
      color: c.textMuted,
      marginBottom: 22,
      textAlign: 'center',
    },
  });
}

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const formShell = useFormShell('centered');
  const formStyles = useFormStyles();
  const styles = useThemedStyles(createLoginStyles);
  const { colors } = useVisualTheme();
  const { isCompact } = useResponsive();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    if (
      await avisarSiFaltanObligatorios(
        [
          { etiqueta: 'Correo', valor: email },
          { etiqueta: 'Contraseña', valor: password },
        ],
        showNotice,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await login(email.trim(), password);
      router.replace('/(app)/mesas');
    } catch (e) {
      await manejarErrorOperacion(e, {
        title: 'No se pudo iniciar sesión',
        message: 'Revisa tu correo y contraseña e intenta de nuevo.',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={[styles.card, formShell]}>
          <RestaurantLogo compact={isCompact} variant="login" />
          <Text style={styles.badge}>STAFF</Text>
          <Text style={styles.sub}>
            Sistema interno del restaurante elaborado por DrewTech POS
          </Text>
          <TextInput
            style={formStyles.input}
            placeholder="Correo"
            placeholderTextColor={colors.textHint}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={formStyles.input}
            placeholder="Contraseña"
            placeholderTextColor={colors.textHint}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <ActionIconBar
            actions={[
              {
                key: 'login',
                icon: busy ? 'hourglass-outline' : AdminIcon.entrar,
                label: busy ? 'Entrando…' : 'Entrar',
                variant: 'primary',
                disabled: busy,
                onPress: onSubmit,
              },
            ]}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
