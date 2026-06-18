import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ActionIconBar } from '../../src/components/ActionIconBar';
import { FormModal } from '../../src/components/FormModal';
import { WeekdayChips } from '../../src/components/WeekdayChips';
import { useAuth } from '../../src/context/AuthContext';
import { useResponsive, gridItemWidth } from '../../src/hooks/useResponsive';
import { adminGridColumns } from '../../src/lib/admin-grid';
import { AdminIcon } from '../../src/lib/app-icons';
import { formStyles } from '../../src/lib/form-layout';
import {
  allWeekdayFlags,
  pickWeekdayFlags,
  type WeekdayFieldKey,
} from '../../src/lib/weekday-visibility';
import { api } from '../../src/lib/api';
import { showNotice } from '../../src/lib/app-dialog';
import {
  avisarSiEnteroInvalido,
  avisarSiFaltanObligatorios,
} from '../../src/lib/form-validation';

type MesaAdmin = {
  id_mesa: number;
  numero: number;
  capacidad: number;
  estado: string;
  disponible_lunes: boolean;
  disponible_martes: boolean;
  disponible_miercoles: boolean;
  disponible_jueves: boolean;
  disponible_viernes: boolean;
  disponible_sabado: boolean;
  disponible_domingo: boolean;
};

function MesaAdminCard({
  mesa,
  onToggle,
  onSetAll,
}: {
  mesa: MesaAdmin;
  onToggle: (key: WeekdayFieldKey, enabled: boolean) => void;
  onSetAll: (enabled: boolean) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle}>Mesa {mesa.numero}</Text>
        <Text style={styles.cardMeta}>{mesa.estado}</Text>
      </View>
      <WeekdayChips
        flags={pickWeekdayFlags(mesa)}
        onToggle={onToggle}
        onSetAll={onSetAll}
      />
    </View>
  );
}

export default function MesasAdminScreen() {
  const { token } = useAuth();
  const r = useResponsive();
  const [rows, setRows] = useState<MesaAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [numeroStr, setNumeroStr] = useState('');

  const gridColumns = useMemo(
    () => adminGridColumns(r.contentWidth, r.gridColumns),
    [r.contentWidth, r.gridColumns],
  );
  const cardWidth = gridItemWidth(r.contentWidth, gridColumns, r.gridGap);

  const load = useCallback(async () => {
    const data = await api<MesaAdmin[]>('/mesas/admin', { token });
    setRows(data);
  }, [token]);

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (e) {
        Alert.alert('Error', e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  async function patchMesa(id: number, partial: Partial<MesaAdmin>) {
    await api(`/mesas/admin/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(partial),
    });
    await load();
  }

  function openNew() {
    setNumeroStr('');
    setModal(true);
  }

  async function crearMesa() {
    if (
      await avisarSiFaltanObligatorios(
        [{ etiqueta: 'Número de mesa', valor: numeroStr }],
        showNotice,
      )
    ) {
      return;
    }
    if (await avisarSiEnteroInvalido('Número de mesa', numeroStr, 1, showNotice)) {
      return;
    }
    const numero = Number(numeroStr);
    setSaving(true);
    try {
      await api('/mesas/admin', {
        method: 'POST',
        token,
        body: JSON.stringify({ numero }),
      });
      setModal(false);
      await load();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <FlatList
        key={`mesas-admin-grid-${gridColumns}`}
        style={styles.container}
        data={rows}
        keyExtractor={(m) => String(m.id_mesa)}
        numColumns={gridColumns}
        columnWrapperStyle={
          gridColumns > 1
            ? { gap: r.gridGap, marginBottom: r.gridGap }
            : undefined
        }
        contentContainerStyle={[
          styles.pad,
          { paddingHorizontal: r.contentPadding, paddingBottom: 32 },
        ]}
        ListHeaderComponent={
          <>
            <Text style={[styles.intro, formStyles.adminIntro]}>
              Activa o desactiva cada mesa por día de la semana (zona horaria del API:
              Bogotá). La grilla solo muestra mesas habilitadas para el día actual.
              Los números 98 y 99 son reservados (para llevar / mostrador).
            </Text>
            <ActionIconBar
              style={formStyles.screenActions}
              actions={[
                {
                  key: 'nueva',
                  icon: AdminIcon.crear,
                  label: 'Nueva mesa',
                  variant: 'primary',
                  onPress: openNew,
                },
              ]}
            />
          </>
        }
        renderItem={({ item: m }) => (
          <View
            style={{
              width: cardWidth,
              marginBottom: gridColumns === 1 ? r.gridGap : 0,
            }}
          >
            <MesaAdminCard
              mesa={m}
              onToggle={(key, enabled) =>
                patchMesa(m.id_mesa, { [key]: enabled } as Partial<MesaAdmin>).catch(
                  (e) =>
                    Alert.alert('Error', e instanceof Error ? e.message : String(e)),
                )
              }
              onSetAll={(enabled) =>
                patchMesa(m.id_mesa, allWeekdayFlags(enabled) as Partial<MesaAdmin>).catch(
                  (e) =>
                    Alert.alert('Error', e instanceof Error ? e.message : String(e)),
                )
              }
            />
          </View>
        )}
      />

      <FormModal
        visible={modal}
        title="Nueva mesa"
        onClose={() => setModal(false)}
      >
        <Text style={formStyles.label}>Número (no usar 98 ni 99)</Text>
        <TextInput
          style={[formStyles.input, formStyles.inputNarrow]}
          value={numeroStr}
          onChangeText={setNumeroStr}
          keyboardType="number-pad"
          placeholder="16"
          placeholderTextColor="#9a988f"
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
              onPress: () => setModal(false),
            },
            {
              key: 'crear',
              icon: saving ? 'hourglass-outline' : AdminIcon.confirmar,
              label: saving ? 'Guardando…' : 'Crear',
              variant: 'primary',
              disabled: saving,
              onPress: crearMesa,
            },
          ]}
        />
      </FormModal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f4ee' },
  pad: { paddingTop: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  intro: { color: '#6f6e67', fontSize: 13, marginBottom: 12, lineHeight: 18 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e2d8',
    flex: 1,
  },
  cardHead: { marginBottom: 8, alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '900', color: '#262622', textAlign: 'center' },
  cardMeta: { color: '#6f6e67', fontSize: 13, marginTop: 2, textAlign: 'center' },
});
