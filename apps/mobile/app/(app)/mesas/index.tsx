import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../src/context/AuthContext';
import { useVisualTheme } from '../../../src/context/VisualThemeContext';
import { AnimatedEnter } from '../../../src/components/AnimatedEnter';
import { MesaTarjeta } from '../../../src/components/MesaTarjeta';
import { MesasResumenPanel } from '../../../src/components/MesasResumenPanel';
import { ScreenLoading } from '../../../src/components/ScreenLoading';
import { StatusAlertBanner } from '../../../src/components/StatusAlertBanner';
import { appShadow } from '../../../src/lib/shadow';
import { api } from '../../../src/lib/api';
import { useMesasVirtuales } from '../../../src/hooks/useMesasVirtuales';
import { useThemedStyles } from '../../../src/hooks/useThemedStyles';
import { blurWebFocus } from '../../../src/lib/web-a11y';
import type { AppColors } from '../../../src/lib/theme';
import { mesaGridColumns } from '../../../src/lib/mesa-chrome';
import { prefetchMenuToday } from '../../../src/lib/menu-prefetch';
import {
  gridItemWidth,
  useResponsive,
} from '../../../src/hooks/useResponsive';
import { useRefetchOnSync } from '../../../src/hooks/useRefetchOnSync';
import { useConfigSync } from '../../../src/hooks/useConfigSync';
import { useOperativosResumen } from '../../../src/hooks/useOperativosResumen';
import { useThrottledCallback } from '../../../src/hooks/useThrottledCallback';
import { mensajePendientesCobro } from '../../../src/lib/pendientes-cobro-resumen';
import { manejarErrorOperacion } from '../../../src/lib/recurso-disponible';
import { mensajeListosParaRecoger } from '../../../src/lib/cocina-pedido-view';
import { usePermisosMesero } from '../../../src/hooks/usePermisosMesero';
import { useScreenScrollPadding } from '../../../src/hooks/useScreenScrollPadding';
import {
  puedeVerMisPedidos,
} from '../../../src/hooks/usePuedeTomarPedidos';

const MESAS_SYNC_THROTTLE_MS = 1_500;

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

function createMesasStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    topBar: {
      marginBottom: 12,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 14,
      ...appShadow('elevated'),
    },
    greeting: { color: c.textMuted, textAlign: 'center', fontWeight: '600' },
    bodyRow: { flex: 1, minWidth: 0 },
    bodyRowWide: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 20,
    },
    bodyRowWeb: { flex: 1, minHeight: 0, overflow: 'hidden' as const },
    gridCol: { flex: 1, minWidth: 0, minHeight: 0 },
    listPane: { flex: 1, minWidth: 0, minHeight: 0 },
    list: { flex: 1 },
    sectionHead: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 8,
    },
    h1: { fontWeight: '700', color: c.text, flexShrink: 1 },
    countHint: {
      color: c.textHint,
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
      color: c.textMuted,
      lineHeight: 16,
      fontWeight: '600',
    },
  });
}

