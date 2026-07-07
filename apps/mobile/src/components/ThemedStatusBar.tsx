import { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useVisualTheme } from '../context/VisualThemeContext';
import { esTemaOscuro } from '../lib/visual-theme';

/** Barra de estado acorde al tema visual (claro u oscuro). */
export function ThemedStatusBar() {
  const { colors, visual } = useVisualTheme();
  const oscuro = esTemaOscuro(visual, colors);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.documentElement.style.backgroundColor = colors.background;
    document.body.style.backgroundColor = colors.background;
    document.body.style.color = colors.text;
  }, [colors.background, colors.text]);

  return <StatusBar style={oscuro ? 'light' : 'dark'} />;
}
