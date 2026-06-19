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
import { colors } from '../../src/lib/theme';

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
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  cardEnter: { marginBottom: 0 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  denied: { textAlign: 'center', color: colors.textMuted, marginBottom: 16, fontSize: 16 },
  resumenCard: {
    backgroundColor: colors.info,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.infoText,
  },
  resumenKicker: {
    color: colors.onInfoMuted,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  resumenHero: {
    fontSize: 44,
    fontWeight: '900',
    color: colors.surface,
    marginTop: 4,
    lineHeight: 48,
  },
  resumenHeroLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.onInfoSoft,
    marginTop: 2,
  },
  resumenSub: { marginTop: 8, color: colors.onInfoMuted, fontSize: 13, lineHeight: 18 },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...appShadow,
  },
  kicker: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  h1: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 4 },
  sub: { marginTop: 6, color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  linkMisPedidos: { marginTop: 12 },
  linkMisPedidosText: { color: colors.primary, fontWeight: '800', fontSize: 14 },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginVertical: 24,
    fontSize: 15,
    lineHeight: 22,
  },
  chipsCard: { marginBottom: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.border,
    ...appShadow,
  },
  cardBordeAlta: { borderLeftWidth: 4, borderLeftColor: colors.danger, borderColor: colors.dangerBorder },
  cardBordeBaja: { borderLeftWidth: 4, borderLeftColor: colors.warning, borderColor: colors.warningBorder },
  cardTop: { marginBottom: 4 },
  rowPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  pill: {
    backgroundColor: colors.infoLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: { fontSize: 12, fontWeight: '800', color: colors.info },
  pillMesero: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillMeseroText: { fontSize: 12, fontWeight: '800', color: colors.primaryDark },
  pillRecoger: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillRecogerText: { fontSize: 12, fontWeight: '800', color: colors.successText },
  cardTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  cardMeta: { marginTop: 4, color: colors.textMuted, fontSize: 13 },
});
