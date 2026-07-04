import { useCallback, useMemo, useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PedidoIcon, AdminIcon } from '../../../../../src/lib/app-icons';
import { ActionIconBar } from '../../../../../src/components/ActionIconBar';
import { EmptyState } from '../../../../../src/components/EmptyState';
import { QtyStepper } from '../../../../../src/components/QtyStepper';
import { ScreenLoading } from '../../../../../src/components/ScreenLoading';
import { ScreenScroll } from '../../../../../src/components/ScreenScroll';
import { ScreenHeader } from '../../../../../src/components/ScreenHeader';
import { useAuth } from '../../../../../src/context/AuthContext';
import { api } from '../../../../../src/lib/api';
import { readMenuTodayCache } from '../../../../../src/lib/menu-cache';
import { warmMenuTodayCache } from '../../../../../src/lib/menu-prefetch';
import { manejarErrorAccion } from '../../../../../src/lib/recurso-disponible';
import {
  menuProductoQueryParams,
  parseColaPersonalizarMenu,
} from '../../../../../src/lib/menu-agregar-rapido';
import { productoCobraEmpaqueParaLlevarPorPlatoFuerte } from '../../../../../src/lib/empaque-para-llevar';
import { useFormFieldStyle } from '../../../../../src/hooks/useFormFieldStyle';
import { formStyles } from '../../../../../src/lib/form-layout';
import { formatCOP } from '../../../../../src/lib/format';
import { appShadow } from '../../../../../src/lib/shadow';
import { colors } from '../../../../../src/lib/theme';

type Opcion = { id_opcion: number; tipo: string; descripcion: string };
type Producto = {
  id_producto: number;
  nombre: string;
  precio: number;
  es_plato_principal?: boolean;
  es_empacable?: boolean;
  /** Rellenado desde la categoría del menú (necesario para empaque para llevar). */
  categoria_nombre?: string;
  opciones: Opcion[];
};

function menuQueryFromParams(
  bebidas?: string,
  paraLlevar?: string,
  colaPersonalizar?: string | string[],
): string {
  return menuProductoQueryParams({
    bebidas: bebidas === '1' || bebidas === 'true',
    paraLlevar: paraLlevar === '1' || paraLlevar === 'true',
    colaPersonalizar: parseColaPersonalizarMenu(colaPersonalizar),
  });
}

