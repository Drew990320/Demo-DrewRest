import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useVisualTheme } from '../context/VisualThemeContext';
import { CachedRemoteImage } from './CachedRemoteImage';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Fondo compartido: barra de navegación (izq./abajo) y barra de herramientas (der.).
 * Usa la imagen `navbar-fondo` si existe; si no, color surface del tema.
 */
export function AppNavChrome({ children, style }: Props) {
  const { assetUrl, colors } = useVisualTheme();
  const navbarBg = assetUrl('navbar-fondo');
  const shellStyle = [
    style,
    { backgroundColor: navbarBg ? 'transparent' : colors.surface },
  ];

  if (navbarBg) {
    return (
      <View style={shellStyle}>
        <CachedRemoteImage
          uri={navbarBg}
          style={[StyleSheet.absoluteFill, styles.navbarBg]}
          contentFit="cover"
        />
        {children}
      </View>
    );
  }

  return <View style={shellStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  navbarBg: {
    opacity: 0.9,
  },
});
