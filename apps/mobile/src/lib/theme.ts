/**
 * Marca DrewRest (azul pastel, navy suave) + colores semánticos intuitivos.
 * La marca va en botones y chrome; los estados usan verde/ámbar/rojo/azul suaves.
 */
export const colors = {
  background: '#EDF3FA',
  backgroundAlt: '#E4ECF5',
  surface: '#FFFFFF',
  surfaceMuted: '#F9FBFD',

  primary: '#82B5D6',
  primaryDark: '#5E96B8',
  primaryLight: '#F0F6FA',
  primaryMuted: '#DCEAF4',
  primarySoft: '#DCEAF4',
  onPrimary: '#FFFFFF',

  onPrimaryMuted: '#BAD6E8',

  secondary: '#A3C9E3',
  secondaryDark: '#86A5BA',
  secondaryLight: '#F1F7FB',
  onSecondary: '#FFFFFF',

  cocina: '#97C2DE',
  cocinaDark: '#497590',

  text: '#3D4F63',
  textMuted: '#6B7D91',
  textHint: '#A6B2C0',
  onDark: '#57687A',

  border: '#CDD9E8',
  borderLight: '#E4EAF2',
  borderInput: '#B4BFCC',

  /** Verde — disponible, listo, confirmado */
  success: '#3C9A5F',
  successDark: '#2C7748',
  successLight: '#E3F2E9',
  successBorder: '#51B877',
  successText: '#2C7748',

  /** Ámbar — pendiente, recuerda hacer algo */
  warning: '#C69239',
  warningDark: '#997029',
  warningLight: '#F4EDE1',
  warningBorder: '#C79A4D',
  warningText: '#936E2F',

  /** Rojo — ocupado, urgente, error */
  danger: '#CE3B3B',
  dangerDark: '#A52727',
  dangerLight: '#F7E8E8',
  dangerBorder: '#D04E4E',
  dangerText: '#9F2D2D',

  /** Azul — información, ayuda a otros */
  info: '#4E72A6',
  infoDark: '#375581',
  infoLight: '#EBEFF4',
  infoBorder: '#6282B2',
  infoText: '#39557F',

  mesaLibre: '#2C7748',
  mesaLibreBg: '#E3F2E9',
  mesaLibreBorder: '#51B877',
  mesaOcupada: '#A52727',
  mesaOcupadaBg: '#F7E8E8',
  mesaOcupadaBorder: '#D04E4E',
  mesaReservada: '#997029',
  mesaReservadaBg: '#F4EDE1',
  mesaReservadaBorder: '#C79A4D',

  offline: '#6B7D91',

  onInfoMuted: '#95AAC9',
  onInfoSoft: '#F3F5F8',

  prioridadAlta: '#CE3B3B',
  prioridadAltaLight: '#F7E8E8',
  prioridadAltaText: '#9F2D2D',
  prioridadBaja: '#C69239',
  prioridadBajaLight: '#F4EDE1',
  prioridadBajaText: '#936E2F',
} as const;

export type AppColors = { [K in keyof typeof colors]: string };

/** Atajos para banners y tarjetas de estado */
export const status = {
  ok: {
    fg: colors.successText,
    bg: colors.successLight,
    border: colors.successBorder,
    accent: colors.success,
  },
  busy: {
    fg: colors.dangerText,
    bg: colors.dangerLight,
    border: colors.dangerBorder,
    accent: colors.danger,
  },
  warn: {
    fg: colors.warningText,
    bg: colors.warningLight,
    border: colors.warningBorder,
    accent: colors.warning,
  },
  info: {
    fg: colors.infoText,
    bg: colors.infoLight,
    border: colors.infoBorder,
    accent: colors.info,
  },
} as const;
