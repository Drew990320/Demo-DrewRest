import { Platform, type ViewStyle } from 'react-native';

type ShadowLevel = 'card' | 'elevated' | 'soft' | 'dialog' | 'login';

const WEB: Record<ShadowLevel, string> = {
  card: '0 3px 8px rgba(0,0,0,0.06)',
  elevated: '0 4px 10px rgba(0,0,0,0.06)',
  soft: '0 4px 10px rgba(0,0,0,0.04)',
  dialog: '0 20px 50px rgba(0,0,0,0.18)',
  login: '0 5px 12px rgba(0,0,0,0.08)',
};

const NATIVE: Record<ShadowLevel, ViewStyle> = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  elevated: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  soft: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  dialog: {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  login: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
};

/** Sombra multiplataforma (boxShadow en web, shadow* en nativo). */
export function appShadow(level: ShadowLevel): ViewStyle {
  if (Platform.OS === 'web') {
    return { boxShadow: WEB[level] } as ViewStyle;
  }
  return NATIVE[level];
}