export default function ProductoPersonalizarScreen() {
  const { pedidoId, productoId, paraLlevar, bebidas, colaPersonalizar } =
    useLocalSearchParams<{
    pedidoId: string;
    productoId: string;
    paraLlevar?: string;
    bebidas?: string;
    colaPersonalizar?: string;
  }>();
  const esParaLlevar = paraLlevar === '1' || paraLlevar === 'true';
  const esBebidas = bebidas === '1' || bebidas === 'true';
  const colaRestante = useMemo(
    () => parseColaPersonalizarMenu(colaPersonalizar),
    [colaPersonalizar],
  );
  const pid = Number(productoId);
  const { token } = useAuth();
  const router = useRouter();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [cantidad, setCantidad] = useState(1);
  const [nota, setNota] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [sinEmpaqueAuto, setSinEmpaqueAuto] = useState(false);
  const [idMesaPedido, setIdMesaPedido] = useState<number | null>(null);
  const textField = useFormFieldStyle('text');

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
    await warmMenuTodayCache(token);
    const res = readMenuTodayCache<{
      categorias: { nombre: string; productos: Producto[] }[];
    }>();
    if (!res) return;
    let found: Producto | null = null;
    for (const c of res.categorias) {
      const p = c.productos.find((x) => x.id_producto === pid);
      if (p) {
        found = { ...p, categoria_nombre: c.nombre };
        break;
      }
    }
    setProducto(found);
  }, [token, pid]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
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

  const opcionesByTipo = useMemo(() => {
    if (!producto) return { omitir: [] as Opcion[], aderezo: [] as Opcion[] };
    const omitir = producto.opciones.filter((o) => o.tipo === 'omitir_ingrediente');
    const aderezo = producto.opciones.filter((o) => o.tipo === 'aderezo');
    return { omitir, aderezo };
  }, [producto]);

  function toggle(id: number) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function ejecutarAgregarLinea(): Promise<{ id_mesa: number }> {
    const q = Math.max(1, cantidad);
    const body: Record<string, unknown> = {
      id_producto: pid,
      cantidad: q,
      nota_cocina: nota.trim() || undefined,
      opcion_ids: Array.from(selected),
    };
    if (
      esParaLlevar &&
      producto &&
      productoCobraEmpaqueParaLlevarPorPlatoFuerte({
        es_plato_principal: producto.es_plato_principal,
        es_empacable: producto.es_empacable,
        categoria_nombre: producto.categoria_nombre ?? '',
      }) &&
      sinEmpaqueAuto
    ) {
      body.sin_empaque_auto = true;
    }
    await api(`/pedidos/${pedidoId}/detalles`, {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    });
    return api<{ id_mesa: number }>(`/pedidos/${pedidoId}`, {
      token,
      cacheKey: `pedido_${pedidoId}`,
    });
  }

  async function agregarYSeguirEnMenu() {
    setBusy(true);
    try {
      await ejecutarAgregarLinea();
      if (colaRestante.length > 0) {
        router.replace(
          `/(app)/pedido/${pedidoId}/producto/${colaRestante[0]}${menuProductoQueryParams(
            {
              bebidas: esBebidas,
              paraLlevar: esParaLlevar,
              colaPersonalizar: colaRestante.slice(1),
            },
          )}`,
        );
        return;
      }
      const suf = menuQueryFromParams(bebidas, paraLlevar);
      router.replace(`/(app)/pedido/${pedidoId}/menu${suf}`);
    } catch (e) {
      await manejarErrorAccion(e, 'agregar el ítem al pedido');
    } finally {
      setBusy(false);
    }
  }

  async function agregarYVolverAMesa() {
    setBusy(true);
    try {
      const ped = await ejecutarAgregarLinea();
      router.replace(`/(app)/mesa/${ped.id_mesa}`);
    } catch (e) {
      await manejarErrorAccion(e, 'agregar el ítem al pedido');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <ScreenLoading />;
  }

  if (!producto) {
    const suf = menuQueryFromParams(bebidas, paraLlevar);
    return (
      <View style={styles.center}>
        <EmptyState
          title="Plato no disponible"
          message="Este plato ya no está en el menú de hoy. Un administrador pudo haberlo ocultado mientras lo seleccionabas."
          actions={[
            {
              key: 'menu',
              icon: PedidoIcon.agregarMenu,
              label: 'Volver al menú',
              variant: 'primary',
              onPress: () =>
                router.replace(`/(app)/pedido/${pedidoId}/menu${suf}`),
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
      </View>
    );
  }

  return (
    <ScreenScroll>
      <ScreenHeader eyebrow="Producto" title={producto.nombre}>
        {colaRestante.length > 0 ? (
          <Text style={styles.colaHint}>
            Personalización en lote · {colaRestante.length + 1} plato(s) en esta
            tanda
          </Text>
        ) : null}
        <Text style={styles.price}>{formatCOP(producto.precio)} c/u</Text>
      </ScreenHeader>

      <View style={styles.card}>
        <QtyStepper
          label="Cantidad"
          value={cantidad}
          onChange={setCantidad}
          disabled={busy}
        />

        <Text style={[styles.label, styles.notaLabel]}>Nota para cocina (opcional)</Text>
        <TextInput
          style={[styles.input, styles.multiline, textField]}
          multiline
          placeholder="Ej. poco sal"
          placeholderTextColor={colors.textHint}
          value={nota}
          onChangeText={setNota}
        />
      </View>

      {opcionesByTipo.omitir.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.section}>Ingredientes a omitir</Text>
          {opcionesByTipo.omitir.map((o) => (
            <Pressable
              key={o.id_opcion}
              style={[styles.chk, selected.has(o.id_opcion) && styles.chkOn]}
              onPress={() => toggle(o.id_opcion)}
            >
              <Text style={styles.chkBox}>{selected.has(o.id_opcion) ? '✓' : ''}</Text>
              <Text style={styles.chkLabel}>{o.descripcion}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {opcionesByTipo.aderezo.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.section}>Aderezo</Text>
          {opcionesByTipo.aderezo.map((o) => (
            <Pressable
              key={o.id_opcion}
              style={[styles.chk, selected.has(o.id_opcion) && styles.chkOn]}
              onPress={() => toggle(o.id_opcion)}
            >
              <Text style={styles.chkBox}>{selected.has(o.id_opcion) ? '✓' : ''}</Text>
              <Text style={styles.chkLabel}>{o.descripcion}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {esParaLlevar &&
      producto &&
      productoCobraEmpaqueParaLlevarPorPlatoFuerte({
        es_plato_principal: producto.es_plato_principal,
        es_empacable: producto.es_empacable,
        categoria_nombre: producto.categoria_nombre ?? '',
      }) ? (
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.section}>Empaque automático</Text>
              <Text style={styles.switchHint}>
                Para llevar: $1.000 por cada unidad de plato fuerte o menú
                infantil. Desactívalo si no necesitan empaque.
              </Text>
            </View>
            <Switch
              value={!sinEmpaqueAuto}
              onValueChange={(v) => setSinEmpaqueAuto(!v)}
              trackColor={{ false: colors.borderInput, true: colors.successBorder }}
              thumbColor={!sinEmpaqueAuto ? colors.primary : colors.borderLight}
            />
          </View>
        </View>
      ) : null}

      <Text style={styles.flowHint}>
        Si el cliente pide más después, en la mesa vuelve a usar «Agregar del menú».
      </Text>
      <ActionIconBar
        style={styles.addActions}
        actions={[
          {
            key: 'seguir',
            icon: busy ? 'hourglass-outline' : 'add-circle-outline',
            label: busy
              ? 'Agregando…'
              : colaRestante.length > 0
                ? `Agregar y siguiente (${colaRestante.length} más)`
                : 'Agregar y seguir con el menú',
            variant: 'primary',
            disabled: busy,
            onPress: agregarYSeguirEnMenu,
          },
          {
            key: 'mesa',
            icon: 'checkmark-circle-outline',
            label: 'Agregar y volver a la mesa',
            variant: 'secondary',
            disabled: busy,
            onPress: agregarYVolverAMesa,
          },
        ]}
      />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  colaHint: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  price: { fontSize: 16, color: colors.textMuted, marginTop: 8 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    ...appShadow('soft'),
  },
  label: { fontWeight: '700', marginBottom: 6, color: colors.text },
  notaLabel: { marginTop: 16 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    backgroundColor: colors.surface,
    fontSize: 16,
  },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  section: { marginBottom: 10, fontWeight: '800', color: colors.text },
  chk: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 8,
  },
  chkOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  chkBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderInput,
    marginRight: 10,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: colors.primary,
    fontWeight: '900',
    lineHeight: 22,
  },
  chkLabel: { fontSize: 16, color: colors.text, flex: 1, fontWeight: '600' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchHint: { fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
  flowHint: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  addActions: { marginTop: 8, marginBottom: 8 },
  volverNav: { marginTop: 4, marginBottom: 16 },
  disabled: { opacity: 0.6 },
});
