import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { IconTooltipButton } from './IconTooltipButton';
import { MoneyTextInput } from './MoneyTextInput';
import { QtyStepper } from './QtyStepper';
import { useVisualTheme } from '../context/VisualThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { digitsFromMonto, parseCOPDigits } from '../lib/cop-input';
import { useFormStyles } from '../lib/form-layout';
import type { AppColors } from '../lib/theme';
import {
  nuevaEtiquetaPedidoId,
  nuevaReglaPromocionId,
  type EtiquetaPromocionPedido,
  type ReglaPromocion,
} from '@la-reserva/shared-domain/promociones-pedido';

type CategoriaPick = { id_categoria: number; nombre: string };
type ProductoPick = { id_producto: number; nombre: string; id_categoria?: number };

const TIPOS_REGLA: {
  id: ReglaPromocion['tipo'];
  label: string;
  hint: string;
}[] = [
  {
    id: 'precio_fijo_categoria',
    label: 'Precio fijo (cliente especial)',
    hint: 'Con la etiqueta activa, todos los ítems de la categoría cobran el mismo precio (ej. $35.000).',
  },
  {
    id: 'compra_paga',
    label: 'N×M (2×1, etc.)',
    hint: 'Por categoría o producto: compra N unidades y paga M (ej. 2×1).',
  },
  {
    id: 'umbral_subtotal_pedido',
    label: 'Por consumo mínimo',
    hint: 'Descuento fijo o % cuando el subtotal del pedido supera un umbral.',
  },
  {
    id: 'por_categoria',
    label: 'Rebaja por categoría',
    hint: 'Descuento fijo por unidad en una categoría si hay mínimo de ítems y subtotal en otras líneas.',
  },
  {
    id: 'por_categoria_marcada',
    label: 'Por categoría marcada',
    hint: 'Aplica a ítems cuya categoría tiene «Elegible para promos» en Categorías.',
  },
  {
    id: 'por_plato_principal',
    label: 'Por plato principal',
    hint: 'Rebaja por cada plato principal; opcionalmente solo con una etiqueta del pedido.',
  },
];

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: { gap: 16 },
    hint: { color: c.textMuted, fontSize: 13, lineHeight: 18 },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: c.text,
      marginBottom: 8,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      padding: 12,
      gap: 8,
    },
    reglaHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    reglaTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: c.text },
    reglaMeta: { fontSize: 12, color: c.textMuted, lineHeight: 17 },
    tipoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tipoChip: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
    },
    tipoChipActive: {
      borderColor: c.primary,
      backgroundColor: c.primaryMuted,
    },
    tipoChipText: { fontSize: 12, color: c.textMuted },
    tipoChipTextActive: { color: c.primary, fontWeight: '700' },
    catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    catChip: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    catChipActive: {
      borderColor: c.primary,
      backgroundColor: c.primaryMuted,
    },
    catChipText: { fontSize: 12, color: c.text },
    addRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  });
}

type Props = {
  reglas: ReglaPromocion[];
  etiquetas: EtiquetaPromocionPedido[];
  categorias: CategoriaPick[];
  productos?: ProductoPick[];
  onChangeReglas: (reglas: ReglaPromocion[]) => void;
  onChangeEtiquetas: (etiquetas: EtiquetaPromocionPedido[]) => void;
};

