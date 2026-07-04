import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { formShellStyle, formStyles } from '../lib/form-layout';

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  scroll?: boolean;
  /** Contenido fijo encima del área con scroll. */
  header?: ReactNode;
  /** Contenido fijo debajo del área con scroll (p. ej. botones de acción). */
  footer?: ReactNode;
  /** Altura máxima del área con scroll (px). */
  scrollMaxHeight?: number;
  cardStyle?: ViewStyle;
};

export function FormModal({
  visible,
  title,
  onClose,
  children,
  scroll = false,
  header,
  footer,
  scrollMaxHeight,
  cardStyle,
}: Props) {
  const r = useResponsive();
  const { height: winH } = useWindowDimensions();
  const shell = formShellStyle(
    r.width,
    r.contentMaxWidth,
    scroll ? 'modalWide' : 'modal',
  );
  const cardMaxH = Math.round(winH * 0.9);
  const chromeH =
    32 + 34 + (header ? 72 : 0) + (footer ? 56 : 0);
  const bodyScrollMaxH =
    scrollMaxHeight ?? Math.max(160, cardMaxH - chromeH);

  const body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={Platform.OS === 'web'}
      style={[styles.scroll, { maxHeight: bodyScrollMaxH }]}
      contentContainerStyle={[
        styles.scrollInner,
        footer ? styles.scrollInnerWithFooter : null,
      ]}
    >
      {children}
    </ScrollView>
  ) : (
    children
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={formStyles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            formStyles.modalCard,
            shell,
            scroll ? styles.scrollCard : null,
            scroll ? { maxHeight: cardMaxH } : null,
            cardStyle,
          ]}
        >
          <Text style={formStyles.modalTitle}>{title}</Text>
          {header}
          {body}
          {footer}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrollCard: {
    overflow: 'hidden',
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollInner: { paddingBottom: 4 },
  scrollInnerWithFooter: { paddingBottom: 8 },
});
