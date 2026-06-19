import { colors } from '../../src/lib/theme';
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
import { ActionIconBar, type ActionIconItem } from '../../src/components/ActionIconBar';
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
import { confirmAppDialog, showNotice } from '../../src/lib/app-dialog';
import {
  avisarSiEnteroInvalido,
  avisarSiFaltanObligatorios,
} from '../../src/lib/form-validation';
import { esMesaVirtualNumero, tituloMesaAdmin } from '../../src/lib/mesa-label';

type MesaAdmin = {
  id_mesa: number;
  numero: number;
  capacidad: number;
  estado: string;
  pedidos_activos?: number;
  total_pedidos?: number;
  disponible_lunes: boolean;
  disponible_martes: boolean;
  disponible_miercoles: boolean;
  disponible_jueves: boolean;
  disponible_viernes: boolean;
  disponible_sabado: boolean;
  disponible_domingo: boolean;
};

function subtituloMesaAdmin(mesa: MesaAdmin): string {
  if (esMesaVirtualNumero(mesa.numero)) {
    return 'Mesa del sistema — no desactivar';
  }
  const activos = mesa.pedidos_activos ?? 0;
  const total = mesa.total_pedidos ?? 0;
  if (activos > 0) {
    return activos === 1
      ? '1 pedido activo — no desactivar hoy'
      : `${activos} pedidos activos — no desactivar hoy`;
  }
  if (total > 0) {
    return 'Tiene historial de pedidos — no se puede eliminar';
  }
  return mesa.estado;
}

function puedeEditarNumeroMesa(mesa: MesaAdmin): boolean {
  return (
    !esMesaVirtualNumero(mesa.numero) && (mesa.pedidos_activos ?? 0) === 0
  );
}

function puedeEliminarMesa(mesa: MesaAdmin): boolean {
  return (
    !esMesaVirtualNumero(mesa.numero) &&
    (mesa.pedidos_activos ?? 0) === 0 &&
    (mesa.total_pedidos ?? 0) === 0
  );
}

function MesaAdminCard({
  mesa,
  onToggle,
  onSetAll,
  onEditNumero,
  onEliminar,
}: {
  mesa: MesaAdmin;
  onToggle: (key: WeekdayFieldKey, enabled: boolean) => void;
  onSetAll: (enabled: boolean) => void;
  onEditNumero?: () => void;
  onEliminar?: () => void;
}) {
  const esVirtual = esMesaVirtualNumero(mesa.numero);
  const acciones: ActionIconItem[] = [
    onEditNumero
      ? {
          key: 'editar',
          icon: AdminIcon.editar,
          label: 'Cambiar número',
          variant: 'secondary',
          onPress: onEditNumero,
        }
      : null,
    onEliminar
      ? {
          key: 'eliminar',
          icon: AdminIcon.eliminar,
          label: 'Eliminar',
          variant: 'danger',
          onPress: onEliminar,
        }
      : null,
  ].filter((x): x is ActionIconItem => x != null);

  return (
    <View style={[styles.card, esVirtual && styles.cardVirtual]}>
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle}>{tituloMesaAdmin(mesa.numero)}</Text>
        <Text style={styles.cardMeta}>{subtituloMesaAdmin(mesa)}</Text>
      </View>
      <WeekdayChips
        flags={pickWeekdayFlags(mesa)}
        onToggle={onToggle}
        onSetAll={onSetAll}
        disabled={esVirtual}
      />
      {acciones.length > 0 ? (
        <ActionIconBar style={styles.cardActions} actions={acciones} />
      ) : null}
    </View>
  );
}

