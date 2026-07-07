import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CtaButton } from './CtaButton';
import { MetodoPagoSelector } from './MetodoPagoSelector';
import { IconTooltipButton } from './IconTooltipButton';
import { formatCOP } from '../lib/format';
import {
  METODO_PAGO_ICON,
  METODO_PAGO_LABEL,
  type MetodoPagoUi,
} from '../lib/metodo-pago-ui';
import { appShadow } from '../lib/shadow';
import { colors } from '../lib/theme';

type MetodoPago = MetodoPagoUi;

const OPCIONES_RAPIDAS = [2, 3, 4, 5, 6] as const;

type FacturaParcial = {
  total: number;
  metodo_pago?: MetodoPago | 'mixto';
  efectivo?: number;
  transferencia?: number;
};

export type PlanCobroVariant = 'igual' | 'asignacion';

type Props = {
  variant?: PlanCobroVariant;
  totalPendiente: number;
  personas: number;
  onPersonasChange: (n: number) => void;
  planMontos: number[];
  metodos: (MetodoPago | null)[];
  onMetodoChange: (indice: number, metodo: MetodoPago) => void;
  cobrosHechos: number;
  /** Cobros pagados + personas omitidas (siguiente turno). */
  avancePlan?: number;
  personasOmitidas?: number[];
  saldoRestantePlan?: number;
  saldoPendienteOmitidos?: number;
  facturas?: FacturaParcial[];
  busy?: boolean;
  sugerenciaComensales?: number;
  onCobrarPersona: (indice: number) => void;
  personaAsignacionActiva?: number;
  onPersonaAsignacionActiva?: (indice: number) => void;
  unidadesPorPersona?: number[];
  puedeCobrarPersona?: (indice: number) => boolean;
  /** Si true, el total mostrado viene de ítems marcados con +/− (modo combinado). */
  repartoDesdeItemsSeleccionados?: boolean;
  /** Si false, método y cobro van en panel inferior (factura). */
  cobroEnTarjeta?: boolean;
};

