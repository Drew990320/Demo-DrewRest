import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { colors } from '../lib/theme';

type Props = {
  imprimirFactura: boolean;
  facturaConCopia: boolean;
  onImprimirChange: (value: boolean) => void;
  onCopiaChange: (value: boolean) => void;
  enviarPorCorreo?: boolean;
  emailCliente?: string;
  onEnviarPorCorreoChange?: (value: boolean) => void;
  onEmailClienteChange?: (value: string) => void;
  disabled?: boolean;
};

export function FacturaImpresionOpciones({
  imprimirFactura,
  facturaConCopia,
  onImprimirChange,
  onCopiaChange,
  enviarPorCorreo = false,
  emailCliente = '',
  onEnviarPorCorreoChange,
  onEmailClienteChange,
  disabled,
}: Props) {
  return (
    <>
      <Text style={styles.sectionTitle}>Factura (al cobrar)</Text>
      <Text style={styles.hint}>
        Al confirmar el cobro se registra el pago. Puedes imprimir en POS y/o
        enviar el recibo por correo si hay internet en el PC del servidor.
      </Text>

      <View style={styles.printRow}>
        <View style={styles.printText}>
          <Text style={styles.printLabel}>Imprimir factura</Text>
          <Text style={styles.printHint}>
            Desactiva para cobrar sin usar la impresora.
          </Text>
        </View>
        <Switch
          value={imprimirFactura}
          onValueChange={onImprimirChange}
          trackColor={{ false: colors.borderInput, true: colors.successBorder }}
          thumbColor={imprimirFactura ? colors.primary : colors.borderLight}
          disabled={disabled}
        />
      </View>

      {imprimirFactura ? (
        <View style={styles.printRow}>
          <View style={styles.printText}>
            <Text style={styles.printLabel}>Con copia (cliente)</Text>
            <Text style={styles.printHint}>
              Si está activo: copia negocio y copia cliente. Si no: solo copia caja.
            </Text>
          </View>
          <Switch
            value={facturaConCopia}
            onValueChange={onCopiaChange}
            trackColor={{ false: colors.borderInput, true: colors.successBorder }}
            thumbColor={facturaConCopia ? colors.primary : colors.borderLight}
            disabled={disabled}
          />
        </View>
      ) : null}

      {onEnviarPorCorreoChange ? (
        <>
          <View style={styles.printRow}>
            <View style={styles.printText}>
              <Text style={styles.printLabel}>Enviar por correo</Text>
              <Text style={styles.printHint}>
                Recibo electrónico al cliente (no es factura DIAN). Requiere
                internet y SMTP en el servidor.
              </Text>
            </View>
            <Switch
              value={enviarPorCorreo}
              onValueChange={onEnviarPorCorreoChange}
              trackColor={{ false: colors.borderInput, true: colors.successBorder }}
              thumbColor={enviarPorCorreo ? colors.primary : colors.borderLight}
              disabled={disabled}
            />
          </View>
          {enviarPorCorreo ? (
            <View style={styles.emailBox}>
              <Text style={styles.printLabel}>Correo del cliente</Text>
              <TextInput
                style={styles.emailInput}
                value={emailCliente}
                onChangeText={onEmailClienteChange}
                placeholder="cliente@correo.com"
                placeholderTextColor={colors.textHint}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!disabled}
              />
            </View>
          ) : null}
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontWeight: '800', color: colors.text, marginBottom: 8 },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 10,
    lineHeight: 18,
  },
  printRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 12,
  },
  printText: { flex: 1, paddingRight: 8 },
  printLabel: { fontWeight: '800', color: colors.text, fontSize: 15 },
  printHint: { fontSize: 12, color: colors.textMuted, marginTop: 4, lineHeight: 16 },
  emailBox: {
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 8,
  },
  emailInput: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
});