export default function MesasScreen() {
  const { colors, chrome, layout } = useVisualTheme();
  const styles = useThemedStyles(useCallback(createMesasStyles, []));
  const { token, user } = useAuth();
  const router = useRouter();
  const r = useResponsive();
  const [mesas, setMesas] = useState<MesaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const esAdmin = user?.rol === 'admin';
  const esChef = user?.rol === 'chef';
  const { permisos: permMesero } = usePermisosMesero();

  const {
    misActivos,
    ayudaPlatosParaRecoger,
    pendientesCobro,
    refresh: refreshOperativos,
  } = useOperativosResumen(!esChef);

  const platosSinPasarCocina = misActivos?.platos_sin_pasar_cocina ?? 0;
  const platosParaRecoger = misActivos?.platos_para_recoger ?? 0;
  const mazorcasParaRecoger = misActivos?.mazorcas_para_recoger ?? 0;
  const platosAyudaCompaneros = ayudaPlatosParaRecoger;

  const listBottomPad = useScreenScrollPadding();
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

  const refetchMesas = useCallback(async () => {
    try {
      await Promise.all([load(), refreshOperativos()]);
    } catch {
      /* sincronización en segundo plano */
    }
  }, [load, refreshOperativos]);

  const scheduleRefetch = useThrottledCallback(refetchMesas, MESAS_SYNC_THROTTLE_MS);

  useRefetchOnSync(scheduleRefetch, { source: 'mesas', enabled: !esChef });
  useRefetchOnSync(scheduleRefetch, { source: 'local-mesas', enabled: !esChef });
  useRefetchOnSync(scheduleRefetch, { source: 'pedido', enabled: esAdmin && !esChef });
  useConfigSync(scheduleRefetch, { enabled: !esChef, scopes: ['mesas'] });

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      prefetchMenuToday(token);
      (async () => {
        try {
          await Promise.all([load(), refreshOperativos()]);
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
    }, [load, refreshOperativos]),
  );

  async function onRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([load(), refreshOperativos()]);
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
  const baseGridCols = showResumenPanel
    ? Math.min(r.gridColumns, gridWidth < 580 ? 4 : gridWidth < 760 ? 5 : 6)
    : r.gridColumns;
  const gridCols = mesaGridColumns(baseGridCols, chrome.mesaVista, chrome.mesaForma);
  const mesaCardWidth = gridItemWidth(gridWidth, gridCols, r.gridGap);
  const esVistaLista = chrome.mesaVista === 'lista';

  function rolLabel(rol: string | undefined) {
    if (!rol) return '';
    if (rol === 'mesero') return 'Mesero';
    if (rol === 'chef') return 'Cocina';
    if (rol === 'admin') return 'Administrador';
    return rol;
  }

  const listHeader = useMemo(
    () => (
      <View>
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
                style={[styles.legendDot, { backgroundColor: colors.mesaLibre }]}
              />
              <Text style={[styles.legend, { fontSize: r.fontSize.small }]}>
                Disponible
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: colors.mesaOcupada }]}
              />
              <Text style={[styles.legend, { fontSize: r.fontSize.small }]}>
                Ocupada
              </Text>
            </View>
          </View>
        </AnimatedEnter>
      </View>
    ),
    [
      colors.mesaLibre,
      colors.mesaOcupada,
      disponibles,
      esAdmin,
      hayParaRecoger,
      mensajeCobroPendiente,
      mensajeRecoger,
      mesas.length,
      ocupadas,
      permMesero.ayuda_companeros,
      platosAyudaCompaneros,
      platosSinPasarCocina,
      puedeVerMisPedidos,
      r.fontSize.body,
      r.fontSize.h1,
      r.fontSize.small,
      router,
      showResumenPanel,
      styles.countHint,
      styles.greeting,
      styles.h1,
      styles.legend,
      styles.legendDot,
      styles.legendItem,
      styles.legendRow,
      styles.sectionHead,
      styles.topBar,
      user?.nombre,
      user?.rol,
    ],
  );

  const renderMesaItem = useCallback(
    ({ item }: { item: MesaRow }) => (
      <View
        style={{
          width: mesaCardWidth,
          marginBottom: gridCols === 1 ? r.gridGap : 0,
        }}
      >
        <MesaTarjeta
          numero={mv.etiquetaMesa(item.numero)}
          subtitulo={subtituloMesa(item.estado, item.mesero)}
          estado={item.estado}
          colors={colors}
          forma={chrome.mesaForma}
          vista={chrome.mesaVista}
          layout={layout}
          width="100%"
          minHeight={r.mesaCardMinHeight}
          compact={r.isCompact}
          numFontSize={r.fontSize.cardNum}
          subFontSize={r.fontSize.small}
          scrollFriendly={esVistaLista}
          onPress={() => {
            blurWebFocus();
            router.push(`/(app)/mesa/${item.id_mesa}`);
          }}
        />
      </View>
    ),
    [
      chrome.mesaForma,
      chrome.mesaVista,
      colors,
      esVistaLista,
      gridCols,
      layout,
      mesaCardWidth,
      mv,
      r.fontSize.cardNum,
      r.fontSize.small,
      r.gridGap,
      r.isCompact,
      r.mesaCardMinHeight,
      router,
    ],
  );

  const renderListaItem = useCallback(
    ({ item }: { item: MesaRow }) => (
      <View style={{ marginBottom: r.gridGap, width: '100%' }}>
        {renderMesaItem({ item })}
      </View>
    ),
    [r.gridGap, renderMesaItem],
  );

  if (loading) {
    return <ScreenLoading />;
  }

  const refreshControl = (
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  );

  const listaList = (
    <FlashList
      style={styles.list}
      data={mesas}
      keyExtractor={(m) => String(m.id_mesa)}
      ListHeaderComponent={listHeader}
      refreshControl={refreshControl}
      renderItem={renderListaItem}
      contentContainerStyle={{ paddingBottom: listBottomPad }}
      keyboardShouldPersistTaps="handled"
    />
  );

  if (esVistaLista) {
    if (showResumenPanel) {
      return (
        <View style={[styles.container, styles.bodyRowWeb]}>
          <View style={[styles.bodyRow, styles.bodyRowWide, styles.bodyRowWeb]}>
            <View style={styles.listPane}>{listaList}</View>
            <MesasResumenPanel
              total={mesas.length}
              disponibles={disponibles}
              ocupadas={ocupadas}
            />
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.container, { paddingHorizontal: r.contentPadding, paddingTop: r.contentPadding }]}>
        {listaList}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingHorizontal: r.contentPadding, paddingTop: r.contentPadding },
      ]}
    >
      <View style={[styles.bodyRow, showResumenPanel && styles.bodyRowWide, styles.bodyRowWeb]}>
        <View style={styles.gridCol}>
          <FlashList
              key={`mesas-grid-${gridCols}-${chrome.mesaForma}-${chrome.mesaVista}-${showResumenPanel ? 'w' : 'n'}`}
              style={styles.list}
              data={mesas}
              keyExtractor={(m) => String(m.id_mesa)}
              ListHeaderComponent={listHeader}
              refreshControl={refreshControl}
              numColumns={gridCols}
              contentContainerStyle={{ paddingBottom: listBottomPad }}
              keyboardShouldPersistTaps="handled"
              renderItem={renderMesaItem}
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
