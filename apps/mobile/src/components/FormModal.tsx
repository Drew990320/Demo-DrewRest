import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
  cardStyle?: ViewStyle;
};

export function FormModal({
  visible,
  title,
  onClose,
  children,
  scroll = false,
  cardStyle,
}: Props) {
  const r = useResponsive();
  const shell = formShellStyle(
    r.width,
    r.contentMaxWidth,
    scroll ? 'modalWide' : 'modal',
  );

  const body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.scrollInner}
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
        <View style={[formStyles.modalCard, shell, cardStyle]}>
          <Text style={formStyles.modalTitle}>{title}</Text>
          {body}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: '72%' },
  scrollInner: { paddingBottom: 4 },
});
