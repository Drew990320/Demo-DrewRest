import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type SectionListData,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActionIconBar } from '../../../../src/components/ActionIconBar';
import { IconTooltipButton } from '../../../../src/components/IconTooltipButton';
import { useAuth } from '../../../../src/context/AuthContext';
import { AccionIcon, AdminIcon } from '../../../../src/lib/app-icons';
import { showBriefNotice } from '../../../../src/lib/app-dialog';
import { formStyles } from '../../../../src/lib/form-layout';
import { categoriaMenuIcon } from '../../../../src/lib/categoria-menu-icon';
import {
  menuProductoQueryParams,
  productoTieneOpcionesPersonalizacion,
} from '../../../../src/lib/menu-agregar-rapido';
import { useResponsive } from '../../../../src/hooks/useResponsive';
import { api } from '../../../../src/lib/api';
import {
  readMenuTodayCache,
  writeMenuTodayCache,
} from '../../../../src/lib/menu-cache';
import { formatCOP } from '../../../../src/lib/format';
import { colors } from '../../../../src/lib/theme';
import {
  scrollHeaderIntoView,
  scrollSectionListToY,
} from '../../../../src/lib/scroll-section-list';

type Opcion = { id_opcion: number; tipo: string; descripcion: string };
type Producto = {
  id_producto: number;
  nombre: string;
  precio: number;
  es_plato_principal?: boolean;
  es_empacable?: boolean;
  opciones: Opcion[];
};
type Categoria = { id_categoria: number; nombre: string; productos: Producto[] };

type MenuSection = SectionListData<Producto, { title: string }>;

/** Alturas estimadas para scroll por offset (SectionList + web). */
const EST_SECTION_HEADER = 42;
const EST_ROW = 54;
const EST_SECTION_GAP = 8;

function buildSectionOffsets(sections: MenuSection[]): number[] {
  let y = 0;
  return sections.map((s) => {
    const start = y;
    y += EST_SECTION_HEADER + s.data.length * EST_ROW + EST_SECTION_GAP;
    return start;
  });
}

function sectionIndexAtScrollY(offsets: number[], scrollY: number): number {
  let active = 0;
  for (let i = 0; i < offsets.length; i++) {
    if (offsets[i] <= scrollY + 16) active = i;
    else break;
  }
  return active;
}

