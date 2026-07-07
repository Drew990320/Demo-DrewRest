import { useMemo } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import { useVisualTheme } from '../context/VisualThemeContext';
import { colors, type AppColors } from './theme';

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

export function createFormStyles(c: AppColors) {
  return StyleSheet.create({
    label: {
      fontWeight: '700',
      color: c.offline,
      fontSize: 13,
      marginBottom: 4,
      textAlign: 'center',
    },
    help: {
      color: c.textMuted,
      fontSize: 13,
      lineHeight: 18,
      marginBottom: 10,
      textAlign: 'center',
    },
    input: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      marginBottom: 10,
      color: c.text,
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
      backgroundColor: c.background,
      borderRadius: 12,
      padding: 16,
      width: '100%',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '900',
      marginBottom: 12,
      color: c.text,
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
    modalActionBar: {
      width: '100%',
      alignSelf: 'center',
    },
    screenActions: {
      alignSelf: 'center',
      width: '100%',
      marginBottom: 12,
    },
    adminFormInner: {
      width: '100%',
      maxWidth: 440,
      alignSelf: 'center',
    },
    sectionTitle: {
      fontWeight: '800',
      color: c.text,
      marginBottom: 8,
      textAlign: 'center',
    },
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
    centeredChipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      width: '100%',
    },
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
    centeredSingleAction: {
      width: '100%',
      alignItems: 'center',
      marginTop: 8,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    secondaryBtn: {
      alignSelf: 'center',
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 16,
      marginTop: 4,
    },
    secondaryBtnText: {
      color: c.text,
      fontWeight: '700',
      textAlign: 'center',
    },
    primaryBtn: {
      alignSelf: 'center',
      backgroundColor: c.primary,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 16,
      marginTop: 8,
    },
    primaryBtnText: {
      color: c.onPrimary,
      fontWeight: '800',
      textAlign: 'center',
    },
  });
}

export const formStyles = createFormStyles(colors);

export function useFormStyles() {
  const { colors: c } = useVisualTheme();
  return useMemo(() => createFormStyles(c), [c]);
}

/** Color de texto para TextInput (web no hereda el color del tema). */
export function textInputColor(c: AppColors): string {
  return c.text;
}

/** Placeholder legible según el tema activo. */
export function textInputPlaceholderColor(c: AppColors): string {
  return c.textHint;
}
