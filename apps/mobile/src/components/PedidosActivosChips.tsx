import { colors } from '../lib/theme';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type PedidoChip = { id_pedido: number };

type Props<T extends PedidoChip> = {
  pedidos: T[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  label?: string;
  minPedidos?: number;
  formatChip?: (pedido: T) => string;
  style?: StyleProp<ViewStyle>;
};

export function PedidosActivosChips<T extends PedidoChip>({
  pedidos,
  selectedId,
  onSelect,
  label = 'Pedidos activos en esta cola',
  minPedidos = 2,
  formatChip,
  style,
}: Props<T>) {
  if (pedidos.length < minPedidos) return null;

  return (
    <View style={[styles.box, style]}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {pedidos.map((p) => {
          const on = selectedId === p.id_pedido;
          return (
            <Pressable
              key={p.id_pedido}
              style={[styles.chip, on && styles.chipOn]}
              onPress={() => onSelect(p.id_pedido)}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>
                {formatChip ? formatChip(p) : `#${p.id_pedido}`}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { fontWeight: '600', marginBottom: 8, color: colors.text },
  row: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderInput,
    backgroundColor: colors.surfaceMuted,
  },
  chipOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  chipText: { fontWeight: '800', color: colors.text },
  chipTextOn: { color: colors.primaryDark },
});
