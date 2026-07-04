import { StyleSheet, Text, View } from 'react-native';
import { ActionIconBar, type ActionIconItem } from './ActionIconBar';
import { colors } from '../lib/theme';

type Props = {
  title: string;
  message?: string;
  actions?: ActionIconItem[];
};

export function EmptyState({ title, message, actions }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
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
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 300,
  },
  actions: {
    marginTop: 12,
  },
});
