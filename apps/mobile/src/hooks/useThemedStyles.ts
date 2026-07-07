import { useMemo } from 'react';
import type { StyleSheet } from 'react-native';
import { useVisualTheme } from '../context/VisualThemeContext';
import type { AppColors } from '../lib/theme';

/** Estilos que se recalculan cuando cambia la paleta visual. */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (colors: AppColors) => T,
): T {
  const { colors } = useVisualTheme();
  return useMemo(() => factory(colors), [colors, factory]);
}
