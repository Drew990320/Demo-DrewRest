import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActionIconBar } from '../../../../src/components/ActionIconBar';
import { IconTooltipButton } from '../../../../src/components/IconTooltipButton';
import { useAuth } from '../../../../src/context/AuthContext';
import { AccionIcon, AdminIcon } from '../../../../src/lib/app-icons';
import { formStyles } from '../../../../src/lib/form-layout';
import { categoriaMenuIcon } from '../../../../src/lib/categoria-menu-icon';
import { useResponsive } from '../../../../src/hooks/useResponsive';
import { api } from '../../../../src/lib/api';
import {
  readMenuTodayCache,
  writeMenuTodayCache,
} from '../../../../src/lib/menu-cache';
import { formatCOP } from '../../../../src/lib/format';
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
const EST_ROW = 50;
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
    return (
      <Pressable
        key={String(item.id_producto)}
        style={[
          styles.row,
          { marginHorizontal: r.contentPadding },
          index === 0 && styles.rowFirst,
          last && styles.rowLast,
          !last && styles.rowMid,
        ]}
        onPress={() => openProducto(item)}
      >
        <Text style={styles.name} numberOfLines={2}>
          {item.nombre}
        </Text>
        <Text style={styles.price}>{formatCOP(item.precio)}</Text>
        <Text style={styles.chev}>›</Text>
      </Pressable>
    );
  }

  const listBottomPad = idMesaPedido != null ? 8 : r.contentPadding;

  function openProducto(item: Producto) {
    const q: string[] = [];
    if (soloBebidas) q.push('bebidas=1');
    if (soloParaLlevar) q.push('paraLlevar=1');
    const suffix = q.length ? `?${q.join('&')}` : '';
    router.push(
      `/(app)/pedido/${pedidoId}/producto/${item.id_producto}${suffix}`,
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
        {soloBebidas ? (
          <Text style={styles.hint}>
            Venta en mostrador: agua, gaseosas, cervezas…
          </Text>
        ) : null}
        {soloParaLlevar && !soloBebidas ? (
          <Text style={styles.hint}>
            Para llevar: empaque automático $1.000 por plato fuerte (se puede
            quitar al personalizar).
          </Text>
        ) : null}
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
  container: { flex: 1, backgroundColor: '#f6f4ee' },
  listFlex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  kicker: { color: '#6f6e67', fontWeight: '700', letterSpacing: 0.3 },
  h1: { fontWeight: '800', color: '#262622', marginTop: 2 },
  hint: { marginTop: 6, color: '#6f6e67', fontSize: 13, lineHeight: 18 },
  empty: { padding: 24, color: '#6f6e67' },
  catNavWrap: {
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e2d8',
    backgroundColor: '#faf9f6',
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
    backgroundColor: '#f6f4ee',
  },
  section: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6f6e67',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  menuFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e2d8',
    backgroundColor: '#faf9f6',
    paddingTop: 4,
    alignItems: 'center',
  },
  menuFooterHint: {
    marginTop: 4,
    marginBottom: 4,
    fontSize: 11,
    color: '#6f6e67',
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 520,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#e5e2d8',
  },
  rowFirst: {
    borderTopWidth: 1,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  rowMid: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ece9df',
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
    color: '#262622',
    fontWeight: '600',
  },
  price: {
    fontSize: 14,
    color: '#2f5e4f',
    fontWeight: '800',
    flexShrink: 0,
  },
  chev: { fontSize: 18, color: '#b4b2a9', flexShrink: 0 },
});
