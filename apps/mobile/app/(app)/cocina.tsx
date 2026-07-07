import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useCocinaToolsRail } from '../../src/context/ResumenDiarioToolsRailContext';
import { ActionIconBar, type ActionIconItem } from '../../src/components/ActionIconBar';
import { AnimatedEnter } from '../../src/components/AnimatedEnter';
import { EmptyState } from '../../src/components/EmptyState';
import { IconTooltipButton } from '../../src/components/IconTooltipButton';
import { ScreenLoading } from '../../src/components/ScreenLoading';
import { api } from '../../src/lib/api';
import { PedidoIcon, AdminIcon } from '../../src/lib/app-icons';
import { alertarSiSinPapel } from '../../src/lib/alarma-impresora';
import { notificarResultadoImpresion } from '../../src/lib/impresion-resultado';
import { showBriefNotice, showNotice } from '../../src/lib/app-dialog';
import { manejarErrorAccion, manejarErrorOperacion } from '../../src/lib/recurso-disponible';
import { tituloLugarMesa } from '../../src/lib/mesa-label';
import { useVisualTheme } from '../../src/context/VisualThemeContext';
import { useThemedStyles } from '../../src/hooks/useThemedStyles';
import type { AppColors } from '../../src/lib/theme';
import {
  agruparLineasCocinaVisibles,
  agruparPlatosPendientes,
  conteoPorTipoEnCocina,
  etiquetaTipoLineaCocina,
  ordenarPedidosCocinaPorLlegada,
  pedidoActivoEnCocina,
  porcionesVisiblesEnCocina,
  textoResumenTiposCocina,
  tipoLineaCocina,
  type PedidoCocinaView,
  type TipoLineaCocina,
} from '../../src/lib/cocina-pedido-view';
import { notaCocinaVisibleUsuario } from '../../src/lib/nota-cocina-ui';
import { puedeVerCocina } from '../../src/hooks/usePuedeTomarPedidos';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useScreenScrollPadding } from '../../src/hooks/useScreenScrollPadding';
import { joinPedidoRooms, subscribeCocinaFaltaPlato } from '../../src/lib/pedido-sync';
import { useRefetchOnSync } from '../../src/hooks/useRefetchOnSync';
import {
  getCachedCocinaQueue,
  loadCocinaQueue,
} from '../../src/lib/cocina-queue-store';

type CocinaResponse = {
  pedidos: PedidoCocinaView[];
};

function nombreMeseroCorto(p: PedidoCocinaView): string {
  const m = p.mesero;
  if (!m) return 'Mesero';
  const nombre = (m.nombre ?? '').trim();
  const apellido = (m.apellido ?? '').trim();
  if (!nombre && !apellido) return 'Mesero';
  if (!apellido) return nombre;
  return `${nombre} ${apellido.charAt(0)}.`;
}

function tipoLineaUi(c: AppColors): Record<
  TipoLineaCocina,
  {
    qtyBg: string;
    chipBg: string;
    chipBorder: string;
    badgeBg: string;
    badgeText: string;
  }
> {
  return {
    plato: {
      qtyBg: c.primary,
      chipBg: c.backgroundAlt,
      chipBorder: c.borderLight,
      badgeBg: c.primaryLight,
      badgeText: c.primaryDark,
    },
    entrada: {
      qtyBg: c.cocina,
      chipBg: c.secondaryLight,
      chipBorder: c.secondary,
      badgeBg: c.secondaryLight,
      badgeText: c.secondaryDark,
    },
    adicional: {
      qtyBg: c.info,
      chipBg: c.infoLight,
      chipBorder: c.infoBorder,
      badgeBg: c.infoLight,
      badgeText: c.infoText,
    },
    mazorca: {
      qtyBg: c.warningDark,
      chipBg: c.warningLight,
      chipBorder: c.warningBorder,
      badgeBg: c.warningLight,
      badgeText: c.warningText,
    },
    sopa: {
      qtyBg: c.cocina,
      chipBg: c.secondaryLight,
      chipBorder: c.secondary,
      badgeBg: c.secondaryLight,
      badgeText: c.secondaryDark,
    },
  };
}