export function PlanCobroPersonas({
  variant = 'igual',
  totalPendiente,
  personas,
  onPersonasChange,
  planMontos,
  metodos,
  onMetodoChange,
  cobrosHechos,
  facturas,
  busy,
  sugerenciaComensales,
  onCobrarPersona,
  personaAsignacionActiva,
  onPersonaAsignacionActiva,
  unidadesPorPersona,
  puedeCobrarPersona,
  repartoDesdeItemsSeleccionados,
  cobroEnTarjeta = false,
  avancePlan,
  personasOmitidas = [],
  saldoRestantePlan,
  saldoPendienteOmitidos,
}: Props) {
  const esAsignacion = variant === 'asignacion';
  const totalPersonas = planMontos.length;
  const avance = avancePlan ?? cobrosHechos;
  const progreso = totalPersonas > 0 ? avance / totalPersonas : 0;
  const siguienteIndice = avance < totalPersonas ? avance : -1;
  const planCompleto = totalPersonas > 0 && avance >= totalPersonas;
  const omitidas = personasOmitidas ?? [];

  function ajustarPersonas(delta: number) {
    const next = Math.min(12, Math.max(2, personas + delta));
    onPersonasChange(next);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <View style={styles.headIcon}>
          <Ionicons name="people-outline" size={22} color={colors.primary} />
        </View>
        <View style={styles.headText}>
          <Text style={styles.title}>
            {esAsignacion ? 'Platos por persona' : 'Dividir entre personas'}
          </Text>
          <Text style={styles.subtitle}>
            {repartoDesdeItemsSeleccionados
              ? `Total seleccionado ${formatCOP(totalPendiente)} · reparto entre ${personas} personas`
              : esAsignacion
                ? `Total pendiente ${formatCOP(totalPendiente)} · asigna ítems abajo con +/−`
                : `Total pendiente ${formatCOP(totalPendiente)} · cuota igual por persona (sobre el total)`}
          </Text>
        </View>
      </View>

      {totalPersonas > 0 ? (
        <View style={styles.progressBlock}>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${Math.round(progreso * 100)}%` }]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {cobrosHechos} cobrado{cobrosHechos === 1 ? '' : 's'}
            {omitidas.length > 0
              ? ` · ${omitidas.length} pendiente${omitidas.length === 1 ? '' : 's'}`
              : ''}
            {totalPersonas > 0 ? ` · ${avance} de ${totalPersonas}` : ''}
            {planCompleto ? ' · turnos listos' : ''}
          </Text>
        </View>
      ) : null}

      {saldoRestantePlan != null && saldoRestantePlan > 0 ? (
        <View style={styles.saldoBlock}>
          <Text style={styles.saldoLabel}>
            Saldo restante del reparto: {formatCOP(saldoRestantePlan)}
          </Text>
          {(saldoPendienteOmitidos ?? 0) > 0 ? (
            <Text style={styles.saldoOmitidoHint}>
              {formatCOP(saldoPendienteOmitidos!)} de personas que no pagaron
              (pendiente en mesa)
            </Text>
          ) : null}
        </View>
      ) : null}

      <Text style={styles.fieldLabel}>¿Entre cuántas personas?</Text>
      <View style={styles.quickRow}>
        {OPCIONES_RAPIDAS.map((n) => {
          const on = personas === n;
          return (
            <Pressable
              key={n}
              style={[styles.quickChip, on && styles.quickChipOn]}
              onPress={() => onPersonasChange(n)}
              disabled={busy}
            >
              <Text style={[styles.quickChipText, on && styles.quickChipTextOn]}>
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.stepperRow}>
        <IconTooltipButton
          icon="remove-circle-outline"
          label="Menos personas"
          size={28}
          onPress={() => ajustarPersonas(-1)}
          disabled={busy || personas <= 2}
        />
        <View style={styles.stepperVal}>
          <Text style={styles.stepperNum}>{personas}</Text>
          <Text style={styles.stepperHint}>personas</Text>
        </View>
        <IconTooltipButton
          icon="add-circle-outline"
          label="Más personas"
          size={28}
          onPress={() => ajustarPersonas(1)}
          disabled={busy || personas >= 12}
        />
      </View>

      {sugerenciaComensales && sugerenciaComensales >= 2 && sugerenciaComensales !== personas ? (
        <Pressable
          style={styles.sugerenciaBtn}
          onPress={() => onPersonasChange(sugerenciaComensales)}
          disabled={busy}
        >
          <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
          <Text style={styles.sugerenciaText}>
            Usar {sugerenciaComensales} comensales del pedido
          </Text>
        </Pressable>
      ) : null}

      {totalPersonas > 0 ? (
        <View style={styles.cards}>
          {planMontos.map((monto, i) => {
            const factura = facturas?.[i];
            const cobrado = Boolean(factura);
            const omitido = omitidas.includes(i);
            const activo = i === siguienteIndice && !cobrado && !omitido;
            const asignando = esAsignacion && personaAsignacionActiva === i && !cobrado;
            const met = metodos[i] ?? null;
            const unidades = unidadesPorPersona?.[i] ?? 0;
            const sinItems = repartoDesdeItemsSeleccionados
              ? !cobrado && monto <= 0
              : esAsignacion && unidades === 0 && !cobrado;
            const sinMetodo = activo && !met;
            const puedeCobrar =
              (puedeCobrarPersona ? puedeCobrarPersona(i) : !esAsignacion || unidades > 0) &&
              activo &&
              Boolean(met);

            return (
              <Pressable
                key={i}
                style={[
                  styles.personCard,
                  cobrado && styles.personCardDone,
                  omitido && styles.personCardOmitido,
                  activo && styles.personCardActive,
                  asignando && styles.personCardAsignando,
                ]}
                onPress={() => {
                  if (esAsignacion && !cobrado && onPersonaAsignacionActiva) {
                    onPersonaAsignacionActiva(i);
                  }
                }}
                disabled={!esAsignacion || cobrado || busy}
              >
                <View style={styles.personHead}>
                  <View
                    style={[
                      styles.personBadge,
                      cobrado && styles.personBadgeDone,
                      activo && styles.personBadgeActive,
                    ]}
                  >
                    {cobrado ? (
                      <Ionicons name="checkmark" size={16} color={colors.onPrimary} />
                    ) : omitido ? (
                      <Ionicons name="time-outline" size={16} color={colors.onPrimary} />
                    ) : (
                      <Text style={styles.personBadgeNum}>{i + 1}</Text>
                    )}
                  </View>
                  <View style={styles.personInfo}>
                    <Text
                      style={[
                        styles.personTitle,
                        cobrado && styles.personTitleDone,
                      ]}
                    >
                      Persona {i + 1}
                      {activo ? ' · sigue' : ''}
                      {omitido ? ' · pendiente' : ''}
                      {asignando ? ' · asignando' : ''}
                    </Text>
                    <Text
                      style={[
                        styles.personMonto,
                        cobrado && styles.personMontoDone,
                        sinItems && styles.personMontoVacio,
                      ]}
                    >
                      {sinItems ? 'Sin ítems' : omitido ? `${formatCOP(monto)} pendiente` : formatCOP(monto)}
                    </Text>
                    {esAsignacion && unidades > 0 && !cobrado ? (
                      <Text style={styles.unidadesHint}>
                        {unidades} unidad{unidades === 1 ? '' : 'es'} asignada
                        {unidades === 1 ? '' : 's'}
                      </Text>
                    ) : null}
                  </View>
                  {cobrado && factura ? (
                    <View style={styles.cobradoTag}>
                      <MaterialCommunityIcons
                        name={
                          METODO_PAGO_ICON[
                            (factura.metodo_pago === 'mixto'
                              ? 'mixto'
                              : factura.metodo_pago ?? met ?? 'efectivo') as MetodoPago
                          ] as ComponentProps<typeof MaterialCommunityIcons>['name']
                        }
                        size={14}
                        color={colors.successText}
                      />
                      <Text style={styles.cobradoTagText}>
                        {factura.metodo_pago === 'mixto'
                          ? METODO_PAGO_LABEL.mixto
                          : METODO_PAGO_LABEL[factura.metodo_pago ?? met ?? 'efectivo']}
                      </Text>
                    </View>
                  ) : omitido ? (
                    <View style={styles.pendienteTag}>
                      <Ionicons
                        name="alert-circle-outline"
                        size={14}
                        color={colors.warningText}
                      />
                      <Text style={styles.pendienteTagText}>No pagó</Text>
                    </View>
                  ) : null}
                </View>
                {cobrado && factura?.metodo_pago === 'mixto' ? (
                  <Text style={styles.mixtoCobradoDetalle}>
                    Efectivo {formatCOP(factura.efectivo ?? 0)} · Transferencia{' '}
                    {formatCOP(factura.transferencia ?? 0)}
                  </Text>
                ) : null}

                {!cobrado && !omitido ? (
                  cobroEnTarjeta ? (
                  <>
                    <MetodoPagoSelector
                      metodo={met}
                      onMetodoChange={(m) => onMetodoChange(i, m)}
                      opciones={['efectivo', 'transferencia']}
                      disabled={busy || !activo}
                      pendiente={sinMetodo}
                    />

                    {activo ? (
                      <CtaButton
                        icon={met === 'efectivo' ? 'cash-outline' : met === 'transferencia' ? 'card-outline' : 'help-circle-outline'}
                        title={`Cobrar persona ${i + 1}`}
                        subtitle={
                          sinItems
                            ? 'Asigna ítems primero'
                            : sinMetodo
                              ? 'Elige efectivo o transferencia'
                              : `${formatCOP(monto)} · ${METODO_PAGO_LABEL[met!]}`
                        }
                        variant="success"
                        onPress={() => onCobrarPersona(i)}
                        disabled={busy || !puedeCobrar}
                        busy={busy}
                        style={styles.cobrarCta}
                      />
                    ) : (
                      <Text style={styles.esperaHint}>
                        {esAsignacion && !cobrado
                          ? 'Toca la tarjeta para asignar sus platos'
                          : 'Cobra las anteriores primero'}
                      </Text>
                    )}
                  </>
                  ) : activo ? (
                    <Text style={styles.cobroAbajoHint}>
                      Confirma el cobro en el panel de abajo ↓
                    </Text>
                  ) : (
                    <Text style={styles.esperaHint}>
                      {esAsignacion && !cobrado
                        ? 'Toca la tarjeta para asignar sus platos'
                        : 'Cobra las anteriores primero'}
                    </Text>
                  )
                ) : omitido ? (
                  <Text style={styles.pendienteHint}>
                    Cuota pendiente en la mesa · los demás la ven al cobrar
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Text style={styles.emptyHint}>
          {esAsignacion
            ? 'Elige cuántas personas pagan para asignar platos a cada una.'
            : 'Elige cuántas personas pagan para ver el reparto automático.'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.successBorder,
    ...appShadow('soft'),
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  headIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: { flex: 1 },
  title: { fontWeight: '800', fontSize: 17, color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
  progressBlock: { marginBottom: 14 },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderLight,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  progressLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
    color: colors.successText,
  },
  saldoBlock: {
    marginBottom: 14,
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  saldoLabel: { fontSize: 13, fontWeight: '800', color: colors.primaryDark },
  saldoOmitidoHint: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: colors.warningText,
    lineHeight: 17,
  },
  fieldLabel: {
    fontWeight: '700',
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
    justifyContent: 'center',
  },
  quickChip: {
    minWidth: 48,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderInput,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChipOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  quickChipText: { fontWeight: '800', fontSize: 16, color: colors.textMuted },
  quickChipTextOn: { color: colors.primaryDark },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 8,
  },
  stepperVal: { alignItems: 'center', minWidth: 72 },
  stepperNum: { fontSize: 28, fontWeight: '900', color: colors.primary },
  stepperHint: { fontSize: 12, color: colors.textHint, fontWeight: '600' },
  sugerenciaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'center',
    minWidth: 220,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    marginBottom: 12,
  },
  sugerenciaText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
    textAlign: 'center',
  },
  cards: { gap: 10, marginTop: 4 },
  personCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surfaceMuted,
    padding: 12,
  },
  personCardActive: {
    borderColor: colors.successBorder,
    backgroundColor: colors.successLight,
  },
  personCardAsignando: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  personCardDone: {
    opacity: 0.72,
    backgroundColor: colors.surface,
  },
  personCardOmitido: {
    borderColor: colors.warningBorder,
    backgroundColor: colors.secondaryLight,
  },
  personHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  personBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personBadgeActive: { backgroundColor: colors.success },
  personBadgeDone: { backgroundColor: colors.success },
  personBadgeNum: { color: colors.onPrimary, fontWeight: '900', fontSize: 14 },
  personInfo: { flex: 1 },
  personTitle: { fontWeight: '700', fontSize: 14, color: colors.text },
  personTitleDone: { color: colors.textHint },
  personMonto: { fontWeight: '900', fontSize: 20, color: colors.text, marginTop: 2 },
  personMontoDone: {
    fontSize: 16,
    color: colors.textHint,
    textDecorationLine: 'line-through',
  },
  personMontoVacio: { fontSize: 16, color: colors.textHint, fontWeight: '700' },
  unidadesHint: { fontSize: 11, color: colors.textMuted, marginTop: 2, fontWeight: '600' },
  cobradoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.successLight,
  },
  cobradoTagText: { fontSize: 11, fontWeight: '800', color: colors.successText },
  pendienteTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.secondaryLight,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  pendienteTagText: { fontSize: 11, fontWeight: '800', color: colors.warningText },
  pendienteHint: {
    marginTop: 8,
    fontSize: 12,
    color: colors.warningText,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 17,
  },
  mixtoCobradoDetalle: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 4,
  },
  metodoLabel: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textAlign: 'center',
  },
  cobrarCta: { marginTop: 12 },
  esperaHint: {
    marginTop: 10,
    fontSize: 12,
    color: colors.textHint,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  cobroAbajoHint: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: colors.successText,
    textAlign: 'center',
  },
  emptyHint: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textHint,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
