import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  MESA_FORMA_DESCRIPCION,
  MESA_FORMA_IDS,
  MESA_FORMA_LABELS,
  MESA_VISTA_DESCRIPCION,
  MESA_VISTA_IDS,
  MESA_VISTA_LABELS,
  type MesaFormaId,
  type MesaVistaId,
} from '@la-reserva/shared-domain/mesa-visual';
import { useVisualTheme } from '../context/VisualThemeContext';
import { MesaTarjeta } from './MesaTarjeta';

type Props = {
  forma: MesaFormaId;
  vista: MesaVistaId;
  disabled?: boolean;
  onFormaChange: (id: MesaFormaId) => void;
  onVistaChange: (id: MesaVistaId) => void;
};

function OptionChip<T extends string>({
  id,
  label,
  active,
  disabled,
  onPress,
}: {
  id: T;
  label: string;
  active: boolean;
  disabled?: boolean;
  onPress: (id: T) => void;
}) {
  const { colors } = useVisualTheme();
  return (
    <Pressable
      disabled={disabled}
      onPress={() => onPress(id)}
      style={({ pressed }) => [
        styles.chip,
        {
          borderColor: active ? colors.primary : colors.border,
          backgroundColor: active ? colors.backgroundAlt : colors.surface,
          borderWidth: active ? 2 : StyleSheet.hairlineWidth,
          opacity: disabled ? 0.55 : pressed ? 0.9 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text
        style={[
          styles.chipLabel,
          { color: active ? colors.primaryDark : colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function VisualMesaStylePanel({
  forma,
  vista,
  disabled,
  onFormaChange,
  onVistaChange,
}: Props) {
  const { colors, layout } = useVisualTheme();

  return (
    <View style={styles.wrap}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Forma de mesa</Text>
      <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
        Solo cambia la silueta; los colores libre/ocupada siguen tu paleta.
      </Text>
      <View style={styles.chipRow}>
        {MESA_FORMA_IDS.map((id) => (
          <OptionChip
            key={id}
            id={id}
            label={MESA_FORMA_LABELS[id]}
            active={forma === id}
            disabled={disabled}
            onPress={onFormaChange}
          />
        ))}
      </View>
      <Text style={[styles.optionDesc, { color: colors.textMuted }]}>
        {MESA_FORMA_DESCRIPCION[forma]}
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>
        Vista de mesas
      </Text>
      <View style={styles.chipRow}>
        {MESA_VISTA_IDS.map((id) => (
          <OptionChip
            key={id}
            id={id}
            label={MESA_VISTA_LABELS[id]}
            active={vista === id}
            disabled={disabled}
            onPress={onVistaChange}
          />
        ))}
      </View>
      <Text style={[styles.optionDesc, { color: colors.textMuted }]}>
        {MESA_VISTA_DESCRIPCION[vista]}
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>
        Vista previa
      </Text>
      <View
        style={[
          styles.previewBox,
          { backgroundColor: colors.backgroundAlt, borderColor: colors.border },
        ]}
      >
        <View
          style={[
            styles.previewGrid,
            vista === 'lista' ? styles.previewLista : styles.previewGridCols,
          ]}
        >
          {(
            [
              { n: '1', e: 'ocupada', s: 'Ocupada' },
              { n: '2', e: 'libre', s: 'Disponible' },
              { n: '3', e: 'libre', s: 'Disponible' },
            ] as const
          ).map((m) => (
            <View
              key={m.n}
              style={vista === 'lista' ? styles.previewListaItem : styles.previewGridItem}
            >
              <MesaTarjeta
                numero={m.n}
                subtitulo={m.s}
                estado={m.e}
                colors={colors}
                forma={forma}
                vista={vista}
                layout={layout}
                minHeight={72}
                compact
                numFontSize={18}
                subFontSize={11}
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionHint: {
    fontSize: 12,
    lineHeight: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  optionDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  previewBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  previewGrid: {
    gap: 8,
  },
  previewGridCols: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  previewLista: {
    flexDirection: 'column',
  },
  previewGridItem: {
    width: '31%',
    minWidth: 88,
    flexGrow: 1,
  },
  previewListaItem: {
    width: '100%',
  },
});
