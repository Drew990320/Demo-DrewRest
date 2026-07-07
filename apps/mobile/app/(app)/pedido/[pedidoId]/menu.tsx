import { categoriaVisibleEnMostrador } from '@la-reserva/shared-domain/categoria-reglas';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from 'react-native';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActionIconBar, type ActionIconItem } from '../../../../src/components/ActionIconBar';
import { AnimatedPressable } from '../../../../src/components/AnimatedPressable';
import { IconTooltipButton } from '../../../../src/components/IconTooltipButton';
import { ScreenLoading } from '../../../../src/components/ScreenLoading';
import { ScreenHeader } from '../../../../src/components/ScreenHeader';
import { useScreenScrollPadding } from '../../../../src/hooks/useScreenScrollPadding';
import { useAuth } from '../../../../src/context/AuthContext';
import { usePedidoToolsRail } from '../../../../src/context/ResumenDiarioToolsRailContext';
import { usePermisosMesero } from '../../../../src/hooks/usePermisosMesero';
import { usePedidoRailRefreshSuave } from '../../../../src/hooks/usePedidoRailRefreshSuave';
import { useMesasVirtuales } from '../../../../src/hooks/useMesasVirtuales';
import { PedidoIcon } from '../../../../src/lib/app-icons';
import { mergePedidoRailActions } from '../../../../src/lib/pedido-rail-actions';
import { alertarSiSinPapel } from '../../../../src/lib/alarma-impresora';
import { notificarResultadoImpresion } from '../../../../src/lib/impresion-resultado';
import { confirmAppDialog, showBriefNotice, showNotice } from '../../../../src/lib/app-dialog';
import { pasarCocinaPedido } from '../../../../src/lib/pasar-cocina-pedido';
import { categoriaMenuIcon } from '../../../../src/lib/categoria-menu-icon';
import {
  menuProductoQueryParams,
  productoTieneOpcionesPersonalizacion,
} from '../../../../src/lib/menu-agregar-rapido';
import { warmMenuTodayCache } from '../../../../src/lib/menu-prefetch';
import { preloadCategoriaMenuIcons } from '../../../../src/lib/categoria-menu-icon-font';
import {
  manejarErrorOperacion,
  parseRecursoNoDisponible,
} from '../../../../src/lib/recurso-disponible';
import { useResponsive } from '../../../../src/hooks/useResponsive';
import { useThemedStyles } from '../../../../src/hooks/useThemedStyles';
import { useConfigSync } from '../../../../src/hooks/useConfigSync';
import { useVisualTheme } from '../../../../src/context/VisualThemeContext';
import { api } from '../../../../src/lib/api';
import {
  readMenuTodayCache,
} from '../../../../src/lib/menu-cache';
import { formatCOP } from '../../../../src/lib/format';
import {
  buildMenuListRows,
  sectionStartIndices,
  type MenuListRow,
} from '../../../../src/lib/menu-list-rows';
import type { AppColors } from '../../../../src/lib/theme';
import {
  productoAgotado,
  stockEtiqueta,
} from '@la-reserva/shared-domain/stock-producto';

type Opcion = { id_opcion: number; tipo: string; descripcion: string };
type Producto = {
  id_producto: number;
  nombre: string;
  precio: number;
  es_plato_principal?: boolean;
  es_empacable?: boolean;
  control_stock?: boolean;
  stock_disponible?: number;
  ocultar_sin_stock?: boolean;
  agotado?: boolean;
  opciones: Opcion[];
};
type Categoria = {
  id_categoria: number;
  nombre: string;
  icono_menu?: string | null;
  es_bebida?: boolean;
  visible_en_mostrador?: boolean;
  productos: Producto[];
};

type MenuSection = {
  title: string;
  icono_menu?: string | null;
  data: Producto[];
};

type PedidoMenuSnapshot = {
  id_pedido: number;
  id_mesa: number;
  mesa_numero: number;
  estado: string;
  detalles: {
    marcar_cocina?: boolean;
    enviado_cocina?: boolean;
  }[];
  facturas?: { id_factura: number }[];
};

