/**
 * Marca La Reserva (terracota, dorado, crema) + colores semánticos intuitivos.
 * La marca va en botones y chrome; los estados usan verde/ámbar/rojo/azul suaves.
 */
export const colors = {
  background: '#FAF6F0',
  backgroundAlt: '#F3EDE4',
  surface: '#FFFFFF',
  surfaceMuted: '#F8F3EB',

  primary: '#C47A72',
  primaryDark: '#A86158',
  primaryLight: '#F5E8E6',
  primaryMuted: '#E8CCC8',
  onPrimary: '#FFFFFF',

  secondary: '#D4A574',
  secondaryDark: '#B8895A',
  secondaryLight: '#FBF0E3',
  onSecondary: '#FFFFFF',

  cocina: '#C9925A',
  cocinaDark: '#A67544',

  text: '#3D3630',
  textMuted: '#7A7268',
  textHint: '#A39A8F',
  onDark: '#FAF6F0',

  border: '#E8DFD4',
  borderLight: '#F0E9DF',
  borderInput: '#DDD4C8',

  /** Verde — disponible, listo, confirmado */
  success: '#3D9B62',
  successDark: '#2E7D4A',
  successLight: '#E2F5E8',
  successBorder: '#5CB87A',
  successText: '#2E7D4A',

  /** Ámbar — pendiente, recuerda hacer algo */
  warning: '#D4922A',
  warningDark: '#9A6418',
  warningLight: '#FFF3DC',
  warningBorder: '#E5A82E',
  warningText: '#9A6418',

  /** Rojo — ocupado, urgente, error */
  danger: '#D64545',
  dangerDark: '#B83232',
  dangerLight: '#FDE8E8',
  dangerBorder: '#E86060',
  dangerText: '#B83232',

  /** Azul — información, ayuda a otros */
  info: '#5A8FB0',
  infoDark: '#3D5F7A',
  infoLight: '#E8F1F8',
  infoBorder: '#7BA3C4',
  infoText: '#3D5F7A',

  mesaLibre: '#2E7D4A',
  mesaLibreBg: '#E2F5E8',
  mesaLibreBorder: '#5CB87A',
  mesaOcupada: '#B83232',
  mesaOcupadaBg: '#FDE8E8',
  mesaOcupadaBorder: '#E86060',
  mesaReservada: '#9A6418',
  mesaReservadaBg: '#FFF3DC',
  mesaReservadaBorder: '#E5A82E',

  offline: '#8B7368',

  onInfoMuted: '#D4E4F7',
  onInfoSoft: '#E8F0FA',

  prioridadAlta: '#D64545',
  prioridadAltaLight: '#FDE8E8',
  prioridadAltaText: '#B83232',
  prioridadBaja: '#D4922A',
  prioridadBajaLight: '#FFF3DC',
  prioridadBajaText: '#9A6418',
} as const;

export type AppColors = typeof colors;

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
