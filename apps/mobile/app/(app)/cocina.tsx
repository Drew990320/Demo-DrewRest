import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { ActionIconBar } from '../../src/components/ActionIconBar';
import { IconTooltipButton } from '../../src/components/IconTooltipButton';
import { api } from '../../src/lib/api';
import { PedidoIcon, NavIcon, AdminIcon } from '../../src/lib/app-icons';
import { alertarSiSinPapel } from '../../src/lib/alarma-impresora';
import { showBriefNotice, showNotice } from '../../src/lib/app-dialog';
import { appShadow } from '../../src/lib/shadow';
import { tituloLugarMesa } from '../../src/lib/mesa-label';
import {
  agruparLineasCocinaVisibles,
  agruparPlatosPendientes,
  normalizarPedidoCocinaView,
  ordenarPedidosCocinaPorLlegada,
  pedidoActivoEnCocina,
  porcionesVisiblesEnCocina,
  type PedidoCocinaView,
} from '../../src/lib/cocina-pedido-view';
import { puedeVerCocina } from '../../src/hooks/usePuedeTomarPedidos';
import { useResponsive } from '../../src/hooks/useResponsive';
import { joinPedidoRooms, subscribeCocinaFaltaPlato } from '../../src/lib/pedido-sync';
import { useRefetchOnSync } from '../../src/hooks/useRefetchOnSync';
import { colors } from '../../src/lib/theme';

type CocinaResponse = {
  pedidos: PedidoCocinaView[];
};

function parseCocinaPayload(
  raw: CocinaResponse | PedidoCocinaView[],
): PedidoCocinaView[] {
  return (Array.isArray(raw) ? raw : (raw.pedidos ?? [])).map(
    normalizarPedidoCocinaView,
  );
}

function nombreMeseroCorto(p: PedidoCocinaView): string {
  const m = p.mesero;
  if (!m) return 'Mesero';
  const nombre = (m.nombre ?? '').trim();
  const apellido = (m.apellido ?? '').trim();
  if (!nombre && !apellido) return 'Mesero';
  if (!apellido) return nombre;
  return `${nombre} ${apellido.charAt(0)}.`;
}

