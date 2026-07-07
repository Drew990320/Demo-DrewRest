import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { VISUAL_LAYOUT_DEFAULTS } from '@la-reserva/shared-domain/visual-style';
import type { VisualLayoutTokens } from '@la-reserva/shared-domain/visual-style';
import { useVisualTheme } from '../context/VisualThemeContext';
import { colors, status, type AppColors } from './theme';

/** Espaciado consistente entre pantallas. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const radius = {
  sm: VISUAL_LAYOUT_DEFAULTS.radiusSm,
  md: VISUAL_LAYOUT_DEFAULTS.radiusMd,
  lg: VISUAL_LAYOUT_DEFAULTS.radiusLg,
} as const;

/** Estilos de pantalla reutilizables (fondo, tarjetas, tipografía). */
function createScreenStyles(c: AppColors, layout: VisualLayoutTokens = VISUAL_LAYOUT_DEFAULTS) {
  const cardBorder =
    layout.cardBorderWidth > 0 ? layout.cardBorderWidth : StyleSheet.hairlineWidth;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    containerPadded: {
      flex: 1,
      backgroundColor: c.background,
      padding: spacing.lg,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
      backgroundColor: c.background,
    },
    denied: {
      textAlign: 'center',
      color: c.textMuted,
      marginBottom: spacing.lg,
      fontSize: 16,
      lineHeight: 22,
    },
    err: {
      color: c.textMuted,
      textAlign: 'center',
      lineHeight: 20,
    },
    headerCard: {
      backgroundColor: c.surface,
      borderRadius: layout.radiusMd,
      padding: spacing.md,
      borderWidth: cardBorder,
      borderColor: c.border,
      marginBottom: spacing.md,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: layout.radiusMd,
      padding: spacing.md,
      borderWidth: cardBorder,
      borderColor: c.border,
      marginBottom: spacing.md,
    },
    h1: {
      fontSize: 20,
      fontWeight: layout.titleWeight,
      color: c.text,
      letterSpacing: -0.2,
    },
    kicker: {
      color: c.textMuted,
      fontWeight: '600',
      fontSize: 12,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    sub: {
      color: c.textMuted,
      lineHeight: 20,
      fontSize: 14,
    },
    intro: {
      color: c.textMuted,
      fontSize: 14,
      marginBottom: spacing.md,
      lineHeight: 20,
    },
  });
}

export const screenStyles = createScreenStyles(colors);

export function useScreenStyles() {
  const { colors: c, layout } = useVisualTheme();
  return useMemo(() => createScreenStyles(c, layout), [c, layout]);
}

export function useVisualLayout(): VisualLayoutTokens {
  const { layout } = useVisualTheme();
  return layout;
}

/** Banners de alerta con significado semántico consistente. */
export const alertStyles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 3,
  },
  ok: {
    backgroundColor: status.ok.bg,
    borderColor: status.ok.border,
    borderLeftColor: status.ok.accent,
  },
  warn: {
    backgroundColor: status.warn.bg,
    borderColor: status.warn.border,
    borderLeftColor: status.warn.accent,
  },
  busy: {
    backgroundColor: status.busy.bg,
    borderColor: status.busy.border,
    borderLeftColor: status.busy.accent,
  },
  info: {
    backgroundColor: status.info.bg,
    borderColor: status.info.border,
    borderLeftColor: status.info.accent,
  },
  titleOk: { color: status.ok.fg, fontWeight: '700', fontSize: 14 },
  subOk: { marginTop: 4, color: status.ok.accent, fontSize: 13, lineHeight: 18 },
  titleWarn: { color: status.warn.fg, fontWeight: '700', fontSize: 14 },
  subWarn: { marginTop: 4, color: status.warn.fg, fontSize: 13, lineHeight: 18 },
  titleBusy: { color: status.busy.fg, fontWeight: '700', fontSize: 14 },
  subBusy: { marginTop: 4, color: status.busy.accent, fontSize: 13, lineHeight: 18 },
  titleInfo: { color: status.info.fg, fontWeight: '700', fontSize: 14 },
  subInfo: { marginTop: 4, color: status.info.accent, fontSize: 13, lineHeight: 18 },
});
