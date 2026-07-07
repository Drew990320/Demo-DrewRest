import { TextInput, type TextInputProps } from 'react-native';
import { useVisualTheme } from '../context/VisualThemeContext';
import {
  formatCOPInput,
  sanitizeMontoDigitos,
} from '../lib/cop-input';
import { formatCOP } from '../lib/format';
import { textInputPlaceholderColor } from '../lib/form-layout';

type Props = Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'keyboardType' | 'placeholder'
> & {
  digits: string;
  onChangeDigits: (digits: string) => void;
  /** Monto de ejemplo en el placeholder (se muestra como COP). */
  placeholderAmount?: number;
  placeholder?: string;
};

export function MoneyTextInput({
  digits,
  onChangeDigits,
  placeholderAmount,
  placeholder,
  placeholderTextColor,
  style,
  ...rest
}: Props) {
  const { colors } = useVisualTheme();
  const resolvedPlaceholder =
    placeholder ??
    (placeholderAmount != null ? formatCOP(placeholderAmount) : undefined);

  return (
    <TextInput
      {...rest}
      keyboardType="number-pad"
      value={formatCOPInput(digits)}
      onChangeText={(t) => onChangeDigits(sanitizeMontoDigitos(t))}
      placeholder={resolvedPlaceholder}
      placeholderTextColor={placeholderTextColor ?? textInputPlaceholderColor(colors)}
      style={[{ color: colors.text }, style]}
    />
  );
}
