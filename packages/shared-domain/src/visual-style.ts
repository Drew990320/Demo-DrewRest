import type { VisualColorKey } from './nav-app-icon';
import { VISUAL_COLOR_DEFAULTS } from './nav-app-icon';
import type { MesaFormaId, MesaVistaId } from './mesa-visual';

export const VISUAL_STYLE_IDS = [
  'minimalista',
  'profesional',
  'calido',
  'expresivo',
] as const;

export type VisualStyleId = (typeof VISUAL_STYLE_IDS)[number];

export type VisualLayoutTokens = {
  radiusSm: number;
  radiusMd: number;
  radiusLg: number;
  cardBorderWidth: number;
  titleWeight: '600' | '700' | '800';
  chromeElevation: 'flat' | 'soft' | 'raised';
};

/** Apariencia de barras, botones de icono y CTAs (cambio visual fuerte). */
export type NavItemChrome = 'ghost' | 'pill' | 'solid' | 'underline';
export type NavBarChrome = 'flat' | 'bordered' | 'elevated' | 'floating';
export type IconButtonChrome = 'outline' | 'soft' | 'filled' | 'bold';
export type CtaChrome = 'classic' | 'corporate' | 'rounded' | 'chunky';

export type VisualChromeTokens = {
  navItem: NavItemChrome;
  navBar: NavBarChrome;
  iconButton: IconButtonChrome;
  cta: CtaChrome;
  /** Ítem activo de nav con fondo primary sólido e icono claro. */
  navActiveFilled: boolean;
  iconButtonBorderWidth: number;
  mesaForma: MesaFormaId;
  mesaVista: MesaVistaId;
};

export type VisualStylePreset = {
  id: VisualStyleId;
  nombre: string;
  descripcion: string;
  colores: Record<VisualColorKey, string>;
  layout: VisualLayoutTokens;
  chrome: VisualChromeTokens;
};

export const VISUAL_LAYOUT_DEFAULTS: VisualLayoutTokens = {
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  cardBorderWidth: 0.5,
  titleWeight: '700',
  chromeElevation: 'flat',
};

export const VISUAL_CHROME_DEFAULTS: VisualChromeTokens = {
  navItem: 'ghost',
  navBar: 'flat',
  iconButton: 'soft',
  cta: 'classic',
  navActiveFilled: false,
  iconButtonBorderWidth: 1,
  mesaForma: 'rectangular',
  mesaVista: 'cuadricula',
};

/** Paleta terracota La Reserva (referencia estilo cálido). */
const PALETA_CALIDA: Record<VisualColorKey, string> = {
  primary: '#C47A72',
  primary_dark: '#A86158',
  secondary: '#D4A574',
  background: '#FAF6F0',
  background_alt: '#F3EDE4',
  surface: '#FFFFFF',
  text: '#3D3630',
  text_muted: '#7A7268',
  border: '#E8DFD4',
};

export const VISUAL_STYLE_PRESETS: Record<VisualStyleId, VisualStylePreset> = {
  minimalista: {
    id: 'minimalista',
    nombre: 'Minimalista',
    descripcion:
      'Limpio y ligero. Nav discreta, botones con borde suave y CTAs planos.',
    colores: { ...VISUAL_COLOR_DEFAULTS },
    layout: {
      radiusSm: 8,
      radiusMd: 12,
      radiusLg: 16,
      cardBorderWidth: 0.5,
      titleWeight: '700',
      chromeElevation: 'flat',
    },
    chrome: { ...VISUAL_CHROME_DEFAULTS },
  },
  profesional: {
    id: 'profesional',
    nombre: 'Profesional',
    descripcion:
      'Corporativo: barra con borde marcado, ítems con subrayado y botones cuadrados.',
    colores: {
      primary: '#4A6FA5',
      primary_dark: '#365580',
      secondary: '#6B8CAE',
      background: '#EEF2F7',
      background_alt: '#E2E8F0',
      surface: '#FFFFFF',
      text: '#1E293B',
      text_muted: '#64748B',
      border: '#CBD5E1',
    },
    layout: {
      radiusSm: 6,
      radiusMd: 10,
      radiusLg: 14,
      cardBorderWidth: 1,
      titleWeight: '700',
      chromeElevation: 'soft',
    },
    chrome: {
      navItem: 'underline',
      navBar: 'bordered',
      iconButton: 'outline',
      cta: 'corporate',
      navActiveFilled: false,
      iconButtonBorderWidth: 1.5,
      mesaForma: 'cuadrada',
      mesaVista: 'compacta',
    },
  },
  calido: {
    id: 'calido',
    nombre: 'Cálido',
    descripcion:
      'Acogedor: nav con pastillas redondeadas, barra elevada y botones suaves.',
    colores: { ...PALETA_CALIDA },
    layout: {
      radiusSm: 10,
      radiusMd: 14,
      radiusLg: 18,
      cardBorderWidth: 0.5,
      titleWeight: '600',
      chromeElevation: 'soft',
    },
    chrome: {
      navItem: 'pill',
      navBar: 'elevated',
      iconButton: 'soft',
      cta: 'rounded',
      navActiveFilled: false,
      iconButtonBorderWidth: 1,
      mesaForma: 'redonda',
      mesaVista: 'cuadricula',
    },
  },
  expresivo: {
    id: 'expresivo',
    nombre: 'Expresivo',
    descripcion:
      'Táctil y marcado: nav con ítems sólidos, barra flotante y botones redondos con sombra.',
    colores: {
      primary: '#2563EB',
      primary_dark: '#1D4ED8',
      secondary: '#0EA5E9',
      background: '#F8FAFC',
      background_alt: '#E2E8F0',
      surface: '#FFFFFF',
      text: '#0F172A',
      text_muted: '#475569',
      border: '#94A3B8',
    },
    layout: {
      radiusSm: 12,
      radiusMd: 16,
      radiusLg: 20,
      cardBorderWidth: 1.5,
      titleWeight: '800',
      chromeElevation: 'raised',
    },
    chrome: {
      navItem: 'solid',
      navBar: 'floating',
      iconButton: 'bold',
      cta: 'chunky',
      navActiveFilled: true,
      iconButtonBorderWidth: 2,
      mesaForma: 'barra',
      mesaVista: 'lista',
    },
  },
};

export function esEstiloVisualValido(
  id: string | null | undefined,
): id is VisualStyleId {
  return (
    typeof id === 'string' &&
    (VISUAL_STYLE_IDS as readonly string[]).includes(id)
  );
}

export function resolverEstiloVisual(
  guardado?: string | null,
): VisualStyleId {
  return esEstiloVisualValido(guardado) ? guardado : 'minimalista';
}

export function presetEstiloVisual(id: VisualStyleId): VisualStylePreset {
  return VISUAL_STYLE_PRESETS[id];
}
