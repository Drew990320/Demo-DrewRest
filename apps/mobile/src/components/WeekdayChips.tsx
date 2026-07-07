import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../hooks/useThemedStyles';
import type { AppColors } from '../lib/theme';
import {
  WEEKDAYS,
  countActiveWeekdays,
  type WeekdayFieldKey,
  type WeekdayFlags,
} from '../lib/weekday-visibility';

type Props = {
  flags: WeekdayFlags;
  onToggle: (key: WeekdayFieldKey, enabled: boolean) => void;
  onSetAll?: (enabled: boolean) => void;
  disabled?: boolean;
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: { marginTop: 4 },
    chips: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    chip: {
      minWidth: 36,
      height: 36,
      paddingHorizontal: 6,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.borderInput,
      backgroundColor: c.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipOn: {
      backgroundColor: c.primary,
      borderColor: c.primaryDark,
    },
    chipPressed: { opacity: 0.82 },
    chipDisabled: { opacity: 0.5 },
    chipText: {
      fontSize: 12,
      fontWeight: '800',
      color: c.textMuted,
    },
    chipTextOn: { color: c.onPrimary },
    footer: {
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 8,
    },
    quick: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    quickLink: {
      fontSize: 12,
      fontWeight: '800',
      color: c.primary,
      minWidth: 72,
      minHeight: 36,
      textAlign: 'center',
      lineHeight: 36,
    },
    quickLinkMuted: { color: c.textHint },
    quickSep: { color: c.textHint, fontSize: 12 },
    count: { fontSize: 11, fontWeight: '700', color: c.textHint },
  });
}

/** Selector compacto de días de la semana (sustituye filas de Switch). */
export function WeekdayChips({ flags, onToggle, onSetAll, disabled }: Props) {
  const styles = useThemedStyles(createStyles);
  const active = countActiveWeekdays(flags);

  return (
    <View style={styles.wrap}>
      <View style={styles.chips}>
        {WEEKDAYS.map((d) => {
          const on = Boolean(flags[d.key]);
          return (
            <Pressable
              key={d.key}
              accessibilityRole="switch"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${d.full}: ${on ? 'activo' : 'inactivo'}`}
              disabled={disabled}
              onPress={() => onToggle(d.key, !on)}
              style={({ pressed }) => [
                styles.chip,
                on && styles.chipOn,
                pressed && styles.chipPressed,
                disabled && styles.chipDisabled,
              ]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{d.short}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.footer}>
        {onSetAll ? (
          <View style={styles.quick}>
            <Pressable
              disabled={disabled || active === 7}
              onPress={() => onSetAll(true)}
              hitSlop={6}
            >
              <Text
                style={[
                  styles.quickLink,
                  (disabled || active === 7) && styles.quickLinkMuted,
                ]}
              >
                Todos
              </Text>
            </Pressable>
            <Text style={styles.quickSep}>·</Text>
            <Pressable
              disabled={disabled || active === 0}
              onPress={() => onSetAll(false)}
              hitSlop={6}
            >
              <Text
                style={[
                  styles.quickLink,
                  (disabled || active === 0) && styles.quickLinkMuted,
                ]}
              >
                Ninguno
              </Text>
            </Pressable>
          </View>
        ) : null}
        <Text style={styles.count}>{active}/7</Text>
      </View>
    </View>
  );
}
