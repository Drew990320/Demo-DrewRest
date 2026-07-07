import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useVisualTheme } from '../context/VisualThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';
import type { AppColors } from '../lib/theme';

function createStyles(c: AppColors) {
  return StyleSheet.create({
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: c.background,
    },
  });
}

export function ScreenLoading() {
  const { colors } = useVisualTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
