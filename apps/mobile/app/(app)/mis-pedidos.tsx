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
import { AccionIcon, AdminIcon, PedidoIcon } from '../../src/lib/app-icons';
import { api } from '../../src/lib/api';
import { alertarSiSinPapel } from '../../src/lib/alarma-impresora';
import { showBriefNotice, showNotice } from '../../src/lib/app-dialog';
import { colors, status } from '../../src/lib/theme';
import {
  detalleMapById,
  mesasActivasDePedidos,
  normalizarPedidoCocinaView,
  platosSinEnviarCocina,
  totalPlatosSinEnviarCocina,
  totalEsperandoRecogidaPorTipo,
  mensajeListosParaRecoger,
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

type MisActivosResponse = {
  pedidos: PedidoCocinaView[];
  mesas_activas: number;
};

export default function MisPedidosScreen() {
  const { token, user } = useAuth();
  const router = useRouter();
  const puedeVer = puedeVerMisPedidos(user?.rol);
  const [items, setItems] = useState<PedidoCocinaView[]>([]);
  const [mesasActivas, setMesasActivas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reimprimiendoId, setReimprimiendoId] = useState<number | null>(null);
  const [busyGrupoKey, setBusyGrupoKey] = useState<string | null>(null);
  const [platosAyudaCompaneros, setPlatosAyudaCompaneros] = useState(0);
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
      setMesasActivas(0);
      return;
    }
    const raw = await api<MisActivosResponse>('/pedidos/mis-activos', {
      token,
      cacheKey: user?.id != null ? `mis_activos_u${user.id}` : 'mis_activos',
    });
    const pedidos = (raw.pedidos ?? []).map(normalizarPedidoCocinaView);
    setItems(pedidos);
    setMesasActivas(raw.mesas_activas ?? mesasActivasDePedidos(pedidos).length);
    syncIdsRef.current = {
      mesaIds: new Set(pedidos.map((p) => p.id_mesa)),
      pedidoIds: new Set(pedidos.map((p) => p.id_pedido)),
    };
    try {
      const ayuda = await api<{ platos_para_recoger: number }>(
        '/pedidos/ayuda-companeros/resumen',
        {
          token,
          cacheKey: user?.id != null ? `ayuda_companeros_resumen_u${user.id}` : undefined,
        },
      );
      setPlatosAyudaCompaneros(ayuda.platos_para_recoger ?? 0);
    } catch {
      setPlatosAyudaCompaneros(0);
    }
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

  async function reimprimirComanda(idPedido: number) {
    setReimprimiendoId(idPedido);
    try {
      const res = await api<{
        impresion_comanda?: {
          impreso: boolean;
          error?: string;
          destino?: string;
        };
      }>(`/pedidos/${idPedido}/reimprimir-comanda`, {
        method: 'POST',
        token,
      });
      if (alertarSiSinPapel(res)) return;
      const imp = res.impresion_comanda;
      await showNotice(
        imp?.impreso ? 'Comanda reimpresa' : 'Sin imprimir',
        imp?.impreso
          ? `Ticket de cocina impreso (${imp.destino ?? 'impresora'}).`
          : imp?.error ?? 'No se pudo imprimir la comanda.',
        imp?.impreso ? 'success' : 'error',
      );
    } catch (e) {
      await showNotice(
        'Error',
        e instanceof Error ? e.message : 'No se pudo reimprimir',
        'error',
      );
    } finally {
      setReimprimiendoId(null);
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

  const mesasLista = useMemo(() => mesasActivasDePedidos(items), [items]);
  const totalSinCocina = useMemo(() => totalPlatosSinEnviarCocina(items), [items]);
  const recogidaPorTipo = useMemo(
    () => totalEsperandoRecogidaPorTipo(items),
    [items],
  );
  const mensajeRecoger = useMemo(
    () =>
      mensajeListosParaRecoger(
        recogidaPorTipo.platos,
        recogidaPorTipo.entradas,
      ),
    [recogidaPorTipo],
  );
  const hayParaRecoger =
    recogidaPorTipo.platos + recogidaPorTipo.entradas > 0;

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
    const byId = detalleMapById(detalles);
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
    const byId = detalleMapById(p.detalles);
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
    const byId = detalleMapById(p.detalles);
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
          Solo meseros y administrador pueden ver sus pedidos activos.
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
        <Text style={styles.resumenKicker}>Mis mesas activas</Text>
        <Text style={styles.resumenHero}>{mesasActivas}</Text>
        <Text style={styles.resumenHeroLabel}>
          {mesasActivas === 1 ? 'mesa con pedido abierto' : 'mesas con pedidos abiertos'}
        </Text>
        <Text style={styles.resumenSub}>
          {items.length} pedido(s) en curso
          {mesasLista.length > 0
            ? ` · ${mesasLista.map((m) => tituloLugarMesa(m)).join(', ')}`
            : ''}
        </Text>
      </View>

      {hayParaRecoger ? (
        <View style={styles.alertaRecoger}>
          <Text style={styles.alertaRecogerTitle}>Cocina te está esperando</Text>
          <Text style={styles.alertaRecogerSub}>
            {mensajeRecoger.charAt(0).toUpperCase() + mensajeRecoger.slice(1)}.
            Confírmalos en mesa cuando los hayas llevado al comensal.
          </Text>
        </View>
      ) : null}

      {platosAyudaCompaneros > 0 ? (
        <Pressable
          style={styles.alertaAyuda}
          onPress={() => router.push('/(app)/ayuda-companeros')}
        >
          <Text style={styles.alertaAyudaTitle}>Ayudar a un compañero</Text>
          <Text style={styles.alertaAyudaSub}>
            {platosAyudaCompaneros}{' '}
            {platosAyudaCompaneros === 1 ? 'plato' : 'platos'} de otros meseros esperan
            confirmación en mesa. Toca aquí si puedes recogerlos.
          </Text>
        </Pressable>
      ) : null}

      {totalSinCocina > 0 ? (
        <View style={styles.alertaCocina}>
          <Text style={styles.alertaCocinaTitle}>Platos sin pasar a cocina</Text>
          <Text style={styles.alertaCocinaSub}>
            Tienes {totalSinCocina} {totalSinCocina === 1 ? 'plato' : 'platos'} registrados
            que aún no llegaron a cocina. Entra a la mesa y usa «Pasar a cocina» para que
            empiecen a prepararse.
          </Text>
        </View>
      ) : null}

      <View style={styles.headerCard}>
        <Text style={styles.kicker}>Seguimiento</Text>
        <Text style={styles.h1}>Mis pedidos en orden</Text>
        <Text style={styles.sub}>
          Del más antiguo al más reciente. Usa los chips para cambiar de pedido o
          toca «Ir a la mesa» para seguir tomando el pedido.
        </Text>
      </View>

      {itemsOrdenados.length > 1 ? (
        <PedidosActivosChips
          pedidos={itemsOrdenados}
          selectedId={selectedId}
          onSelect={setSelectedId}
          label="Mis pedidos activos"
          style={styles.chipsCard}
        />
      ) : null}

      {itemsOrdenados.length === 0 && (
        <Text style={styles.empty}>No tienes pedidos activos en este momento.</Text>
      )}

      {pedidoSeleccionado ? (() => {
        const p = pedidoSeleccionado;
        const sinCocina = platosSinEnviarCocina(p);
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
                {sinCocina > 0 ? (
                  <View style={styles.pillSinCocina}>
                    <Text style={styles.pillSinCocinaText}>
                      {sinCocina} sin cocina
                    </Text>
                  </View>
                ) : null}
                <View
                  style={[
                    styles.pillPrioridad,
                    p.prioridad_cocina === 'alta'
                      ? styles.pillPrioridadAlta
                      : styles.pillPrioridadBaja,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillPrioridadText,
                      p.prioridad_cocina === 'alta'
                        ? styles.pillPrioridadTextAlta
                        : styles.pillPrioridadTextBaja,
                    ]}
                  >
                    {p.prioridad_cocina === 'alta' ? 'ALTA' : 'BAJA'}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardTitle}>Pedido #{p.id_pedido}</Text>
              <Text style={styles.cardMeta}>
                {p.num_comensales} comensales · {p.estado.replace('_', ' ')}
              </Text>
              <ActionIconBar
                style={styles.cardActions}
                actions={[
                  {
                    key: 'mesa',
                    icon: sinCocina > 0 ? AccionIcon.irCocina : AccionIcon.irMesa,
                    label:
                      sinCocina > 0
                        ? 'Ir a pasar a cocina'
                        : 'Ir a la mesa',
                    variant: sinCocina > 0 ? 'cocina' : 'primary',
                    onPress: () => router.push(`/(app)/mesa/${p.id_mesa}`),
                  },
                  {
                    key: 'reimprimir',
                    icon:
                      reimprimiendoId === p.id_pedido
                        ? 'hourglass-outline'
                        : PedidoIcon.reimprimirComanda,
                    label:
                      reimprimiendoId === p.id_pedido
                        ? 'Imprimiendo…'
                        : 'Reimprimir comanda',
                    variant: 'secondary',
                    disabled: reimprimiendoId === p.id_pedido,
                    onPress: () => reimprimirComanda(p.id_pedido),
                  },
                ]}
              />
            </View>

            <PedidoRecogidaGrupos
              idPedido={p.id_pedido}
              detalles={p.detalles}
              cantidades={cantidadesPedido(p.id_pedido)}
              busyGrupoKey={busyGrupoKey}
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
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.primaryDark,
  },
  resumenKicker: {
    color: colors.primaryMuted,
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
    color: colors.primaryLight,
    marginTop: 2,
  },
  resumenSub: { marginTop: 8, color: colors.primaryMuted, fontSize: 13, lineHeight: 18 },
  alertaCocina: {
    backgroundColor: status.warn.bg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: status.warn.border,
    borderLeftWidth: 5,
    borderLeftColor: status.warn.accent,
  },
  alertaCocinaTitle: {
    color: status.warn.fg,
    fontWeight: '800',
    fontSize: 15,
  },
  alertaCocinaSub: {
    marginTop: 6,
    color: status.warn.fg,
    fontSize: 13,
    lineHeight: 18,
  },
  alertaRecoger: {
    backgroundColor: status.ok.bg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: status.ok.border,
    borderLeftWidth: 5,
    borderLeftColor: status.ok.accent,
  },
  alertaRecogerTitle: {
    color: status.ok.fg,
    fontWeight: '800',
    fontSize: 15,
  },
  alertaRecogerSub: {
    marginTop: 6,
    color: status.ok.accent,
    fontSize: 13,
    lineHeight: 18,
  },
  alertaAyuda: {
    backgroundColor: status.info.bg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: status.info.border,
    borderLeftWidth: 5,
    borderLeftColor: status.info.accent,
  },
  alertaAyudaTitle: {
    color: status.info.fg,
    fontWeight: '800',
    fontSize: 15,
  },
  alertaAyudaSub: {
    marginTop: 6,
    color: status.info.accent,
    fontSize: 13,
    lineHeight: 18,
  },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    ...appShadow('elevated'),
  },
  kicker: { color: colors.textMuted, fontWeight: '700', letterSpacing: 0.3 },
  h1: { fontSize: 22, fontWeight: '800', marginTop: 4, color: colors.text },
  sub: { marginTop: 4, color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  empty: { color: colors.textMuted, marginTop: 8 },
  chipsCard: { marginBottom: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...appShadow('elevated'),
  },
  cardBordeAlta: { borderLeftWidth: 4, borderLeftColor: colors.danger },
  cardBordeBaja: { borderLeftWidth: 4, borderLeftColor: colors.warning },
  cardTop: { marginBottom: 8 },
  rowPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
  },
  pillText: { color: colors.primary, fontWeight: '800' },
  pillSinCocina: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: status.warn.bg,
    borderWidth: 1,
    borderColor: status.warn.border,
  },
  pillSinCocinaText: { color: status.warn.fg, fontWeight: '800', fontSize: 12 },
  pillPrioridad: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillPrioridadAlta: { backgroundColor: colors.dangerLight, borderColor: colors.danger },
  pillPrioridadBaja: { backgroundColor: colors.warningLight, borderColor: colors.warning },
  pillPrioridadText: { fontWeight: '900', fontSize: 12 },
  pillPrioridadTextAlta: { color: colors.dangerText },
  pillPrioridadTextBaja: { color: colors.warningText },
  cardTitle: { fontWeight: '800', color: colors.text, fontSize: 16 },
  cardMeta: { color: colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
  cardActions: { marginTop: 6 },
});
