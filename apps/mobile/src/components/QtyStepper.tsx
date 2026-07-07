import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVisualTheme } from '../context/VisualThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';
import type { AppColors } from '../lib/theme';

type Props = {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  label?: string;
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      gap: 8,
      alignItems: 'center',
    },
    label: {
      fontWeight: '700',
      fontSize: 13,
      color: c.offline,
      textAlign: 'center',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    btn: {
      width: 44,
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnPressed: {
      backgroundColor: c.surfaceMuted,
    },
    btnDisabled: {
      opacity: 0.45,
    },
    valWrap: {
      minWidth: 40,
      alignItems: 'center',
    },
    val: {
      fontSize: 24,
      fontWeight: '900',
      color: c.text,
    },
  });
}

export function QtyStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled,
  label,
}: Props) {
  const { colors } = useVisualTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        <Pressable
          onPress={() => onChange(Math.max(min, value - 1))}
          disabled={disabled || value <= min}
          style={({ pressed }) => [
            styles.btn,
            (disabled || value <= min) && styles.btnDisabled,
            pressed && styles.btnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Menos"
        >
          <Ionicons name="remove" size={20} color={colors.text} />
        </Pressable>
        <View style={styles.valWrap}>
          <Text style={styles.val}>{value}</Text>
        </View>
        <Pressable
          onPress={() => onChange(Math.min(max, value + 1))}
          disabled={disabled || value >= max}
          style={({ pressed }) => [
            styles.btn,
            (disabled || value >= max) && styles.btnDisabled,
            pressed && styles.btnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Más"
        >
          <Ionicons name="add" size={20} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}
