import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  registerAppNotificationHandler,
  unregisterAppNotificationHandler,
  type AppNotification,
  type PushAppNotificationInput,
} from '../lib/app-notifications';

const MAX_NOTIFICATIONS = 80;

type NotificationCenterContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  panelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  push: (input: PushAppNotificationInput) => void;
  markAllRead: () => void;
  clearAll: () => void;
};

const NotificationCenterContext =
  createContext<NotificationCenterContextValue | null>(null);

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);

  const push = useCallback((input: PushAppNotificationInput) => {
    const item: AppNotification = {
      id: newId(),
      title: input.title,
      message: input.message,
      variant: input.variant ?? 'info',
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [item, ...prev].slice(0, MAX_NOTIFICATIONS));
  }, []);

  useEffect(() => {
    registerAppNotificationHandler(push);
    return () => unregisterAppNotificationHandler();
  }, [push]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const openPanel = useCallback(() => {
    setPanelOpen(true);
    setNotifications((prev) =>
      prev.map((n) => (n.read ? n : { ...n, read: true })),
    );
  }, []);

  const closePanel = useCallback(() => setPanelOpen(false), []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      panelOpen,
      openPanel,
      closePanel,
      push,
      markAllRead,
      clearAll,
    }),
    [
      notifications,
      unreadCount,
      panelOpen,
      openPanel,
      closePanel,
      push,
      markAllRead,
      clearAll,
    ],
  );

  return (
    <NotificationCenterContext.Provider value={value}>
      {children}
    </NotificationCenterContext.Provider>
  );
}

export function useNotificationCenter() {
  const ctx = useContext(NotificationCenterContext);
  if (!ctx) {
    throw new Error(
      'useNotificationCenter debe usarse dentro de NotificationProvider',
    );
  }
  return ctx;
}
