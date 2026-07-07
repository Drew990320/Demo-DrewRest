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
import { useVisualTheme } from './VisualThemeContext';
import { MOTION } from '../lib/motion';
import { appShadow } from '../lib/shadow';
import type { AppColors } from '../lib/theme';
import { statusFromAppColors } from '../lib/visual-theme';
import {
  type AppDialogOptions,
  type DialogButton,
  type DialogVariant,
  registerAppDialogHandlers,
  unregisterAppDialogHandlers,
} from '../lib/app-dialog';
import type { VisualLayoutTokens } from '@la-reserva/shared-domain/visual-style';

type DialogState = AppDialogOptions & {
  finish: () => void;
};

type DialogContextValue = {
  show: (opts: AppDialogOptions) => Promise<void>;
  confirm: (title: string, message?: string) => Promise<boolean>;
};

const DialogContext = createContext<DialogContextValue | null>(null);

function variantMeta(variant: DialogVariant, colors: AppColors) {
  const st = statusFromAppColors(colors);
  switch (variant) {
    case 'success':
      return {
        icon: 'checkmark-circle' as const,
        color: st.ok.accent,
        bg: st.ok.bg,
        border: st.ok.border,
      };
    case 'error':
      return {
        icon: 'close-circle' as const,
        color: st.busy.accent,
        bg: st.busy.bg,
        border: st.busy.border,
      };
    case 'warning':
      return {
        icon: 'warning' as const,
        color: st.warn.accent,
        bg: st.warn.bg,
        border: st.warn.border,
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

function createDialogStyles(colors: AppColors, layout: VisualLayoutTokens) {
  const cardBorder =
    layout.cardBorderWidth > 0 ? layout.cardBorderWidth : StyleSheet.hairlineWidth;

  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: `${colors.text}52`,
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
      borderRadius: layout.radiusLg,
      borderWidth: cardBorder,
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
      fontWeight: layout.titleWeight,
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
      borderRadius: layout.radiusMd,
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
      borderWidth: cardBorder,
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
}

function AppDialogOverlay({
  state,
  onClose,
}: {
  state: DialogState;
  onClose: (button?: DialogButton) => void;
}) {
  const { colors, layout } = useVisualTheme();
  const styles = useMemo(
    () => createDialogStyles(colors, layout),
    [colors, layout],
  );
  const variant = state.variant ?? 'info';
  const meta = useMemo(() => variantMeta(variant, colors), [variant, colors]);
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
                  const isPrimary =
                    btn.style === 'primary' ||
                    (!btn.style && i === buttons.length - 1);
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
