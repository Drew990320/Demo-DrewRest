import { StyleSheet, Text, View } from 'react-native';
import { ExcesoTransferenciaOpciones } from './ExcesoTransferenciaOpciones';
import { PagoExactoButton } from './PagoExactoButton';
import { MoneyTextInput } from './MoneyTextInput';
import { formatCOP } from '../lib/format';
import {
  digitsFromMonto,
  parseCOPDigits,
  resumenMixtoUi,
  type DevolucionExcesoMetodo,
} from '../lib/cop-input';
import { colors } from '../lib/theme';

type Props = {
  total: number;
  transferenciaDigits: string;
  efectivoDigits: string;
  onTransferenciaChange: (digits: string) => void;
  onEfectivoChange: (digits: string) => void;
  devolucionExcesoMetodo?: DevolucionExcesoMetodo | null;
  onDevolucionExcesoMetodoChange?: (metodo: DevolucionExcesoMetodo) => void;
  busy?: boolean;
  moneyInputStyle?: object;
  hintStyle?: object;
  fieldLabelStyle?: object;
  inputStyle?: object;
};

export function MixtoPagoFields({
  total,
  transferenciaDigits,
  efectivoDigits,
  onTransferenciaChange,
  onEfectivoChange,
  devolucionExcesoMetodo = null,
  onDevolucionExcesoMetodoChange,
  busy,
  moneyInputStyle,
  hintStyle,
  fieldLabelStyle,
  inputStyle,
}: Props) {
  const resumen = resumenMixtoUi(
    total,
    parseCOPDigits(transferenciaDigits),
    parseCOPDigits(efectivoDigits),
  );

  const fieldLabel = fieldLabelStyle ?? styles.fieldLabel;
  const input = inputStyle ?? styles.input;
  const hint = hintStyle ?? styles.mixtoHint;
  const soloTransferencia = resumen.transferenciaFactura >= resumen.total;

  return (
    <View style={styles.wrap}>
      <Text style={hint}>
        Reparte los {formatCOP(total)} entre efectivo y transferencia (cada monto por
        separado).
      </Text>

      <Text style={fieldLabel}>Cliente transfirió</Text>
      <MoneyTextInput
        style={[input, styles.inputFull, moneyInputStyle]}
        placeholderAmount={total > 0 ? Math.ceil(total / 2) : 5000}
        digits={transferenciaDigits}
        onChangeDigits={onTransferenciaChange}
      />
      {resumen.sugerenciaEfectivo != null && resumen.sugerenciaEfectivo > 0 ? (
        <Text style={styles.sugerencia}>
          En efectivo faltarían {formatCOP(resumen.sugerenciaEfectivo)} para completar
        </Text>
      ) : null}

      {!soloTransferencia ? (
        <>
          <Text style={[fieldLabel, styles.fieldGap]}>Cliente paga en efectivo con</Text>
          <MoneyTextInput
            style={[input, styles.inputFull, moneyInputStyle]}
            placeholderAmount={
              resumen.sugerenciaEfectivo ?? (total > 0 ? Math.ceil(total / 2) : 50000)
            }
            digits={efectivoDigits}
            onChangeDigits={onEfectivoChange}
          />
          {resumen.sugerenciaTransferencia != null &&
          resumen.sugerenciaTransferencia > 0 ? (
            <Text style={styles.sugerencia}>
              En transferencia faltarían {formatCOP(resumen.sugerenciaTransferencia)} para
              completar
            </Text>
          ) : null}
          {resumen.sugerenciaEfectivo != null && resumen.sugerenciaEfectivo > 0 ? (
            <PagoExactoButton
              onPress={() => onEfectivoChange(digitsFromMonto(resumen.sugerenciaEfectivo!))}
              disabled={busy}
              style={styles.pagoExactoBtn}
            />
          ) : null}

          {resumen.faltaTotal > 0 &&
          resumen.transferenciaReal > 0 &&
          resumen.efectivoRecibido > 0 ? (
            <Text style={styles.vueltoFalta}>
              Faltan {formatCOP(resumen.faltaTotal)} para cubrir {formatCOP(total)}
            </Text>
          ) : null}
        </>
      ) : null}

      {resumen.vueltoTotal > 0 ? (
        <ExcesoTransferenciaOpciones
          montoExceso={resumen.vueltoTotal}
          devolucionExcesoMetodo={devolucionExcesoMetodo}
          onDevolucionExcesoMetodoChange={onDevolucionExcesoMetodoChange}
          requiereSeleccion={resumen.vueltoPorTransferencia > 0}
          busy={busy}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12, alignItems: 'center' },
  mixtoHint: {
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
  fieldGap: { marginTop: 8 },
  sugerencia: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 18,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
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
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderInput,
    backgroundColor: colors.surface,
  },
  chipOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  chipTextOn: {
    color: colors.surface,
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
  vueltoOk: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.successText,
    marginTop: 4,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  vueltoFalta: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.danger,
    marginTop: 4,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
});
