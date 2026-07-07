import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVisualTheme } from '../context/VisualThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';
import type { AppColors } from '../lib/theme';

type Variant = 'mesa' | 'pedido' | 'cobro';

type Props = {
  title: string;
  subtitle?: string;
  summaryRight?: string;
  open: boolean;
  onToggle: () => void;
  variant?: Variant;
  headerActions?: ReactNode;
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

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      marginBottom: 8,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surface,
      overflow: 'hidden',
    },
    wrapNested: {
      marginTop: 6,
      backgroundColor: c.surfaceMuted,
      borderColor: c.borderLight,
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
      backgroundColor: c.backgroundAlt,
    },
    headRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    headPressable: {
      flex: 1,
      minWidth: 0,
    },
    headerActions: {
      justifyContent: 'center',
      paddingRight: 8,
      paddingLeft: 4,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: c.borderLight,
      backgroundColor: c.surfaceMuted,
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
      color: c.text,
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
      color: c.textMuted,
      fontSize: 12,
      marginTop: 2,
      lineHeight: 16,
    },
    summaryRight: {
      fontWeight: '700',
      color: c.text,
      fontSize: 14,
      maxWidth: '36%',
      textAlign: 'right',
    },
    body: {
      paddingHorizontal: 12,
      paddingBottom: 12,
      paddingTop: 4,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.borderLight,
    },
  });
}

/** Acordeón anidado para mesas, pedidos y cobros en el resumen diario. */
export function ResumenNestedAccordion({
  title,
  subtitle,
  summaryRight,
  open,
  onToggle,
  variant = 'mesa',
  headerActions,
  children,
}: Props) {
  const { colors } = useVisualTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View
      style={[
        styles.wrap,
        variant !== 'mesa' && styles.wrapNested,
        { marginLeft: INDENT[variant] },
      ]}
    >
      <View style={styles.headRow}>
        <Pressable
          style={[styles.head, variant === 'mesa' && styles.headMesa, styles.headPressable]}
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
        {headerActions ? (
          <View style={styles.headerActions}>{headerActions}</View>
        ) : null}
      </View>
      {open && children ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}
