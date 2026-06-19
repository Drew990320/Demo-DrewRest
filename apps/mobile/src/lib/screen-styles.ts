import { StyleSheet } from 'react-native';
import { appShadow } from './shadow';
import { colors, status } from './theme';

/** Estilos de pantalla reutilizables (fondo, tarjetas, tipografía). */
export const screenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  containerPadded: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  denied: {
    textAlign: 'center',
    color: colors.textMuted,
    marginBottom: 16,
    fontSize: 16,
  },
  err: {
    color: colors.textMuted,
    textAlign: 'center',
  },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    ...appShadow('elevated'),
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    ...appShadow('elevated'),
  },
  h1: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  kicker: {
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sub: {
    color: colors.textMuted,
    lineHeight: 18,
  },
  intro: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
});

/** Banners de alerta con significado semántico consistente. */
export const alertStyles = StyleSheet.create({
  base: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderLeftWidth: 5,
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
  titleOk: { color: status.ok.fg, fontWeight: '800', fontSize: 14 },
  subOk: { marginTop: 4, color: status.ok.accent, fontSize: 13, lineHeight: 18 },
  titleWarn: { color: status.warn.fg, fontWeight: '800', fontSize: 14 },
  subWarn: { marginTop: 4, color: status.warn.fg, fontSize: 13, lineHeight: 18 },
  titleBusy: { color: status.busy.fg, fontWeight: '800', fontSize: 14 },
  subBusy: { marginTop: 4, color: status.busy.accent, fontSize: 13, lineHeight: 18 },
  titleInfo: { color: status.info.fg, fontWeight: '800', fontSize: 14 },
  subInfo: { marginTop: 4, color: status.info.accent, fontSize: 13, lineHeight: 18 },
});
