import { StyleSheet, type ViewStyle } from 'react-native';
import { colors } from './theme';

/** Campos cortos: cantidad, número de mesa, comensales. */
export const FORM_FIELD_NARROW = 168;

/** Ancho mínimo uniforme para chips y botones secundarios centrados. */
export const ACTION_CHIP_MIN_WIDTH = 48;

/** Ancho mínimo para botones de texto/enlace centrados (p. ej. «Volver», sugerencias). */
export const CENTERED_TEXT_BTN_MIN_WIDTH = 220;

export type FormShellVariant = 'page' | 'centered' | 'modal' | 'modalWide';

/** Contenedor de página: ocupa todo el ancho del marco de la app. */
export function pageShellStyle(): ViewStyle {
  return { width: '100%', alignSelf: 'stretch' };
}

/** Tarjetas centradas (login) o modales con tope según pantalla. */
export function formShellStyle(
  screenWidth: number,
  contentMaxWidth: number | undefined,
  variant: FormShellVariant = 'page',
): ViewStyle {
  if (variant === 'page') {
    return pageShellStyle();
  }

  const inner = contentMaxWidth ?? screenWidth;

  if (variant === 'centered') {
    const max =
      screenWidth < 600
        ? screenWidth - 48
        : Math.min(screenWidth < 1024 ? 480 : 520, inner - 48);
    return { width: '100%', maxWidth: max, alignSelf: 'center' };
  }

  if (variant === 'modalWide') {
    const max = Math.min(580, inner - 40, screenWidth - 32);
    return { width: '100%', maxWidth: max, alignSelf: 'center' };
  }

  const max = Math.min(440, screenWidth - 32);
  return { width: '100%', maxWidth: max, alignSelf: 'center' };
}

export type FormFieldKind = 'narrow' | 'money' | 'text';

/** Limita el ancho de inputs según tipo y tamaño de pantalla. */
export function formFieldStyle(
  screenWidth: number,
  kind: FormFieldKind = 'text',
): ViewStyle {
  if (kind === 'narrow') {
    return {
      maxWidth: FORM_FIELD_NARROW,
      width: '100%',
      alignSelf: 'center',
    };
  }

  if (screenWidth < 640) {
    return { width: '100%' };
  }

  const cap = kind === 'money' ? 240 : 440;
  return {
    maxWidth: Math.min(cap, Math.round(screenWidth * 0.42)),
    width: '100%',
    alignSelf: 'center',
  };
}

export const formStyles = StyleSheet.create({
  label: {
    fontWeight: '700',
    color: colors.offline,
    fontSize: 13,
    marginBottom: 4,
    textAlign: 'center',
  },
  help: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 10,
    color: colors.text,
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  inputNarrow: {
    maxWidth: FORM_FIELD_NARROW,
    alignSelf: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
    color: colors.text,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
    width: '100%',
  },
  /** Iconos de confirmar/cancelar centrados en modales. */
  modalActionBar: {
    width: '100%',
    alignSelf: 'center',
  },
  /** Barra de acciones en pantalla, centrada. */
  screenActions: {
    alignSelf: 'center',
    width: '100%',
    marginBottom: 12,
  },
  /** Bloque de formulario centrado en tarjetas admin. */
  adminFormInner: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  /** Título de sección centrado en tarjetas de formulario. */
  sectionTitle: {
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  /** Texto introductorio centrado en pantallas admin. */
  adminIntro: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    textAlign: 'center',
  },
  pageScrollContent: {
    width: '100%',
    paddingBottom: 8,
    gap: 0,
  },
  /** Fila de chips/botones secundarios centrada con tamaño uniforme. */
  centeredChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  /** Botón de texto o enlace centrado con ancho mínimo uniforme. */
  centeredTextBtn: {
    alignSelf: 'center',
    minWidth: CENTERED_TEXT_BTN_MIN_WIDTH,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredTextBtnLabel: {
    textAlign: 'center',
    fontWeight: '800',
  },
  /** Contenedor para una acción con icono centrada bajo un bloque de contenido. */
  centeredSingleAction: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
});