export default function CocinaScreen() {
  const { colors } = useVisualTheme();
  const styles = useThemedStyles(createCocinaStyles);
  const tipoUi = useMemo(() => tipoLineaUi(colors), [colors]);
  const { token, user } = useAuth();
  const router = useRouter();
  const r = useResponsive();
  const listBottomPad = useScreenScrollPadding();
  const puedeVer = puedeVerCocina(user?.rol);
  const [items, setItems] = useState<PedidoCocinaView[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reimprimiendoId, setReimprimiendoId] = useState<number | null>(null);
  const [listoBusyKey, setListoBusyKey] = useState<string | null>(null);
  const [llamandoMeseroId, setLlamandoMeseroId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!puedeVer) {
      setItems([]);
      return;
    }
    const cached = getCachedCocinaQueue();
    if (cached) {
      setItems(cached);
    }
    const items = await loadCocinaQueue(() =>
      api<CocinaResponse | PedidoCocinaView[]>('/pedidos/cocina', {
        token,
        cacheKey: user?.id != null ? `pedidos_cocina_u${user.id}` : 'pedidos_cocina',
      }),
    );
    setItems(items);
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
      } catch (e) {
        await manejarErrorOperacion(e, {
          title: 'Cocina',
          message: 'No se pudo cargar la cola de cocina.',
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [load, user, puedeVer]);

  useEffect(() => {
    joinPedidoRooms({ cocina: true });
  }, []);

  useEffect(() => {
    if (!puedeVer) return;
    return subscribeCocinaFaltaPlato((payload) => {
      void showBriefNotice(
        'Falta en cocina',
        `${payload.meseroNombre} no encontró ${payload.cantidad}× ${payload.productoNombre} en ${tituloLugarMesa(payload.mesaNumero)}.`,
        'warning',
      );
    });
  }, [load, puedeVer]);

  useRefetchOnSync(
    async () => {
      try {
        await load();
      } catch {
        /* sincronización en segundo plano */
      }
    },
    { enabled: puedeVer, source: 'pedido' },
  );

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } catch (e) {
      await manejarErrorOperacion(e, {
        title: 'Cocina',
        message: 'No se pudo actualizar la cola de cocina.',
      });
    } finally {
      setRefreshing(false);
    }
  }

  async function marcarListoGrupo(ids: number[], listo: boolean) {
    const busyKey = ids.join('-');
    setListoBusyKey(busyKey);
    try {
      await Promise.all(
        ids.map((idDetalle) =>
          api(`/pedidos/detalles/${idDetalle}/listo-para-recoger`, {
            method: 'PATCH',
            token,
            body: JSON.stringify({ listo_para_recoger: listo }),
          }),
        ),
      );
      await load();
    } catch (e) {
      await manejarErrorOperacion(e, {
        title: 'Cocina',
        message: 'No se pudo actualizar el estado del plato.',
      });
    } finally {
      setListoBusyKey(null);
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
          codigo_error?: string;
        };
      }>(`/pedidos/${idPedido}/reimprimir-comanda`, {
        method: 'POST',
        token,
      });
      if (alertarSiSinPapel(res)) {
        return;
      }
      await notificarResultadoImpresion(
        res.impresion_comanda,
        {
          titulo: 'Comanda reimpresa',
          mensaje: `Ticket impreso (${res.impresion_comanda?.destino ?? 'impresora'}).`,
        },
        { titulo: 'Sin imprimir' },
      );
    } catch (e) {
      await manejarErrorAccion(e, 'reimprimir la comanda');
    } finally {
      setReimprimiendoId(null);
    }
  }

  async function llamarMesero(idPedido: number) {
    setLlamandoMeseroId(idPedido);
    try {
      await api(`/pedidos/${idPedido}/llamar-mesero`, {
        method: 'POST',
        token,
      });
      await load();
    } catch (e) {
      await manejarErrorAccion(e, 'llamar al mesero');
    } finally {
      setLlamandoMeseroId(null);
    }
  }

  const cola = useMemo(
    () => ordenarPedidosCocinaPorLlegada(items.filter(pedidoActivoEnCocina)),
    [items],
  );

  const colaMesas = useMemo(
    () => cola.map((p) => p.mesa_numero),
    [cola],
  );

  const resumenPlatos = useMemo(
    () => agruparPlatosPendientes(items, colaMesas),
    [items, colaMesas],
  );

  const totalPlatos = useMemo(
    () => resumenPlatos.reduce((acc, p) => acc + p.total, 0),
    [resumenPlatos],
  );

  const conteoTipos = useMemo(() => conteoPorTipoEnCocina(items), [items]);
  const textoTipos = useMemo(
    () => textoResumenTiposCocina(conteoTipos),
    [conteoTipos],
  );

  const pedidoPrimeroCola = cola[0] ?? null;

  const cocinaRailActions = useMemo((): ActionIconItem[] => {
    const actions: ActionIconItem[] = [
      {
        key: 'actualizar',
        icon: refreshing ? 'hourglass-outline' : 'refresh-outline',
        label: refreshing ? 'Actualizando…' : 'Actualizar cola',
        variant: 'secondary',
        disabled: refreshing,
        onPress: () => void onRefresh(),
      },
    ];
    if (pedidoPrimeroCola) {
      const lugar = tituloLugarMesa(pedidoPrimeroCola.mesa_numero);
      actions.push({
        key: 'llamar-mesero',
        icon:
          llamandoMeseroId === pedidoPrimeroCola.id_pedido
            ? 'hourglass-outline'
            : 'megaphone',
        label:
          llamandoMeseroId === pedidoPrimeroCola.id_pedido
            ? 'Avisando al mesero…'
            : `Llamar mesero · ${lugar}`,
        variant: 'cocina',
        disabled:
          llamandoMeseroId != null ||
          reimprimiendoId != null,
        onPress: () => void llamarMesero(pedidoPrimeroCola.id_pedido),
      });
      actions.push({
        key: 'reimprimir-primero',
        icon:
          reimprimiendoId === pedidoPrimeroCola.id_pedido
            ? 'hourglass-outline'
            : PedidoIcon.reimprimirComanda,
        label:
          reimprimiendoId === pedidoPrimeroCola.id_pedido
            ? 'Imprimiendo…'
            : `Reimprimir ${lugar}`,
        variant: 'secondary',
        disabled: reimprimiendoId != null || llamandoMeseroId != null,
        badge: cola.length > 0 ? cola.length : undefined,
        onPress: () => void reimprimirComanda(pedidoPrimeroCola.id_pedido),
      });
    }
    return actions;
  }, [cola.length, pedidoPrimeroCola, refreshing, reimprimiendoId, llamandoMeseroId]);

  useCocinaToolsRail(
    r.navSidebar && puedeVer,
    {
      cocinaActions: cocinaRailActions,
      cocinaHint:
        cola.length > 0
          ? `Acciones sobre el primer pedido (${nombreMeseroCorto(pedidoPrimeroCola!)}). Pulsa actualizar si no ves cambios.`
          : 'Actualiza cuando lleguen comandas nuevas.',
    },
    [cocinaRailActions, cola.length],
  );

  const listHeader = useMemo(
    () => (
      <>
        <AnimatedEnter index={0}>
          <View style={styles.topBar}>
            <Text style={[styles.greeting, { fontSize: r.fontSize.body }]}>
              {user?.nombre} · Cocina
            </Text>
          </View>
        </AnimatedEnter>

        <AnimatedEnter index={1}>
          <View style={styles.resumenCard}>
            <Text style={styles.resumenKicker}>En cocina ahora</Text>
            <View style={styles.resumenMain}>
              <Text style={styles.resumenNum}>{totalPlatos}</Text>
              <View style={styles.resumenHeadText}>
                <Text style={styles.resumenLabel}>
                  {totalPlatos === 1 ? 'ítem en cocina' : 'ítems en cocina'}
                </Text>
                <Text style={styles.resumenMeta}>
                  {textoTipos || `${totalPlatos} pendientes`}
                  {' · '}
                  {cola.length} {cola.length === 1 ? 'pedido' : 'pedidos'} · orden
                  de llegada
                </Text>
              </View>
            </View>
          </View>
        </AnimatedEnter>

        {cola.length > 0 || resumenPlatos.length > 0 ? (
          <View style={styles.resumenPanel}>
            {cola.length > 0 ? (
              <View style={styles.colaMesasBlock}>
                <Text style={styles.colaMesasTitle}>Cola de mesas</Text>
                <FlatList
                  horizontal
                  data={cola}
                  keyExtractor={(p) => String(p.id_pedido)}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.colaMesasRow}
                  renderItem={({ item: p, index: idx }) => {
                    const porciones = porcionesVisiblesEnCocina(p);
                    const tiposPedido = textoResumenTiposCocina(
                      conteoPorTipoEnCocina([p]),
                    );
                    return (
                      <View
                        style={[
                          styles.mesaColaChip,
                          idx === 0 && styles.mesaColaChipFirst,
                        ]}
                      >
                        <Text
                          style={[
                            styles.mesaColaPos,
                            idx === 0 && styles.mesaColaPosFirst,
                          ]}
                        >
                          #{idx + 1}
                        </Text>
                        <Text style={styles.mesaColaNombre}>
                          {tituloLugarMesa(p.mesa_numero)}
                        </Text>
                        <Text style={styles.mesaColaPorciones}>
                          {porciones} {porciones === 1 ? 'ítem' : 'ítems'}
                        </Text>
                        {tiposPedido ? (
                          <Text style={styles.mesaColaTipos} numberOfLines={2}>
                            {tiposPedido}
                          </Text>
                        ) : null}
                      </View>
                    );
                  }}
                />
              </View>
            ) : null}

            {resumenPlatos.length > 0 ? (
              <View style={styles.platosGrid}>
                {resumenPlatos.map((p) => {
                  const ui = tipoUi[p.tipo];
                  return (
                    <View
                      key={p.nombre}
                      style={[
                        styles.platoChip,
                        {
                          backgroundColor: ui.chipBg,
                          borderColor: ui.chipBorder,
                        },
                      ]}
                    >
                      <View style={styles.platoChipTopRow}>
                        <View
                          style={[
                            styles.platoChipQtyWrap,
                            { backgroundColor: ui.qtyBg },
                          ]}
                        >
                          <Text style={styles.platoChipQty}>{p.total}</Text>
                        </View>
                        <View
                          style={[
                            styles.tipoBadge,
                            { backgroundColor: ui.badgeBg },
                          ]}
                        >
                          <Text
                            style={[styles.tipoBadgeText, { color: ui.badgeText }]}
                          >
                            {etiquetaTipoLineaCocina(p.tipo)}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.platoChipNombre} numberOfLines={2}>
                        {p.nombre}
                      </Text>
                      <Text style={styles.platoChipMesas} numberOfLines={2}>
                        {p.mesas.map((m) => tituloLugarMesa(m)).join(' · ')}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </View>
        ) : null}
      </>
    ),
    [
      cola,
      resumenPlatos,
      r.fontSize.body,
      styles,
      textoTipos,
      tipoUi,
      totalPlatos,
      user?.nombre,
    ],
  );

  const listEmpty = useMemo(
    () => (
      <EmptyState
        title={
          items.length === 0 ? 'Sin pedidos en cocina' : 'Cola vacía por ahora'
        }
        message={
          items.length === 0
            ? 'Cuando lleguen comandas aparecerán aquí en orden de llegada.'
            : 'Todo fue recogido o aún no hay comandas nuevas.'
        }
      />
    ),
    [items.length],
  );

  const renderPedidoItem = useCallback(
    ({ item: p, index: idx }: { item: PedidoCocinaView; index: number }) => {
      const lineas = agruparLineasCocinaVisibles(p.detalles);
      return (
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.colaPosBadge}>
              <Text style={styles.colaPosBadgeText}>#{idx + 1}</Text>
            </View>
            <View style={styles.cardHeadLeft}>
              <Text style={styles.mesaTitle}>
                {tituloLugarMesa(p.mesa_numero)}
              </Text>
              <Text style={styles.cardSub}>
                #{p.id_pedido} · {nombreMeseroCorto(p)} · {p.num_comensales}{' '}
                {p.num_comensales === 1 ? 'comensal' : 'comensales'}
              </Text>
            </View>
            <IconTooltipButton
              icon={
                reimprimiendoId === p.id_pedido
                  ? 'hourglass-outline'
                  : PedidoIcon.reimprimirComanda
              }
              label={
                reimprimiendoId === p.id_pedido
                  ? 'Imprimiendo…'
                  : 'Reimprimir comanda'
              }
              variant="secondary"
              size={20}
              fixedSize
              disabled={reimprimiendoId === p.id_pedido}
              onPress={() => reimprimirComanda(p.id_pedido)}
            />
          </View>

          <View style={styles.comanda}>
            {lineas.map((d) => {
              const grupoKey = d.ids_detalle.join('-');
              const listo = d.listo_para_recoger;
              const listoParcial = d.listo_para_recoger_parcial;
              const tipo = tipoLineaCocina(d);
              const ui = tipoUi[tipo];
              const notaVisible = notaCocinaVisibleUsuario(d.nota_cocina);
              return (
                <View
                  key={grupoKey}
                  style={[
                    styles.linea,
                    tipo === 'mazorca' && styles.lineaMazorca,
                    listo && styles.lineaListo,
                    listoParcial && styles.lineaListoParcial,
                    !listo &&
                      !listoParcial &&
                      tipo !== 'mazorca' && {
                        backgroundColor: ui.chipBg,
                        borderRadius: 8,
                        padding: 8,
                        borderWidth: 1,
                        borderColor: ui.chipBorder,
                      },
                  ]}
                >
                  <View style={styles.lineaMain}>
                    <View
                      style={[
                        styles.lineaQtyBadge,
                        { backgroundColor: ui.qtyBg },
                      ]}
                    >
                      <Text style={styles.lineaQtyText}>{d.cantidad}</Text>
                    </View>
                    <View style={styles.lineaBody}>
                      <View style={styles.lineaTitleRow}>
                        <Text style={styles.lineaNombre}>
                          {d.nombre_producto}
                        </Text>
                        <View
                          style={[
                            styles.tipoBadge,
                            { backgroundColor: ui.badgeBg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.tipoBadgeText,
                              { color: ui.badgeText },
                            ]}
                          >
                            {etiquetaTipoLineaCocina(tipo)}
                          </Text>
                        </View>
                      </View>
                      {notaVisible ? (
                        <Text style={styles.lineaNota}>↳ {notaVisible}</Text>
                      ) : null}
                      {d.personalizaciones && d.personalizaciones.length > 0 ? (
                        <Text style={styles.lineaPers}>
                          {d.personalizaciones
                            .map((x) => x.descripcion)
                            .join(' · ')}
                        </Text>
                      ) : null}
                    </View>
                    <IconTooltipButton
                      icon={
                        listo
                          ? 'close-circle-outline'
                          : 'checkmark-circle-outline'
                      }
                      label={
                        listo
                          ? 'Quitar aviso de listo'
                          : listoParcial
                            ? 'Marcar todo el grupo listo'
                            : 'Marcar listo para recoger'
                      }
                      variant={listo ? 'secondary' : 'primary'}
                      size={22}
                      fixedSize
                      disabled={listoBusyKey === grupoKey}
                      onPress={() => marcarListoGrupo(d.ids_detalle, !listo)}
                      style={styles.lineaListoBtn}
                    />
                  </View>
                  {listo ? (
                    <Text style={styles.lineaListoText}>Lista en el pase</Text>
                  ) : listoParcial ? (
                    <Text style={styles.lineaListoText}>Parte lista</Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      );
    },
    [
      listoBusyKey,
      reimprimiendoId,
      styles,
      tipoUi,
    ],
  );

  if (!user || loading) {
    return <ScreenLoading />;
  }

  if (!puedeVer) {
    return (
      <View style={styles.center}>
        <Text style={styles.denied}>
          Solo chef y administrador pueden ver cocina.
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
    <View style={styles.screen}>
      <FlashList
        style={styles.list}
        data={cola}
        keyExtractor={(p) => String(p.id_pedido)}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        renderItem={renderPedidoItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{
          paddingHorizontal: r.contentPadding,
          paddingTop: r.contentPadding,
          paddingBottom: listBottomPad,
          flexGrow: cola.length === 0 ? 1 : undefined,
        }}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

function createCocinaStyles(c: AppColors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  list: { flex: 1 },
  container: { flex: 1, padding: 16 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: c.background,
  },
  denied: {
    textAlign: 'center',
    color: c.textMuted,
    marginBottom: 16,
    fontSize: 16,
  },
  topBar: {
    marginBottom: 12,
    backgroundColor: c.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  greeting: { color: c.textMuted, fontWeight: '600', textAlign: 'center' },
  resumenCard: {
    backgroundColor: c.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.primaryDark,
  },
  resumenKicker: {
    color: c.onPrimaryMuted,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  resumenPanel: {
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
  },
  resumenMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 4,
  },
  resumenHeadText: { flex: 1 },
  resumenNum: {
    fontSize: 44,
    fontWeight: '900',
    color: c.onPrimary,
    lineHeight: 48,
    minWidth: 52,
    textAlign: 'center',
  },
  resumenLabel: {
    color: c.onPrimary,
    fontWeight: '800',
    fontSize: 17,
  },
  resumenMeta: {
    color: c.onPrimaryMuted,
    fontSize: 13,
    marginTop: 2,
  },
  colaMesasBlock: { gap: 6 },
  colaMesasTitle: {
    color: c.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  colaMesasRow: { gap: 8, paddingVertical: 2 },
  mesaColaChip: {
    backgroundColor: c.surfaceMuted,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 88,
    borderWidth: 1,
    borderColor: c.border,
  },
  mesaColaChipFirst: {
    backgroundColor: c.secondaryLight,
    borderColor: c.secondary,
    borderWidth: 2,
  },
  mesaColaPos: {
    color: c.textMuted,
    fontSize: 12,
    fontWeight: '900',
  },
  mesaColaPosFirst: {
    color: c.secondaryDark,
  },
  mesaColaNombre: {
    color: c.text,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  mesaColaPorciones: {
    color: c.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  mesaColaTipos: {
    color: c.textHint,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
    lineHeight: 13,
  },
  platosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  platoChip: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    width: '48%',
    minWidth: 140,
    flexGrow: 1,
    borderWidth: 1,
  },
  platoChipTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 6,
  },
  platoChipQtyWrap: {
    minWidth: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  platoChipQty: {
    color: c.onPrimary,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 24,
  },
  platoChipNombre: {
    color: c.text,
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 17,
  },
  platoChipMesas: {
    color: c.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    lineHeight: 14,
  },
  card: {
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  colaPosBadge: {
    backgroundColor: c.primary,
    borderRadius: 10,
    minWidth: 36,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  colaPosBadgeText: {
    color: c.onPrimary,
    fontWeight: '900',
    fontSize: 14,
  },
  cardHeadLeft: { flex: 1 },
  mesaTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: c.text,
  },
  cardSub: {
    color: c.textMuted,
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  comanda: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.borderLight,
    gap: 8,
  },
  linea: { gap: 4 },
  lineaMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  lineaQtyBadge: {
    minWidth: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  lineaQtyText: {
    color: c.onPrimary,
    fontSize: 18,
    fontWeight: '900',
  },
  lineaBody: { flex: 1, gap: 2, paddingTop: 2 },
  lineaTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 6,
  },
  tipoBadge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    flexShrink: 0,
  },
  tipoBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  lineaListoBtn: { flexShrink: 0, marginTop: 2 },
  lineaMazorca: {
    backgroundColor: c.warningLight,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: c.warningBorder,
  },
  lineaListo: {
    borderColor: c.successBorder,
    backgroundColor: c.successLight,
  },
  lineaListoParcial: {
    borderWidth: 1,
    borderColor: c.secondary,
    borderRadius: 8,
    padding: 8,
    backgroundColor: c.secondaryLight,
  },
  lineaListoText: {
    fontSize: 13,
    fontWeight: '700',
    color: c.successText,
    paddingLeft: 46,
  },
  lineaNombre: {
    fontSize: 17,
    fontWeight: '800',
    color: c.text,
    lineHeight: 21,
  },
  lineaNota: {
    fontSize: 14,
    color: c.secondary,
    fontWeight: '600',
    paddingLeft: 4,
  },
  lineaPers: {
    fontSize: 13,
    color: c.textMuted,
  },
});
}
