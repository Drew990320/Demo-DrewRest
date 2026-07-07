import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useVisualTheme } from '../context/VisualThemeContext';
import { appShadow } from '../lib/shadow';
import type { AppColors } from '../lib/theme';

type Props = {
  total: number;
  disponibles: number;
  ocupadas: number;
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    panel: {
      width: 220,
      flexShrink: 0,
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: 16,
      alignSelf: 'flex-start',
      ...appShadow('elevated'),
    },
    kicker: {
      fontSize: 11,
      fontWeight: '700',
      color: c.textHint,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 2,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: c.text,
      marginBottom: 14,
    },
    statCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRadius: 12,
      backgroundColor: c.surfaceMuted,
      marginBottom: 8,
    },
    statIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    statBody: { flex: 1, minWidth: 0 },
    statValue: {
      fontSize: 20,
      fontWeight: '800',
      color: c.text,
      lineHeight: 24,
    },
    statLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: c.textMuted,
      marginTop: 1,
    },
    ocupacionBlock: {
      marginTop: 8,
      marginBottom: 12,
    },
    ocupacionHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    ocupacionLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: c.textMuted,
    },
    ocupacionPct: {
      fontSize: 13,
      fontWeight: '800',
      color: c.text,
    },
    barTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: c.borderLight,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 4,
      minWidth: 0,
    },
    hint: {
      fontSize: 11,
      fontWeight: '600',
      color: c.textHint,
      textAlign: 'center',
      lineHeight: 15,
    },
  });
}

/**
 * Panel decorativo de resumen en pantallas anchas (solo visual, sin acciones nuevas).
 */
export function MesasResumenPanel({ total, disponibles, ocupadas }: Props) {
  const { colors } = useVisualTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const ocupacion = total > 0 ? Math.round((ocupadas / total) * 100) : 0;

  return (
    <View style={styles.panel}>
      <Text style={styles.kicker}>Hoy en sala</Text>
      <Text style={styles.title}>Resumen</Text>

      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: colors.successLight }]}>
          <MaterialCommunityIcons
            name="table-furniture"
            size={20}
            color={colors.successText}
          />
        </View>
        <View style={styles.statBody}>
          <Text style={styles.statValue}>{total}</Text>
          <Text style={styles.statLabel}>Mesas en total</Text>
        </View>
      </View>

      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: colors.mesaLibreBg }]}>
          <View style={[styles.dot, { backgroundColor: colors.mesaLibre }]} />
        </View>
        <View style={styles.statBody}>
          <Text style={[styles.statValue, { color: colors.mesaLibre }]}>
            {disponibles}
          </Text>
          <Text style={styles.statLabel}>Disponibles</Text>
        </View>
      </View>

      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: colors.mesaOcupadaBg }]}>
          <View style={[styles.dot, { backgroundColor: colors.mesaOcupada }]} />
        </View>
        <View style={styles.statBody}>
          <Text style={[styles.statValue, { color: colors.mesaOcupada }]}>
            {ocupadas}
          </Text>
          <Text style={styles.statLabel}>Ocupadas</Text>
        </View>
      </View>

      <View style={styles.ocupacionBlock}>
        <View style={styles.ocupacionHead}>
          <Text style={styles.ocupacionLabel}>Ocupación</Text>
          <Text style={styles.ocupacionPct}>{ocupacion}%</Text>
        </View>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              {
                width: `${ocupacion}%`,
                backgroundColor:
                  ocupacion >= 80
                    ? colors.danger
                    : ocupacion >= 50
                      ? colors.warning
                      : colors.success,
              },
            ]}
          />
        </View>
      </View>

      <Text style={styles.hint}>Toca una mesa para abrirla</Text>
    </View>
  );
}
