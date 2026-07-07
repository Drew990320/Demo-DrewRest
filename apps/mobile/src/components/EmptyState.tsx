import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ActionIconBar, type ActionIconItem } from './ActionIconBar';
import { useVisualTheme } from '../context/VisualThemeContext';

type Props = {
  title: string;
  message?: string;
  actions?: ActionIconItem[];
};

export function EmptyState({ title, message, actions }: Props) {
  const { colors } = useVisualTheme();
  const textStyles = useMemo(
    () => ({
      title: { ...styles.title, color: colors.text },
      message: { ...styles.message, color: colors.textMuted },
    }),
    [colors],
  );

  return (
    <View style={styles.wrap}>
      <Text style={textStyles.title}>{title}</Text>
      {message ? <Text style={textStyles.message}>{message}</Text> : null}
      {actions && actions.length > 0 ? (
        <ActionIconBar style={styles.actions} actions={actions} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 300,
  },
  actions: {
    marginTop: 12,
  },
});
