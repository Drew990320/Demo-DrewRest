import { memo, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { esColorHexValido } from '@la-reserva/shared-domain/nav-app-icon';
import { colors } from '../lib/theme';

type Props = {
  label: string;
  value: string;
  fallback: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
  labelColor?: string;
  borderColor?: string;
  /** Menos padding vertical en grillas densas. */
  compact?: boolean;
};

const PRESET_COLORS = [
  '#82B5D6',
  '#5E96B8',
  '#A3C9E3',
  '#86A5BA',
  '#97C2DE',
  '#EDF3FA',
  '#E4ECF5',
  '#FFFFFF',
  '#3D4F63',
  '#6B7D91',
  '#CDD9E8',
  '#3D9B62',
  '#2E7D4A',
  '#4A7FC4',
  '#2C5F9E',
  '#8B5E83',
  '#5C4033',
  '#1A1A1A',
  '#F5E8E6',
  '#E2F5E8',
  '#FFF8E7',
  '#F0E4D4',
  '#D9534F',
  '#F0AD4E',
] as const;

const HUE_STEPS = 18;
const LIGHTNESS_STEPS = [18, 30, 42, 54, 66, 78, 90];

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) return null;
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

function rgbToHsl(r: number, g: number, b: number) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  const l = (max + min) / 2;
  let s = 0;

  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        break;
      case gn:
        h = ((bn - rn) / d + 2) / 6;
        break;
      default:
        h = ((rn - gn) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function normalizeHex(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (esColorHexValido(trimmed)) return trimmed.toUpperCase();
  return esColorHexValido(fallback) ? fallback.toUpperCase() : '#82B5D6';
}

function ColorDot({
  color,
  selected,
  onPress,
  size = 36,
}: {
  color: string;
  selected?: boolean;
  onPress: () => void;
  size?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        selected && styles.dotSelected,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Color ${color}`}
    />
  );
}

function ColorPickerModal({
  visible,
  label,
  value,
  fallback,
  onChange,
  onClose,
}: {
  visible: boolean;
  label: string;
  value: string;
  fallback: string;
  onChange: (hex: string) => void;
  onClose: () => void;
}) {
  const safe = normalizeHex(value, fallback);
  const [hue, setHue] = useState(0);
  const [lightness, setLightness] = useState(50);

  useEffect(() => {
    if (!visible) return;
    const parsed = parseHex(safe);
    if (!parsed) return;
    const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
    setHue(hsl.h);
    setLightness(hsl.l);
  }, [visible, safe]);

  const hueColors = useMemo(
    () =>
      Array.from({ length: HUE_STEPS }, (_, i) =>
        hslToHex((i * 360) / HUE_STEPS, 72, 52),
      ),
    [],
  );

  const shadeColors = useMemo(
    () => LIGHTNESS_STEPS.map((l) => hslToHex(hue, 72, l)),
    [hue],
  );

  function pick(hex: string) {
    onChange(normalizeHex(hex, fallback));
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.sheetTitle}>{label}</Text>
          <View style={styles.previewRow}>
            <View style={[styles.previewCircle, { backgroundColor: safe }]} />
            <Text style={styles.previewHint}>
              Toca un color sugerido o ajusta tono y brillo.
            </Text>
          </View>

          <Text style={styles.groupLabel}>Colores sugeridos</Text>
          <View style={styles.dotGrid}>
            {PRESET_COLORS.map((c) => (
              <ColorDot
                key={c}
                color={c}
                selected={c === safe}
                onPress={() => pick(c)}
              />
            ))}
          </View>

          <Text style={styles.groupLabel}>Tono</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dotRow}
          >
            {hueColors.map((c, i) => (
              <ColorDot
                key={c}
                color={c}
                selected={Math.abs(hue - (i * 360) / HUE_STEPS) < 12}
                onPress={() => {
                  const h = (i * 360) / HUE_STEPS;
                  setHue(h);
                  pick(hslToHex(h, 72, lightness));
                }}
              />
            ))}
          </ScrollView>

          <Text style={styles.groupLabel}>Brillo</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dotRow}
          >
            {shadeColors.map((c, i) => (
              <ColorDot
                key={`${hue}-${i}`}
                color={c}
                selected={Math.abs(lightness - LIGHTNESS_STEPS[i]) < 4}
                onPress={() => {
                  const l = LIGHTNESS_STEPS[i];
                  setLightness(l);
                  pick(hslToHex(hue, 72, l));
                }}
              />
            ))}
          </ScrollView>

          <Pressable style={styles.resetBtn} onPress={() => pick(fallback)}>
            <Text style={styles.resetBtnText}>Restaurar predeterminado</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export const VisualColorField = memo(function VisualColorField({
  label,
  value,
  fallback,
  onChange,
  disabled,
  labelColor,
  borderColor,
  compact,
}: Props) {
  const safe = normalizeHex(value, fallback);
  const [modalOpen, setModalOpen] = useState(false);
  const resolvedLabelColor = labelColor ?? colors.text;
  const resolvedBorderColor = borderColor ?? colors.border;

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <Text style={[styles.label, { color: resolvedLabelColor }]}>{label}</Text>
      <Pressable
        onPress={() => !disabled && setModalOpen(true)}
        disabled={disabled}
        style={({ pressed }) => [
          styles.circle,
          { backgroundColor: safe, borderColor: resolvedBorderColor },
          disabled && styles.circleDisabled,
          pressed && !disabled && styles.circlePressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Elegir ${label}`}
      />
      <ColorPickerModal
        visible={modalOpen}
        label={label}
        value={safe}
        fallback={fallback}
        onChange={onChange}
        onClose={() => setModalOpen(false)}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6,
  },
  rowCompact: {
    paddingVertical: 3,
    gap: 8,
  },
  label: {
    flex: 1,
    fontSize: 14,
    minWidth: 0,
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(61,54,48,0.12)' } as object,
      default: {
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  circleDisabled: { opacity: 0.45 },
  circlePressed: { opacity: 0.88, transform: [{ scale: 0.96 }] },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    gap: 10,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 4,
  },
  previewCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.border,
  },
  previewHint: {
    flex: 1,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 4,
  },
  dotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dotRow: {
    gap: 10,
    paddingVertical: 4,
  },
  dot: {
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dotSelected: {
    borderColor: colors.primaryDark,
    transform: [{ scale: 1.08 }],
  },
  resetBtn: {
    alignSelf: 'center',
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});
