import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'react-native-calendars';
import { useRouter } from 'expo-router';
import { ActionIconBar } from '../../src/components/ActionIconBar';
import { ScreenLoading } from '../../src/components/ScreenLoading';
import { ScreenScroll } from '../../src/components/ScreenScroll';
import { useAuth } from '../../src/context/AuthContext';
import { useVisualTheme } from '../../src/context/VisualThemeContext';
import { useThemedStyles } from '../../src/hooks/useThemedStyles';
import { useFormStyles } from '../../src/lib/form-layout';
import type { AppColors } from '../../src/lib/theme';
import { AdminIcon } from '../../src/lib/app-icons';
import { api } from '../../src/lib/api';
import { confirmAppDialog, showNotice } from '../../src/lib/app-dialog';
import { fechaCalendarioBogota } from '../../src/lib/fecha-bogota';
import { manejarErrorAccion, manejarErrorOperacion } from '../../src/lib/recurso-disponible';
import { invalidarCachePermisosMesero } from '../../src/hooks/usePermisosMesero';
import {
  PERMISOS_MESERO_KEYS,
  PERMISOS_MESERO_META,
  type PermisoMeseroKey,
  type PermisosMeseroConfig,
} from '@la-reserva/shared-domain/permisos-mesero';
import {
  PERMISOS_CHEF_KEYS,
  PERMISOS_CHEF_META,
  type PermisoChefKey,
  type PermisosChefConfig,
} from '@la-reserva/shared-domain/permisos-chef';

type MeseroFila = {
  id_usuario: number;
  nombre: string;
  apellido: string;
};

type ResumenPermisos = {
  fecha: string;
  permisos_mesero: PermisosMeseroConfig;
  permisos_chef: PermisosChefConfig;
  delegacion_cierre_anulacion: {
    id_usuario: number;
    nombre: string;
    apellido: string;
    asignado_en: string;
  } | null;
  meseros: MeseroFila[];
};

function nombreCompleto(m: MeseroFila): string {
  return [m.nombre, m.apellido].filter(Boolean).join(' ').trim() || 'Mesero';
}

function parseFechaInput(iso: string): Date {
  const [y, mo, d] = iso.split('-').map(Number);
  return new Date(y, (mo ?? 1) - 1, d ?? 1);
}

