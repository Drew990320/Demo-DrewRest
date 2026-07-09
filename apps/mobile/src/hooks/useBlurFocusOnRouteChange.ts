import { usePathname } from 'expo-router';
import { useLayoutEffect } from 'react';
import { Platform } from 'react-native';
import { blurWebFocus } from '../lib/web-a11y';

/** Al cambiar de ruta en web, suelta el foco antes del pintado para evitar conflictos con aria-hidden/inert. */
export function useBlurFocusOnRouteChange() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (Platform.OS !== 'web') return;
    blurWebFocus();
  }, [pathname]);
}
