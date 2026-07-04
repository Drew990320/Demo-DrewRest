import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../src/context/AuthContext';
import { AnimatedEnter } from '../../../src/components/AnimatedEnter';
import { AnimatedPressable } from '../../../src/components/AnimatedPressable';
import { MesasResumenPanel } from '../../../src/components/MesasResumenPanel';
import { ScreenLoading } from '../../../src/components/ScreenLoading';
import { StatusAlertBanner } from '../../../src/components/StatusAlertBanner';
import { appShadow } from '../../../src/lib/shadow';
import { api } from '../../../src/lib/api';
import { useMesasVirtuales } from '../../../src/hooks/useMesasVirtuales';
import { blurWebFocus } from '../../../src/lib/web-a11y';
import { colors } from '../../../src/lib/theme';
import { prefetchMenuToday } from '../../../src/lib/menu-prefetch';
import {
  gridItemWidth,
  useResponsive,
} from '../../../src/hooks/useResponsive';
import { useRefetchOnSync } from '../../../src/hooks/useRefetchOnSync';
import { useConfigSync } from '../../../src/hooks/useConfigSync';
import type { MisActivosResumen } from '../../../src/lib/mis-activos-resumen';
import {
  mensajePendientesCobro,
  type PendientesCobroResumen,
} from '../../../src/lib/pendientes-cobro-resumen';
import { manejarErrorOperacion } from '../../../src/lib/recurso-disponible';
import { mensajeListosParaRecoger } from '../../../src/lib/cocina-pedido-view';
import { usePermisosMesero } from '../../../src/hooks/usePermisosMesero';
import { useScreenScrollPadding } from '../../../src/hooks/useScreenScrollPadding';
import {
  puedeTomarPedidos,
  puedeVerMisPedidos,
} from '../../../src/hooks/usePuedeTomarPedidos';

type MesaRow = {
  id_mesa: number;
  numero: number;
  capacidad: number;
  estado: string;
  mesero?: { nombre: string; apellido: string } | null;
};

function etiquetaMeseroCorto(
  mesero: { nombre: string; apellido: string } | null | undefined,
) {
  if (!mesero) return null;
  const nombre = mesero.nombre.trim();
  return nombre || null;
}

function subtituloMesa(
  estado: string,
  mesero: { nombre: string; apellido: string } | null | undefined,
) {
  if (estado === 'libre') return 'Disponible';
  if (estado === 'ocupada') {
    return etiquetaMeseroCorto(mesero) ?? 'Ocupada';
  }
  return estado;
}

