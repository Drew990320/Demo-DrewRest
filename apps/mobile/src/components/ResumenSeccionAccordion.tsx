import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../lib/theme';

type Props = {
  title: string;
  subtitle?: string;
  summaryRight?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

export function ResumenSeccionAccordion({
  title,
  subtitle,
  summaryRight,
  open,
  onToggle,
  children,
}: Props) {
  return (
    <View style={styles.card}>
      <Pressable
        style={styles.head}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title}. ${open ? 'Contraer' : 'Expandir'}`}
      >
        <View style={styles.headLeft}>
          <Ionicons
            name={open ? 'chevron-down' : 'chevron-forward'}
            size={18}
            color={colors.primary}
          />
          <View style={styles.headText}>
            <Text style={styles.title}>{title}</Text>
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
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: 10,
    overflow: 'hidden',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 10,
    backgroundColor: colors.backgroundAlt,
  },
  headLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  headText: { flex: 1, minWidth: 0 },
  title: { fontWeight: '700', color: colors.text, fontSize: 15 },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2, lineHeight: 16 },
  summaryRight: {
    fontWeight: '700',
    color: colors.primary,
    fontSize: 14,
    maxWidth: '38%',
    textAlign: 'right',
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
  },
});
