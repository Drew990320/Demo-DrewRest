import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { AnimatedEnter } from '../../src/components/AnimatedEnter';
import { ActionIconBar } from '../../src/components/ActionIconBar';
import { PedidoRecogidaGrupos } from '../../src/components/PedidoRecogidaGrupos';
import { PedidosActivosChips } from '../../src/components/PedidosActivosChips';
import { api } from '../../src/lib/api';
import { AdminIcon } from '../../src/lib/app-icons';
import { showNotice } from '../../src/lib/app-dialog';
import {
  normalizarPedidoCocinaView,
  nombreMeseroPedido,
  platosPendientesRecogerPedido,
  type PedidoCocinaView,
} from '../../src/lib/cocina-pedido-view';
import type { LineaPedidoGrupo } from '../../src/lib/pedido-detalle-group';
import {
  cambiarCantidadGrupoRecogida,
  distribuirRecogidaEnGrupo,
} from '../../src/lib/recogida-parcial';
import { tituloLugarMesa } from '../../src/lib/mesa-label';
import { appShadow } from '../../src/lib/shadow';
import { puedeVerMisPedidos } from '../../src/hooks/usePuedeTomarPedidos';
import { useSeleccionPedido } from '../../src/hooks/useSeleccionPedido';
import { batchAfectaMisPedidos, joinPedidoRooms } from '../../src/lib/pedido-sync';
import { useRefetchOnSync } from '../../src/hooks/useRefetchOnSync';

type AyudaCompanerosResponse = {
  pedidos: PedidoCocinaView[];
  total_platos_para_recoger: number;
};

