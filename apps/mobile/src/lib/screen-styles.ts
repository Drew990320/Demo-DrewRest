import { StyleSheet } from 'react-native';
import { appShadow } from './shadow';
import { colors, status } from './theme';

/** Espaciado y radios consistentes (estilo minimalista). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
} as const;

/** Estilos de pantalla reutilizables (fondo, tarjetas, tipografía). */
export const screenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  containerPadded: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  denied: {
    textAlign: 'center',
    color: colors.textMuted,
    marginBottom: spacing.lg,
    fontSize: 16,
    lineHeight: 22,
  },
  err: {
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  h1: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  kicker: {
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  sub: {
    color: colors.textMuted,
    lineHeight: 20,
    fontSize: 14,
  },
  intro: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
});

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
