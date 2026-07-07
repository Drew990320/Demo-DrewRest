import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useOperacionToolsRail } from '../../src/context/ResumenDiarioToolsRailContext';
import { AnimatedEnter } from '../../src/components/AnimatedEnter';
import { ActionIconBar, type ActionIconItem } from '../../src/components/ActionIconBar';
import { EmptyState } from '../../src/components/EmptyState';
import { PedidoRecogidaGrupos } from '../../src/components/PedidoRecogidaGrupos';
import { LugarPedidoIcon } from '../../src/components/LugarPedidoIcon';
import { PedidosActivosChips } from '../../src/components/PedidosActivosChips';
import {
  PanelPedidoVirtualActivo,
  modoPanelPedidoDesdeMesa,
  type PedidoVirtualDetalle,
} from '../../src/components/PanelPedidoVirtualActivo';
import { ScreenLoading } from '../../src/components/ScreenLoading';
import { ScreenScroll } from '../../src/components/ScreenScroll';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { useConfigOperativa } from '../../src/hooks/useConfigOperativa';
import { api } from '../../src/lib/api';
import { AdminIcon, NavIcon, PedidoIcon } from '../../src/lib/app-icons';
import { showNotice } from '../../src/lib/app-dialog';
import {
  normalizarPedidoCocinaView,
  nombreMeseroPedido,
  ordenarPedidosCocinaPorLlegada,
  platosPendientesRecogerPedido,
  type PedidoCocinaView,
} from '../../src/lib/cocina-pedido-view';
import type { LineaPedidoGrupo } from '../../src/lib/pedido-detalle-group';
import {
  cambiarCantidadGrupoRecogida,
  distribuirRecogidaEnGrupo,
} from '../../src/lib/recogida-parcial';
import {
  esMesaVirtualNumero,
  tituloLugarMesa,
} from '../../src/lib/mesa-label';
import { appShadow } from '../../src/lib/shadow';
import { puedeVerMisPedidos } from '../../src/hooks/usePuedeTomarPedidos';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useSeleccionPedido } from '../../src/hooks/useSeleccionPedido';
import { batchAfectaMisPedidos, joinPedidoRooms } from '../../src/lib/pedido-sync';
import { useRefetchOnSync } from '../../src/hooks/useRefetchOnSync';
import { useVisualTheme } from '../../src/context/VisualThemeContext';
import { useThemedStyles } from '../../src/hooks/useThemedStyles';
import type { AppColors } from '../../src/lib/theme';
import { manejarErrorAccion, manejarErrorOperacion } from '../../src/lib/recurso-disponible';
import { alertarSiSinPapel } from '../../src/lib/alarma-impresora';

type AyudaCompanerosResponse = {
  pedidos: PedidoCocinaView[];
  total_platos_para_recoger: number;
};

