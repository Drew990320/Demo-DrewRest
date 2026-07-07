import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../hooks/useThemedStyles';
import type { AppColors } from '../lib/theme';

type Props = {
  title: string;
  subtitle?: string;
  summaryRight?: string;
  toolbar?: ReactNode;
  children: ReactNode;
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    panel: {
      backgroundColor: c.surface,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      overflow: 'hidden',
      marginBottom: 10,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 10,
      paddingVertical: 14,
      paddingHorizontal: 14,
      backgroundColor: c.backgroundAlt,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.borderLight,
    },
    headerText: { flex: 1, minWidth: 0 },
    title: { fontWeight: '700', color: c.text, fontSize: 15 },
    subtitle: { color: c.textMuted, fontSize: 12, marginTop: 2, lineHeight: 16 },
    summaryRight: {
      fontWeight: '700',
      color: c.text,
      fontSize: 14,
      maxWidth: '38%',
      textAlign: 'right',
    },
    toolbar: {
      paddingHorizontal: 14,
      paddingTop: 10,
      paddingBottom: 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.borderLight,
    },
    body: {
      padding: 14,
      backgroundColor: c.surface,
    },
  });
}

/** Contenedor de una vista del resumen diario (sin acordeón). */
export function ResumenSeccionPanel({
  title,
  subtitle,
  summaryRight,
  toolbar,
  children,
}: Props) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {summaryRight ? (
          <Text style={styles.summaryRight} numberOfLines={1}>
            {summaryRight}
          </Text>
        ) : null}
      </View>
      {toolbar ? <View style={styles.toolbar}>{toolbar}</View> : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}
