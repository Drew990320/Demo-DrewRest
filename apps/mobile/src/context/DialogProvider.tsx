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
import { colors } from '../lib/theme';

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
        color: colors.success,
        bg: colors.successLight,
        border: colors.successBorder,
      };
    case 'error':
      return {
        icon: 'close-circle' as const,
        color: colors.danger,
        bg: colors.dangerLight,
        border: colors.dangerBorder,
      };
    case 'warning':
      return {
        icon: 'warning' as const,
        color: colors.warning,
        bg: colors.warningLight,
        border: colors.warningBorder,
      };
    default:
      return {
        icon: 'information-circle' as const,
        color: colors.primary,
        bg: colors.primaryLight,
        border: colors.primaryMuted,
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
              <Ionicons name={meta.icon} size={28} color={meta.color} />
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
    backgroundColor: 'rgba(61, 54, 48, 0.32)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    ...Platform.select({
      web: { backdropFilter: 'blur(4px)' } as object,
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
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: 'center',
    width: '100%',
    ...appShadow('dialog'),
  },
  cardBrief: {
    paddingBottom: 24,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  message: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    width: '100%',
    justifyContent: 'center',
  },
  buttonsStack: {
    flexDirection: 'column',
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  btnFlex: {
    flex: 1,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnDanger: {
    backgroundColor: colors.danger,
  },
  btnCancel: {
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnDefault: {
    backgroundColor: colors.surfaceMuted,
  },
  btnText: {
    fontWeight: '700',
    fontSize: 15,
    color: colors.text,
  },
  btnTextPrimary: {
    color: colors.onPrimary,
  },
  btnTextDanger: {
    color: colors.onPrimary,
  },
  btnTextCancel: {
    color: colors.textMuted,
  },
});
