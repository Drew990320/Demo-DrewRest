import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  METODO_PAGO_ICON,
  METODO_PAGO_LABEL,
  type MetodoPagoUi,
} from '../lib/metodo-pago-ui';
import { useResponsive } from '../hooks/useResponsive';
import { colors } from '../lib/theme';

type Props = {
  metodo: MetodoPagoUi | null;
  onMetodoChange: (metodo: MetodoPagoUi) => void;
  /** Por defecto: efectivo, transferencia y mixto. */
  opciones?: readonly MetodoPagoUi[];
  disabled?: boolean;
  /** Muestra « · elige uno » cuando no hay método. */
  pendiente?: boolean;
  label?: string;
};

/** Etiquetas cortas para pantallas estrechas (evita recorte de «Transferencia»). */
const LABEL_CORTA: Record<MetodoPagoUi, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transf.',
  mixto: 'Mixto',
};

export function MetodoPagoSelector({
  metodo,
  onMetodoChange,
  opciones = ['efectivo', 'transferencia', 'mixto'],
  disabled,
  pendiente,
  label = 'Método de pago',
}: Props) {
  const r = useResponsive();
  const sinMetodo = pendiente ?? !metodo;
  /** En móvil: solo icono; el nombre va en la etiqueta superior. */
  const soloIcono = r.isCompact && opciones.length >= 3;
  const etiquetaActiva = metodo ? METODO_PAGO_LABEL[metodo] : null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
        {sinMetodo
          ? ' · elige uno'
          : soloIcono && etiquetaActiva
            ? ` · ${etiquetaActiva}`
            : ''}
      </Text>
      <View style={styles.row}>
        {opciones.map((m) => {
          const on = metodo === m;
          const texto = soloIcono
            ? null
            : r.isCompact
              ? LABEL_CORTA[m]
              : METODO_PAGO_LABEL[m];
          return (
            <Pressable
              key={m}
              style={[
                styles.chip,
                soloIcono ? styles.chipIconOnly : styles.chipStacked,
                on && styles.chipOn,
                disabled && styles.chipDisabled,
              ]}
              onPress={() => onMetodoChange(m)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={METODO_PAGO_LABEL[m]}
            >
              <MaterialCommunityIcons
                name={METODO_PAGO_ICON[m]}
                size={soloIcono ? 22 : r.isCompact ? 18 : 20}
                color={on ? colors.onPrimary : colors.textMuted}
              />
              {texto ? (
                <Text
                  style={[styles.chipText, on && styles.chipTextOn]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                >
                  {texto}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  label: {
    fontWeight: '700',
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'stretch',
  },
  chip: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderInput,
    backgroundColor: colors.surface,
  },
  /** Icono arriba, texto abajo: se lee bien en fila de 3. */
  chipStacked: {
    minHeight: 56,
    paddingVertical: 10,
    paddingHorizontal: 6,
    gap: 4,
  },
  chipIconOnly: {
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  chipOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  chipDisabled: { opacity: 0.55 },
  chipText: {
    fontWeight: '700',
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  chipTextOn: { color: colors.onPrimary },
});
