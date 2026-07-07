import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ActionIconBar } from '../../src/components/ActionIconBar';
import { FormModal } from '../../src/components/FormModal';
import { IconTooltipButton } from '../../src/components/IconTooltipButton';
import { ScreenLoading } from '../../src/components/ScreenLoading';
import { ScreenScroll } from '../../src/components/ScreenScroll';
import { useAuth } from '../../src/context/AuthContext';
import { useResponsive } from '../../src/hooks/useResponsive';
import { api } from '../../src/lib/api';
import { AdminIcon } from '../../src/lib/app-icons';
import { confirmAppDialog, showNotice } from '../../src/lib/app-dialog';
import { manejarErrorAccion, manejarErrorOperacion } from '../../src/lib/recurso-disponible';
import {
  avisarSiFaltanObligatorios,
} from '../../src/lib/form-validation';
import { emailMeseroDesdeNombre } from '../../src/lib/email-mesero';
import { nombreUsuarioDisplay } from '../../src/lib/nombre-usuario-display';
import { useVisualTheme } from '../../src/context/VisualThemeContext';
import { useThemedStyles } from '../../src/hooks/useThemedStyles';
import { useFormStyles } from '../../src/lib/form-layout';
import type { AppColors } from '../../src/lib/theme';

type UsuarioRow = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  activo: boolean;
};

function rolLabel(rol: string) {
  if (rol === 'mesero') return 'Mesero';
  if (rol === 'chef') return 'Cocina';
  if (rol === 'admin') return 'Administrador';
  return rol;
}

async function confirmSiNo(title: string, message: string): Promise<boolean> {
  return confirmAppDialog(title, message);
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    pad: { paddingTop: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: c.background },
    denied: { textAlign: 'center', color: c.textMuted, marginBottom: 16, fontSize: 16 },
    intro: { color: c.textMuted, fontSize: 13, marginBottom: 12, lineHeight: 18 },
    card: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
    },
    sectionTitle: { fontWeight: '800', color: c.text, marginBottom: 8 },
    emailPreview: {
      color: c.primary,
      fontSize: 13,
      fontWeight: '700',
      marginBottom: 10,
      marginTop: -4,
      textAlign: 'center',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.borderLight,
    },
    rowMain: { flex: 1, paddingRight: 8 },
    rowName: { fontWeight: '700', color: c.text },
    rowEmail: { color: c.textMuted, marginTop: 2, fontSize: 13 },
    rowMeta: { color: c.textMuted, marginTop: 4, fontSize: 12 },
  });
}

