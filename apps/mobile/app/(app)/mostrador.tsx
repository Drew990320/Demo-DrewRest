import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../src/context/AuthContext';
import { PantallaSoloMeseros } from '../../src/components/PantallaSoloMeseros';
import { useRequiereTomarPedidos } from '../../src/hooks/usePuedeTomarPedidos';
import { ActionIconBar } from '../../src/components/ActionIconBar';
import { PedidoIcon } from '../../src/lib/app-icons';
import { IconTooltipButton } from '../../src/components/IconTooltipButton';
import { PedidosActivosChips } from '../../src/components/PedidosActivosChips';
import { api } from '../../src/lib/api';
import { useSeleccionPedido } from '../../src/hooks/useSeleccionPedido';
import { colors } from '../../src/lib/theme';

type MostradorMesa = {
  id_mesa: number;
  numero: number;
  estado: string;
};

type PedidoActivo = { id_pedido: number };

export default function MostradorScreen() {
  const { token } = useAuth();
  const { ok: puedeTomar, loading: authLoading } = useRequiereTomarPedidos();
  const router = useRouter();
  const [mesa, setMesa] = useState<MostradorMesa | null>(null);
  const [activos, setActivos] = useState<PedidoActivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const m = await api<MostradorMesa>('/mesas/mostrador', { token });
    setMesa(m);
    const list = await api<PedidoActivo[]>(
      `/pedidos/activos-por-mesa/${m.id_mesa}`,
      { token, cacheKey: `activos_mesa_${m.id_mesa}` },
    );
    setActivos(list ?? []);
  }, [token]);

  const { selectedId, setSelectedId, selected: pedidoSeleccionado } =
    useSeleccionPedido(activos);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          await load();
        } catch {
          if (!cancelled) setMesa(null);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  async function nuevaVenta() {
    if (!mesa) return;
    setBusy(true);
    try {
      const created = await api<{ id_pedido: number }>('/pedidos', {
        method: 'POST',
        token,
        body: JSON.stringify({
          id_mesa: mesa.id_mesa,
          num_comensales: 1,
        }),
      });
      router.push(`/(app)/pedido/${created.id_pedido}/menu?bebidas=1`);
    } catch (e) {
      Alert.alert(
        'Error',
        e instanceof Error ? e.message : 'No se pudo abrir la venta',
      );
    } finally {
      setBusy(false);
    }
  }

  if (!authLoading && !puedeTomar) {
    return <PantallaSoloMeseros />;
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!mesa) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>
          No está configurada la mesa mostrador (n.º 99) en el servidor. Ejecuta
          el seed o crea esa mesa en la base de datos.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.headerCard}>
        <Text style={styles.kicker}>Venta rápida</Text>
        <Text style={styles.h1}>Mostrador · bebidas</Text>
        <Text style={styles.sub}>
          Para comensales que solo compran bebidas (agua, gaseosas, cervezas…)
          sin usar las mesas 1–15. Puedes tener varios pedidos abiertos a la vez;
          cobra cada ticket por separado.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.estado}>
          Estado:{' '}
          <Text style={{ fontWeight: '800' }}>
            {mesa.estado === 'libre' ? 'disponible' : 'ocupada'}
          </Text>
        </Text>

        <IconTooltipButton
          icon={PedidoIcon.nuevaVentaBebidas}
          label="Nueva venta (solo bebidas)"
          variant="primary"
          onPress={nuevaVenta}
          disabled={busy}
        />

        {activos.length > 0 && pedidoSeleccionado && (
          <>
            <PedidosActivosChips
              pedidos={activos}
              selectedId={selectedId}
              onSelect={setSelectedId}
              label="Pedidos abiertos en mostrador"
              style={styles.chipsBox}
            />
            <View style={styles.pedidoRow}>
              <Text style={styles.pedidoId}>#{pedidoSeleccionado.id_pedido}</Text>
              <ActionIconBar
                actions={[
                  {
                    key: 'ver',
                    icon: PedidoIcon.verPedido,
                    label: 'Ver / cobrar',
                    variant: 'secondary',
                    onPress: () =>
                      router.push(
                        `/(app)/mesa/${mesa.id_mesa}?pedido=${pedidoSeleccionado.id_pedido}`,
                      ),
                  },
                  {
                    key: 'menu',
                    icon: PedidoIcon.agregarBebidas,
                    label: 'Menú bebidas',
                    onPress: () =>
                      router.push(
                        `/(app)/pedido/${pedidoSeleccionado.id_pedido}/menu?bebidas=1`,
                      ),
                  },
                ]}
              />
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  err: { color: colors.textMuted, textAlign: 'center' },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  kicker: { color: colors.textMuted, fontWeight: '700' },
  h1: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 4 },
  sub: { marginTop: 8, color: colors.textMuted, lineHeight: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  estado: { color: colors.text, marginBottom: 4 },
  chipsBox: {
    marginTop: 8,
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderLight,
  },
  sectionLabel: { fontWeight: '800', color: colors.text, marginTop: 8 },
  pedidoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
  },
  pedidoId: { fontWeight: '900', color: colors.primary, fontSize: 16 },
  pedidoActions: { flexDirection: 'row', gap: 8, flexShrink: 1 },
  primary: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: { color: colors.surface, fontWeight: '900' },
  secondary: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  secondaryText: { color: colors.text, fontWeight: '800', fontSize: 13 },
  tertiary: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  tertiaryText: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  disabled: { opacity: 0.6 },
});