export default function MenuPedidoScreen() {
  const { pedidoId, bebidas, paraLlevar } = useLocalSearchParams<{
    pedidoId: string;
    bebidas?: string;
    paraLlevar?: string;
  }>();
  const soloBebidas = bebidas === '1' || bebidas === 'true';
  const soloParaLlevar = paraLlevar === '1' || paraLlevar === 'true';
  const { token } = useAuth();
  const { permisos: permMesero } = usePermisosMesero();
  const mv = useMesasVirtuales();
  const router = useRouter();
  const r = useResponsive();
  const styles = useThemedStyles(createMenuPedidoStyles);
  const { colors } = useVisualTheme();
  const idPedidoNum = Number(pedidoId);
  const listRef = useRef<FlashListRef<MenuListRow>>(null);
  const [data, setData] = useState<{ categorias: Categoria[] } | null>(() =>
    readMenuTodayCache<{ categorias: Categoria[] }>() ?? null,
  );
  const [loading, setLoading] = useState(
    () => readMenuTodayCache<{ categorias: Categoria[] }>() == null,
  );
  const [pedidoSnap, setPedidoSnap] = useState<PedidoMenuSnapshot | null>(null);
  const [pantallaEnFoco, setPantallaEnFoco] = useState(true);
  const [busyPasarCocina, setBusyPasarCocina] = useState(false);
  const [busyReimprimir, setBusyReimprimir] = useState(false);
  const [busyCancelar, setBusyCancelar] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [agregandoRapidoId, setAgregandoRapidoId] = useState<number | null>(null);
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [seleccionIds, setSeleccionIds] = useState<Set<number>>(() => new Set());
  const [agregandoLote, setAgregandoLote] = useState(false);
  const programmaticScroll = useRef(false);
  const categoriaPorProductoRef = useRef<Map<number, string>>(new Map());

  const cargarPedidoSnap = useCallback(async () => {
    try {
      const p = await api<PedidoMenuSnapshot>(
        `/pedidos/${pedidoId}?vista=operativa`,
        {
        token,
        cacheKey: `pedido_${pedidoId}`,
      });
      setPedidoSnap(p);
    } catch {
      setPedidoSnap(null);
    }
  }, [pedidoId, token]);

  useFocusEffect(
    useCallback(() => {
      setPantallaEnFoco(true);
      void cargarPedidoSnap();
      return () => setPantallaEnFoco(false);
    }, [cargarPedidoSnap]),
  );

  const platosPendientesServidor = useMemo(
    () =>
      pedidoSnap?.detalles.filter(
        (d) => d.marcar_cocina && !d.enviado_cocina,
      ).length ?? 0,
    [pedidoSnap],
  );

  const { notificarItemAgregado, aplicarPendientesOptimistas } =
    usePedidoRailRefreshSuave(
      cargarPedidoSnap,
      categoriaPorProductoRef,
      idPedidoNum,
      platosPendientesServidor,
    );

  const platosPendientesCocina = useMemo(
    () => aplicarPendientesOptimistas(platosPendientesServidor),
    [platosPendientesServidor, aplicarPendientesOptimistas],
  );

  const platosEnCocina = useMemo(
    () =>
      pedidoSnap?.detalles.filter(
        (d) => d.marcar_cocina && d.enviado_cocina,
      ).length ?? 0,
    [pedidoSnap],
  );

  const tieneCobrosParciales = (pedidoSnap?.facturas?.length ?? 0) > 0;
  const esMesaVirtual =
    pedidoSnap != null && mv.esVirtual(pedidoSnap.mesa_numero);

  async function reimprimirComandaCocina() {
    setBusyReimprimir(true);
    try {
      const res = await api<{
        impresion_comanda?: {
          impreso: boolean;
          error?: string;
          destino?: string;
        };
      }>(`/pedidos/${pedidoId}/reimprimir-comanda`, {
        method: 'POST',
        token,
      });
      if (alertarSiSinPapel(res)) return;
      await notificarResultadoImpresion(
        res.impresion_comanda,
        {
          titulo: 'Comanda reimpresa',
          mensaje: `Ticket impreso (${res.impresion_comanda?.destino ?? 'impresora'}). Marca REIMPRESIÓN en el papel.`,
        },
        { titulo: 'Sin imprimir' },
      );
    } catch (e) {
      await manejarErrorOperacion(e, {
        title: 'Reimprimir',
        message: 'No se pudo reimprimir la comanda.',
      });
    } finally {
      setBusyReimprimir(false);
    }
  }

  async function pasarACocinaManual() {
    setBusyPasarCocina(true);
    try {
      await pasarCocinaPedido(idPedidoNum, token, {
        onReimprimir: reimprimirComandaCocina,
      });
      await cargarPedidoSnap();
    } finally {
      setBusyPasarCocina(false);
    }
  }

  async function cancelarPedidoMenu() {
    if (busyCancelar || tieneCobrosParciales) return;
    const ok = await confirmAppDialog(
      'Cancelar pedido',
      'Se eliminará el pedido sin cobrar. ¿Continuar?',
    );
    if (!ok) return;
    setBusyCancelar(true);
    try {
      await api(`/pedidos/${pedidoId}/cancelar`, { method: 'POST', token });
      if (pedidoSnap) {
        router.replace(`/(app)/mesa/${pedidoSnap.id_mesa}`);
      } else {
        router.back();
      }
    } catch (e) {
      await manejarErrorOperacion(e, {
        title: 'Cancelar',
        message: 'No se pudo cancelar el pedido.',
      });
    } finally {
      setBusyCancelar(false);
    }
  }

  const pedidoActions = useMemo((): ActionIconItem[] => {
    if (!pedidoSnap) return [];
    return mergePedidoRailActions({
      cocina: permMesero.enviar_cocina
        ? {
            key: 'cocina',
            icon: PedidoIcon.pasarCocina,
            label: busyPasarCocina
              ? 'Enviando a cocina…'
              : platosPendientesCocina > 0
                ? `Pasar a cocina (${platosPendientesCocina})`
                : 'Pasar a cocina',
            variant: 'cocina' as const,
            disabled:
              busyPasarCocina ||
              (platosPendientesCocina === 0 && platosPendientesServidor === 0),
            badge:
              platosPendientesCocina > 0 ? platosPendientesCocina : undefined,
            onPress: () => void pasarACocinaManual(),
          }
        : null,
      reimprimir: permMesero.reimprimir_comanda
        ? {
            key: 'reimprimir-cocina',
            icon: PedidoIcon.reimprimirComanda,
            label: busyReimprimir
              ? 'Imprimiendo…'
              : platosEnCocina > 0
                ? `Reimprimir comanda (${platosEnCocina})`
                : 'Reimprimir comanda',
            variant: 'secondary' as const,
            disabled: busyReimprimir || platosEnCocina === 0,
            badge: platosEnCocina > 0 ? platosEnCocina : undefined,
            onPress: () => void reimprimirComandaCocina(),
          }
        : null,
      cobrar: permMesero.cobrar
        ? {
            key: 'cobrar',
            icon: PedidoIcon.cobrar,
            label: 'Cobrar / facturar',
            variant: 'money' as const,
            onPress: () => router.push(`/(app)/pedido/${pedidoId}/factura`),
          }
        : null,
      navegacion: {
        key: 'volver',
        icon: 'arrow-back-outline',
        label: 'Volver al pedido',
        onPress: () => router.back(),
      },
      cancelar: permMesero.cancelar_pedido
        ? {
            key: 'cancelar',
            icon: 'close-circle-outline',
            label: tieneCobrosParciales
              ? 'Cancelar (hay cobros)'
              : 'Cancelar pedido',
            variant: 'danger' as const,
            disabled: busyCancelar || tieneCobrosParciales,
            onPress: () => void cancelarPedidoMenu(),
          }
        : null,
    });
  }, [
    pedidoSnap,
    permMesero,
    busyPasarCocina,
    platosPendientesCocina,
    platosPendientesServidor,
    busyReimprimir,
    platosEnCocina,
    busyCancelar,
    tieneCobrosParciales,
    pedidoId,
    router,
  ]);

  const toolsRail = r.navSidebar && pantallaEnFoco && !!pedidoSnap;

  usePedidoToolsRail(
    toolsRail,
    {
      pedidoActions,
      pedidoHint:
        'Agrega platos y bebidas. Pulsa «Pasar a cocina» en la barra cuando quieras imprimir la comanda.',
      transfer:
        pedidoSnap && !esMesaVirtual && permMesero.transferir_mesa
          ? {
              pedidoId: pedidoSnap.id_pedido,
              mesaOrigenId: pedidoSnap.id_mesa,
              mesaOrigenNumero: pedidoSnap.mesa_numero,
              token,
              disabled: busyPasarCocina || busyCancelar,
              onTransferido: (idMesa) => router.replace(`/(app)/mesa/${idMesa}`),
            }
          : null,
    },
    [
      pedidoSnap?.id_pedido,
      pedidoSnap?.id_mesa,
      pedidoSnap?.mesa_numero,
      esMesaVirtual,
      permMesero.transferir_mesa,
      permMesero.enviar_cocina,
      permMesero.reimprimir_comanda,
      permMesero.cobrar,
      permMesero.cancelar_pedido,
      busyPasarCocina,
      busyReimprimir,
      busyCancelar,
      platosPendientesCocina,
      platosPendientesServidor,
      platosEnCocina,
      tieneCobrosParciales,
      token,
    ],
  );

  useFocusEffect(
    useCallback(() => {
      void preloadCategoriaMenuIcons();
      let active = true;
      const cached = readMenuTodayCache<{ categorias: Categoria[] }>();
      if (cached) {
        setData(cached);
        setLoading(false);
        void warmMenuTodayCache(token, { forceNetwork: true }).then(() => {
          if (!active) return;
          const fresh = readMenuTodayCache<{ categorias: Categoria[] }>();
          if (fresh) setData(fresh);
        });
        return () => {
          active = false;
        };
      }
      setLoading(true);
      void warmMenuTodayCache(token)
        .catch(() => undefined)
        .finally(() => {
          if (!active) return;
          const fresh = readMenuTodayCache<{ categorias: Categoria[] }>();
          if (fresh) setData(fresh);
          setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [token]),
  );

  const refrescarMenu = useCallback(() => {
    void warmMenuTodayCache(token, { forceNetwork: true })
      .catch(() => undefined)
      .finally(() => {
        const fresh = readMenuTodayCache<{ categorias: Categoria[] }>();
        if (fresh) setData(fresh);
      });
  }, [token]);

  useConfigSync(refrescarMenu, { scopes: ['menu', 'categorias'] });

  const categorias = useMemo(() => {
    if (!data) return [];
    const base = soloBebidas
      ? data.categorias.filter((c) =>
          categoriaVisibleEnMostrador({
            nombre: c.nombre,
            visible_en_mostrador: c.visible_en_mostrador,
            es_bebida: c.es_bebida,
          }),
        )
      : data.categorias;
    return base.filter((c) => c.productos.length > 0);
  }, [data, soloBebidas]);

  const sections: MenuSection[] = useMemo(
    () =>
      categorias.map((c) => ({
        title: c.nombre,
        icono_menu: c.icono_menu,
        data: c.productos,
      })),
    [categorias],
  );

  const listRows = useMemo(() => buildMenuListRows(sections), [sections]);

  const sectionStarts = useMemo(
    () => sectionStartIndices(listRows),
    [listRows],
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

  const categoriaPorProducto = useMemo(() => {
    const map = new Map<number, string>();
    for (const section of sections) {
      for (const p of section.data) {
        map.set(p.id_producto, section.title);
      }
    }
    return map;
  }, [sections]);

  categoriaPorProductoRef.current = categoriaPorProducto;

  const seleccionados = useMemo(
    () =>
      Array.from(seleccionIds)
        .map((id) => productoById.get(id))
        .filter((p): p is Producto => p != null),
    [seleccionIds, productoById],
  );

  const seleccionConPersonalizacion = useMemo(
    () =>
      seleccionados.filter((p) =>
        productoTieneOpcionesPersonalizacion(
          p,
          categoriaPorProducto.get(p.id_producto),
        ),
      ).length,
    [seleccionados, categoriaPorProducto],
  );

  function productoEsPersonalizable(item: Producto): boolean {
    return productoTieneOpcionesPersonalizacion(
      item,
      categoriaPorProducto.get(item.id_producto),
    );
  }

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
          notificarItemAgregado(item);
        } catch (e) {
          if (parseRecursoNoDisponible(e)?.kind === 'producto') {
            await refrescarMenuTrasOcultar();
          }
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
        await showNotice(
          'Menú actualizado',
          `Se agregaron ${ok} de ${seleccionados.length}. Algunos platos ya no están disponibles.`,
          'warning',
        );
      }
      salirModoSeleccion();
    } finally {
      setAgregandoLote(false);
    }
  }

  async function personalizarSeleccionYAgregar() {
    const conPers = seleccionados.filter((p) => productoEsPersonalizable(p));
    if (conPers.length === 0 || agregandoLote) return;
    const sinPers = seleccionados.filter((p) => !productoEsPersonalizable(p));

    setAgregandoLote(true);
    try {
      let ok = 0;
      for (const item of sinPers) {
        try {
          await postDetalleUnitario(item.id_producto);
          ok++;
          notificarItemAgregado(item);
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

  const scrollToSection = useCallback(
    (index: number) => {
      const flatIndex = sectionStarts[index];
      if (flatIndex == null) return;
      setActiveSection(index);
      programmaticScroll.current = true;
      listRef.current?.scrollToIndex({ index: flatIndex, animated: true });
      setTimeout(() => {
        programmaticScroll.current = false;
      }, 450);
    },
    [sectionStarts],
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<MenuListRow>[] }) => {
      if (programmaticScroll.current) return;
      for (const token of viewableItems) {
        const row = token.item;
        if (row?.kind === 'header') {
          setActiveSection(row.sectionIndex);
          return;
        }
        if (row?.kind === 'product') {
          setActiveSection(row.sectionIndex);
          return;
        }
      }
    },
    [],
  );

  const onViewableItemsChangedRef = useRef(onViewableItemsChanged);
  onViewableItemsChangedRef.current = onViewableItemsChanged;

  const viewabilityPairs = useRef([
    {
      viewabilityConfig: { itemVisiblePercentThreshold: 8 },
      onViewableItemsChanged: (info: { viewableItems: ViewToken<MenuListRow>[] }) =>
        onViewableItemsChangedRef.current(info),
    },
  ]).current;

  function renderSectionHeader(title: string) {
    return (
      <View
        style={[styles.sectionWrap, { paddingHorizontal: r.contentPadding }]}
        collapsable={false}
      >
        <Text style={styles.section}>{title}</Text>
      </View>
    );
  }

  function renderProductRow(item: Producto, index: number, total: number) {
    const last = index === total - 1;
    const agotado = item.agotado ?? productoAgotado(item);
    const agregando = agregandoRapidoId === item.id_producto;
    const personalizable = productoEsPersonalizable(item);
    const seleccionado = seleccionIds.has(item.id_producto);
    const stockLabel = stockEtiqueta(item);
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
          agotado && styles.rowAgotado,
        ]}
      >
        {modoSeleccion ? (
          <Pressable
            style={styles.rowCheck}
            onPress={() => !agotado && toggleSeleccion(item.id_producto)}
            disabled={agotado}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: seleccionado }}
          >
            <Text style={styles.checkBox}>{seleccionado ? '✓' : ''}</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={styles.rowMain}
          onPress={() => {
            if (agotado) return;
            if (modoSeleccion) toggleSeleccion(item.id_producto);
            else openProducto(item);
          }}
          disabled={agotado}
          accessibilityRole="button"
          accessibilityLabel={`${item.nombre}, ${formatCOP(item.precio)}`}
        >
          <Text style={styles.name} numberOfLines={2}>
            {item.nombre}
          </Text>
          {stockLabel ? (
            <Text style={styles.stockHint}>{stockLabel}</Text>
          ) : null}
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
            disabled={agregando || agotado}
            onPress={() => agregarRapido(item)}
            style={styles.quickAddBtn}
          />
        ) : null}
      </View>
    );
  }

  const selectionBarVisible = modoSeleccion;
  const listBottomPad = useScreenScrollPadding(selectionBarVisible ? 72 : 0);

  function openProducto(item: Producto) {
    router.push(
      `/(app)/pedido/${pedidoId}/producto/${item.id_producto}${menuProductoQueryParams(
        { bebidas: soloBebidas, paraLlevar: soloParaLlevar },
      )}`,
    );
  }

  async function refrescarMenuTrasOcultar() {
    await warmMenuTodayCache(token, { forceNetwork: true });
    const fresh = readMenuTodayCache<{ categorias: Categoria[] }>();
    if (fresh) setData(fresh);
  }

  async function agregarRapido(item: Producto) {
    if (agregandoRapidoId != null) return;
    setAgregandoRapidoId(item.id_producto);
    try {
      await postDetalleUnitario(item.id_producto);
      notificarItemAgregado(item);
      void showBriefNotice('Agregado', `${item.nombre} × 1`, 'success');
    } catch (e) {
      if (parseRecursoNoDisponible(e)?.kind === 'producto') {
        await refrescarMenuTrasOcultar();
      }
      await manejarErrorOperacion(e, {
        title: 'No se pudo agregar',
        message: 'El plato pudo haberse ocultado del menú. Actualiza e intenta de nuevo.',
      });
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
    if (r.navSidebar && !soloBebidas && permMesero.enviar_cocina) {
      return '+ agrega 1 · la barra derecha se actualiza. Tú pasas a cocina cuando quieras.';
    }
    if (soloBebidas) {
      return '+ al instante · toca la fila para cantidad o nota.';
    }
    if (soloParaLlevar) {
      return '+ estándar · toca el plato para empaque, notas u opciones.';
    }
    return '+ agrega 1 al instante · toca el plato para personalizar.';
  }, [modoSeleccion, soloBebidas, soloParaLlevar, r.navSidebar, permMesero.enviar_cocina]);

  function renderModosSeleccion() {
    return (
      <View style={styles.modesBlock}>
        <Text style={styles.modesLabel}>Modos de selección</Text>
        <View style={styles.modesRow}>
          <AnimatedPressable
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
              color={!modoSeleccion ? colors.onPrimary : colors.primary}
            />
            <Text
              style={[
                styles.modeBtnText,
                !modoSeleccion && styles.modeBtnTextActive,
              ]}
            >
              Uno a uno
            </Text>
          </AnimatedPressable>
          <AnimatedPressable
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
              color={modoSeleccion ? colors.onPrimary : colors.primary}
            />
            <Text
              style={[
                styles.modeBtnText,
                modoSeleccion && styles.modeBtnTextActive,
              ]}
            >
              Varios
            </Text>
          </AnimatedPressable>
        </View>
        <Text style={styles.modeHint}>{hintModoActivo}</Text>
      </View>
    );
  }

  if (loading && !data) {
    return <ScreenLoading />;
  }

  if (!data || sections.length === 0) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          variant="plain"
          align="center"
          eyebrow="Menú"
          title={soloBebidas ? 'Solo bebidas' : 'Disponible hoy'}
          titleStyle={{ fontSize: r.fontSize.h1 }}
          style={{ paddingHorizontal: r.contentPadding }}
        />
        <View style={{ flex: 1, paddingHorizontal: r.contentPadding }}>
          <Text style={styles.empty}>
            {soloBebidas
              ? 'No hay categorías de bebidas en el menú de hoy.'
              : 'No hay productos disponibles hoy.'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        variant="plain"
        align="center"
        eyebrow="Menú"
        title={soloBebidas ? 'Solo bebidas' : 'Disponible hoy'}
        titleStyle={{ fontSize: r.fontSize.h1 }}
        style={{ paddingHorizontal: r.contentPadding }}
      >
        {renderModosSeleccion()}
      </ScreenHeader>

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
                  icon={categoriaMenuIcon(s.title, s.icono_menu)}
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

      <FlashList
        ref={listRef}
        style={styles.listFlex}
        data={listRows}
        keyExtractor={(row) => row.key}
        getItemType={(row) => row.kind}
        stickyHeaderConfig={{ hideRelatedCell: true }}
        viewabilityConfigCallbackPairs={viewabilityPairs}
        contentContainerStyle={{ paddingBottom: listBottomPad }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          if (item.kind === 'header') {
            return renderSectionHeader(item.title);
          }
          return renderProductRow(
            item.product,
            item.indexInSection,
            item.totalInSection,
          );
        }}
      />

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
    </View>
  );
}

