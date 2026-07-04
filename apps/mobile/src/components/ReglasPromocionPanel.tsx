import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ActionIconBar } from './ActionIconBar';
import { IconTooltipButton } from './IconTooltipButton';
import { MoneyTextInput } from './MoneyTextInput';
import { digitsFromMonto, parseCOPDigits } from '../lib/cop-input';
import { formStyles } from '../lib/form-layout';
import { colors } from '../lib/theme';
import {
  nuevaReglaPromocionId,
  type ReglaPromocionPorCategoria,
} from '../lib/promociones-pedido';

type CategoriaPick = { id_categoria: number; nombre: string };

type Props = {
  reglas: ReglaPromocionPorCategoria[];
  categorias: CategoriaPick[];
  onChange: (reglas: ReglaPromocionPorCategoria[]) => void;
};

export function ReglasPromocionPanel({
  reglas,
  categorias,
  onChange,
}: Props) {
  const [idCategoria, setIdCategoria] = useState<number | null>(
    categorias[0]?.id_categoria ?? null,
  );
  const [etiqueta, setEtiqueta] = useState('');
  const [montoDigits, setMontoDigits] = useState('');
  const [minUnidades, setMinUnidades] = useState('2');
  const [umbralDigits, setUmbralDigits] = useState('');

  function agregar() {
    if (idCategoria == null) return;
    const cat = categorias.find((c) => c.id_categoria === idCategoria);
    const monto = parseCOPDigits(montoDigits);
    const minU = Math.max(1, Number(minUnidades) || 2);
    const umbral = parseCOPDigits(umbralDigits);
    if (monto <= 0) return;
    const label =
      etiqueta.trim() || `Promo ${cat?.nombre ?? `cat. ${idCategoria}`}`;
    onChange([
      ...reglas,
      {
        id: nuevaReglaPromocionId(),
        activa: true,
        etiqueta: label,
        tipo: 'por_categoria',
        id_categoria: idCategoria,
        monto_por_unidad: monto,
        min_unidades: minU,
        min_subtotal_otros: umbral,
      },
    ]);
    setEtiqueta('');
    setMontoDigits('');
    setMinUnidades('2');
    setUmbralDigits('');
  }

  function quitar(id: string) {
    onChange(reglas.filter((r) => r.id !== id));
  }

  function toggleActiva(id: string, activa: boolean) {
    onChange(reglas.map((r) => (r.id === id ? { ...r, activa } : r)));
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>
        Descuentos extra por categoría (como sopas, pero para cualquier
        categoría). Se suman a los descuentos de sopas y camioneros.
      </Text>
      {reglas.map((r) => {
        const cat = categorias.find((c) => c.id_categoria === r.id_categoria);
        return (
          <View key={r.id} style={styles.reglaRow}>
            <View style={styles.reglaHead}>
              <Text style={styles.reglaTitle}>{r.etiqueta}</Text>
              <Switch
                value={r.activa}
                onValueChange={(v) => toggleActiva(r.id, v)}
                trackColor={{
                  false: colors.borderInput,
                  true: colors.successBorder,
                }}
                thumbColor={r.activa ? colors.primary : colors.borderLight}
              />
            </View>
            <Text style={styles.reglaMeta}>
              {cat?.nombre ?? `Cat. ${r.id_categoria}`} · −
              {r.monto_por_unidad.toLocaleString('es-CO')} c/u · mín.{' '}
              {r.min_unidades} u · otros ≥{' '}
              {r.min_subtotal_otros.toLocaleString('es-CO')}
            </Text>
            <IconTooltipButton
              icon="trash-outline"
              label="Eliminar regla"
              variant="danger"
              fixedSize
              size={18}
              onPress={() => quitar(r.id)}
            />
          </View>
        );
      })}
      <Text style={[formStyles.label, styles.fieldGap]}>Nueva promoción</Text>
      <Text style={styles.fieldLabel}>Categoría</Text>
      <View style={styles.chipRow}>
        {categorias.map((c) => (
          <Pressable
            key={c.id_categoria}
            onPress={() => setIdCategoria(c.id_categoria)}
            style={[
              styles.chip,
              idCategoria === c.id_categoria && styles.chipOn,
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.chipText,
                idCategoria === c.id_categoria && styles.chipTextOn,
              ]}
            >
              {c.nombre}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.fieldLabel}>Etiqueta en factura (opcional)</Text>
      <TextInput
        style={styles.input}
        value={etiqueta}
        onChangeText={setEtiqueta}
        placeholder="Ej. Promo postres"
      />
      <Text style={styles.fieldLabel}>Monto por unidad (COP)</Text>
      <MoneyTextInput
        style={styles.input}
        placeholderAmount={2000}
        digits={montoDigits}
        onChangeDigits={setMontoDigits}
      />
      <View style={styles.pairRow}>
        <View style={styles.pairCol}>
          <Text style={styles.fieldLabel}>Mín. unidades</Text>
          <TextInput
            style={styles.input}
            value={minUnidades}
            onChangeText={(t) => setMinUnidades(t.replace(/\D/g, '').slice(0, 2))}
            keyboardType="number-pad"
            placeholder="2"
          />
        </View>
        <View style={styles.pairCol}>
          <Text style={styles.fieldLabel}>Umbral otros ítems</Text>
          <MoneyTextInput
            style={styles.input}
            placeholderAmount={50000}
            digits={umbralDigits}
            onChangeDigits={setUmbralDigits}
          />
        </View>
      </View>
      <ActionIconBar
        style={formStyles.centeredSingleAction}
        actions={[
          {
            key: 'add-promo',
            icon: 'add',
            label: 'Agregar promoción',
            variant: 'primary',
            disabled: idCategoria == null || parseCOPDigits(montoDigits) <= 0,
            onPress: agregar,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 4 },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 10,
    lineHeight: 17,
  },
  reglaRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    backgroundColor: colors.surface,
  },
  reglaHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  reglaTitle: { flex: 1, fontWeight: '700', color: colors.text },
  reglaMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginVertical: 6,
  },
  fieldGap: { marginTop: 8 },
  fieldLabel: {
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    marginTop: 4,
    fontSize: 13,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
    justifyContent: 'center',
  },
  chip: {
    minWidth: 48,
    minHeight: 36,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  chipText: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  chipTextOn: { color: colors.primary, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  pairRow: { flexDirection: 'row', gap: 10 },
  pairCol: { flex: 1 },
});
