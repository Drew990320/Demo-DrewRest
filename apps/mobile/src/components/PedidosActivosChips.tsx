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
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e2d8',
  },
  label: { fontWeight: '600', marginBottom: 8, color: '#3d3d3a' },
  row: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d9d5ca',
    backgroundColor: '#faf9f6',
  },
  chipOn: {
    borderColor: '#2f5e4f',
    backgroundColor: '#e8f2ee',
  },
  chipText: { fontWeight: '800', color: '#3d3d3a' },
  chipTextOn: { color: '#24493e' },
});
