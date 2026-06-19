import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../lib/theme';
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

/** Selector compacto de días de la semana (sustituye filas de Switch). */
export function WeekdayChips({ flags, onToggle, onSetAll, disabled }: Props) {
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
        ) : (
          <View />
        )}
        <Text style={styles.count}>{active}/7</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    borderColor: colors.borderInput,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  chipPressed: { opacity: 0.82 },
  chipDisabled: { opacity: 0.5 },
  chipText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
  },
  chipTextOn: { color: colors.surface },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  quick: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  quickLink: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  quickLinkMuted: { color: colors.textHint },
  quickSep: { color: colors.textHint, fontSize: 12 },
  count: { fontSize: 11, fontWeight: '700', color: colors.textHint },
});
