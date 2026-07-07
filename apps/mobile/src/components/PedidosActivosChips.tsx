import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useThemedStyles } from '../hooks/useThemedStyles';
import type { AppColors } from '../lib/theme';

type PedidoChip = { id_pedido: number };

type Props<T extends PedidoChip> = {
  pedidos: T[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  label?: string;
  minPedidos?: number;
  formatChip?: (pedido: T) => string;
  renderChip?: (pedido: T, selected: boolean) => ReactNode;
  style?: StyleProp<ViewStyle>;
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    box: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    label: { fontWeight: '600', marginBottom: 8, color: c.text },
    row: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
    chip: {
      minHeight: 44,
      minWidth: 88,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surfaceMuted,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipOn: {
      borderColor: c.primary,
      backgroundColor: c.primaryLight,
    },
    chipText: { fontWeight: '800', color: c.text },
    chipTextOn: { color: c.primaryDark },
  });
}

export function PedidosActivosChips<T extends PedidoChip>({
  pedidos,
  selectedId,
  onSelect,
  label = 'Pedidos activos en esta cola',
  minPedidos = 2,
  formatChip,
  renderChip,
  style,
}: Props<T>) {
  const styles = useThemedStyles(createStyles);

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
              {renderChip ? (
                renderChip(p, on)
              ) : (
                <Text style={[styles.chipText, on && styles.chipTextOn]}>
                  {formatChip ? formatChip(p) : `#${p.id_pedido}`}
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