function createMenuPedidoStyles(c: AppColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  listFlex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modesBlock: {
    marginTop: 10,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    alignSelf: 'center',
  },
  modesLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: c.textMuted,
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
    borderColor: c.primary,
    backgroundColor: c.surface,
  },
  modeBtnActive: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: c.primary,
  },
  modeBtnTextActive: {
    color: c.onPrimary,
  },
  modeHint: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 16,
    color: c.textMuted,
    textAlign: 'center',
  },
  selectionBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.border,
    backgroundColor: c.surface,
    paddingTop: 8,
    paddingBottom: 8,
  },
  selectionCount: {
    fontSize: 13,
    fontWeight: '700',
    color: c.textMuted,
    textAlign: 'center',
    marginBottom: 6,
  },
  selectionActions: {
    justifyContent: 'center',
  },
  empty: { padding: 24, color: c.textMuted },
  catNavWrap: {
    paddingTop: 4,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
    backgroundColor: c.surfaceMuted,
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
    backgroundColor: c.background,
  },
  section: {
    fontSize: 13,
    fontWeight: '800',
    color: c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    backgroundColor: c.surface,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: c.border,
  },
  rowSelected: {
    backgroundColor: c.surfaceMuted,
  },
  rowAgotado: {
    opacity: 0.55,
  },
  stockHint: {
    fontSize: 12,
    color: c.danger,
    marginTop: 2,
  },
  rowCheck: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkBox: {
    fontSize: 16,
    fontWeight: '800',
    color: c.primary,
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
    borderBottomColor: c.borderLight,
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
    color: c.text,
    fontWeight: '600',
  },
  price: {
    fontSize: 14,
    color: c.primary,
    fontWeight: '800',
    flexShrink: 0,
  },
  chev: { fontSize: 18, color: c.textHint, flexShrink: 0 },
  });
}
