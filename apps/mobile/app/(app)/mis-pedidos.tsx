import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
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
import { ScreenScroll } from '../../src/components/ScreenScroll';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { ScreenLoading } from '../../src/components/ScreenLoading';
import { useConfigOperativa } from '../../src/hooks/useConfigOperativa';
import { StatusAlertBanner } from '../../src/components/StatusAlertBanner';
import { AdminIcon, PedidoIcon } from '../../src/lib/app-icons';
import { api } from '../../src/lib/api';
import { alertarSiSinPapel } from '../../src/lib/alarma-impresora';
import { showNotice } from '../../src/lib/app-dialog';
import { manejarErrorAccion, manejarErrorOperacion } from '../../src/lib/recurso-disponible';
import { colors, status } from '../../src/lib/theme';
import {
  detalleMapById,
  mesasActivasDePedidos,
  normalizarPedidoCocinaView,
  ordenarPedidosCocinaPorLlegada,
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
import {
  esMesaVirtualNumero,
  tituloLugarMesa,
} from '../../src/lib/mesa-label';
import { puedeVerMisPedidos } from '../../src/hooks/usePuedeTomarPedidos';
import { useSeleccionPedido } from '../../src/hooks/useSeleccionPedido';
import { pedidoCocinaAPanel } from '../../src/lib/pedido-panel-adapt';
import { batchAfectaMisPedidos, joinPedidoRooms } from '../../src/lib/pedido-sync';
import { useRefetchOnSync } from '../../src/hooks/useRefetchOnSync';

type MisActivosResponse = {
  pedidos: PedidoCocinaView[];
  mesas_activas: number;
};

export default function MisPedidosScreen() {
  const { token, user } = useAuth();
  const { config: opConfig } = useConfigOperativa();
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
  const [pedidoCompleto, setPedidoCompleto] = useState<PedidoVirtualDetalle | null>(
    null,
  );
  const [loadingDetalle, setLoadingDetalle] = useState(false);
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

  const cargarDetallePedido = useCallback(
    async (idPedido: number) => {
      setLoadingDetalle(true);
      try {
        const p = await api<PedidoVirtualDetalle>(`/pedidos/${idPedido}`, {
          token,
        });
        if (selectedIdRef.current === idPedido) {
          setPedidoCompleto(p);
        }
      } catch {
        if (selectedIdRef.current === idPedido) {
          setPedidoCompleto(null);
        }
      } finally {
        if (selectedIdRef.current === idPedido) {
          setLoadingDetalle(false);
        }
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

  const pedidoIdRef = useRef<number | null>(null);
  const selectedIdRef = useRef<number | null>(null);

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
          title: 'Mis pedidos',
          message: 'No se pudieron cargar tus pedidos.',
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
        title: 'Mis pedidos',
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
    selectedIdRef.current = pedidoSeleccionado?.id_pedido ?? null;
    if (pedidoSeleccionado?.id_pedido) {
      void cargarDetallePedido(pedidoSeleccionado.id_pedido);
    } else {
      setPedidoCompleto(null);
    }
  }, [pedidoSeleccionado?.id_pedido, cargarDetallePedido]);

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

  const accionesExtraPedido = useMemo((): ActionIconItem[] => {
    if (!pedidoSeleccionado) return [];
    const id = pedidoSeleccionado.id_pedido;
    return [
      {
        key: 'reimprimir',
        icon:
          reimprimiendoId === id
            ? 'hourglass-outline'
            : PedidoIcon.reimprimirComanda,
        label:
          reimprimiendoId === id ? 'Imprimiendo…' : 'Reimprimir comanda',
        variant: 'secondary',
        disabled: reimprimiendoId === id,
        onPress: () => reimprimirComanda(id),
      },
    ];
  }, [pedidoSeleccionado?.id_pedido, reimprimiendoId]);

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
      await refreshPedidoSeleccionado(p.id_pedido);
    } catch (e) {
      await manejarErrorAccion(e, 'confirmar la recogida en mesa');
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
      await refreshPedidoSeleccionado(p.id_pedido);
    } catch (e) {
      await manejarErrorAccion(e, 'avisar a cocina');
    } finally {
      setBusyGrupoKey(null);
    }
  }

  if (!user || loading) {
    return <ScreenLoading />;
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
    <ScreenScroll
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
            ? ` · ${mesasLista.map((m) => etiquetaLugarMesa(m)).join(', ')}`
            : ''}
        </Text>
      </View>

      {hayParaRecoger ? (
        <StatusAlertBanner
          variant="recoger"
          title="Cocina te está esperando"
          message={`${mensajeRecoger.charAt(0).toUpperCase()}${mensajeRecoger.slice(1)}. Confírmalos en mesa cuando los hayas llevado al comensal.`}
        />
      ) : null}

      {platosAyudaCompaneros > 0 ? (
        <StatusAlertBanner
          variant="ayuda"
          title="Ayudar a un compañero"
          message={`${platosAyudaCompaneros} ${platosAyudaCompaneros === 1 ? 'plato' : 'platos'} de otros meseros esperan confirmación en mesa. Toca para ver la lista.`}
          onPress={() => router.push('/(app)/ayuda-companeros')}
        />
      ) : null}

      {totalSinCocina > 0 ? (
        <StatusAlertBanner
          variant="cocina"
          title="Platos sin pasar a cocina"
          message={`Tienes ${totalSinCocina} ${totalSinCocina === 1 ? 'plato' : 'platos'} registrados que aún no llegaron a cocina. Usa «Pasar a cocina» en el pedido de abajo.`}
        />
      ) : null}

      <ScreenHeader
        eyebrow="Seguimiento"
        title="Mis pedidos en orden"
        subtitle="Toca un pedido para ver ítems, editar cantidades y cobrar. Abajo, confirma recogida en mesa o avisa a cocina si falta algo."
      />

      {itemsOrdenados.length >= 1 ? (
        <PedidosActivosChips
          pedidos={itemsOrdenados}
          selectedId={selectedId}
          onSelect={setSelectedId}
          label="Mis pedidos activos"
          minPedidos={1}
          renderChip={renderChipPedido}
          style={styles.chipsCard}
        />
      ) : null}

      {itemsOrdenados.length === 0 ? (
        <EmptyState
          title="Sin pedidos activos"
          message="Cuando abras una mesa, mostrador o para llevar, aparecerá aquí."
          actions={[
            {
              key: 'mesas',
              icon: AdminIcon.volverMesas,
              label: 'Ir a mesas',
              variant: 'primary',
              onPress: () => router.replace('/(app)/mesas'),
            },
          ]}
        />
      ) : null}

      {pedidoSeleccionado ? (() => {
        const p = pedidoSeleccionado;
        const sinCocina = platosSinEnviarCocina(p);
        const pedidoPanel =
          pedidoCompleto?.id_pedido === p.id_pedido
            ? pedidoCompleto
            : pedidoCocinaAPanel(p);
        const actualizandoPanel =
          loadingDetalle &&
          (pedidoCompleto?.id_pedido !== p.id_pedido || !pedidoCompleto);
        return (
        <AnimatedEnter index={0} style={styles.cardEnter}>
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
                    color={colors.text}
                  />
                  {esMesaVirtualNumero(p.mesa_numero, opConfig) ? (
                    <Text style={styles.pillText}>
                      {etiquetaLugarMesa(p.mesa_numero)}
                    </Text>
                  ) : null}
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
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>Pedido #{p.id_pedido}</Text>
                <LugarPedidoIcon
                  mesaNumero={p.mesa_numero}
                  config={opConfig}
                  color={colors.text}
                />
              </View>
              <Text style={styles.cardMeta}>
                {p.num_comensales} comensales · {p.estado.replace('_', ' ')}
              </Text>
            </View>

            <PanelPedidoVirtualActivo
              pedido={pedidoPanel}
              modo={modoPanelPedidoDesdeMesa(p.mesa_numero, opConfig)}
              token={token}
              onRefresh={() => refreshPedidoSeleccionado(p.id_pedido)}
              mostrarEncabezado={false}
              actualizando={actualizandoPanel}
              accionesExtra={accionesExtraPedido}
              extra={
                  <>
                    <Text style={styles.recogidaTitle}>
                      Recogida en mesa · aviso a cocina
                    </Text>
                    <Text style={styles.recogidaHint}>
                      Confirma lo que llevaste al comensal o avisa si cocina aún
                      no entregó una unidad.
                    </Text>
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
                  </>
                }
              />
          </View>
        </AnimatedEnter>
        );
      })() : null}
    </ScreenScroll>
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
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
    fontSize: 40,
    fontWeight: '700',
    color: colors.surface,
    marginTop: 4,
    lineHeight: 44,
  },
  resumenHeroLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryLight,
    marginTop: 2,
  },
  resumenSub: { marginTop: 8, color: colors.primaryMuted, fontSize: 13, lineHeight: 18 },
  chipsCard: { marginBottom: 12 },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipPedidoId: {
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  chipPedidoIdOn: { color: colors.primaryDark },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardBordeAlta: { borderLeftWidth: 4, borderLeftColor: colors.danger },
  cardBordeBaja: { borderLeftWidth: 4, borderLeftColor: colors.warning },
  cardTop: { marginBottom: 8 },
  rowPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  cardTitle: { fontWeight: '800', color: colors.text, fontSize: 16, marginTop: 0 },
  cardMeta: { color: colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
  loadingDetalle: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 8,
  },
  recogidaTitle: {
    fontWeight: '800',
    fontSize: 15,
    color: colors.text,
    marginBottom: 4,
  },
  recogidaHint: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
    marginBottom: 8,
  },
});