export default function CocinaScreen() {
  const { token, user, logout } = useAuth();
  const router = useRouter();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const puedeVer = puedeVerCocina(user?.rol);
  const [items, setItems] = useState<PedidoCocinaView[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [llamandoId, setLlamandoId] = useState<number | null>(null);
  const [reimprimiendoId, setReimprimiendoId] = useState<number | null>(null);
  const [listoBusyKey, setListoBusyKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!puedeVer) {
      setItems([]);
      return;
    }
    const raw = await api<CocinaResponse | PedidoCocinaView[]>('/pedidos/cocina', {
      token,
      cacheKey: user?.id != null ? `pedidos_cocina_u${user.id}` : 'pedidos_cocina',
    });
    setItems(parseCocinaPayload(raw));
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

  useRefetchOnSync(load, { enabled: puedeVer, source: 'pedido' });

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  async function llamarMesero(idPedido: number) {
    setLlamandoId(idPedido);
    try {
      await api(`/pedidos/${idPedido}/llamar-mesero`, {
        method: 'POST',
        token,
      });
      await load();
    } catch (e) {
      Alert.alert(
        'Error',
        e instanceof Error ? e.message : 'No se pudo llamar al mesero',
      );
    } finally {
      setLlamandoId(null);
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
      await showBriefNotice(
        'Cocina',
        e instanceof Error ? e.message : 'No se pudo actualizar',
        'error',
      );
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
      const imp = res.impresion_comanda;
      await showNotice(
        imp?.impreso ? 'Comanda reimpresa' : 'Sin imprimir',
        imp?.impreso
          ? `Ticket impreso (${imp.destino ?? 'impresora'}).`
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

  const pedidoPrimeroEnCola = cola[0] ?? null;

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
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 16) + 96,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.topBar}>
          <Text style={[styles.greeting, { fontSize: r.fontSize.body }]}>
            {user.nombre} · Cocina
          </Text>
          <IconTooltipButton
            icon={NavIcon.cerrarSesion}
            label="Cerrar sesión"
            variant="danger"
            onPress={async () => {
              await logout();
              router.replace('/(auth)/login');
            }}
          />
        </View>

        <View style={styles.resumenBar}>
          <View style={styles.resumenMain}>
            <Text style={styles.resumenNum}>{totalPlatos}</Text>
            <View style={styles.resumenHeadText}>
              <Text style={styles.resumenLabel}>
                {totalPlatos === 1 ? 'plato en cocina' : 'platos en cocina'}
              </Text>
              <Text style={styles.resumenMeta}>
                {cola.length} {cola.length === 1 ? 'pedido' : 'pedidos'} · orden
                de llegada
              </Text>
            </View>
          </View>
        </View>

        {cola.length > 0 || resumenPlatos.length > 0 ? (
          <View style={styles.resumenPanel}>
            {cola.length > 0 ? (
              <View style={styles.colaMesasBlock}>
                <Text style={styles.colaMesasTitle}>Cola de mesas</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.colaMesasRow}
                >
                  {cola.map((p, idx) => {
                    const porciones = porcionesVisiblesEnCocina(p);
                    return (
                      <View
                        key={p.id_pedido}
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
                          {porciones} {porciones === 1 ? 'plato' : 'platos'}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            {resumenPlatos.length > 0 ? (
              <View style={styles.platosGrid}>
                {resumenPlatos.map((p) => (
                  <View key={p.nombre} style={styles.platoChip}>
                    <View style={styles.platoChipQtyWrap}>
                      <Text style={styles.platoChipQty}>{p.total}</Text>
                    </View>
                    <Text style={styles.platoChipNombre} numberOfLines={2}>
                      {p.nombre}
                    </Text>
                    <Text style={styles.platoChipMesas} numberOfLines={2}>
                      {p.mesas.map((m) => tituloLugarMesa(m)).join(' · ')}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {cola.length === 0 ? (
          <Text style={styles.empty}>
            {items.length === 0
              ? 'Sin pedidos en cocina.'
              : 'Todo recogido o aún no llegan comandas.'}
          </Text>
        ) : (
          cola.map((p, idx) => {
            const lineas = agruparLineasCocinaVisibles(p.detalles);
            return (
              <View key={p.id_pedido} style={styles.card}>
                <View style={styles.cardHead}>
                  <View style={styles.colaPosBadge}>
                    <Text style={styles.colaPosBadgeText}>#{idx + 1}</Text>
                  </View>
                  <View style={styles.cardHeadLeft}>
                    <Text style={styles.mesaTitle}>
                      {tituloLugarMesa(p.mesa_numero)}
                    </Text>
                    <Text style={styles.cardSub}>
                      #{p.id_pedido} · {nombreMeseroCorto(p)} ·{' '}
                      {p.num_comensales}{' '}
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
                    return (
                      <View
                        key={grupoKey}
                        style={[
                          styles.linea,
                          d.es_acompanamiento_mazorca && styles.lineaMazorca,
                          listo && styles.lineaListo,
                          listoParcial && styles.lineaListoParcial,
                        ]}
                      >
                        <View style={styles.lineaMain}>
                          <View style={styles.lineaQtyBadge}>
                            <Text style={styles.lineaQtyText}>{d.cantidad}</Text>
                          </View>
                          <View style={styles.lineaBody}>
                            <Text style={styles.lineaNombre}>
                              {d.nombre_producto}
                            </Text>
                            {d.nota_cocina ? (
                              <Text style={styles.lineaNota}>↳ {d.nota_cocina}</Text>
                            ) : null}
                            {d.personalizaciones &&
                            d.personalizaciones.length > 0 ? (
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
                            onPress={() =>
                              marcarListoGrupo(d.ids_detalle, !listo)
                            }
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
          })
        )}
      </ScrollView>

      {pedidoPrimeroEnCola ? (
        <View
          style={[
            styles.fabAnchor,
            { bottom: Math.max(insets.bottom, 12) + 8 },
          ]}
        >
          <View style={styles.fabHint}>
            <Text style={styles.fabHintText} numberOfLines={1}>
              #1 · {tituloLugarMesa(pedidoPrimeroEnCola.mesa_numero)}
            </Text>
          </View>
          <IconTooltipButton
            icon={
              llamandoId === pedidoPrimeroEnCola.id_pedido
                ? 'hourglass-outline'
                : 'notifications'
            }
            label={
              llamandoId === pedidoPrimeroEnCola.id_pedido
                ? 'Avisando al mesero…'
                : `Avisar mesero · ${tituloLugarMesa(pedidoPrimeroEnCola.mesa_numero)} · ${nombreMeseroCorto(pedidoPrimeroEnCola)}`
            }
            variant="cocina"
            size={28}
            fixedSize
            disabled={llamandoId === pedidoPrimeroEnCola.id_pedido}
            onPress={() => llamarMesero(pedidoPrimeroEnCola.id_pedido)}
            style={styles.fabBtn}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: 16 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  denied: {
    textAlign: 'center',
    color: colors.textMuted,
    marginBottom: 16,
    fontSize: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  greeting: { color: colors.textMuted, fontWeight: '700', flex: 1 },
  resumenBar: {
    backgroundColor: colors.primaryDark,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  resumenPanel: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...appShadow('soft'),
  },
  resumenMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  resumenHeadText: { flex: 1 },
  resumenNum: {
    fontSize: 44,
    fontWeight: '900',
    color: colors.surface,
    lineHeight: 48,
    minWidth: 52,
    textAlign: 'center',
  },
  resumenLabel: {
    color: colors.surface,
    fontWeight: '800',
    fontSize: 17,
  },
  resumenMeta: {
    color: colors.primaryMuted,
    fontSize: 13,
    marginTop: 2,
  },
  colaMesasBlock: { gap: 6 },
  colaMesasTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  colaMesasRow: { gap: 8, paddingVertical: 2 },
  mesaColaChip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 88,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mesaColaChipFirst: {
    backgroundColor: colors.secondaryLight,
    borderColor: colors.secondary,
    borderWidth: 2,
  },
  mesaColaPos: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '900',
  },
  mesaColaPosFirst: {
    color: colors.secondaryDark,
  },
  mesaColaNombre: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  mesaColaPorciones: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  platosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  platoChip: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    width: '48%',
    minWidth: 140,
    flexGrow: 1,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  platoChipQtyWrap: {
    alignSelf: 'flex-start',
    minWidth: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  platoChipQty: {
    color: colors.surface,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 24,
  },
  platoChipNombre: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 17,
  },
  platoChipMesas: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    lineHeight: 14,
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 15,
    marginTop: 24,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...appShadow('elevated'),
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  colaPosBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 36,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  colaPosBadgeText: {
    color: colors.surface,
    fontWeight: '900',
    fontSize: 14,
  },
  cardHeadLeft: { flex: 1 },
  mesaTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
  },
  cardSub: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  comanda: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
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
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  lineaQtyText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '900',
  },
  lineaBody: { flex: 1, gap: 2, paddingTop: 2 },
  lineaListoBtn: { flexShrink: 0, marginTop: 2 },
  lineaMazorca: {
    backgroundColor: colors.warningLight,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  lineaListo: {
    borderColor: colors.successBorder,
    backgroundColor: colors.successLight,
  },
  lineaListoParcial: {
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 8,
    padding: 8,
    backgroundColor: colors.secondaryLight,
  },
  lineaListoText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.successText,
    paddingLeft: 46,
  },
  lineaNombre: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 21,
  },
  lineaNota: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '600',
    paddingLeft: 4,
  },
  lineaPers: {
    fontSize: 13,
    color: colors.textMuted,
  },
  fabAnchor: {
    position: 'absolute',
    right: 16,
    alignItems: 'center',
    gap: 6,
  },
  fabHint: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 140,
    ...appShadow('soft'),
  },
  fabHintText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  fabBtn: {
    ...appShadow('elevated'),
  },
});
