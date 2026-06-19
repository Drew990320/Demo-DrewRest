import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../../../src/context/AuthContext';
import { ActionIconBar } from '../../../../../src/components/ActionIconBar';
import { api } from '../../../../../src/lib/api';
import { readMenuTodayCache, writeMenuTodayCache } from '../../../../../src/lib/menu-cache';
import { showNotice } from '../../../../../src/lib/app-dialog';
import { enteroConDefecto } from '../../../../../src/lib/form-validation';
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

function alertDialog(title: string, message?: string) {
  void showNotice(title, message, 'info');
}

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
  const [cantidad, setCantidad] = useState('');
  const [nota, setNota] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [sinEmpaqueAuto, setSinEmpaqueAuto] = useState(false);
  const narrowField = useFormFieldStyle('narrow');
  const textField = useFormFieldStyle('text');

  const load = useCallback(async () => {
    let res = readMenuTodayCache<{
      categorias: { nombre: string; productos: Producto[] }[];
    }>();
    if (!res) {
      res = await api<{
        categorias: { nombre: string; productos: Producto[] }[];
      }>('/menu/today', { token, cacheKey: 'menu_today' });
      writeMenuTodayCache(res);
    }
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
    const q = enteroConDefecto(cantidad, 1);
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
      alertDialog('Error', e instanceof Error ? e.message : 'No se pudo agregar');
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
      alertDialog('Error', e instanceof Error ? e.message : 'No se pudo agregar');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!producto) {
    return (
      <View style={styles.center}>
        <Text>Producto no encontrado en el menú de hoy.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={formStyles.pageScrollContent}
    >
      <View style={styles.headerCard}>
        <Text style={styles.kicker}>Producto</Text>
        {colaRestante.length > 0 ? (
          <Text style={styles.colaHint}>
            Personalización en lote · {colaRestante.length + 1} plato(s) en esta
            tanda
          </Text>
        ) : null}
        <Text style={styles.h1}>{producto.nombre}</Text>
        <Text style={styles.price}>{formatCOP(producto.precio)} c/u</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Cantidad (opcional; 1 por defecto)</Text>
        <TextInput
          style={[styles.input, narrowField]}
          keyboardType="number-pad"
          placeholder="1 (opcional)"
          placeholderTextColor={colors.textHint}
          value={cantidad}
          onChangeText={setCantidad}
        />

        <Text style={styles.label}>Nota para cocina (opcional)</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    ...appShadow('elevated'),
  },
  kicker: { color: colors.textMuted, fontWeight: '700', letterSpacing: 0.3 },
  colaHint: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  h1: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 6 },
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
  addActions: { marginTop: 8, marginBottom: 16 },
  disabled: { opacity: 0.6 },
});
