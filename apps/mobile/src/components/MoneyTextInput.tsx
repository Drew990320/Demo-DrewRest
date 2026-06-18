import { TextInput, type TextInputProps } from 'react-native';
import {
  formatCOPInput,
  sanitizeMontoDigitos,
} from '../lib/cop-input';
import { formatCOP } from '../lib/format';

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
  placeholderTextColor = '#9a988f',
  ...rest
}: Props) {
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
      placeholderTextColor={placeholderTextColor}
    />
  );
}
