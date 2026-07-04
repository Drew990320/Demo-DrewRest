import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../src/context/AuthContext';
import { PantallaSoloMeseros } from '../../src/components/PantallaSoloMeseros';
import { useRequiereTomarPedidos } from '../../src/hooks/usePuedeTomarPedidos';
import { PedidosActivosChips } from '../../src/components/PedidosActivosChips';
import {
  PanelPedidoVirtualActivo,
  type PedidoVirtualDetalle,
} from '../../src/components/PanelPedidoVirtualActivo';
import { PanelNuevoTicketVirtual } from '../../src/components/PanelNuevoTicketVirtual';
import { ScreenLoading } from '../../src/components/ScreenLoading';
import { ScreenScroll } from '../../src/components/ScreenScroll';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { api } from '../../src/lib/api';
import { useSeleccionPedido } from '../../src/hooks/useSeleccionPedido';
import { useRefetchOnSync } from '../../src/hooks/useRefetchOnSync';
import { ordenarPedidosCocinaPorLlegada } from '../../src/lib/cocina-pedido-view';
import { batchAfectaMesa, joinPedidoRooms } from '../../src/lib/pedido-sync';
import { colors } from '../../src/lib/theme';
import { manejarErrorAccion, manejarErrorOperacion } from '../../src/lib/recurso-disponible';
import { useMesasVirtuales } from '../../src/hooks/useMesasVirtuales';

type ParaLlevarMesa = {
  id_mesa: number;
  numero: number;
  estado: string;
};

export default function ParaLlevarScreen() {
  const { token } = useAuth();
  const { ok: puedeTomar, loading: authLoading } = useRequiereTomarPedidos();
  const [mesa, setMesa] = useState<ParaLlevarMesa | null>(null);
  const [activos, setActivos] = useState<PedidoVirtualDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const mv = useMesasVirtuales();

  const load = useCallback(async () => {
    const m = await api<ParaLlevarMesa>('/mesas/para-llevar', { token });
    setMesa(m);
    const list = await api<PedidoVirtualDetalle[]>(
      `/pedidos/activos-por-mesa/${m.id_mesa}`,
      { token, cacheKey: `activos_mesa_${m.id_mesa}` },
    );
    setActivos(list ?? []);
    return m;
  }, [token]);

  const activosOrdenados = useMemo(
    () => ordenarPedidosCocinaPorLlegada(activos),
    [activos],
  );

  const { selectedId, setSelectedId, selected: pedidoSeleccionado } =
    useSeleccionPedido(activosOrdenados);

  useEffect(() => {
    if (mesa?.id_mesa == null) return;
    joinPedidoRooms({ mesaId: mesa.id_mesa });
  }, [mesa?.id_mesa]);

  useRefetchOnSync(
    async () => {
      try {
        await load();
      } catch {
        // ignore
      }
    },
    {
      enabled: mesa?.id_mesa != null,
      source: 'pedido',
      filter: (batch) =>
        mesa?.id_mesa != null && batchAfectaMesa(batch, mesa.id_mesa),
    },
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          await load();
        } catch (e) {
          if (!cancelled) setMesa(null);
          await manejarErrorOperacion(e);
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
    } catch (e) {
      await manejarErrorOperacion(e);
    } finally {
      setRefreshing(false);
    }
  }

  async function nuevoPedido() {
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
      await load();
      if (created?.id_pedido) {
        setSelectedId(created.id_pedido);
      }
    } catch (e) {
      await manejarErrorAccion(e, 'abrir el pedido');
    } finally {
      setBusy(false);
    }
  }

  if (!authLoading && !puedeTomar) {
    return <PantallaSoloMeseros />;
  }

  if (loading) {
    return <ScreenLoading />;
  }

  if (!mesa) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>
          No está configurada la mesa {mv.resueltas.etiqueta_para_llevar.toLowerCase()}{' '}
          (n.º {mv.resueltas.numero_mesa_para_llevar}) en el servidor. Ejecuta el
          seed o créala en Configuración.
        </Text>
      </View>
    );
  }

  return (
    <ScreenScroll
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ScreenHeader
        eyebrow="Sin mesa física"
        title={mv.resueltas.etiqueta_para_llevar}
        subtitle="Pedidos en orden de llegada (el primero es el más antiguo). Empaque automático en platos fuertes ($1.000/u)."
      />

      <View style={styles.card}>
        <PanelNuevoTicketVirtual
          mesaNumero={mesa.numero}
          modo={activos.length > 0 ? 'otro' : 'inicial'}
          busy={busy}
          onAbrir={nuevoPedido}
        />

        {activos.length > 0 && pedidoSeleccionado ? (
          <>
            <PedidosActivosChips
              pedidos={activosOrdenados}
              selectedId={selectedId}
              onSelect={setSelectedId}
              label="Pedidos activos en esta cola"
              minPedidos={1}
              style={styles.chipsBox}
            />
            <PanelPedidoVirtualActivo
              pedido={pedidoSeleccionado}
              modo="para_llevar"
              token={token}
              onRefresh={load}
            />
          </>
        ) : null}
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  err: { color: colors.textMuted, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  chipsBox: {
    marginTop: 8,
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderLight,
  },
});
