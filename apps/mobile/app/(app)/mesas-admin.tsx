import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ActionIconBar, type ActionIconItem } from '../../src/components/ActionIconBar';
import { FormModal } from '../../src/components/FormModal';
import { ScreenLoading } from '../../src/components/ScreenLoading';
import { WeekdayChips } from '../../src/components/WeekdayChips';
import { useAuth } from '../../src/context/AuthContext';
import { useVisualTheme } from '../../src/context/VisualThemeContext';
import { useThemedStyles } from '../../src/hooks/useThemedStyles';
import { useResponsive, gridItemWidth } from '../../src/hooks/useResponsive';
import { adminGridColumns } from '../../src/lib/admin-grid';
import { AdminIcon } from '../../src/lib/app-icons';
import { useFormStyles } from '../../src/lib/form-layout';
import {
  allWeekdayFlags,
  pickWeekdayFlags,
  type WeekdayFieldKey,
} from '../../src/lib/weekday-visibility';
import { api } from '../../src/lib/api';
import { confirmAppDialog, showNotice } from '../../src/lib/app-dialog';
import { manejarErrorAccion, manejarErrorOperacion } from '../../src/lib/recurso-disponible';
import { useMesasVirtuales } from '../../src/hooks/useMesasVirtuales';
import { useScreenScrollPadding } from '../../src/hooks/useScreenScrollPadding';
import {
  avisarSiEnteroInvalido,
  avisarSiFaltanObligatorios,
} from '../../src/lib/form-validation';
import { esMesaVirtualNumero, tituloMesaAdmin } from '../../src/lib/mesa-label';
import type { AppColors } from '../../src/lib/theme';

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

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    pad: { paddingTop: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    intro: { color: c.textMuted, fontSize: 13, marginBottom: 12, lineHeight: 18 },
    card: {
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
      flex: 1,
    },
    cardVirtual: {
      borderColor: c.secondary,
      backgroundColor: c.secondaryLight,
    },
    cardHead: { marginBottom: 8, alignItems: 'center' },
    cardTitle: { fontSize: 18, fontWeight: '900', color: c.text, textAlign: 'center' },
    cardMeta: { color: c.textMuted, fontSize: 13, marginTop: 2, textAlign: 'center' },
    cardActions: { marginTop: 10 },
  });
}

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
  const styles = useThemedStyles(createStyles);
  const esVirtual = esMesaVirtualNumero(mesa.numero);
  const acciones = [
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
  ].filter((x) => x != null) as ActionIconItem[];

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
  const { colors } = useVisualTheme();
  const styles = useThemedStyles(createStyles);
  const formStyles = useFormStyles();
  const mv = useMesasVirtuales();
  const r = useResponsive();
  const listBottomPad = useScreenScrollPadding();
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
        await manejarErrorAccion(e, 'cargar las mesas');
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
      await manejarErrorOperacion(e, {
        title: 'No se pudo actualizar',
        message: 'Revisa si la mesa tiene pedidos activos.',
      });
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
      await manejarErrorOperacion(e, {
        title: modal === 'crear' ? 'No se pudo crear' : 'No se pudo actualizar',
        message: 'Revisa el número y los pedidos activos.',
      });
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
      await manejarErrorOperacion(e, {
        title: 'No se pudo eliminar',
        message: 'Solo se eliminan mesas sin historial de pedidos.',
      });
    }
  }

  if (loading) {
    return <ScreenLoading />;
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
          { paddingHorizontal: r.contentPadding, paddingBottom: listBottomPad },
        ]}
        ListHeaderComponent={
          <>
            <Text style={[styles.intro, formStyles.adminIntro]}>
              Mesas por día (Bogotá). {mv.resueltas.numero_mesa_para_llevar} y{' '}
              {mv.resueltas.numero_mesa_mostrador} son del sistema. No elimines
              mesas con historial.
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
        <Text style={formStyles.label}>
          Número (no usar {mv.resueltas.numero_mesa_para_llevar} ni{' '}
          {mv.resueltas.numero_mesa_mostrador})
        </Text>
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
