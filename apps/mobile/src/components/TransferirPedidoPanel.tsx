import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { IconTooltipButton } from './IconTooltipButton';
import { FormModal } from './FormModal';
import { AnimatedPressable } from './AnimatedPressable';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';
import { colors } from '../lib/theme';
import { esMesaVirtualNumero, tituloLugarMesa } from '../lib/mesa-label';
import {
  AYUDA_TRANSFERENCIA_PEDIDO,
  validarTransferenciaPedido,
} from '@la-reserva/shared-domain/transferencia-pedido';
import { confirmAppDialog, showNotice } from '../lib/app-dialog';
import { useRefetchOnSync } from '../hooks/useRefetchOnSync';
import { useResponsive } from '../hooks/useResponsive';

type MesaRow = {
  id_mesa: number;
  numero: number;
  estado: string;
};

type Props = {
  pedidoId: number;
  mesaOrigenId: number;
  mesaOrigenNumero: number;
  token: string | null;
  disabled?: boolean;
  onTransferido: (idMesaDestino: number) => void;
};

async function filtrarMesasLibres(
  mesas: MesaRow[],
  mesaOrigenId: number,
  token: string | null,
): Promise<MesaRow[]> {
  const candidatas = mesas.filter(
    (m) =>
      !esMesaVirtualNumero(m.numero) &&
      m.id_mesa !== mesaOrigenId &&
      m.estado === 'libre',
  );
  if (candidatas.length === 0) return [];

  const verificadas = await Promise.all(
    candidatas.map(async (m) => {
      try {
        const activos = await api<{ id_pedido: number }[]>(
          `/pedidos/activos-por-mesa/${m.id_mesa}`,
          { token },
        );
        return activos.length === 0 ? m : null;
      } catch {
        return null;
      }
    }),
  );
  return verificadas
    .filter((m): m is MesaRow => m != null)
    .sort((a, b) => a.numero - b.numero);
}

function MesaOpcion({
  mesa,
  onPress,
  disabled,
  columnPct,
}: {
  mesa: MesaRow;
  onPress: () => void;
  disabled?: boolean;
  columnPct: `${number}%`;
}) {
  return (
    <View style={[styles.gridCell, { width: columnPct }]}>
      <AnimatedPressable
        disabled={disabled}
        onPress={onPress}
        style={[styles.mesaBtn, disabled && styles.mesaBtnDisabled]}
      >
        <Text style={styles.mesaBtnNum}>{mesa.numero}</Text>
        <Text style={styles.mesaBtnLabel}>Libre</Text>
      </AnimatedPressable>
    </View>
  );
}

