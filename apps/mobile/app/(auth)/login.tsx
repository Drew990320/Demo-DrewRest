import { useState } from 'react';
import {
  Image,
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
import { useAuth } from '../../src/context/AuthContext';
import { useFormShell } from '../../src/hooks/useFormShell';
import { useResponsive } from '../../src/hooks/useResponsive';
import { AdminIcon } from '../../src/lib/app-icons';
import { showNotice } from '../../src/lib/app-dialog';
import {
  avisarSiFaltanObligatorios,
} from '../../src/lib/form-validation';
import { manejarErrorOperacion } from '../../src/lib/recurso-disponible';
import { colors } from '../../src/lib/theme';

const logo = require('../../assets/logo.png');

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const formShell = useFormShell('centered');
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
        <View style={styles.logoWrap}>
          <Image
            source={logo}
            style={isCompact ? styles.logoCompact : styles.logo}
            resizeMode="contain"
            accessibilityLabel="La Reserva"
          />
        </View>
        <Text style={styles.badge}>STAFF</Text>
        <Text style={styles.sub}>Sistema interno del restaurante</Text>
        <TextInput
          style={styles.input}
          placeholder="Correo"
          placeholderTextColor={colors.textHint}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 16,
    backgroundColor: colors.background,
  },
  logo: {
    width: 280,
    height: 200,
  },
  logoCompact: {
    width: 220,
    height: 150,
  },
  badge: {
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  sub: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: 22,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.text,
  },
});
