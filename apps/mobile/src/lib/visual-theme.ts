import {
  VISUAL_COLOR_DEFAULTS,
  type NavIconKey,
  type VisualColorKey,
} from '@la-reserva/shared-domain/nav-app-icon';
import type { ActionIconKey } from '@la-reserva/shared-domain/action-app-icon';
import type {
  VisualStyleId,
  VisualChromeTokens,
} from '@la-reserva/shared-domain/visual-style';
import {
  esMesaFormaValida,
  esMesaVistaValida,
  type MesaFormaId,
  type MesaVistaId,
} from '@la-reserva/shared-domain/mesa-visual';
import { presetEstiloVisual } from '@la-reserva/shared-domain/visual-style';
import { derivarColoresSemanticos, modoPaletaVisual, normalizarContrastePaleta } from './visual-palette';
import { colors as baseColors, type AppColors } from './theme';

export type VisualAssetTipo =
  | 'login'
  | 'factura'
  | 'ticket'
  | 'favicon'
  | 'navbar-fondo';

export type VisualPublica = {
  colores: Record<VisualColorKey, string>;
  iconos_nav: Record<NavIconKey, string>;
  iconos_accion: Record<ActionIconKey, string>;
  estilo_visual: VisualStyleId;
  mesa_forma: MesaFormaId | null;
  mesa_vista: MesaVistaId | null;
  tiene_logo_login: boolean;
  tiene_logo_factura: boolean;
  tiene_logo_ticket: boolean;
  tiene_favicon: boolean;
  tiene_navbar_fondo: boolean;
  urls: Partial<Record<VisualAssetTipo, string | null>>;
  actualizado_en?: string;
};

export type VisualConfigAdmin = VisualPublica & {
  logo_login_archivo: string | null;
  logo_factura_archivo: string | null;
  logo_ticket_archivo: string | null;
  favicon_archivo: string | null;
  navbar_fondo_archivo: string | null;
  actualizado_en: string;
};

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function toHex(rgb: [number, number, number]): string {
  return `#${rgb
    .map((n) =>
      Math.round(Math.max(0, Math.min(255, n)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`.toUpperCase();
}

function mixHex(a: string, b: string, weightB: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  if (!pa || !pb) return a;
  const w = Math.max(0, Math.min(1, weightB));
  return toHex([
    pa[0] * (1 - w) + pb[0] * w,
    pa[1] * (1 - w) + pb[1] * w,
    pa[2] * (1 - w) + pb[2] * w,
  ]);
}

/** Convierte la paleta visual en tokens de color usados por la app. */
export function paletteToAppColors(
  palette: Record<VisualColorKey, string>,
): AppColors {
  const c = normalizarContrastePaleta(palette);
  const modo = modoPaletaVisual(c);
  const sem = derivarColoresSemanticos(c, modo);
  const onPrimary = modo === 'oscuro' ? '#FFFFFF' : '#FFFFFF';
  const onSecondary = '#FFFFFF';

  return {
    ...baseColors,
    primary: c.primary,
    primaryDark: c.primary_dark,
    primaryLight: mixHex(c.primary, c.surface, modo === 'oscuro' ? 0.72 : 0.88),
    primaryMuted: mixHex(c.primary, c.surface, modo === 'oscuro' ? 0.55 : 0.72),
    primarySoft: mixHex(c.primary, c.surface, modo === 'oscuro' ? 0.55 : 0.72),
    onPrimary,
    onPrimaryMuted:
      modo === 'oscuro'
        ? mixHex('#FFFFFF', c.primary, 0.35)
        : mixHex('#FFFFFF', c.primary, 0.55),
    secondary: c.secondary,
    secondaryDark: mixHex(c.secondary, '#000000', 0.18),
    secondaryLight: mixHex(c.secondary, c.surface, modo === 'oscuro' ? 0.65 : 0.85),
    onSecondary,
    background: c.background,
    backgroundAlt: c.background_alt,
    surface: c.surface,
    surfaceMuted: mixHex(c.surface, c.background, 0.35),
    text: c.text,
    textMuted: c.text_muted,
    textHint: mixHex(c.text_muted, c.background, 0.45),
    onDark: mixHex(c.text, c.background, 0.15),
    border: c.border,
    borderLight: mixHex(c.border, c.surface, 0.45),
    borderInput: modo === 'oscuro'
      ? mixHex(c.border, c.surface, 0.4)
      : mixHex(c.border, '#000000', 0.12),
    ...sem,
  };
}

