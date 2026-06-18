import { StyleSheet, type ViewStyle } from 'react-native';

/** Campos cortos: cantidad, número de mesa, comensales. */
export const FORM_FIELD_NARROW = 168;

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
    color: '#5c4033',
    fontSize: 13,
    marginBottom: 4,
    textAlign: 'center',
  },
  help: {
    color: '#6f6e67',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e2d8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 10,
    color: '#262622',
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
    backgroundColor: '#f6f4ee',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e8e4d8',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
    color: '#262622',
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
    color: '#262622',
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
    paddingBottom: 24,
  },
});
