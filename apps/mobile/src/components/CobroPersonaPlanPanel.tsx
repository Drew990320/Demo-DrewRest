import { StyleSheet, Text, View } from 'react-native';
import { CtaButton } from './CtaButton';
import { CobroMontoPanel } from './CobroMontoPanel';
import { MetodoPagoSelector } from './MetodoPagoSelector';
import { MixtoPagoFields } from './MixtoPagoFields';
import { PagoExactoButton } from './PagoExactoButton';
import { MoneyTextInput } from './MoneyTextInput';
import { TransferenciaSoloFields } from './TransferenciaSoloFields';
import { formatCOP } from '../lib/format';
import {
  digitsFromMonto,
  parseCOPDigits,
  puedeConfirmarCobroMixto,
  puedeConfirmarCobroTransferencia,
  resumenMixtoUi,
  textoResumenCobroMixto,
  textoResumenCobroTransferencia,
  type DevolucionExcesoMetodo,
} from '../lib/cop-input';
import {
  METODO_PAGO_LABEL,
  type MetodoPagoUi,
} from '../lib/metodo-pago-ui';
import { colors } from '../lib/theme';

export type MetodoPagoPlan = MetodoPagoUi;

export type CobroPlanCtaEstado = {
  sinItems: boolean;
  sinMetodo: boolean;
  puedeCobrar: boolean;
  puedeIntentarCobro: boolean;
  cobroIncompleto: boolean;
  subtitleCobro: string;
  icon: 'cash-outline' | 'card-outline' | 'help-circle-outline';
};

type CobroPlanCtaInput = {
  monto: number;
  metodo: MetodoPagoPlan | null;
  mixtoTransferenciaDigits: string;
  transferenciaSoloDigits: string;
  devolucionExcesoMetodo?: DevolucionExcesoMetodo | null;
  recibeDigits: string;
  faltaEfectivo: boolean;
  busy?: boolean;
  sinItems?: boolean;
};

export function cobroPlanCtaEstado({
  monto,
  metodo,
  mixtoTransferenciaDigits,
  transferenciaSoloDigits,
  devolucionExcesoMetodo = null,
  recibeDigits,
  faltaEfectivo,
  busy,
  sinItems = false,
}: CobroPlanCtaInput): CobroPlanCtaEstado {
  const sinMetodo = !metodo;
  const resumenMixto = resumenMixtoUi(
    monto,
    parseCOPDigits(mixtoTransferenciaDigits),
    parseCOPDigits(recibeDigits),
  );

  const puedeCobrar =
    !busy &&
    !sinItems &&
    monto > 0 &&
    Boolean(metodo) &&
    (metodo === 'mixto'
      ? puedeConfirmarCobroMixto(resumenMixto, devolucionExcesoMetodo)
      : metodo === 'transferencia'
        ? puedeConfirmarCobroTransferencia(
            monto,
            parseCOPDigits(transferenciaSoloDigits),
            devolucionExcesoMetodo,
          )
        : metodo === 'efectivo'
          ? recibeDigits !== '' && !faltaEfectivo
          : true);

  const puedeIntentarCobro = !busy && !sinItems && monto > 0;
  const cobroIncompleto = Boolean(metodo) && !puedeCobrar;

  const subtitleCobro = (() => {
    if (sinItems) return 'Marca ítems con +/− primero';
    if (sinMetodo) return 'Elige cómo paga esta persona';
    if (metodo === 'mixto') {
      return textoResumenCobroMixto(resumenMixto, devolucionExcesoMetodo);
    }
    if (metodo === 'transferencia') {
      return textoResumenCobroTransferencia(
        monto,
        parseCOPDigits(transferenciaSoloDigits),
        devolucionExcesoMetodo,
      );
    }
    if (metodo === 'efectivo' && recibeDigits === '') {
      return 'Indica con cuánto paga';
    }
    return `${formatCOP(monto)} · ${METODO_PAGO_LABEL[metodo!]}`;
  })();

  const icon =
    metodo === 'efectivo' || metodo === 'mixto'
      ? 'cash-outline'
      : metodo === 'transferencia'
        ? 'card-outline'
        : 'help-circle-outline';

  return {
    sinItems,
    sinMetodo,
    puedeCobrar,
    puedeIntentarCobro,
    cobroIncompleto,
    subtitleCobro,
    icon,
  };
}

type Props = {
  personaIndice: number;
  monto: number;
  metodo: MetodoPagoPlan | null;
  onMetodoChange: (metodo: MetodoPagoPlan) => void;
  mixtoTransferenciaDigits: string;
  onMixtoTransferenciaDigitsChange: (digits: string) => void;
  transferenciaSoloDigits: string;
  onTransferenciaSoloDigitsChange: (digits: string) => void;
  devolucionExcesoMetodo?: DevolucionExcesoMetodo | null;
  onDevolucionExcesoMetodoChange?: (metodo: DevolucionExcesoMetodo) => void;
  recibeDigits: string;
  onRecibeDigitsChange: (digits: string) => void;
  recibidoNum: number;
  vuelto: number | null;
  faltaEfectivo: boolean;
  busy?: boolean;
  sinItems?: boolean;
  saldoRestantePlan?: number;
  saldoPendienteOmitidos?: number;
  onOmitirPersona?: () => void;
  onCobrar?: () => void;
  /** Si falta método de pago, scroll a la sección de cobro. */
  onNecesitaMetodo?: () => void;
  /** Botón fijo en pantalla de factura; ocultar el CTA interno. */
  mostrarBotonCobro?: boolean;
  moneyInputStyle?: object;
};