export function mergeVisualColorOverrides(
  overrides: Partial<Record<VisualColorKey, string>>,
): AppColors {
  return paletteToAppColors({ ...VISUAL_COLOR_DEFAULTS, ...overrides });
}

export function mergeVisualColors(
  api: VisualPublica | null,
): AppColors {
  return paletteToAppColors({
    ...VISUAL_COLOR_DEFAULTS,
    ...(api?.colores ?? {}),
  });
}

/** Chrome efectivo: preset del estilo + overrides de mesa guardados en BD. */
export function resolveVisualChrome(
  estilo: VisualStyleId,
  mesaFormaGuardada?: string | null,
  mesaVistaGuardada?: string | null,
): VisualChromeTokens {
  const preset = presetEstiloVisual(estilo);
  return {
    ...preset.chrome,
    mesaForma:
      mesaFormaGuardada != null && esMesaFormaValida(mesaFormaGuardada)
        ? mesaFormaGuardada
        : preset.chrome.mesaForma,
    mesaVista:
      mesaVistaGuardada != null && esMesaVistaValida(mesaVistaGuardada)
        ? mesaVistaGuardada
        : preset.chrome.mesaVista,
  };
}

/** Colores de tarjeta de mesa según estado (libre / ocupada / otro). */
export function estiloTarjetaMesa(
  c: AppColors,
  estado: string,
): {
  text: string;
  backgroundColor: string;
  borderColor: string;
  accent: string;
} {
  if (estado === 'libre') {
    return {
      text: c.mesaLibre,
      backgroundColor: c.mesaLibreBg,
      borderColor: c.mesaLibreBorder,
      accent: c.mesaLibre,
    };
  }
  if (estado === 'ocupada') {
    return {
      text: c.mesaOcupada,
      backgroundColor: c.mesaOcupadaBg,
      borderColor: c.mesaOcupadaBorder,
      accent: c.mesaOcupada,
    };
  }
  return {
    text: c.textMuted,
    backgroundColor: c.surface,
    borderColor: c.borderLight,
    accent: c.textHint,
  };
}

/** Si la paleta activa es oscura (p. ej. barra de estado del sistema). */
export function esTemaOscuro(
  visual: VisualPublica | null,
  colors: AppColors = baseColors,
): boolean {
  if (visual?.colores) return modoPaletaVisual(visual.colores) === 'oscuro';
  return (
    modoPaletaVisual({
      ...VISUAL_COLOR_DEFAULTS,
      background: colors.background,
      background_alt: colors.backgroundAlt,
    }) === 'oscuro'
  );
}

/** Banners y chips con significado semántico (éxito, aviso, error, info). */
export function statusFromAppColors(c: AppColors) {
  return {
    ok: {
      fg: c.successText,
      bg: c.successLight,
      border: c.successBorder,
      accent: c.success,
    },
    busy: {
      fg: c.dangerText,
      bg: c.dangerLight,
      border: c.dangerBorder,
      accent: c.danger,
    },
    warn: {
      fg: c.warningText,
      bg: c.warningLight,
      border: c.warningBorder,
      accent: c.warning,
    },
    info: {
      fg: c.infoText,
      bg: c.infoLight,
      border: c.infoBorder,
      accent: c.info,
    },
  } as const;
}
