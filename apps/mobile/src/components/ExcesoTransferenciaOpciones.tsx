import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRef, useState, type ComponentProps, type RefObject } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatCOP } from '../lib/format';
import type { DevolucionExcesoMetodo } from '../lib/cop-input';
import { colors } from '../lib/theme';
import { WebFloatingTooltip } from './IconTooltipButton';

type MciName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type Props = {
  montoExceso: number;
  devolucionExcesoMetodo?: DevolucionExcesoMetodo | null;
  onDevolucionExcesoMetodoChange?: (metodo: DevolucionExcesoMetodo) => void;
  /** Si true, hay que elegir destino (exceso de transferencia). Si no, por defecto es efectivo. */
  requiereSeleccion?: boolean;
  busy?: boolean;
};

/** Iconos distintos de «cobrar» (cash): devolución, transferencia, domicilio, propina. */
const OPCIONES: {
  metodo: DevolucionExcesoMetodo;
  icon: MciName;
  label: string;
}[] = [
  { metodo: 'efectivo', icon: 'cash-refund', label: 'Devolución en efectivo' },
  {
    metodo: 'transferencia',
    icon: 'bank-transfer-out',
    label: 'Devolución por transferencia',
  },
  { metodo: 'domicilio', icon: 'moped', label: 'Pago al domiciliario' },
  { metodo: 'mesero', icon: 'hand-coin', label: 'Propina al mesero' },
];

function OpcionChip({
  op,
  selected,
  busy,
  onPress,
}: {
  op: (typeof OPCIONES)[number];
  selected: boolean;
  busy?: boolean;
  onPress: () => void;
}) {
  const [hover, setHover] = useState(false);
  const wrapRef = useRef<View>(null);
  const showTip = Platform.OS === 'web' && hover && !busy;

  return (
    <View ref={wrapRef} style={styles.chipWrap} collapsable={false}>
      <WebFloatingTooltip
        visible={showTip}
        label={op.label}
        anchorRef={wrapRef as RefObject<View | null>}
      />
      <Pressable
        style={[styles.chip, selected && styles.chipOn]}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={op.label}
        accessibilityState={{ selected }}
        onPress={onPress}
        {...(Platform.OS === 'web'
          ? ({
              onHoverIn: () => setHover(true),
              onHoverOut: () => setHover(false),
            } as object)
          : {})}
      >
        <MaterialCommunityIcons
          name={op.icon}
          size={22}
          color={selected ? colors.surface : colors.text}
        />
      </Pressable>
    </View>
  );
}

export function ExcesoTransferenciaOpciones({
  montoExceso,
  devolucionExcesoMetodo = null,
  onDevolucionExcesoMetodoChange,
  requiereSeleccion = true,
  busy,
}: Props) {
  if (montoExceso <= 0) return null;

  const metodoEfectivo =
    devolucionExcesoMetodo === 'efectivo' ||
    (!requiereSeleccion && devolucionExcesoMetodo == null);

  return (
    <View style={styles.devolucionBox}>
      <Text style={styles.devolucionTitle}>Vuelto: {formatCOP(montoExceso)}</Text>
      <Text style={styles.devolucionHint}>
        {requiereSeleccion
          ? '¿Cómo se devuelve el vuelto?'
          : 'Por defecto en efectivo. Elige transferencia si el cliente lo pide así.'}
      </Text>
      <View style={styles.chips}>
        {OPCIONES.map((op) => (
          <OpcionChip
            key={op.metodo}
            op={op}
            selected={
              op.metodo === 'efectivo'
                ? metodoEfectivo
                : devolucionExcesoMetodo === op.metodo
            }
            busy={busy}
            onPress={() => onDevolucionExcesoMetodoChange?.(op.metodo)}
          />
        ))}
      </View>
      {metodoEfectivo ? (
        <Text style={styles.vueltoOk}>
          {requiereSeleccion
            ? `Se descontará ${formatCOP(montoExceso)} del efectivo en caja`
            : `Devuelve ${formatCOP(montoExceso)} en efectivo al cliente`}
        </Text>
      ) : null}
      {devolucionExcesoMetodo === 'domicilio' ? (
        <Text style={styles.vueltoOk}>
          {requiereSeleccion
            ? `Se descontará ${formatCOP(montoExceso)} del efectivo en caja (pago al domiciliario, no es venta)`
            : `Entrega ${formatCOP(montoExceso)} al domiciliario`}
        </Text>
      ) : null}
      {devolucionExcesoMetodo === 'mesero' ? (
        <Text style={styles.vueltoOk}>
          {requiereSeleccion
            ? `Se descontará ${formatCOP(montoExceso)} del efectivo en caja (propina al mesero del pedido, no es venta)`
            : `Entrega ${formatCOP(montoExceso)} al mesero`}
        </Text>
      ) : null}
      {devolucionExcesoMetodo === 'transferencia' ? (
        <Text style={styles.sugerencia}>
          No afecta el efectivo en caja; devuelve {formatCOP(montoExceso)} por
          transferencia.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  devolucionBox: {
    alignSelf: 'stretch',
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primaryMuted,
  },
  devolucionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  devolucionHint: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  chipWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderInput,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  sugerencia: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 6,
    lineHeight: 18,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  vueltoOk: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.successText,
    marginTop: 4,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
});
