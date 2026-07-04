import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../lib/theme';

export type ModoDividirCuenta = 'platos' | 'personas' | 'combinado';

const MODOS: {
  id: ModoDividirCuenta;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  hint: string;
}[] = [
  {
    id: 'platos',
    label: 'Por platos',
    icon: 'restaurant-outline',
    hint: 'Marca con +/− qué ítems paga cada tanda. Un método de pago por cobro.',
  },
  {
    id: 'personas',
    label: 'Por personas',
    icon: 'people-outline',
    hint: 'Reparto igual entre N personas. Cada una elige efectivo o transferencia.',
  },
  {
    id: 'combinado',
    label: 'Combinado',
    icon: 'git-merge-outline',
    hint: 'Marca con +/− los ítems a repartir; cada persona paga su parte de lo seleccionado.',
  },
];

type Props = {
  value: ModoDividirCuenta;
  onChange: (modo: ModoDividirCuenta) => void;
  disabled?: boolean;
};

export function ModoDividirSelector({ value, onChange, disabled }: Props) {
  const activo = MODOS.find((m) => m.id === value) ?? MODOS[0];

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>¿Cómo dividir?</Text>
      <View style={styles.tabs}>
        {MODOS.map((m) => {
          const on = value === m.id;
          return (
            <Pressable
              key={m.id}
              style={[styles.tab, on && styles.tabOn]}
              onPress={() => onChange(m.id)}
              disabled={disabled}
            >
              <Ionicons
                name={m.icon}
                size={18}
                color={on ? colors.onPrimary : colors.textMuted}
              />
              <Text style={[styles.tabText, on && styles.tabTextOn]} numberOfLines={1}>
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.hint}>{activo.hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  label: { fontWeight: '800', fontSize: 14, color: colors.text, marginBottom: 8 },
  tabs: {
    flexDirection: 'row',
    gap: 6,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderInput,
    backgroundColor: colors.surfaceMuted,
  },
  tabOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    textAlign: 'center',
  },
  tabTextOn: { color: colors.onPrimary },
  hint: {
    marginTop: 10,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
});
