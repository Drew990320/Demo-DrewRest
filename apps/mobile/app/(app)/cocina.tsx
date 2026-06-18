import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { ActionIconBar } from '../../src/components/ActionIconBar';
import { IconTooltipButton } from '../../src/components/IconTooltipButton';
import { api } from '../../src/lib/api';
import { AccionIcon, AdminIcon, NavIcon, PedidoIcon } from '../../src/lib/app-icons';
import { alertarSiSinPapel } from '../../src/lib/alarma-impresora';
import { showBriefNotice, showNotice } from '../../src/lib/app-dialog';
import { appShadow } from '../../src/lib/shadow';
import { tituloLugarMesa } from '../../src/lib/mesa-label';
import {
  agruparPlatosPendientes,
  normalizarPedidoCocinaView,
  ordenarDetallesCocina,
  pedidoActivoEnCocina,
  type PedidoCocinaView,
} from '../../src/lib/cocina-pedido-view';
import { puedeVerCocina } from '../../src/hooks/usePuedeTomarPedidos';
import { useResponsive } from '../../src/hooks/useResponsive';
import { joinPedidoRooms, subscribeCocinaFaltaPlato } from '../../src/lib/pedido-sync';
import { useRefetchOnSync } from '../../src/hooks/useRefetchOnSync';

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
  const esAdmin = user?.rol === 'admin';
  const puedeVer = puedeVerCocina(user?.rol);
  const [items, setItems] = useState<PedidoCocinaView[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [llamandoId, setLlamandoId] = useState<number | null>(null);
  const [prioridadBusyId, setPrioridadBusyId] = useState<number | null>(null);
  const [reimprimiendoId, setReimprimiendoId] = useState<number | null>(null);
  const [listoBusyId, setListoBusyId] = useState<number | null>(null);

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
      load().catch(() => undefined);
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

  async function setPrioridadCocina(
    idPedido: number,
    modo: 'alta' | 'baja' | 'auto',
  ) {
    setPrioridadBusyId(idPedido);
    try {
      await api(`/pedidos/${idPedido}/prioridad-cocina`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ modo }),
      });
      await load();
    } catch (e) {
      Alert.alert(
        'Error',
        e instanceof Error ? e.message : 'No se pudo actualizar la prioridad',
      );
    } finally {
      setPrioridadBusyId(null);
    }
  }

  async function marcarListoDetalle(idDetalle: number, listo: boolean) {
    setListoBusyId(idDetalle);
    try {
      await api(`/pedidos/detalles/${idDetalle}/listo-para-recoger`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ listo_para_recoger: listo }),
      });
      await load();
    } catch (e) {
      await showBriefNotice(
        'Cocina',
        e instanceof Error ? e.message : 'No se pudo actualizar',
        'error',
      );
    } finally {
      setListoBusyId(null);
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

  const resumenPlatos = useMemo(() => agruparPlatosPendientes(items), [items]);

  const totalPlatos = useMemo(
    () => resumenPlatos.reduce((acc, p) => acc + p.total, 0),
    [resumenPlatos],
  );

  const totalAlta = useMemo(
    () =>
      resumenPlatos
        .filter((p) => !p.esCerdo)
        .reduce((acc, p) => acc + p.total, 0),
    [resumenPlatos],
  );

  const totalCerdo = useMemo(
    () =>
      resumenPlatos
        .filter((p) => p.esCerdo)
        .reduce((acc, p) => acc + p.total, 0),
    [resumenPlatos],
  );

  const cola = useMemo(
    () =>
      [...items]
        .filter(pedidoActivoEnCocina)
        .sort(
          (a, b) =>
            new Date(a.creado_en).getTime() - new Date(b.creado_en).getTime(),
        ),
    [items],
  );

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 24 }}
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
          <View>
            <Text style={styles.resumenLabel}>
              {totalPlatos === 1 ? 'plato en cocina' : 'platos en cocina'}
            </Text>
            <Text style={styles.resumenMeta}>
              {cola.length} {cola.length === 1 ? 'pedido' : 'pedidos'}
              {totalCerdo > 0
                ? ` · Alta ${totalAlta} · Cerdo ${totalCerdo}`
                : totalPlatos > 0
                  ? ` · prioridad alta`
                  : ''}
            </Text>
          </View>
        </View>
        {resumenPlatos.length > 0 ? (
          <View style={styles.chipRow}>
            {resumenPlatos.map((p) => (
              <View
                key={p.nombre}
                style={[styles.chip, p.esCerdo && styles.chipCerdo]}
              >
                <Text style={[styles.chipText, p.esCerdo && styles.chipTextCerdo]}>
                  {p.total}× {p.nombre}
                </Text>
                <Text style={styles.chipMesas}>
                  {p.mesas.map((m) => tituloLugarMesa(m)).join(', ')}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {cola.length === 0 ? (
        <Text style={styles.empty}>
          {items.length === 0
            ? 'Sin pedidos en cocina.'
            : 'Todo recogido o aún no llegan comandas.'}
        </Text>
      ) : (
        cola.map((p) => {
          const lineas = ordenarDetallesCocina(p.detalles);
          const esBaja = p.prioridad_cocina === 'baja';
          return (
            <View
              key={p.id_pedido}
              style={[
                styles.card,
                esBaja ? styles.cardBaja : styles.cardAlta,
              ]}
            >
              <View style={styles.cardHead}>
                <View style={styles.cardHeadLeft}>
                  <Text style={styles.mesaTitle}>
                    {tituloLugarMesa(p.mesa_numero)}
                  </Text>
                  <Text style={styles.cardSub}>
                    #{p.id_pedido} · {nombreMeseroCorto(p)} · {p.num_comensales}{' '}
                    {p.num_comensales === 1 ? 'comensal' : 'comensales'}
                  </Text>
                </View>
                {esBaja ? (
                  <View style={styles.badgeBaja}>
                    <Text style={styles.badgeBajaText}>Cerdo</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.comanda}>
                {lineas.map((d) => (
                  <View
                    key={d.id_detalle}
                    style={[
                      styles.linea,
                      d.es_acompanamiento_mazorca && styles.lineaMazorca,
                      d.listo_para_recoger && styles.lineaListo,
                    ]}
                  >
                    <Text style={styles.lineaNombre}>
                      {d.cantidad}× {d.nombre_producto}
                    </Text>
                    {d.nota_cocina ? (
                      <Text style={styles.lineaNota}>↳ {d.nota_cocina}</Text>
                    ) : null}
                    {d.personalizaciones.length > 0 ? (
                      <Text style={styles.lineaPers}>
                        {d.personalizaciones.map((x) => x.descripcion).join(' · ')}
                      </Text>
                    ) : null}
                    <View style={styles.lineaFoot}>
                      <IconTooltipButton
                        icon={
                          d.listo_para_recoger
                            ? 'close-circle-outline'
                            : 'checkmark-circle-outline'
                        }
                        label={
                          d.listo_para_recoger
                            ? 'Quitar aviso de listo'
                            : 'Marcar listo para recoger'
                        }
                        variant={d.listo_para_recoger ? 'secondary' : 'primary'}
                        size={20}
                        disabled={listoBusyId === d.id_detalle}
                        onPress={() =>
                          marcarListoDetalle(d.id_detalle, !d.listo_para_recoger)
                        }
                      />
                      {d.listo_para_recoger ? (
                        <Text style={styles.lineaListoText}>Lista en el pase</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>

              <ActionIconBar
                style={styles.cardFoot}
                actions={[
                  {
                    key: 'llamar',
                    icon:
                      llamandoId === p.id_pedido
                        ? 'hourglass-outline'
                        : AccionIcon.llamarMesero,
                    label:
                      llamandoId === p.id_pedido
                        ? 'Avisando…'
                        : `Avisar mesero · pedido listo (${nombreMeseroCorto(p)})`,
                    variant: 'primary',
                    disabled: llamandoId === p.id_pedido,
                    onPress: () => llamarMesero(p.id_pedido),
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

              {esAdmin ? (
                <View style={styles.prioRow}>
                  <Text style={styles.prioLabel}>Prioridad:</Text>
                  {(['auto', 'alta', 'baja'] as const).map((modo) => {
                    const activo =
                      modo === 'auto'
                        ? p.prioridad_cocina_origen === 'auto'
                        : p.prioridad_cocina_override === modo;
                    return (
                      <Pressable
                        key={modo}
                        disabled={prioridadBusyId === p.id_pedido}
                        onPress={() => setPrioridadCocina(p.id_pedido, modo)}
                        style={[styles.prioChip, activo && styles.prioChipOn]}
                      >
                        <Text
                          style={[
                            styles.prioChipText,
                            activo && styles.prioChipTextOn,
                          ]}
                        >
                          {modo === 'auto' ? 'Auto' : modo === 'alta' ? 'Alta' : 'Baja'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f4ee', padding: 16 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f6f4ee',
  },
  denied: {
    textAlign: 'center',
    color: '#6f6e67',
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
  greeting: { color: '#6f6e67', fontWeight: '700', flex: 1 },
  resumenBar: {
    backgroundColor: '#1e4d3a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  resumenMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  resumenNum: {
    fontSize: 40,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 44,
    minWidth: 48,
  },
  resumenLabel: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  resumenMeta: {
    color: '#b8d9cc',
    fontSize: 13,
    marginTop: 2,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: '100%',
  },
  chipCerdo: { backgroundColor: 'rgba(201,162,39,0.25)' },
  chipText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  chipTextCerdo: { color: '#ffe9a8' },
  chipMesas: { color: '#b8d9cc', fontSize: 11, marginTop: 2 },
  empty: {
    color: '#6f6e67',
    textAlign: 'center',
    fontSize: 15,
    marginTop: 24,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e2d8',
    ...appShadow('elevated'),
  },
  cardAlta: { borderLeftWidth: 4, borderLeftColor: '#2f8f5f' },
  cardBaja: { borderLeftWidth: 4, borderLeftColor: '#c9a227' },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardHeadLeft: { flex: 1 },
  mesaTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#262622',
  },
  cardSub: {
    color: '#6f6e67',
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  badgeBaja: {
    backgroundColor: '#fff8e6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e8d9a8',
  },
  badgeBajaText: {
    color: '#8a6a1a',
    fontWeight: '800',
    fontSize: 11,
  },
  comanda: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ece9df',
    gap: 8,
  },
  linea: { gap: 2 },
  lineaMazorca: {
    backgroundColor: '#faf6eb',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e8d9a8',
  },
  lineaListo: {
    borderColor: '#2f5e4f',
    backgroundColor: '#f0f7f4',
  },
  lineaFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  lineaListoText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2f5e4f',
  },
  lineaNombre: {
    fontSize: 17,
    fontWeight: '800',
    color: '#262622',
  },
  lineaNota: {
    fontSize: 14,
    color: '#a26a2f',
    fontWeight: '600',
    paddingLeft: 4,
  },
  lineaPers: {
    fontSize: 13,
    color: '#6f6e67',
    paddingLeft: 4,
  },
  cardFoot: { marginTop: 10 },
  prioRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ece9df',
  },
  prioLabel: { fontSize: 12, color: '#6f6e67', fontWeight: '600' },
  prioChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#f6f4ee',
    borderWidth: 1,
    borderColor: '#e5e2d8',
  },
  prioChipOn: {
    backgroundColor: '#2f5e4f',
    borderColor: '#2f5e4f',
  },
  prioChipText: { fontSize: 12, fontWeight: '700', color: '#6f6e67' },
  prioChipTextOn: { color: '#fff' },
});
