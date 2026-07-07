import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ActionIconBar } from './ActionIconBar';
import { IconTooltipButton } from './IconTooltipButton';
import { FormModal } from './FormModal';
import { AnimatedPressable } from './AnimatedPressable';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';
import { colors } from '../lib/theme';
import { estiloTarjetaMesa } from '../lib/visual-theme';
import { esMesaVirtualNumero, tituloLugarMesa } from '../lib/mesa-label';
import {
  AYUDA_TRANSFERENCIA_PEDIDO,
  validarTransferenciaPedido,
} from '@la-reserva/shared-domain/transferencia-pedido';
import { confirmAppDialog, showNotice } from '../lib/app-dialog';
import { manejarErrorAccion } from '../lib/recurso-disponible';
import { useRefetchOnSync } from '../hooks/useRefetchOnSync';
import { useResponsive } from '../hooks/useResponsive';
import { useVisualTheme } from '../context/VisualThemeContext';

type MesaRow = {
  id_mesa: number;
  numero: number;
  estado: string;
};

export type TransferirPedidoPanelProps = {
  pedidoId: number;
  mesaOrigenId: number;
  mesaOrigenNumero: number;
  token: string | null;
  disabled?: boolean;
  onTransferido: (idMesaDestino: number) => void;
  /** En barra derecha (tablet+): botón vertical compacto. */
  presentation?: 'inline' | 'rail';
};

type Props = TransferirPedidoPanelProps;

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
  minHeight,
}: {
  mesa: MesaRow;
  onPress: () => void;
  disabled?: boolean;
  columnPct: `${number}%`;
  minHeight: number;
}) {
  const { colors } = useVisualTheme();
  const libre = estiloTarjetaMesa(colors, 'libre');

  return (
    <View style={[styles.gridCell, { width: columnPct }]}>
      <AnimatedPressable
        disabled={disabled}
        onPress={onPress}
        style={[
          styles.mesaBtn,
          {
            minHeight,
            borderColor: libre.borderColor,
            borderLeftColor: libre.accent,
            backgroundColor: libre.backgroundColor,
          },
          disabled && styles.mesaBtnDisabled,
        ]}
      >
        <Text style={[styles.mesaBtnNum, { color: colors.text }]}>
          {mesa.numero}
        </Text>
        <Text style={[styles.mesaBtnLabel, { color: libre.text }]}>Libre</Text>
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
  presentation = 'inline',
}: Props) {
  const r = useResponsive();
  const [modalOpen, setModalOpen] = useState(false);
  const [libres, setLibres] = useState<MesaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);

  const columnas = r.isCompact ? 4 : r.isWide ? 6 : 5;
  const columnPct = `${100 / columnas}%` as `${number}%`;
  const filasGrid = Math.ceil(libres.length / columnas) || 1;
  const modalConScroll = filasGrid > 4;
  const mesaBtnMinHeight = r.isCompact ? 72 : r.isWide ? 88 : 80;

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
      await manejarErrorAccion(e, 'transferir el pedido');
    } finally {
      setTransferring(false);
    }
  }

  const elegirDisabled = disabled || transferring || loading || libres.length === 0;

  const modal = (
      <FormModal
        visible={modalOpen}
        title="Elegir mesa destino"
        onClose={cerrarSelector}
        scroll={modalConScroll}
        cardStyle={[
          styles.modalCard,
          { maxWidth: Math.min(r.width - 24, r.isWide ? 720 : 640) },
        ]}
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
                minHeight={mesaBtnMinHeight}
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
  );

  if (presentation === 'rail') {
    return (
      <View style={styles.railWrap}>
        <IconTooltipButton
          icon="swap-horizontal-outline"
          label={
            loading
              ? 'Cargando mesas…'
              : libres.length === 0
                ? 'Sin mesas libres'
                : 'Elegir mesa destino'
          }
          variant="secondary"
          disabled={elegirDisabled}
          onPress={abrirSelector}
          fixedSize
          size={26}
        />
        <Text style={styles.railHint} numberOfLines={4}>
          {resumenLibres}
        </Text>
        {modalOpen ? (
          <IconTooltipButton
            icon="close-outline"
            label="Cancelar transferencia"
            variant="default"
            disabled={transferring}
            onPress={cerrarSelector}
            fixedSize
            size={26}
          />
        ) : null}
        {modal}
      </View>
    );
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
      </View>
      <ActionIconBar
        style={styles.headActionBar}
        actions={[
          {
            key: 'elegir',
            icon: 'grid-outline',
            label: 'Elegir mesa destino',
            variant: 'secondary',
            disabled: elegirDisabled,
            onPress: abrirSelector,
          },
          ...(modalOpen
            ? [
                {
                  key: 'cancelar',
                  icon: 'close-outline' as const,
                  label: 'Cancelar transferencia',
                  variant: 'default' as const,
                  disabled: transferring,
                  onPress: cerrarSelector,
                },
              ]
            : []),
        ]}
      />
      {modal}
    </View>
  );
}

const styles = StyleSheet.create({
  railWrap: {
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  railHint: {
    fontSize: 11,
    lineHeight: 15,
    color: colors.textMuted,
    textAlign: 'center',
    width: '100%',
  },
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
  headActionBar: {
    marginTop: 4,
    marginBottom: 4,
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
    maxWidth: 640,
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  modalHint: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 19,
    marginBottom: 10,
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
    padding: 4,
  },
  mesaBtn: {
    borderWidth: 2,
    borderLeftWidth: 5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  mesaBtnDisabled: { opacity: 0.5 },
  mesaBtnNum: {
    fontWeight: '900',
    fontSize: 28,
    lineHeight: 32,
  },
  mesaBtnLabel: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
  },
  modalCancelBtn: {
    marginTop: 8,
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
