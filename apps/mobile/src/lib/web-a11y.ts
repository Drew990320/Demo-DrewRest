import { Platform } from 'react-native';

/** Quita el foco del elemento activo (evita avisos aria-hidden al cambiar de pantalla en web). */
export function blurWebFocus() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const el = document.activeElement;
  if (el && el instanceof HTMLElement && el !== document.body) {
    el.blur();
  }
}
