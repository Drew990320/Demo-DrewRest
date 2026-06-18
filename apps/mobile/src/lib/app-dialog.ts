import { Alert } from 'react-native';
import { pushAppNotification } from './app-notifications';

export type DialogVariant = 'success' | 'error' | 'warning' | 'info';

export type DialogButtonStyle = 'default' | 'cancel' | 'primary' | 'danger';

export type DialogButton = {
  text: string;
  style?: DialogButtonStyle;
  onPress?: () => void | Promise<void>;
};

export type AppDialogOptions = {
  title: string;
  message?: string;
  variant?: DialogVariant;
  buttons?: DialogButton[];
  /** Cierra solo tras este tiempo (ms). Sin botones. */
  autoDismissMs?: number;
};

type ShowHandler = (opts: AppDialogOptions) => Promise<void>;
type ConfirmHandler = (title: string, message?: string) => Promise<boolean>;

let showHandler: ShowHandler | null = null;
let confirmHandler: ConfirmHandler | null = null;

export function registerAppDialogHandlers(handlers: {
  show: ShowHandler;
  confirm: ConfirmHandler;
}) {
  showHandler = handlers.show;
  confirmHandler = handlers.confirm;
}

export function unregisterAppDialogHandlers() {
  showHandler = null;
  confirmHandler = null;
}

function fallbackAlert(title: string, message?: string, buttons?: DialogButton[]) {
  return new Promise<void>((resolve) => {
    const alertButtons =
      buttons && buttons.length > 0
        ? buttons.map((b) => ({
            text: b.text,
            style:
              b.style === 'cancel'
                ? ('cancel' as const)
                : b.style === 'danger'
                  ? ('destructive' as const)
                  : ('default' as const),
            onPress: () => {
              void Promise.resolve(b.onPress?.()).finally(resolve);
            },
          }))
        : [{ text: 'Entendido', onPress: () => resolve() }];
    Alert.alert(title, message, alertButtons, { cancelable: false });
  });
}

/** Diálogo estilizado centrado en pantalla (web y móvil). */
export function showAppDialog(opts: AppDialogOptions): Promise<void> {
  if (showHandler) {
    return showHandler(opts);
  }
  return fallbackAlert(opts.title, opts.message, opts.buttons);
}

/** Aviso simple con un botón «Entendido». */
export function showNotice(
  title: string,
  message?: string,
  variant: DialogVariant = 'info',
): Promise<void> {
  return showAppDialog({
    title,
    message,
    variant,
    buttons: [{ text: 'Entendido', style: 'primary' }],
  });
}

/** Aviso no bloqueante: se guarda en el centro de notificaciones (campana). */
export function showBriefNotice(
  title: string,
  message?: string,
  variant: DialogVariant = 'info',
  _autoDismissMs = 1500,
): Promise<void> {
  pushAppNotification({ title, message, variant });
  return Promise.resolve();
}

/** Confirmación Sí / No estilizada. */
export function confirmAppDialog(
  title: string,
  message?: string,
  _variant: DialogVariant = 'info',
): Promise<boolean> {
  if (confirmHandler) {
    return confirmHandler(title, message);
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'No', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Sí', onPress: () => resolve(true) },
    ]);
  });
}
