import type { DialogVariant } from './app-dialog';

export type AppNotification = {
  id: string;
  title: string;
  message?: string;
  variant: DialogVariant;
  createdAt: string;
  read: boolean;
};

export type PushAppNotificationInput = {
  title: string;
  message?: string;
  variant?: DialogVariant;
};

type PushHandler = (input: PushAppNotificationInput) => void;

let pushHandler: PushHandler | null = null;

export function registerAppNotificationHandler(handler: PushHandler) {
  pushHandler = handler;
}

export function unregisterAppNotificationHandler() {
  pushHandler = null;
}

/** Encola un aviso no bloqueante en el centro de notificaciones (campana). */
export function pushAppNotification(input: PushAppNotificationInput): void {
  if (pushHandler) {
    pushHandler(input);
    return;
  }
}