export default function AyudaCompanerosScreen() {
  const { colors } = useVisualTheme();
  const styles = useThemedStyles(createAyudaCompanerosStyles);
  const { token, user } = useAuth();
  const { config: opConfig } = useConfigOperativa();
  const router = useRouter();
  const r = useResponsive();
  const puedeVer = puedeVerMisPedidos(user?.rol);
  const [items, setItems] = useState<PedidoCocinaView[]>([]);
  const [totalPlatos, setTotalPlatos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyGrupoKey, setBusyGrupoKey] = useState<string | null>(null);
  const [reimprimiendoId, setReimprimiendoId] = useState<number | null>(null);
  const [cantidadesRecogida, setCantidadesRecogida] = useState<
    Record<number, Record<number, number>>
  >({});
  const [pedidoCompleto, setPedidoCompleto] = useState<PedidoVirtualDetalle | null>(
    null,
  );
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const pedidoIdRef = useRef<number | null>(null);
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

  const cargarDetallePedido = useCallback(
    async (idPedido: number) => {
      setLoadingDetalle(true);
      try {
        const p = await api<PedidoVirtualDetalle>(`/pedidos/${idPedido}`, {
          token,
        });
        setPedidoCompleto(p);
      } catch {
        setPedidoCompleto(null);
      } finally {
        setLoadingDetalle(false);
      }
    },
    [token],
  );

  const refreshPedidoSeleccionado = useCallback(
    async (idPedido?: number | null) => {
      await load();
      const id = idPedido ?? pedidoIdRef.current;
      if (id != null) {
        await cargarDetallePedido(id);
      } else {
        setPedidoCompleto(null);
      }
    },
    [load, cargarDetallePedido],
  );

  useEffect(() => {
    if (!user) return;
    if (!puedeVer) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        await load();
      } catch (e) {
        await manejarErrorOperacion(e, {
          title: 'Ayuda a compañeros',
          message: 'No se pudieron cargar los pedidos.',
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [load, user, puedeVer]);

  useEffect(() => {
    if (!puedeVer) return;
    joinPedidoRooms({ cocina: true });
  }, [puedeVer]);

  useRefetchOnSync(
    async () => {
      try {
        await refreshPedidoSeleccionado();
      } catch {
        /* sincronización en segundo plano */
      }
    },
    {
      enabled: puedeVer,
      source: 'pedido',
      filter: (batch) =>
        batchAfectaMisPedidos(
          batch,
          syncIdsRef.current.mesaIds,
          syncIdsRef.current.pedidoIds,
        ),
    },
  );

  async function onRefresh() {
    setRefreshing(true);
    try {
      await refreshPedidoSeleccionado();
    } catch (e) {
      await manejarErrorOperacion(e, {
        title: 'Ayuda a compañeros',
        message: 'No se pudo actualizar.',
      });
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
      await manejarErrorAccion(e, 'reimprimir la comanda');
    } finally {
      setReimprimiendoId(null);
    }
  }

  const itemsOrdenados = useMemo(
    () => ordenarPedidosCocinaPorLlegada(items),
    [items],
  );

  const { selectedId, setSelectedId, selected: pedidoSeleccionado } =
    useSeleccionPedido(itemsOrdenados);

  useEffect(() => {
    pedidoIdRef.current = pedidoSeleccionado?.id_pedido ?? null;
    if (pedidoSeleccionado?.id_pedido) {
      void cargarDetallePedido(pedidoSeleccionado.id_pedido);
    } else {
      setPedidoCompleto(null);
    }
  }, [pedidoSeleccionado?.id_pedido, cargarDetallePedido]);

  const etiquetaLugarMesa = useCallback(
    (mesaNumero: number) => tituloLugarMesa(mesaNumero, opConfig),
    [opConfig],
  );

  const renderChipPedido = useCallback(
    (p: PedidoCocinaView, selected: boolean) => {
      const tint = selected ? colors.primaryDark : colors.text;
      return (
        <View style={styles.chipContent}>
          <Text style={[styles.chipPedidoId, selected && styles.chipPedidoIdOn]}>
            #{p.id_pedido}
          </Text>
          <LugarPedidoIcon
            mesaNumero={p.mesa_numero}
            config={opConfig}
            color={tint}
          />
        </View>
      );
    },
    [opConfig],
  );

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
      await refreshPedidoSeleccionado(p.id_pedido);
    } catch (e) {
      await manejarErrorAccion(e, 'confirmar la recogida en mesa');
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
      await refreshPedidoSeleccionado(p.id_pedido);
    } catch (e) {
      await manejarErrorAccion(e, 'avisar a cocina');
    } finally {
      setBusyGrupoKey(null);
    }
  }

  const pedidoRail = pedidoSeleccionado ?? itemsOrdenados[0] ?? null;

  const ayudaRailActions = useMemo((): ActionIconItem[] => {
    const actions: ActionIconItem[] = [
      {
        key: 'actualizar',
        icon: refreshing ? 'hourglass-outline' : 'refresh-outline',
        label: refreshing ? 'Actualizando…' : 'Actualizar',
        variant: 'secondary',
        disabled: refreshing,
        onPress: () => void onRefresh(),
      },
      {
        key: 'mis-pedidos',
        icon: NavIcon.misPedidos,
        label: 'Mis pedidos',
        variant: 'secondary',
        disabled: reimprimiendoId != null,
        onPress: () => router.push('/(app)/mis-pedidos'),
      },
    ];
    if (pedidoRail) {
      const lugar = etiquetaLugarMesa(pedidoRail.mesa_numero);
      actions.push({
        key: 'reimprimir',
        icon:
          reimprimiendoId === pedidoRail.id_pedido
            ? 'hourglass-outline'
            : PedidoIcon.reimprimirComanda,
        label:
          reimprimiendoId === pedidoRail.id_pedido
            ? 'Imprimiendo…'
            : `Reimprimir · ${lugar}`,
        variant: 'secondary',
        disabled: reimprimiendoId != null,
        onPress: () => void reimprimirComanda(pedidoRail.id_pedido),
      });
    }
    return actions;
  }, [pedidoRail, refreshing, reimprimiendoId, etiquetaLugarMesa, router]);

  useOperacionToolsRail(
    r.navSidebar && puedeVer,
    {
      sectionTitle: 'Ayuda',
      actions: ayudaRailActions,
      hint: pedidoRail
        ? `${etiquetaLugarMesa(pedidoRail.mesa_numero)} · ${nombreMeseroPedido(pedidoRail)}.`
        : 'Cuando un compañero tenga platos listos, aparecerán aquí.',
    },
    [ayudaRailActions, pedidoRail?.id_pedido, totalPlatos],
  );

  if (!user || loading) {
    return <ScreenLoading />;
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
    <ScreenScroll
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
          {items.length} pedido(s) de compañeros en orden de llegada.
        </Text>
      </View>

      <ScreenHeader
        eyebrow="Compañeros"
        title="Pedidos que puedes recoger"
        subtitle="Toca un pedido para ver ítems y ayudar en mesa. Confirma recogida o avisa a cocina si falta algo."
      >
        <Pressable
          style={styles.linkMisPedidos}
          onPress={() => router.push('/(app)/mis-pedidos')}
        >
          <Text style={styles.linkMisPedidosText}>← Volver a mis pedidos</Text>
        </Pressable>
      </ScreenHeader>

      {itemsOrdenados.length >= 1 ? (
        <PedidosActivosChips
          pedidos={itemsOrdenados}
          selectedId={selectedId}
          onSelect={setSelectedId}
          label="Pedidos de compañeros"
          minPedidos={1}
          renderChip={renderChipPedido}
          style={styles.chipsCard}
        />
      ) : null}

      {itemsOrdenados.length === 0 ? (
        <EmptyState
          title="Nada pendiente"
          message="Ningún compañero tiene platos por recoger en este momento."
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
                    <LugarPedidoIcon
                      mesaNumero={p.mesa_numero}
                      config={opConfig}
                      color={colors.info}
                    />
                    {esMesaVirtualNumero(p.mesa_numero, opConfig) ? (
                      <Text style={styles.pillText}>
                        {etiquetaLugarMesa(p.mesa_numero)}
                      </Text>
                    ) : null}
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
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>Pedido #{p.id_pedido}</Text>
                  <LugarPedidoIcon
                    mesaNumero={p.mesa_numero}
                    config={opConfig}
                    color={colors.text}
                  />
                </View>
                <Text style={styles.cardMeta}>
                  Mesero: {nombreMeseroPedido(p)} · {p.num_comensales} comensales
                </Text>
              </View>

              {loadingDetalle ? (
                <Text style={styles.loadingDetalle}>Cargando ítems…</Text>
              ) : pedidoCompleto ? (
                <PanelPedidoVirtualActivo
                  pedido={pedidoCompleto}
                  modo={modoPanelPedidoDesdeMesa(p.mesa_numero, opConfig)}
                  token={token}
                  onRefresh={() => refreshPedidoSeleccionado(p.id_pedido)}
                  mostrarEncabezado={false}
                  mostrarCancelar={false}
                  mostrarCobrar={false}
                  accionesExtra={[
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
                  extra={
                    <>
                      <Text style={styles.recogidaTitle}>
                        Recogida en mesa · aviso a cocina
                      </Text>
                      <Text style={styles.recogidaHint}>
                        Solo platos listos para recoger. Confirma en mesa o avisa
                        si cocina aún no entregó.
                      </Text>
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
                    </>
                  }
                />
              ) : (
                <Text style={styles.loadingDetalle}>
                  No se pudo cargar el detalle del pedido.
                </Text>
              )}
            </View>
          </AnimatedEnter>
        );
      })() : null}
    </ScreenScroll>
  );
}

function createAyudaCompanerosStyles(c: AppColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background, padding: 16 },
  cardEnter: { marginBottom: 0 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: c.background,
  },
  denied: { textAlign: 'center', color: c.textMuted, marginBottom: 16, fontSize: 16 },
  resumenCard: {
    backgroundColor: c.info,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: c.infoText,
  },
  resumenKicker: {
    color: c.onInfoMuted,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  resumenHero: {
    fontSize: 44,
    fontWeight: '900',
    color: c.onPrimary,
    marginTop: 4,
    lineHeight: 48,
  },
  resumenHeroLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: c.onPrimary,
    marginTop: 2,
  },
  resumenSub: { marginTop: 8, color: c.onPrimaryMuted, fontSize: 13, lineHeight: 18 },
  linkMisPedidos: {
    marginTop: 12,
    alignSelf: 'center',
    minWidth: 220,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surfaceMuted,
  },
  linkMisPedidosText: {
    color: c.text,
    fontWeight: '800',
    fontSize: 14,
    textAlign: 'center',
  },
  chipsCard: { marginBottom: 12 },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipPedidoId: {
    fontWeight: '800',
    color: c.text,
    fontVariant: ['tabular-nums'],
  },
  chipPedidoIdOn: { color: c.primaryDark },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  card: {
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: c.border,
    ...appShadow,
  },
  cardBordeAlta: { borderLeftWidth: 4, borderLeftColor: c.danger, borderColor: c.dangerBorder },
  cardBordeBaja: { borderLeftWidth: 4, borderLeftColor: c.warning, borderColor: c.warningBorder },
  cardTop: { marginBottom: 4 },
  rowPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: c.infoLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: { fontSize: 12, fontWeight: '800', color: c.info },
  pillMesero: {
    backgroundColor: c.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillMeseroText: { fontSize: 12, fontWeight: '800', color: c.primaryDark },
  pillRecoger: {
    backgroundColor: c.successLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillRecogerText: { fontSize: 12, fontWeight: '800', color: c.successText },
  cardTitle: { fontSize: 18, fontWeight: '800', color: c.text },
  cardMeta: { marginTop: 4, color: c.textMuted, fontSize: 13 },
  loadingDetalle: {
    marginTop: 12,
    fontSize: 14,
    color: c.textMuted,
    textAlign: 'center',
    paddingVertical: 8,
  },
  recogidaTitle: {
    fontWeight: '800',
    fontSize: 15,
    color: c.text,
    marginBottom: 4,
  },
  recogidaHint: {
    fontSize: 12,
    color: c.textMuted,
    lineHeight: 17,
    marginBottom: 8,
  },
});
}