export function CobroPersonaPlanPanel({
  personaIndice,
  monto,
  metodo,
  onMetodoChange,
  mixtoTransferenciaDigits,
  onMixtoTransferenciaDigitsChange,
  transferenciaSoloDigits,
  onTransferenciaSoloDigitsChange,
  devolucionExcesoMetodo = null,
  onDevolucionExcesoMetodoChange,
  recibeDigits,
  onRecibeDigitsChange,
  recibidoNum,
  vuelto,
  faltaEfectivo,
  busy,
  sinItems,
  saldoRestantePlan,
  saldoPendienteOmitidos,
  onOmitirPersona,
  onCobrar,
  onNecesitaMetodo,
  mostrarBotonCobro = true,
  moneyInputStyle,
}: Props) {
  const estadoCta = cobroPlanCtaEstado({
    monto,
    metodo,
    mixtoTransferenciaDigits,
    transferenciaSoloDigits,
    devolucionExcesoMetodo,
    recibeDigits,
    faltaEfectivo,
    busy,
    sinItems,
  });
  const { sinMetodo, puedeCobrar, puedeIntentarCobro, subtitleCobro, icon } =
    estadoCta;

  return (
    <CobroMontoPanel
      title={`Cobrar persona ${personaIndice + 1}`}
      monto={monto}
      personaIndice={personaIndice}
    >
      {saldoRestantePlan != null && saldoRestantePlan > 0 ? (
        <View style={styles.saldoBox}>
          <Text style={styles.saldoText}>
            Saldo restante del reparto: {formatCOP(saldoRestantePlan)}
          </Text>
          {(saldoPendienteOmitidos ?? 0) > 0 ? (
            <Text style={styles.saldoOmitido}>
              Incluye {formatCOP(saldoPendienteOmitidos!)} de personas que no
              pagaron (pendiente)
            </Text>
          ) : null}
        </View>
      ) : null}

      <MetodoPagoSelector
        metodo={metodo}
        onMetodoChange={onMetodoChange}
        disabled={busy}
        pendiente={sinMetodo}
      />

      {metodo === 'mixto' ? (
        <MixtoPagoFields
          total={monto}
          transferenciaDigits={mixtoTransferenciaDigits}
          efectivoDigits={recibeDigits}
          onTransferenciaChange={onMixtoTransferenciaDigitsChange}
          onEfectivoChange={onRecibeDigitsChange}
          devolucionExcesoMetodo={devolucionExcesoMetodo}
          onDevolucionExcesoMetodoChange={onDevolucionExcesoMetodoChange}
          busy={busy}
          moneyInputStyle={moneyInputStyle}
          fieldLabelStyle={styles.fieldLabel}
          inputStyle={styles.input}
        />
      ) : null}

      {metodo === 'transferencia' ? (
        <TransferenciaSoloFields
          total={monto}
          transferenciaDigits={transferenciaSoloDigits}
          onTransferenciaChange={onTransferenciaSoloDigitsChange}
          devolucionExcesoMetodo={devolucionExcesoMetodo}
          onDevolucionExcesoMetodoChange={onDevolucionExcesoMetodoChange}
          busy={busy}
          moneyInputStyle={moneyInputStyle}
          fieldLabelStyle={styles.fieldLabel}
          inputStyle={styles.input}
        />
      ) : null}

      {metodo === 'efectivo' ? (
        <View style={styles.efectivoBox}>
          <Text style={styles.fieldLabel}>Cliente paga con</Text>
          <MoneyTextInput
            style={[styles.input, styles.inputFull, moneyInputStyle]}
            placeholderAmount={monto > 0 ? monto : 50000}
            digits={recibeDigits}
            onChangeDigits={onRecibeDigitsChange}
          />
          <PagoExactoButton
            onPress={() => onRecibeDigitsChange(digitsFromMonto(monto))}
            disabled={busy || monto <= 0}
            style={styles.pagoExactoBtn}
          />
          {recibeDigits !== '' && !faltaEfectivo && vuelto !== null ? (
            <Text style={styles.vueltoOk}>Vuelto: {formatCOP(vuelto)}</Text>
          ) : null}
          {faltaEfectivo ? (
            <Text style={styles.vueltoFalta}>
              Falta {formatCOP(monto - recibidoNum)} para cubrir el total
            </Text>
          ) : null}
        </View>
      ) : null}

      {onOmitirPersona ? (
        <CtaButton
          icon="time-outline"
          title="No paga ahora · dejar pendiente"
          subtitle={`Cuota ${formatCOP(monto)} queda en la mesa para después`}
          variant="secondary"
          onPress={onOmitirPersona}
          disabled={busy || sinItems || monto <= 0}
          style={styles.omitirCta}
        />
      ) : null}

      {mostrarBotonCobro && onCobrar ? (
        <CtaButton
          icon={icon}
          title={`Confirmar cobro persona ${personaIndice + 1}`}
          subtitle={subtitleCobro}
          variant="success"
          onPress={() => {
            if (sinMetodo) {
              onNecesitaMetodo?.();
              return;
            }
            onCobrar();
          }}
          disabled={!puedeIntentarCobro || (Boolean(metodo) && !puedeCobrar)}
          busy={busy}
          style={styles.cobrarCta}
        />
      ) : null}
    </CobroMontoPanel>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontWeight: '700',
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  efectivoBox: { marginBottom: 12, alignItems: 'center' },
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
  cobrarCta: { marginTop: 4 },
  omitirCta: { marginTop: 8, marginBottom: 4 },
  saldoBox: {
    marginBottom: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  saldoText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryDark,
    textAlign: 'center',
  },
  saldoOmitido: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: colors.warningText,
    textAlign: 'center',
    lineHeight: 17,
  },
});