export default function MenuPedidoScreen() {
  const { pedidoId, bebidas, paraLlevar } = useLocalSearchParams<{
    pedidoId: string;
    bebidas?: string;
    paraLlevar?: string;
  }>();
  const soloBebidas = bebidas === '1' || bebidas === 'true';
  const soloParaLlevar = paraLlevar === '1' || paraLlevar === 'true';
  const { token } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const r = useResponsive();
  const listRef = useRef<SectionList<Producto, { title: string }>>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [data, setData] = useState<{ categorias: Categoria[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [idMesaPedido, setIdMesaPedido] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState(0);
  const [agregandoRapidoId, setAgregandoRapidoId] = useState<number | null>(null);
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [seleccionIds, setSeleccionIds] = useState<Set<number>>(() => new Set());
  const [agregandoLote, setAgregandoLote] = useState(false);
  const programmaticScroll = useRef(false);
  const scrollYRef = useRef(0);
  const measuredSectionY = useRef<Record<number, number>>({});
  const headerRefs = useRef<Map<number, View>>(new Map());

  useEffect(() => {
    let cancelled = false;
    api<{ id_mesa: number }>(`/pedidos/${pedidoId}`, {
      token,
      cacheKey: `pedido_${pedidoId}`,
    })
      .then((p) => {
        if (!cancelled) setIdMesaPedido(p.id_mesa);
      })
      .catch(() => {
        if (!cancelled) setIdMesaPedido(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pedidoId, token]);

  const load = useCallback(async () => {
    const cached = readMenuTodayCache<{ categorias: Categoria[] }>();
    if (cached) {
      setData(cached);
      return;
    }
    const res = await api<{ categorias: Categoria[] }>('/menu/today', {
      token,
      cacheKey: 'menu_today',
    });
    writeMenuTodayCache(res);
    setData(res);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const cached = readMenuTodayCache<{ categorias: Categoria[] }>();
      if (cached) {
        setData(cached);
        setLoading(false);
        return () => {
          active = false;
        };
      }
      setLoading(true);
      load()
        .catch(() => undefined)
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [load]),
  );

  const categorias = useMemo(() => {
    if (!data) return [];
    const base = soloBebidas
      ? data.categorias.filter((c) => c.nombre.toLowerCase().includes('bebida'))
      : data.categorias;
    return base.filter((c) => c.productos.length > 0);
  }, [data, soloBebidas]);

  const sections: MenuSection[] = useMemo(
    () =>
      categorias.map((c) => ({
        title: c.nombre,
        data: c.productos,
      })),
    [categorias],
  );

  const sectionOffsets = useMemo(
    () => buildSectionOffsets(sections),
    [sections],
  );

  const productoById = useMemo(() => {
    const map = new Map<number, Producto>();
    for (const section of sections) {
      for (const p of section.data) {
        map.set(p.id_producto, p);
      }
    }
    return map;
  }, [sections]);

  const seleccionados = useMemo(
    () =>
      Array.from(seleccionIds)
        .map((id) => productoById.get(id))
        .filter((p): p is Producto => p != null),
    [seleccionIds, productoById],
  );

  const seleccionConPersonalizacion = useMemo(
    () => seleccionados.filter(productoTieneOpcionesPersonalizacion).length,
    [seleccionados],
  );

  function salirModoSeleccion() {
    setModoSeleccion(false);
    setSeleccionIds(new Set());
  }

  function toggleSeleccion(id: number) {
    setSeleccionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function postDetalleUnitario(idProducto: number) {
    await api(`/pedidos/${pedidoId}/detalles`, {
      method: 'POST',
      token,
      body: JSON.stringify({
        id_producto: idProducto,
        cantidad: 1,
        opcion_ids: [],
      }),
    });
  }

  async function agregarSeleccionEstandar() {
    if (seleccionados.length === 0 || agregandoLote) return;
    setAgregandoLote(true);
    let ok = 0;
    try {
      for (const item of seleccionados) {
        try {
          await postDetalleUnitario(item.id_producto);
          ok++;
        } catch {
          /* sigue con el resto */
        }
      }
      if (ok > 0) {
        void showBriefNotice(
          'Agregados',
          `${ok} ítem(s) al pedido (estándar)`,
          'success',
        );
      }
      if (ok < seleccionados.length) {
        Alert.alert(
          'Aviso',
          `Se agregaron ${ok} de ${seleccionados.length}. Revisa los que faltaron.`,
        );
      }
      salirModoSeleccion();
    } finally {
      setAgregandoLote(false);
    }
  }

  async function personalizarSeleccionYAgregar() {
    const conPers = seleccionados.filter(productoTieneOpcionesPersonalizacion);
    if (conPers.length === 0 || agregandoLote) return;
    const sinPers = seleccionados.filter(
      (p) => !productoTieneOpcionesPersonalizacion(p),
    );

    setAgregandoLote(true);
    try {
      let ok = 0;
      for (const item of sinPers) {
        try {
          await postDetalleUnitario(item.id_producto);
          ok++;
        } catch {
          /* sigue */
        }
      }
      if (ok > 0) {
        void showBriefNotice(
          'Agregados',
          `${ok} ítem(s) sin personalizar`,
          'success',
        );
      }
      const [first, ...rest] = conPers;
      salirModoSeleccion();
      router.push(
        `/(app)/pedido/${pedidoId}/producto/${first.id_producto}${menuProductoQueryParams(
          {
            bebidas: soloBebidas,
            paraLlevar: soloParaLlevar,
            colaPersonalizar: rest.map((p) => p.id_producto),
          },
        )}`,
      );
    } finally {
      setAgregandoLote(false);
    }
  }

  useEffect(() => {
    measuredSectionY.current = {};
    headerRefs.current.clear();
  }, [sections]);

  const scrollToSection = useCallback(
    (index: number) => {
      if (index < 0 || index >= sectionOffsets.length) return;
      setActiveSection(index);
      programmaticScroll.current = true;
      const offset =
        measuredSectionY.current[index] ?? sectionOffsets[index] ?? 0;

      if (Platform.OS === 'web') {
        const header = headerRefs.current.get(index);
        if (!scrollHeaderIntoView(header, true)) {
          scrollRef.current?.scrollTo({ y: offset, animated: true });
        }
      } else {
        scrollSectionListToY(listRef.current, offset, true);
      }

      setTimeout(() => {
        programmaticScroll.current = false;
      }, 450);
    },
    [sectionOffsets],
  );

  const onListScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollYRef.current = e.nativeEvent.contentOffset.y;
      if (programmaticScroll.current) return;
      const idx = sectionIndexAtScrollY(
        sectionOffsets.map(
          (est, i) => measuredSectionY.current[i] ?? est,
        ),
        scrollYRef.current,
      );
      setActiveSection(idx);
    },
    [sectionOffsets],
  );

  const onScrollEnd = useCallback(() => {
    programmaticScroll.current = false;
    const idx = sectionIndexAtScrollY(
      sectionOffsets.map((est, i) => measuredSectionY.current[i] ?? est),
      scrollYRef.current,
    );
    setActiveSection(idx);
  }, [sectionOffsets]);

  function renderSectionHeader(title: string, sectionIndex: number) {
    return (
      <View
        ref={(node) => {
          if (sectionIndex >= 0) {
            if (node) headerRefs.current.set(sectionIndex, node);
            else headerRefs.current.delete(sectionIndex);
          }
        }}
        style={[styles.sectionWrap, { paddingHorizontal: r.contentPadding }]}
        collapsable={false}
        onLayout={(e) => {
          if (sectionIndex >= 0) {
            measuredSectionY.current[sectionIndex] = e.nativeEvent.layout.y;
          }
        }}
      >
        <Text style={styles.section}>{title}</Text>
      </View>
    );
  }

  function renderProductRow(item: Producto, index: number, total: number) {
    const last = index === total - 1;
    const agregando = agregandoRapidoId === item.id_producto;
    const personalizable = productoTieneOpcionesPersonalizacion(item);
    const seleccionado = seleccionIds.has(item.id_producto);
    return (
      <View
        key={String(item.id_producto)}
        style={[
          styles.row,
          { marginHorizontal: r.contentPadding },
          index === 0 && styles.rowFirst,
          last && styles.rowLast,
          !last && styles.rowMid,
          modoSeleccion && seleccionado && styles.rowSelected,
        ]}
      >
        {modoSeleccion ? (
          <Pressable
            style={styles.rowCheck}
            onPress={() => toggleSeleccion(item.id_producto)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: seleccionado }}
          >
            <Text style={styles.checkBox}>{seleccionado ? '✓' : ''}</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={styles.rowMain}
          onPress={() =>
            modoSeleccion
              ? toggleSeleccion(item.id_producto)
              : openProducto(item)
          }
          accessibilityRole="button"
          accessibilityLabel={`${item.nombre}, ${formatCOP(item.precio)}`}
        >
          <Text style={styles.name} numberOfLines={2}>
            {item.nombre}
          </Text>
          <Text style={styles.price}>{formatCOP(item.precio)}</Text>
          {!modoSeleccion ? <Text style={styles.chev}>›</Text> : null}
        </Pressable>
        {!modoSeleccion ? (
          <IconTooltipButton
            icon={agregando ? 'hourglass-outline' : 'add-circle-outline'}
            label={
              agregando
                ? 'Agregando…'
                : personalizable
                  ? 'Agregar 1 estándar (sin opciones)'
                  : 'Agregar 1 al pedido'
            }
            variant="primary"
            size={22}
            fixedSize
            disabled={agregando}
            onPress={() => agregarRapido(item)}
            style={styles.quickAddBtn}
          />
        ) : null}
      </View>
    );
  }

  const selectionBarVisible = modoSeleccion;
  const listBottomPad =
    (idMesaPedido != null ? 8 : r.contentPadding) +
    (selectionBarVisible ? 72 : 0);

  function openProducto(item: Producto) {
    router.push(
      `/(app)/pedido/${pedidoId}/producto/${item.id_producto}${menuProductoQueryParams(
        { bebidas: soloBebidas, paraLlevar: soloParaLlevar },
      )}`,
    );
  }

  async function agregarRapido(item: Producto) {
    if (agregandoRapidoId != null) return;
    setAgregandoRapidoId(item.id_producto);
    try {
      await postDetalleUnitario(item.id_producto);
      void showBriefNotice('Agregado', `${item.nombre} × 1`, 'success');
    } catch (e) {
      Alert.alert(
        'Error',
        e instanceof Error ? e.message : 'No se pudo agregar al pedido',
      );
    } finally {
      setAgregandoRapidoId(null);
    }
  }

  function activarModoUno() {
    if (modoSeleccion) salirModoSeleccion();
  }

  function activarModoVarios() {
    if (!modoSeleccion) setModoSeleccion(true);
  }

  const hintModoActivo = useMemo(() => {
    if (modoSeleccion) {
      return 'Marca los ítems y confirma con los botones de abajo.';
    }
    if (soloBebidas) {
      return '+ al instante · toca la fila para cantidad o nota.';
    }
    if (soloParaLlevar) {
      return '+ estándar · toca el plato para empaque, notas u opciones.';
    }
    return '+ agrega 1 al instante · toca el plato para personalizar.';
  }, [modoSeleccion, soloBebidas, soloParaLlevar]);

  function renderModosSeleccion() {
    return (
      <View style={styles.modesBlock}>
        <Text style={styles.modesLabel}>Modos de selección</Text>
        <View style={styles.modesRow}>
          <Pressable
            style={[
              styles.modeBtn,
              !modoSeleccion && styles.modeBtnActive,
            ]}
            onPress={activarModoUno}
            accessibilityRole="button"
            accessibilityState={{ selected: !modoSeleccion }}
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={!modoSeleccion ? colors.surface : colors.primary}
            />
            <Text
              style={[
                styles.modeBtnText,
                !modoSeleccion && styles.modeBtnTextActive,
              ]}
            >
              Uno a uno
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.modeBtn,
              modoSeleccion && styles.modeBtnActive,
            ]}
            onPress={activarModoVarios}
            accessibilityRole="button"
            accessibilityState={{ selected: modoSeleccion }}
          >
            <Ionicons
              name="checkbox-outline"
              size={20}
              color={modoSeleccion ? colors.surface : colors.primary}
            />
            <Text
              style={[
                styles.modeBtnText,
                modoSeleccion && styles.modeBtnTextActive,
              ]}
            >
              Varios
            </Text>
          </Pressable>
        </View>
        <Text style={styles.modeHint}>{hintModoActivo}</Text>
      </View>
    );
  }

  if (loading || !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (sections.length === 0) {
    return (
      <View style={[styles.container, { padding: r.contentPadding }]}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Menú</Text>
          <Text style={[styles.h1, { fontSize: r.fontSize.h1 }]}>
            {soloBebidas ? 'Solo bebidas' : 'Disponible hoy'}
          </Text>
        </View>
        <Text style={styles.empty}>
          {soloBebidas
            ? 'No hay categorías de bebidas en el menú de hoy.'
            : 'No hay productos disponibles hoy.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingHorizontal: r.contentPadding }]}>
        <Text style={styles.kicker}>Menú</Text>
        <Text style={[styles.h1, { fontSize: r.fontSize.h1 }]}>
          {soloBebidas ? 'Solo bebidas' : 'Disponible hoy'}
        </Text>
        {renderModosSeleccion()}
      </View>

      {sections.length > 1 ? (
        <View style={[styles.catNavWrap, { paddingHorizontal: r.contentPadding }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catNavInner}
          >
            {sections.map((s, i) => {
              const on = activeSection === i;
              return (
                <IconTooltipButton
                  key={s.title}
                  iconSet="material-community"
                  icon={categoriaMenuIcon(s.title)}
                  label={s.title}
                  variant={on ? 'primary' : 'secondary'}
                  fixedSize
                  size={22}
                  onPress={() => scrollToSection(i)}
                />
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {Platform.OS === 'web' ? (
        <ScrollView
          ref={scrollRef}
          style={styles.listFlex}
          onScroll={onListScroll}
          scrollEventThrottle={32}
          onScrollEndDrag={onScrollEnd}
          onMomentumScrollEnd={onScrollEnd}
          contentContainerStyle={{ paddingBottom: listBottomPad }}
        >
          {sections.map((section, sectionIndex) => (
            <View key={section.title}>
              {renderSectionHeader(section.title, sectionIndex)}
              {section.data.map((item, index) =>
                renderProductRow(item, index, section.data.length),
              )}
            </View>
          ))}
        </ScrollView>
      ) : (
        <SectionList
          ref={listRef}
          style={styles.listFlex}
          sections={sections}
          keyExtractor={(p) => String(p.id_producto)}
          stickySectionHeadersEnabled
          initialNumToRender={40}
          windowSize={15}
          removeClippedSubviews
          onScroll={onListScroll}
          scrollEventThrottle={32}
          onMomentumScrollEnd={onScrollEnd}
          onScrollEndDrag={onScrollEnd}
          contentContainerStyle={{ paddingBottom: listBottomPad }}
          renderSectionHeader={({ section: { title } }) => {
            const sectionIndex = sections.findIndex((s) => s.title === title);
            return renderSectionHeader(title, sectionIndex);
          }}
          renderItem={({ item, index, section }) =>
            renderProductRow(item, index, section.data.length)
          }
        />
      )}

      {selectionBarVisible ? (
        <View
          style={[
            styles.selectionBar,
            { paddingHorizontal: r.contentPadding },
          ]}
        >
          <Text style={styles.selectionCount}>
            {seleccionados.length === 0
              ? 'Selecciona ítems del menú'
              : `${seleccionados.length} seleccionado(s)`}
          </Text>
          <ActionIconBar
            style={styles.selectionActions}
            actions={[
              {
                key: 'agregar',
                icon: agregandoLote ? 'hourglass-outline' : 'cart-outline',
                label: agregandoLote
                  ? 'Agregando…'
                  : seleccionados.length > 0
                    ? `Agregar ${seleccionados.length}`
                    : 'Agregar',
                variant: 'primary',
                disabled:
                  seleccionados.length === 0 || agregandoLote,
                onPress: agregarSeleccionEstandar,
              },
              {
                key: 'personalizar',
                icon: 'options-outline',
                label:
                  seleccionConPersonalizacion > 0
                    ? `Personalizar (${seleccionConPersonalizacion})`
                    : 'Personalizar',
                variant: 'secondary',
                disabled:
                  seleccionConPersonalizacion === 0 || agregandoLote,
                onPress: personalizarSeleccionYAgregar,
              },
            ]}
          />
        </View>
      ) : null}

      {idMesaPedido != null ? (
        <View
          style={[
            styles.menuFooter,
            {
              paddingHorizontal: r.contentPadding,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <ActionIconBar
            style={formStyles.screenActions}
            actions={[
              {
                key: 'mesa',
                icon: AccionIcon.confirmarEnMesa,
                label: 'Volver a mesa',
                variant: 'primary',
                onPress: () => router.replace(`/(app)/mesa/${idMesaPedido}`),
              },
              {
                key: 'mesas',
                icon: AdminIcon.volverMesas,
                label: 'Volver a mesas',
                variant: 'secondary',
                onPress: () => router.replace('/(app)/mesas'),
              },
            ]}
          />
          <Text style={styles.menuFooterHint}>
            Si piden algo más tarde, abre de nuevo «Agregar del menú» en la mesa.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listFlex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: 8,
    paddingBottom: 6,
    alignItems: 'center',
  },
  kicker: {
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  h1: {
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
    textAlign: 'center',
  },
  modesBlock: {
    marginTop: 10,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modesLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  modesRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  modeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  modeBtnTextActive: {
    color: colors.surface,
  },
  modeHint: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
  selectionBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingTop: 8,
    paddingBottom: 8,
  },
  selectionCount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 6,
  },
  selectionActions: {
    justifyContent: 'center',
  },
  empty: { padding: 24, color: colors.textMuted },
  catNavWrap: {
    paddingTop: 4,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  catNavInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
    flexGrow: 1,
  },
  sectionWrap: {
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: colors.background,
  },
  section: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  menuFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    paddingTop: 4,
    alignItems: 'center',
  },
  menuFooterHint: {
    marginTop: 4,
    marginBottom: 4,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 520,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    backgroundColor: colors.surface,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
  },
  rowSelected: {
    backgroundColor: colors.surfaceMuted,
  },
  rowCheck: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkBox: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    minHeight: 40,
  },
  quickAddBtn: {
    flexShrink: 0,
  },
  rowFirst: {
    borderTopWidth: 1,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  rowMid: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  rowLast: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: 8,
  },
  name: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
  price: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '800',
    flexShrink: 0,
  },
  chev: { fontSize: 18, color: colors.textHint, flexShrink: 0 },
});
