import { StyleSheet, Text, View } from 'react-native';
import { PagoExactoButton } from './PagoExactoButton';
import { MoneyTextInput } from './MoneyTextInput';
import { ExcesoTransferenciaOpciones } from './ExcesoTransferenciaOpciones';
import { formatCOP } from '../lib/format';
import {
  digitsFromMonto,
  parseCOPDigits,
  resumenTransferenciaUi,
  type DevolucionExcesoMetodo,
} from '../lib/cop-input';
import { colors } from '../lib/theme';

type Props = {
  total: number;
  transferenciaDigits: string;
  onTransferenciaChange: (digits: string) => void;
  devolucionExcesoMetodo?: DevolucionExcesoMetodo | null;
  onDevolucionExcesoMetodoChange?: (metodo: DevolucionExcesoMetodo) => void;
  busy?: boolean;
  moneyInputStyle?: object;
  hintStyle?: object;
  fieldLabelStyle?: object;
  inputStyle?: object;
};

export function TransferenciaSoloFields({
  total,
  transferenciaDigits,
  onTransferenciaChange,
  devolucionExcesoMetodo = null,
  onDevolucionExcesoMetodoChange,
  busy,
  moneyInputStyle,
  hintStyle,
  fieldLabelStyle,
  inputStyle,
}: Props) {
  const resumen = resumenTransferenciaUi(total, parseCOPDigits(transferenciaDigits));
  const fieldLabel = fieldLabelStyle ?? styles.fieldLabel;
  const input = inputStyle ?? styles.input;
  const hint = hintStyle ?? styles.hint;

  return (
    <View style={styles.wrap}>
      <Text style={hint}>
        Indica cuánto transfirió el cliente (puede incluir domicilio u otro exceso).
      </Text>
      <Text style={fieldLabel}>Cliente transfirió</Text>
      <MoneyTextInput
        style={[input, styles.inputFull, moneyInputStyle]}
        placeholderAmount={total > 0 ? total : 50000}
        digits={transferenciaDigits}
        onChangeDigits={onTransferenciaChange}
      />
      <PagoExactoButton
        onPress={() => onTransferenciaChange(digitsFromMonto(total))}
        disabled={busy || total <= 0}
        style={styles.pagoExactoBtn}
      />
      {resumen.falta > 0 ? (
        <Text style={styles.vueltoFalta}>
          Faltan {formatCOP(resumen.falta)} para cubrir {formatCOP(total)}
        </Text>
      ) : null}
      <ExcesoTransferenciaOpciones
        montoExceso={resumen.exceso}
        devolucionExcesoMetodo={devolucionExcesoMetodo}
        onDevolucionExcesoMetodoChange={onDevolucionExcesoMetodoChange}
        busy={busy}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12, alignItems: 'center' },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 10,
    lineHeight: 18,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  fieldLabel: {
    fontWeight: '700',
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    fontSize: 16,
    marginBottom: 8,
  },
  inputFull: { alignSelf: 'stretch', width: '100%' },
  pagoExactoBtn: { marginTop: 4, marginBottom: 6, alignSelf: 'center' },
  vueltoFalta: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.danger,
    marginTop: 4,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
});