export default function UsuariosAdminScreen() {
  const { token, user } = useAuth();
  const { colors } = useVisualTheme();
  const styles = useThemedStyles(createStyles);
  const formStyles = useFormStyles();
  const router = useRouter();
  const r = useResponsive();
  const [rows, setRows] = useState<UsuarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(false);

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [password, setPassword] = useState('');

  const load = useCallback(async () => {
    const data = await api<UsuarioRow[]>('/usuarios', {
      token,
      cacheKey: 'usuarios',
    });
    setRows(data);
  }, [token]);

  useEffect(() => {
    if (!user) {
      return;
    }
    if (user.rol !== 'admin') {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        await load();
      } catch (e) {
        await manejarErrorOperacion(e, {
          title: 'Usuarios',
          message: 'No se pudo cargar la lista de usuarios.',
        });
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [load, user]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } catch (e) {
      await manejarErrorOperacion(e, {
        title: 'Usuarios',
        message: 'No se pudo actualizar la lista.',
      });
    } finally {
      setRefreshing(false);
    }
  }

  function openNew() {
    setNombre('');
    setApellido('');
    setPassword('');
    setModal(true);
  }

  function closeModal() {
    if (saving) return;
    setModal(false);
  }

  async function onCrearMesero() {
    if (
      await avisarSiFaltanObligatorios(
        [
          { etiqueta: 'Nombre', valor: nombre },
          { etiqueta: 'Apellido', valor: apellido },
          { etiqueta: 'Contraseña', valor: password },
        ],
        showNotice,
      )
    ) {
      return;
    }
    const n = nombre.trim();
    const a = apellido.trim();
    const p = password;
    if (p.length < 6) {
      await showNotice('Contraseña', 'Mínimo 6 caracteres.', 'warning');
      return;
    }
    setSaving(true);
    try {
      const creado = await api<{ email: string }>('/usuarios/meseros', {
        method: 'POST',
        token,
        body: JSON.stringify({
          nombre: n,
          apellido: a,
          password: p,
        }),
      });
      setNombre('');
      setApellido('');
      setPassword('');
      setModal(false);
      await load();
      await showNotice(
        'Listo',
        `Mesero creado. Inicia sesión con ${creado.email} y la contraseña definida.`,
        'success',
      );
    } catch (err) {
      await manejarErrorAccion(err, 'crear el mesero');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActivo(u: UsuarioRow) {
    if (u.rol === 'admin') return;
    const next = !u.activo;
    const ok = await confirmSiNo(
      next ? 'Activar usuario' : 'Desactivar usuario',
      `${nombreUsuarioDisplay(u)} (${u.email})`,
    );
    if (!ok) return;
    try {
      await api(`/usuarios/${u.id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ activo: next }),
      });
      await load();
    } catch (err) {
      await manejarErrorOperacion(err, {
        title: 'No se pudo actualizar',
        message: 'Revisa si el usuario tiene pedidos activos.',
      });
    }
  }

  if (user && user.rol !== 'admin') {
    return (
      <View style={styles.center}>
        <Text style={styles.denied}>Solo el administrador puede gestionar usuarios.</Text>
        <ActionIconBar
          actions={[
            {
              key: 'mesas',
              icon: AdminIcon.volverMesas,
              label: 'Volver a mesas',
              variant: 'primary',
              onPress: () => router.replace('/(app)/mesas'),
            },
          ]}
        />
      </View>
    );
  }

  if (loading || !user) {
    return <ScreenLoading />;
  }

  return (
    <>
      <ScreenScroll
        contentPadding={r.contentPadding}
        contentContainerStyle={styles.pad}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={[styles.intro, formStyles.adminIntro]}>
          Acceso del equipo. Los meseros nuevos reciben correo automático.
        </Text>
        <ActionIconBar
          style={formStyles.screenActions}
          actions={[
            {
              key: 'crear',
              icon: AdminIcon.crearMesero,
              label: 'Nuevo mesero',
              variant: 'primary',
              onPress: openNew,
            },
          ]}
        />

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Equipo</Text>
          {rows.map((u) => (
            <View key={u.id} style={styles.row}>
              <View style={styles.rowMain}>
                <Text style={styles.rowName}>{nombreUsuarioDisplay(u)}</Text>
                <Text style={styles.rowEmail}>{u.email}</Text>
                <Text style={styles.rowMeta}>
                  {rolLabel(u.rol)} · {u.activo ? 'activo' : 'inactivo'}
                </Text>
              </View>
              {u.rol !== 'admin' && (
                <IconTooltipButton
                  icon={u.activo ? AdminIcon.desactivar : AdminIcon.activar}
                  label={u.activo ? 'Desactivar' : 'Activar'}
                  variant={u.activo ? 'danger' : 'secondary'}
                  fixedSize
                  onPress={() => toggleActivo(u)}
                />
              )}
            </View>
          ))}
        </View>
      </ScreenScroll>

      <FormModal visible={modal} title="Nuevo mesero" onClose={closeModal}>
        <Text style={formStyles.help}>
          El correo de acceso se crea solo a partir del nombre (ej. Juan →
          juan@lareserva.local). Solo define la contraseña.
        </Text>
        <Text style={formStyles.label}>Nombre</Text>
        <TextInput
          style={formStyles.input}
          placeholder="Nombre"
          placeholderTextColor={colors.textHint}
          value={nombre}
          onChangeText={setNombre}
          autoCapitalize="words"
        />
        {nombre.trim() ? (
          <Text style={styles.emailPreview}>
            Correo: {emailMeseroDesdeNombre(nombre)}
          </Text>
        ) : null}
        <Text style={formStyles.label}>Apellido</Text>
        <TextInput
          style={formStyles.input}
          placeholder="Apellido"
          placeholderTextColor={colors.textHint}
          value={apellido}
          onChangeText={setApellido}
          autoCapitalize="words"
        />
        <Text style={formStyles.label}>Contraseña</Text>
        <TextInput
          style={formStyles.input}
          placeholder="Mín. 6 caracteres"
          placeholderTextColor={colors.textHint}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <ActionIconBar
          style={formStyles.modalActionBar}
          actions={[
            {
              key: 'cancel',
              icon: AdminIcon.cancelar,
              label: 'Cancelar',
              variant: 'secondary',
              disabled: saving,
              onPress: closeModal,
            },
            {
              key: 'crear',
              icon: saving ? 'hourglass-outline' : AdminIcon.confirmar,
              label: saving ? 'Guardando…' : 'Crear mesero',
              variant: 'primary',
              disabled: saving,
              onPress: onCrearMesero,
            },
          ]}
        />
      </FormModal>
    </>
  );
}
