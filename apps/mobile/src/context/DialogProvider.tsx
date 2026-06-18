import { Ionicons } from '@expo/vector-icons';
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
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { MOTION } from '../lib/motion';
import { appShadow } from '../lib/shadow';
import {
  type AppDialogOptions,
  type DialogButton,
  type DialogVariant,
  registerAppDialogHandlers,
  unregisterAppDialogHandlers,
} from '../lib/app-dialog';

type DialogState = AppDialogOptions & {
  finish: () => void;
};

type DialogContextValue = {
  show: (opts: AppDialogOptions) => Promise<void>;
  confirm: (title: string, message?: string) => Promise<boolean>;
};

const DialogContext = createContext<DialogContextValue | null>(null);

function variantMeta(variant: DialogVariant) {
  switch (variant) {
    case 'success':
      return {
        icon: 'checkmark-circle' as const,
        color: '#2f5e4f',
        bg: '#e8f5ef',
        border: '#b8dcc8',
      };
    case 'error':
      return {
        icon: 'close-circle' as const,
        color: '#9b3b3b',
        bg: '#fdeeee',
        border: '#f0c4c4',
      };
    case 'warning':
      return {
        icon: 'warning' as const,
        color: '#a26a2f',
        bg: '#fff4e6',
        border: '#f0d4a8',
      };
    default:
      return {
        icon: 'information-circle' as const,
        color: '#2f5e4f',
        bg: '#eef3f1',
        border: '#c8d9d2',
      };
  }
}

function AppDialogOverlay({
  state,
  onClose,
}: {
  state: DialogState;
  onClose: (button?: DialogButton) => void;
}) {
  const variant = state.variant ?? 'info';
  const meta = variantMeta(variant);
  const buttons =
    state.autoDismissMs != null
      ? []
      : state.buttons && state.buttons.length > 0
        ? state.buttons
        : [{ text: 'Entendido', style: 'primary' as const }];

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      accessibilityViewIsModal
      onRequestClose={() => onClose()}
    >
      <Animated.View
        entering={FadeIn.duration(MOTION.normal)}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropTap} onPress={() => onClose()} />
        <Pressable style={styles.cardWrap} onPress={() => undefined}>
          <Animated.View
            entering={ZoomIn.duration(MOTION.normal).springify().damping(20)}
            style={[
              styles.card,
              { borderColor: meta.border },
              state.autoDismissMs != null && styles.cardBrief,
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: meta.bg }]}>
              <Ionicons name={meta.icon} size={36} color={meta.color} />
            </View>
            <Text style={styles.title}>{state.title}</Text>
            {!!state.message?.trim() && (
              <Text style={styles.message}>{state.message}</Text>
            )}
            {buttons.length > 0 ? (
            <View
              style={[
                styles.buttons,
                buttons.length > 2 && styles.buttonsStack,
              ]}
            >
              {buttons.map((btn, i) => {
                const isPrimary = btn.style === 'primary' || (!btn.style && i === buttons.length - 1);
                const isDanger = btn.style === 'danger';
                const isCancel = btn.style === 'cancel';
                return (
                  <AnimatedPressable
                    key={`${btn.text}-${i}`}
                    onPress={() => onClose(btn)}
                    style={[
                      styles.btn,
                      buttons.length <= 2 && styles.btnFlex,
                      isPrimary && styles.btnPrimary,
                      isDanger && styles.btnDanger,
                      isCancel && styles.btnCancel,
                      !isPrimary && !isDanger && !isCancel && styles.btnDefault,
                    ]}
                  >
                    <Text
                      style={[
                        styles.btnText,
                        isPrimary && styles.btnTextPrimary,
                        isDanger && styles.btnTextDanger,
                        isCancel && styles.btnTextCancel,
                      ]}
                    >
                      {btn.text}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>
            ) : null}
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<DialogState[]>([]);
  const current = queue[0] ?? null;

  const show = useCallback((opts: AppDialogOptions) => {
    return new Promise<void>((resolve) => {
      setQueue((q) => [...q, { ...opts, finish: resolve }]);
    });
  }, []);

  const confirm = useCallback((title: string, message?: string) => {
    return new Promise<boolean>((resolve) => {
      let settled = false;
      const done = (value: boolean) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      setQueue((q) => [
        ...q,
        {
          title,
          message,
          variant: 'info',
          buttons: [
            { text: 'No', style: 'cancel', onPress: () => done(false) },
            { text: 'Sí', style: 'primary', onPress: () => done(true) },
          ],
          finish: () => done(false),
        },
      ]);
    });
  }, []);

  useEffect(() => {
    registerAppDialogHandlers({ show, confirm });
    return () => unregisterAppDialogHandlers();
  }, [show, confirm]);

  const onClose = useCallback(
    (button?: DialogButton) => {
      if (!current) return;
      const { finish } = current;
      setQueue((q) => q.slice(1));
      if (button?.onPress) {
        void Promise.resolve(button.onPress()).finally(finish);
      } else {
        finish();
      }
    },
    [current],
  );

  useEffect(() => {
    if (!current?.autoDismissMs) return;
    const id = setTimeout(() => onClose(), current.autoDismissMs);
    return () => clearTimeout(id);
  }, [current, onClose]);

  const value = useMemo(() => ({ show, confirm }), [show, confirm]);

  return (
    <DialogContext.Provider value={value}>
      {children}
      {current ? <AppDialogOverlay state={current} onClose={onClose} /> : null}
    </DialogContext.Provider>
  );
}

export function useAppDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error('useAppDialog debe usarse dentro de DialogProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(38, 38, 34, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    ...Platform.select({
      web: { backdropFilter: 'blur(2px)' } as object,
      default: {},
    }),
  },
  backdropTap: {
    ...StyleSheet.absoluteFillObject,
  },
  cardWrap: {
    width: '100%',
    maxWidth: 400,
    zIndex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
    width: '100%',
    ...appShadow('dialog'),
  },
  cardBrief: {
    paddingBottom: 28,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#262622',
    textAlign: 'center',
    lineHeight: 26,
  },
  message: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: '#5c5c56',
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
    width: '100%',
    justifyContent: 'center',
  },
  buttonsStack: {
    flexDirection: 'column',
  },
  btn: {
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
  },
  btnFlex: {
    flex: 1,
  },
  btnPrimary: {
    backgroundColor: '#2f5e4f',
  },
  btnDanger: {
    backgroundColor: '#9b3b3b',
  },
  btnCancel: {
    backgroundColor: '#f0ede4',
    borderWidth: 1,
    borderColor: '#dcd7c8',
  },
  btnDefault: {
    backgroundColor: '#efece2',
  },
  btnText: {
    fontWeight: '800',
    fontSize: 15,
    color: '#262622',
  },
  btnTextPrimary: {
    color: '#fff',
  },
  btnTextDanger: {
    color: '#fff',
  },
  btnTextCancel: {
    color: '#5c5c56',
  },
});