export default function PermisosAdminScreen() {
  const { colors } = useVisualTheme();
  const styles = useThemedStyles(createStyles);
  const formStyles = useFormStyles();
  const { token, user } = useAuth();
  const router = useRouter();
  const [fecha, setFecha] = useState(() => fechaCalendarioBogota(new Date()));
  const [data, setData] = useState<ResumenPermisos | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [showCalendario, setShowCalendario] = useState(false);
  const [showPickerNativo, setShowPickerNativo] = useState(false);

  const load = useCallback(async () => {
    const res = await api<ResumenPermisos>(`/permisos/resumen?fecha=${fecha}`, {
      token,
    });
    setData(res);
  }, [fecha, token]);

  useEffect(() => {
    if (!user || user.rol !== 'admin') {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        await load();
      } catch (e) {
        await manejarErrorOperacion(e, {
          title: 'Permisos',
          message: 'No se pudo cargar la configuración.',
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [load, user]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  async function togglePermiso(key: PermisoMeseroKey, next: boolean) {
    setBusyKey(key);
    try {
      await api('/permisos/mesero', {
        method: 'PATCH',
        token,
        body: JSON.stringify({ [key]: next }),
      });
      invalidarCachePermisosMesero();
      await load();
    } catch (e) {
      await manejarErrorOperacion(e, {
        title: 'Permisos',
        message: 'No se pudo guardar el cambio.',
      });
    } finally {
      setBusyKey(null);
    }
  }

  async function togglePermisoChef(key: PermisoChefKey, next: boolean) {
    setBusyKey(`chef:${key}`);
    try {
      await api('/permisos/chef', {
        method: 'PATCH',
        token,
        body: JSON.stringify({ [key]: next }),
      });
      await load();
    } catch (e) {
      await manejarErrorOperacion(e, {
        title: 'Permisos chef',
        message: 'No se pudo guardar el cambio.',
      });
    } finally {
      setBusyKey(null);
    }
  }

  async function asignarDelegacion(idUsuario: number | null) {
    const mesero =
      idUsuario != null
        ? data?.meseros.find((m) => m.id_usuario === idUsuario)
        : null;
    const nombre =
      idUsuario == null
        ? ''
        : mesero
          ? nombreCompleto(mesero)
          : 'este mesero';
    const accion =
      idUsuario == null
        ? '¿Quitar el permiso de cierre con anulación para este día?'
        : data?.delegacion_cierre_anulacion &&
            data.delegacion_cierre_anulacion.id_usuario !== idUsuario
          ? `¿Designar a ${nombre} y quitar el permiso al mesero anterior?`
          : `¿Designar a ${nombre} para cerrar mesas anulando lo pendiente?`;
    const ok = await confirmAppDialog('Permiso de cierre', accion);
    if (!ok) return;
    setBusyKey('delegacion');
    try {
      await api('/permisos/delegacion/cierre-anulacion', {
        method: 'PUT',
        token,
        body: JSON.stringify({ fecha, id_usuario: idUsuario }),
      });
      invalidarCachePermisosMesero();
      await load();
      await showNotice(
        idUsuario == null ? 'Permiso revocado' : 'Mesero designado',
        idUsuario == null
          ? 'Solo el administrador podrá cerrar mesa con anulación este día.'
          : 'Solo ese mesero (y el admin) podrán usar esta acción ese día.',
        'success',
      );
    } catch (e) {
      await manejarErrorAccion(e, 'actualizar la delegación');
    } finally {
      setBusyKey(null);
    }
  }

  const markedDates = useMemo(
    () => ({
      [fecha]: { selected: true, selectedColor: colors.primary },
    }),
    [fecha],
  );

  if (user && user.rol !== 'admin') {
    return (
      <View style={styles.deniedWrap}>
        <Text style={styles.denied}>
          Solo el administrador puede configurar permisos de meseros.
        </Text>
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

  if (loading || !data) {
    return <ScreenLoading />;
  }

  return (
    <ScreenScroll
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
      }
    >
      <Text style={styles.intro}>
        Define qué acciones pueden hacer meseros y chefs, y designa quién puede
        cerrar anulando lo pendiente cada día.
      </Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Acciones del chef</Text>
        <Text style={styles.hint}>
          Si desactivas una opción, ningún chef podrá usarla hasta que la vuelvas
          a activar.
        </Text>
        {PERMISOS_CHEF_KEYS.map((key) => {
          const meta = PERMISOS_CHEF_META[key];
          const activo = data.permisos_chef[key];
          const busy = busyKey === `chef:${key}`;
          return (
            <View key={key} style={styles.toggleRow}>
              <View style={styles.toggleText}>
                <Text style={styles.toggleTitle}>{meta.titulo}</Text>
                <Text style={styles.toggleHint}>{meta.detalle}</Text>
              </View>
              <Switch
                value={activo}
                disabled={busy}
                onValueChange={(v) => void togglePermisoChef(key, v)}
                trackColor={{ false: colors.border, true: colors.primarySoft }}
                thumbColor={activo ? colors.primary : colors.surface}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Acciones del mesero</Text>
        <Text style={styles.hint}>
          Si desactivas una opción, ningún mesero podrá usarla hasta que la vuelvas
          a activar.
        </Text>
        {PERMISOS_MESERO_KEYS.map((key) => {
          const meta = PERMISOS_MESERO_META[key];
          const activo = data.permisos_mesero[key];
          return (
            <View key={key} style={styles.toggleRow}>
              <View style={styles.toggleText}>
                <Text style={styles.toggleTitle}>{meta.titulo}</Text>
                <Text style={styles.toggleHint}>{meta.detalle}</Text>
              </View>
              <Switch
                value={activo}
                disabled={busyKey === key}
                onValueChange={(v) => void togglePermiso(key, v)}
                trackColor={{ false: colors.border, true: colors.primarySoft }}
                thumbColor={activo ? colors.primary : colors.surface}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Cierre mesa — anular pendiente</Text>
        <Text style={styles.hint}>
          Por defecto solo el admin puede cerrar una mesa con cobros parciales
          anulando lo que no llegó. Designa un mesero por día; al cambiarlo, el
          anterior pierde el permiso.
        </Text>
        <Pressable
          style={styles.fechaBtn}
          onPress={() =>
            Platform.OS === 'web' ? setShowCalendario((v) => !v) : setShowPickerNativo(true)
          }
        >
          <Text style={styles.fechaBtnText}>Fecha: {fecha}</Text>
        </Pressable>
        {showCalendario ? (
          <Calendar
            current={fecha}
            markedDates={markedDates}
            onDayPress={(day) => {
              setFecha(day.dateString);
              setShowCalendario(false);
            }}
            theme={{
              selectedDayBackgroundColor: colors.primary,
              todayTextColor: colors.primary,
              arrowColor: colors.primary,
            }}
          />
        ) : null}
        {showPickerNativo ? (
          <DateTimePicker
            value={parseFechaInput(fecha)}
            mode="date"
            display="default"
            onChange={(_, d) => {
              setShowPickerNativo(false);
              if (d) setFecha(fechaCalendarioBogota(d));
            }}
          />
        ) : null}
        {data.delegacion_cierre_anulacion ? (
          <View style={styles.delegacionActiva}>
            <Text style={styles.delegacionNombre}>
              Designado:{' '}
              {[
                data.delegacion_cierre_anulacion.nombre,
                data.delegacion_cierre_anulacion.apellido,
              ]
                .filter(Boolean)
                .join(' ')}
            </Text>
            <Pressable
              disabled={busyKey === 'delegacion'}
              onPress={() => void asignarDelegacion(null)}
            >
              <Text style={styles.linkBtn}>Quitar permiso</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.hintSmall}>
            Nadie designado — solo el administrador puede usar esta acción hoy.
          </Text>
        )}
        {data.meseros.length > 0 ? (
          <View style={styles.delegacionLista}>
            {data.meseros.map((m) => {
              const esDesignado =
                data.delegacion_cierre_anulacion?.id_usuario === m.id_usuario;
              return (
                <Pressable
                  key={`deleg-${m.id_usuario}`}
                  disabled={busyKey === 'delegacion' || esDesignado}
                  onPress={() => void asignarDelegacion(m.id_usuario)}
                  style={[
                    styles.delegacionChip,
                    esDesignado && styles.delegacionChipActivo,
                  ]}
                >
                  <Text
                    style={[
                      styles.delegacionChipText,
                      esDesignado && styles.delegacionChipTextActivo,
                    ]}
                  >
                    {nombreCompleto(m)}
                    {esDesignado ? ' ✓' : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    </ScreenScroll>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
  scroll: { flex: 1, backgroundColor: c.background },
  content: { gap: 16 },
  intro: { color: c.textMuted, fontSize: 14, lineHeight: 20 },
  card: {
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: c.border,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: c.text },
  hint: { fontSize: 13, color: c.textMuted, lineHeight: 18 },
  hintSmall: { fontSize: 13, color: c.textMuted, fontStyle: 'italic' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  toggleText: { flex: 1, gap: 2 },
  toggleTitle: { fontSize: 15, fontWeight: '600', color: c.text },
  toggleHint: { fontSize: 12, color: c.textMuted },
  fechaBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: c.backgroundAlt,
  },
  fechaBtnText: { color: c.primary, fontWeight: '600' },
  delegacionActiva: { gap: 6 },
  delegacionNombre: { fontWeight: '600', color: c.text },
  linkBtn: { color: c.primary, fontWeight: '600' },
  delegacionLista: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  delegacionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.backgroundAlt,
  },
  delegacionChipActivo: {
    borderColor: c.primary,
    backgroundColor: c.primarySoft,
  },
  delegacionChipText: { color: c.text, fontSize: 13 },
  delegacionChipTextActivo: { color: c.primary, fontWeight: '700' },
  deniedWrap: { flex: 1, justifyContent: 'center', padding: 24, gap: 16 },
  denied: { textAlign: 'center', color: c.textMuted, fontSize: 15 },
});
}