export function TransferirPedidoPanel({
  pedidoId,
  mesaOrigenId,
  mesaOrigenNumero,
  token,
  disabled,
  onTransferido,
}: Props) {
  const r = useResponsive();
  const [modalOpen, setModalOpen] = useState(false);
  const [libres, setLibres] = useState<MesaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);

  const columnas = r.isCompact ? 3 : 4;
  const columnPct = `${100 / columnas}%` as `${number}%`;

  const cargarOpciones = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<MesaRow[]>('/mesas', { token, cacheKey: 'mesas' });
      setLibres(await filtrarMesasLibres(data, mesaOrigenId, token));
    } catch {
      setLibres([]);
    } finally {
      setLoading(false);
    }
  }, [mesaOrigenId, token]);

  useEffect(() => {
    cargarOpciones();
  }, [cargarOpciones]);

  useRefetchOnSync(cargarOpciones, { source: 'mesas' });
  useRefetchOnSync(cargarOpciones, { source: 'local-mesas' });

  const resumenLibres = useMemo(() => {
    if (loading) return '…';
    if (libres.length === 0) return 'Ninguna libre ahora';
    if (libres.length === 1) return '1 mesa libre';
    return `${libres.length} mesas libres`;
  }, [libres.length, loading]);

  function cerrarSelector() {
    if (transferring) return;
    setModalOpen(false);
  }

  async function abrirSelector() {
    if (disabled || transferring) return;
    setModalOpen(true);
    await cargarOpciones();
  }

  async function transferirAMesa(dest: MesaRow) {
    const preview = validarTransferenciaPedido({
      origen_mesa_numero: mesaOrigenNumero,
      destino_mesa_numero: dest.numero,
      destino_libre: true,
    });
    if (preview.accion === 'rechazar') {
      await showNotice('No se puede transferir', preview.mensaje, 'warning');
      return;
    }

    const ok = await confirmAppDialog(
      'Transferir pedido',
      preview.mensaje_confirmacion,
    );
    if (!ok) return;

    setTransferring(true);
    try {
      const res = await api<{ id_mesa: number }>(
        `/pedidos/${pedidoId}/transferir`,
        {
          method: 'POST',
          token,
          body: JSON.stringify({ mesa_numero_nuevo: dest.numero }),
        },
      );
      setModalOpen(false);
      onTransferido(res.id_mesa ?? dest.id_mesa);
    } catch (e) {
      Alert.alert(
        'Error',
        e instanceof Error ? e.message : 'No se pudo transferir',
      );
    } finally {
      setTransferring(false);
    }
  }

  return (
    <View style={styles.box}>
      <View style={styles.compactRow}>
        <View style={styles.headIcon}>
          <Ionicons name="swap-horizontal" size={20} color={colors.primaryDark} />
        </View>
        <View style={styles.headText}>
          <Text style={styles.title}>Transferir a otra mesa</Text>
          <Text style={styles.help}>{AYUDA_TRANSFERENCIA_PEDIDO}</Text>
          <Text style={styles.resumen}>{resumenLibres}</Text>
        </View>
        <View style={styles.headActions}>
          <IconTooltipButton
            icon="grid-outline"
            label="Elegir mesa destino"
            variant="secondary"
            onPress={abrirSelector}
            disabled={disabled || transferring || loading || libres.length === 0}
          />
          {modalOpen ? (
            <IconTooltipButton
              icon="close-outline"
              label="Cancelar transferencia"
              variant="default"
              onPress={cerrarSelector}
              disabled={transferring}
            />
          ) : null}
        </View>
      </View>

      <FormModal
        visible={modalOpen}
        title="Elegir mesa destino"
        onClose={cerrarSelector}
        scroll
        cardStyle={styles.modalCard}
      >
        <Text style={styles.modalHint}>
          Pedido en {tituloLugarMesa(mesaOrigenNumero)}. Toca una mesa libre.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.modalLoader} />
        ) : libres.length === 0 ? (
          <View style={styles.modalEmpty}>
            <Text style={styles.modalEmptyTitle}>No hay mesas libres</Text>
            <Text style={styles.modalEmptySub}>
              Espera a que se libere una mesa e inténtalo de nuevo.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {libres.map((m) => (
              <MesaOpcion
                key={m.id_mesa}
                mesa={m}
                columnPct={columnPct}
                disabled={disabled || transferring}
                onPress={() => transferirAMesa(m)}
              />
            ))}
          </View>
        )}

        {transferring ? (
          <ActivityIndicator color={colors.primary} style={styles.modalLoader} />
        ) : null}

        <Pressable
          style={[styles.modalCancelBtn, transferring && styles.btnDisabled]}
          onPress={cerrarSelector}
          disabled={transferring}
        >
          <Text style={styles.modalCancelBtnText}>Cancelar transferencia</Text>
        </Pressable>
      </FormModal>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 12,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
  },
  compactRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  headActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingTop: 2,
  },
  headIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: { flex: 1 },
  title: { fontWeight: '800', color: colors.text, fontSize: 16 },
  help: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
  resumen: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '700',
    color: colors.successText,
  },
  modalCard: {
    maxWidth: 520,
  },
  modalHint: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 14,
    textAlign: 'center',
  },
  modalLoader: { marginVertical: 20 },
  modalEmpty: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  modalEmptyTitle: {
    fontWeight: '800',
    color: colors.text,
    fontSize: 15,
    textAlign: 'center',
  },
  modalEmptySub: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    marginBottom: 8,
  },
  gridCell: {
    padding: 5,
  },
  mesaBtn: {
    borderWidth: 2,
    borderColor: colors.mesaLibreBorder,
    borderLeftWidth: 5,
    borderLeftColor: colors.success,
    borderRadius: 12,
    backgroundColor: colors.mesaLibreBg,
    minHeight: 68,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  mesaBtnDisabled: { opacity: 0.5 },
  mesaBtnNum: {
    fontWeight: '900',
    fontSize: 24,
    color: colors.text,
    lineHeight: 28,
  },
  mesaBtnLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
    color: colors.successText,
  },
  modalCancelBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderInput,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
  },
  btnDisabled: { opacity: 0.45 },
});