export default function AyudaCompanerosScreen() {
  const { token, user } = useAuth();
  const router = useRouter();
  const puedeVer = puedeVerMisPedidos(user?.rol);
  const [items, setItems] = useState<PedidoCocinaView[]>([]);
  const [totalPlatos, setTotalPlatos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyGrupoKey, setBusyGrupoKey] = useState<string | null>(null);
  const [cantidadesRecogida, setCantidadesRecogida] = useState<
    Record<number, Record<number, number>>
  >({});
  const syncIdsRef = useRef({
    mesaIds: new Set<number>(),
    pedidoIds: new Set<number>(),
  });

  const load = useCallback(async () => {
    if (!puedeVer) {
      setItems([]);
      setTotalPlatos(0);
      return;
    }
    const raw = await api<AyudaCompanerosResponse>('/pedidos/ayuda-companeros', {
      token,
      cacheKey: user?.id != null ? `ayuda_companeros_u${user.id}` : 'ayuda_companeros',
    });
    const pedidos = (raw.pedidos ?? []).map(normalizarPedidoCocinaView);
    setItems(pedidos);
    setTotalPlatos(raw.total_platos_para_recoger ?? 0);
    syncIdsRef.current = {
      mesaIds: new Set(pedidos.map((p) => p.id_mesa)),
      pedidoIds: new Set(pedidos.map((p) => p.id_pedido)),
    };
  }, [token, user?.id, puedeVer]);

  useEffect(() => {
    if (!user) return;
    if (!puedeVer) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        await load();
      } finally {
        setLoading(false);
      }
    })();
  }, [load, user, puedeVer]);

  useEffect(() => {
    if (!puedeVer) return;
    joinPedidoRooms({ cocina: true });
  }, [puedeVer]);

  useRefetchOnSync(load, {
    enabled: puedeVer,
    source: 'pedido',
    filter: (batch) =>
      batchAfectaMisPedidos(
        batch,
        syncIdsRef.current.mesaIds,
        syncIdsRef.current.pedidoIds,
      ),
  });

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  const itemsOrdenados = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          new Date(a.creado_en).getTime() - new Date(b.creado_en).getTime(),
      ),
    [items],
  );

  const { selectedId, setSelectedId, selected: pedidoSeleccionado } =
    useSeleccionPedido(itemsOrdenados);

  function grupoKey(idPedido: number, g: LineaPedidoGrupo): string {
    return `${idPedido}:${g.ids_detalle.join('-')}`;
  }

  function cantidadesPedido(idPedido: number): Record<number, number> {
    return cantidadesRecogida[idPedido] ?? {};
  }

  function cambiarCantidadGrupo(
    idPedido: number,
    g: LineaPedidoGrupo,
    detalles: PedidoCocinaView['detalles'],
    delta: number,
  ) {
    const byId = new Map(detalles.map((d) => [d.id_detalle, d]));
    setCantidadesRecogida((prev) => ({
      ...prev,
      [idPedido]: cambiarCantidadGrupoRecogida(
        g,
        delta,
        byId,
        prev[idPedido] ?? {},
      ),
    }));
  }

  async function confirmarGrupoRecogida(
    p: PedidoCocinaView,
    g: LineaPedidoGrupo,
  ) {
    const byId = new Map(p.detalles.map((d) => [d.id_detalle, d]));
    const solicitudes = distribuirRecogidaEnGrupo(
      g,
      cantidadesPedido(p.id_pedido),
      byId,
    );
    if (solicitudes.length === 0) {
      await showNotice('Cantidad', 'Indica cuántas unidades recogiste.', 'warning');
      return;
    }
    const key = grupoKey(p.id_pedido, g);
    setBusyGrupoKey(key);
    try {
      for (const s of solicitudes) {
        await api(`/pedidos/detalles/${s.id_detalle}/cocina`, {
          method: 'PATCH',
          token,
          body: JSON.stringify({ listo_cocina: true, cantidad: s.cantidad }),
        });
      }
      setCantidadesRecogida((prev) => ({ ...prev, [p.id_pedido]: {} }));
      await load();
    } catch (e) {
      await showNotice(
        'Error',
        e instanceof Error ? e.message : 'No se pudo confirmar en mesa',
        'error',
      );
    } finally {
      setBusyGrupoKey(null);
    }
  }

  async function avisarFaltaGrupo(p: PedidoCocinaView, g: LineaPedidoGrupo) {
    const byId = new Map(p.detalles.map((d) => [d.id_detalle, d]));
    const solicitudes = distribuirRecogidaEnGrupo(
      g,
      cantidadesPedido(p.id_pedido),
      byId,
    );
    if (solicitudes.length === 0) {
      await showNotice('Cantidad', 'Indica cuántas unidades faltan en cocina.', 'warning');
      return;
    }
    const key = `${grupoKey(p.id_pedido, g)}:falta`;
    setBusyGrupoKey(key);
    try {
      for (const s of solicitudes) {
        await api(`/pedidos/detalles/${s.id_detalle}/falta-en-cocina`, {
          method: 'POST',
          token,
          body: JSON.stringify({ cantidad: s.cantidad }),
        });
      }
      setCantidadesRecogida((prev) => ({ ...prev, [p.id_pedido]: {} }));
      await load();
    } catch (e) {
      await showNotice(
        'Error',
        e instanceof Error ? e.message : 'No se pudo avisar a cocina',
        'error',
      );
    } finally {
      setBusyGrupoKey(null);
    }
  }

  if (!user || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!puedeVer) {
    return (
      <View style={styles.center}>
        <Text style={styles.denied}>
          Solo meseros y administrador pueden ayudar con pedidos de compañeros.
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

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.resumenCard}>
        <Text style={styles.resumenKicker}>Ayuda entre meseros</Text>
        <Text style={styles.resumenHero}>{totalPlatos}</Text>
        <Text style={styles.resumenHeroLabel}>
          {totalPlatos === 1
            ? 'plato pendiente de recoger'
            : 'platos pendientes de recoger'}
        </Text>
        <Text style={styles.resumenSub}>
          {items.length} pedido(s) de compañeros que puedes confirmar en mesa si su
          teléfono no responde.
        </Text>
      </View>

      <View style={styles.headerCard}>
        <Text style={styles.kicker}>Compañeros</Text>
        <Text style={styles.h1}>Pedidos que puedes recoger</Text>
        <Text style={styles.sub}>
          Solo aparecen platos ya enviados a cocina que aún no están confirmados en
          mesa. Usa ✓ cuando los hayas llevado al comensal.
        </Text>
        <Pressable
          style={styles.linkMisPedidos}
          onPress={() => router.push('/(app)/mis-pedidos')}
        >
          <Text style={styles.linkMisPedidosText}>← Volver a mis pedidos</Text>
        </Pressable>
      </View>

      {itemsOrdenados.length === 0 ? (
        <Text style={styles.empty}>
          Ningún compañero tiene platos pendientes de recoger en este momento.
        </Text>
      ) : null}

      {itemsOrdenados.length > 1 ? (
        <PedidosActivosChips
          pedidos={itemsOrdenados}
          selectedId={selectedId}
          onSelect={setSelectedId}
          label="Pedidos de compañeros"
          style={styles.chipsCard}
        />
      ) : null}

      {pedidoSeleccionado ? (() => {
        const p = pedidoSeleccionado;
        const pendientes = platosPendientesRecogerPedido(p);
        return (
          <AnimatedEnter key={p.id_pedido} index={0} style={styles.cardEnter}>
            <View
              style={[
                styles.card,
                p.prioridad_cocina === 'alta'
                  ? styles.cardBordeAlta
                  : styles.cardBordeBaja,
              ]}
            >
              <View style={styles.cardTop}>
                <View style={styles.rowPills}>
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>{tituloLugarMesa(p.mesa_numero)}</Text>
                  </View>
                  <View style={styles.pillMesero}>
                    <Text style={styles.pillMeseroText}>
                      {nombreMeseroPedido(p)}
                    </Text>
                  </View>
                  {pendientes > 0 ? (
                    <View style={styles.pillRecoger}>
                      <Text style={styles.pillRecogerText}>
                        {pendientes} por recoger
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.cardTitle}>Pedido #{p.id_pedido}</Text>
                <Text style={styles.cardMeta}>
                  Mesero: {nombreMeseroPedido(p)} · {p.num_comensales} comensales
                </Text>
              </View>

              <PedidoRecogidaGrupos
                idPedido={p.id_pedido}
                detalles={p.detalles}
                cantidades={cantidadesPedido(p.id_pedido)}
                busyGrupoKey={busyGrupoKey}
                soloRecogibles
                onCambiarCantidad={(g, delta) =>
                  cambiarCantidadGrupo(p.id_pedido, g, p.detalles, delta)
                }
                onConfirmar={(g) => confirmarGrupoRecogida(p, g)}
                onFalta={(g) => avisarFaltaGrupo(p, g)}
              />
            </View>
          </AnimatedEnter>
        );
      })() : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f4ee', padding: 16 },
  cardEnter: { marginBottom: 0 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f6f4ee',
  },
  denied: { textAlign: 'center', color: '#6f6e67', marginBottom: 16, fontSize: 16 },
  resumenCard: {
    backgroundColor: '#3d5a80',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2c4360',
  },
  resumenKicker: {
    color: '#d4e4f7',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  resumenHero: {
    fontSize: 44,
    fontWeight: '900',
    color: '#fff',
    marginTop: 4,
    lineHeight: 48,
  },
  resumenHeroLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e8f0fa',
    marginTop: 2,
  },
  resumenSub: { marginTop: 8, color: '#d4e4f7', fontSize: 13, lineHeight: 18 },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8e4d8',
    ...appShadow,
  },
  kicker: {
    color: '#6f6e67',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  h1: { fontSize: 20, fontWeight: '800', color: '#262622', marginTop: 4 },
  sub: { marginTop: 6, color: '#6f6e67', fontSize: 13, lineHeight: 18 },
  linkMisPedidos: { marginTop: 12 },
  linkMisPedidosText: { color: '#2f5e4f', fontWeight: '800', fontSize: 14 },
  empty: {
    textAlign: 'center',
    color: '#6f6e67',
    marginVertical: 24,
    fontSize: 15,
    lineHeight: 22,
  },
  chipsCard: { marginBottom: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e8e4d8',
    ...appShadow,
  },
  cardBordeAlta: { borderColor: '#c44' },
  cardBordeBaja: { borderColor: '#e8e4d8' },
  cardTop: { marginBottom: 4 },
  rowPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  pill: {
    backgroundColor: '#eef2f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: { fontSize: 12, fontWeight: '800', color: '#3d5a80' },
  pillMesero: {
    backgroundColor: '#f0e8f8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillMeseroText: { fontSize: 12, fontWeight: '800', color: '#5a3d80' },
  pillRecoger: {
    backgroundColor: '#e8f5ef',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillRecogerText: { fontSize: 12, fontWeight: '800', color: '#1e6b45' },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#262622' },
  cardMeta: { marginTop: 4, color: '#6f6e67', fontSize: 13 },
});
