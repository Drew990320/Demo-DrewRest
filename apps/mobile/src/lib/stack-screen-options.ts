import { Platform } from 'react-native';
import { MOTION } from './motion';

/**
 * Animación de push en stacks nativos. En web usamos `none` para evitar errores de
 * reconciliación DOM (`insertBefore`) al cambiar de pantalla con react-native-screens.
 */
export function stackPushAnimation(): 'slide_from_right' | 'none' {
  return Platform.OS === 'web' ? 'none' : 'slide_from_right';
}

export function stackPushAnimationDuration(): number | undefined {
  return Platform.OS === 'web' ? undefined : MOTION.normal;
}
