import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatCOP } from '../lib/format';
import { appShadow } from '../lib/shadow';
import { colors } from '../lib/theme';

type Props = {
  title: string;
  monto: number;
  /** Badge numerado (cobro por persona). */
  personaIndice?: number;
  children: ReactNode;
};

/** Panel visual para elegir método de pago y montos (cobro estándar o por persona). */
export function CobroMontoPanel({
  title,
  monto,
  personaIndice,
  children,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        {personaIndice != null ? (
          <View style={styles.badge}>
            <Text style={styles.badgeNum}>{personaIndice + 1}</Text>
          </View>
        ) : null}
        <View style={styles.headText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.monto}>{formatCOP(monto)}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.successLight,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.successBorder,
    marginBottom: 12,
    ...appShadow('elevated'),
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeNum: { color: colors.onPrimary, fontWeight: '800', fontSize: 16 },
  headText: { flex: 1, minWidth: 0 },
  title: { fontWeight: '700', fontSize: 14, color: colors.textMuted },
  monto: { fontWeight: '800', fontSize: 22, color: colors.text, marginTop: 2 },
});
