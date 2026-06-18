import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ActionIconBar } from '../../src/components/ActionIconBar';
import { useAuth } from '../../src/context/AuthContext';
import { useFormShell } from '../../src/hooks/useFormShell';
import { AdminIcon } from '../../src/lib/app-icons';
import { API_URL } from '../../src/lib/config';
import { showNotice } from '../../src/lib/app-dialog';
import {
  avisarSiFaltanObligatorios,
} from '../../src/lib/form-validation';
import { appShadow } from '../../src/lib/shadow';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const formShell = useFormShell('centered');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [checkingApi, setCheckingApi] = useState(false);

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
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo iniciar sesión');
    } finally {
      setBusy(false);
    }
  }

  async function onCheckApi() {
    setCheckingApi(true);
    const healthUrl = `${API_URL.replace(/\/$/, '')}/health`;
    try {
      const res = await fetch(healthUrl, { method: 'GET' });
      const body = await res.text();
      if (!res.ok) {
        Alert.alert(
          'API responde con error',
          `URL: ${healthUrl}\nHTTP ${res.status}\n${body || res.statusText}`,
        );
        return;
      }
      Alert.alert('API OK', `URL: ${healthUrl}\nRespuesta: ${body}`);
    } catch (e) {
      Alert.alert(
        'Sin conexión al API',
        `URL: ${healthUrl}\n${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setCheckingApi(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.card, formShell]}>
        <Text style={styles.badge}>STAFF</Text>
        <Text style={styles.title}>La Reserva</Text>
        <Text style={styles.sub}>Sistema interno del restaurante</Text>
        <TextInput
          style={styles.input}
          placeholder="Correo"
          placeholderTextColor="#9a988f"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#9a988f"
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
        {__DEV__ ? (
          <ActionIconBar
            actions={[
              {
                key: 'api',
                icon: checkingApi ? 'hourglass-outline' : AdminIcon.probarApi,
                label: checkingApi ? 'Probando API…' : 'Probar conexión API',
                variant: 'secondary',
                disabled: checkingApi,
                onPress: onCheckApi,
              },
            ]}
          />
        ) : null}
        {__DEV__ ? (
          <Text style={styles.devApiHint} selectable>
            API: {API_URL}
          </Text>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f6f4ee',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e2d8',
    ...appShadow('login'),
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#eef4f1',
    color: '#2f5e4f',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 6,
    color: '#262622',
  },
  sub: { fontSize: 15, color: '#6f6e67', marginBottom: 22 },
  input: {
    borderWidth: 1,
    borderColor: '#d9d5ca',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  devApiHint: {
    marginTop: 14,
    fontSize: 11,
    color: '#9a988f',
  },
});
