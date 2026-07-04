import { Platform, type ViewStyle } from 'react-native';

type ShadowLevel = 'card' | 'elevated' | 'soft' | 'dialog' | 'login';

/** Sombras muy suaves: diseño plano con ligera profundidad en modales. */
const WEB: Record<ShadowLevel, string> = {
  card: 'none',
  elevated: '0 1px 3px rgba(61, 54, 48, 0.04)',
  soft: 'none',
  dialog: '0 8px 32px rgba(61, 54, 48, 0.12)',
  login: '0 2px 8px rgba(61, 54, 48, 0.06)',
};

const NATIVE: Record<ShadowLevel, ViewStyle> = {
  card: {},
  elevated: {
    shadowColor: '#3D3630',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  soft: {},
  dialog: {
    shadowColor: '#3D3630',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  login: {
    shadowColor: '#3D3630',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
};

/** Sombra multiplataforma (boxShadow en web, shadow* en nativo). */
export function appShadow(level: ShadowLevel): ViewStyle {
  if (Platform.OS === 'web') {
    const v = WEB[level];
    return v === 'none' ? {} : ({ boxShadow: v } as ViewStyle);
  }
  return NATIVE[level];
}
