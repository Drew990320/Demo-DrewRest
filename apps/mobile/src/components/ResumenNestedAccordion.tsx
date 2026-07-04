import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../lib/theme';

type Variant = 'mesa' | 'pedido' | 'cobro';

type Props = {
  title: string;
  subtitle?: string;
  summaryRight?: string;
  open: boolean;
  onToggle: () => void;
  variant?: Variant;
  children?: ReactNode;
};

const INDENT: Record<Variant, number> = {
  mesa: 0,
  pedido: 10,
  cobro: 18,
};

const CHEVRON: Record<Variant, number> = {
  mesa: 18,
  pedido: 16,
  cobro: 14,
};

/** Acordeón anidado para mesas, pedidos y cobros en el resumen diario. */
export function ResumenNestedAccordion({
  title,
  subtitle,
  summaryRight,
  open,
  onToggle,
  variant = 'mesa',
  children,
}: Props) {
  return (
    <View
      style={[
        styles.wrap,
        variant !== 'mesa' && styles.wrapNested,
        { marginLeft: INDENT[variant] },
      ]}
    >
      <Pressable
        style={[styles.head, variant === 'mesa' && styles.headMesa]}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <View style={styles.headLeft}>
          <Ionicons
            name={open ? 'chevron-down' : 'chevron-forward'}
            size={CHEVRON[variant]}
            color={variant === 'cobro' ? colors.textMuted : colors.primary}
          />
          <View style={styles.headText}>
            <Text
              style={[
                styles.title,
                variant === 'pedido' && styles.titlePedido,
                variant === 'cobro' && styles.titleCobro,
              ]}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        {summaryRight ? (
          <Text style={styles.summaryRight} numberOfLines={1}>
            {summaryRight}
          </Text>
        ) : null}
      </Pressable>
      {open && children ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  wrapNested: {
    marginTop: 6,
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderLight,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  headMesa: {
    backgroundColor: colors.backgroundAlt,
  },
  headLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    minWidth: 0,
  },
  headText: { flex: 1, minWidth: 0 },
  title: {
    fontWeight: '700',
    color: colors.text,
    fontSize: 16,
  },
  titlePedido: {
    fontSize: 15,
  },
  titleCobro: {
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  summaryRight: {
    fontWeight: '700',
    color: colors.primary,
    fontSize: 14,
    maxWidth: '36%',
    textAlign: 'right',
  },
  body: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
  },
});