export default function MesasScreen() {
  const { token, user } = useAuth();
  const router = useRouter();
  const r = useResponsive();
  const [mesas, setMesas] = useState<MesaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pedidosMostrador, setPedidosMostrador] = useState(0);
  const [pedidosParaLlevar, setPedidosParaLlevar] = useState(0);
  const [platosSinPasarCocina, setPlatosSinPasarCocina] = useState(0);
  const [platosParaRecoger, setPlatosParaRecoger] = useState(0);
  const [mazorcasParaRecoger, setMazorcasParaRecoger] = useState(0);
  const [platosAyudaCompaneros, setPlatosAyudaCompaneros] = useState(0);
  const [pendientesCobro, setPendientesCobro] =
    useState<PendientesCobroResumen | null>(null);

  const esAdmin = user?.rol === 'admin';
  const esChef = user?.rol === 'chef';
  const { permisos: permMesero } = usePermisosMesero();

  const listBottomPad = useScreenScrollPadding();
  const tomaPedidos = puedeTomarPedidos(user?.rol);
  const mv = useMesasVirtuales();

  useEffect(() => {
    if (esChef) {
      router.replace('/(app)/cocina');
    }
  }, [esChef, router]);

  const load = useCallback(async () => {
    const data = await api<MesaRow[]>('/mesas', { token, cacheKey: 'mesas' });
    setMesas(data);
  }, [token]);

  const loadContadoresVirtuales = useCallback(async () => {
    if (!tomaPedidos || user?.id == null) {
      setPedidosMostrador(0);
      setPedidosParaLlevar(0);
      setPlatosSinPasarCocina(0);
      setPlatosParaRecoger(0);
      setMazorcasParaRecoger(0);
      setPlatosAyudaCompaneros(0);
      return;
    }
    try {
      const [raw, ayuda] = await Promise.all([
        api<MisActivosResumen>('/pedidos/mis-activos/resumen', {
          token,
          cacheKey: `mis_activos_resumen_u${user.id}`,
        }),
        puedeVerMisPedidos(user.rol)
          ? api<{ platos_para_recoger: number }>('/pedidos/ayuda-companeros/resumen', {
              token,
              cacheKey: `ayuda_companeros_resumen_u${user.id}`,
            })
          : Promise.resolve({ platos_para_recoger: 0 }),
      ]);
      setPedidosMostrador(raw.pedidos_mostrador ?? 0);
      setPedidosParaLlevar(raw.pedidos_para_llevar ?? 0);
      setPlatosSinPasarCocina(raw.platos_sin_pasar_cocina ?? 0);
      setPlatosParaRecoger(raw.platos_para_recoger ?? 0);
      setMazorcasParaRecoger(raw.mazorcas_para_recoger ?? 0);
      setPlatosAyudaCompaneros(ayuda.platos_para_recoger ?? 0);
    } catch {
      /* Mantener últimos valores; el banner global indica sin conexión */
    }
  }, [token, tomaPedidos, user?.id, user?.rol]);

  const loadPendientesCobroAdmin = useCallback(async () => {
    if (!esAdmin) {
      setPendientesCobro(null);
      return;
    }
    try {
      const data = await api<PendientesCobroResumen>(
        '/pedidos/pendientes-cobro/resumen',
        { token, cacheKey: 'pendientes_cobro_admin' },
      );
      setPendientesCobro(data);
    } catch {
      /* Mantener último resumen conocido */
    }
  }, [esAdmin, token]);

  const refetchMesas = useCallback(async () => {
    try {
      await Promise.all([
        load(),
        loadContadoresVirtuales(),
        loadPendientesCobroAdmin(),
      ]);
    } catch {
      /* sincronización en segundo plano */
    }
  }, [load, loadContadoresVirtuales, loadPendientesCobroAdmin]);

  useRefetchOnSync(refetchMesas, { source: 'mesas', enabled: !esChef });
  useRefetchOnSync(refetchMesas, { source: 'local-mesas', enabled: !esChef });
  useRefetchOnSync(refetchMesas, { source: 'pedido', enabled: esAdmin });
  useConfigSync(refetchMesas, { enabled: !esChef, scopes: ['mesas', 'categorias'] });

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      prefetchMenuToday(token);
      (async () => {
        try {
          await Promise.all([
            load(),
            loadContadoresVirtuales(),
            loadPendientesCobroAdmin(),
          ]);
        } catch (e) {
          if (!cancelled) {
            await manejarErrorOperacion(e, {
              title: 'No se pudieron cargar las mesas',
              message: 'Revisa la conexión e intenta de nuevo.',
            });
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [load, loadContadoresVirtuales, loadPendientesCobroAdmin]),
  );

  async function onRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([
        load(),
        loadContadoresVirtuales(),
        loadPendientesCobroAdmin(),
      ]);
    } catch (e) {
      await manejarErrorOperacion(e, {
        title: 'No se pudieron actualizar las mesas',
        message: 'Desliza hacia abajo para intentar de nuevo.',
      });
    } finally {
      setRefreshing(false);
    }
  }

  const hayParaRecoger = platosParaRecoger + mazorcasParaRecoger > 0;
  const mensajeRecoger = mensajeListosParaRecoger(
    platosParaRecoger,
    mazorcasParaRecoger,
  );
  const mensajeCobroPendiente =
    pendientesCobro != null ? mensajePendientesCobro(pendientesCobro) : '';

  const disponibles = mesas.filter((m) => m.estado === 'libre').length;
  const ocupadas = mesas.filter((m) => m.estado === 'ocupada').length;
  /** Panel lateral cuando hay espacio (tablet landscape / PC). */
  const showResumenPanel = r.contentWidth >= 720 && mesas.length > 0;
  const RESUMEN_PANEL_W = 220;
  const RESUMEN_GAP = 20;
  const gridWidth = showResumenPanel
    ? Math.max(280, r.contentWidth - RESUMEN_PANEL_W - RESUMEN_GAP)
    : r.contentWidth;
  const gridCols = showResumenPanel
    ? Math.min(r.gridColumns, gridWidth < 580 ? 4 : gridWidth < 760 ? 5 : 6)
    : r.gridColumns;
  const mesaCardWidth = gridItemWidth(gridWidth, gridCols, r.gridGap);

  function estadoColor(estado: string) {
    if (estado === 'libre') return colors.mesaLibre;
    if (estado === 'ocupada') return colors.mesaOcupada;
    return colors.textMuted;
  }

  function cardVisual(estado: string) {
    if (estado === 'libre') {
      return {
        backgroundColor: colors.mesaLibreBg,
        borderColor: colors.mesaLibreBorder,
        borderWidth: 2,
        borderLeftWidth: 5,
        borderLeftColor: colors.success,
      };
    }
    if (estado === 'ocupada') {
      return {
        backgroundColor: colors.mesaOcupadaBg,
        borderColor: colors.mesaOcupadaBorder,
        borderWidth: 2,
        borderLeftWidth: 5,
        borderLeftColor: colors.danger,
      };
    }
    return {
      backgroundColor: colors.surface,
      borderColor: colors.borderLight,
      borderWidth: 1,
      borderLeftWidth: 5,
      borderLeftColor: colors.textHint,
    };
  }

  function rolLabel(rol: string | undefined) {
    if (!rol) return '';
    if (rol === 'mesero') return 'Mesero';
    if (rol === 'chef') return 'Cocina';
    if (rol === 'admin') return 'Administrador';
    return rol;
  }

  if (loading) {
    return <ScreenLoading />;
  }

  return (
    <View
      style={[
        styles.container,
        { paddingHorizontal: r.contentPadding, paddingTop: r.contentPadding },
      ]}
    >
      <AnimatedEnter index={0}>
        <View style={styles.topBar}>
        <Text style={[styles.greeting, { fontSize: r.fontSize.body }]}>
          {user?.nombre} · {rolLabel(user?.rol)}
        </Text>
        </View>
      </AnimatedEnter>

      {esAdmin && mensajeCobroPendiente ? (
        <AnimatedEnter index={0}>
          <StatusAlertBanner
            variant="cobro"
            title="Pedidos sin cobrar"
            message={mensajeCobroPendiente}
            onPress={() => router.push('/(app)/resumen-diario')}
          />
        </AnimatedEnter>
      ) : null}

      {hayParaRecoger && puedeVerMisPedidos(user?.rol) ? (
        <AnimatedEnter index={1}>
          <StatusAlertBanner
            variant="recoger"
            title="Ve a recoger en cocina"
            message={`Cocina tiene ${mensajeRecoger} esperándote. Toca para ver tus pedidos.`}
            onPress={() => router.push('/(app)/mis-pedidos')}
          />
        </AnimatedEnter>
      ) : null}

      {platosSinPasarCocina > 0 && puedeVerMisPedidos(user?.rol) ? (
        <AnimatedEnter index={2}>
          <StatusAlertBanner
            variant="cocina"
            title="Recuerda pasar a cocina"
            message={`Tienes ${platosSinPasarCocina} ${platosSinPasarCocina === 1 ? 'plato' : 'platos'} sin enviar a cocina. Toca para revisar tus pedidos.`}
            onPress={() => router.push('/(app)/mis-pedidos')}
          />
        </AnimatedEnter>
      ) : null}

      {platosAyudaCompaneros > 0 &&
      puedeVerMisPedidos(user?.rol) &&
      permMesero.ayuda_companeros ? (
        <AnimatedEnter index={3}>
          <StatusAlertBanner
            variant="ayuda"
            title="Un compañero necesita ayuda"
            message={`Hay ${platosAyudaCompaneros} ${platosAyudaCompaneros === 1 ? 'plato' : 'platos'} de otros meseros pendientes de recoger.`}
            onPress={() => router.push('/(app)/ayuda-companeros')}
          />
        </AnimatedEnter>
      ) : null}

      <View style={[styles.bodyRow, showResumenPanel && styles.bodyRowWide]}>
        <View style={styles.gridCol}>
          <AnimatedEnter index={4}>
            <View style={styles.sectionHead}>
              <Text style={[styles.h1, { fontSize: r.fontSize.h1 }]}>Mesas</Text>
              {!showResumenPanel && mesas.length > 0 ? (
                <Text style={[styles.countHint, { fontSize: r.fontSize.small }]}>
                  {disponibles} libres · {ocupadas} ocupadas
                </Text>
              ) : null}
            </View>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: colors.success }]}
                />
                <Text style={[styles.legend, { fontSize: r.fontSize.small }]}>
                  Disponible
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: colors.danger }]}
                />
                <Text style={[styles.legend, { fontSize: r.fontSize.small }]}>
                  Ocupada
                </Text>
              </View>
            </View>
          </AnimatedEnter>

          <FlatList
            key={`mesas-grid-${gridCols}-${showResumenPanel ? 'w' : 'n'}`}
            style={styles.list}
            data={mesas}
            keyExtractor={(m) => String(m.id_mesa)}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            numColumns={gridCols}
            columnWrapperStyle={
              gridCols > 1
                ? { gap: r.gridGap, marginBottom: r.gridGap }
                : undefined
            }
            contentContainerStyle={{ paddingBottom: listBottomPad }}
            renderItem={({ item, index }) => (
              <AnimatedEnter
                index={index + 5}
                style={{
                  width: mesaCardWidth,
                  marginBottom: gridCols === 1 ? r.gridGap : 0,
                }}
              >
                <AnimatedPressable
                  style={[
                    styles.card,
                    cardVisual(item.estado),
                    {
                      width: '100%',
                      minHeight: r.mesaCardMinHeight,
                      padding: r.isCompact ? 10 : 12,
                    },
                  ]}
                  onPress={() => {
                    blurWebFocus();
                    router.push(`/(app)/mesa/${item.id_mesa}`);
                  }}
                >
                  <Text
                    style={[styles.cardNum, { fontSize: r.fontSize.cardNum }]}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    {mv.etiquetaMesa(item.numero)}
                  </Text>
                  <Text
                    style={[
                      styles.cardEst,
                      {
                        color: estadoColor(item.estado),
                        fontSize: r.fontSize.small,
                      },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    {subtituloMesa(item.estado, item.mesero)}
                  </Text>
                </AnimatedPressable>
              </AnimatedEnter>
            )}
          />
        </View>

        {showResumenPanel ? (
          <AnimatedEnter index={5}>
            <MesasResumenPanel
              total={mesas.length}
              disponibles={disponibles}
              ocupadas={ocupadas}
            />
          </AnimatedEnter>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    ...appShadow('elevated'),
  },
  greeting: { color: colors.textMuted, textAlign: 'center', fontWeight: '600' },
  bodyRow: { flex: 1 },
  bodyRowWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
  },
  gridCol: { flex: 1, minWidth: 0 },
  list: { flex: 1 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  h1: { fontWeight: '700', color: colors.text, flexShrink: 1 },
  countHint: {
    color: colors.textHint,
    fontWeight: '600',
    flexShrink: 0,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legend: {
    color: colors.textMuted,
    lineHeight: 16,
    fontWeight: '600',
  },
  card: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...appShadow('elevated'),
  },
  cardNum: {
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  cardEst: {
    marginTop: 6,
    fontWeight: '700',
    textAlign: 'center',
  },
});
