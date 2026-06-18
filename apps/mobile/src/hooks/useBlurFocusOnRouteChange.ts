import { usePathname } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { blurWebFocus } from '../lib/web-a11y';

/** Al cambiar de ruta en web, suelta el foco para que react-native-screens no dispare aria-hidden. */
export function useBlurFocusOnRouteChange() {
  const pathname = usePathname();

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    blurWebFocus();
  }, [pathname]);
}
