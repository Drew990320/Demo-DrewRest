import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '../lib/theme';

type Props = {
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PagoExactoButton({ onPress, disabled, style }: Props) {
  return (
    <Pressable
      style={[styles.btn, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Pago exacto (sin vuelto)"
    >
      <Text style={styles.text}>Pago exacto</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    minHeight: 44,
  },
  disabled: { opacity: 0.45 },
  text: {
    fontWeight: '700',
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
  },
});