export function PromocionesAdminPanel({
  reglas,
  etiquetas,
  categorias,
  productos = [],
  onChangeReglas,
  onChangeEtiquetas,
}: Props) {
  const { colors } = useVisualTheme();
  const styles = useThemedStyles(createStyles);
  const formStyles = useFormStyles();

  const [tipoNueva, setTipoNueva] =
    useState<ReglaPromocion['tipo']>('precio_fijo_categoria');
  const [etiquetaNueva, setEtiquetaNueva] = useState('');
  const [montoDigits, setMontoDigits] = useState('');
  const [precioFijoDigits, setPrecioFijoDigits] = useState('');
  const [minUnidades, setMinUnidades] = useState('2');
  const [umbralDigits, setUmbralDigits] = useState('');
  const [minSubtotalPedidoDigits, setMinSubtotalPedidoDigits] = useState('');
  const [montoDescuentoDigits, setMontoDescuentoDigits] = useState('');
  const [porcentajeDescuento, setPorcentajeDescuento] = useState('');
  const [compraUnidades, setCompraUnidades] = useState('2');
  const [pagaUnidades, setPagaUnidades] = useState('1');
  const [alcanceCompraPaga, setAlcanceCompraPaga] = useState<'categoria' | 'producto'>(
    'categoria',
  );
  const [idCategoria, setIdCategoria] = useState<number | null>(
    categorias[0]?.id_categoria ?? null,
  );
  const [idProducto, setIdProducto] = useState<number | null>(
    productos[0]?.id_producto ?? null,
  );
  const [requiereEtiqueta, setRequiereEtiqueta] = useState<string | null>(
    etiquetas.find((e) => e.activa)?.id ?? null,
  );

  const [etqLabel, setEtqLabel] = useState('');
  const [etqDesc, setEtqDesc] = useState('');

  function agregarRegla() {
    const label = etiquetaNueva.trim() || 'Nueva promoción';
    const base = {
      id: nuevaReglaPromocionId(),
      activa: true,
      etiqueta: label,
    };

    if (tipoNueva === 'precio_fijo_categoria') {
      const precio = parseCOPDigits(precioFijoDigits);
      if (precio <= 0 || idCategoria == null || !requiereEtiqueta) return;
      onChangeReglas([
        ...reglas,
        {
          ...base,
          tipo: 'precio_fijo_categoria',
          id_categoria: idCategoria,
          precio_fijo_unidad: precio,
          requiere_etiqueta_pedido: requiereEtiqueta,
        },
      ]);
    } else if (tipoNueva === 'compra_paga') {
      const compra = Math.max(2, Number(compraUnidades) || 2);
      const paga = Math.max(1, Number(pagaUnidades) || 1);
      if (paga >= compra) return;
      if (alcanceCompraPaga === 'categoria' && idCategoria == null) return;
      if (alcanceCompraPaga === 'producto' && idProducto == null) return;
      onChangeReglas([
        ...reglas,
        {
          ...base,
          tipo: 'compra_paga',
          alcance: alcanceCompraPaga,
          ...(alcanceCompraPaga === 'categoria' && idCategoria != null
            ? { id_categoria: idCategoria }
            : {}),
          ...(alcanceCompraPaga === 'producto' && idProducto != null
            ? { id_producto: idProducto }
            : {}),
          compra_unidades: compra,
          paga_unidades: paga,
          ...(requiereEtiqueta ? { requiere_etiqueta_pedido: requiereEtiqueta } : {}),
          ...(parseCOPDigits(minSubtotalPedidoDigits) > 0
            ? { min_subtotal_pedido: parseCOPDigits(minSubtotalPedidoDigits) }
            : {}),
        },
      ]);
    } else if (tipoNueva === 'umbral_subtotal_pedido') {
      const minSub = parseCOPDigits(minSubtotalPedidoDigits);
      const montoDesc = parseCOPDigits(montoDescuentoDigits);
      const pct = Math.min(100, Math.max(0, Number(porcentajeDescuento) || 0));
      if (minSub <= 0 || (montoDesc <= 0 && pct <= 0)) return;
      onChangeReglas([
        ...reglas,
        {
          ...base,
          tipo: 'umbral_subtotal_pedido',
          min_subtotal_pedido: minSub,
          ...(montoDesc > 0 ? { monto_descuento: montoDesc } : {}),
          ...(pct > 0 ? { porcentaje_descuento: pct } : {}),
          ...(requiereEtiqueta ? { requiere_etiqueta_pedido: requiereEtiqueta } : {}),
        },
      ]);
    } else if (tipoNueva === 'por_categoria') {
      const monto = parseCOPDigits(montoDigits);
      const minU = Math.max(1, Number(minUnidades) || 1);
      const umbral = parseCOPDigits(umbralDigits);
      if (monto <= 0 || idCategoria == null) return;
      onChangeReglas([
        ...reglas,
        {
          ...base,
          tipo: 'por_categoria',
          id_categoria: idCategoria,
          monto_por_unidad: monto,
          min_unidades: minU,
          min_subtotal_otros: umbral,
        },
      ]);
    } else if (tipoNueva === 'por_categoria_marcada') {
      const monto = parseCOPDigits(montoDigits);
      const minU = Math.max(1, Number(minUnidades) || 1);
      const umbral = parseCOPDigits(umbralDigits);
      if (monto <= 0) return;
      onChangeReglas([
        ...reglas,
        {
          ...base,
          tipo: 'por_categoria_marcada',
          monto_por_unidad: monto,
          min_unidades: minU,
          min_subtotal_otros: umbral,
        },
      ]);
    } else {
      const monto = parseCOPDigits(montoDigits);
      const minU = Math.max(1, Number(minUnidades) || 1);
      if (monto <= 0) return;
      onChangeReglas([
        ...reglas,
        {
          ...base,
          tipo: 'por_plato_principal',
          monto_por_unidad: monto,
          min_unidades: minU,
          ...(requiereEtiqueta ? { requiere_etiqueta_pedido: requiereEtiqueta } : {}),
        },
      ]);
    }
    setEtiquetaNueva('');
    setMontoDigits('');
    setPrecioFijoDigits('');
    setMinUnidades('2');
    setUmbralDigits('');
    setMinSubtotalPedidoDigits('');
    setMontoDescuentoDigits('');
    setPorcentajeDescuento('');
    setCompraUnidades('2');
    setPagaUnidades('1');
    setRequiereEtiqueta(etiquetas.find((e) => e.activa)?.id ?? null);
  }

  function agregarEtiqueta() {
    const etiqueta = etqLabel.trim();
    if (!etiqueta) return;
    onChangeEtiquetas([
      ...etiquetas,
      {
        id: nuevaEtiquetaPedidoId(),
        etiqueta,
        activa: true,
        ...(etqDesc.trim() ? { descripcion: etqDesc.trim() } : {}),
      },
    ]);
    setEtqLabel('');
    setEtqDesc('');
  }

  function metaRegla(r: ReglaPromocion): string {
    const etq = (id?: string) =>
      id
        ? (etiquetas.find((e) => e.id === id)?.etiqueta ?? id)
        : 'cualquier pedido';
    if (r.tipo === 'precio_fijo_categoria') {
      const cat = categorias.find((c) => c.id_categoria === r.id_categoria);
      return `${cat?.nombre ?? `Cat. ${r.id_categoria}`} → ${r.precio_fijo_unidad.toLocaleString('es-CO')} c/u · etiqueta: ${etq(r.requiere_etiqueta_pedido)}`;
    }
    if (r.tipo === 'compra_paga') {
      const scope =
        r.alcance === 'producto'
          ? (productos.find((p) => p.id_producto === r.id_producto)?.nombre ??
            `Prod. ${r.id_producto}`)
          : (categorias.find((c) => c.id_categoria === r.id_categoria)?.nombre ??
            `Cat. ${r.id_categoria}`);
      return `${r.compra_unidades}×${r.paga_unidades} · ${scope}${r.min_subtotal_pedido ? ` · mín. ${r.min_subtotal_pedido.toLocaleString('es-CO')}` : ''}`;
    }
    if (r.tipo === 'umbral_subtotal_pedido') {
      const desc =
        r.monto_descuento != null && r.monto_descuento > 0
          ? `−${r.monto_descuento.toLocaleString('es-CO')}`
          : r.porcentaje_descuento != null
            ? `−${r.porcentaje_descuento}%`
            : '';
      return `Consumo ≥ ${r.min_subtotal_pedido.toLocaleString('es-CO')} · ${desc}`;
    }
    if (r.tipo === 'por_categoria') {
      const cat = categorias.find((c) => c.id_categoria === r.id_categoria);
      return `${cat?.nombre ?? `Cat. ${r.id_categoria}`} · −${r.monto_por_unidad.toLocaleString('es-CO')} c/u · mín. ${r.min_unidades} u · otros ≥ ${r.min_subtotal_otros.toLocaleString('es-CO')}`;
    }
    if (r.tipo === 'por_categoria_marcada') {
      return `Categorías marcadas · −${r.monto_por_unidad.toLocaleString('es-CO')} c/u · mín. ${r.min_unidades} u · otros ≥ ${r.min_subtotal_otros.toLocaleString('es-CO')}`;
    }
    const etqLabel = r.requiere_etiqueta_pedido
      ? etiquetas.find((e) => e.id === r.requiere_etiqueta_pedido)?.etiqueta ??
        r.requiere_etiqueta_pedido
      : 'sin etiqueta requerida';
    return `Plato principal · −${r.monto_por_unidad.toLocaleString('es-CO')} c/u · mín. ${r.min_unidades} · etiqueta: ${etqLabel}`;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>
        Define promociones reutilizables para cualquier restaurante. En el cobro,
        el mesero activa etiquetas del pedido cuando correspondan.
      </Text>

      <Text style={styles.sectionTitle}>Etiquetas del pedido</Text>
      {etiquetas.map((e) => (
        <View key={e.id} style={styles.card}>
          <View style={styles.reglaHead}>
            <Text style={styles.reglaTitle}>{e.etiqueta}</Text>
            <Switch
              value={e.activa}
              onValueChange={(v) =>
                onChangeEtiquetas(
                  etiquetas.map((x) =>
                    x.id === e.id ? { ...x, activa: v } : x,
                  ),
                )
              }
              trackColor={{ false: colors.borderInput, true: colors.successBorder }}
              thumbColor={e.activa ? colors.primary : colors.borderLight}
            />
          </View>
          {e.descripcion ? (
            <Text style={styles.reglaMeta}>{e.descripcion}</Text>
          ) : null}
          <IconTooltipButton
            icon="trash-outline"
            label="Eliminar etiqueta"
            variant="danger"
            fixedSize
            size={18}
            onPress={() =>
              onChangeEtiquetas(etiquetas.filter((x) => x.id !== e.id))
            }
          />
        </View>
      ))}
      <Text style={formStyles.label}>Nueva etiqueta</Text>
      <TextInput
        style={formStyles.input}
        value={etqLabel}
        onChangeText={setEtqLabel}
        placeholder="Ej. Convenio empresa, Empleado"
      />
      <TextInput
        style={formStyles.input}
        value={etqDesc}
        onChangeText={setEtqDesc}
        placeholder="Descripción opcional para el mesero"
      />
      <Pressable style={formStyles.secondaryBtn} onPress={agregarEtiqueta}>
        <Text style={formStyles.secondaryBtnText}>Agregar etiqueta</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Reglas de descuento</Text>
      {reglas.map((r) => (
        <View key={r.id} style={styles.card}>
          <View style={styles.reglaHead}>
            <Text style={styles.reglaTitle}>{r.etiqueta}</Text>
            <Switch
              value={r.activa}
              onValueChange={(v) =>
                onChangeReglas(
                  reglas.map((x) => (x.id === r.id ? { ...x, activa: v } : x)),
                )
              }
              trackColor={{ false: colors.borderInput, true: colors.successBorder }}
              thumbColor={r.activa ? colors.primary : colors.borderLight}
            />
          </View>
          <Text style={styles.reglaMeta}>{metaRegla(r)}</Text>
          <IconTooltipButton
            icon="trash-outline"
            label="Eliminar regla"
            variant="danger"
            fixedSize
            size={18}
            onPress={() => onChangeReglas(reglas.filter((x) => x.id !== r.id))}
          />
        </View>
      ))}

      <View style={styles.card}>
        <Text style={formStyles.label}>Tipo de regla</Text>
        <View style={styles.tipoRow}>
          {TIPOS_REGLA.map((t) => {
            const active = tipoNueva === t.id;
            return (
              <Pressable
                key={t.id}
                style={[styles.tipoChip, active && styles.tipoChipActive]}
                onPress={() => setTipoNueva(t.id)}
              >
                <Text
                  style={[styles.tipoChipText, active && styles.tipoChipTextActive]}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.hint}>
          {TIPOS_REGLA.find((t) => t.id === tipoNueva)?.hint}
        </Text>

        <Text style={formStyles.label}>Nombre en ticket</Text>
        <TextInput
          style={formStyles.input}
          value={etiquetaNueva}
          onChangeText={setEtiquetaNueva}
          placeholder="Ej. Promo 2x1 bebidas"
        />

        {(tipoNueva === 'precio_fijo_categoria' ||
          tipoNueva === 'compra_paga' ||
          tipoNueva === 'umbral_subtotal_pedido' ||
          tipoNueva === 'por_plato_principal') &&
        etiquetas.length > 0 ? (
          <>
            <Text style={formStyles.label}>
              {tipoNueva === 'precio_fijo_categoria'
                ? 'Etiqueta requerida (obligatoria)'
                : 'Etiqueta del pedido (opcional)'}
            </Text>
            <View style={styles.catRow}>
              {tipoNueva !== 'precio_fijo_categoria' ? (
                <Pressable
                  style={[styles.catChip, requiereEtiqueta == null && styles.catChipActive]}
                  onPress={() => setRequiereEtiqueta(null)}
                >
                  <Text style={styles.catChipText}>Ninguna</Text>
                </Pressable>
              ) : null}
              {etiquetas.map((e) => (
                <Pressable
                  key={e.id}
                  style={[
                    styles.catChip,
                    requiereEtiqueta === e.id && styles.catChipActive,
                  ]}
                  onPress={() => setRequiereEtiqueta(e.id)}
                >
                  <Text style={styles.catChipText}>{e.etiqueta}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        {(tipoNueva === 'precio_fijo_categoria' ||
          tipoNueva === 'por_categoria' ||
          tipoNueva === 'compra_paga') &&
        alcanceCompraPaga === 'categoria' ? (
          <>
            <Text style={formStyles.label}>Categoría</Text>
            <View style={styles.catRow}>
              {categorias.map((c) => {
                const active = idCategoria === c.id_categoria;
                return (
                  <Pressable
                    key={c.id_categoria}
                    style={[styles.catChip, active && styles.catChipActive]}
                    onPress={() => setIdCategoria(c.id_categoria)}
                  >
                    <Text style={styles.catChipText}>{c.nombre}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        {tipoNueva === 'precio_fijo_categoria' ? (
          <>
            <Text style={formStyles.label}>Precio fijo por unidad (COP)</Text>
            <MoneyTextInput
              style={formStyles.input}
              placeholderAmount={35000}
              digits={precioFijoDigits}
              onChangeDigits={setPrecioFijoDigits}
            />
          </>
        ) : null}

        {tipoNueva === 'compra_paga' ? (
          <>
            <Text style={formStyles.label}>Alcance</Text>
            <View style={styles.catRow}>
              {(['categoria', 'producto'] as const).map((a) => (
                <Pressable
                  key={a}
                  style={[
                    styles.catChip,
                    alcanceCompraPaga === a && styles.catChipActive,
                  ]}
                  onPress={() => setAlcanceCompraPaga(a)}
                >
                  <Text style={styles.catChipText}>
                    {a === 'categoria' ? 'Categoría' : 'Producto'}
                  </Text>
                </Pressable>
              ))}
            </View>
            {alcanceCompraPaga === 'producto' ? (
              <>
                <Text style={formStyles.label}>Producto</Text>
                <View style={styles.catRow}>
                  {productos.slice(0, 24).map((p) => (
                    <Pressable
                      key={p.id_producto}
                      style={[
                        styles.catChip,
                        idProducto === p.id_producto && styles.catChipActive,
                      ]}
                      onPress={() => setIdProducto(p.id_producto)}
                    >
                      <Text style={styles.catChipText}>{p.nombre}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}
            <Text style={formStyles.label}>Compra (unidades)</Text>
            <QtyStepper
              value={Math.max(2, Number(compraUnidades) || 2)}
              min={2}
              max={20}
              onChange={(n) => setCompraUnidades(String(n))}
            />
            <Text style={formStyles.label}>Paga (unidades)</Text>
            <QtyStepper
              value={Math.max(1, Number(pagaUnidades) || 1)}
              min={1}
              max={19}
              onChange={(n) => setPagaUnidades(String(n))}
            />
            <Text style={formStyles.label}>Consumo mínimo del pedido (opcional)</Text>
            <MoneyTextInput
              style={formStyles.input}
              placeholderAmount={0}
              digits={minSubtotalPedidoDigits}
              onChangeDigits={setMinSubtotalPedidoDigits}
            />
          </>
        ) : null}

        {tipoNueva === 'umbral_subtotal_pedido' ? (
          <>
            <Text style={formStyles.label}>Subtotal mínimo del pedido</Text>
            <MoneyTextInput
              style={formStyles.input}
              placeholderAmount={100000}
              digits={minSubtotalPedidoDigits}
              onChangeDigits={setMinSubtotalPedidoDigits}
            />
            <Text style={formStyles.label}>Descuento fijo (COP)</Text>
            <MoneyTextInput
              style={formStyles.input}
              placeholderAmount={0}
              digits={montoDescuentoDigits}
              onChangeDigits={setMontoDescuentoDigits}
            />
            <Text style={formStyles.label}>O descuento % (0–100)</Text>
            <TextInput
              style={formStyles.input}
              value={porcentajeDescuento}
              onChangeText={(t) => setPorcentajeDescuento(t.replace(/\D/g, '').slice(0, 3))}
              keyboardType="number-pad"
              placeholder="10"
            />
          </>
        ) : null}

        {tipoNueva === 'por_categoria' ? (
          <>
            <Text style={formStyles.label}>Umbral subtotal otras líneas</Text>
            <MoneyTextInput
              style={formStyles.input}
              placeholderAmount={50000}
              digits={umbralDigits}
              onChangeDigits={setUmbralDigits}
            />
          </>
        ) : null}

        {tipoNueva === 'por_categoria_marcada' ? (
          <>
            <Text style={formStyles.label}>Umbral subtotal otras líneas</Text>
            <MoneyTextInput
              style={formStyles.input}
              placeholderAmount={50000}
              digits={umbralDigits}
              onChangeDigits={setUmbralDigits}
            />
          </>
        ) : null}

        {tipoNueva === 'por_categoria' ||
        tipoNueva === 'por_categoria_marcada' ||
        tipoNueva === 'por_plato_principal' ? (
          <>
            <Text style={formStyles.label}>Monto por unidad (COP)</Text>
            <MoneyTextInput
              style={formStyles.input}
              placeholderAmount={2000}
              digits={montoDigits}
              onChangeDigits={setMontoDigits}
            />
            <Text style={formStyles.label}>Mínimo de unidades</Text>
            <QtyStepper
              value={Math.max(1, Number(minUnidades) || 1)}
              min={1}
              max={99}
              onChange={(n) => setMinUnidades(String(n))}
            />
          </>
        ) : null}

        <Pressable style={formStyles.primaryBtn} onPress={agregarRegla}>
          <Text style={formStyles.primaryBtnText}>Agregar regla</Text>
        </Pressable>
      </View>
    </View>
  );
}