export default function MesasAdminScreen() {
  const { token } = useAuth();
  const r = useResponsive();
  const [rows, setRows] = useState<MesaAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'crear' | 'editar' | null>(null);
  const [editMesaId, setEditMesaId] = useState<number | null>(null);
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
    try {
      await api(`/mesas/admin/${id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(partial),
      });
      await load();
    } catch (e) {
      await showNotice(
        'No se pudo actualizar',
        e instanceof Error ? e.message : String(e),
        'warning',
      );
    }
  }

  function openNew() {
    setEditMesaId(null);
    setNumeroStr('');
    setModal('crear');
  }

  function openEditNumero(mesa: MesaAdmin) {
    setEditMesaId(mesa.id_mesa);
    setNumeroStr(String(mesa.numero));
    setModal('editar');
  }

  function closeModal() {
    if (saving) return;
    setModal(null);
    setEditMesaId(null);
  }

  async function guardarNumeroMesa() {
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
      if (modal === 'crear') {
        await api('/mesas/admin', {
          method: 'POST',
          token,
          body: JSON.stringify({ numero }),
        });
      } else if (editMesaId != null) {
        await api(`/mesas/admin/${editMesaId}`, {
          method: 'PATCH',
          token,
          body: JSON.stringify({ numero }),
        });
      }
      closeModal();
      await load();
    } catch (e) {
      await showNotice(
        modal === 'crear' ? 'No se pudo crear' : 'No se pudo actualizar',
        e instanceof Error ? e.message : String(e),
        'warning',
      );
    } finally {
      setSaving(false);
    }
  }

  async function eliminarMesa(mesa: MesaAdmin) {
    const ok = await confirmAppDialog(
      'Eliminar mesa',
      `¿Eliminar ${tituloMesaAdmin(mesa.numero)}? Esta acción no se puede deshacer.`,
    );
    if (!ok) return;
    try {
      await api(`/mesas/admin/${mesa.id_mesa}`, {
        method: 'DELETE',
        token,
      });
      await load();
    } catch (e) {
      await showNotice(
        'No se pudo eliminar',
        e instanceof Error ? e.message : String(e),
        'warning',
      );
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
              Las mesas 98 y 99 son del sistema: no se desactivan, renumeran ni eliminan.
              Si una mesa tiene pedidos activos, no podrás desactivarla hoy ni cambiar su
              número. Solo se eliminan mesas sin historial de pedidos.
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
              onToggle={(key, enabled) => {
                void patchMesa(m.id_mesa, { [key]: enabled } as Partial<MesaAdmin>);
              }}
              onSetAll={(enabled) => {
                void patchMesa(
                  m.id_mesa,
                  allWeekdayFlags(enabled) as Partial<MesaAdmin>,
                );
              }}
              onEditNumero={
                puedeEditarNumeroMesa(m)
                  ? () => openEditNumero(m)
                  : undefined
              }
              onEliminar={
                puedeEliminarMesa(m) ? () => void eliminarMesa(m) : undefined
              }
            />
          </View>
        )}
      />

      <FormModal
        visible={modal != null}
        title={modal === 'editar' ? 'Cambiar número' : 'Nueva mesa'}
        onClose={closeModal}
      >
        <Text style={formStyles.label}>Número (no usar 98 ni 99)</Text>
        <TextInput
          style={[formStyles.input, formStyles.inputNarrow]}
          value={numeroStr}
          onChangeText={setNumeroStr}
          keyboardType="number-pad"
          placeholder="16"
          placeholderTextColor={colors.textHint}
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
              key: 'guardar',
              icon: saving ? 'hourglass-outline' : AdminIcon.confirmar,
              label: saving
                ? 'Guardando…'
                : modal === 'editar'
                  ? 'Guardar'
                  : 'Crear',
              variant: 'primary',
              disabled: saving,
              onPress: guardarNumeroMesa,
            },
          ]}
        />
      </FormModal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  pad: { paddingTop: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  intro: { color: colors.textMuted, fontSize: 13, marginBottom: 12, lineHeight: 18 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
  },
  cardVirtual: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondaryLight,
  },
  cardHead: { marginBottom: 8, alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '900', color: colors.text, textAlign: 'center' },
  cardMeta: { color: colors.textMuted, fontSize: 13, marginTop: 2, textAlign: 'center' },
  cardActions: { marginTop: 10 },
});
